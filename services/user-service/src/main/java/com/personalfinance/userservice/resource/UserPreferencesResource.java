package com.personalfinance.userservice.resource;

import com.personalfinance.userservice.dto.PreferencesRequest;
import com.personalfinance.userservice.dto.PreferencesResponse;
import com.personalfinance.userservice.entity.UserPreferences;
import io.quarkus.security.Authenticated;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.jwt.JsonWebToken;

@Path("/api/v1/users/preferences")
@Authenticated
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class UserPreferencesResource {

    @Inject
    JsonWebToken jwt;

    @GET
    public Response getPreferences() {
        String email = extractEmail();
        UserPreferences prefs = UserPreferences.findByEmail(email);

        if (prefs == null) {
            return Response.ok(toResponse(UserPreferences.createDefault(email), true)).build();
        }

        return Response.ok(toResponse(prefs, false)).build();
    }

    @POST
    @Transactional
    public Response createOrUpdatePreferences(@Valid PreferencesRequest request) {
        String email = extractEmail();
        UserPreferences prefs = UserPreferences.findByEmail(email);

        if (prefs == null) {
            prefs = new UserPreferences();
            prefs.email = email;
        }

        updatePreferences(prefs, request);
        prefs.persist();

        return Response.ok(toResponse(prefs, false)).build();
    }

    @PUT
    @Transactional
    public Response updatePreferences(@Valid PreferencesRequest request) {
        return createOrUpdatePreferences(request);
    }

    private String extractEmail() {
        String email = jwt.getClaim("email");
        return (email != null && !email.isEmpty()) ? email : jwt.getName();
    }

    private void updatePreferences(UserPreferences prefs, PreferencesRequest request) {
        prefs.preferences.put("currency", request.currency());
        prefs.preferences.put("emergencyFundMonths", request.emergencyFundMonths());
        prefs.preferences.put("monthlySalary", request.monthlySalary());
    }

    private PreferencesResponse toResponse(UserPreferences prefs, boolean isFirstTime) {
        return new PreferencesResponse(
            prefs.id,
            prefs.email,
            (String) prefs.preferences.getOrDefault("currency", "USD"),
            (Integer) prefs.preferences.getOrDefault("emergencyFundMonths", 3),
            ((Number) prefs.preferences.getOrDefault("monthlySalary", 0.0)).doubleValue(),
            prefs.avatarPath,
            prefs.createdAt,
            prefs.updatedAt,
            isFirstTime
        );
    }
}
