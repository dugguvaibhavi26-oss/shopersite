/**
 * The plan comparison, block by block, from the plan sheet (Shoppersite_All_Plan_Feature_Blocks.xlsx).
 * Each cell is `true` (included), `false` (not included) or a short text. `soon` marks features
 * that are planned but not built yet.
 */

export type Cell = boolean | string;

export interface PlanRow {
  feature: string;
  free: Cell;
  growth: Cell;
  pro: Cell;
  soon?: boolean;
}

export interface PlanBlock {
  title: string;
  rows: PlanRow[];
}

export const PLAN_BLOCKS: PlanBlock[] = [
  {
    title: "Store setup & catalog",
    rows: [
      { feature: "Products", free: "Up to 75", growth: "Up to 200", pro: "Unlimited" },
      { feature: "Ready-made themes", free: "1 theme", growth: "7 themes", pro: "30 themes" },
      { feature: "Shopersite subdomain", free: true, growth: true, pro: true },
      { feature: "Custom domain", free: false, growth: false, pro: true },
      { feature: "Mobile-friendly store", free: true, growth: true, pro: true },
      { feature: "Categories & collections", free: "Basic", growth: "Advanced", pro: "Advanced" },
      { feature: "Product images & descriptions", free: true, growth: true, pro: true },
    ],
  },
  {
    title: "Design",
    rows: [
      { feature: "Theme editor", free: "Photos only", growth: true, pro: true },
      { feature: "Remove Shopersite branding", free: false, growth: false, pro: true },
    ],
  },
  {
    title: "Orders & payments",
    rows: [
      { feature: "Cash on Delivery", free: true, growth: true, pro: true },
      { feature: "Payment gateway (online payments)", free: false, growth: true, pro: true },
      { feature: "Cart & checkout", free: true, growth: true, pro: true },
      { feature: "Order management & status updates", free: true, growth: true, pro: true },
      { feature: "Automatic invoices", free: false, growth: false, pro: true },
    ],
  },
  {
    title: "Sales & marketing",
    rows: [
      { feature: "Coupons & promo codes", free: false, growth: true, pro: true },
      { feature: "Customer reviews & ratings", free: false, growth: true, pro: true },
      { feature: "Abandoned cart recovery", free: false, growth: true, pro: true },
      { feature: "Product bundles & combo offers", free: true, growth: true, pro: true, soon: true },
      { feature: "SEO settings", free: "Basic", growth: "Basic", pro: "Advanced", soon: true },
      { feature: "Social sharing previews", free: "Basic", growth: "Custom", pro: "Custom", soon: true },
    ],
  },
  {
    title: "Analytics & inventory",
    rows: [
      { feature: "Store overview & sales analytics", free: true, growth: true, pro: true },
      { feature: "Best-selling products", free: true, growth: true, pro: true },
      { feature: "Low-stock alerts", free: true, growth: true, pro: true },
      { feature: "Bulk upload (CSV / Excel)", free: false, growth: true, pro: true },
    ],
  },
  {
    title: "Customers",
    rows: [
      { feature: "Customer list & purchase history", free: true, growth: true, pro: true },
    ],
  },
  {
    title: "Email",
    rows: [
      { feature: "Email integration", free: false, growth: false, pro: true },
      { feature: "Automatic email notifications", free: false, growth: false, pro: true },
    ],
  },
  {
    title: "AI (Roxy)",
    rows: [
      { feature: "AI product descriptions", free: true, growth: true, pro: true },
      { feature: "AI assistant", free: "With limits", growth: "With limits", pro: "Full" },
      { feature: "AI business insights", free: false, growth: false, pro: true, soon: true },
    ],
  },
  {
    title: "Shipping",
    rows: [
      { feature: "Shipping integrations (Shiprocket)", free: false, growth: true, pro: true },
      { feature: "Shipment tracking", free: true, growth: true, pro: true },
    ],
  },
  {
    title: "App & team",
    rows: [
      { feature: "Your store as an Android app", free: false, growth: false, pro: true, soon: true },
      { feature: "Staff & team accounts", free: false, growth: false, pro: true, soon: true },
      { feature: "Role-based permissions", free: false, growth: false, pro: true, soon: true },
    ],
  },
  {
    title: "Support",
    rows: [{ feature: "Support & technical help", free: true, growth: true, pro: true }],
  },
];
