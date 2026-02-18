package com.personalfinance.budgetservice.client;

import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import org.eclipse.microprofile.rest.client.inject.RegisterRestClient;

import java.util.UUID;

@Path("/api/v1/transactions")
@RegisterRestClient(configKey = "transaction-service")
@Produces(MediaType.APPLICATION_JSON)
public interface TransactionServiceClient {

    @GET
    @Path("/check-budget-item/{budgetItemId}")
    Boolean hasBudgetItemTransactions(@PathParam("budgetItemId") UUID budgetItemId);
}
