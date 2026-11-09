/** Web addresses no shop can take: our own pages, and names used to trick buyers. */
export const RESERVED_SUBDOMAINS = [
  "www", "app", "api", "admin", "administrator", "dashboard", "login", "signup", "register", "account", "accounts",
  "auth", "billing", "pay", "payment", "payments", "checkout", "support", "help", "mail", "email", "smtp", "ftp",
  "static", "cdn", "assets", "images", "img", "blog", "docs", "status", "legal", "terms", "privacy", "security",
  "shopersite", "official", "team", "staff", "root", "system", "test", "demo", "dev", "staging", "null", "undefined",
  "explore", "resources", "themes",
];

export function isReservedSubdomain(sub: string): boolean {
  return RESERVED_SUBDOMAINS.includes(sub.toLowerCase());
}
