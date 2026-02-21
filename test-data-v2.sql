-- ============================================================================
-- Test Data Script for Personal Finance App - V2
-- Creates budgets and transactions for 2025 and 2026
-- ============================================================================

-- Change this email to your login email
DO $$
DECLARE
    v_user_email TEXT := 'rjyothy1992@gmail.com';
    v_expense_type_rent UUID;
    v_expense_type_groceries UUID;
    v_expense_type_transport UUID;
    v_expense_type_utilities UUID;
    v_expense_type_entertainment UUID;
    v_expense_type_dining UUID;
    v_expense_type_healthcare UUID;
    v_expense_type_insurance UUID;
    v_budget_2025 UUID;
    v_budget_2026 UUID;
    v_budget_item_id UUID;
    month_num INT;
BEGIN
    -- ========================================================================
    -- 1. CREATE EXPENSE TYPES
    -- ========================================================================

    INSERT INTO budget_schema.expense_types (id, user_email, name, icon, is_mandatory, created_at, updated_at)
    VALUES (gen_random_uuid(), v_user_email, 'Rent', 'home', true, NOW(), NOW())
    RETURNING id INTO v_expense_type_rent;

    INSERT INTO budget_schema.expense_types (id, user_email, name, icon, is_mandatory, created_at, updated_at)
    VALUES (gen_random_uuid(), v_user_email, 'Groceries', 'shopping-cart', true, NOW(), NOW())
    RETURNING id INTO v_expense_type_groceries;

    INSERT INTO budget_schema.expense_types (id, user_email, name, icon, is_mandatory, created_at, updated_at)
    VALUES (gen_random_uuid(), v_user_email, 'Transportation', 'car', true, NOW(), NOW())
    RETURNING id INTO v_expense_type_transport;

    INSERT INTO budget_schema.expense_types (id, user_email, name, icon, is_mandatory, created_at, updated_at)
    VALUES (gen_random_uuid(), v_user_email, 'Utilities', 'zap', true, NOW(), NOW())
    RETURNING id INTO v_expense_type_utilities;

    INSERT INTO budget_schema.expense_types (id, user_email, name, icon, is_mandatory, created_at, updated_at)
    VALUES (gen_random_uuid(), v_user_email, 'Entertainment', 'tv', false, NOW(), NOW())
    RETURNING id INTO v_expense_type_entertainment;

    INSERT INTO budget_schema.expense_types (id, user_email, name, icon, is_mandatory, created_at, updated_at)
    VALUES (gen_random_uuid(), v_user_email, 'Dining Out', 'utensils', false, NOW(), NOW())
    RETURNING id INTO v_expense_type_dining;

    INSERT INTO budget_schema.expense_types (id, user_email, name, icon, is_mandatory, created_at, updated_at)
    VALUES (gen_random_uuid(), v_user_email, 'Healthcare', 'heart', true, NOW(), NOW())
    RETURNING id INTO v_expense_type_healthcare;

    INSERT INTO budget_schema.expense_types (id, user_email, name, icon, is_mandatory, created_at, updated_at)
    VALUES (gen_random_uuid(), v_user_email, 'Insurance', 'shield', true, NOW(), NOW())
    RETURNING id INTO v_expense_type_insurance;

    -- ========================================================================
    -- 2. CREATE 2025 BUDGET
    -- ========================================================================

    INSERT INTO budget_schema.budgets (id, user_email, year, created_at, updated_at)
    VALUES (gen_random_uuid(), v_user_email, 2025, NOW(), NOW())
    RETURNING id INTO v_budget_2025;

    -- Create budget items for 2025
    INSERT INTO budget_schema.budget_items (id, budget_id, expense_type_id, amount, is_one_time, applicable_month, created_at, updated_at)
    VALUES
        (gen_random_uuid(), v_budget_2025, v_expense_type_rent, 1500.00, false, NULL, NOW(), NOW()),
        (gen_random_uuid(), v_budget_2025, v_expense_type_groceries, 400.00, false, NULL, NOW(), NOW()),
        (gen_random_uuid(), v_budget_2025, v_expense_type_transport, 200.00, false, NULL, NOW(), NOW()),
        (gen_random_uuid(), v_budget_2025, v_expense_type_utilities, 150.00, false, NULL, NOW(), NOW()),
        (gen_random_uuid(), v_budget_2025, v_expense_type_entertainment, 100.00, false, NULL, NOW(), NOW()),
        (gen_random_uuid(), v_budget_2025, v_expense_type_dining, 150.00, false, NULL, NOW(), NOW()),
        (gen_random_uuid(), v_budget_2025, v_expense_type_healthcare, 100.00, false, NULL, NOW(), NOW()),
        (gen_random_uuid(), v_budget_2025, v_expense_type_insurance, 200.00, false, NULL, NOW(), NOW());

    -- ========================================================================
    -- 3. CREATE 2025 TRANSACTIONS
    -- ========================================================================

    -- Get budget item IDs for 2025
    FOR month_num IN 1..12 LOOP
        -- Rent (every month)
        SELECT id INTO v_budget_item_id FROM budget_schema.budget_items
        WHERE budget_id = v_budget_2025 AND expense_type_id = v_expense_type_rent LIMIT 1;

        INSERT INTO transaction_schema.transactions (id, user_email, budget_item_id, expense_type_id, amount, description, transaction_date, created_at, updated_at)
        VALUES (gen_random_uuid(), v_user_email, v_budget_item_id, v_expense_type_rent, 1500.00,
                'Month ' || month_num || ' rent',
                ('2025-' || LPAD(month_num::text, 2, '0') || '-05')::date, NOW(), NOW());

        -- Groceries (every month, varied)
        SELECT id INTO v_budget_item_id FROM budget_schema.budget_items
        WHERE budget_id = v_budget_2025 AND expense_type_id = v_expense_type_groceries LIMIT 1;

        INSERT INTO transaction_schema.transactions (id, user_email, budget_item_id, expense_type_id, amount, description, transaction_date, created_at, updated_at)
        VALUES (gen_random_uuid(), v_user_email, v_budget_item_id, v_expense_type_groceries,
                350.00 + (RANDOM() * 100)::numeric(10,2),
                'Month ' || month_num || ' groceries',
                ('2025-' || LPAD(month_num::text, 2, '0') || '-10')::date, NOW(), NOW());

        -- Transportation (every month)
        SELECT id INTO v_budget_item_id FROM budget_schema.budget_items
        WHERE budget_id = v_budget_2025 AND expense_type_id = v_expense_type_transport LIMIT 1;

        INSERT INTO transaction_schema.transactions (id, user_email, budget_item_id, expense_type_id, amount, description, transaction_date, created_at, updated_at)
        VALUES (gen_random_uuid(), v_user_email, v_budget_item_id, v_expense_type_transport,
                150.00 + (RANDOM() * 80)::numeric(10,2),
                'Month ' || month_num || ' transportation',
                ('2025-' || LPAD(month_num::text, 2, '0') || '-12')::date, NOW(), NOW());

        -- Utilities (every month, varied by season)
        SELECT id INTO v_budget_item_id FROM budget_schema.budget_items
        WHERE budget_id = v_budget_2025 AND expense_type_id = v_expense_type_utilities LIMIT 1;

        INSERT INTO transaction_schema.transactions (id, user_email, budget_item_id, expense_type_id, amount, description, transaction_date, created_at, updated_at)
        VALUES (gen_random_uuid(), v_user_email, v_budget_item_id, v_expense_type_utilities,
                CASE
                    WHEN month_num IN (6,7,8) THEN 180.00 + (RANDOM() * 20)::numeric(10,2)
                    WHEN month_num IN (12,1,2) THEN 175.00 + (RANDOM() * 25)::numeric(10,2)
                    ELSE 130.00 + (RANDOM() * 30)::numeric(10,2)
                END,
                'Month ' || month_num || ' utilities',
                ('2025-' || LPAD(month_num::text, 2, '0') || '-15')::date, NOW(), NOW());

        -- Entertainment (every other month)
        IF month_num % 2 = 1 THEN
            SELECT id INTO v_budget_item_id FROM budget_schema.budget_items
            WHERE budget_id = v_budget_2025 AND expense_type_id = v_expense_type_entertainment LIMIT 1;

            INSERT INTO transaction_schema.transactions (id, user_email, budget_item_id, expense_type_id, amount, description, transaction_date, created_at, updated_at)
            VALUES (gen_random_uuid(), v_user_email, v_budget_item_id, v_expense_type_entertainment,
                    60.00 + (RANDOM() * 50)::numeric(10,2),
                    'Month ' || month_num || ' entertainment',
                    ('2025-' || LPAD(month_num::text, 2, '0') || '-20')::date, NOW(), NOW());
        END IF;

        -- Dining Out (every other month)
        IF month_num % 2 = 0 THEN
            SELECT id INTO v_budget_item_id FROM budget_schema.budget_items
            WHERE budget_id = v_budget_2025 AND expense_type_id = v_expense_type_dining LIMIT 1;

            INSERT INTO transaction_schema.transactions (id, user_email, budget_item_id, expense_type_id, amount, description, transaction_date, created_at, updated_at)
            VALUES (gen_random_uuid(), v_user_email, v_budget_item_id, v_expense_type_dining,
                    100.00 + (RANDOM() * 60)::numeric(10,2),
                    'Month ' || month_num || ' dining out',
                    ('2025-' || LPAD(month_num::text, 2, '0') || '-22')::date, NOW(), NOW());
        END IF;
    END LOOP;

    -- ========================================================================
    -- 4. CREATE 2026 BUDGET
    -- ========================================================================

    INSERT INTO budget_schema.budgets (id, user_email, year, created_at, updated_at)
    VALUES (gen_random_uuid(), v_user_email, 2026, NOW(), NOW())
    RETURNING id INTO v_budget_2026;

    -- Create budget items for 2026 (slightly increased)
    INSERT INTO budget_schema.budget_items (id, budget_id, expense_type_id, amount, is_one_time, applicable_month, created_at, updated_at)
    VALUES
        (gen_random_uuid(), v_budget_2026, v_expense_type_rent, 1550.00, false, NULL, NOW(), NOW()),
        (gen_random_uuid(), v_budget_2026, v_expense_type_groceries, 450.00, false, NULL, NOW(), NOW()),
        (gen_random_uuid(), v_budget_2026, v_expense_type_transport, 220.00, false, NULL, NOW(), NOW()),
        (gen_random_uuid(), v_budget_2026, v_expense_type_utilities, 160.00, false, NULL, NOW(), NOW()),
        (gen_random_uuid(), v_budget_2026, v_expense_type_entertainment, 120.00, false, NULL, NOW(), NOW()),
        (gen_random_uuid(), v_budget_2026, v_expense_type_dining, 180.00, false, NULL, NOW(), NOW()),
        (gen_random_uuid(), v_budget_2026, v_expense_type_healthcare, 120.00, false, NULL, NOW(), NOW()),
        (gen_random_uuid(), v_budget_2026, v_expense_type_insurance, 210.00, false, NULL, NOW(), NOW());

    -- ========================================================================
    -- 5. CREATE 2026 TRANSACTIONS (January and February)
    -- ========================================================================

    -- January 2026
    SELECT id INTO v_budget_item_id FROM budget_schema.budget_items
    WHERE budget_id = v_budget_2026 AND expense_type_id = v_expense_type_rent LIMIT 1;
    INSERT INTO transaction_schema.transactions (id, user_email, budget_item_id, expense_type_id, amount, description, transaction_date, created_at, updated_at)
    VALUES (gen_random_uuid(), v_user_email, v_budget_item_id, v_expense_type_rent, 1550.00, 'January rent', '2026-01-05', NOW(), NOW());

    SELECT id INTO v_budget_item_id FROM budget_schema.budget_items
    WHERE budget_id = v_budget_2026 AND expense_type_id = v_expense_type_groceries LIMIT 1;
    INSERT INTO transaction_schema.transactions (id, user_email, budget_item_id, expense_type_id, amount, description, transaction_date, created_at, updated_at)
    VALUES (gen_random_uuid(), v_user_email, v_budget_item_id, v_expense_type_groceries, 425.00, 'January groceries', '2026-01-10', NOW(), NOW());

    SELECT id INTO v_budget_item_id FROM budget_schema.budget_items
    WHERE budget_id = v_budget_2026 AND expense_type_id = v_expense_type_transport LIMIT 1;
    INSERT INTO transaction_schema.transactions (id, user_email, budget_item_id, expense_type_id, amount, description, transaction_date, created_at, updated_at)
    VALUES (gen_random_uuid(), v_user_email, v_budget_item_id, v_expense_type_transport, 195.00, 'January gas and maintenance', '2026-01-12', NOW(), NOW());

    SELECT id INTO v_budget_item_id FROM budget_schema.budget_items
    WHERE budget_id = v_budget_2026 AND expense_type_id = v_expense_type_utilities LIMIT 1;
    INSERT INTO transaction_schema.transactions (id, user_email, budget_item_id, expense_type_id, amount, description, transaction_date, created_at, updated_at)
    VALUES (gen_random_uuid(), v_user_email, v_budget_item_id, v_expense_type_utilities, 170.00, 'January utilities', '2026-01-15', NOW(), NOW());

    -- February 2026
    SELECT id INTO v_budget_item_id FROM budget_schema.budget_items
    WHERE budget_id = v_budget_2026 AND expense_type_id = v_expense_type_rent LIMIT 1;
    INSERT INTO transaction_schema.transactions (id, user_email, budget_item_id, expense_type_id, amount, description, transaction_date, created_at, updated_at)
    VALUES (gen_random_uuid(), v_user_email, v_budget_item_id, v_expense_type_rent, 1550.00, 'February rent', '2026-02-05', NOW(), NOW());

    SELECT id INTO v_budget_item_id FROM budget_schema.budget_items
    WHERE budget_id = v_budget_2026 AND expense_type_id = v_expense_type_groceries LIMIT 1;
    INSERT INTO transaction_schema.transactions (id, user_email, budget_item_id, expense_type_id, amount, description, transaction_date, created_at, updated_at)
    VALUES (gen_random_uuid(), v_user_email, v_budget_item_id, v_expense_type_groceries, 380.50, 'Weekly groceries', '2026-02-10', NOW(), NOW());

    SELECT id INTO v_budget_item_id FROM budget_schema.budget_items
    WHERE budget_id = v_budget_2026 AND expense_type_id = v_expense_type_dining LIMIT 1;
    INSERT INTO transaction_schema.transactions (id, user_email, budget_item_id, expense_type_id, amount, description, transaction_date, created_at, updated_at)
    VALUES (gen_random_uuid(), v_user_email, v_budget_item_id, v_expense_type_dining, 45.50, 'Dinner at Italian restaurant', '2026-02-14', NOW(), NOW());

    SELECT id INTO v_budget_item_id FROM budget_schema.budget_items
    WHERE budget_id = v_budget_2026 AND expense_type_id = v_expense_type_entertainment LIMIT 1;
    INSERT INTO transaction_schema.transactions (id, user_email, budget_item_id, expense_type_id, amount, description, transaction_date, created_at, updated_at)
    VALUES (gen_random_uuid(), v_user_email, v_budget_item_id, v_expense_type_entertainment, 125.00, 'Concert tickets', '2026-02-15', NOW(), NOW());

    SELECT id INTO v_budget_item_id FROM budget_schema.budget_items
    WHERE budget_id = v_budget_2026 AND expense_type_id = v_expense_type_groceries LIMIT 1;
    INSERT INTO transaction_schema.transactions (id, user_email, budget_item_id, expense_type_id, amount, description, transaction_date, created_at, updated_at)
    VALUES (gen_random_uuid(), v_user_email, v_budget_item_id, v_expense_type_groceries, 67.89, 'Coffee shop and snacks', '2026-02-16', NOW(), NOW());

    RAISE NOTICE '✅ Test data created successfully!';
END $$;

-- Display summary
SELECT
    '✅ Test data created!' as status,
    (SELECT COUNT(*) FROM budget_schema.expense_types WHERE user_email = 'rjyothy1992@gmail.com') as expense_types,
    (SELECT COUNT(*) FROM budget_schema.budgets WHERE user_email = 'rjyothy1992@gmail.com') as budgets,
    (SELECT COUNT(*) FROM budget_schema.budget_items bi
     JOIN budget_schema.budgets b ON bi.budget_id = b.id
     WHERE b.user_email = 'rjyothy1992@gmail.com') as budget_items,
    (SELECT COUNT(*) FROM transaction_schema.transactions WHERE user_email = 'rjyothy1992@gmail.com') as total_transactions,
    (SELECT COUNT(*) FROM transaction_schema.transactions
     WHERE user_email = 'rjyothy1992@gmail.com'
     AND transaction_date >= '2025-01-01' AND transaction_date < '2026-01-01') as transactions_2025,
    (SELECT COUNT(*) FROM transaction_schema.transactions
     WHERE user_email = 'rjyothy1992@gmail.com'
     AND transaction_date >= '2026-01-01') as transactions_2026;

-- Show recent transactions
SELECT
    transaction_date,
    et.name as expense_type,
    amount,
    description
FROM transaction_schema.transactions t
JOIN budget_schema.expense_types et ON t.expense_type_id = et.id
WHERE t.user_email = 'rjyothy1992@gmail.com'
AND transaction_date >= '2026-02-01'
ORDER BY transaction_date DESC
LIMIT 10;
