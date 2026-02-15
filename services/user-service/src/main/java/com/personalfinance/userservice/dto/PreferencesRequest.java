package com.personalfinance.userservice.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Max;

public record PreferencesRequest(
    @NotNull(message = "Currency is required")
    String currency,

    @NotNull(message = "Emergency fund months is required")
    @Min(value = 1, message = "Emergency fund months must be at least 1")
    @Max(value = 24, message = "Emergency fund months cannot exceed 24")
    Integer emergencyFundMonths,

    @NotNull(message = "Monthly salary is required")
    @Positive(message = "Monthly salary must be positive")
    Double monthlySalary
) {}
