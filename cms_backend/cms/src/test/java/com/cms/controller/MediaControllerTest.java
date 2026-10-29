package com.cms.controller;

import com.cms.dto.MediaAssetResponse;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;

class MediaControllerTest {

    @TempDir
    Path uploadDirectory;

    private MediaController mediaController;

    @BeforeEach
    void setUp() {
        mediaController = new MediaController();
        ReflectionTestUtils.setField(mediaController, "uploadDirectory", uploadDirectory.toString());
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setScheme("http");
        request.setServerName("localhost");
        request.setServerPort(8080);
        RequestContextHolder.setRequestAttributes(new ServletRequestAttributes(request));
    }

    @AfterEach
    void clearRequestContext() {
        RequestContextHolder.resetRequestAttributes();
    }

    @Test
    void uploadListsAndDeletesImage() throws Exception {
        byte[] pngSignature = {(byte) 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A};
        MockMultipartFile file = new MockMultipartFile("file", "image.png", "image/png", pngSignature);

        MediaAssetResponse uploaded = mediaController.uploadFile(file).getBody();

        assertEquals("image/png", uploaded.contentType());
        assertEquals(1, mediaController.listMedia().size());
        assertEquals(uploaded.url(), "http://localhost:8080/uploads/" + uploaded.name());

        mediaController.deleteMedia(uploaded.name());

        List<MediaAssetResponse> remaining = mediaController.listMedia();
        assertEquals(0, remaining.size());
        assertFalse(Files.exists(uploadDirectory.resolve(uploaded.name())));
    }

    @Test
    void uploadRejectsNonImageContentAndOversizedFiles() {
        MockMultipartFile invalidImage = new MockMultipartFile(
                "file", "image.png", "image/png", "not a png".getBytes());
        assertThrows(ResponseStatusException.class, () -> mediaController.uploadFile(invalidImage));

        MockMultipartFile oversized = new MockMultipartFile(
                "file",
                "image.png",
                "image/png",
                new byte[10 * 1024 * 1024 + 1]);
        assertThrows(ResponseStatusException.class, () -> mediaController.uploadFile(oversized));
    }

    @Test
    void deleteRejectsInvalidMediaNames() {
        assertThrows(ResponseStatusException.class, () -> mediaController.deleteMedia("..\\secret.png"));
    }
}
