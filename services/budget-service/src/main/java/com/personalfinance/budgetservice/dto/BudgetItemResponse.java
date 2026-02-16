package com.personalfinance.budgetservice.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public record BudgetItemResponse(
    UUID id,
    UUID budgetId,
    ExpenseTypeResponse expenseType,
    BigDecimal amount,
    Boolean isOneTime,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {}
