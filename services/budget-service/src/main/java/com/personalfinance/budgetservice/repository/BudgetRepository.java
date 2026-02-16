package com.personalfinance.budgetservice.repository;

import com.personalfinance.budgetservice.entity.Budget;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.List;
import java.util.Optional;

@ApplicationScoped
public class BudgetRepository implements PanacheRepository<Budget> {

    public List<Budget> findByUserEmail(String userEmail) {
        return list("userEmail = ?1 order by year desc", userEmail);
    }

    public Optional<Budget> findByUserEmailAndYear(String userEmail, Integer year) {
        return find("userEmail = ?1 and year = ?2", userEmail, year)
            .firstResultOptional();
    }

    public boolean existsByUserEmailAndYear(String userEmail, Integer year) {
        return count("userEmail = ?1 and year = ?2", userEmail, year) > 0;
    }
}
