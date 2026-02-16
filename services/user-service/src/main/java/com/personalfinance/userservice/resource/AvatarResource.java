package com.personalfinance.userservice.resource;

import com.personalfinance.userservice.service.AvatarService;
import io.quarkus.security.Authenticated;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.jwt.JsonWebToken;
import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.responses.APIResponse;
import org.eclipse.microprofile.openapi.annotations.security.SecurityRequirement;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;
import org.jboss.resteasy.reactive.multipart.FileUpload;

import java.io.IOException;

@jakarta.ws.rs.Path("/api/v1/users/avatar")
@Authenticated
@Tag(name = "Avatar", description = "Manage user avatar images")
@SecurityRequirement(name = "bearer")
public class AvatarResource {

    @Inject
    JsonWebToken jwt;

    @Inject
    AvatarService service;

    @POST
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @Produces(MediaType.APPLICATION_JSON)
    @Operation(summary = "Upload avatar", description = "Upload a new avatar image (max 5MB, images only)")
    @APIResponse(responseCode = "200", description = "Avatar uploaded successfully")
    @APIResponse(responseCode = "400", description = "Invalid file (size/type)")
    public Response uploadAvatar(@org.jboss.resteasy.reactive.RestForm("file") FileUpload file) {
        if (file == null || file.size() == 0) {
            return Response.status(400).entity("No file uploaded").build();
        }

        String email = extractEmail();

        try {
            return service.uploadAvatar(
                email,
                file.uploadedFile(),
                file.fileName(),
                file.contentType(),
                file.size()
            );
        } catch (IOException e) {
            return Response.status(500).entity("Failed to upload avatar").build();
        }
    }

    @GET
    @Produces({"image/png", "image/jpeg", "image/jpg", "image/gif"})
    @Operation(summary = "Get avatar", description = "Retrieve the user's avatar image")
    @APIResponse(responseCode = "200", description = "Avatar image")
    @APIResponse(responseCode = "404", description = "Avatar not found")
    public Response getAvatar() {
        String email = extractEmail();

        try {
            return service.getAvatar(email);
        } catch (IOException e) {
            return Response.status(500).entity("Failed to read avatar").build();
        }
    }

    @DELETE
    @Operation(summary = "Delete avatar", description = "Delete the user's avatar image")
    @APIResponse(responseCode = "204", description = "Avatar deleted successfully")
    @APIResponse(responseCode = "404", description = "No avatar to delete")
    public Response deleteAvatar() {
        String email = extractEmail();

        try {
            return service.deleteAvatar(email);
        } catch (IOException e) {
            return Response.status(500).entity("Failed to delete avatar").build();
        }
    }

    private String extractEmail() {
        String email = jwt.getClaim("email");
        return (email != null && !email.isEmpty()) ? email : jwt.getName();
    }
}
