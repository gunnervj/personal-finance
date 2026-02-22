package com.personalfinance.userservice.service;

import com.personalfinance.userservice.dto.PreferencesRequest;
import com.personalfinance.userservice.dto.PreferencesResponse;
import com.personalfinance.userservice.entity.UserPreferences;
import com.personalfinance.userservice.repository.UserPreferencesRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;

import java.util.HashMap;
import java.util.Map;

@ApplicationScoped
public class UserPreferencesService {

    @Inject
    UserPreferencesRepository repository;

    @Inject
    EntityManager entityManager;

    public PreferencesResponse getPreferences(String email) {
        return repository.findByEmail(email)
            .map(prefs -> toResponse(prefs, false))
            .orElseGet(() -> toResponse(createDefault(email), true));
    }

    @Transactional
    public PreferencesResponse savePreferences(String email, PreferencesRequest request) {
        UserPreferences prefs = repository.findByEmail(email)
            .orElseGet(() -> {
                UserPreferences newPrefs = new UserPreferences();
                newPrefs.email = email;
                newPrefs.preferences = new HashMap<>();
                return newPrefs;
            });

        updatePreferences(prefs, request);
        repository.persist(prefs);
        entityManager.flush();

        return toResponse(prefs, false);
    }

    @Transactional
    public PreferencesResponse updatePreferences(String email, PreferencesRequest request) {
        return savePreferences(email, request);
    }

    private UserPreferences createDefault(String email) {
        UserPreferences prefs = new UserPreferences();
        prefs.email = email;
        prefs.preferences = new HashMap<>();
        prefs.preferences.put("currency", "USD");
        prefs.preferences.put("emergencyFundMonths", 3);
        prefs.preferences.put("monthlySalary", 0.0);
        return prefs;
    }

    private void updatePreferences(UserPreferences prefs, PreferencesRequest request) {
        // Create a new HashMap to ensure Hibernate detects the change for JSONB column
        Map<String, Object> newPrefs = new HashMap<>(prefs.preferences);
        newPrefs.put("currency", request.currency());
        newPrefs.put("emergencyFundMonths", request.emergencyFundMonths());
        newPrefs.put("monthlySalary", request.monthlySalary());
        // Always update emergencyFundSaved, using 0.0 as default if null
        newPrefs.put("emergencyFundSaved", request.emergencyFundSaved() != null ? request.emergencyFundSaved() : 0.0);
        // Reassign to trigger Hibernate's dirty checking
        prefs.preferences = newPrefs;
    }

    private PreferencesResponse toResponse(UserPreferences prefs, boolean isFirstTime) {
        return new PreferencesResponse(
            prefs.id,
            prefs.email,
            (String) prefs.preferences.getOrDefault("currency", "USD"),
            (Integer) prefs.preferences.getOrDefault("emergencyFundMonths", 3),
            ((Number) prefs.preferences.getOrDefault("monthlySalary", 0.0)).doubleValue(),
            ((Number) prefs.preferences.getOrDefault("emergencyFundSaved", 0.0)).doubleValue(),
            prefs.avatarPath,
            prefs.createdAt,
            prefs.updatedAt,
            isFirstTime
        );
    }
}
