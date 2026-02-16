package com.personalfinance.budgetservice.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "budgets", schema = "budget_schema",
    uniqueConstraints = @UniqueConstraint(name = "uq_budgets_user_year",
        columnNames = {"user_email", "year"}))
public class Budget {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    public UUID id;

    @Column(name = "user_email", nullable = false, length = 255)
    public String userEmail;

    @Column(name = "year", nullable = false)
    public Integer year;

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
