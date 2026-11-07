// @vitest-environment node
import { describe, it, expect, beforeAll } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import fs from "fs";
import path from "path";

describe("REAL PostgreSQL Engine RLS & Tenant Isolation Test", () => {
  let pg: PGlite;
  const storeA = "11111111-1111-1111-1111-111111111111";
  const storeB = "22222222-2222-2222-2222-222222222222";
  const userA = "33333333-3333-3333-3333-333333333333";
  const userB = "44444444-4444-4444-4444-444444444444";

  beforeAll(async () => {
    // 1. Initialize real PostgreSQL 16 engine from scratch
    pg = new PGlite();

    // 2. Read and apply complete table DDL migration
    const ddlPath = path.resolve(__dirname, "../../src/db/migrations/0000_hard_nighthawk.sql");
    const ddlSql = fs.readFileSync(ddlPath, "utf-8");
    // Split on statement-breakpoint
    const statements = ddlSql.split("--> statement-breakpoint");
    for (const stmt of statements) {
      if (stmt.trim()) {
        await pg.exec(stmt);
      }
    }

    // 3. Create non-owner, non-superuser app role: shopper_app_user
    await pg.exec(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'shopper_app_user') THEN
          CREATE ROLE shopper_app_user;
        END IF;
      END $$;
      GRANT USAGE ON SCHEMA public TO shopper_app_user;
      GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO shopper_app_user;
      ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO shopper_app_user;
    `);

    // 4. Apply FORCE ROW LEVEL SECURITY and tenant isolation policies
    const rlsSql = fs.readFileSync(
      path.resolve(__dirname, "../../src/db/migrations/0000_rls_setup.sql"),
      "utf-8"
    );
    await pg.exec(rlsSql);

    // 5. Seed test users and stores as superuser before testing
    await pg.exec(`
      INSERT INTO users (id, phone, name) VALUES 
        ('${userA}', '9876500001', 'Seller A'),
        ('${userB}', '9876500002', 'Seller B');

      INSERT INTO stores (id, owner_id, name, subdomain) VALUES 
        ('${storeA}', '${userA}', 'Store A', 'store-a'),
        ('${storeB}', '${userB}', 'Store B', 'store-b');

      INSERT INTO products (id, store_id, title, slug, price, status) VALUES 
        ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '${storeA}', 'Store A Saree', 'store-a-saree', 299900, 'published'),
        ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '${storeB}', 'Store B Kurta', 'store-b-kurta', 149900, 'published');
    `);
  }, 30000);

  it("Test 1: Connecting as non-owner role shopper_app_user", async () => {
    await pg.exec("SET ROLE shopper_app_user;");
    const res = await pg.query("SELECT current_user;");
    expect((res.rows[0] as any).current_user).toBe("shopper_app_user");
  });

  it("Test 2: Query with NO store context returns ZERO rows", async () => {
    // Reset app.current_store_id
    await pg.exec("SET ROLE shopper_app_user;");
    await pg.exec("SELECT set_config('app.current_store_id', '', false);");

    const res = await pg.query("SELECT id, title, store_id FROM products;");
    expect(res.rows).toHaveLength(0);
  });

  it("Test 3: Query scoped to Store A returns ONLY Store A's data", async () => {
    await pg.exec("SET ROLE shopper_app_user;");
    await pg.exec(`SELECT set_config('app.current_store_id', '${storeA}', false);`);

    const res = await pg.query("SELECT id, title, store_id FROM products;");
    expect(res.rows).toHaveLength(1);
    expect((res.rows[0] as any).title).toBe("Store A Saree");
    expect((res.rows[0] as any).store_id).toBe(storeA);
  });

  it("Test 4: Cross-tenant READ is blocked (Store A cannot read Store B data)", async () => {
    await pg.exec("SET ROLE shopper_app_user;");
    await pg.exec(`SELECT set_config('app.current_store_id', '${storeA}', false);`);

    const res = await pg.query(`SELECT * FROM products WHERE store_id = '${storeB}';`);
    expect(res.rows).toHaveLength(0);
  });

  it("Test 5: Cross-tenant WRITE/INSERT fails and raises RLS policy violation", async () => {
    await pg.exec("SET ROLE shopper_app_user;");
    await pg.exec(`SELECT set_config('app.current_store_id', '${storeA}', false);`);

    // Attempting to insert a product belonging to Store B while in Store A context
    await expect(async () => {
      await pg.exec(`
        INSERT INTO products (id, store_id, title, slug, price, status)
        VALUES ('cccccccc-cccc-cccc-cccc-cccccccccccc', '${storeB}', 'Malicious Product', 'malicious', 99900, 'draft');
      `);
    }).rejects.toThrow(/violates row-level security policy/i);
  });

  it("Test 6: Cross-tenant UPDATE affects 0 rows, preserving Store B's data", async () => {
    await pg.exec("SET ROLE shopper_app_user;");
    await pg.exec(`SELECT set_config('app.current_store_id', '${storeA}', false);`);

    // Seller A attempts to tamper with Store B's product
    const updateRes = await pg.query(`
      UPDATE products SET title = 'Hacked Product' WHERE id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
    `);
    expect((updateRes as any).affectedRows || 0).toBe(0);

    // Switch to Store B context to verify title was completely untouched
    await pg.exec(`SELECT set_config('app.current_store_id', '${storeB}', false);`);
    const checkRes = await pg.query(`
      SELECT title FROM products WHERE id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
    `);
    expect(checkRes.rows).toHaveLength(1);
    expect((checkRes.rows[0] as any).title).toBe("Store B Kurta");
  });
});
