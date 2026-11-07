import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString =
  process.env.DATABASE_URL ||
  "postgres://shopper_app_user:shopper_password@localhost:5432/shopper_db";

// Connection pool configured for non-owner, non-superuser app role
export const sql = postgres(connectionString, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
  prepare: false, // Required for transaction-scoped session variable settings
});

export const db = drizzle(sql, { schema });

export type DbClient = typeof db;

/**
 * Execute a database operation scoped strictly to a tenant store context using PostgreSQL RLS.
 * This runs within a transaction and executes:
 * SET LOCAL app.current_store_id = '<storeId>';
 * Ensuring Row Level Security prevents any cross-tenant data leakage.
 */
export async function withTenantContext<T>(
  storeId: string,
  callback: (tx: DbClient) => Promise<T>
): Promise<T> {
  if (!storeId) {
    throw new Error("Tenant storeId is required to set tenant database context.");
  }

  const result = await sql.begin(async (txSql) => {
    // Set transaction-local session variable for RLS
    await txSql`SELECT set_config('app.current_store_id', ${storeId}, true)`;
    const txDb = drizzle(txSql as any, { schema });
    return await callback(txDb as unknown as DbClient);
  });

  return result as unknown as T;
}
