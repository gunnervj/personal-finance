package com.personalfinance.budgetservice.service;

import com.personalfinance.budgetservice.dto.*;
import com.personalfinance.budgetservice.entity.Budget;
import com.personalfinance.budgetservice.entity.BudgetItem;
import com.personalfinance.budgetservice.entity.ExpenseType;
import com.personalfinance.budgetservice.repository.BudgetRepository;
import com.personalfinance.budgetservice.repository.BudgetItemRepository;
import com.personalfinance.budgetservice.repository.ExpenseTypeRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.NotFoundException;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@ApplicationScoped
public class BudgetService {

    @Inject
    BudgetRepository repository;

    @Inject
    BudgetItemRepository budgetItemRepository;

    @Inject
    ExpenseTypeRepository expenseTypeRepository;

    public List<BudgetResponse> getBudgets(String userEmail) {
        return repository.findByUserEmail(userEmail).stream()
            .map(this::toResponse)
            .toList();
    }

    public List<BudgetResponse> getBudgetsByYear(String userEmail, Integer year) {
        return repository.findByUserEmailAndYear(userEmail, year).stream()
            .map(this::toResponse)
            .toList();
    }

    public BudgetResponse getBudget(String userEmail, Integer year, Integer month) {
        Budget budget = repository.findByUserEmailAndYearAndMonth(userEmail, year, month)
            .orElseThrow(() -> new NotFoundException("Budget not found"));

        return toResponse(budget);
    }

    @Transactional
    public BudgetResponse createBudget(String userEmail, BudgetRequest request, List<BudgetItemRequest> items) {
        validateBudgetCreation(userEmail, request.year(), request.month());

        Budget budget = new Budget();
        budget.userEmail = userEmail;
        budget.year = request.year();
        budget.month = request.month();

        repository.persist(budget);

        // Create budget items if provided
        if (items != null && !items.isEmpty()) {
            createBudgetItems(userEmail, budget.id, items);
        }

        return toResponse(budget);
    }

    @Transactional
    public BudgetResponse updateBudget(String userEmail, Integer year, Integer month, List<BudgetItemRequest> items) {
        Budget budget = repository.findByUserEmailAndYearAndMonth(userEmail, year, month)
            .orElseThrow(() -> new NotFoundException("Budget not found"));

        // Delete existing items
        budgetItemRepository.deleteByBudgetId(budget.id);

        // Create new items
        if (items != null && !items.isEmpty()) {
            createBudgetItems(userEmail, budget.id, items);
        }

        return toResponse(budget);
    }

    @Transactional
    public void deleteBudget(String userEmail, Integer year, Integer month) {
        Budget budget = repository.findByUserEmailAndYearAndMonth(userEmail, year, month)
            .orElseThrow(() -> new NotFoundException("Budget not found"));

        // Budget items will be cascade deleted due to FK constraint
        repository.delete(budget);
    }

    @Transactional
    public BudgetResponse copyBudget(String userEmail, Integer fromYear, Integer fromMonth,
                                     Integer toYear, Integer toMonth) {
        // Validate source budget exists
        Budget sourceBudget = repository.findByUserEmailAndYearAndMonth(userEmail, fromYear, fromMonth)
            .orElseThrow(() -> new NotFoundException("Source budget not found"));

        // Validate target budget creation
        validateBudgetCreation(userEmail, toYear, toMonth);

        // Create new budget
        Budget newBudget = new Budget();
        newBudget.userEmail = userEmail;
        newBudget.year = toYear;
        newBudget.month = toMonth;
        repository.persist(newBudget);

        // Copy budget items
        List<BudgetItem> sourceItems = budgetItemRepository.findByBudgetId(sourceBudget.id);
        for (BudgetItem sourceItem : sourceItems) {
            BudgetItem newItem = new BudgetItem();
            newItem.budgetId = newBudget.id;
            newItem.expenseTypeId = sourceItem.expenseTypeId;
            newItem.amount = sourceItem.amount;
            newItem.isOneTime = sourceItem.isOneTime;
            budgetItemRepository.persist(newItem);
        }

        return toResponse(newBudget);
    }

    private void validateBudgetCreation(String userEmail, Integer year, Integer month) {
        LocalDate now = LocalDate.now();
        LocalDate budgetDate = LocalDate.of(year, month, 1);

        // Cannot create budgets for past years
        if (year < now.getYear()) {
            throw new BadRequestException("Cannot create budgets for past years");
        }

        // Cannot create future year budgets (except December → next year)
        if (year > now.getYear()) {
            if (now.getMonthValue() != 12) {
                throw new BadRequestException("Can only create next year budgets in December");
            }
            if (year > now.getYear() + 1) {
                throw new BadRequestException("Cannot create budgets more than one year ahead");
            }
        }

        // Check if budget already exists
        if (repository.existsByUserEmailAndYearAndMonth(userEmail, year, month)) {
            throw new BadRequestException("Budget for this month already exists");
        }
    }

    private void createBudgetItems(String userEmail, UUID budgetId, List<BudgetItemRequest> items) {
        // Validate all expense types exist and belong to user
        List<UUID> expenseTypeIds = items.stream()
            .map(BudgetItemRequest::expenseTypeId)
            .toList();

        List<ExpenseType> expenseTypes = expenseTypeRepository.list("id in ?1", expenseTypeIds);
        if (expenseTypes.size() != expenseTypeIds.size()) {
            throw new BadRequestException("One or more expense types not found");
        }

        // Verify all expense types belong to user
        if (expenseTypes.stream().anyMatch(et -> !et.userEmail.equals(userEmail))) {
            throw new BadRequestException("Cannot use expense types from other users");
        }

        // Create budget items
        for (BudgetItemRequest itemRequest : items) {
            BudgetItem item = new BudgetItem();
            item.budgetId = budgetId;
            item.expenseTypeId = itemRequest.expenseTypeId();
            item.amount = itemRequest.amount();
            item.isOneTime = itemRequest.isOneTime();
            budgetItemRepository.persist(item);
        }
    }

    private BudgetResponse toResponse(Budget budget) {
        List<BudgetItem> items = budgetItemRepository.findByBudgetId(budget.id);

        // Load expense types
        List<UUID> expenseTypeIds = items.stream()
            .map(item -> item.expenseTypeId)
            .toList();

        Map<UUID, ExpenseType> expenseTypeMap = expenseTypeRepository.list("id in ?1", expenseTypeIds)
            .stream()
            .collect(Collectors.toMap(et -> et.id, et -> et));

        List<BudgetItemResponse> itemResponses = items.stream()
            .map(item -> toBudgetItemResponse(item, expenseTypeMap.get(item.expenseTypeId)))
            .toList();

        return new BudgetResponse(
            budget.id,
            budget.userEmail,
            budget.year,
            budget.month,
            itemResponses,
            budget.createdAt,
            budget.updatedAt
        );
    }

    private BudgetItemResponse toBudgetItemResponse(BudgetItem item, ExpenseType expenseType) {
        ExpenseTypeResponse expenseTypeResponse = new ExpenseTypeResponse(
            expenseType.id,
            expenseType.userEmail,
            expenseType.name,
            expenseType.icon,
            expenseType.isMandatory,
            false, // canDelete not relevant here
            expenseType.createdAt,
            expenseType.updatedAt
        );

        return new BudgetItemResponse(
            item.id,
            item.budgetId,
            expenseTypeResponse,
            item.amount,
            item.isOneTime,
            item.createdAt,
            item.updatedAt
        );
    }
}
