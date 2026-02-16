package com.personalfinance.budgetservice.repository;

import com.personalfinance.budgetservice.entity.BudgetItem;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.List;
import java.util.UUID;

@ApplicationScoped
public class BudgetItemRepository implements PanacheRepository<BudgetItem> {

    public List<BudgetItem> findByBudgetId(UUID budgetId) {
        return list("budgetId", budgetId);
    }

    public long countByExpenseTypeId(UUID expenseTypeId) {
        return count("expenseTypeId", expenseTypeId);
    }

    public void deleteByBudgetId(UUID budgetId) {
        delete("budgetId", budgetId);
    }
}
