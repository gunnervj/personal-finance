package com.personalfinance.userservice.resource;

import com.personalfinance.userservice.dto.UserInfoResponse;
import io.quarkus.security.Authenticated;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import org.eclipse.microprofile.jwt.JsonWebToken;

@Path("/api/v1/users")
@Authenticated
public class UserResource {

    @Inject
    JsonWebToken jwt;

    @GET
    @Path("/me")
    @Produces(MediaType.APPLICATION_JSON)
    public UserInfoResponse getCurrentUser() {
        String email = jwt.getClaim("email");
        if (email == null || email.isEmpty()) {
            email = jwt.getName(); // fallback to name claim
        }
        return new UserInfoResponse(
            email,
            "Authentication successful"
        );
    }
}
