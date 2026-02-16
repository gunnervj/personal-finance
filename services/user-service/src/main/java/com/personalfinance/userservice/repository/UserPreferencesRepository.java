package com.personalfinance.userservice.repository;

import com.personalfinance.userservice.entity.UserPreferences;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.Optional;

@ApplicationScoped
public class UserPreferencesRepository implements PanacheRepository<UserPreferences> {

    public Optional<UserPreferences> findByEmail(String email) {
        return find("email", email).firstResultOptional();
    }

    public boolean existsByEmail(String email) {
        return count("email", email) > 0;
    }
}
