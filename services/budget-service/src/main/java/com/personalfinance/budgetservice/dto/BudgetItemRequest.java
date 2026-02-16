package com.personalfinance.budgetservice.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.UUID;

public record BudgetItemRequest(
    @NotNull(message = "Expense type ID is required")
    UUID expenseTypeId,

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "0.0", inclusive = true, message = "Amount must be >= 0")
    BigDecimal amount,

    @NotNull(message = "One-time flag is required")
    Boolean isOneTime
) {}
