package com.personalfinance.transactionservice.repository;

import com.personalfinance.transactionservice.entity.Transaction;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import io.quarkus.panache.common.Page;
import io.quarkus.panache.common.Sort;
import jakarta.enterprise.context.ApplicationScoped;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@ApplicationScoped
public class TransactionRepository implements PanacheRepository<Transaction> {

    /**
     * Find transaction by ID (UUID)
     */
    public Transaction findByUUID(UUID id) {
        return find("id", id).firstResult();
    }

    /**
     * Find transactions with pagination and sorting by date descending
     */
    public List<Transaction> findByUserEmailPaginated(String userEmail, int pageIndex, int pageSize) {
        return find("userEmail = ?1", Sort.by("transactionDate").descending(), userEmail)
            .page(Page.of(pageIndex, pageSize))
            .list();
    }

    /**
     * Count total transactions for a user (for pagination)
     */
    public long countByUserEmail(String userEmail) {
        return count("userEmail", userEmail);
    }

    /**
     * Find transactions by user and date range
     */
    public List<Transaction> findByUserEmailAndDateRange(String userEmail, LocalDate startDate,
                                                          LocalDate endDate, int pageIndex, int pageSize) {
        return find("userEmail = ?1 and transactionDate >= ?2 and transactionDate <= ?3",
            Sort.by("transactionDate").descending(), userEmail, startDate, endDate)
            .page(Page.of(pageIndex, pageSize))
            .list();
    }

    /**
     * Count transactions by user and date range
     */
    public long countByUserEmailAndDateRange(String userEmail, LocalDate startDate, LocalDate endDate) {
        return count("userEmail = ?1 and transactionDate >= ?2 and transactionDate <= ?3",
            userEmail, startDate, endDate);
    }

    /**
     * Find transactions by user and expense type
     */
    public List<Transaction> findByUserEmailAndExpenseType(String userEmail, UUID expenseTypeId,
                                                            int pageIndex, int pageSize) {
        return find("userEmail = ?1 and expenseTypeId = ?2",
            Sort.by("transactionDate").descending(), userEmail, expenseTypeId)
            .page(Page.of(pageIndex, pageSize))
            .list();
    }

    /**
     * Count transactions by user and expense type
     */
    public long countByUserEmailAndExpenseType(String userEmail, UUID expenseTypeId) {
        return count("userEmail = ?1 and expenseTypeId = ?2", userEmail, expenseTypeId);
    }

    /**
     * Find transactions by user, date range, and expense type
     */
    public List<Transaction> findByUserEmailDateRangeAndExpenseType(
            String userEmail, LocalDate startDate, LocalDate endDate, UUID expenseTypeId,
            int pageIndex, int pageSize) {
        return find("userEmail = ?1 and transactionDate >= ?2 and transactionDate <= ?3 and expenseTypeId = ?4",
            Sort.by("transactionDate").descending(), userEmail, startDate, endDate, expenseTypeId)
            .page(Page.of(pageIndex, pageSize))
            .list();
    }

    /**
     * Count transactions by user, date range, and expense type
     */
    public long countByUserEmailDateRangeAndExpenseType(
            String userEmail, LocalDate startDate, LocalDate endDate, UUID expenseTypeId) {
        return count("userEmail = ?1 and transactionDate >= ?2 and transactionDate <= ?3 and expenseTypeId = ?4",
            userEmail, startDate, endDate, expenseTypeId);
    }

    /**
     * Check if budget item has any transactions
     */
    public boolean existsByBudgetItemId(UUID budgetItemId) {
        return count("budgetItemId", budgetItemId) > 0;
    }

    /**
     * Calculate total expenses for a user in a month
     */
    public BigDecimal sumByUserEmailAndMonth(String userEmail, int year, int month) {
        LocalDate startDate = LocalDate.of(year, month, 1);
        LocalDate endDate = startDate.withDayOfMonth(startDate.lengthOfMonth());

        BigDecimal sum = getEntityManager()
            .createQuery("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t " +
                        "WHERE t.userEmail = :userEmail " +
                        "AND t.transactionDate >= :startDate " +
                        "AND t.transactionDate <= :endDate", BigDecimal.class)
            .setParameter("userEmail", userEmail)
            .setParameter("startDate", startDate)
            .setParameter("endDate", endDate)
            .getSingleResult();

        return sum != null ? sum : BigDecimal.ZERO;
    }

    /**
     * Calculate total expenses for a user by expense type in a month
     */
    public BigDecimal sumByUserEmailExpenseTypeAndMonth(String userEmail, UUID expenseTypeId, int year, int month) {
        LocalDate startDate = LocalDate.of(year, month, 1);
        LocalDate endDate = startDate.withDayOfMonth(startDate.lengthOfMonth());

        BigDecimal sum = getEntityManager()
            .createQuery("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t " +
                        "WHERE t.userEmail = :userEmail " +
                        "AND t.expenseTypeId = :expenseTypeId " +
                        "AND t.transactionDate >= :startDate " +
                        "AND t.transactionDate <= :endDate", BigDecimal.class)
            .setParameter("userEmail", userEmail)
            .setParameter("expenseTypeId", expenseTypeId)
            .setParameter("startDate", startDate)
            .setParameter("endDate", endDate)
            .getSingleResult();

        return sum != null ? sum : BigDecimal.ZERO;
    }

    /**
     * Get expenses grouped by expense type for a month
     */
    @SuppressWarnings("unchecked")
    public Map<UUID, BigDecimal> sumByExpenseTypeForMonth(String userEmail, int year, int month) {
        LocalDate startDate = LocalDate.of(year, month, 1);
        LocalDate endDate = startDate.withDayOfMonth(startDate.lengthOfMonth());

        List<Object[]> results = getEntityManager()
            .createQuery("SELECT t.expenseTypeId, SUM(t.amount) FROM Transaction t " +
                        "WHERE t.userEmail = :userEmail " +
                        "AND t.transactionDate >= :startDate " +
                        "AND t.transactionDate <= :endDate " +
                        "GROUP BY t.expenseTypeId")
            .setParameter("userEmail", userEmail)
            .setParameter("startDate", startDate)
            .setParameter("endDate", endDate)
            .getResultList();

        Map<UUID, BigDecimal> expenseMap = new HashMap<>();
        for (Object[] result : results) {
            expenseMap.put((UUID) result[0], (BigDecimal) result[1]);
        }

        return expenseMap;
    }

    /**
     * Get monthly totals for a year
     */
    @SuppressWarnings("unchecked")
    public Map<Integer, BigDecimal> sumByMonthForYear(String userEmail, int year) {
        LocalDate startDate = LocalDate.of(year, 1, 1);
        LocalDate endDate = LocalDate.of(year, 12, 31);

        List<Object[]> results = getEntityManager()
            .createQuery("SELECT MONTH(t.transactionDate), SUM(t.amount) FROM Transaction t " +
                        "WHERE t.userEmail = :userEmail " +
                        "AND t.transactionDate >= :startDate " +
                        "AND t.transactionDate <= :endDate " +
                        "GROUP BY MONTH(t.transactionDate) " +
                        "ORDER BY MONTH(t.transactionDate)")
            .setParameter("userEmail", userEmail)
            .setParameter("startDate", startDate)
            .setParameter("endDate", endDate)
            .getResultList();

        Map<Integer, BigDecimal> monthlyTotals = new HashMap<>();
        for (Object[] result : results) {
            monthlyTotals.put((Integer) result[0], (BigDecimal) result[1]);
        }

        return monthlyTotals;
    }
}
