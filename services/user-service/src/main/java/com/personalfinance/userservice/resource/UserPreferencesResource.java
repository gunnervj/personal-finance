package com.personalfinance.userservice.resource;

import com.personalfinance.userservice.dto.PreferencesRequest;
import com.personalfinance.userservice.dto.PreferencesResponse;
import com.personalfinance.userservice.service.UserPreferencesService;
import io.quarkus.security.Authenticated;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.jwt.JsonWebToken;
import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.media.Content;
import org.eclipse.microprofile.openapi.annotations.media.Schema;
import org.eclipse.microprofile.openapi.annotations.responses.APIResponse;
import org.eclipse.microprofile.openapi.annotations.security.SecurityRequirement;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

@Path("/api/v1/users/preferences")
@Authenticated
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Tag(name = "User Preferences", description = "Manage user preferences and settings")
@SecurityRequirement(name = "bearer")
public class UserPreferencesResource {

    @Inject
    JsonWebToken jwt;

    @Inject
    UserPreferencesService service;

    @GET
    @Operation(summary = "Get user preferences", description = "Retrieve preferences for the authenticated user")
    @APIResponse(responseCode = "200", description = "Preferences retrieved successfully",
        content = @Content(schema = @Schema(implementation = PreferencesResponse.class)))
    public Response getPreferences() {
        String email = extractEmail();
        PreferencesResponse response = service.getPreferences(email);
        return Response.ok(response).build();
    }

    @POST
    @Operation(summary = "Create or update preferences", description = "Create new preferences or update existing ones")
    @APIResponse(responseCode = "200", description = "Preferences saved successfully",
        content = @Content(schema = @Schema(implementation = PreferencesResponse.class)))
    @APIResponse(responseCode = "400", description = "Invalid request")
    public Response createOrUpdatePreferences(@Valid PreferencesRequest request) {
        String email = extractEmail();
        PreferencesResponse response = service.savePreferences(email, request);
        return Response.ok(response).build();
    }

    @PUT
    @Operation(summary = "Update preferences", description = "Update existing user preferences")
    @APIResponse(responseCode = "200", description = "Preferences updated successfully",
        content = @Content(schema = @Schema(implementation = PreferencesResponse.class)))
    @APIResponse(responseCode = "400", description = "Invalid request")
    public Response updatePreferences(@Valid PreferencesRequest request) {
        String email = extractEmail();
        PreferencesResponse response = service.updatePreferences(email, request);
        return Response.ok(response).build();
    }

    private String extractEmail() {
        String email = jwt.getClaim("email");
        return (email != null && !email.isEmpty()) ? email : jwt.getName();
    }
}
