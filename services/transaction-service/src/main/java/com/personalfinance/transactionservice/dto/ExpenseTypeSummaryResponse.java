package com.personalfinance.transactionservice.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record ExpenseTypeSummaryResponse(
    UUID expenseTypeId,
    BigDecimal totalAmount
) {}
