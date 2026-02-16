package com.personalfinance.userservice.service;

import com.personalfinance.userservice.dto.PreferencesRequest;
import com.personalfinance.userservice.dto.PreferencesResponse;
import com.personalfinance.userservice.entity.UserPreferences;
import com.personalfinance.userservice.repository.UserPreferencesRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

import java.util.HashMap;

@ApplicationScoped
public class UserPreferencesService {

    @Inject
    UserPreferencesRepository repository;

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
        prefs.preferences.put("currency", request.currency());
        prefs.preferences.put("emergencyFundMonths", request.emergencyFundMonths());
        prefs.preferences.put("monthlySalary", request.monthlySalary());
    }

    private PreferencesResponse toResponse(UserPreferences prefs, boolean isFirstTime) {
        return new PreferencesResponse(
            prefs.id,
            prefs.email,
            (String) prefs.preferences.getOrDefault("currency", "USD"),
            (Integer) prefs.preferences.getOrDefault("emergencyFundMonths", 3),
            ((Number) prefs.preferences.getOrDefault("monthlySalary", 0.0)).doubleValue(),
            prefs.avatarPath,
            prefs.createdAt,
            prefs.updatedAt,
            isFirstTime
        );
    }
}
