package com.personalfinance.budgetservice.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ExpenseTypeRequest(
    @NotBlank(message = "Name is required")
    @Size(max = 100, message = "Name must not exceed 100 characters")
    String name,

    @NotBlank(message = "Icon is required")
    @Size(max = 50, message = "Icon must not exceed 50 characters")
    String icon,

    @NotNull(message = "Mandatory flag is required")
    Boolean isMandatory
) {}
