import { pgTable, uuid, varchar, text, integer, jsonb, timestamp } from "drizzle-orm/pg-core";
import { stores } from "./stores";

export const notifications = pgTable("notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  storeId: uuid("store_id").references(() => stores.id, { onDelete: "cascade" }).notNull(),
  channel: varchar("channel", { length: 50 }).notNull(), // 'whatsapp' | 'email' | 'sms' | 'in_app'
  recipient: varchar("recipient", { length: 255 }).notNull(),
  template: varchar("template", { length: 100 }).notNull(),
  status: varchar("status", { length: 50 }).default("pending").notNull(), // 'pending' | 'sent' | 'delivered' | 'failed'
  providerId: varchar("provider_id", { length: 255 }),
  error: text("error"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const importJobs = pgTable("import_jobs", {
  id: uuid("id").defaultRandom().primaryKey(),
  storeId: uuid("store_id").references(() => stores.id, { onDelete: "cascade" }).notNull(),
  source: varchar("source", { length: 50 }).notNull(), // 'instagram' | 'csv' | 'bulk_images'
  status: varchar("status", { length: 50 }).default("pending").notNull(), // 'pending' | 'processing' | 'completed' | 'failed'
  total: integer("total").default(0).notNull(),
  done: integer("done").default(0).notNull(),
  failed: integer("failed").default(0).notNull(),
  errors: jsonb("errors").default([]).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const reports = pgTable("reports", {
  id: uuid("id").defaultRandom().primaryKey(),
  storeId: uuid("store_id").references(() => stores.id, { onDelete: "cascade" }).notNull(),
  reason: text("reason").notNull(),
  reporterContact: varchar("reporter_contact", { length: 255 }),
  status: varchar("status", { length: 50 }).default("pending").notNull(), // 'pending' | 'reviewed' | 'action_taken' | 'dismissed'
  decision: text("decision"),
  decidedBy: uuid("decided_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Added per user instruction: support_tickets table
export const supportTickets = pgTable("support_tickets", {
  id: uuid("id").defaultRandom().primaryKey(),
  storeId: uuid("store_id").references(() => stores.id, { onDelete: "cascade" }).notNull(),
  subject: varchar("subject", { length: 255 }).notNull(),
  status: varchar("status", { length: 50 }).default("open").notNull(), // 'open' | 'in_progress' | 'waiting_on_seller' | 'resolved' | 'closed'
  priority: varchar("priority", { length: 50 }).default("normal").notNull(), // 'low' | 'normal' | 'high' | 'urgent'
  messages: jsonb("messages").default([]).notNull(), // [{ id, sender: 'seller' | 'support', text, createdAt }]
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const analyticsEvents = pgTable("analytics_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  storeId: uuid("store_id").references(() => stores.id, { onDelete: "cascade" }).notNull(),
  type: varchar("type", { length: 50 }).notNull(), // 'page_view' | 'product_view' | 'add_to_cart' | 'checkout_start' | 'order_placed'
  sessionHash: varchar("session_hash", { length: 64 }).notNull(), // Privacy-friendly anonymous session hash (no PII)
  productId: uuid("product_id"),
  referrer: text("referrer"),
  utm: jsonb("utm").default({}).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  storeId: uuid("store_id"), // Nullable for global platform admin actions
  actorId: uuid("actor_id").notNull(),
  action: varchar("action", { length: 100 }).notNull(),
  targetType: varchar("target_type", { length: 100 }).notNull(),
  targetId: varchar("target_id", { length: 100 }),
  ipAddress: varchar("ip_address", { length: 45 }),
  metadata: jsonb("metadata").default({}).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
