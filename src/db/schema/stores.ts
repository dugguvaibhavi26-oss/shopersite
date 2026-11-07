import { pgTable, uuid, varchar, timestamp, text, boolean, jsonb } from "drizzle-orm/pg-core";
import { users } from "./auth";

export const stores = pgTable("stores", {
  id: uuid("id").defaultRandom().primaryKey(),
  ownerId: uuid("owner_id").references(() => users.id, { onDelete: "restrict" }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  subdomain: varchar("subdomain", { length: 100 }).unique().notNull(),
  status: varchar("status", { length: 50 }).default("draft").notNull(), // 'draft' | 'published' | 'suspended'
  category: varchar("category", { length: 100 }), // fashion, jewellery, beauty, etc.
  logoUrl: text("logo_url"),
  contactPhone: varchar("contact_phone", { length: 20 }),
  contactEmail: varchar("contact_email", { length: 255 }),
  instagramHandle: varchar("instagram_handle", { length: 100 }),
  address: jsonb("address"), // { street, city, state, pincode }
  gstin: varchar("gstin", { length: 20 }),
  upiId: varchar("upi_id", { length: 100 }),
  settings: jsonb("settings").default({}).notNull(),
  planId: varchar("plan_id", { length: 50 }).default("free").notNull(),
  paused: boolean("paused").default(false).notNull(),
  pauseMessage: text("pause_message"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const domains = pgTable("domains", {
  id: uuid("id").defaultRandom().primaryKey(),
  storeId: uuid("store_id").references(() => stores.id, { onDelete: "cascade" }).notNull(),
  hostname: varchar("hostname", { length: 255 }).unique().notNull(),
  status: varchar("status", { length: 50 }).default("pending").notNull(), // 'pending' | 'verifying' | 'active' | 'failed'
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  sslStatus: varchar("ssl_status", { length: 50 }).default("pending").notNull(),
  isPrimary: boolean("is_primary").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const pages = pgTable("pages", {
  id: uuid("id").defaultRandom().primaryKey(),
  storeId: uuid("store_id").references(() => stores.id, { onDelete: "cascade" }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  type: varchar("type", { length: 50 }).default("custom").notNull(), // 'home' | 'about' | 'contact' | 'policy' | 'custom'
  sections: jsonb("sections").default([]).notNull(),
  seo: jsonb("seo").default({}).notNull(),
  status: varchar("status", { length: 50 }).default("published").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const deliveryRules = pgTable("delivery_rules", {
  id: uuid("id").defaultRandom().primaryKey(),
  storeId: uuid("store_id").references(() => stores.id, { onDelete: "cascade" }).notNull(),
  type: varchar("type", { length: 50 }).notNull(), // 'free' | 'flat' | 'free_above' | 'weight' | 'state_wise'
  config: jsonb("config").notNull(), // rates in paise, free delivery thresholds
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
