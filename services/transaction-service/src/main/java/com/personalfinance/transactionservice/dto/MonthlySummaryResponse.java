package com.personalfinance.transactionservice.dto;

import java.math.BigDecimal;

public record MonthlySummaryResponse(
    int year,
    int month,
    BigDecimal totalExpenses,
    long transactionCount
) {}
