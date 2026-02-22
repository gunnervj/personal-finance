package com.personalfinance.budgetservice.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record ExpenseTypeResponse(
    UUID id,
    String userEmail,
    String name,
    String icon,
    Boolean isMandatory,
    Boolean accumulate,
    Boolean canDelete,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {}
