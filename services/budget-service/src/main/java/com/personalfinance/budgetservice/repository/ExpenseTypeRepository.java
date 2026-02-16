package com.personalfinance.budgetservice.repository;

import com.personalfinance.budgetservice.entity.ExpenseType;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@ApplicationScoped
public class ExpenseTypeRepository implements PanacheRepository<ExpenseType> {

    public List<ExpenseType> findByUserEmail(String userEmail) {
        return list("userEmail", userEmail);
    }

    public Optional<ExpenseType> findByUserEmailAndName(String userEmail, String name) {
        return find("userEmail = ?1 and name = ?2", userEmail, name).firstResultOptional();
    }

    public boolean existsByUserEmailAndName(String userEmail, String name) {
        return count("userEmail = ?1 and name = ?2", userEmail, name) > 0;
    }

}
