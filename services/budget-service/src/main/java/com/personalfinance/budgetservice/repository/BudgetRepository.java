package com.personalfinance.budgetservice.repository;

import com.personalfinance.budgetservice.entity.Budget;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.List;
import java.util.Optional;

@ApplicationScoped
public class BudgetRepository implements PanacheRepository<Budget> {

    public List<Budget> findByUserEmail(String userEmail) {
        return list("userEmail order by year desc, month desc", userEmail);
    }

    public List<Budget> findByUserEmailAndYear(String userEmail, Integer year) {
        return list("userEmail = ?1 and year = ?2 order by month", userEmail, year);
    }

    public Optional<Budget> findByUserEmailAndYearAndMonth(String userEmail, Integer year, Integer month) {
        return find("userEmail = ?1 and year = ?2 and month = ?3", userEmail, year, month)
            .firstResultOptional();
    }

    public boolean existsByUserEmailAndYearAndMonth(String userEmail, Integer year, Integer month) {
        return count("userEmail = ?1 and year = ?2 and month = ?3", userEmail, year, month) > 0;
    }
}
