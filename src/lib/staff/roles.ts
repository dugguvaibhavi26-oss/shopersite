/**
 * Staff accounts (Pro): the roles a store owner can give to a team member, and what each one may
 * see and do. Shared by the owner's dashboard, the staff dashboard and the server, so the three
 * can never disagree. The server is the one that enforces it.
 */

export const STAFF_ROLE_IDS = ["order_manager", "product_manager", "fulfilment", "support", "finance"] as const;
export type StaffRole = (typeof STAFF_ROLE_IDS)[number];

/** Who wrote a WorkPlace message: the store owner or one of the staff roles. */
export type TeamRole = StaffRole | "owner";

export type StaffTab = "orders" | "products" | "fulfilment" | "support" | "finance" | "workplace";

/** Things a role is allowed to change. Reading is decided by the role's tabs. */
export type StaffAction = "orders.decide" | "orders.fulfil" | "products.edit";

export interface StaffRoleInfo {
  label: string;
  /** one line for the owner choosing a role */
  about: string;
  tabs: StaffTab[];
  can: StaffAction[];
}

export const STAFF_ROLES: Record<StaffRole, StaffRoleInfo> = {
  order_manager: {
    label: "Order manager",
    about: "Sees new orders with the current stock, and accepts or rejects them.",
    tabs: ["orders", "workplace"],
    can: ["orders.decide"],
  },
  product_manager: {
    label: "Product manager",
    about: "Adds and edits products, prices, photos and stock. Sees no orders or customers.",
    tabs: ["products", "workplace"],
    can: ["products.edit"],
  },
  fulfilment: {
    label: "Fulfilment staff",
    about: "Packs and ships accepted orders: delivery address, items and tracking. No prices beyond cash to collect.",
    tabs: ["fulfilment", "workplace"],
    can: ["orders.fulfil"],
  },
  support: {
    label: "Customer support",
    about: "Looks up orders and customers to answer questions. Can't change anything.",
    tabs: ["support", "workplace"],
    can: [],
  },
  finance: {
    label: "Accountant and finance",
    about: "Sees payments, refunds and totals, and downloads them. No addresses or phone numbers.",
    tabs: ["finance", "workplace"],
    can: [],
  },
};

export const TAB_LABELS: Record<StaffTab, string> = {
  orders: "Orders",
  products: "Products",
  fulfilment: "To pack & ship",
  support: "Orders & customers",
  finance: "Payments",
  workplace: "WorkPlace",
};

export const MAX_STAFF = 10;

export function isStaffRole(v: unknown): v is StaffRole {
  return typeof v === "string" && (STAFF_ROLE_IDS as readonly string[]).includes(v);
}

export function roleLabel(role: TeamRole): string {
  return role === "owner" ? "Owner" : STAFF_ROLES[role]?.label || "Staff";
}

export function roleCan(role: StaffRole, action: StaffAction): boolean {
  return !!STAFF_ROLES[role]?.can.includes(action);
}

export function roleSees(role: StaffRole, tab: StaffTab): boolean {
  return !!STAFF_ROLES[role]?.tabs.includes(tab);
}

/** A 5-digit store ID: 10000 to 99999. */
export function isStoreCode(v: unknown): v is string {
  return typeof v === "string" && /^[1-9]\d{4}$/.test(v);
}

/** What a new staff password must be; "" when it is fine. */
export function passwordProblem(password: string): string {
  if (password.length < 8) return "Use at least 8 characters for the password.";
  if (password.length > 72) return "That password is too long (72 characters at most).";
  return "";
}
