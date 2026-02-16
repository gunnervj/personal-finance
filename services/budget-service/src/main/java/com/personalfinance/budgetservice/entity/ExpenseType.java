package com.personalfinance.budgetservice.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "expense_types", schema = "budget_schema",
    uniqueConstraints = @UniqueConstraint(name = "uq_expense_types_user_name",
        columnNames = {"user_email", "name"}))
public class ExpenseType {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    public UUID id;

    @Column(name = "user_email", nullable = false, length = 255)
    public String userEmail;

    @Column(name = "name", nullable = false, length = 100)
    public String name;

    @Column(name = "icon", nullable = false, length = 50)
    public String icon = "circle";

    @Column(name = "is_mandatory", nullable = false)
    public Boolean isMandatory = true;

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
