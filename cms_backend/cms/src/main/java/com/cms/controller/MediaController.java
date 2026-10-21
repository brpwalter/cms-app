package com.cms.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/media")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173"})
public class MediaController {

    // Speicherpfad definieren (lokaler Ordner im Projekt-Wurzelverzeichnis)
    private static final String UPLOAD_DIR = "uploads/";

    @PostMapping("/upload")
    @PreAuthorize("hasAnyRole('ADMIN', 'EDITOR')")
    public ResponseEntity<?> uploadFile(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body("Datei ist leer.");
        }

        try {
            // Sicherstellen, dass das Upload-Verzeichnis existiert
            Path uploadPath = Paths.get(UPLOAD_DIR);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            // Eindeutigen Dateinamen generieren, um Überschreiben zu verhindern
            String fileExtension = file.getOriginalFilename().substring(file.getOriginalFilename().lastIndexOf("."));
            String uniqueFileName = UUID.randomUUID().toString() + fileExtension;

            // Datei speichern
            Path filePath = uploadPath.resolve(uniqueFileName);
            Files.copy(file.getInputStream(), filePath);

            // Rückgabe der zugänglichen URL des Bildes
            String fileUrl = "http://localhost:8080/uploads/" + uniqueFileName;
            return ResponseEntity.ok().body(java.util.Map.of("url", fileUrl));

        } catch (IOException e) {
            return ResponseEntity.status(500).body("Fehler beim Speichern der Datei: " + e.getMessage());
        }
    }
}
