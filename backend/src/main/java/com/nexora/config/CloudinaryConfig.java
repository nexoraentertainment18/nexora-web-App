package com.nexora.config;

import com.cloudinary.Cloudinary;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.HashMap;
import java.util.Map;

@Configuration
public class CloudinaryConfig {

    private static final Logger LOGGER = LoggerFactory.getLogger(CloudinaryConfig.class);

    @Value("${cloudinary.cloud-name:}")
    private String cloudName;

    @Value("${cloudinary.api-key:}")
    private String apiKey;

    @Value("${cloudinary.api-secret:}")
    private String apiSecret;

    @Bean
    public Cloudinary cloudinary() {
        // Primary: use CLOUDINARY_URL env var (official format: cloudinary://api_key:api_secret@cloud_name)
        String cloudinaryUrl = System.getenv("CLOUDINARY_URL");
        if (cloudinaryUrl != null && !cloudinaryUrl.isBlank()) {
            LOGGER.info("[Cloudinary] Initializing from CLOUDINARY_URL environment variable");
            Cloudinary cloudinary = new Cloudinary(cloudinaryUrl);
            cloudinary.config.secure = true;
            LOGGER.info("[Cloudinary] Initialized successfully. cloud_name='{}'", cloudinary.config.cloudName);
            return cloudinary;
        }

        // Fallback: use individual properties
        LOGGER.info("[Cloudinary] CLOUDINARY_URL not found, using individual properties");
        LOGGER.info("[Cloudinary] Initializing with cloud_name='{}', api_key='{}', api_secret='{}'",
                cloudName,
                apiKey != null && apiKey.length() > 4 ? apiKey.substring(0, 4) + "***" : "(empty)",
                apiSecret != null && apiSecret.length() > 4 ? apiSecret.substring(0, 4) + "***" : "(empty)");

        Map<String, String> config = new HashMap<>();
        config.put("cloud_name", cloudName);
        config.put("api_key", apiKey);
        config.put("api_secret", apiSecret);
        config.put("secure", "true");
        return new Cloudinary(config);
    }
}
