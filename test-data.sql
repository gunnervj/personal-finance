-- Test Data Script for Personal Finance App
-- This script creates budgets and transactions for 2025 and 2026

-- Set your user email here (replace with your actual login email)
\set user_email '''rjyothy1992@gmail.com'''

-- ============================================================================
-- 1. CREATE EXPENSE TYPES
-- ============================================================================

INSERT INTO budget_schema.expense_types (id, user_email, name, icon, is_mandatory, created_at, updated_at)
VALUES
    (gen_random_uuid(), :user_email, 'Rent', 'home', true, NOW(), NOW()),
    (gen_random_uuid(), :user_email, 'Groceries', 'shopping-cart', true, NOW(), NOW()),
    (gen_random_uuid(), :user_email, 'Transportation', 'car', true, NOW(), NOW()),
    (gen_random_uuid(), :user_email, 'Utilities', 'zap', true, NOW(), NOW()),
    (gen_random_uuid(), :user_email, 'Entertainment', 'tv', false, NOW(), NOW()),
    (gen_random_uuid(), :user_email, 'Dining Out', 'utensils', false, NOW(), NOW()),
    (gen_random_uuid(), :user_email, 'Healthcare', 'heart', true, NOW(), NOW()),
    (gen_random_uuid(), :user_email, 'Insurance', 'shield', true, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Store expense type IDs for later use
CREATE TEMP TABLE temp_expense_types AS
SELECT id, name FROM budget_schema.expense_types WHERE user_email = :user_email;

-- ============================================================================
-- 2. CREATE 2025 BUDGET
-- ============================================================================

-- Insert 2025 budget
INSERT INTO budget_schema.budgets (id, user_email, year, created_at, updated_at)
VALUES (gen_random_uuid(), :user_email, 2025, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Get the 2025 budget ID
CREATE TEMP TABLE temp_budget_2025 AS
SELECT id FROM budget_schema.budgets WHERE user_email = :user_email AND year = 2025;

-- Create budget items for 2025
INSERT INTO budget_schema.budget_items (id, budget_id, expense_type_id, amount, is_one_time, applicable_month, created_at, updated_at)
SELECT
    gen_random_uuid(),
    (SELECT id FROM temp_budget_2025),
    et.id,
    CASE et.name
        WHEN 'Rent' THEN 1500.00
        WHEN 'Groceries' THEN 400.00
        WHEN 'Transportation' THEN 200.00
        WHEN 'Utilities' THEN 150.00
        WHEN 'Entertainment' THEN 100.00
        WHEN 'Dining Out' THEN 150.00
        WHEN 'Healthcare' THEN 100.00
        WHEN 'Insurance' THEN 200.00
    END,
    false,
    NULL,
    NOW(),
    NOW()
FROM temp_expense_types et;

-- ============================================================================
-- 3. CREATE 2025 TRANSACTIONS (Spread across months)
-- ============================================================================

-- January 2025
INSERT INTO transaction_schema.transactions (id, user_email, budget_item_id, expense_type_id, amount, description, transaction_date, created_at, updated_at)
SELECT
    gen_random_uuid(),
    :user_email,
    bi.id,
    bi.expense_type_id,
    CASE et.name
        WHEN 'Rent' THEN 1500.00
        WHEN 'Groceries' THEN 380.50
        WHEN 'Transportation' THEN 180.00
        WHEN 'Utilities' THEN 145.00
        WHEN 'Entertainment' THEN 75.00
        WHEN 'Dining Out' THEN 120.00
    END,
    'January 2025 - ' || et.name,
    '2025-01-15',
    NOW(),
    NOW()
FROM budget_schema.budget_items bi
JOIN temp_expense_types et ON bi.expense_type_id = et.id
WHERE bi.budget_id = (SELECT id FROM temp_budget_2025)
AND et.name IN ('Rent', 'Groceries', 'Transportation', 'Utilities', 'Entertainment', 'Dining Out');

-- February 2025
INSERT INTO transaction_schema.transactions (id, user_email, budget_item_id, expense_type_id, amount, description, transaction_date, created_at, updated_at)
SELECT
    gen_random_uuid(),
    :user_email,
    bi.id,
    bi.expense_type_id,
    CASE et.name
        WHEN 'Rent' THEN 1500.00
        WHEN 'Groceries' THEN 420.00
        WHEN 'Transportation' THEN 190.00
        WHEN 'Utilities' THEN 160.00
        WHEN 'Healthcare' THEN 80.00
        WHEN 'Insurance' THEN 200.00
    END,
    'February 2025 - ' || et.name,
    '2025-02-15',
    NOW(),
    NOW()
FROM budget_schema.budget_items bi
JOIN temp_expense_types et ON bi.expense_type_id = et.id
WHERE bi.budget_id = (SELECT id FROM temp_budget_2025)
AND et.name IN ('Rent', 'Groceries', 'Transportation', 'Utilities', 'Healthcare', 'Insurance');

-- March 2025
INSERT INTO transaction_schema.transactions (id, user_email, budget_item_id, expense_type_id, amount, description, transaction_date, created_at, updated_at)
SELECT
    gen_random_uuid(),
    :user_email,
    bi.id,
    bi.expense_type_id,
    CASE et.name
        WHEN 'Rent' THEN 1500.00
        WHEN 'Groceries' THEN 395.00
        WHEN 'Transportation' THEN 210.00
        WHEN 'Utilities' THEN 140.00
        WHEN 'Entertainment' THEN 90.00
        WHEN 'Dining Out' THEN 160.00
    END,
    'March 2025 - ' || et.name,
    '2025-03-15',
    NOW(),
    NOW()
FROM budget_schema.budget_items bi
JOIN temp_expense_types et ON bi.expense_type_id = et.id
WHERE bi.budget_id = (SELECT id FROM temp_budget_2025)
AND et.name IN ('Rent', 'Groceries', 'Transportation', 'Utilities', 'Entertainment', 'Dining Out');

-- April through December 2025 (varied amounts)
DO $$
DECLARE
    month_num INT;
    budget_id_2025 UUID;
BEGIN
    SELECT id INTO budget_id_2025 FROM temp_budget_2025;

    FOR month_num IN 4..12 LOOP
        -- Rent (consistent)
        INSERT INTO transaction_schema.transactions (id, user_email, budget_item_id, expense_type_id, amount, description, transaction_date, created_at, updated_at)
        SELECT
            gen_random_uuid(),
            :user_email,
            bi.id,
            bi.expense_type_id,
            1500.00,
            'Month ' || month_num || ' - Rent',
            ('2025-' || LPAD(month_num::text, 2, '0') || '-15')::date,
            NOW(),
            NOW()
        FROM budget_schema.budget_items bi
        JOIN temp_expense_types et ON bi.expense_type_id = et.id
        WHERE bi.budget_id = budget_id_2025 AND et.name = 'Rent';

        -- Groceries (varied)
        INSERT INTO transaction_schema.transactions (id, user_email, budget_item_id, expense_type_id, amount, description, transaction_date, created_at, updated_at)
        SELECT
            gen_random_uuid(),
            :user_email,
            bi.id,
            bi.expense_type_id,
            350.00 + (RANDOM() * 100)::numeric(10,2),
            'Month ' || month_num || ' - Groceries',
            ('2025-' || LPAD(month_num::text, 2, '0') || '-15')::date,
            NOW(),
            NOW()
        FROM budget_schema.budget_items bi
        JOIN temp_expense_types et ON bi.expense_type_id = et.id
        WHERE bi.budget_id = budget_id_2025 AND et.name = 'Groceries';

        -- Transportation (varied)
        INSERT INTO transaction_schema.transactions (id, user_email, budget_item_id, expense_type_id, amount, description, transaction_date, created_at, updated_at)
        SELECT
            gen_random_uuid(),
            :user_email,
            bi.id,
            bi.expense_type_id,
            150.00 + (RANDOM() * 80)::numeric(10,2),
            'Month ' || month_num || ' - Transportation',
            ('2025-' || LPAD(month_num::text, 2, '0') || '-15')::date,
            NOW(),
            NOW()
        FROM budget_schema.budget_items bi
        JOIN temp_expense_types et ON bi.expense_type_id = et.id
        WHERE bi.budget_id = budget_id_2025 AND et.name = 'Transportation';

        -- Utilities (varied by season)
        INSERT INTO transaction_schema.transactions (id, user_email, budget_item_id, expense_type_id, amount, description, transaction_date, created_at, updated_at)
        SELECT
            gen_random_uuid(),
            :user_email,
            bi.id,
            bi.expense_type_id,
            CASE
                WHEN month_num IN (6,7,8) THEN 180.00 + (RANDOM() * 20)::numeric(10,2) -- Summer (AC)
                WHEN month_num IN (12,1,2) THEN 175.00 + (RANDOM() * 25)::numeric(10,2) -- Winter (Heat)
                ELSE 130.00 + (RANDOM() * 30)::numeric(10,2) -- Spring/Fall
            END,
            'Month ' || month_num || ' - Utilities',
            ('2025-' || LPAD(month_num::text, 2, '0') || '-15')::date,
            NOW(),
            NOW()
        FROM budget_schema.budget_items bi
        JOIN temp_expense_types et ON bi.expense_type_id = et.id
        WHERE bi.budget_id = budget_id_2025 AND et.name = 'Utilities';
    END LOOP;
END $$;

-- ============================================================================
-- 4. CREATE 2026 BUDGET
-- ============================================================================

-- Insert 2026 budget
INSERT INTO budget_schema.budgets (id, user_email, year, created_at, updated_at)
VALUES (gen_random_uuid(), :user_email, 2026, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Get the 2026 budget ID
CREATE TEMP TABLE temp_budget_2026 AS
SELECT id FROM budget_schema.budgets WHERE user_email = :user_email AND year = 2026;

-- Create budget items for 2026 (slightly increased from 2025)
INSERT INTO budget_schema.budget_items (id, budget_id, expense_type_id, amount, is_one_time, applicable_month, created_at, updated_at)
SELECT
    gen_random_uuid(),
    (SELECT id FROM temp_budget_2026),
    et.id,
    CASE et.name
        WHEN 'Rent' THEN 1550.00  -- Increased
        WHEN 'Groceries' THEN 450.00  -- Increased
        WHEN 'Transportation' THEN 220.00  -- Increased
        WHEN 'Utilities' THEN 160.00
        WHEN 'Entertainment' THEN 120.00
        WHEN 'Dining Out' THEN 180.00
        WHEN 'Healthcare' THEN 120.00
        WHEN 'Insurance' THEN 210.00  -- Increased
    END,
    false,
    NULL,
    NOW(),
    NOW()
FROM temp_expense_types et;

-- ============================================================================
-- 5. CREATE 2026 TRANSACTIONS (January and February)
-- ============================================================================

-- January 2026
INSERT INTO transaction_schema.transactions (id, user_email, budget_item_id, expense_type_id, amount, description, transaction_date, created_at, updated_at)
SELECT
    gen_random_uuid(),
    :user_email,
    bi.id,
    bi.expense_type_id,
    CASE et.name
        WHEN 'Rent' THEN 1550.00
        WHEN 'Groceries' THEN 425.00
        WHEN 'Transportation' THEN 195.00
        WHEN 'Utilities' THEN 170.00
        WHEN 'Entertainment' THEN 85.00
        WHEN 'Dining Out' THEN 145.00
    END,
    'January 2026 - ' || et.name,
    '2026-01-15',
    NOW(),
    NOW()
FROM budget_schema.budget_items bi
JOIN temp_expense_types et ON bi.expense_type_id = et.id
WHERE bi.budget_id = (SELECT id FROM temp_budget_2026)
AND et.name IN ('Rent', 'Groceries', 'Transportation', 'Utilities', 'Entertainment', 'Dining Out');

-- February 2026 (current month)
INSERT INTO transaction_schema.transactions (id, user_email, budget_item_id, expense_type_id, amount, description, transaction_date, created_at, updated_at)
SELECT
    gen_random_uuid(),
    :user_email,
    bi.id,
    bi.expense_type_id,
    CASE et.name
        WHEN 'Rent' THEN 1550.00
        WHEN 'Groceries' THEN 380.50
        WHEN 'Transportation' THEN 205.00
        WHEN 'Utilities' THEN 155.00
        WHEN 'Healthcare' THEN 95.00
    END,
    'February 2026 - ' || et.name,
    '2026-02-10',
    NOW(),
    NOW()
FROM budget_schema.budget_items bi
JOIN temp_expense_types et ON bi.expense_type_id = et.id
WHERE bi.budget_id = (SELECT id FROM temp_budget_2026)
AND et.name IN ('Rent', 'Groceries', 'Transportation', 'Utilities', 'Healthcare');

-- Add a few recent transactions for February 2026
INSERT INTO transaction_schema.transactions (id, user_email, budget_item_id, expense_type_id, amount, description, transaction_date, created_at, updated_at)
SELECT
    gen_random_uuid(),
    :user_email,
    bi.id,
    bi.expense_type_id,
    67.89,
    'Coffee shop and groceries',
    '2026-02-16',
    NOW(),
    NOW()
FROM budget_schema.budget_items bi
JOIN temp_expense_types et ON bi.expense_type_id = et.id
WHERE bi.budget_id = (SELECT id FROM temp_budget_2026) AND et.name = 'Groceries'
LIMIT 1;

INSERT INTO transaction_schema.transactions (id, user_email, budget_item_id, expense_type_id, amount, description, transaction_date, created_at, updated_at)
SELECT
    gen_random_uuid(),
    :user_email,
    bi.id,
    bi.expense_type_id,
    125.00,
    'Concert tickets',
    '2026-02-15',
    NOW(),
    NOW()
FROM budget_schema.budget_items bi
JOIN temp_expense_types et ON bi.expense_type_id = et.id
WHERE bi.budget_id = (SELECT id FROM temp_budget_2026) AND et.name = 'Entertainment'
LIMIT 1;

INSERT INTO transaction_schema.transactions (id, user_email, budget_item_id, expense_type_id, amount, description, transaction_date, created_at, updated_at)
SELECT
    gen_random_uuid(),
    :user_email,
    bi.id,
    bi.expense_type_id,
    45.50,
    'Dinner at Italian restaurant',
    '2026-02-14',
    NOW(),
    NOW()
FROM budget_schema.budget_items bi
JOIN temp_expense_types et ON bi.expense_type_id = et.id
WHERE bi.budget_id = (SELECT id FROM temp_budget_2026) AND et.name = 'Dining Out'
LIMIT 1;

-- ============================================================================
-- SUMMARY
-- ============================================================================

SELECT
    '✅ Test data created successfully!' as status,
    (SELECT COUNT(*) FROM budget_schema.expense_types WHERE user_email = :user_email) as expense_types,
    (SELECT COUNT(*) FROM budget_schema.budgets WHERE user_email = :user_email) as budgets,
    (SELECT COUNT(*) FROM budget_schema.budget_items bi
     JOIN budget_schema.budgets b ON bi.budget_id = b.id
     WHERE b.user_email = :user_email) as budget_items,
    (SELECT COUNT(*) FROM transaction_schema.transactions WHERE user_email = :user_email) as total_transactions,
    (SELECT COUNT(*) FROM transaction_schema.transactions WHERE user_email = :user_email AND transaction_date >= '2025-01-01' AND transaction_date < '2026-01-01') as transactions_2025,
    (SELECT COUNT(*) FROM transaction_schema.transactions WHERE user_email = :user_email AND transaction_date >= '2026-01-01') as transactions_2026;

-- Cleanup temp tables
DROP TABLE IF EXISTS temp_expense_types;
DROP TABLE IF EXISTS temp_budget_2025;
DROP TABLE IF EXISTS temp_budget_2026;
