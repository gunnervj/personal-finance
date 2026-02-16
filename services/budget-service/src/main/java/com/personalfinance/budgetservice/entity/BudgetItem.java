package com.personalfinance.budgetservice.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "budget_items", schema = "budget_schema")
public class BudgetItem {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    public UUID id;

    @Column(name = "budget_id", nullable = false)
    public UUID budgetId;

    @Column(name = "expense_type_id", nullable = false)
    public UUID expenseTypeId;

    @Column(name = "amount", nullable = false, precision = 12, scale = 2)
    public BigDecimal amount = BigDecimal.ZERO;

    @Column(name = "is_one_time", nullable = false)
    public Boolean isOneTime = false;

    @Column(name = "applicable_month", nullable = true)
    public Integer applicableMonth;

    @Column(name = "created_at", nullable = false, updatable = false)
    public LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    public LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
