/**
 * The selling calendar for Indian online shops (/explore/festival-calendar). Fixed-date events carry
 * an exact date; festivals that follow the lunar calendar carry only their usual month, because the
 * date moves every year — sellers should confirm it before planning.
 */

export interface SellingMoment {
  id: string;
  name: string;
  /** 1–12 */
  month: number;
  /** exact day for fixed-date events */
  day?: number;
  /** "Varies" note for lunar festivals */
  when: string;
  kind: "Festival" | "Sale season" | "Gifting day" | "National day";
  sells: string[];
  idea: string;
  /** weeks of lead time to start planning */
  leadWeeks: number;
}

export const SELLING_MOMENTS: SellingMoment[] = [
  { id: "new-year", name: "New Year", month: 1, day: 1, when: "1 January", kind: "Gifting day", sells: ["Planners and stationery", "Party wear", "Gift hampers"], idea: "Launch a “fresh start” edit: planners, self-care and wardrobe basics.", leadWeeks: 4 },
  { id: "makar-sankranti", name: "Makar Sankranti, Pongal & Lohri", month: 1, when: "Mid-January (Lohri the day before)", kind: "Festival", sells: ["Ethnic wear", "Sweets and snacks", "Kites and décor"], idea: "Regional festive collections and sweet boxes for gifting.", leadWeeks: 4 },
  { id: "republic-day", name: "Republic Day sales", month: 1, day: 26, when: "26 January", kind: "Sale season", sells: ["Everything — shoppers expect offers", "Tricolour-themed accessories"], idea: "A short, sharp sale weekend with a clear end date.", leadWeeks: 3 },
  { id: "valentines", name: "Valentine's Day", month: 2, day: 14, when: "14 February", kind: "Gifting day", sells: ["Jewellery", "Candles and fragrance", "Personalised gifts", "Chocolates"], idea: "Gift guides by budget (under ₹499, ₹999, ₹1,999) and free gift notes.", leadWeeks: 4 },
  { id: "womens-day", name: "Women's Day", month: 3, day: 8, when: "8 March", kind: "Gifting day", sells: ["Skincare", "Jewellery", "Women-made products"], idea: "Feature the women behind your brand or your artisans.", leadWeeks: 3 },
  { id: "holi", name: "Holi", month: 3, when: "Usually March (date varies)", kind: "Festival", sells: ["White kurtas", "Natural colours", "Snacks and thandai mixes", "Hair and skin care"], idea: "Pre-Holi skin and hair kits and an all-white edit.", leadWeeks: 4 },
  { id: "eid", name: "Eid", month: 3, when: "Moves about 11 days earlier each year", kind: "Festival", sells: ["Ethnic wear", "Attar and fragrance", "Dry fruits and sweets", "Home décor"], idea: "An Eid edit with early dispatch dates announced clearly.", leadWeeks: 5 },
  { id: "new-year-regional", name: "Ugadi, Gudi Padwa, Baisakhi & Vishu", month: 4, when: "March–April (date varies)", kind: "Festival", sells: ["Traditional wear", "Brass and pooja items", "Regional foods"], idea: "Region-specific collections with local-language captions.", leadWeeks: 4 },
  { id: "akshaya-tritiya", name: "Akshaya Tritiya", month: 4, when: "April–May (date varies)", kind: "Festival", sells: ["Jewellery", "Silver and gold-plated items"], idea: "An auspicious-buys jewellery edit.", leadWeeks: 4 },
  { id: "mothers-day", name: "Mother's Day", month: 5, when: "Second Sunday of May", kind: "Gifting day", sells: ["Sarees", "Jewellery", "Self-care hampers", "Plants"], idea: "Gift-ready bundles and a last-order date for on-time delivery.", leadWeeks: 4 },
  { id: "summer", name: "Summer season", month: 5, when: "April–June", kind: "Sale season", sells: ["Cotton and linen", "Sunscreen", "Cold coffee and beverages", "Travel accessories"], idea: "A breathable-fabrics edit and summer care kits.", leadWeeks: 6 },
  { id: "fathers-day", name: "Father's Day", month: 6, when: "Third Sunday of June", kind: "Gifting day", sells: ["Wallets and leather", "Grooming", "Shirts", "Coffee and tea"], idea: "Gift guides by budget with free gift wrapping.", leadWeeks: 3 },
  { id: "monsoon", name: "Monsoon season", month: 7, when: "July–September", kind: "Sale season", sells: ["Quick-dry clothing", "Footwear", "Home fragrance", "Tea and snacks"], idea: "A cosy-at-home edit and rain-ready essentials.", leadWeeks: 4 },
  { id: "independence-day", name: "Independence Day sales", month: 8, day: 15, when: "15 August", kind: "National day", sells: ["Handloom and Made-in-India", "Everything on offer"], idea: "Celebrate Indian crafts and the makers behind your products.", leadWeeks: 3 },
  { id: "raksha-bandhan", name: "Raksha Bandhan", month: 8, when: "August (date varies)", kind: "Festival", sells: ["Rakhis and hampers", "Gifts for siblings", "Sweets", "Jewellery"], idea: "Rakhi + gift combos and a clear last date for delivery.", leadWeeks: 5 },
  { id: "ganesh-chaturthi", name: "Ganesh Chaturthi & Onam", month: 9, when: "August–September (date varies)", kind: "Festival", sells: ["Eco-friendly décor", "Ethnic wear", "Kasavu sarees", "Sweets"], idea: "Eco-friendly décor and regional festive wear.", leadWeeks: 5 },
  { id: "navratri", name: "Navratri & Durga Puja", month: 10, when: "September–October (date varies)", kind: "Festival", sells: ["Chaniya cholis and colour-of-the-day outfits", "Sarees", "Jewellery", "Pooja items"], idea: "A daily colour guide with matching products.", leadWeeks: 6 },
  { id: "festive-sales", name: "Big festive sale season", month: 10, when: "Late September–October", kind: "Sale season", sells: ["Everything — the biggest shopping weeks of the year"], idea: "Stock up early, plan offers and top up your courier wallet.", leadWeeks: 8 },
  { id: "karwa-chauth", name: "Karwa Chauth", month: 10, when: "October–November (date varies)", kind: "Festival", sells: ["Sarees and suits", "Jewellery", "Mehendi and beauty"], idea: "Bridal-adjacent looks and beauty kits.", leadWeeks: 4 },
  { id: "diwali", name: "Diwali & Dhanteras", month: 11, when: "October–November (date varies)", kind: "Festival", sells: ["Gift hampers", "Diyas, candles and décor", "Ethnic wear", "Jewellery", "Sweets and dry fruits"], idea: "Corporate and family gift boxes, plus a home décor edit.", leadWeeks: 8 },
  { id: "wedding-season", name: "Wedding season", month: 11, when: "November–February", kind: "Sale season", sells: ["Bridal and guest wear", "Jewellery", "Gifts and return favours"], idea: "Guest-outfit guides and bulk gift options.", leadWeeks: 6 },
  { id: "black-friday", name: "Black Friday & Cyber Monday", month: 11, when: "Late November (day after US Thanksgiving)", kind: "Sale season", sells: ["Online-first offers", "Beauty", "Gadgets and accessories"], idea: "A short online-only sale for your followers.", leadWeeks: 3 },
  { id: "christmas", name: "Christmas & year-end", month: 12, day: 25, when: "25 December", kind: "Gifting day", sells: ["Gift sets", "Party wear", "Cakes and treats", "Décor"], idea: "Secret-Santa gift guides under ₹499 and ₹999.", leadWeeks: 5 },
];

export const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
