import { pgTable, uuid, varchar, text, jsonb, boolean, integer, timestamp } from "drizzle-orm/pg-core";
import { stores } from "./stores";

export const themes = pgTable("themes", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: varchar("slug", { length: 100 }).unique().notNull(), // 'bloom', 'zest', 'fresh', 'mono', etc.
  name: varchar("name", { length: 100 }).notNull(),
  tier: varchar("tier", { length: 50 }).default("free").notNull(), // 'free' | 'paid'
  version: varchar("version", { length: 50 }).default("1.0.0").notNull(),
  tokens: jsonb("tokens").notNull(), // default colors, fonts, radius, layout
  previewUrl: text("preview_url"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const storeThemes = pgTable("store_themes", {
  id: uuid("id").defaultRandom().primaryKey(),
  storeId: uuid("store_id").references(() => stores.id, { onDelete: "cascade" }).unique().notNull(),
  themeId: uuid("theme_id").references(() => themes.id, { onDelete: "restrict" }).notNull(),
  tokensOverride: jsonb("tokens_override").default({}).notNull(),
  publishedVersion: integer("published_version").default(1).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const storeThemeVersions = pgTable("store_theme_versions", {
  id: uuid("id").defaultRandom().primaryKey(),
  storeId: uuid("store_id").references(() => stores.id, { onDelete: "cascade" }).notNull(),
  version: integer("version").notNull(),
  snapshot: jsonb("snapshot").notNull(), // Full JSON snapshot of theme & layout configuration
  publishedAt: timestamp("published_at", { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
