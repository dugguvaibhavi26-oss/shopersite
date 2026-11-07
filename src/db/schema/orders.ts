import { pgTable, uuid, varchar, text, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { stores } from "./stores";

export const customers = pgTable("customers", {
  id: uuid("id").defaultRandom().primaryKey(),
  storeId: uuid("store_id").references(() => stores.id, { onDelete: "cascade" }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  email: varchar("email", { length: 255 }),
  consentWhatsapp: boolean("consent_whatsapp").default(false).notNull(),
  consentMarketing: boolean("consent_marketing").default(false).notNull(),
  notes: text("notes"),
  tags: jsonb("tags").default([]).notNull(),
  totalOrders: integer("total_orders").default(0).notNull(),
  totalSpent: integer("total_spent").default(0).notNull(), // In paise
  lastOrderAt: timestamp("last_order_at", { withTimezone: true }),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const orders = pgTable("orders", {
  id: uuid("id").defaultRandom().primaryKey(),
  storeId: uuid("store_id").references(() => stores.id, { onDelete: "cascade" }).notNull(),
  number: varchar("number", { length: 50 }).notNull(), // e.g. "#1001"
  token: varchar("token", { length: 64 }).unique().notNull(), // Unguessable tracking token
  customerSnapshot: jsonb("customer_snapshot").notNull(), // Immutable name, phone, email
  addressSnapshot: jsonb("address_snapshot").notNull(),   // Immutable street, pincode, city, state
  subtotal: integer("subtotal").notNull(),               // Paise
  discount: integer("discount").default(0).notNull(),     // Paise
  delivery: integer("delivery").default(0).notNull(),     // Paise
  codFee: integer("cod_fee").default(0).notNull(),         // Paise
  total: integer("total").notNull(),                     // Paise
  fulfilmentStatus: varchar("fulfilment_status", { length: 50 }).default("placed").notNull(), // placed, confirmed, packed, shipped, delivered, cancelled, return_requested, returned
  paymentStatus: varchar("payment_status", { length: 50 }).default("awaiting_verification").notNull(), // cod_pending, awaiting_verification, paid, rejected, refunded
  paymentMethod: varchar("payment_method", { length: 50 }).notNull(), // 'cod' | 'upi' | 'seller_link' | 'bank_transfer'
  source: varchar("source", { length: 50 }).default("storefront").notNull(), // 'storefront' | 'manual'
  note: text("note"),
  courierName: varchar("courier_name", { length: 100 }),
  trackingNumber: varchar("tracking_number", { length: 100 }),
  trackingUrl: text("tracking_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const orderItems = pgTable("order_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  storeId: uuid("store_id").references(() => stores.id, { onDelete: "cascade" }).notNull(),
  orderId: uuid("order_id").references(() => orders.id, { onDelete: "cascade" }).notNull(),
  productSnapshot: jsonb("product_snapshot").notNull(),
  variantSnapshot: jsonb("variant_snapshot"),
  quantity: integer("quantity").notNull(),
  unitPrice: integer("unit_price").notNull(), // Paise
  totalPrice: integer("total_price").notNull(), // Paise
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const orderEvents = pgTable("order_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  storeId: uuid("store_id").references(() => stores.id, { onDelete: "cascade" }).notNull(),
  orderId: uuid("order_id").references(() => orders.id, { onDelete: "cascade" }).notNull(),
  type: varchar("type", { length: 100 }).notNull(), // 'placed', 'paid', 'packed', 'shipped', etc.
  actor: varchar("actor", { length: 100 }).notNull(), // 'buyer', 'seller', 'system'
  data: jsonb("data").default({}).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const paymentRecords = pgTable("payment_records", {
  id: uuid("id").defaultRandom().primaryKey(),
  storeId: uuid("store_id").references(() => stores.id, { onDelete: "cascade" }).notNull(),
  orderId: uuid("order_id").references(() => orders.id, { onDelete: "cascade" }).notNull(),
  method: varchar("method", { length: 50 }).notNull(),
  utr: varchar("utr", { length: 100 }),
  screenshotUrl: text("screenshot_url"),
  verifiedBy: uuid("verified_by"),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  status: varchar("status", { length: 50 }).default("pending").notNull(), // 'pending' | 'verified' | 'rejected'
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const discounts = pgTable("discounts", {
  id: uuid("id").defaultRandom().primaryKey(),
  storeId: uuid("store_id").references(() => stores.id, { onDelete: "cascade" }).notNull(),
  code: varchar("code", { length: 50 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(), // 'percentage' | 'fixed_amount' | 'free_shipping'
  value: integer("value").notNull(), // Percentage (e.g. 10) or Paise (e.g. 10000 = ₹100)
  minOrder: integer("min_order").default(0).notNull(), // In paise
  usageLimit: integer("usage_limit"),
  timesUsed: integer("times_used").default(0).notNull(),
  startsAt: timestamp("starts_at", { withTimezone: true }),
  endsAt: timestamp("ends_at", { withTimezone: true }),
  scope: jsonb("scope").default({}).notNull(), // products/collections restriction
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
