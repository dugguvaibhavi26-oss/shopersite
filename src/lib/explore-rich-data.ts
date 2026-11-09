export interface VisualStory {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  author: string;
  readTime: string;
  date: string;
  imageUrl: string;
  category: "Trending" | "Strategy" | "Festive" | "Design" | "Playbook";
  leadParagraph: string;
  sections: {
    heading: string;
    body: string;
    highlight?: string;
  }[];
  stats?: { label: string; value: string }[];
}

export interface VisualTrend {
  id: string;
  title: string;
  category: "Fashion" | "Jewellery" | "Beauty" | "Home" | "Food" | "Lifestyle";
  growthRate: string;
  velocityRank: number;
  season: string;
  description: string;
  imageUrl: string;
  targetDemographic: string;
  averageBasketSize: string;
  bestSellingPriceRange: string;
  photoStylingGuide: string[];
  productHook: string;
  topSubcategories: string[];
}

export interface FestiveCampaign {
  id: string;
  name: string;
  tagline: string;
  dateStr: string;
  month: string;
  prepWindow: string;
  imageUrl: string;
  expectedOrderSurge: string;
  bestFitCategories: string[];
  overview: string;
  creativeDirection: string;
  discountStrategy: string;
  weeklyRoadmap: {
    phase: string;
    timeline: string;
    tasks: string[];
  }[];
}

export interface AcademyCourse {
  id: string;
  title: string;
  instructor: string;
  duration: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  category: "Photography" | "Pricing & Margins" | "Instagram Scaling" | "WhatsApp Commerce" | "Fulfillment & COD" | "SEO & Traffic";
  imageUrl: string;
  summary: string;
  chaptersCount: number;
  chapters: {
    title: string;
    duration: string;
    summary: string;
    steps: string[];
    proTip: string;
  }[];
}

export interface NewsArticle {
  id: string;
  title: string;
  date: string;
  category: "Feature Release" | "Platform Update" | "Ecosystem" | "Seller Spotlight";
  summary: string;
  imageUrl: string;
  author: string;
  badge: string;
  content: string[];
  keyPoints: string[];
}

/* -------------------------------------------------------------------------- */
/* 1. VISUAL HERO STORIES (MAGAZINE SPOTLIGHTS)                               */
/* -------------------------------------------------------------------------- */

export const HERO_STORIES: VisualStory[] = [
  {
    id: "story-1",
    badge: "Cover Story • D2C Blueprint",
    title: "How Indian Social Sellers Are Turning Instagram DMs Into ₹15L/Month Direct Brands",
    subtitle: "The shift away from manual 'DM for price' to 60-second UPI mobile storefronts with 0% commission.",
    author: "Shopersite Editorial Staff",
    readTime: "6 min read",
    date: "November 2026",
    imageUrl: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&q=80",
    category: "Strategy",
    leadParagraph: "For over five years, Indian social commerce lived inside Instagram direct messages. Sellers spent 6 hours a day typing 'Price sent in DM', copy-pasting UPI handles, and verifying screenshot fraud. Today, a new wave of boutique brands is scaling past ₹15 Lakhs in monthly gross merchandise value without hiring a developer.",
    sections: [
      {
        heading: "The Friction of 'PP in DM'",
        body: "Studies show that 68% of Instagram shoppers drop off when forced to wait more than 15 minutes for a DM price reply. Furthermore, manual payment screenshot verification results in up to 12% duplicate or edited transaction reference fraud. Direct-to-consumer storefronts that load in under 1 second eliminate this entire friction layer.",
        highlight: "68% of potential customers abandon an Instagram purchase if they must wait for a DM response."
      },
      {
        heading: "Direct UPI: India's Unfair E-Commerce Advantage",
        body: "Unlike Western markets reliant on credit card numbers, CVVs, and 2FA OTP delays, India's unified payments interface allows 1-tap QR checkouts directly into the seller's verified bank account. With zero aggregator fees holding your liquidity, independent boutiques keep 100% of their top-line revenue.",
        highlight: "Zero aggregator commissions means high-margin sellers retain full control of their cash flow."
      },
      {
        heading: "The Visual Identity That Converts",
        body: "Modern buyers don't trust cluttered marketplaces. They buy into curated editorial aesthetics: natural window daylight, 3:4 mobile product crops, size transparency, and honest fabric composition breakdowns."
      }
    ],
    stats: [
      { label: "Avg. Conversion Increase", value: "+240%" },
      { label: "Hours Saved / Week on DMs", value: "22 hrs" },
      { label: "Payment Verification Fraud", value: "0%" }
    ]
  },
  {
    id: "story-2",
    badge: "Seasonal Playbook",
    title: "The Festive Gifting Playbook: Preparing Your Store for Peak Indian Celebrations",
    subtitle: "Everything from packaging inventory buffers to time-decay coupon strategies for Diwali and Wedding seasons.",
    author: "Growth & Retention Lab",
    readTime: "5 min read",
    date: "Festive Edition",
    imageUrl: "https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=1200&q=80",
    category: "Festive",
    leadParagraph: "Between October and February, Indian consumer retail spending spikes by more than 350%. Boutiques that prepare their collections 5 weeks in advance capture up to 4x higher average order values through tiered gifting bundles and guaranteed express dispatch.",
    sections: [
      {
        heading: "Curating Gifting Tiers Under ₹1,999",
        body: "Festive shoppers are often buying for relatives, colleagues, and friends. By creating pre-assembled hampers with custom packaging, you eliminate decision fatigue. Price points at ₹499, ₹999, and ₹1,499 represent 72% of impulse gifting purchases.",
        highlight: "Pre-assembled gift boxes increase Average Order Value (AOV) by over 38%."
      },
      {
        heading: "The WhatsApp VIP Secret Window",
        body: "Never launch a festive collection to the public first. Give your WhatsApp subscribers private early access 24 hours prior. This builds genuine brand affinity and guarantees an immediate influx of social proof before your public Instagram drop."
      }
    ],
    stats: [
      { label: "Festive Basket Surge", value: "+350%" },
      { label: "Gift Box Adoption Rate", value: "44%" }
    ]
  }
];

/* -------------------------------------------------------------------------- */
/* 2. TRENDING CATALOG (EXPANDED TO 10 HIGH-VELOCITY D2C CATEGORIES)          */
/* -------------------------------------------------------------------------- */

export const VISUAL_TRENDS: VisualTrend[] = [
  {
    id: "trend-linen",
    title: "Oversized Pure Linen Co-ords",
    category: "Fashion",
    growthRate: "+185% search surge",
    velocityRank: 1,
    season: "Spring / Summer & Resort",
    description: "Relaxed silhouettes cut from 100% natural breathable European linen. Earthy palettes like terracotta, sage green, and raw flax.",
    imageUrl: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80",
    targetDemographic: "Modern women & urban professionals (22-40 yrs)",
    averageBasketSize: "₹2,499",
    bestSellingPriceRange: "₹1,899 – ₹2,999",
    photoStylingGuide: [
      "Natural 4-6 PM golden hour window light against neutral linen or lime-wash wall",
      "Short 6-second video showing movement and breathability of the drape",
      "Model styled with unpolished leather slides and minimal brass jewellery"
    ],
    productHook: "The effortless resort staple your everyday wardrobe was waiting for. Pure natural linen tailored for Indian heat.",
    topSubcategories: ["Camp Collar Sets", "Wide Leg Trousers", "Linen Waistcoats", "Breezy Kaftans"]
  },
  {
    id: "trend-oxidised",
    title: "Tribal Oxidised Silver Statement Jewellery",
    category: "Jewellery",
    growthRate: "+145% festive volume",
    velocityRank: 2,
    season: "Festive, Wedding & Casual Fusion",
    description: "Intricately embossed German silver and oxidised brass statement chokers, layered coin necklaces, and temple jhumkas.",
    imageUrl: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=800&q=80",
    targetDemographic: "College stylists, saree lovers, and festival attendees (18-35 yrs)",
    averageBasketSize: "₹1,299",
    bestSellingPriceRange: "₹699 – ₹1,599",
    photoStylingGuide: [
      "High-contrast macro close-ups highlighting antique patina and filigree work",
      "Photographed on raw slate, dark unbleached khadi, or aged wood",
      "Include a side-by-side coin comparison so buyers immediately understand scale"
    ],
    productHook: "Hand-embossed tribal statement pieces that elevate both white linen shirts and silk sarees in one tap.",
    topSubcategories: ["Mirror-work Chokers", "Chandbali Jhumkas", "Hasli Necklaces", "Adjustable Finger Rings"]
  },
  {
    id: "trend-kbeauty",
    title: "Glass-Skin Centella & Niacinamide Serums",
    category: "Beauty",
    growthRate: "+210% repeat order rate",
    velocityRank: 3,
    season: "All-Year Daily Regimen",
    description: "Ultra-lightweight barrier repair formulations formulated without artificial fragrance. Zero white cast and non-sticky finish.",
    imageUrl: "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=80",
    targetDemographic: "Clean skincare enthusiasts & busy professionals (20-42 yrs)",
    averageBasketSize: "₹1,750",
    bestSellingPriceRange: "₹799 – ₹1,299",
    photoStylingGuide: [
      "Texture swatch drop on back of hand showcasing fast absorption",
      "Full ingredient transparency with percentage callouts on the primary label",
      "Crisp studio lighting with water droplet reflections for hydration visual cues"
    ],
    productHook: "Skin barrier repair formulated specifically for tropical Indian humidity. 0% stickiness, 100% glow.",
    topSubcategories: ["Hyaluronic Toners", "Centella Calming Gel", "Rice Water Serums", "Ceramide Moisturizers"]
  },
  {
    id: "trend-ceramics",
    title: "Hand-Thrown Studio Pottery & Matcha Bowls",
    category: "Home",
    growthRate: "+120% gifting surge",
    velocityRank: 4,
    season: "All-Year Home Aesthetic & Housewarming",
    description: "Stoneware clay fired at 1200°C with organic speckled reactive glazes. Ergonomic thumb-rest mugs and ribbed aesthetic vases.",
    imageUrl: "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80",
    targetDemographic: "Interior designers, remote tech workers, coffee lovers (24-50 yrs)",
    averageBasketSize: "₹1,899",
    bestSellingPriceRange: "₹599 – ₹1,499",
    photoStylingGuide: [
      "Warm morning coffee with gentle steam curling in soft window daylight",
      "Bottom maker stamp clearly shown to establish authentic artisan provenance",
      "Displayed in bundles of 2 with hand-woven coasters"
    ],
    productHook: "Every mug has its own unique fingerprint. Wheel-thrown stoneware that makes your morning brew feel sacred.",
    topSubcategories: ["Speckled Mugs", "Matcha Whisk Bowls", "Fluted Vases", "Pasta Bowls"]
  },
  {
    id: "trend-candles",
    title: "Small-Batch Botanical Soy Wax Candles",
    category: "Home",
    growthRate: "+160% festive surge",
    velocityRank: 5,
    season: "Diwali, Winter & Self-Care",
    description: "Eco-friendly non-toxic soy wax poured in amber glassware with crackling wooden wicks and therapeutic Indian botanical essential oils.",
    imageUrl: "https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=800&q=80",
    targetDemographic: "Mindfulness practitioners, gift shoppers (22-45 yrs)",
    averageBasketSize: "₹1,450",
    bestSellingPriceRange: "₹699 – ₹1,299",
    photoStylingGuide: [
      "Lit wooden wick glowing in warm dimmed ambient light",
      "Fragrance pyramid printed cleanly: Top notes, Heart notes, Base notes",
      "Packaged in corrugated kraft boxes with wax seal accents"
    ],
    productHook: "Infuse your sanctuary with native Darjeeling tea, smoked oud, and night-blooming jasmine. 45+ hours clean burn.",
    topSubcategories: ["Amber Jar Candles", "Concrete Vessel Candles", "Wax Melts", "Reed Diffusers"]
  },
  {
    id: "trend-coffee",
    title: "Single-Origin Shade-Grown Arabica Beans",
    category: "Food",
    growthRate: "+175% subscription surge",
    velocityRank: 6,
    season: "Morning Rituals & Festive Hampers",
    description: "High-altitude micro-lots from Chikmagalur and Biligirirangana Hills. Medium-dark roasts with tasting notes of hazelnut and cacao.",
    imageUrl: "https://images.unsplash.com/photo-1509785307050-d4066910ec1e?auto=format&fit=crop&w=800&q=80",
    targetDemographic: "Specialty brew enthusiasts, espresso hobbyists (24-48 yrs)",
    averageBasketSize: "₹1,650",
    bestSellingPriceRange: "₹450 – ₹950 per 250g",
    photoStylingGuide: [
      "Whole roasted beans pouring from an airtight one-way degassing valve bag",
      "Grind selector visual guide: French Press, AeroPress, South Indian Filter, Espresso",
      "Clear roast date stamped on front badge"
    ],
    productHook: "Roasted to order in small 5kg batches. Experience authentic South Indian mountain terroir in every cup.",
    topSubcategories: ["Medium Roast Arabica", "Cold Brew Blends", "Cascara Tea", "Pour-Over Drippers"]
  },
  {
    id: "trend-chikankari",
    title: "Hand-Embroidered Modal Chikankari Kurtas",
    category: "Fashion",
    growthRate: "+130% summer surge",
    velocityRank: 7,
    season: "Daily Comfort & Festive Festive",
    description: "Pure modal and georgette kurtas hand-embroidered by master artisans in Lucknow with shadow work (Bakhiya) and Ghaspatti motifs.",
    imageUrl: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=800&q=80",
    targetDemographic: "Ethnic wear lovers & daily office goers (20-55 yrs)",
    averageBasketSize: "₹2,800",
    bestSellingPriceRange: "₹1,699 – ₹3,499",
    photoStylingGuide: [
      "Back-lit photo to display delicate needlework sheer pattern",
      "Model walking naturally to highlight buttery modal drape",
      "Paired with silver Afghani earrings and ivory palazzos"
    ],
    productHook: "Authentic Lucknowi hand-embroidery on feather-soft modal cotton. Breathable elegance made for Indian summers.",
    topSubcategories: ["Modal Straight Kurtas", "Anarkali Sets", "Short Kurtis", "Embroidered Dupattas"]
  },
  {
    id: "trend-tarnishproof",
    title: "Waterproof Anti-Tarnish 18K Gold Plated Hoops",
    category: "Jewellery",
    growthRate: "+195% repeat purchase rate",
    velocityRank: 8,
    season: "Daily Wear & Travel",
    description: "Surgical stainless steel coated with vacuum PVD 18K gold. 100% waterproof, sweatproof, and guaranteed anti-tarnish for 2+ years.",
    imageUrl: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=80",
    targetDemographic: "College students, gym-goers, daily minimalists (18-32 yrs)",
    averageBasketSize: "₹1,350",
    bestSellingPriceRange: "₹499 – ₹1,199",
    photoStylingGuide: [
      "Submerged in clear water bowl with gentle bubbles demonstrating waterproof claim",
      "Ear stack styling showing how to combine 3 different hoop sizes",
      "Clean white acrylic pedestal photography"
    ],
    productHook: "Shower in them, swim in them, sweat in them. 18K PVD gold plating that never turns your skin green.",
    topSubcategories: ["Chunky Croissant Hoops", "Dainty Paperclip Chains", "Herringbone Chokers", "Initial Pendants"]
  }
];

/* -------------------------------------------------------------------------- */
/* 3. FESTIVE CAMPAIGN CALENDAR (FULL YEAR ROADMAP)                           */
/* -------------------------------------------------------------------------- */

export const FESTIVE_CALENDAR: FestiveCampaign[] = [
  {
    id: "camp-diwali",
    name: "Diwali Festive Mega Drop",
    tagline: "India's biggest spending festival across apparel, jewellery, luxury decor & hampers.",
    dateStr: "Late October – Early November",
    month: "Oct / Nov",
    prepWindow: "6 Weeks Before",
    imageUrl: "https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=900&q=80",
    expectedOrderSurge: "+380% vs average month",
    bestFitCategories: ["Ethnic Wear", "Jewellery", "Pooja Decor", "Candles", "Gourmet Sweets"],
    overview: "Diwali is the pinnacle of the Indian retail year. Consumers shop with elevated budgets for personal celebrations, corporate gifting, and new beginnings. High AOV bundles and fast prepaid UPI checkout win.",
    creativeDirection: "Warm amber lighting, marigold garlands, brass reflections, and opulent gold accents. Highlight 'Guaranteed Pre-Diwali Delivery' badges across your entire storefront.",
    discountStrategy: "Tiered thresholds: 'Spend ₹2,499 get ₹300 off • Spend ₹4,999 get ₹750 off'. Avoid flat site-wide discounts to protect your margins on high-demand festive stock.",
    weeklyRoadmap: [
      {
        phase: "Phase 1: Inventory & Packaging Buffer",
        timeline: "6 Weeks Out",
        tasks: [
          "Lock production quantities and order 2x festive gift boxes, ribbon rolls, and bubble wrap.",
          "Photograph entire festive lookbook in high-res 3:4 crops.",
          "Upload products in 'Draft' mode to test variant configurations."
        ]
      },
      {
        phase: "Phase 2: VIP Early Access",
        timeline: "3 Weeks Out",
        tasks: [
          "Send private 24h early access link to your WhatsApp VIP community with code 'DIWALIVIP'.",
          "Publish behind-the-scenes packaging reels showing festive gift presentation.",
          "Activate store announcement bar with free express delivery thresholds."
        ]
      },
      {
        phase: "Phase 3: Public Drop & Push",
        timeline: "2 Weeks Out",
        tasks: [
          "Publish public festive collections and run Instagram story countdown stickers.",
          "Nudge prepaid UPI orders to guarantee priority dispatch before couriers get congested.",
          "Offer handwritten festive greeting cards on orders above ₹1,999."
        ]
      },
      {
        phase: "Phase 4: Courier Cut-off & Local Delivery",
        timeline: "1 Week Out",
        tasks: [
          "Clearly display courier cut-off dates for interstate shipping.",
          "Shift promotion to local city express delivery (Dunzo/Porter/Shiprocket Quick)."
        ]
      }
    ]
  },
  {
    id: "camp-wedding",
    name: "Winter Wedding Season",
    tagline: "Peak celebration season for bridesmaids, groomsmen, return gifting, and fine jewellery.",
    dateStr: "December – February",
    month: "Dec – Feb",
    prepWindow: "5 Weeks Before",
    imageUrl: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=900&q=80",
    expectedOrderSurge: "+290% basket value",
    bestFitCategories: ["Bridal Fusion Wear", "Statement Jewellery", "Trousseau Packaging", "Luxury Footwear"],
    overview: "Wedding attendees buy multiple coordinated outfits for Mehendi, Sangeet, Haldi, and Reception. Bundle discounts like 'Buy Outfit + Match Jewellery at 25% Off' trigger effortless upsells.",
    creativeDirection: "Opulent velvet backdrops, celebratory dance movement in video reels, and real customer wedding unboxings.",
    discountStrategy: "Group & Bulk discounts for bridesmaid parties (e.g. 'Order 3+ matching pieces and get 15% off').",
    weeklyRoadmap: [
      {
        phase: "Phase 1: Lookbook Creation",
        timeline: "5 Weeks Out",
        tasks: [
          "Organize catalog into event collections: 'The Haldi Edit', 'Sangeet Glam', 'Reception Classic'.",
          "Add size chart popups with exact bust and length measurements in inches."
        ]
      },
      {
        phase: "Phase 2: Wedding Community Campaign",
        timeline: "3 Weeks Out",
        tasks: [
          "Create Instagram styling guides: 'How to style our choker for 3 different wedding functions'.",
          "Offer custom size alterations consultation via WhatsApp button."
        ]
      }
    ]
  },
  {
    id: "camp-blackfriday",
    name: "Black Friday & Cyber Clearance",
    tagline: "The highest conversion weekend to liquidate seasonal inventory and acquire new buyers.",
    dateStr: "Late November (Friday – Cyber Monday)",
    month: "November",
    prepWindow: "3 Weeks Before",
    imageUrl: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=900&q=80",
    expectedOrderSurge: "+220% sales volume",
    bestFitCategories: ["Western Wear", "Footwear", "Everyday Accessories", "Beauty Kits"],
    overview: "Indian buyers actively scout for genuine discounts during Black Friday. It's the ideal moment to liquidate slow-moving inventory at cost-recovery margins while acquiring email & WhatsApp subscriber leads.",
    creativeDirection: "Bold monochrome typography, black and neon badges, urgent countdown clocks, and 'Once It's Gone, It's Gone' messaging.",
    discountStrategy: "Clearance tiered discounts (Flat 30% / 40% Off) or Mystery BOGO (Buy 1 Get 1 Free on select items).",
    weeklyRoadmap: [
      {
        phase: "Phase 1: Inventory Triage",
        timeline: "3 Weeks Out",
        tasks: [
          "Audit slow-moving SKUs and set clearance discount percentages to clear warehouse shelf space.",
          "Prepare Black Friday announcement banners in the store visual editor."
        ]
      },
      {
        phase: "Phase 2: 72-Hour Flash Blitz",
        timeline: "Event Weekend",
        tasks: [
          "Release hourly doorbuster offers to keep repeat visitors refreshing your storefront.",
          "Broadcast automated cart recovery WhatsApp reminders with a 2-hour validity."
        ]
      }
    ]
  },
  {
    id: "camp-christmas",
    name: "Christmas & Year-End Secret Santa",
    tagline: "Cozy winter fashion, hot chocolate mugs, scented candles & corporate hampers.",
    dateStr: "December 10 – 31",
    month: "December",
    prepWindow: "4 Weeks Before",
    imageUrl: "https://images.unsplash.com/photo-1512389142860-9c449e58a543?auto=format&fit=crop&w=900&q=80",
    expectedOrderSurge: "+260% gifting volume",
    bestFitCategories: ["Candles", "Ceramic Mugs", "Winter Knitwear", "Planners & Stationery", "Gourmet Coffee"],
    overview: "High demand for 'Secret Santa Under ₹999' gift options. Buyers want stress-free gifting where the package arrives pre-wrapped with a festive card.",
    creativeDirection: "Warm evergreen pine needles, cinnamon sticks, knitted wool textures, and festive red ribbon accents.",
    discountStrategy: "Complimentary festive gift boxing on all prepaid orders + Buy 2 Get 1 Free on holiday accessories.",
    weeklyRoadmap: [
      {
        phase: "Phase 1: The Secret Santa Hub",
        timeline: "4 Weeks Out",
        tasks: [
          "Group products by budget filters: 'Under ₹499', 'Under ₹999', 'Under ₹1,999'.",
          "Ensure gift packaging photos are shown prominently on product pages."
        ]
      }
    ]
  }
];

/* -------------------------------------------------------------------------- */
/* 4. SELLER ACADEMY (EXPANDED TO 6 COMPREHENSIVE COURSES WITH CHAPTERS)       */
/* -------------------------------------------------------------------------- */

export const ACADEMY_COURSES: AcademyCourse[] = [
  {
    id: "course-photo",
    title: "Mastering Smartphone Product Photography with Zero Budget",
    instructor: "Visual Styling Collective",
    duration: "18 min total",
    level: "Beginner",
    category: "Photography",
    imageUrl: "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=800&q=80",
    summary: "How to capture editorial-grade e-commerce photos using only your iPhone or Android, natural indirect daylight, and ₹50 everyday props.",
    chaptersCount: 3,
    chapters: [
      {
        title: "Chapter 1: The Magic of Indirect Window Light",
        duration: "5 min",
        summary: "Why flash ruins product colors and how to set up a table perpendicular to a north-facing window for soft, natural wrap-around daylight.",
        steps: [
          "Wipe your smartphone lens with a microfiber cloth before shooting — 80% of blurry photos are simply lens grease.",
          "Position your table 3 feet from a large window between 8:30–11:00 AM or 3:30–5:30 PM.",
          "Place a white foam board opposite the window to bounce soft light back into the shadowed side of the product."
        ],
        proTip: "Never shoot under direct overhead ceiling lights; they cast harsh yellow shadows that distort fabric colors."
      },
      {
        title: "Chapter 2: The 3:4 Aspect Ratio Standard",
        duration: "6 min",
        summary: "Why shooting in 3:4 portrait mode optimizes your photos for both mobile storefronts and Instagram explore feeds.",
        steps: [
          "Set your camera grid lines ON in settings to ensure horizontal lines align perfectly with the horizon.",
          "Keep the product occupying roughly 70% of the frame, leaving 15% breathing room top and bottom.",
          "Lock autofocus and tap the screen to expose for the highlights rather than the shadows."
        ],
        proTip: "Shoot from chest height for apparel on mannequins, and from a 45-degree angle for jewellery and ceramics."
      },
      {
        title: "Chapter 3: Props & Backdrop Textures That Convert",
        duration: "7 min",
        summary: "Inexpensive tactile textures that make a ₹799 product look like a ₹2,500 boutique brand.",
        steps: [
          "Buy unpolished travertine marble tiles or raw linen chart paper from your local market for under ₹200.",
          "Incorporate dry botanical stems (eucalyptus, pampas grass) to add natural depth without distracting from the item.",
          "Always include a scale reference: a model holding the mug, wearing the choker, or carrying the bag."
        ],
        proTip: "Customers return products when color doesn't match real life. Always check your photos on an iPhone and an Android screen side by side."
      }
    ]
  },
  {
    id: "course-pricing",
    title: "The Indian D2C Unit Economics & Pricing Formula",
    instructor: "Platform Financial Insights",
    duration: "22 min total",
    level: "Intermediate",
    category: "Pricing & Margins",
    imageUrl: "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=800&q=80",
    summary: "How to price products sustainably in India, factoring in shipping, 15-20% Return-to-Origin (RTO) on COD, and packaging overheads.",
    chaptersCount: 3,
    chapters: [
      {
        title: "Chapter 1: The Fallacy of Cost + ₹200",
        duration: "7 min",
        summary: "Why new sellers run out of cash by forgetting that shipping returns and packaging eat into raw product margins.",
        steps: [
          "Calculate true landed cost: Raw Material + Artisan Stitching + Branded Box + Bubble Wrap + Courier + Courier Insurance.",
          "Factor in 18% GST if registered, or margin cushion for future tax registration thresholds.",
          "Target a minimum 2.8x to 3.5x markup on base manufacturing cost."
        ],
        proTip: "If a dress costs you ₹350 to produce, pricing it at ₹599 will result in negative cash flow once you factor in one return. Price it at ₹999 to ₹1,199."
      },
      {
        title: "Chapter 2: Mitigating the Cash on Delivery (COD) Trap",
        duration: "8 min",
        summary: "How to reduce RTO from the industry average of 28% down to under 8% using smart incentive architecture.",
        steps: [
          "Charge a nominal ₹60 – ₹99 Cash on Delivery fee to nudge serious buyers toward instant UPI.",
          "Offer 'Free Shipping on all Prepaid UPI Orders' as the primary storefront banner.",
          "Send an automated WhatsApp confirmation asking the buyer to confirm their pincode before dispatching."
        ],
        proTip: "Orders placed between 1 AM and 4 AM on COD have a 45% higher cancellation rate. Always verify early morning COD orders via WhatsApp."
      },
      {
        title: "Chapter 3: The Psychology of Indian Price Points",
        duration: "7 min",
        summary: "Why ₹999 converts 3x higher than ₹1,050, and how tiered cart thresholds boost Average Basket Size.",
        steps: [
          "Use charm pricing ending in 99: ₹499, ₹799, ₹999, ₹1,499, ₹1,999.",
          "Set your Free Shipping threshold at 20% higher than your primary product price (e.g. if your best seller is ₹899, set free shipping at ₹1,199).",
          "Shoppers will gladly add a ₹349 hair accessory or pair of earrings to save on a ₹80 delivery fee."
        ],
        proTip: "Bundle complementary items: 'Buy Dress at ₹1,499 + add matching earrings for just ₹299'."
      }
    ]
  },
  {
    id: "course-retention",
    title: "Mastering WhatsApp Commerce & VIP Community Retention",
    instructor: "Retention & Community Lab",
    duration: "16 min total",
    level: "Advanced",
    category: "WhatsApp Commerce",
    imageUrl: "https://images.unsplash.com/photo-1611591475880-928fb8ff7224?auto=format&fit=crop&w=800&q=80",
    summary: "Turn one-time shoppers into lifelong repeat buyers who generate 60% of your monthly revenue without spending on Meta ads.",
    chaptersCount: 3,
    chapters: [
      {
        title: "Chapter 1: The VIP Early-Access Flywheel",
        duration: "5 min",
        summary: "How to build an opt-in WhatsApp broadcast list where open rates exceed 85%.",
        steps: [
          "Add an opt-in checkbox on your checkout: 'Join our WhatsApp VIP Circle for secret preview drops'.",
          "Never send spammy daily messages. Limit broadcasts to once every 10–14 days.",
          "Give VIPs 24 hours of early access before posting new collection reels on Instagram."
        ],
        proTip: "WhatsApp broadcasts convert at 12–18%, compared to Instagram organic feed reach of just 1.5%."
      },
      {
        title: "Chapter 2: The Unboxing Card That Sparks UGC",
        duration: "6 min",
        summary: "How physical packaging touches drive voluntary Instagram story tags and repeat orders.",
        steps: [
          "Include a tactile handwritten thank-you card with the customer's first name.",
          "Print a QR code linking to their next 10% loyalty discount code: 'Tag us in your stories to unlock'.",
          "Add a sprig of dried lavender, cinnamon, or a miniature botanical sticker."
        ],
        proTip: "When customers share your packaging on their Instagram story, repost it immediately with a warm personal message."
      }
    ]
  }
];

/* -------------------------------------------------------------------------- */
/* 5. NEWSROOM & OFFICIAL PLATFORM DEVELOPMENTS                               */
/* -------------------------------------------------------------------------- */

export const NEWSROOM_ARTICLES: NewsArticle[] = [
  {
    id: "news-1",
    title: "Shopersite Announces Explore Ecosystem & 37 Mobile-First Storefront Themes",
    date: "November 2026",
    category: "Platform Update",
    badge: "Official Announcement",
    author: "Shopersite Product Engineering",
    imageUrl: "https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?auto=format&fit=crop&w=800&q=80",
    summary: "A major evolutionary milestone for Indian social commerce: launching the Explore Ecosystem, live visual storefront customizer, and 37 modern minimalist themes.",
    content: [
      "Today, Shopersite unveils the Explore & Resources Ecosystem alongside an expanded library of 37 mobile-first storefront themes tailored for modern fashion, jewellery, ceramics, and boutique brands.",
      "The release addresses the critical challenge faced by independent Indian creators: professional e-commerce store builders have historically been expensive, bloated, and overly complex for smartphone-first merchants.",
      "With Shopersite's zero-commission philosophy and native direct UPI QR settlement, sellers launch their complete branded destination in under 60 seconds."
    ],
    keyPoints: [
      "37 Category-specific storefront themes with instant mobile & desktop iframe live editing.",
      "Built-in interactive financial utilities: Margin, GST, Discount, and ROAS calculators.",
      "Full educational knowledge base and annual Indian festive campaign calendar."
    ]
  },
  {
    id: "news-2",
    title: "Native Android & iOS Mobile Shells Released via Capacitor 8",
    date: "October 2026",
    category: "Feature Release",
    badge: "Mobile Architecture",
    author: "Core Mobile Team",
    imageUrl: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=800&q=80",
    summary: "Sellers can now manage inventory, approve UPI orders, and track fulfillment on native mobile apps with full offline resiliency.",
    content: [
      "Shopersite mobile applications on Android and iOS are now powered by Capacitor 8 native shells loading the live Next.js production platform.",
      "This architecture guarantees that sellers always experience the latest dashboard features and theme capabilities without waiting for app store update reviews.",
      "Features include system back-button handling, native Google social authentication, deep linking for UPI apps, and instant offline fallback states."
    ],
    keyPoints: [
      "Zero app store review delays: Web deployments instantly reflect in native app shells.",
      "Native Google Account Picker integration avoiding OAuth pop-up blocks in WebViews.",
      "Offline emergency banner and instant order push notifications."
    ]
  },
  {
    id: "news-3",
    title: "Shiprocket Automated Logistics Integration Goes Live",
    date: "September 2026",
    category: "Ecosystem",
    badge: "Logistics & Shipping",
    author: "Integrations & Partnerships",
    imageUrl: "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=800&q=80",
    summary: "Sellers can now compare courier rates across Bluedart, Delhivery, and DTDC, generate shipping labels, and book pickups with one tap.",
    content: [
      "Fulfillment is often the most time-consuming bottleneck for independent boutique brands. Today's integration with Shiprocket automates the entire dispatch pipeline.",
      "From within the Shopersite dashboard, orders seamlessly synchronize with the seller's Shiprocket account. Courier rates are compared in real time, AWBs are assigned, and printable shipping labels with barcodes are produced in seconds."
    ],
    keyPoints: [
      "Automated AWB assignment and printable shipping label generation.",
      "Multi-courier price comparison across top Indian logistics carriers.",
      "Real-time tracking synchronization reflected directly on the buyer's tracking token URL."
    ]
  }
];

