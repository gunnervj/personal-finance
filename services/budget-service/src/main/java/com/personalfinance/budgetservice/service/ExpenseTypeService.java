package com.personalfinance.budgetservice.service;

import com.personalfinance.budgetservice.dto.ExpenseTypeRequest;
import com.personalfinance.budgetservice.dto.ExpenseTypeResponse;
import com.personalfinance.budgetservice.entity.ExpenseType;
import com.personalfinance.budgetservice.repository.ExpenseTypeRepository;
import com.personalfinance.budgetservice.repository.BudgetItemRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.NotFoundException;

import java.util.List;
import java.util.UUID;

@ApplicationScoped
public class ExpenseTypeService {

    @Inject
    ExpenseTypeRepository repository;

    @Inject
    BudgetItemRepository budgetItemRepository;

    public List<ExpenseTypeResponse> getExpenseTypes(String userEmail) {
        return repository.findByUserEmail(userEmail).stream()
            .map(this::toResponse)
            .toList();
    }

    public ExpenseTypeResponse getExpenseType(String userEmail, UUID id) {
        ExpenseType expenseType = repository.find("id = ?1", id).firstResultOptional()
            .filter(et -> et.userEmail.equals(userEmail))
            .orElseThrow(() -> new NotFoundException("Expense type not found"));

        return toResponse(expenseType);
    }

    @Transactional
    public ExpenseTypeResponse createExpenseType(String userEmail, ExpenseTypeRequest request) {
        // Check for duplicate name
        if (repository.existsByUserEmailAndName(userEmail, request.name())) {
            throw new BadRequestException("Expense type with this name already exists");
        }

        ExpenseType expenseType = new ExpenseType();
        expenseType.userEmail = userEmail;
        expenseType.name = request.name();
        expenseType.icon = request.icon();
        expenseType.isMandatory = request.isMandatory();
        expenseType.accumulate = request.accumulate() != null ? request.accumulate() : false;

        repository.persist(expenseType);
        return toResponse(expenseType);
    }

    @Transactional
    public ExpenseTypeResponse updateExpenseType(String userEmail, UUID id, ExpenseTypeRequest request) {
        ExpenseType expenseType = repository.find("id = ?1", id).firstResultOptional()
            .filter(et -> et.userEmail.equals(userEmail))
            .orElseThrow(() -> new NotFoundException("Expense type not found"));

        // Check for duplicate name (excluding current)
        if (!expenseType.name.equals(request.name()) &&
            repository.existsByUserEmailAndName(userEmail, request.name())) {
            throw new BadRequestException("Expense type with this name already exists");
        }

        expenseType.name = request.name();
        expenseType.icon = request.icon();
        expenseType.isMandatory = request.isMandatory();
        expenseType.accumulate = request.accumulate() != null ? request.accumulate() : false;

        repository.persist(expenseType);
        return toResponse(expenseType);
    }

    @Transactional
    public void deleteExpenseType(String userEmail, UUID id) {
        ExpenseType expenseType = repository.find("id = ?1", id).firstResultOptional()
            .filter(et -> et.userEmail.equals(userEmail))
            .orElseThrow(() -> new NotFoundException("Expense type not found"));

        // Check if used in budget items
        long count = budgetItemRepository.countByExpenseTypeId(id);
        if (count > 0) {
            throw new BadRequestException("Cannot delete expense type that is used in budget items");
        }

        repository.delete(expenseType);
    }

    private ExpenseTypeResponse toResponse(ExpenseType expenseType) {
        long usageCount = budgetItemRepository.countByExpenseTypeId(expenseType.id);
        return new ExpenseTypeResponse(
            expenseType.id,
            expenseType.userEmail,
            expenseType.name,
            expenseType.icon,
            expenseType.isMandatory,
            expenseType.accumulate != null ? expenseType.accumulate : false,
            usageCount == 0, // canDelete
            expenseType.createdAt,
            expenseType.updatedAt
        );
    }
}
