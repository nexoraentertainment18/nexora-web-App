package com.nexora.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Locale;
import java.util.UUID;

@Service
public class FileStorageService {

    // Browsers load uploads from /api/v1/uploads/<filename>. Locally WebConfig serves them from
    // app.upload.dir; on AWS CloudFront serves them straight from this prefix in the S3 bucket.
    private static final String S3_KEY_PREFIX = "uploads/";

    @Value("${app.upload.dir}")
    private String uploadDir;

    @Value("${app.storage.s3-bucket:}")
    private String s3Bucket;

    private Path rootLocation;
    private S3Client s3Client;

    @PostConstruct
    public void init() {
        if (useS3()) {
            // Region and credentials come from the environment (AWS_REGION and the ECS task role)
            this.s3Client = S3Client.create();
            return;
        }

        try {
            this.rootLocation = Paths.get(uploadDir);
            Files.createDirectories(this.rootLocation);
        } catch (IOException e) {
            throw new RuntimeException("Could not initialize storage directory: " + uploadDir, e);
        }
    }

    @PreDestroy
    public void close() {
        if (s3Client != null) {
            s3Client.close();
        }
    }

    public String storeFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw new RuntimeException("Failed to store empty file.");
        }

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

        try {
            if (useS3()) {
                storeInS3(file, newFileName);
            } else {
                storeOnDisk(file, newFileName);
            }
            return newFileName;
        } catch (IOException e) {
            throw new RuntimeException("Failed to store file.", e);
        }
    }

    private void storeOnDisk(MultipartFile file, String fileName) throws IOException {
        Path destinationFile = this.rootLocation.resolve(Paths.get(fileName))
                .normalize().toAbsolutePath();

        if (!destinationFile.getParent().equals(this.rootLocation.toAbsolutePath().normalize())) {
            // This is a security check against directory traversal
            throw new RuntimeException("Cannot store file outside current directory.");
        }

        try (InputStream inputStream = file.getInputStream()) {
            Files.copy(inputStream, destinationFile, StandardCopyOption.REPLACE_EXISTING);
        }
    }

    private void storeInS3(MultipartFile file, String fileName) throws IOException {
        PutObjectRequest request = PutObjectRequest.builder()
                .bucket(s3Bucket)
                .key(S3_KEY_PREFIX + fileName)
                .contentType(contentTypeFor(fileName))
                // File names are unique and never overwritten, so they can be cached for a year
                .cacheControl("public, max-age=31536000, immutable")
                .build();

        try (InputStream inputStream = file.getInputStream()) {
            s3Client.putObject(request, RequestBody.fromInputStream(inputStream, file.getSize()));
        }
    }

    // Known image types are displayed inline; anything else is served as raw binary data, so an
    // uploaded HTML or SVG file can never run scripts on the app's domain.
    private static String contentTypeFor(String fileName) {
        String extension = fileName.substring(fileName.lastIndexOf('.') + 1).toLowerCase(Locale.ROOT);
        return switch (extension) {
            case "jpg", "jpeg" -> "image/jpeg";
            case "png" -> "image/png";
            case "gif" -> "image/gif";
            case "webp" -> "image/webp";
            case "avif" -> "image/avif";
            default -> "application/octet-stream";
        };
    }

    private boolean useS3() {
        return s3Bucket != null && !s3Bucket.isBlank();
    }
}
