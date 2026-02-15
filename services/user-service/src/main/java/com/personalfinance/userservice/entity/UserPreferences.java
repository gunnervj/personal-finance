package com.personalfinance.userservice.entity;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "user_preferences", schema = "user_schema")
public class UserPreferences extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    public UUID id;

    @Column(name = "email", nullable = false, unique = true, length = 255)
    public String email;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "preferences", columnDefinition = "jsonb", nullable = false)
    public Map<String, Object> preferences = new HashMap<>();

    @Column(name = "avatar_path", length = 500)
    public String avatarPath;

    @Column(name = "created_at", nullable = false, updatable = false)
    public LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    public LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (preferences == null) {
            preferences = new HashMap<>();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public static UserPreferences findByEmail(String email) {
        return find("email", email).firstResult();
    }

    public static UserPreferences createDefault(String email) {
        UserPreferences prefs = new UserPreferences();
        prefs.email = email;
        prefs.preferences = new HashMap<>();
        prefs.preferences.put("currency", "USD");
        prefs.preferences.put("emergencyFundMonths", 3);
        prefs.preferences.put("monthlySalary", 0.0);
        return prefs;
    }
}
