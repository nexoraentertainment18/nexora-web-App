package com.nexora.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.Uploader;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import java.io.IOException;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class FileStorageServiceTest {

    @Test
    void uploadsToCloudinaryAndReturnsSecureUrl() throws Exception {
        Cloudinary cloudinary = mock(Cloudinary.class);
        Uploader uploader = mock(Uploader.class);
        when(cloudinary.uploader()).thenReturn(uploader);
        when(uploader.upload(any(byte[].class), anyMap()))
                .thenReturn(Map.of("secure_url", "https://res.cloudinary.com/example/image/upload/nexora/test.png"));
        FileStorageService service = new FileStorageService(cloudinary, "cloud", "key", "secret");
        MockMultipartFile file = new MockMultipartFile("image", "test.png", "image/png", new byte[]{1, 2, 3});

        String url = service.storeFile(file);

        assertEquals("https://res.cloudinary.com/example/image/upload/nexora/test.png", url);
        verify(uploader).upload(any(byte[].class), anyMap());
    }

    @Test
    void rejectsUploadWhenCloudinaryIsNotConfiguredWithoutCallingUploader() {
        Cloudinary cloudinary = mock(Cloudinary.class);
        FileStorageService service = new FileStorageService(cloudinary, "", "", "");
        MockMultipartFile file = new MockMultipartFile("image", "test.png", "image/png", new byte[]{1});

        IllegalStateException error = assertThrows(IllegalStateException.class, () -> service.storeFile(file));

        assertTrue(error.getMessage().contains("CLOUDINARY_CLOUD_NAME"));
        verify(cloudinary, never()).uploader();
    }

    @Test
    void reportsCloudinaryFailureWithoutFallingBackToLocalStorage() throws Exception {
        Cloudinary cloudinary = mock(Cloudinary.class);
        Uploader uploader = mock(Uploader.class);
        when(cloudinary.uploader()).thenReturn(uploader);
        when(uploader.upload(any(byte[].class), anyMap())).thenThrow(new IOException("Cloudinary unavailable"));
        FileStorageService service = new FileStorageService(cloudinary, "cloud", "key", "secret");
        MockMultipartFile file = new MockMultipartFile("image", "test.png", "image/png", new byte[]{1, 2, 3});

        IllegalStateException error = assertThrows(IllegalStateException.class, () -> service.storeFile(file));

        assertTrue(error.getMessage().contains("Cloudinary failed"));
        verify(uploader).upload(any(byte[].class), anyMap());
    }
}
