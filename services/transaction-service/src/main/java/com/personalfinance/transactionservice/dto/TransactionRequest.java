package com.personalfinance.transactionservice.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record TransactionRequest(
    @NotNull(message = "Budget item ID is required")
    UUID budgetItemId,

    @NotNull(message = "Expense type ID is required")
    UUID expenseTypeId,

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "0.01", inclusive = true, message = "Amount must be greater than 0")
    BigDecimal amount,

    @Size(max = 500, message = "Description cannot exceed 500 characters")
    String description,

    @NotNull(message = "Transaction date is required")
    LocalDate transactionDate
) {}
