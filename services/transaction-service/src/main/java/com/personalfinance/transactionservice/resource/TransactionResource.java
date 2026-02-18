package com.personalfinance.transactionservice.resource;

import com.personalfinance.transactionservice.dto.*;
import com.personalfinance.transactionservice.service.TransactionService;
import io.quarkus.security.Authenticated;
import jakarta.annotation.security.PermitAll;
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

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Path("/api/v1/transactions")
@Authenticated
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Tag(name = "Transactions", description = "Manage expense transactions")
@SecurityRequirement(name = "bearer")
public class TransactionResource {

    @Inject
    JsonWebToken jwt;

    @Inject
    TransactionService service;

    @GET
    @Operation(summary = "Get transactions", description = "Retrieve paginated transactions with optional filters")
    @APIResponse(responseCode = "200", description = "Paginated list of transactions",
        content = @Content(schema = @Schema(implementation = PagedResponse.class)))
    public Response getTransactions(
            @Parameter(description = "Start date (YYYY-MM-DD)") @QueryParam("startDate") String startDate,
            @Parameter(description = "End date (YYYY-MM-DD)") @QueryParam("endDate") String endDate,
            @Parameter(description = "Expense type ID") @QueryParam("expenseTypeId") String expenseTypeId,
            @Parameter(description = "Page number (0-indexed)") @QueryParam("page") @DefaultValue("0") int page,
            @Parameter(description = "Page size") @QueryParam("pageSize") @DefaultValue("10") int pageSize
    ) {
        LocalDate start = startDate != null ? LocalDate.parse(startDate) : null;
        LocalDate end = endDate != null ? LocalDate.parse(endDate) : null;
        UUID expenseType = expenseTypeId != null ? UUID.fromString(expenseTypeId) : null;

        PagedResponse<TransactionResponse> transactions = service.getTransactions(
            extractEmail(), start, end, expenseType, page, pageSize
        );

        return Response.ok(transactions).build();
    }

    @GET
    @Path("/{id}")
    @Operation(summary = "Get transaction by ID", description = "Retrieve a specific transaction")
    @APIResponse(responseCode = "200", description = "Transaction found",
        content = @Content(schema = @Schema(implementation = TransactionResponse.class)))
    @APIResponse(responseCode = "404", description = "Transaction not found")
    public Response getTransaction(@PathParam("id") UUID id) {
        TransactionResponse transaction = service.getTransaction(extractEmail(), id);
        return Response.ok(transaction).build();
    }

    @POST
    @Operation(summary = "Create transaction", description = "Create a new expense transaction")
    @APIResponse(responseCode = "201", description = "Transaction created",
        content = @Content(schema = @Schema(implementation = TransactionResponse.class)))
    @APIResponse(responseCode = "400", description = "Invalid request")
    public Response createTransaction(@Valid TransactionRequest request) {
        TransactionResponse transaction = service.createTransaction(extractEmail(), request);
        return Response.status(Response.Status.CREATED).entity(transaction).build();
    }

    @PUT
    @Path("/{id}")
    @Operation(summary = "Update transaction", description = "Update an existing transaction")
    @APIResponse(responseCode = "200", description = "Transaction updated",
        content = @Content(schema = @Schema(implementation = TransactionResponse.class)))
    @APIResponse(responseCode = "404", description = "Transaction not found")
    public Response updateTransaction(@PathParam("id") UUID id, @Valid TransactionRequest request) {
        TransactionResponse transaction = service.updateTransaction(extractEmail(), id, request);
        return Response.ok(transaction).build();
    }

    @DELETE
    @Path("/{id}")
    @Operation(summary = "Delete transaction", description = "Delete a transaction")
    @APIResponse(responseCode = "204", description = "Transaction deleted")
    @APIResponse(responseCode = "404", description = "Transaction not found")
    public Response deleteTransaction(@PathParam("id") UUID id) {
        service.deleteTransaction(extractEmail(), id);
        return Response.noContent().build();
    }

    @GET
    @Path("/summary/monthly")
    @Operation(summary = "Get monthly summary", description = "Get total expenses for a specific month")
    @APIResponse(responseCode = "200", description = "Monthly summary",
        content = @Content(schema = @Schema(implementation = MonthlySummaryResponse.class)))
    public Response getMonthlySummary(
            @Parameter(description = "Year") @QueryParam("year") int year,
            @Parameter(description = "Month (1-12)") @QueryParam("month") int month
    ) {
        MonthlySummaryResponse summary = service.getMonthlySummary(extractEmail(), year, month);
        return Response.ok(summary).build();
    }

    @GET
    @Path("/summary/by-type")
    @Operation(summary = "Get expense type summary", description = "Get expenses grouped by type for a month")
    @APIResponse(responseCode = "200", description = "Expense type summary",
        content = @Content(schema = @Schema(implementation = ExpenseTypeSummaryResponse.class)))
    public Response getExpenseTypeSummary(
            @Parameter(description = "Year") @QueryParam("year") int year,
            @Parameter(description = "Month (1-12)") @QueryParam("month") int month
    ) {
        List<ExpenseTypeSummaryResponse> summary = service.getExpenseTypeSummary(extractEmail(), year, month);
        return Response.ok(summary).build();
    }

    @GET
    @Path("/summary/yearly")
    @Operation(summary = "Get yearly summary", description = "Get monthly breakdown for a year")
    @APIResponse(responseCode = "200", description = "Yearly summary",
        content = @Content(schema = @Schema(implementation = YearlySummaryResponse.class)))
    public Response getYearlySummary(@Parameter(description = "Year") @QueryParam("year") int year) {
        YearlySummaryResponse summary = service.getYearlySummary(extractEmail(), year);
        return Response.ok(summary).build();
    }

    @GET
    @Path("/spent/{expenseTypeId}")
    @Operation(summary = "Get spent by expense type", description = "Get total spent for an expense type in a month")
    @APIResponse(responseCode = "200", description = "Spent amount")
    public Response getSpentByExpenseType(
            @PathParam("expenseTypeId") UUID expenseTypeId,
            @Parameter(description = "Year") @QueryParam("year") int year,
            @Parameter(description = "Month (1-12)") @QueryParam("month") int month
    ) {
        BigDecimal spent = service.getSpentByExpenseType(extractEmail(), expenseTypeId, year, month);
        return Response.ok(spent).build();
    }

    @GET
    @Path("/check-budget-item/{budgetItemId}")
    @Operation(summary = "Check budget item transactions", description = "Check if budget item has transactions (public endpoint for service-to-service calls)")
    @APIResponse(responseCode = "200", description = "Has transactions flag")
    @PermitAll
    public Response hasBudgetItemTransactions(@PathParam("budgetItemId") UUID budgetItemId) {
        boolean hasTransactions = service.hasBudgetItemTransactions(budgetItemId);
        return Response.ok(hasTransactions).build();
    }

    private String extractEmail() {
        String email = jwt.getClaim("email");
        return (email != null && !email.isEmpty()) ? email : jwt.getName();
    }
}
