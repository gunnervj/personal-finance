package com.personalfinance.transactionservice.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public record TransactionResponse(
    UUID id,
    String userEmail,
    UUID budgetItemId,
    UUID expenseTypeId,
    BigDecimal amount,
    String description,
    LocalDate transactionDate,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {}
