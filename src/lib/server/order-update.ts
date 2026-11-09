import "server-only";
import type { OrderData } from "../store-service";
import { ApiError } from "./api-error";
import { adminDb } from "./firebase-admin";
import { readStoreTx, writeStoreTx } from "./store-data";

const clean = <T,>(v: T): T => JSON.parse(JSON.stringify(v));

/** Changes one order on the store (and its backup copy) in a transaction. `change` returns the new order. */
export async function updateOrder(subdomain: string, orderId: string, change: (o: OrderData) => OrderData): Promise<OrderData> {
  const db = adminDb();
  return db.runTransaction(async (tx) => {
    const store = await readStoreTx(tx, subdomain);
    if (!store) throw new ApiError(404, "Store not found.");
    const orders = [...(store.orders || [])];
    const i = orders.findIndex((o) => o.id === orderId);
    if (i < 0) throw new ApiError(404, "Order not found.");
    const next = { ...change(orders[i]), updatedAt: new Date().toISOString() };
    orders[i] = next;
    writeStoreTx(tx, subdomain, { orders });
    tx.set(db.collection("orders").doc(orderId), clean({ ...next, storeSubdomain: subdomain }), { merge: true });
    return next;
  });
}
