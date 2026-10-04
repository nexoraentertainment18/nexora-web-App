package com.nexora.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import jakarta.annotation.PostConstruct;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Map;
import java.util.UUID;

@Service
public class FileStorageService {

    private static final Logger LOGGER = LoggerFactory.getLogger(FileStorageService.class);

    @Value("${app.upload.dir}")
    private String uploadDir;

    @Value("${cloudinary.cloud-name:}")
    private String cloudName;

    @Autowired
    private Cloudinary cloudinary;

    private Path rootLocation;

    @PostConstruct
    public void init() {
        if (useCloudinary()) {
            LOGGER.info("Cloudinary storage is configured (cloud_name={}). Files will be uploaded to Cloudinary.", cloudName);
            return;
        }

        // Fallback to local disk storage
        LOGGER.info("Cloudinary is not configured. Falling back to local disk storage at: {}", uploadDir);
        try {
            this.rootLocation = Paths.get(uploadDir);
            Files.createDirectories(this.rootLocation);
        } catch (IOException e) {
            throw new RuntimeException("Could not initialize storage directory: " + uploadDir, e);
        }
    }

    /**
     * Stores a file and returns either a Cloudinary URL (production) or a local filename (dev fallback).
     */
    public String storeFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw new RuntimeException("Failed to store empty file.");
        }

        try {
            if (useCloudinary()) {
                return storeInCloudinary(file);
            } else {
                return storeOnDisk(file);
            }
        } catch (IOException e) {
            throw new RuntimeException("Failed to store file.", e);
        }
    }

    /**
     * Deletes a file from Cloudinary by its public_id extracted from the URL.
     * For local files, this is a no-op (local cleanup can be added if needed).
     */
    public void deleteFile(String fileUrl) {
        if (fileUrl == null || fileUrl.isBlank()) return;

        if (useCloudinary() && fileUrl.contains("cloudinary.com")) {
            try {
                String publicId = extractPublicId(fileUrl);
                if (publicId != null) {
                    cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
                    LOGGER.info("Deleted file from Cloudinary: {}", publicId);
                }
            } catch (Exception e) {
                LOGGER.error("Failed to delete file from Cloudinary: {}", fileUrl, e);
            }
        }
    }

    private String storeInCloudinary(MultipartFile file) throws IOException {
        @SuppressWarnings("unchecked")
        Map<String, Object> uploadResult = cloudinary.uploader().upload(
                file.getBytes(),
                ObjectUtils.asMap(
                        "folder", "nexora",
                        "resource_type", "auto",
                        "public_id", UUID.randomUUID().toString()
                )
        );

        String secureUrl = (String) uploadResult.get("secure_url");
        LOGGER.info("File uploaded to Cloudinary: {}", secureUrl);
        return secureUrl;
    }

    private String storeOnDisk(MultipartFile file) throws IOException {
        String originalFileName = file.getOriginalFilename();
        String extension = "";
        if (originalFileName != null && originalFileName.contains(".")) {
            extension = originalFileName.substring(originalFileName.lastIndexOf("."));
        }
        // Only keep simple extensions like ".jpg" so the name can't carry path characters
        if (!extension.matches("\\.[A-Za-z0-9]{1,10}")) {
            extension = "";
        }

        // Generate non-guessable, unique filename
        String newFileName = UUID.randomUUID().toString() + extension;

        Path destinationFile = this.rootLocation.resolve(Paths.get(newFileName))
                .normalize().toAbsolutePath();

        if (!destinationFile.getParent().equals(this.rootLocation.toAbsolutePath().normalize())) {
            // This is a security check against directory traversal
            throw new RuntimeException("Cannot store file outside current directory.");
        }

        try (InputStream inputStream = file.getInputStream()) {
            Files.copy(inputStream, destinationFile, StandardCopyOption.REPLACE_EXISTING);
        }

        return newFileName;
    }

    /**
     * Extracts the Cloudinary public_id from a secure_url.
     * Example URL: https://res.cloudinary.com/nexora/image/upload/v1234567890/nexora/abc123.jpg
     * Returns: nexora/abc123
     */
    private String extractPublicId(String url) {
        try {
            // Pattern: .../upload/v{version}/{folder}/{public_id}.{ext}
            String[] parts = url.split("/upload/");
            if (parts.length < 2) return null;

            String afterUpload = parts[1];
            // Remove the version prefix (v1234567890/)
            if (afterUpload.startsWith("v")) {
                int slashIdx = afterUpload.indexOf('/');
                if (slashIdx > 0) {
                    afterUpload = afterUpload.substring(slashIdx + 1);
                }
            }
            // Remove the file extension
            int dotIdx = afterUpload.lastIndexOf('.');
            if (dotIdx > 0) {
                afterUpload = afterUpload.substring(0, dotIdx);
            }
            return afterUpload;
        } catch (Exception e) {
            LOGGER.warn("Could not extract public_id from URL: {}", url);
            return null;
        }
    }

    private boolean useCloudinary() {
        return cloudName != null && !cloudName.isBlank();
    }
}
