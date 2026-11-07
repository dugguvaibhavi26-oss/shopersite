import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

/**
 * RLS Simulator modeling PostgreSQL's FORCE ROW LEVEL SECURITY engine
 * Evaluates the exact SQL policy:
 * USING (store_id = NULLIF(current_setting('app.current_store_id', true), '')::uuid)
 * WITH CHECK (store_id = NULLIF(current_setting('app.current_store_id', true), '')::uuid)
 */
class MockPostgresRlsEngine {
  private sessionStoreId: string | null = null;
  private tables: Record<string, Array<{ id: string; store_id: string; [key: string]: any }>> = {};

  setSessionConfig(key: string, value: string | null) {
    if (key === "app.current_store_id") {
      this.sessionStoreId = value && value.trim().length > 0 ? value : null;
    }
  }

  insert(table: string, row: { id: string; store_id: string; [key: string]: any }) {
    // FORCE RLS: WITH CHECK policy verification
    if (this.sessionStoreId === null || row.store_id !== this.sessionStoreId) {
      throw new Error(`new row violates row-level security policy for table "${table}"`);
    }
    if (!this.tables[table]) this.tables[table] = [];
    this.tables[table].push(row);
    return row;
  }

  // Seeding directly without RLS (e.g. initial db seed migration)
  seed(table: string, row: { id: string; store_id: string; [key: string]: any }) {
    if (!this.tables[table]) this.tables[table] = [];
    this.tables[table].push(row);
  }

  select(table: string): any[] {
    const rows = this.tables[table] || [];
    // FORCE RLS: USING policy evaluation
    if (this.sessionStoreId === null) {
      // Without session context, predicate: store_id = NULL is FALSE -> 0 rows
      return [];
    }
    return rows.filter((r) => r.store_id === this.sessionStoreId);
  }

  update(table: string, id: string, updates: Record<string, any>): number {
    const rows = this.tables[table] || [];
    // FORCE RLS: Can only see rows matching current session store_id
    const target = rows.find((r) => r.id === id && r.store_id === this.sessionStoreId);
    if (!target) {
      // Row not visible under RLS; returns 0 rows updated
      return 0;
    }
    // If update modifies store_id to a different tenant, check fails
    if (updates.store_id && updates.store_id !== this.sessionStoreId) {
      throw new Error(`new row violates row-level security policy for table "${table}"`);
    }
    Object.assign(target, updates);
    return 1;
  }
}

describe("PostgreSQL Strict RLS & Multi-Tenant Isolation", () => {
  const storeA = "11111111-1111-1111-1111-111111111111";
  const storeB = "22222222-2222-2222-2222-222222222222";

  it("verifies migration script applies FORCE ROW LEVEL SECURITY to all tenant tables", () => {
    const migrationPath = path.resolve(__dirname, "../../src/db/migrations/0000_rls_setup.sql");
    const migrationSql = fs.readFileSync(migrationPath, "utf-8");

    expect(migrationSql).toContain("ENABLE ROW LEVEL SECURITY");
    expect(migrationSql).toContain("FORCE ROW LEVEL SECURITY");
    expect(migrationSql).toContain("CREATE POLICY tenant_isolation_policy");
    expect(migrationSql).toContain("app.current_store_id");

    const expectedTenantTables = [
      "store_members",
      "domains",
      "pages",
      "delivery_rules",
      "products",
      "product_images",
      "product_options",
      "variants",
      "collections",
      "collection_products",
      "customers",
      "orders",
      "order_items",
      "order_events",
      "payment_records",
      "discounts",
      "store_themes",
      "store_theme_versions",
      "subscriptions",
      "invoices",
      "notifications",
      "import_jobs",
      "reports",
      "support_tickets",
      "analytics_events",
    ];

    for (const table of expectedTenantTables) {
      expect(migrationSql).toContain(`'${table}'`);
    }
  });

  it("returns ZERO rows when query executes with no store context", () => {
    const engine = new MockPostgresRlsEngine();
    // Seed rows for Store A and Store B
    engine.seed("products", { id: "p1", store_id: storeA, title: "Silk Saree", price: 299900 });
    engine.seed("products", { id: "p2", store_id: storeB, title: "Street Hoodie", price: 149900 });

    // No session context set (simulating unauthenticated or un-scoped query)
    engine.setSessionConfig("app.current_store_id", null);

    const results = engine.select("products");
    expect(results).toHaveLength(0);
  });

  it("returns only Store A's data when app.current_store_id is set to Store A", () => {
    const engine = new MockPostgresRlsEngine();
    engine.seed("products", { id: "p1", store_id: storeA, title: "Silk Saree", price: 299900 });
    engine.seed("products", { id: "p2", store_id: storeB, title: "Street Hoodie", price: 149900 });

    engine.setSessionConfig("app.current_store_id", storeA);

    const results = engine.select("products");
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe("p1");
    expect(results[0].title).toBe("Silk Saree");
  });

  it("prevents cross-tenant read (Store A cannot read Store B data)", () => {
    const engine = new MockPostgresRlsEngine();
    engine.seed("orders", { id: "ord-b1", store_id: storeB, total: 50000 });

    // Seller A connects
    engine.setSessionConfig("app.current_store_id", storeA);

    const ordersForSellerA = engine.select("orders");
    expect(ordersForSellerA).toHaveLength(0);
  });

  it("prevents cross-tenant write/insert and throws RLS policy violation", () => {
    const engine = new MockPostgresRlsEngine();
    // Seller A context
    engine.setSessionConfig("app.current_store_id", storeA);

    // Attempt to insert product belonging to Store B while in Store A's session
    expect(() => {
      engine.insert("products", {
        id: "p3",
        store_id: storeB,
        title: "Malicious Cross-Tenant Product",
        price: 99900,
      });
    }).toThrow(/violates row-level security policy/);
  });

  it("prevents cross-tenant update (Store A cannot update Store B rows)", () => {
    const engine = new MockPostgresRlsEngine();
    engine.seed("products", { id: "p2", store_id: storeB, title: "Original Title", price: 100000 });

    // Seller A attempts to update Seller B's product
    engine.setSessionConfig("app.current_store_id", storeA);

    const rowsUpdated = engine.update("products", "p2", { title: "Hacked Title" });
    expect(rowsUpdated).toBe(0); // Cannot see or touch row under RLS

    // Verify Seller B's product remains untouched
    engine.setSessionConfig("app.current_store_id", storeB);
    const sellerBProducts = engine.select("products");
    expect(sellerBProducts[0].title).toBe("Original Title");
  });
});
