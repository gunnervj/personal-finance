package com.personalfinance.userservice.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record PreferencesResponse(
    UUID id,
    String email,
    String currency,
    Integer emergencyFundMonths,
    Double monthlySalary,
    Double emergencyFundSaved,
    String avatarUrl,
    LocalDateTime createdAt,
    LocalDateTime updatedAt,
    boolean isFirstTime
) {}
