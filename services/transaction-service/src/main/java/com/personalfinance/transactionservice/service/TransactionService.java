package com.personalfinance.transactionservice.service;

import com.personalfinance.transactionservice.dto.*;
import com.personalfinance.transactionservice.entity.Transaction;
import com.personalfinance.transactionservice.repository.TransactionRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.NotFoundException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@ApplicationScoped
public class TransactionService {

    @Inject
    TransactionRepository repository;

    /**
     * Get paginated list of transactions with optional filters
     */
    public PagedResponse<TransactionResponse> getTransactions(
            String userEmail,
            LocalDate startDate,
            LocalDate endDate,
            UUID expenseTypeId,
            int page,
            int pageSize) {

        List<Transaction> transactions;
        long totalCount;

        // Apply filters based on provided parameters
        if (startDate != null && endDate != null && expenseTypeId != null) {
            transactions = repository.findByUserEmailDateRangeAndExpenseType(
                userEmail, startDate, endDate, expenseTypeId, page, pageSize);
            totalCount = repository.countByUserEmailDateRangeAndExpenseType(
                userEmail, startDate, endDate, expenseTypeId);
        } else if (startDate != null && endDate != null) {
            transactions = repository.findByUserEmailAndDateRange(
                userEmail, startDate, endDate, page, pageSize);
            totalCount = repository.countByUserEmailAndDateRange(userEmail, startDate, endDate);
        } else if (expenseTypeId != null) {
            transactions = repository.findByUserEmailAndExpenseType(
                userEmail, expenseTypeId, page, pageSize);
            totalCount = repository.countByUserEmailAndExpenseType(userEmail, expenseTypeId);
        } else {
            transactions = repository.findByUserEmailPaginated(userEmail, page, pageSize);
            totalCount = repository.countByUserEmail(userEmail);
        }

        List<TransactionResponse> responses = transactions.stream()
            .map(this::toResponse)
            .toList();

        int totalPages = (int) Math.ceil((double) totalCount / pageSize);

        return new PagedResponse<>(responses, page, pageSize, totalCount, totalPages);
    }

    /**
     * Get a single transaction by ID
     */
    public TransactionResponse getTransaction(String userEmail, UUID id) {
        Transaction transaction = repository.findByUUID(id);

        if (transaction == null || !transaction.userEmail.equals(userEmail)) {
            throw new NotFoundException("Transaction not found");
        }

        return toResponse(transaction);
    }

    /**
     * Create a new transaction
     */
    @Transactional
    public TransactionResponse createTransaction(String userEmail, TransactionRequest request) {
        Transaction transaction = new Transaction();
        transaction.userEmail = userEmail;
        transaction.budgetItemId = request.budgetItemId();
        transaction.expenseTypeId = request.expenseTypeId();
        transaction.amount = request.amount();
        transaction.description = request.description();
        transaction.transactionDate = request.transactionDate();

        repository.persist(transaction);

        return toResponse(transaction);
    }

    /**
     * Update an existing transaction
     */
    @Transactional
    public TransactionResponse updateTransaction(String userEmail, UUID id, TransactionRequest request) {
        Transaction transaction = repository.findByUUID(id);

        if (transaction == null || !transaction.userEmail.equals(userEmail)) {
            throw new NotFoundException("Transaction not found");
        }

        transaction.budgetItemId = request.budgetItemId();
        transaction.expenseTypeId = request.expenseTypeId();
        transaction.amount = request.amount();
        transaction.description = request.description();
        transaction.transactionDate = request.transactionDate();

        repository.persist(transaction);

        return toResponse(transaction);
    }

    /**
     * Delete a transaction
     */
    @Transactional
    public void deleteTransaction(String userEmail, UUID id) {
        Transaction transaction = repository.findByUUID(id);

        if (transaction == null || !transaction.userEmail.equals(userEmail)) {
            throw new NotFoundException("Transaction not found");
        }

        repository.delete(transaction);
    }

    /**
     * Get monthly summary for a specific month
     */
    public MonthlySummaryResponse getMonthlySummary(String userEmail, int year, int month) {
        BigDecimal totalExpenses = repository.sumByUserEmailAndMonth(userEmail, year, month);

        LocalDate startDate = LocalDate.of(year, month, 1);
        LocalDate endDate = startDate.withDayOfMonth(startDate.lengthOfMonth());
        long count = repository.countByUserEmailAndDateRange(userEmail, startDate, endDate);

        return new MonthlySummaryResponse(year, month, totalExpenses, count);
    }

    /**
     * Get expenses grouped by expense type for a month
     */
    public List<ExpenseTypeSummaryResponse> getExpenseTypeSummary(String userEmail, int year, int month) {
        Map<UUID, BigDecimal> expenseMap = repository.sumByExpenseTypeForMonth(userEmail, year, month);

        return expenseMap.entrySet().stream()
            .map(entry -> new ExpenseTypeSummaryResponse(entry.getKey(), entry.getValue()))
            .collect(Collectors.toList());
    }

    /**
     * Get yearly summary with monthly breakdown
     */
    public YearlySummaryResponse getYearlySummary(String userEmail, int year) {
        Map<Integer, BigDecimal> monthlyTotals = repository.sumByMonthForYear(userEmail, year);

        BigDecimal yearlyTotal = monthlyTotals.values().stream()
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new YearlySummaryResponse(year, monthlyTotals, yearlyTotal);
    }

    /**
     * Calculate spent amount for a specific expense type in a month
     */
    public BigDecimal getSpentByExpenseType(String userEmail, UUID expenseTypeId, int year, int month) {
        return repository.sumByUserEmailExpenseTypeAndMonth(userEmail, expenseTypeId, year, month);
    }

    /**
     * Check if a budget item has any transactions
     */
    public boolean hasBudgetItemTransactions(UUID budgetItemId) {
        return repository.existsByBudgetItemId(budgetItemId);
    }

    private TransactionResponse toResponse(Transaction transaction) {
        return new TransactionResponse(
            transaction.id,
            transaction.userEmail,
            transaction.budgetItemId,
            transaction.expenseTypeId,
            transaction.amount,
            transaction.description,
            transaction.transactionDate,
            transaction.createdAt,
            transaction.updatedAt
        );
    }
}
