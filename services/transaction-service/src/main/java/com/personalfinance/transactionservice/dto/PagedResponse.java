package com.personalfinance.transactionservice.dto;

import java.util.List;

public record PagedResponse<T>(
    List<T> content,
    int page,
    int pageSize,
    long totalElements,
    int totalPages
) {}
