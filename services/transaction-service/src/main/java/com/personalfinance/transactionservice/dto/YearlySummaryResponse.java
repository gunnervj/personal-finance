package com.personalfinance.transactionservice.dto;

import java.math.BigDecimal;
import java.util.Map;

public record YearlySummaryResponse(
    int year,
    Map<Integer, BigDecimal> monthlyTotals,
    BigDecimal yearlyTotal
) {}
