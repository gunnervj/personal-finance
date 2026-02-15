package com.personalfinance.budgetservice.resource;

import com.personalfinance.budgetservice.dto.UserInfoResponse;
import io.quarkus.security.Authenticated;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import org.eclipse.microprofile.jwt.JsonWebToken;

@Path("/api/v1/test")
@Authenticated
public class BudgetTestResource {

    @Inject
    JsonWebToken jwt;

    @GET
    @Path("/me")
    @Produces(MediaType.APPLICATION_JSON)
    public UserInfoResponse getCurrentUser() {
        String email = jwt.getClaim("email");
        if (email == null || email.isEmpty()) {
            email = jwt.getName();
        }
        return new UserInfoResponse(
            email,
            "Budget service authentication successful"
        );
    }
}
