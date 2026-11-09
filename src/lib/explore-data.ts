export interface TrendingItem {
  id: string;
  title: string;
  category: "Fashion" | "Jewellery" | "Beauty" | "Home" | "Food" | "General";
  growthRate: string;
  season: string;
  description: string;
  targetAudience: string;
  presentationTips: string[];
  suggestedTags: string[];
}

export interface CampaignEvent {
  id: string;
  name: string;
  dateStr: string;
  month: string;
  type: "Indian Festival" | "Global Event" | "Seasonal Sale";
  prepWeeks: number;
  description: string;
  campaignIdea: string;
  discountStrategy: string;
  timeline: {
    week: string;
    action: string;
  }[];
}

export interface CreativeTemplate {
  id: string;
  channel: "WhatsApp" | "Instagram" | "Product Description" | "Flash Sale";
  category: string;
  title: string;
  hook: string;
  body: string;
  cta: string;
}

export interface AcademyLesson {
  id: string;
  title: string;
  readTime: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  category: "Strategy" | "Photography" | "Pricing" | "Marketing" | "Operations" | "SEO";
  summary: string;
  keyTakeaways: string[];
  content: string[];
}

export interface GrowthTask {
  id: string;
  category: "Setup" | "Catalog" | "Payments" | "Marketing" | "Fulfillment";
  title: string;
  impact: "High" | "Medium" | "Essential";
  tip: string;
}

export interface MarketingIdea {
  id: string;
  title: string;
  type: "Bundle" | "Seasonal" | "First Order" | "Retention" | "VIP";
  structure: string;
  example: string;
  benefit: string;
  bestFor: string;
}

export interface PickedRecommendation {
  category: string;
  tagline: string;
  featuredProductIdeas: string[];
  suggestedTheme: {
    slug: string;
    name: string;
    tagline: string;
  };
  recommendedCampaign: {
    title: string;
    action: string;
  };
  marketingSnippet: {
    channel: string;
    text: string;
  };
}

export interface ChangelogItem {
  version: string;
  date: string;
  title: string;
  type: "Feature" | "Improvement" | "Platform Update";
  status: "Released" | "In Progress" | "Planned";
  planRequired?: string;
  highlights: string[];
}

/* -------------------------------------------------------------------------- */
/* TRENDING DATA                                                              */
/* -------------------------------------------------------------------------- */

export const TRENDING_ITEMS: TrendingItem[] = [
  {
    id: "trend-1",
    title: "Oversized Linen Co-ords",
    category: "Fashion",
    growthRate: "+185% search surge",
    season: "Summer & Resort 2026",
    description: "Breathable natural fabrics, relaxed tailoring, and neutral earthy palettes dominating Instagram boutiques and daily wear.",
    targetAudience: "Urban professionals & travelers (22-38 yrs)",
    presentationTips: [
      "Natural window lighting during 4-6 PM golden hour",
      "Short 5-second video showing fabric movement and drape",
      "Style as 3 looks: workwear, brunch, airport comfort"
    ],
    suggestedTags: ["#LinenCoOrd", "#ResortWear", "#SlowFashion", "#Shopersite"]
  },
  {
    id: "trend-2",
    title: "Oxidised Silver Chokers & Jhumkas",
    category: "Jewellery",
    growthRate: "+140% festive velocity",
    season: "Festive & Wedding Season",
    description: "Handcrafted tribal brass and oxidised silver statement jewellery pairing effortlessly with Indo-western and saree looks.",
    targetAudience: "Festive shoppers & college stylists (18-34 yrs)",
    presentationTips: [
      "Macro close-up shots highlighting intricate filigree work",
      "Contrast photography on neutral raw linen or dark slate",
      "Clear dimensions with coin comparison for size confidence"
    ],
    suggestedTags: ["#OxidisedJewellery", "#StatementChoker", "#HandcraftedSilver"]
  },
  {
    id: "trend-3",
    title: "Glass-Skin Korean Sunscreens & Serums",
    category: "Beauty",
    growthRate: "+210% repeat order rate",
    season: "All-Year Daily Essential",
    description: "Lightweight, non-comedogenic sunscreens with Centella & Niacinamide that leave zero white cast on Indian skin tones.",
    targetAudience: "Skincare enthusiasts (20-40 yrs)",
    presentationTips: [
      "Texture swatch on the back of the hand showing finish",
      "Full ingredient transparency with percentage callouts",
      "Side-by-side photo before and after 2-minute absorption"
    ],
    suggestedTags: ["#KBeautyIndia", "#CleanSkincare", "#ZeroWhiteCast"]
  },
  {
    id: "trend-4",
    title: "Artisanal Ceramic Mugs & Matcha Bowls",
    category: "Home",
    growthRate: "+95% gifting surge",
    season: "Monsoon & Winter Warmth",
    description: "Hand-thrown stoneware ceramics with speckled glaze finishes. Popular for morning coffee rituals and thoughtful housewarming gifts.",
    targetAudience: "Work-from-home creators & lifestyle aesthetic lovers (24-45 yrs)",
    presentationTips: [
      "Warm beverage with natural steam in cozy ambient light",
      "Displaying bottom maker stamp for authentic handmade feel",
      "Pairing in gift bundles with wooden stirrers or roasted beans"
    ],
    suggestedTags: ["#StudioPottery", "#HandmadeCeramics", "#CoffeeAesthetic"]
  },
  {
    id: "trend-5",
    title: "Cold-Pressed Soy Wax Scented Candles",
    category: "Home",
    growthRate: "+130% festive velocity",
    season: "Diwali & Winter Gifting",
    description: "Clean-burning soy wax infused with native Indian botanical scents like Jasmine sambac, Darjeeling green tea, and Spiced Oud.",
    targetAudience: "Aromatherapy lovers & premium gifters (22-50 yrs)",
    presentationTips: [
      "Amber glass jars glowing with lit cotton or wooden wick",
      "Clear burn time (40+ hours) and scent note pyramid (Top/Mid/Base)",
      "Festive bundle options with match bottles and brass snuffer"
    ],
    suggestedTags: ["#SoyWaxCandles", "#CleanLiving", "#DiwaliGifting"]
  },
  {
    id: "trend-6",
    title: "Small-Batch Single-Origin Roasted Coffee",
    category: "Food",
    growthRate: "+160% subscription growth",
    season: "All-Year Morning Ritual",
    description: "Chikmagalur and Araku Valley shade-grown Arabica beans roasted in small micro-batches with notes of dark chocolate and caramel.",
    targetAudience: "Coffee connoisseurs & specialty brew hobbyists (23-45 yrs)",
    presentationTips: [
      "Grind size selector (Whole bean, French press, AeroPress, South Indian filter)",
      "Roast date clearly stamped on airtight valve pouch",
      "Brew recipe card tucked into every delivery box"
    ],
    suggestedTags: ["#SpecialtyCoffeeIndia", "#SingleOrigin", "#FreshlyRoasted"]
  }
];

/* -------------------------------------------------------------------------- */
/* CAMPAIGN CALENDAR                                                          */
/* -------------------------------------------------------------------------- */

export const CAMPAIGN_EVENTS: CampaignEvent[] = [
  {
    id: "cal-diwali",
    name: "Diwali Festive Mega Drop",
    dateStr: "Late October – Early November",
    month: "October/November",
    type: "Indian Festival",
    prepWeeks: 5,
    description: "India's biggest shopping season. Highest purchase intent across ethnic apparel, jewellery, luxury home decor, and gourmet sweets.",
    campaignIdea: "Launch a 'Light & Gold' limited-edition drop with premium gift boxing and guaranteed pre-Diwali delivery dates.",
    discountStrategy: "Tiered cart discounts (₹300 off on ₹1,999, ₹700 off on ₹3,499) to push higher average order value.",
    timeline: [
      { week: "5 Weeks Prior", action: "Finalize festival collection inventory, luxury gift boxes & festive tissue wrap." },
      { week: "3 Weeks Prior", action: "Publish lookbook on store, shoot reels, and launch VIP early-access for WhatsApp subscribers." },
      { week: "2 Weeks Prior", action: "Start public sale with countdown banner. Promote pre-paid UPI orders for priority dispatch." },
      { week: "1 Week Prior", action: "Announce courier cut-off dates for guaranteed arrival. Shift focus to local express shipping." }
    ]
  },
  {
    id: "cal-navratri",
    name: "Navratri & Dussehra Festive Edit",
    dateStr: "Early October",
    month: "October",
    type: "Indian Festival",
    prepWeeks: 4,
    description: "9 nights of traditional celebrations, Garba, and new festive beginnings. Massive demand for vibrant ethnic ensembles and accessories.",
    campaignIdea: "Color-of-the-day product edits (9 colors for 9 days) highlighting matching jewellery and lightweight footwear.",
    discountStrategy: "Daily flash offers on matching color outfits with coupon codes like 'GARBA9'.",
    timeline: [
      { week: "4 Weeks Prior", action: "Curate vibrant Chaniya Cholis, mirror-work kurtas, and silver statement jewellery." },
      { week: "2 Weeks Prior", action: "Post 9-day styling guides on Instagram and link directly to curated collections." },
      { week: "1 Week Prior", action: "Launch 'Garba Ready' express shipping collections with guaranteed 48-hour delivery." }
    ]
  },
  {
    id: "cal-karwa",
    name: "Karwa Chauth & Bridal Edit",
    dateStr: "Mid-to-Late October",
    month: "October",
    type: "Indian Festival",
    prepWeeks: 3,
    description: "Emotional gifting and celebratory dressing. Heavy focus on crimson reds, organza sarees, bangles, and thoughtful spouse gifts.",
    campaignIdea: "Curated 'Suhag & Style' gift boxes containing matching bangles, bindi sets, and luxury dry-fruit hampers.",
    discountStrategy: "Bundle saving: Buy a Saree or Anarkali and get jewellery accessory at 30% off.",
    timeline: [
      { week: "3 Weeks Prior", action: "Curate festive red, maroon, and rani pink apparel with matching accessory sets." },
      { week: "2 Weeks Prior", action: "Run targeted reels on couple gifting and traditional morning Sargi gift essentials." },
      { week: "5 Days Prior", action: "Offer personalized handwritten notes with every gift hamper." }
    ]
  },
  {
    id: "cal-blackfriday",
    name: "Black Friday & Cyber Week",
    dateStr: "Late November",
    month: "November",
    type: "Global Event",
    prepWeeks: 3,
    description: "The most anticipated discount event of the year. Indian buyers actively look for clearance deals and holiday shopping bargains.",
    campaignIdea: "Clearance of seasonal overstock paired with a limited 'Black Box' surprise bundle for loyal buyers.",
    discountStrategy: "Flat discounts (Flat 30% / 40% Off) with clear urgency timers in the store announcement bar.",
    timeline: [
      { week: "3 Weeks Prior", action: "Select slow-moving inventory to liquidate and calculate break-even clearance prices." },
      { week: "1 Week Prior", action: "Send 'Early Black Friday' secret discount link to your top 100 repeat customers on WhatsApp." },
      { week: "Event Weekend", action: "Hourly flash price drops on bestsellers to keep visitors checking back." }
    ]
  },
  {
    id: "cal-christmas",
    name: "Christmas & Year-End Gifting",
    dateStr: "December 15 – 31",
    month: "December",
    type: "Seasonal Sale",
    prepWeeks: 4,
    description: "Secret Santa exchanges, holiday parties, cozy winter essentials, and celebratory New Year countdown drops.",
    campaignIdea: "'Secret Santa Under ₹999' curated collection with free festive gift packaging and greeting card included.",
    discountStrategy: "Free premium gift wrapping on all prepaid orders + Buy 2 Get 1 Free on accessories.",
    timeline: [
      { week: "4 Weeks Prior", action: "Stock holiday packaging (ribbons, cinnamon sticks, wax seals) and giftable goods." },
      { week: "2 Weeks Prior", action: "Launch the Secret Santa gift finder with price filters (Under ₹499, Under ₹999, Under ₹1,999)." },
      { week: "1 Week Prior", action: "Highlight digital gift cards or instant e-vouchers for last-minute shoppers." }
    ]
  },
  {
    id: "cal-wedding",
    name: "Winter Wedding Season",
    dateStr: "December – February",
    month: "Winter",
    type: "Seasonal Sale",
    prepWeeks: 4,
    description: "Peak Indian wedding season. High basket size across bridesmaid outfits, groom accessories, return favours, and jewellery.",
    campaignIdea: "'The Bridesmaid Collective' with group discount codes for coordinated bridesmaid or groomsmen outfits.",
    discountStrategy: "Volume tier discounts: 10% off for 2 items, 20% off for 4+ items for bridal parties.",
    timeline: [
      { week: "4 Weeks Prior", action: "Prepare custom sizing consultations and bulk order request forms on your store." },
      { week: "2 Weeks Prior", action: "Showcase real customer wedding styling and bridal trousseau unboxing reels." }
    ]
  }
];

/* -------------------------------------------------------------------------- */
/* CREATIVE LAB                                                               */
/* -------------------------------------------------------------------------- */

export const CREATIVE_TEMPLATES: CreativeTemplate[] = [
  {
    id: "ct-drop-ig",
    channel: "Instagram",
    category: "New Collection Drop",
    title: "Editorial Drop Announcement",
    hook: "The pieces you've been waiting for all season are finally here. ✨",
    body: "Designed in breathable natural fabrics with silhouettes tailored for modern Indian comfort. Every piece is cut in limited small batches to ensure craftsmanship that lasts.\n\nTap the link in bio to shop before your size sells out. Worldwide delivery available. 📦",
    cta: "Link in bio to shop • Limited small batch release"
  },
  {
    id: "ct-wa-vip",
    channel: "WhatsApp",
    category: "VIP Broadcast",
    title: "Exclusive Early Access Message",
    hook: "Hey {Customer_Name}! 👋 A little secret for our VIPs first...",
    body: "Our brand new festive collection drops tomorrow evening, but we've unlocked private early access for our WhatsApp family right now.\n\nUse your exclusive code *VIPSECRET* at checkout for an extra 10% off before the public launch.\n\nExplore the collection here:\n{Store_Link}",
    cta: "Tap to claim VIP access before sizes sell out"
  },
  {
    id: "ct-wa-cart",
    channel: "WhatsApp",
    category: "Abandoned Cart",
    title: "Friendly Non-Pushy Cart Recovery",
    hook: "Hey {Customer_Name}, did you forget something special in your bag? 🛍️",
    body: "We noticed you left {Product_Title} behind. We've reserved it for the next 4 hours so someone else doesn't grab the last piece.\n\nComplete your order in 30 seconds with 1-tap UPI payment:\n{Checkout_Link}\n\nNeed any help with sizing? Just reply here and our team will assist you immediately!",
    cta: "Tap to resume your checkout"
  },
  {
    id: "ct-flash-sale",
    channel: "Flash Sale",
    category: "Urgency Offer",
    title: "24-Hour Midweek Flash Sale",
    hook: "⚡ 24 HOURS ONLY: Midweek Treat",
    body: "Take flat 20% off our best-selling categories when you use code *FLASH20* today.\n\nNo minimum order required. Free express delivery on all orders above ₹999 paid via UPI.\n\nOffer ends tonight at midnight sharp!",
    cta: "Use code FLASH20 at checkout"
  },
  {
    id: "ct-desc-blueprint",
    channel: "Product Description",
    category: "Product Detail Page",
    title: "High-Conversion Product Copy Blueprint",
    hook: "The effortless staple your everyday wardrobe was missing.",
    body: "Crafted from 100% premium woven linen, this piece combines relaxed everyday comfort with structured tailoring.\n\n• FIT: Relaxed, true to size (model is 5'7 wearing size S)\n• FABRIC: 100% pure lightweight linen with gentle pre-wash\n• DETAILS: Wooden buttons, deep functional pockets, reinforced seams\n• CARE: Gentle cold hand wash, dry in shade, warm iron",
    cta: "Add to Bag — Ships within 24 hours"
  }
];

/* -------------------------------------------------------------------------- */
/* SELLER ACADEMY                                                             */
/* -------------------------------------------------------------------------- */

export const ACADEMY_LESSONS: AcademyLesson[] = [
  {
    id: "lesson-1",
    title: "Transitioning from Instagram DMs to a Professional Store",
    readTime: "4 min read",
    level: "Beginner",
    category: "Strategy",
    summary: "Why relying on manual Instagram DMs limits your growth, causes payment slip-ups, and how an automated store multiplies orders.",
    keyTakeaways: [
      "Customers drop off when waiting more than 15 minutes for a DM price response.",
      "Direct UPI QR codes reduce transaction drop-off by up to 60% compared to copy-pasting bank accounts.",
      "Automated stock counts prevent over-selling and embarrassing refund conversations."
    ],
    content: [
      "Selling via Instagram DMs works well when you have 2 orders a day. But when a reel goes viral and 100 people ask 'PP?' (price please), manually messaging back, tracking addresses, and confirming payment screenshots becomes overwhelming.",
      "A dedicated Shopersite store turns passive Instagram scrollers into instant buyers. With link-in-bio integration, buyers select their size, scan the UPI QR code, and receive real-time tracking without waiting for you to reply.",
      "Action Step: Add your store link to your Instagram bio, create a highlighted story named 'How to Order', and configure WhatsApp order alerts."
    ]
  },
  {
    id: "lesson-2",
    title: "Smartphone Product Photography: Studio Quality with Zero Budget",
    readTime: "5 min read",
    level: "Beginner",
    category: "Photography",
    summary: "How to capture editorial product photos using only an iPhone or Android phone, natural sunlight, and inexpensive everyday props.",
    keyTakeaways: [
      "Always shoot in 3:4 aspect ratio for optimal mobile storefront display.",
      "Never use camera flash; indirect window daylight between 9-11 AM and 3-5 PM yields the softest natural shadows.",
      "Clean your camera lens with a microfiber cloth before every single shot."
    ],
    content: [
      "You don't need a ₹1,00,000 DSLR camera to produce compelling product listings. Today's smartphone sensors excel when provided with adequate natural lighting.",
      "Set up a table perpendicular to a large window. Use a white foam board (available for ₹30 at any stationery shop) opposite the window to bounce light back into the shadows.",
      "For backgrounds, avoid busy bedsheets. Opt for neutral raw linen, off-white textured chart paper, or unpolished marble tiles to give your products a high-end editorial feel."
    ]
  },
  {
    id: "lesson-3",
    title: "The Indian D2C Pricing Formula: Factoring Returns & COD Fees",
    readTime: "6 min read",
    level: "Intermediate",
    category: "Pricing",
    summary: "A realistic mathematical approach to pricing Indian e-commerce products ensuring healthy net margins after shipping and return costs.",
    keyTakeaways: [
      "Target a minimum gross markup of 2.5x to 3x on your base manufacturing cost.",
      "Factor in an average 15-20% Return-to-Origin (RTO) allowance on Cash on Delivery orders.",
      "Use ₹50 - ₹99 COD fees to naturally nudge buyers toward instant prepaid UPI."
    ],
    content: [
      "Many new sellers calculate price simply as: Cost Price + Courier = Selling Price + Small Profit. This formula leads to cash-flow shortages because it ignores packaging, RTO shipping costs, and platform fees.",
      "The Healthy D2C Formula: Net Selling Price = (Product Cost + Packaging + Shipping + Estimated RTO Allowance) / (1 - Desired Net Margin %).",
      "Example: If an item costs ₹300 to manufacture and ₹80 to ship, pricing it at ₹799 - ₹899 allows room for promotional coupons and absorbable return logistics without erasing your profit."
    ]
  },
  {
    id: "lesson-4",
    title: "Mastering Customer Retention & VIP WhatsApp Communities",
    readTime: "4 min read",
    level: "Advanced",
    category: "Marketing",
    summary: "How to turn one-time festival shoppers into repeat buyers whose lifetime value powers your brand without continuous advertising spend.",
    keyTakeaways: [
      "Acquiring a new customer costs 5x more than retaining an existing one.",
      "Include an unboxing card with a personalized thank-you note and a 10% discount code for their next order.",
      "Keep WhatsApp broadcasts relevant: max 1 broadcast every 10-14 days to prevent opt-outs."
    ],
    content: [
      "Customer lifetime value is the secret weapon of sustainable Indian D2C brands. Once a buyer experiences fast shipping and accurate sizing, they are 40% more likely to order again within 90 days.",
      "Post-purchase touchpoint: 3 days after delivery, send an automated WhatsApp check-in: 'Hope you loved your order! How did the fit feel?'. If happy, invite them into your VIP broadcast list for secret preview drops.",
      "Offer early access to new collections 24 hours before you post them on Instagram to make VIP buyers feel valued."
    ]
  },
  {
    id: "lesson-5",
    title: "SEO & Discover: Getting Found by Buyers on Google & Social",
    readTime: "5 min read",
    level: "Intermediate",
    category: "SEO",
    summary: "Actionable on-page SEO strategies to rank your Shopersite storefront for product searches in your local and national market.",
    keyTakeaways: [
      "Include descriptive category and material keywords in your product title (e.g., 'Handloom Khadi Cotton Kurta' vs 'Aarav Kurta').",
      "Fill out custom meta descriptions and image alt tags with the city or style search terms.",
      "Link your custom domain or subdomain on Google Business and Instagram Bio."
    ],
    content: [
      "Search engines index clean, lightweight stores quickly. Because Shopersite generates zero-bloat server-rendered HTML with fast mobile load times, your store already enjoys a technical SEO advantage over heavy Shopify themes.",
      "Keyword optimization: When naming products, think about what a customer types into Google. Instead of creative names like 'Azure Dream', name it 'Azure Dream — Royal Blue Organza Silk Saree' so it matches actual search queries.",
      "Ensure your business address and state are listed in your store footer to trigger local Indian Google Discover and map results."
    ]
  }
];

/* -------------------------------------------------------------------------- */
/* GROWTH CHECKLIST                                                           */
/* -------------------------------------------------------------------------- */

export const GROWTH_CHECKLIST: GrowthTask[] = [
  {
    id: "task-1",
    category: "Setup",
    title: "Upload High-Resolution Brand Logo & Tagline",
    impact: "Essential",
    tip: "A crisp vector or PNG logo on transparent/white background builds instant trust with first-time visitors."
  },
  {
    id: "task-2",
    category: "Catalog",
    title: "Add at least 5 products with 3+ photos each",
    impact: "Essential",
    tip: "Shoppers look for front view, back view, and fabric close-up before tapping Add to Bag."
  },
  {
    id: "task-3",
    category: "Catalog",
    title: "Provide Sizing Guide & Fabric Details",
    impact: "High",
    tip: "Clear measurements (bust, length, waist in inches) prevent up to 80% of customer return inquiries."
  },
  {
    id: "task-4",
    category: "Payments",
    title: "Verify Direct UPI ID & Display Custom QR",
    impact: "Essential",
    tip: "Direct UPI payments settle instantly into your bank account with zero platform commission."
  },
  {
    id: "task-5",
    category: "Fulfillment",
    title: "Set Up Free Delivery Threshold (e.g. Free above ₹999)",
    impact: "High",
    tip: "Free shipping thresholds motivate buyers to add one more accessory to qualify for free freight."
  },
  {
    id: "task-6",
    category: "Marketing",
    title: "Create a Welcome Promo Coupon (e.g. FIRST10)",
    impact: "High",
    tip: "A 10% welcome discount lowers hesitation for first-time shoppers browsing your storefront."
  },
  {
    id: "task-7",
    category: "Marketing",
    title: "Integrate WhatsApp Order Notifications",
    impact: "High",
    tip: "Sending instant WhatsApp tracking updates keeps customers informed and eliminates anxious 'Where is my parcel?' messages."
  },
  {
    id: "task-8",
    category: "Setup",
    title: "Publish Return, Refund & Shipping Policies",
    impact: "Essential",
    tip: "Clear policy pages reassure buyers and are required for payment gateway onboarding."
  }
];

/* -------------------------------------------------------------------------- */
/* MARKETING & DISCOUNT BLUEPRINTS                                            */
/* -------------------------------------------------------------------------- */

export const MARKETING_IDEAS: MarketingIdea[] = [
  {
    id: "mkt-bundle",
    title: "The Complementary Bundle Offer",
    type: "Bundle",
    structure: "Buy [Primary Product] + Get [Accessory] at 25% Off",
    example: "Buy any Co-ord Set and add a matching Tote Bag for just ₹399 (Original ₹599).",
    benefit: "Increases Average Order Value (AOV) by 35% without slashing margins on your bestseller.",
    bestFor: "Fashion, Jewellery, Skincare regimens"
  },
  {
    id: "mkt-tiered",
    title: "Tiered Spend Thresholds",
    type: "Seasonal",
    structure: "Spend ₹1,499 get ₹150 off • Spend ₹2,999 get ₹400 off",
    example: "Use code FESTIVE150 above ₹1,499 or FESTIVE400 above ₹2,999.",
    benefit: "Gamifies the checkout experience; shoppers actively add items to hit the next tier savings.",
    bestFor: "Festive drops, Diwali sales, Clearance events"
  },
  {
    id: "mkt-first-order",
    title: "The Friction-Free First Order Hook",
    type: "First Order",
    structure: "Flat ₹100 Off on your first order with zero minimum spend",
    example: "Enter code WELCOME100 at checkout for an instant ₹100 discount.",
    benefit: "Eliminates hesitation for cold traffic coming from Instagram ads or influencer mentions.",
    bestFor: "New store launches and customer acquisition"
  },
  {
    id: "mkt-vip-drop",
    title: "WhatsApp Community Secret Flash Sale",
    type: "VIP",
    structure: "Private 12-Hour Access before public Instagram reveal",
    example: "Private link shared only on WhatsApp broadcast with secret code 'SECRETVIP'.",
    benefit: "Fosters intense brand loyalty and creates natural FOMO among your most dedicated followers.",
    bestFor: "Limited handcrafted stock, artisanal drops"
  },
  {
    id: "mkt-cart-decay",
    title: "Time-Decay Cart Recovery Incentive",
    type: "Retention",
    structure: "Free delivery or 5% coupon valid for 2 hours only",
    example: "Complete your bag in the next 2 hours and we'll upgrade you to Free Express Courier.",
    benefit: "Recovers 20-30% of abandoned carts by introducing immediate time-based scarcity.",
    bestFor: "High-consideration items, custom apparel"
  }
];

/* -------------------------------------------------------------------------- */
/* PICKED FOR YOU (CATEGORY RECOMMENDATIONS)                                  */
/* -------------------------------------------------------------------------- */

export const PICKED_CATEGORIES: Record<string, PickedRecommendation> = {
  Fashion: {
    category: "Fashion & Apparel",
    tagline: "Effortless silhouettes, editorial photography, and size-confidence guides.",
    featuredProductIdeas: ["Oversized Linen Co-ords", "Tiered Maxi Dresses", "Minimalist Cotton Kurtas", "Boxy Graphic Tees"],
    suggestedTheme: {
      slug: "theme04",
      name: "Theme 04",
      tagline: "Bold condensed fashion headlines and modern editorial product panels"
    },
    recommendedCampaign: {
      title: "Seasonal Summer Pop-up & Capsule Drop",
      action: "Launch a 10-piece capsule collection with mix-and-match styling reels on Instagram."
    },
    marketingSnippet: {
      channel: "Instagram Story Hook",
      text: "3 ways to style our bestseller from desk to dinner ✨ Which look is your favorite? Tap link in bio to shop sizes XS - XXL."
    }
  },
  Jewellery: {
    category: "Jewellery & Accessories",
    tagline: "Macro craftsmanship details, anti-tarnish guarantees, and elegant gift boxing.",
    featuredProductIdeas: ["Oxidised Silver Chokers", "Waterproof Stainless Steel Hoops", "Dainty Pearl Pendants", "Layered Evil-Eye Bracelets"],
    suggestedTheme: {
      slug: "classic-bloom",
      name: "Classic Bloom",
      tagline: "Refined serif typography and soft photo framing for timeless elegance"
    },
    recommendedCampaign: {
      title: "Wedding Guest Jewellery Edit",
      action: "Bundle statement earrings with matching bracelets under a single celebratory price."
    },
    marketingSnippet: {
      channel: "WhatsApp VIP Message",
      text: "✨ Tarnish-free & waterproof. Our new everyday jewellery collection is live with complimentary gift boxing for the first 50 orders!"
    }
  },
  Beauty: {
    category: "Beauty & Skincare",
    tagline: "Ingredient transparency, routine bundles, and genuine skin-swatch demonstrations.",
    featuredProductIdeas: ["Rice Water Glow Serums", "Tinted Mineral Lip Balms", "Rosemary Hair Growth Oils", "Gentle Barrier Repair Creams"],
    suggestedTheme: {
      slug: "mono-studio",
      name: "Mono Studio",
      tagline: "Clean, scientific minimalism with sharp divided product grids"
    },
    recommendedCampaign: {
      title: "The 3-Step AM/PM Routine Bundle",
      action: "Package Cleanser + Serum + Moisturizer together with a 15% routine discount."
    },
    marketingSnippet: {
      channel: "Product Reel Caption",
      text: "Zero white cast, zero stickiness. See how our lightweight SPF absorbs in under 60 seconds on camera. Available now with code GLOW10."
    }
  },
  Home: {
    category: "Home & Living",
    tagline: "Warm ambient aesthetics, textural close-ups, and sustainable everyday craft.",
    featuredProductIdeas: ["Hand-Thrown Ceramic Mugs", "Soy Botanical Candles", "Textured Tufted Cushions", "Brass Pooja Urli Sets"],
    suggestedTheme: {
      slug: "theme03",
      name: "Theme 03",
      tagline: "Sporty, clean and photo-led with rounded cards and calm grey panels"
    },
    recommendedCampaign: {
      title: "Festive Home Makeover & Gifting Guide",
      action: "Curate room-by-room bundles (Living Room Calm, Cozy Bedroom Edit) with home styling tips."
    },
    marketingSnippet: {
      channel: "WhatsApp Broadcast",
      text: "Transform your living space with small-batch hand-poured soy candles. Long 45-hour clean burn. Explore our festive scent notes today!"
    }
  },
  Food: {
    category: "Food & Gourmet",
    tagline: "Freshness stamps, regional ingredient heritage, and vacuum-sealed aroma protection.",
    featuredProductIdeas: ["Single-Origin Arabica Coffee", "Artisanal Sourdough & Granola", "Cold-Pressed Native Oils", "Authentic Regional Pickles"],
    suggestedTheme: {
      slug: "theme07",
      name: "Theme 07",
      tagline: "Warm organic palette with prominent product highlights and review badges"
    },
    recommendedCampaign: {
      title: "Fresh Micro-Batch Roasted Weekend Special",
      action: "Accept pre-orders Mon-Wed; roast on Thursday; ship fresh on Friday morning."
    },
    marketingSnippet: {
      channel: "Instagram Announcement",
      text: "Freshly roasted this morning in Chikmagalur. Small batch of just 100 bags available this weekend. Tap link in bio to claim your fresh roast!"
    }
  }
};

/* -------------------------------------------------------------------------- */
/* CHANGELOG & WHAT'S NEW                                                     */
/* -------------------------------------------------------------------------- */

export const PLATFORM_CHANGELOG: ChangelogItem[] = [
  {
    version: "v2.4.0",
    date: "Current Release",
    title: "Explore Ecosystem, Visual Store Customizer & Multi-Theme Engine",
    type: "Platform Update",
    status: "Released",
    highlights: [
      "Launched the Shopersite Explore Ecosystem featuring Trending, Campaign Calendar, Academy, and Calculators.",
      "Expanded theme library to 37 designer storefront themes tailored for Indian D2C categories.",
      "Enhanced live theme editor with real-time desktop & mobile iframe preview and section reordering.",
      "Shiprocket direct fulfillment integration: courier rate comparison, automated AWB generation, and one-tap labels."
    ]
  },
  {
    version: "v2.3.0",
    date: "Recent Update",
    title: "Capacitor 8 Mobile Shells & Native Indian UPI QR Verification",
    type: "Feature",
    status: "Released",
    highlights: [
      "Deployed native Android & iOS app shells via Capacitor 8 with offline fallback support.",
      "Direct UPI zero-aggregator payment flow with unique 12-digit UTR validation to eliminate fraud.",
      "Integrated AES-256-GCM encrypted Secret Box for seller SMTP credentials and API keys.",
      "Automated Indian GST tax invoice generator with CGST/SGST/IGST breakdown."
    ]
  },
  {
    version: "v2.5.0",
    date: "Upcoming Release",
    title: "AI Creative Studio & Automated WhatsApp Marketing Flows",
    type: "Feature",
    status: "In Progress",
    planRequired: "Growth & Pro",
    highlights: [
      "AI-powered automatic background remover and product photo enhancer.",
      "Automated WhatsApp message triggers for abandoned cart recovery with personalized discount links.",
      "Bulk inventory CSV/Excel importer with smart variant column mapping.",
      "Multi-currency support for international NRI diaspora shoppers."
    ]
  },
  {
    version: "v3.0.0",
    date: "Roadmap 2026",
    title: "Omnichannel POS & Multi-Vendor Marketplace Connect",
    type: "Platform Update",
    status: "Planned",
    planRequired: "Pro",
    highlights: [
      "Offline pop-up store POS mode with receipt printing and barcode scanning.",
      "Synchronized inventory sync across Amazon India, Flipkart, and Shopersite.",
      "Custom domain 1-click SSL automated provisioning with Cloudflare Edge caching."
    ]
  }
];

/* -------------------------------------------------------------------------- */
/* COMPARISON DATA                                                            */
/* -------------------------------------------------------------------------- */

export const PLATFORM_COMPARISON = [
  {
    feature: "Transaction Commission on Sales",
    shopersite: "0% Commission (Always)",
    shopify: "0.5% - 2.0% + Payment gateway fee",
    woocommerce: "0% + Expensive hosting/plugin fees"
  },
  {
    feature: "Indian UPI Payments & QR Code",
    shopersite: "Built-in 1-Tap UPI QR straight to your bank",
    shopify: "Requires complex third-party Indian gateway setup",
    woocommerce: "Requires fragile custom Indian plugins"
  },
  {
    feature: "Time to Launch Storefront",
    shopersite: "Under 60 seconds (Mobile first)",
    shopify: "Several hours to days of configuration",
    woocommerce: "Technical setup requiring hosting & developer"
  },
  {
    feature: "Storefront Themes Included",
    shopersite: "37 Modern Minimalist Themes included",
    shopify: "Limited free themes (Paid themes $150 - $400)",
    woocommerce: "Varies, often requires paid third-party builder"
  },
  {
    feature: "Mobile App for Store Management",
    shopersite: "Native Android & iOS Capacitor app included",
    shopify: "Shopify mobile app",
    woocommerce: "Basic WooCommerce app"
  },
  {
    feature: "Monthly Cost",
    shopersite: "Free plan available • Growth ₹199/mo • Pro ₹599/mo",
    shopify: "₹1,999/mo to ₹7,499/mo + expensive app add-ons",
    woocommerce: "₹800 - ₹2,500/mo server hosting + maintenance"
  }
];

