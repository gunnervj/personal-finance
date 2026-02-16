package com.personalfinance.budgetservice.resource;

import com.personalfinance.budgetservice.dto.BudgetItemRequest;
import com.personalfinance.budgetservice.dto.BudgetRequest;
import com.personalfinance.budgetservice.dto.BudgetResponse;
import com.personalfinance.budgetservice.service.BudgetService;
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
import org.eclipse.microprofile.openapi.annotations.parameters.Parameter;
import org.eclipse.microprofile.openapi.annotations.responses.APIResponse;
import org.eclipse.microprofile.openapi.annotations.security.SecurityRequirement;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

import java.util.List;

@Path("/api/v1/budgets")
@Authenticated
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Tag(name = "Budgets", description = "Manage yearly budgets")
@SecurityRequirement(name = "bearer")
public class BudgetResource {

    @Inject
    JsonWebToken jwt;

    @Inject
    BudgetService service;

    public record CreateBudgetRequest(
        @Valid BudgetRequest budget,
        List<@Valid BudgetItemRequest> items
    ) {}

    @GET
    @Operation(summary = "Get all budgets", description = "Retrieve all budgets for the authenticated user")
    @APIResponse(responseCode = "200", description = "List of budgets")
    public Response getBudgets() {
        List<BudgetResponse> budgets = service.getBudgets(extractEmail());
        return Response.ok(budgets).build();
    }

    @GET
    @Path("/{year}")
    @Operation(summary = "Get budget by year", description = "Retrieve budget for a specific year")
    @APIResponse(responseCode = "200", description = "Budget found",
        content = @Content(schema = @Schema(implementation = BudgetResponse.class)))
    @APIResponse(responseCode = "404", description = "Budget not found")
    public Response getBudget(@PathParam("year") Integer year) {
        BudgetResponse budget = service.getBudget(extractEmail(), year);
        return Response.ok(budget).build();
    }

    @POST
    @Operation(summary = "Create budget", description = "Create a new yearly budget with items")
    @APIResponse(responseCode = "201", description = "Budget created",
        content = @Content(schema = @Schema(implementation = BudgetResponse.class)))
    @APIResponse(responseCode = "400", description = "Invalid request or business rule violation")
    public Response createBudget(@Valid CreateBudgetRequest request) {
        BudgetResponse budget = service.createBudget(
            extractEmail(),
            request.budget(),
            request.items()
        );
        return Response.status(Response.Status.CREATED).entity(budget).build();
    }

    @PUT
    @Path("/{year}")
    @Operation(summary = "Update budget", description = "Update budget items for an existing budget")
    @APIResponse(responseCode = "200", description = "Budget updated")
    @APIResponse(responseCode = "404", description = "Budget not found")
    public Response updateBudget(
        @PathParam("year") Integer year,
        List<@Valid BudgetItemRequest> items
    ) {
        BudgetResponse budget = service.updateBudget(extractEmail(), year, items);
        return Response.ok(budget).build();
    }

    @DELETE
    @Path("/{year}")
    @Operation(summary = "Delete budget", description = "Delete a budget and all its items")
    @APIResponse(responseCode = "204", description = "Budget deleted")
    @APIResponse(responseCode = "404", description = "Budget not found")
    public Response deleteBudget(@PathParam("year") Integer year) {
        service.deleteBudget(extractEmail(), year);
        return Response.noContent().build();
    }

    @POST
    @Path("/copy")
    @Operation(summary = "Copy budget", description = "Copy a budget from one year to another")
    @APIResponse(responseCode = "201", description = "Budget copied successfully")
    @APIResponse(responseCode = "404", description = "Source budget not found")
    @APIResponse(responseCode = "400", description = "Invalid request or business rule violation")
    public Response copyBudget(
        @Parameter(description = "Source year") @QueryParam("fromYear") Integer fromYear,
        @Parameter(description = "Target year") @QueryParam("toYear") Integer toYear
    ) {
        BudgetResponse budget = service.copyBudget(extractEmail(), fromYear, toYear);
        return Response.status(Response.Status.CREATED).entity(budget).build();
    }

    private String extractEmail() {
        String email = jwt.getClaim("email");
        return (email != null && !email.isEmpty()) ? email : jwt.getName();
    }
}
