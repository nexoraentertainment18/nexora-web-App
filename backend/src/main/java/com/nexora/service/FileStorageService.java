package com.nexora.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;
import java.util.UUID;

@Service
public class FileStorageService {

    private static final Logger LOGGER = LoggerFactory.getLogger(FileStorageService.class);
    private static final String CLOUDINARY_FOLDER = "nexora";

    private final Cloudinary cloudinary;
    private final String cloudName;
    private final String apiKey;
    private final String apiSecret;

    public FileStorageService(
            Cloudinary cloudinary,
            @Value("${cloudinary.cloud-name:}") String cloudName,
            @Value("${cloudinary.api-key:}") String apiKey,
            @Value("${cloudinary.api-secret:}") String apiSecret) {
        this.cloudinary = cloudinary;
        this.cloudName = cloudName;
        this.apiKey = apiKey;
        this.apiSecret = apiSecret;
    }

    /**
     * Uploads an image to Cloudinary and returns its HTTPS URL for persistence in the database.
     */
    public String storeFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Cannot upload an empty image.");
        }
        if (!isCloudinaryConfigured()) {
            throw new IllegalStateException(
                    "Cloudinary image storage is not configured. Set CLOUDINARY_CLOUD_NAME, "
                            + "CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET before uploading.");
        }

        try {
            LOGGER.info("[Cloudinary Upload] Starting upload: file='{}', size={} bytes, contentType='{}'",
                    file.getOriginalFilename(), file.getSize(), file.getContentType());
            LOGGER.info("[Cloudinary Upload] Using cloud_name='{}', api_key='{}'",
                    cloudName,
                    apiKey != null && apiKey.length() > 4 ? apiKey.substring(0, 4) + "***" : "(empty)");

            Map<?, ?> uploadResult = cloudinary.uploader().upload(
                    file.getBytes(),
                    ObjectUtils.asMap(
                            "folder", CLOUDINARY_FOLDER,
                            "resource_type", "image",
                            "public_id", UUID.randomUUID().toString(),
                            "overwrite", false
                    )
            );

            LOGGER.info("[Cloudinary Upload] Full response: {}", uploadResult);

            Object secureUrl = uploadResult.get("secure_url");
            if (!(secureUrl instanceof String url) || !url.startsWith("https://")) {
                throw new IllegalStateException("Cloudinary did not return a valid HTTPS image URL.");
            }

            LOGGER.info("Image uploaded to Cloudinary: {}", url);
            return url;
        } catch (IOException | RuntimeException e) {
            LOGGER.error("[Cloudinary Upload] FAILED. Exception class: {}, Message: {}",
                    e.getClass().getName(), e.getMessage());
            if (e.getCause() != null) {
                LOGGER.error("[Cloudinary Upload] Root cause: {} - {}",
                        e.getCause().getClass().getName(), e.getCause().getMessage());
            }
            LOGGER.error("[Cloudinary Upload] Full stack trace:", e);
            throw new IllegalStateException(
                    "Image upload to Cloudinary failed. Check the Cloudinary credentials, connection, and account limits.",
                    e);
        }
    }

    /**
     * Deletes a file from Cloudinary by its public_id extracted from the URL.
     * Legacy local-file references are ignored.
     */
    public void deleteFile(String fileUrl) {
        if (fileUrl == null || fileUrl.isBlank() || !fileUrl.contains("cloudinary.com")) {
            return;
        }

        if (!isCloudinaryConfigured()) {
            throw new IllegalStateException("Cloudinary image storage is not configured.");
        }

        String publicId = extractPublicId(fileUrl);
        if (publicId == null) {
            throw new IllegalArgumentException("Could not extract a Cloudinary public ID from the image URL.");
        }

        try {
            cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
            LOGGER.info("Deleted image from Cloudinary: {}", publicId);
        } catch (IOException | RuntimeException e) {
            LOGGER.error("Failed to delete image from Cloudinary: {}", publicId, e);
            throw new IllegalStateException("Failed to delete image from Cloudinary.", e);
        }
    }

    private String extractPublicId(String url) {
        int uploadIndex = url.indexOf("/upload/");
        if (uploadIndex < 0) {
            return null;
        }

        String publicIdWithExtension = url.substring(uploadIndex + "/upload/".length());
        if (publicIdWithExtension.matches("v\\d+/.+")) {
            publicIdWithExtension = publicIdWithExtension.substring(publicIdWithExtension.indexOf('/') + 1);
        }

        int extensionIndex = publicIdWithExtension.lastIndexOf('.');
        return extensionIndex > 0
                ? publicIdWithExtension.substring(0, extensionIndex)
                : publicIdWithExtension;
    }

    private boolean isCloudinaryConfigured() {
        return isNotBlank(cloudName) && isNotBlank(apiKey) && isNotBlank(apiSecret);
    }

    private boolean isNotBlank(String value) {
        return value != null && !value.isBlank();
    }
}
