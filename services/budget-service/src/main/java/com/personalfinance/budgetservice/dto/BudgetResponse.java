package com.personalfinance.budgetservice.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record BudgetResponse(
    UUID id,
    String userEmail,
    Integer year,
    List<BudgetItemResponse> items,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {}
