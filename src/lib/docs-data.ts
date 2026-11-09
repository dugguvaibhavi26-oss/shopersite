export interface DocArticle {
  id: string;
  categoryId: string;
  title: string;
  summary: string;
  readTime: string;
  updatedAt: string;
  steps: {
    title: string;
    description: string;
    bulletPoints?: string[];
    codeBlock?: string;
    alert?: {
      type: "note" | "tip" | "warning";
      text: string;
    };
  }[];
  relatedArticles?: string[];
}

export interface DocCategory {
  id: string;
  title: string;
  description: string;
  iconName: string;
  articles: DocArticle[];
}

export const DOCS_CATEGORIES: DocCategory[] = [
  {
    id: "getting-started",
    title: "Getting Started",
    description: "Account creation, store name selection, product catalog setup, and launching your first storefront.",
    iconName: "Rocket",
    articles: [
      {
        id: "create-account",
        categoryId: "getting-started",
        title: "Creating Your Seller Account",
        summary: "Step-by-step guide to signing up on Shopersite using your verified email address or Google account.",
        readTime: "2 min read",
        updatedAt: "November 2026",
        steps: [
          {
            title: "1. Navigate to Registration",
            description: "Visit shopersite.in/register or tap 'Start for free' in the top header navigation bar. You can also sign up directly from the Shopersite Android or iOS app.",
            bulletPoints: [
              "Choose between Email & Password or 1-tap Google Authentication.",
              "If using Email, verify your inbox via the confirmation link to enable store publishing."
            ]
          },
          {
            title: "2. Complete Seller Profile",
            description: "Provide your business name, contact phone number (used for order notifications), and primary store category (e.g., Fashion & Apparel, Jewellery, Skincare, Home Decor).",
            alert: {
              type: "tip",
              text: "Your contact phone number will also be used to send you real-time WhatsApp alerts whenever a customer places a new order."
            }
          }
        ],
        relatedArticles: ["choose-subdomain", "add-first-product"]
      },
      {
        id: "choose-subdomain",
        categoryId: "getting-started",
        title: "Choosing Your Store Name & Subdomain",
        summary: "How to claim your free permanent brand address on shopersite.in.",
        readTime: "3 min read",
        updatedAt: "November 2026",
        steps: [
          {
            title: "1. Claiming Your Subdomain",
            description: "Your storefront address will automatically be accessible at https://[yourbrand].shopersite.in. Subdomains must be 3 to 63 lowercase alphanumeric characters.",
            bulletPoints: [
              "Subdomains can contain letters, numbers, and hyphens (e.g., `lume-fashion`, `roxten`).",
              "Reserved words like `admin`, `api`, `checkout`, and `pay` cannot be registered.",
              "Sellers on the Pro tier can later link their own custom top-level domain (e.g., `www.yourbrand.com`)."
            ]
          },
          {
            title: "2. Setting Your Store Logo & Tagline",
            description: "Upload a square PNG or WebP logo (minimum 400x400 px) with a transparent or white background. Write a concise 1-sentence tagline describing your craft.",
            alert: {
              type: "note",
              text: "Your store name and subdomain can be updated anytime from Dashboard → Settings → General."
            }
          }
        ],
        relatedArticles: ["add-first-product", "custom-domain"]
      },
      {
        id: "add-first-product",
        categoryId: "getting-started",
        title: "Adding Your First Product & Variants",
        summary: "Creating compelling product listings with 3:4 mobile crops, size/color options, pricing, and inventory buffers.",
        readTime: "4 min read",
        updatedAt: "November 2026",
        steps: [
          {
            title: "1. Upload Product Photography",
            description: "Navigate to Dashboard → Products → New Product. Upload up to 6 high-resolution product photos.",
            bulletPoints: [
              "Always use 3:4 vertical aspect ratio (ideal for mobile screens).",
              "Include: (1) Front view, (2) Back view, (3) Fabric/texture close-up, and (4) Styled scale reference."
            ]
          },
          {
            title: "2. Set Pricing & Compare-At MRP",
            description: "Enter your selling price in Indian Rupees (₹). Optionally provide an MRP (Compare-at price) to display a struck-through discount badge on your store.",
            alert: {
              type: "tip",
              text: "Shopersite stores all prices in paise server-side to guarantee mathematical precision without floating-point rounding errors."
            }
          },
          {
            title: "3. Configure Size & Color Variants",
            description: "Tap 'Add Options' to create variant selectors such as Size (XS, S, M, L, XL) or Color (Olive, Terracotta, Ivory). You can manage stock quantities per individual variant."
          }
        ],
        relatedArticles: ["manage-products", "delivery-rates"]
      },
      {
        id: "publish-store",
        categoryId: "getting-started",
        title: "Publishing Your Storefront Live",
        summary: "Taking your store live, generating share cards, and adding your storefront link to Instagram bio and WhatsApp status.",
        readTime: "2 min read",
        updatedAt: "November 2026",
        steps: [
          {
            title: "1. Pre-Launch Verification",
            description: "Before going live, ensure: (1) At least one payment method is active (Direct UPI or COD), (2) Return policy is configured, and (3) You have added at least 3 products.",
            bulletPoints: [
              "Toggle your store status from 'Draft' to 'Published' in Dashboard → Settings.",
              "Open your store link in an incognito window or mobile browser to verify the layout."
            ]
          },
          {
            title: "2. Social Media Distribution",
            description: "Tap 'Share Store' on your dashboard home to copy your store link or download your high-resolution QR code for Instagram stories and packaging inserts."
          }
        ],
        relatedArticles: ["setup-upi", "rto-prevention"]
      }
    ]
  },
  {
    id: "store-management",
    title: "Store Management",
    description: "Day-to-day operations: managing products, processing orders, customer directories, and review moderation.",
    iconName: "Package",
    articles: [
      {
        id: "manage-orders",
        categoryId: "store-management",
        title: "Managing Orders & Fulfillment Workflow",
        summary: "How to process incoming orders from 'Placed' to 'Delivered', manage UPI verification, and issue tracking tokens.",
        readTime: "4 min read",
        updatedAt: "November 2026",
        steps: [
          {
            title: "1. Order Status Lifecycle",
            description: "Every order advances through chronological operational milestones:",
            bulletPoints: [
              "Placed: Order recorded by buyer; awaiting payment verification (for UPI) or merchant confirmation (for COD).",
              "Confirmed: Seller verified payment in bank app or approved COD order.",
              "Packed: Items packed in warehouse; ready for courier pickup.",
              "Shipped: Handed over to courier; AWB tracking number assigned.",
              "Delivered: Successfully handed to customer; return window opens."
            ]
          },
          {
            title: "2. Verifying Direct UPI Payments",
            description: "For UPI orders, the buyer inputs a 12-digit transaction reference (UTR). The order remains in 'Awaiting Verification' until you check your bank app and tap 'Mark as Paid' in the dashboard.",
            alert: {
              type: "warning",
              text: "Never dispatch an order based solely on a customer's screenshot. Always verify the incoming credit and UTR inside your official bank or UPI app first."
            }
          }
        ],
        relatedArticles: ["setup-upi", "shiprocket-integration"]
      },
      {
        id: "manage-discounts",
        categoryId: "store-management",
        title: "Creating Coupons & Promotional Offers",
        summary: "Configuring percentage discounts, flat rupee savings, and minimum cart thresholds.",
        readTime: "3 min read",
        updatedAt: "November 2026",
        steps: [
          {
            title: "1. Discount Configuration",
            description: "Navigate to Dashboard → Discounts → Create Coupon. Define your promo code (e.g. FESTIVE20, WELCOME100).",
            bulletPoints: [
              "Percentage Discount: e.g. 15% off with optional maximum discount cap (e.g. Max ₹300).",
              "Flat Discount: e.g. Flat ₹150 off on orders above ₹1,499.",
              "Minimum Order Value: Sets the cart threshold required before the code unlocks.",
              "Usage Limits: Set total redemptions (e.g. First 100 customers only)."
            ]
          }
        ],
        relatedArticles: ["checkout-rules", "manage-orders"]
      }
    ]
  },
  {
    id: "payments-checkout",
    title: "Payments & Checkout",
    description: "Setting up Direct UPI QR codes, Cash on Delivery (COD) limits, and connecting Razorpay/Cashfree.",
    iconName: "QrCode",
    articles: [
      {
        id: "setup-upi",
        categoryId: "payments-checkout",
        title: "Setting Up Direct UPI Payments",
        summary: "Zero-commission payments settled instantly into your bank account with RBI-compliant direct UPI.",
        readTime: "3 min read",
        updatedAt: "November 2026",
        steps: [
          {
            title: "1. Enter Your Bank VPA / UPI ID",
            description: "In Dashboard → Settings → Payments, enter your verified Virtual Payment Address (e.g. `yourname@okhdfcbank`, `boutique@icici`, `brand@ybl`).",
            alert: {
              type: "note",
              text: "Shopersite never pools, holds, or aggregates buyer funds. Money moves directly from the buyer's UPI app into your personal or current bank account."
            }
          },
          {
            title: "2. The Buyer Experience",
            description: "At checkout, mobile shoppers can tap 'Pay via UPI App' to launch Google Pay, PhonePe, or Paytm automatically. Desktop shoppers scan a dynamically generated QR code on their screen."
          },
          {
            title: "3. Duplicate UTR Prevention",
            description: "To protect merchants, Shopersite maintains a secure `upi_claims` registry. If a malicious user attempts to reuse a previously entered 12-digit UTR, the order placement is instantly blocked."
          }
        ],
        relatedArticles: ["manage-orders", "cod-configuration"]
      },
      {
        id: "cod-configuration",
        categoryId: "payments-checkout",
        title: "Configuring Cash on Delivery (COD) & Fees",
        summary: "Setting COD limits, delivery fees, and automated verification rules to reduce Return-to-Origin (RTO).",
        readTime: "3 min read",
        updatedAt: "November 2026",
        steps: [
          {
            title: "1. Enabling COD",
            description: "In Dashboard → Settings → Payments, toggle Cash on Delivery ON or OFF.",
            bulletPoints: [
              "COD Fee: Set an optional fee (e.g. ₹60 or ₹90) added to cash orders to cover courier cash-collection charges.",
              "Maximum COD Order Value: Prevent high-value cash orders (e.g. Disallow COD on orders exceeding ₹5,000) to protect against transit loss."
            ]
          }
        ],
        relatedArticles: ["setup-upi", "rto-prevention"]
      }
    ]
  },
  {
    id: "shipping-fulfillment",
    title: "Shipping & Fulfillment",
    description: "Delivery fee structures, Free Shipping thresholds, Shiprocket automated logistics, and courier tracking.",
    iconName: "Truck",
    articles: [
      {
        id: "delivery-rates",
        categoryId: "shipping-fulfillment",
        title: "Configuring Delivery Fees & Free Shipping",
        summary: "Setting standard courier fees and free delivery cart thresholds.",
        readTime: "2 min read",
        updatedAt: "November 2026",
        steps: [
          {
            title: "1. Standard Shipping Fee",
            description: "In Dashboard → Settings → Shipping, set your default delivery fee (e.g. ₹70 flat across India).",
            bulletPoints: [
              "Free Delivery Threshold: Set an order value (e.g. Free delivery on orders above ₹999). When reached, shipping is automatically waived at checkout.",
              "Encouraging Upsells: Your storefront cart drawer will dynamically show: 'Add ₹200 more for Free Delivery!'."
            ]
          }
        ],
        relatedArticles: ["shiprocket-integration", "cod-configuration"]
      },
      {
        id: "shiprocket-integration",
        categoryId: "shipping-fulfillment",
        title: "Automated Shipping with Shiprocket",
        summary: "Connecting your Shiprocket account for 1-tap courier rate comparison, AWB assignment, and label printing.",
        readTime: "4 min read",
        updatedAt: "November 2026",
        steps: [
          {
            title: "1. Connecting Your Account",
            description: "Navigate to Dashboard → Plugins → Shiprocket. Enter your Shiprocket API email and password. Your credentials are encrypted server-side using AES-256-GCM encryption.",
            alert: {
              type: "note",
              text: "You pay Shiprocket directly for your courier freight. Shopersite takes 0% commission on shipping charges."
            }
          },
          {
            title: "2. 1-Tap Courier Assignment",
            description: "When an order is confirmed, tap 'Ship with Shiprocket'. The system compares live rates across Delhivery, Bluedart, DTDC, and Shadowfax, assigns your chosen courier, generates the AWB number, and produces a printable shipping label with barcode."
          }
        ],
        relatedArticles: ["manage-orders", "delivery-rates"]
      }
    ]
  },
  {
    id: "store-customization",
    title: "Store Customization",
    description: "Choosing from 37 themes, live visual editor, branding, and custom domain configuration.",
    iconName: "Palette",
    articles: [
      {
        id: "theme-selection",
        categoryId: "store-customization",
        title: "Selecting & Customizing Storefront Themes",
        summary: "Browsing Shopersite's 37 mobile-first themes and customizing sections in the visual editor.",
        readTime: "3 min read",
        updatedAt: "November 2026",
        steps: [
          {
            title: "1. Browsing the Theme Marketplace",
            description: "Visit shopersite.in/themes or Dashboard → Themes. Browse 37 curated themes including Classic Bloom, Mono Studio, Theme 03, Theme 04, and category-specific luxury layouts.",
            bulletPoints: [
              "Live Iframe Preview: Preview any theme on mobile and desktop viewports before activating.",
              "1-Click Activation: Switch your live store design instantly without re-uploading products or resetting catalog data."
            ]
          },
          {
            title: "2. Customizing with the Live Editor",
            description: "Navigate to Dashboard → Editor. Reorder homepage sections (hero sliders, best sellers, category grids, promo strips) using drag-and-drop grips. Customize brand color tokens and typography stacks in real time."
          }
        ],
        relatedArticles: ["custom-domain", "publish-store"]
      },
      {
        id: "custom-domain",
        categoryId: "store-customization",
        title: "Connecting Your Custom Domain (Pro Plan)",
        summary: "How to connect your own domain (e.g. www.yourbrand.com) with automated SSL encryption.",
        readTime: "4 min read",
        updatedAt: "November 2026",
        steps: [
          {
            title: "1. Add Domain in Dashboard",
            description: "Navigate to Dashboard → Settings → Domain (available on the Pro tier). Enter your root or subdomain (e.g., `www.yourbrand.com` or `shop.yourbrand.com`)."
          },
          {
            title: "2. Update DNS Records at Your Registrar",
            description: "Log in to GoDaddy, Namecheap, Cloudflare, or Google Domains. Add the following DNS record:",
            codeBlock: "Type: CNAME\nName: www (or @)\nValue: cname.shopersite.in\nTTL: 3600 (Automatic)",
            alert: {
              type: "tip",
              text: "DNS propagation typically completes within 10 to 45 minutes worldwide. SSL certificates are provisioned automatically via Cloudflare Edge."
            }
          }
        ],
        relatedArticles: ["theme-selection", "choose-subdomain"]
      }
    ]
  },
  {
    id: "settings-billing",
    title: "Settings & Billing",
    description: "Subscription plans, plan upgrade approvals, GST tax invoicing, and notification configuration.",
    iconName: "CreditCard",
    articles: [
      {
        id: "plans-pricing",
        categoryId: "settings-billing",
        title: "Subscription Plans & Feature Limits",
        summary: "Comparison of Free, Growth (₹199/mo), and Pro (₹599/mo) plans.",
        readTime: "3 min read",
        updatedAt: "November 2026",
        steps: [
          {
            title: "1. Plan Tiers Overview",
            description: "Choose the plan that fits your business scale:",
            bulletPoints: [
              "Free Plan (₹0): Up to 75 products, 1 ready-made theme, Cash on Delivery, basic sales analytics, AI product descriptions.",
              "Growth Plan (₹199/mo): Up to 200 products, 7 themes, payment gateway integration, coupons, customer reviews, abandoned cart recovery, Shiprocket integration, bulk CSV upload.",
              "Pro Plan (₹599/mo - ₹299 intro): Unlimited products, all 37 themes, custom domain connection, removed Shopersite branding, automated tax invoices, automated email marketing, full AI store assistant."
            ]
          }
        ],
        relatedArticles: ["custom-domain", "gst-settings"]
      },
      {
        id: "gst-settings",
        categoryId: "settings-billing",
        title: "GST Settings & Automated Tax Invoices",
        summary: "Configuring your GSTIN, setting default tax rates, and generating compliant invoices.",
        readTime: "3 min read",
        updatedAt: "November 2026",
        steps: [
          {
            title: "1. Configure Tax Information",
            description: "In Dashboard → Settings → Taxes, input your 15-character GSTIN and registered state. Specify whether catalog prices are inclusive or exclusive of tax.",
            bulletPoints: [
              "Intra-state sales automatically compute CGST (50%) + SGST (50%).",
              "Inter-state sales automatically compute IGST (100%).",
              "Printable tax invoices are available in 1 tap from any order details page."
            ]
          }
        ],
        relatedArticles: ["plans-pricing", "manage-orders"]
      }
    ]
  },
  {
    id: "developer-api",
    title: "Developer & API Docs",
    description: "REST API specifications, webhook events, and technical architecture for developers.",
    iconName: "Code",
    articles: [
      {
        id: "api-overview",
        categoryId: "developer-api",
        title: "REST API Architecture & Authentication",
        summary: "Overview of Shopersite's JSON REST API endpoints and token authentication.",
        readTime: "5 min read",
        updatedAt: "November 2026",
        steps: [
          {
            title: "1. Base URL & Rate Limits",
            description: "All API requests are served over HTTPS with JSON request and response payloads.",
            codeBlock: "Base URL: https://www.shopersite.in/api\nRate Limit: 60 requests / minute per IP\nAuth Header: Authorization: Bearer <ID_TOKEN>"
          },
          {
            title: "2. Key API Endpoints",
            description: "Core REST routes available for client and server integration:",
            codeBlock: "POST /api/orders/place     - Places new order with server validation\nGET  /api/orders/track     - Fetches live order status by unguessable token\nPOST /api/payments/create  - Generates online payment gateway session\nPOST /api/shiprocket/ship  - Creates automated shipment & courier AWB"
          }
        ],
        relatedArticles: ["plans-pricing", "manage-orders"]
      }
    ]
  }
];

