import { pgTable, uuid, varchar, text, integer, jsonb, boolean, timestamp } from "drizzle-orm/pg-core";
import { stores } from "./stores";

export const plans = pgTable("plans", {
  id: varchar("id", { length: 50 }).primaryKey(), // 'free', 'starter', 'pro'
  name: varchar("name", { length: 100 }).notNull(),
  tier: varchar("tier", { length: 50 }).notNull(),
  limits: jsonb("limits").notNull(), // { maxProducts, maxStorageMb, customDomain, themesAllowed, maxWhatsappPerMonth }
  monthlyPrice: integer("monthly_price").notNull(), // In paise (e.g. 29900 = ₹299)
  yearlyPrice: integer("yearly_price").notNull(),   // In paise
  razorpayPlanIdMonthly: varchar("razorpay_plan_id_monthly", { length: 100 }),
  razorpayPlanIdYearly: varchar("razorpay_plan_id_yearly", { length: 100 }),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  storeId: uuid("store_id").references(() => stores.id, { onDelete: "cascade" }).notNull(),
  planId: varchar("plan_id", { length: 50 }).references(() => plans.id, { onDelete: "restrict" }).notNull(),
  razorpaySubscriptionId: varchar("razorpay_subscription_id", { length: 100 }),
  status: varchar("status", { length: 50 }).default("active").notNull(), // 'active', 'authenticated', 'charged', 'pending', 'halted', 'cancelled', 'paused'
  currentPeriodStart: timestamp("current_period_start", { withTimezone: true }),
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
  graceUntil: timestamp("grace_until", { withTimezone: true }), // 5-day grace period
  cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const invoices = pgTable("invoices", {
  id: uuid("id").defaultRandom().primaryKey(),
  storeId: uuid("store_id").references(() => stores.id, { onDelete: "cascade" }).notNull(),
  number: varchar("number", { length: 50 }).unique().notNull(), // Sequential invoice number: INV-2026-0001
  amount: integer("amount").notNull(), // Total in paise
  gstRate: integer("gst_rate").default(0).notNull(), // 18% = 18 when platform GST enabled, otherwise 0
  gstAmount: integer("gst_amount").default(0).notNull(), // In paise
  gstin: varchar("gstin", { length: 20 }),
  sacCode: varchar("sac_code", { length: 20 }).default("998313"), // Information technology software SaaS
  pdfUrl: text("pdf_url"),
  razorpayPaymentId: varchar("razorpay_payment_id", { length: 100 }),
  status: varchar("status", { length: 50 }).default("paid").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Added per user instruction: webhook_events table for idempotency
export const webhookEvents = pgTable("webhook_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  provider: varchar("provider", { length: 50 }).notNull(), // 'razorpay', 'whatsapp', 'meta'
  eventId: varchar("event_id", { length: 255 }).unique().notNull(),
  payload: jsonb("payload").notNull(),
  processedAt: timestamp("processed_at", { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
