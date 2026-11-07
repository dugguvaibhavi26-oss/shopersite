-- 0000_rls_setup.sql: Complete RLS and Tenant Isolation Policies
-- Rule: The app connects as a non-owner, non-superuser role (e.g. shopper_app_user).
-- Rule: Use FORCE ROW LEVEL SECURITY on all tenant tables so table owners cannot bypass policies.

-- List of tenant tables requiring strict store_id RLS:
-- 1. store_members
-- 2. domains
-- 3. pages
-- 4. delivery_rules
-- 5. products
-- 6. product_images
-- 7. product_options
-- 8. variants
-- 9. collections
-- 10. collection_products
-- 11. customers
-- 12. orders
-- 13. order_items
-- 14. order_events
-- 15. payment_records
-- 16. discounts
-- 17. store_themes
-- 18. store_theme_versions
-- 19. subscriptions
-- 20. invoices
-- 21. notifications
-- 22. import_jobs
-- 23. reports
-- 24. support_tickets
-- 25. analytics_events

DO $$
DECLARE
    tbl text;
    tables text[] := ARRAY[
        'store_members',
        'domains',
        'pages',
        'delivery_rules',
        'products',
        'product_images',
        'product_options',
        'variants',
        'collections',
        'collection_products',
        'customers',
        'orders',
        'order_items',
        'order_events',
        'payment_records',
        'discounts',
        'store_themes',
        'store_theme_versions',
        'subscriptions',
        'invoices',
        'notifications',
        'import_jobs',
        'reports',
        'support_tickets',
        'analytics_events'
    ];
BEGIN
    FOREACH tbl IN ARRAY tables LOOP
        -- Enable RLS
        EXECUTE format('ALTER TABLE IF EXISTS %I ENABLE ROW LEVEL SECURITY;', tbl);
        -- Force RLS (Ensures RLS applies even to owners and table creators)
        EXECUTE format('ALTER TABLE IF EXISTS %I FORCE ROW LEVEL SECURITY;', tbl);
        
        -- Drop existing policy if any
        EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_policy ON %I;', tbl);
        
        -- Create strict tenant isolation policy
        EXECUTE format(
            'CREATE POLICY tenant_isolation_policy ON %I FOR ALL ' ||
            'USING (store_id = NULLIF(current_setting(''app.current_store_id'', true), '''')::uuid) ' ||
            'WITH CHECK (store_id = NULLIF(current_setting(''app.current_store_id'', true), '''')::uuid);',
            tbl
        );
    END LOOP;
END $$;
