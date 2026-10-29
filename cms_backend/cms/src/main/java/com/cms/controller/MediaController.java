package com.cms.controller;

import com.cms.dto.MediaAssetResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/api/admin/media")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173", "http://localhost:5000"})
public class MediaController {

    private static final long MAX_FILE_SIZE = 10L * 1024 * 1024;
    private static final Pattern MANAGED_IMAGE_NAME =
            Pattern.compile("[0-9a-fA-F-]{36}\\.(jpg|jpeg|png|gif|webp)");
    private static final Map<String, String> IMAGE_TYPES = Map.of(
            "image/jpeg", ".jpg",
            "image/png", ".png",
            "image/gif", ".gif",
            "image/webp", ".webp"
    );

    @Value("${app.media.upload-dir:uploads}")
    private String uploadDirectory;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'EDITOR', 'EMPLOYEE')")
    public List<MediaAssetResponse> listMedia() {
        Path directory = getUploadDirectory();
        if (!Files.exists(directory)) {
            return List.of();
        }
        try (var files = Files.list(directory)) {
            return files
                    .filter(Files::isRegularFile)
                    .filter(path -> MANAGED_IMAGE_NAME.matcher(path.getFileName().toString()).matches())
                    .map(this::toMediaAsset)
                    .sorted(Comparator.comparing(MediaAssetResponse::lastModified).reversed())
                    .toList();
        } catch (IOException exception) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Die Medienbibliothek konnte nicht gelesen werden.", exception);
        }
    }

    @PostMapping("/upload")
    @PreAuthorize("hasAnyRole('ADMIN', 'EDITOR', 'EMPLOYEE')")
    public ResponseEntity<MediaAssetResponse> uploadFile(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Die Datei ist leer.");
        }
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE,
                    "Bilder dürfen höchstens 10 MB groß sein.");
        }
        String contentType = file.getContentType();
        String extension = contentType == null ? null : IMAGE_TYPES.get(contentType.toLowerCase(Locale.ROOT));
        if (extension == null) {
            throw new ResponseStatusException(HttpStatus.UNSUPPORTED_MEDIA_TYPE,
                    "Erlaubt sind JPEG-, PNG-, GIF- und WebP-Bilder.");
        }

        try {
            Path directory = getUploadDirectory();
            Files.createDirectories(directory);
            String fileName = UUID.randomUUID() + extension;
            Path destination = directory.resolve(fileName).normalize();
            byte[] content = file.getBytes();
            if (!hasValidImageSignature(content, extension)) {
                throw new ResponseStatusException(HttpStatus.UNSUPPORTED_MEDIA_TYPE,
                        "Der Dateiinhalt stimmt nicht mit einem unterstützten Bildformat überein.");
            }
            Files.write(destination, content, StandardOpenOption.CREATE_NEW, StandardOpenOption.WRITE);
            return ResponseEntity.ok(toMediaAsset(destination));
        } catch (IOException exception) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Das Bild konnte nicht gespeichert werden.", exception);
        }
    }

    @DeleteMapping("/{fileName}")
    @PreAuthorize("hasAnyRole('ADMIN', 'EDITOR')")
    public ResponseEntity<Void> deleteMedia(@PathVariable String fileName) {
        if (!MANAGED_IMAGE_NAME.matcher(fileName).matches()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ungültiger Medienname.");
        }
        Path file = getUploadDirectory().resolve(fileName).normalize();
        if (!file.getParent().equals(getUploadDirectory())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ungültiger Medienpfad.");
        }
        try {
            if (!Files.deleteIfExists(file)) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Das Medium wurde nicht gefunden.");
            }
            return ResponseEntity.noContent().build();
        } catch (IOException exception) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Das Medium konnte nicht gelöscht werden.", exception);
        }
    }

    private Path getUploadDirectory() {
        return Paths.get(uploadDirectory).toAbsolutePath().normalize();
    }

    private MediaAssetResponse toMediaAsset(Path file) {
        try {
            String fileName = file.getFileName().toString();
            String extension = fileName.substring(fileName.lastIndexOf('.') + 1).toLowerCase(Locale.ROOT);
            String contentType = switch (extension) {
                case "jpg", "jpeg" -> "image/jpeg";
                case "png" -> "image/png";
                case "gif" -> "image/gif";
                case "webp" -> "image/webp";
                default -> "application/octet-stream";
            };
            String url = ServletUriComponentsBuilder.fromCurrentContextPath()
                    .path("/uploads/")
                    .path(fileName)
                    .toUriString();
            return new MediaAssetResponse(
                    fileName,
                    url,
                    Files.size(file),
                    Files.getLastModifiedTime(file).toInstant(),
                    contentType
            );
        } catch (IOException exception) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Mediendaten konnten nicht gelesen werden.", exception);
        }
    }

    private boolean hasValidImageSignature(byte[] content, String extension) {
        return switch (extension) {
            case ".jpg" -> content.length >= 3
                    && (content[0] & 0xFF) == 0xFF
                    && (content[1] & 0xFF) == 0xD8
                    && (content[2] & 0xFF) == 0xFF;
            case ".png" -> content.length >= 8
                    && (content[0] & 0xFF) == 0x89
                    && content[1] == 0x50
                    && content[2] == 0x4E
                    && content[3] == 0x47
                    && content[4] == 0x0D
                    && content[5] == 0x0A
                    && content[6] == 0x1A
                    && content[7] == 0x0A;
            case ".gif" -> content.length >= 6
                    && content[0] == 'G' && content[1] == 'I' && content[2] == 'F'
                    && content[3] == '8' && (content[4] == '7' || content[4] == '9') && content[5] == 'a';
            case ".webp" -> content.length >= 12
                    && content[0] == 'R' && content[1] == 'I' && content[2] == 'F' && content[3] == 'F'
                    && content[8] == 'W' && content[9] == 'E' && content[10] == 'B' && content[11] == 'P';
            default -> false;
        };
    }
}
