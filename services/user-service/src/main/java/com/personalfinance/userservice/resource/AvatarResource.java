package com.personalfinance.userservice.resource;

import com.personalfinance.userservice.entity.UserPreferences;
import io.quarkus.security.Authenticated;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.jwt.JsonWebToken;
import org.jboss.resteasy.reactive.multipart.FileUpload;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@jakarta.ws.rs.Path("/api/v1/users/avatar")
@Authenticated
public class AvatarResource {

    private static final String AVATAR_DIR = "/tmp/avatars";
    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

    @Inject
    JsonWebToken jwt;

    @POST
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @Produces(MediaType.APPLICATION_JSON)
    @Transactional
    public Response uploadAvatar(@org.jboss.resteasy.reactive.RestForm("file") FileUpload file) {
        if (file == null || file.size() == 0) {
            return Response.status(400).entity("No file uploaded").build();
        }

        if (file.size() > MAX_FILE_SIZE) {
            return Response.status(400).entity("File size exceeds 5MB limit").build();
        }

        String contentType = file.contentType();
        if (!isImageType(contentType)) {
            return Response.status(400).entity("Only image files are allowed").build();
        }

        String email = extractEmail();
        UserPreferences prefs = UserPreferences.findByEmail(email);

        if (prefs == null) {
            prefs = UserPreferences.createDefault(email);
        }

        try {
            String fileName = UUID.randomUUID() + getExtension(file.fileName());
            java.nio.file.Path uploadPath = Paths.get(AVATAR_DIR);
            Files.createDirectories(uploadPath);

            java.nio.file.Path filePath = uploadPath.resolve(fileName);
            Files.copy(file.uploadedFile(), filePath, StandardCopyOption.REPLACE_EXISTING);

            // Delete old avatar if exists
            if (prefs.avatarPath != null) {
                Files.deleteIfExists(Paths.get(AVATAR_DIR, prefs.avatarPath));
            }

            prefs.avatarPath = fileName;
            prefs.persist();

            return Response.ok().entity("{\"avatarUrl\":\"/api/v1/users/avatar\"}").build();
        } catch (IOException e) {
            return Response.status(500).entity("Failed to upload avatar").build();
        }
    }

    @GET
    @Produces({"image/png", "image/jpeg", "image/jpg", "image/gif"})
    public Response getAvatar() {
        String email = extractEmail();
        UserPreferences prefs = UserPreferences.findByEmail(email);

        if (prefs == null || prefs.avatarPath == null) {
            return Response.status(404).entity("Avatar not found").build();
        }

        try {
            java.nio.file.Path filePath = Paths.get(AVATAR_DIR, prefs.avatarPath);
            if (!Files.exists(filePath)) {
                return Response.status(404).entity("Avatar file not found").build();
            }

            byte[] imageData = Files.readAllBytes(filePath);
            String contentType = Files.probeContentType(filePath);

            return Response.ok(imageData)
                .type(contentType != null ? contentType : "image/png")
                .build();
        } catch (IOException e) {
            return Response.status(500).entity("Failed to read avatar").build();
        }
    }

    @DELETE
    @Transactional
    public Response deleteAvatar() {
        String email = extractEmail();
        UserPreferences prefs = UserPreferences.findByEmail(email);

        if (prefs == null || prefs.avatarPath == null) {
            return Response.status(404).entity("No avatar to delete").build();
        }

        try {
            Files.deleteIfExists(Paths.get(AVATAR_DIR, prefs.avatarPath));
            prefs.avatarPath = null;
            prefs.persist();
            return Response.noContent().build();
        } catch (IOException e) {
            return Response.status(500).entity("Failed to delete avatar").build();
        }
    }

    private String extractEmail() {
        String email = jwt.getClaim("email");
        return (email != null && !email.isEmpty()) ? email : jwt.getName();
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
