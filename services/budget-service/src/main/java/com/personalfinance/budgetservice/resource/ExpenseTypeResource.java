package com.personalfinance.budgetservice.resource;

import com.personalfinance.budgetservice.dto.ExpenseTypeRequest;
import com.personalfinance.budgetservice.dto.ExpenseTypeResponse;
import com.personalfinance.budgetservice.service.ExpenseTypeService;
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

import java.util.List;
import java.util.UUID;

@Path("/api/v1/expense-types")
@Authenticated
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Tag(name = "Expense Types", description = "Manage expense type categories")
@SecurityRequirement(name = "bearer")
public class ExpenseTypeResource {

    @Inject
    JsonWebToken jwt;

    @Inject
    ExpenseTypeService service;

    @GET
    @Operation(summary = "Get all expense types", description = "Retrieve all expense types for the authenticated user")
    @APIResponse(responseCode = "200", description = "List of expense types")
    public Response getExpenseTypes() {
        List<ExpenseTypeResponse> expenseTypes = service.getExpenseTypes(extractEmail());
        return Response.ok(expenseTypes).build();
    }

    @GET
    @Path("/{id}")
    @Operation(summary = "Get expense type by ID", description = "Retrieve a specific expense type")
    @APIResponse(responseCode = "200", description = "Expense type found",
        content = @Content(schema = @Schema(implementation = ExpenseTypeResponse.class)))
    @APIResponse(responseCode = "404", description = "Expense type not found")
    public Response getExpenseType(@PathParam("id") UUID id) {
        ExpenseTypeResponse expenseType = service.getExpenseType(extractEmail(), id);
        return Response.ok(expenseType).build();
    }

    @POST
    @Operation(summary = "Create expense type", description = "Create a new expense type category")
    @APIResponse(responseCode = "201", description = "Expense type created",
        content = @Content(schema = @Schema(implementation = ExpenseTypeResponse.class)))
    @APIResponse(responseCode = "400", description = "Invalid request or duplicate name")
    public Response createExpenseType(@Valid ExpenseTypeRequest request) {
        ExpenseTypeResponse expenseType = service.createExpenseType(extractEmail(), request);
        return Response.status(Response.Status.CREATED).entity(expenseType).build();
    }

    @PUT
    @Path("/{id}")
    @Operation(summary = "Update expense type", description = "Update an existing expense type")
    @APIResponse(responseCode = "200", description = "Expense type updated")
    @APIResponse(responseCode = "404", description = "Expense type not found")
    @APIResponse(responseCode = "400", description = "Invalid request or duplicate name")
    public Response updateExpenseType(@PathParam("id") UUID id, @Valid ExpenseTypeRequest request) {
        ExpenseTypeResponse expenseType = service.updateExpenseType(extractEmail(), id, request);
        return Response.ok(expenseType).build();
    }

    @DELETE
    @Path("/{id}")
    @Operation(summary = "Delete expense type", description = "Delete an expense type (only if not used in budgets)")
    @APIResponse(responseCode = "204", description = "Expense type deleted")
    @APIResponse(responseCode = "404", description = "Expense type not found")
    @APIResponse(responseCode = "400", description = "Cannot delete - expense type is used in budget items")
    public Response deleteExpenseType(@PathParam("id") UUID id) {
        service.deleteExpenseType(extractEmail(), id);
        return Response.noContent().build();
    }

    private String extractEmail() {
        String email = jwt.getClaim("email");
        return (email != null && !email.isEmpty()) ? email : jwt.getName();
    }
}
