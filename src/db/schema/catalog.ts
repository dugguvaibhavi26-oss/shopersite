import { pgTable, uuid, varchar, text, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { stores } from "./stores";

export const products = pgTable("products", {
  id: uuid("id").defaultRandom().primaryKey(),
  storeId: uuid("store_id").references(() => stores.id, { onDelete: "cascade" }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull(),
  description: text("description"),
  price: integer("price").notNull(), // Amount in paise
  compareAtPrice: integer("compare_at_price"), // Strike-through price in paise
  costPrice: integer("cost_price"), // Private profit tracking in paise
  status: varchar("status", { length: 50 }).default("draft").notNull(), // 'draft' | 'published' | 'hidden'
  trackStock: boolean("track_stock").default(true).notNull(),
  continueSellingOutOfStock: boolean("continue_selling_out_of_stock").default(false).notNull(),
  weightGrams: integer("weight_grams"),
  seo: jsonb("seo").default({}).notNull(),
  source: varchar("source", { length: 50 }).default("manual").notNull(), // 'manual' | 'instagram' | 'csv'
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const productImages = pgTable("product_images", {
  id: uuid("id").defaultRandom().primaryKey(),
  storeId: uuid("store_id").references(() => stores.id, { onDelete: "cascade" }).notNull(),
  productId: uuid("product_id").references(() => products.id, { onDelete: "cascade" }).notNull(),
  url: text("url").notNull(),
  alt: varchar("alt", { length: 255 }),
  position: integer("position").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const productOptions = pgTable("product_options", {
  id: uuid("id").defaultRandom().primaryKey(),
  storeId: uuid("store_id").references(() => stores.id, { onDelete: "cascade" }).notNull(),
  productId: uuid("product_id").references(() => products.id, { onDelete: "cascade" }).notNull(),
  name: varchar("name", { length: 100 }).notNull(), // e.g. "Size", "Color"
  values: jsonb("values").notNull(), // e.g. ["S", "M", "L", "XL"]
  position: integer("position").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const variants = pgTable("variants", {
  id: uuid("id").defaultRandom().primaryKey(),
  storeId: uuid("store_id").references(() => stores.id, { onDelete: "cascade" }).notNull(),
  productId: uuid("product_id").references(() => products.id, { onDelete: "cascade" }).notNull(),
  optionValues: jsonb("option_values").notNull(), // e.g. {"Size": "M", "Color": "Blue"}
  price: integer("price"), // Override price in paise, null to inherit product.price
  sku: varchar("sku", { length: 100 }),
  stock: integer("stock").default(0).notNull(),
  imageId: uuid("image_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const collections = pgTable("collections", {
  id: uuid("id").defaultRandom().primaryKey(),
  storeId: uuid("store_id").references(() => stores.id, { onDelete: "cascade" }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  position: integer("position").default(0).notNull(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const collectionProducts = pgTable("collection_products", {
  id: uuid("id").defaultRandom().primaryKey(),
  storeId: uuid("store_id").references(() => stores.id, { onDelete: "cascade" }).notNull(),
  collectionId: uuid("collection_id").references(() => collections.id, { onDelete: "cascade" }).notNull(),
  productId: uuid("product_id").references(() => products.id, { onDelete: "cascade" }).notNull(),
  position: integer("position").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const reviews = pgTable("reviews", {
  id: uuid("id").defaultRandom().primaryKey(),
  storeId: uuid("store_id").references(() => stores.id, { onDelete: "cascade" }).notNull(),
  productId: uuid("product_id").references(() => products.id, { onDelete: "cascade" }).notNull(),
  customerName: varchar("customer_name", { length: 255 }).notNull(),
  customerPhone: varchar("customer_phone", { length: 20 }),
  rating: integer("rating").notNull(), // 1 to 5
  title: varchar("title", { length: 255 }),
  comment: text("comment").notNull(),
  verifiedPurchase: boolean("verified_purchase").default(false).notNull(),
  status: varchar("status", { length: 50 }).default("approved").notNull(), // 'pending' | 'approved' | 'rejected'
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const banners = pgTable("banners", {
  id: uuid("id").defaultRandom().primaryKey(),
  storeId: uuid("store_id").references(() => stores.id, { onDelete: "cascade" }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  subtitle: text("subtitle"),
  imageUrl: text("image_url").notNull(),
  ctaText: varchar("cta_text", { length: 100 }).default("Shop Now"),
  ctaLink: varchar("cta_link", { length: 255 }).default("/#products"),
  position: integer("position").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
