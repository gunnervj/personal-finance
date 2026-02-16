package com.personalfinance.budgetservice.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record BudgetRequest(
    @NotNull(message = "Year is required")
    @Min(value = 2000, message = "Year must be at least 2000")
    @Max(value = 2100, message = "Year must not exceed 2100")
    Integer year,

    @NotNull(message = "Month is required")
    @Min(value = 1, message = "Month must be between 1 and 12")
    @Max(value = 12, message = "Month must be between 1 and 12")
    Integer month
) {}
