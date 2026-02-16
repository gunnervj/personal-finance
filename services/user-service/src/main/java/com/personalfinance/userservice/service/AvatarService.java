package com.personalfinance.userservice.service;

import com.personalfinance.userservice.entity.UserPreferences;
import com.personalfinance.userservice.repository.UserPreferencesRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.core.Response;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.HashMap;
import java.util.UUID;

@ApplicationScoped
public class AvatarService {

    private static final String AVATAR_DIR = "/tmp/avatars";
    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

    @Inject
    UserPreferencesRepository repository;

    @Transactional
    public Response uploadAvatar(String email, Path uploadedFile, String fileName, String contentType, long fileSize)
            throws IOException {
        if (fileSize > MAX_FILE_SIZE) {
            return Response.status(400).entity("File size exceeds 5MB limit").build();
        }

        if (!isImageType(contentType)) {
            return Response.status(400).entity("Only image files are allowed").build();
        }

        UserPreferences prefs = repository.findByEmail(email)
            .orElseGet(() -> {
                UserPreferences newPrefs = new UserPreferences();
                newPrefs.email = email;
                newPrefs.preferences = new HashMap<>();
                return newPrefs;
            });

        String newFileName = UUID.randomUUID() + getExtension(fileName);
        Path uploadPath = Paths.get(AVATAR_DIR);
        Files.createDirectories(uploadPath);

        Path filePath = uploadPath.resolve(newFileName);
        Files.copy(uploadedFile, filePath, StandardCopyOption.REPLACE_EXISTING);

        // Delete old avatar if exists
        if (prefs.avatarPath != null) {
            Files.deleteIfExists(Paths.get(AVATAR_DIR, prefs.avatarPath));
        }

        prefs.avatarPath = newFileName;
        repository.persist(prefs);

        return Response.ok().entity("{\"avatarUrl\":\"/api/v1/users/avatar\"}").build();
    }

    public Response getAvatar(String email) throws IOException {
        UserPreferences prefs = repository.findByEmail(email).orElse(null);

        if (prefs == null || prefs.avatarPath == null) {
            return Response.status(404).entity("Avatar not found").build();
        }

        Path filePath = Paths.get(AVATAR_DIR, prefs.avatarPath);
        if (!Files.exists(filePath)) {
            return Response.status(404).entity("Avatar file not found").build();
        }

        byte[] imageData = Files.readAllBytes(filePath);
        String contentType = Files.probeContentType(filePath);

        return Response.ok(imageData)
            .type(contentType != null ? contentType : "image/png")
            .build();
    }

    @Transactional
    public Response deleteAvatar(String email) throws IOException {
        UserPreferences prefs = repository.findByEmail(email).orElse(null);

        if (prefs == null || prefs.avatarPath == null) {
            return Response.status(404).entity("No avatar to delete").build();
        }

        Files.deleteIfExists(Paths.get(AVATAR_DIR, prefs.avatarPath));
        prefs.avatarPath = null;
        repository.persist(prefs);

        return Response.noContent().build();
    }

    private boolean isImageType(String contentType) {
        return contentType != null &&
            (contentType.equals("image/png") ||
             contentType.equals("image/jpeg") ||
             contentType.equals("image/jpg") ||
             contentType.equals("image/gif"));
    }

    private String getExtension(String fileName) {
        int lastDot = fileName.lastIndexOf('.');
        return lastDot > 0 ? fileName.substring(lastDot) : ".png";
    }
}
