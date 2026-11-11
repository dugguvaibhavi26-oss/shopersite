import type { BannerData, CategoryData, ProductData, ReviewData, StoreData } from "./store-service";
import { toSiteTheme, type SiteThemeSlug } from "./site-content";

/**
 * Sample catalogs shown only while a seller previews a theme from the dashboard, so every theme
 * can be seen with products, categories and banners that suit it. The editor and the live shop
 * always use the shop's own data. Nothing here is ever saved.
 */

const IMG = (id: string, w = 900) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

interface DemoProduct {
  title: string;
  category: string;
  price: number; // rupees
  was?: number; // rupees
  image: string;
  description: string;
  colours?: string[];
  sizes?: string[];
}

interface DemoCatalog {
  categories: { name: string; image: string; subtitle: string }[];
  products: DemoProduct[];
  banners: { title: string; image: string }[];
  /** the sample reviews' names and words, when the shared ones don't suit what the shop sells */
  reviews?: { name: string; text: string }[];
}

const CLOTHING_SIZES = ["S", "M", "L", "XL"];
const SHOE_SIZES = ["UK 6", "UK 7", "UK 8", "UK 9", "UK 10"];
const PLUS_SIZES = ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL"];

const CATALOGS: Record<SiteThemeSlug, DemoCatalog> = {
  // Lume Editorial: womenswear
  "classic-bloom": {
    categories: [
      { name: "Dresses", image: "photo-1747396206869-75ea57b325ce", subtitle: "Easy dresses for warm days" },
      { name: "Tops", image: "photo-1564257631407-4deb1f99d992", subtitle: "Shirts, blouses and knits" },
      { name: "Bags", image: "photo-1473188588951-666fce8e7c68", subtitle: "Leather bags made to last" },
      { name: "Shoes", image: "photo-1603487742131-4160ec999306", subtitle: "Sandals and slides" },
    ],
    products: [
      { title: "Linen Midi Dress", category: "Dresses", price: 3290, was: 3990, image: "photo-1747396206869-75ea57b325ce", description: "Breathable pure linen with a relaxed fit and side pockets.", colours: ["#E8DFD0", "#2B2B2B"], sizes: CLOTHING_SIZES },
      { title: "Floral Sundress", category: "Dresses", price: 2490, image: "photo-1762154057377-cc9d3dd6900c", description: "Light cotton sundress with a soft floral print.", sizes: CLOTHING_SIZES },
      { title: "White Cotton Shirt", category: "Tops", price: 1790, image: "photo-1584030373081-f37b7bb4fa8e", description: "A crisp shirt in soft cotton, easy to dress up or down.", sizes: CLOTHING_SIZES },
      { title: "Floral Print Blouse", category: "Tops", price: 1590, was: 1990, image: "photo-1564257631407-4deb1f99d992", description: "A flowing blouse with a delicate print.", sizes: CLOTHING_SIZES },
      { title: "Yellow Knit Cardigan", category: "Tops", price: 2190, image: "photo-1610288311735-39b7facbd095", description: "Chunky knit cardigan in a warm yellow.", colours: ["#E9B949", "#F3EDE2"], sizes: CLOTHING_SIZES },
      { title: "Leather Satchel", category: "Bags", price: 4490, image: "photo-1473188588951-666fce8e7c68", description: "Full-grain leather satchel with an adjustable strap.", colours: ["#8B5A2B", "#2B2B2B"] },
      { title: "Grey Buckle Bag", category: "Bags", price: 3790, was: 4590, image: "photo-1605733513597-a8f8341084e6", description: "Structured leather bag with gold buckles." },
      { title: "Leather Slide Sandals", category: "Shoes", price: 1890, image: "photo-1603487742131-4160ec999306", description: "Soft leather slides with a cushioned footbed.", sizes: SHOE_SIZES },
    ],
    banners: [
      { title: "Summer edit", image: "photo-1496747611176-843222e1e57c" },
      { title: "Linen season", image: "photo-1764298493197-a1c1cce57800" },
    ],
  },
  // Mono Studio: everyday essentials
  "mono-studio": {
    categories: [
      { name: "T-shirts", image: "photo-1581655353564-df123a1eb820", subtitle: "Heavyweight cotton basics" },
      { name: "Hoodies", image: "photo-1556821840-3a63f95609a7", subtitle: "Soft fleece for every day" },
      { name: "Outerwear", image: "photo-1611312449408-fcece27cdbb7", subtitle: "Jackets and overshirts" },
      { name: "Accessories", image: "photo-1544816155-12df9643f363", subtitle: "Caps, beanies and bags" },
    ],
    products: [
      { title: "Heavyweight White Tee", category: "T-shirts", price: 899, image: "photo-1581655353564-df123a1eb820", description: "240 GSM cotton tee with a boxy, dropped-shoulder fit.", colours: ["#FFFFFF", "#111111", "#8A8F7A"], sizes: CLOTHING_SIZES },
      { title: "Black Long Sleeve Tee", category: "T-shirts", price: 1099, image: "photo-1618354691551-44de113f0164", description: "A clean long sleeve in soft combed cotton.", sizes: CLOTHING_SIZES },
      { title: "Grey Pullover Hoodie", category: "Hoodies", price: 2299, was: 2799, image: "photo-1556821840-3a63f95609a7", description: "Brushed fleece hoodie with a roomy hood and kangaroo pocket.", colours: ["#9A9A9A", "#111111"], sizes: CLOTHING_SIZES },
      { title: "Olive Hooded Jacket", category: "Outerwear", price: 2999, image: "photo-1548883354-94bcfe321cbb", description: "A light hooded jacket in olive, with a full zip.", sizes: CLOTHING_SIZES },
      { title: "Washed Denim Jacket", category: "Outerwear", price: 3499, image: "photo-1611312449408-fcece27cdbb7", description: "A classic trucker jacket in mid-wash denim.", sizes: CLOTHING_SIZES },
      { title: "Check Flannel Overshirt", category: "Outerwear", price: 2199, was: 2699, image: "photo-1611312449412-6cefac5dc3e4", description: "Heavy brushed flannel to wear open or buttoned.", sizes: CLOTHING_SIZES },
      { title: "Ribbed Knit Beanie", category: "Accessories", price: 599, image: "photo-1618354691792-d1d42acfd860", description: "A snug ribbed beanie in soft acrylic.", colours: ["#111111"] },
      { title: "Canvas Tote Bag", category: "Accessories", price: 699, image: "photo-1544816155-12df9643f363", description: "Sturdy natural canvas tote for every day." },
    ],
    banners: [
      { title: "New season basics", image: "photo-1537465978529-d23b17165b3b" },
      { title: "Hoodie weather", image: "photo-1548883354-94bcfe321cbb" },
    ],
  },
  // Theme 03: outdoor and active
  theme03: {
    categories: [
      { name: "Jackets", image: "photo-1571867424485-369464ed33cc", subtitle: "Windbreakers and puffers" },
      { name: "Footwear", image: "photo-1575987116913-e96e7d490b8a", subtitle: "Boots and trail runners" },
      { name: "Bags", image: "photo-1553062407-98eeb64c6a62", subtitle: "Packs for every trip" },
      { name: "Gear", image: "photo-1602143407151-7111542de6e8", subtitle: "Bottles, beanies and more" },
    ],
    products: [
      { title: "Colour Block Windbreaker", category: "Jackets", price: 3299, was: 3999, image: "photo-1571867424485-369464ed33cc", description: "Lightweight, wind-resistant shell that packs into its pocket.", sizes: CLOTHING_SIZES },
      { title: "Black Puffer Jacket", category: "Jackets", price: 5499, image: "photo-1578964046312-69d266a3e739", description: "Insulated puffer that keeps you warm on cold mornings.", sizes: CLOTHING_SIZES },
      { title: "Leather Hiking Boots", category: "Footwear", price: 6299, image: "photo-1575987116913-e96e7d490b8a", description: "Waterproof leather boots with a grippy sole.", sizes: SHOE_SIZES },
      { title: "Trail Running Shoes", category: "Footwear", price: 4799, was: 5499, image: "photo-1580058572462-98e2c0e0e2f0", description: "Light trail shoes with a deep-lug outsole.", sizes: SHOE_SIZES },
      { title: "Everyday Daypack 22L", category: "Bags", price: 2499, image: "photo-1553062407-98eeb64c6a62", description: "Padded laptop sleeve and water-resistant fabric.", colours: ["#111111"] },
      { title: "Trek Backpack 40L", category: "Bags", price: 4299, image: "photo-1501555088652-021faa106b9b", description: "A 40-litre pack with a ventilated back panel." },
      { title: "Steel Water Bottle", category: "Gear", price: 899, image: "photo-1602143407151-7111542de6e8", description: "Double-walled bottle that keeps drinks cold for 24 hours.", colours: ["#3F6B4E"] },
      { title: "Wool Blend Beanie", category: "Gear", price: 699, image: "photo-1576871337632-b9aef4c17ab9", description: "Warm wool blend beanie in four colours.", colours: ["#C0392B", "#2C3E50", "#F1C40F", "#7F8C8D"] },
    ],
    banners: [
      { title: "Into the hills", image: "photo-1551632811-561732d1e306" },
      { title: "Packed for the peak", image: "photo-1586022045497-31fcf76fa6cc" },
    ],
  },
  // Theme 04: city fashion
  theme04: {
    categories: [
      { name: "Jackets", image: "photo-1551028719-00167b16eac5", subtitle: "Leather, trench and tailoring" },
      { name: "Knitwear", image: "photo-1574201635302-388dd92a4c3f", subtitle: "Soft knits for layering" },
      { name: "Denim", image: "photo-1602293589930-45aad59ba3ab", subtitle: "Straight and relaxed fits" },
      { name: "Accessories", image: "photo-1511499767150-a48a237f0083", subtitle: "Sunglasses, bags and boots" },
    ],
    products: [
      { title: "Black Leather Jacket", category: "Jackets", price: 8999, was: 10999, image: "photo-1551028719-00167b16eac5", description: "Soft lambskin biker jacket with silver zips.", sizes: CLOTHING_SIZES },
      { title: "Camel Trench Coat", category: "Jackets", price: 7499, image: "photo-1592327877233-90b9bfd92e48", description: "A belted longline trench in water-resistant cotton.", sizes: CLOTHING_SIZES },
      { title: "Navy Tailored Suit", category: "Jackets", price: 9999, image: "photo-1617137984095-74e4e5e3613f", description: "Slim two-piece suit in a light navy.", sizes: CLOTHING_SIZES },
      { title: "Grey Chunky Sweater", category: "Knitwear", price: 2899, image: "photo-1574201635302-388dd92a4c3f", description: "Cosy chunky knit in a soft grey.", colours: ["#9B9B9B", "#E9E2D6"], sizes: CLOTHING_SIZES },
      { title: "Straight Leg Jeans", category: "Denim", price: 2499, was: 2999, image: "photo-1602293589930-45aad59ba3ab", description: "Rigid denim with a straight, easy leg.", sizes: ["28", "30", "32", "34"] },
      { title: "Black Leather Boots", category: "Accessories", price: 5499, image: "photo-1534233812932-59b8fa1b780c", description: "Polished leather boots with a stacked heel.", sizes: SHOE_SIZES },
      { title: "Round Gold Sunglasses", category: "Accessories", price: 1499, image: "photo-1511499767150-a48a237f0083", description: "Round metal frames with tinted lenses." },
      { title: "Leather Backpack", category: "Accessories", price: 4999, image: "photo-1622560480605-d83c853bc5c3", description: "Tan leather backpack that softens with wear." },
    ],
    banners: [
      { title: "Sharp tailoring", image: "photo-1617127365659-c47fa864d8bc" },
      { title: "Coat season", image: "photo-1676716105765-e19fe6a01851" },
    ],
  },
  // Theme 05: sneakers
  theme05: {
    categories: [
      { name: "Sneakers", image: "photo-1608229751021-ed4bd8677753", subtitle: "Everyday pairs" },
      { name: "Running", image: "photo-1542291026-7eec264c27ff", subtitle: "Built for miles" },
      { name: "Socks", image: "photo-1585499583264-491df5142e83", subtitle: "Soft, cushioned and fun" },
    ],
    products: [
      { title: "Everyday Court Sneaker", category: "Sneakers", price: 3999, image: "photo-1608229751021-ed4bd8677753", description: "Clean white leather sneaker that goes with everything.", colours: ["#FFFFFF", "#111111", "#C9B8A3"], sizes: SHOE_SIZES },
      { title: "Sprint Runner", category: "Running", price: 4499, was: 5999, image: "photo-1542291026-7eec264c27ff", description: "Light running shoe in red and black, with a springy foam sole.", colours: ["#D7262E", "#111111"], sizes: SHOE_SIZES },
      { title: "Classic High-Top", category: "Sneakers", price: 4299, image: "photo-1524532787116-e70228437bbe", description: "Retro high-top in white or green, with a padded collar.", colours: ["#FFFFFF", "#2F6B3F"], sizes: SHOE_SIZES },
      { title: "Night Trainer", category: "Running", price: 4799, image: "photo-1582898967731-b5834427fd66", description: "Cushioned black trainer for runs and gym days.", colours: ["#111111"], sizes: SHOE_SIZES },
      { title: "Canvas Low", category: "Sneakers", price: 2299, was: 2799, image: "photo-1641997465126-c73cc4070337", description: "Lightweight canvas sneaker in black or white, with a rubber sole.", colours: ["#111111", "#FFFFFF"], sizes: SHOE_SIZES },
      { title: "Trail Grip", category: "Running", price: 5299, image: "photo-1581888748626-2a3f240a6f9f", description: "Grey trail shoe with yellow laces, a grippy outsole and a supportive fit.", colours: ["#6B6F73", "#E3D23A"], sizes: SHOE_SIZES },
      { title: "Retro Court Red", category: "Sneakers", price: 4999, image: "photo-1575537302964-96cd47c06b1b", description: "A bold red court shoe with a premium finish.", colours: ["#B3202A"], sizes: SHOE_SIZES },
      { title: "Everyday Socks, 3 pairs", category: "Socks", price: 499, image: "photo-1585499583264-491df5142e83", description: "Cushioned cotton socks in bright stripes.", colours: ["#E9897E", "#2B2B2B", "#F2C200"] },
    ],
    banners: [
      { title: "Made for miles", image: "photo-1456613820599-bfe244172af5" },
      { title: "Fresh pairs, every week", image: "photo-1613972798457-45fc5237ae32" },
    ],
  },
  // E01 (theme06): tech and lifestyle
  theme06: {
    categories: [
      { name: "Audio", image: "photo-1577174881658-0f30ed549adc", subtitle: "Headphones and earbuds" },
      { name: "Wearables", image: "photo-1642101373432-a9c683c34902", subtitle: "Smartwatches for every wrist" },
      { name: "Cameras", image: "photo-1613600143671-234a54c236eb", subtitle: "Instant and film cameras" },
      { name: "Speakers", image: "photo-1608043152269-423dbba4e7e1", subtitle: "Sound for every room" },
      { name: "Charging", image: "photo-1591290619618-904f6dd935e3", subtitle: "Pads, cables and power banks" },
      { name: "Cases", image: "photo-1535157412991-2ef801c1748b", subtitle: "Soft-touch phone cases" },
    ],
    products: [
      { title: "Studio Wireless Headphones", category: "Audio", price: 6999, was: 8499, image: "photo-1577174881658-0f30ed549adc", description: "Soft cushioned headphones with 40-hour battery life.", colours: ["#F4F4F4", "#111111"] },
      { title: "Pro Wireless Earbuds", category: "Audio", price: 4999, image: "photo-1572569511254-d8f925fe2cbb", description: "Noise-cancelling earbuds with a pocket charging case." },
      { title: "Fit Smartwatch", category: "Wearables", price: 5499, image: "photo-1642101373432-a9c683c34902", description: "Heart rate, sleep and workouts on a bright AMOLED screen.", colours: ["#111111", "#C9B8A3"] },
      { title: "Rugged Speaker", category: "Speakers", price: 4499, was: 5499, image: "photo-1608043152269-423dbba4e7e1", description: "A waterproof speaker with deep bass." },
      { title: "Wireless Charging Pad", category: "Charging", price: 1999, image: "photo-1591290619618-904f6dd935e3", description: "Charge your phone and earbuds at 15 W." },
      { title: "Pastel Case Set", category: "Cases", price: 1499, image: "photo-1535157412991-2ef801c1748b", description: "Four soft-touch cases in pastel colours.", colours: ["#E9DDFB", "#BDE4E6", "#F7C9D4", "#2F3542"] },
      { title: "Instant Camera", category: "Cameras", price: 6499, image: "photo-1613600143671-234a54c236eb", description: "Print photos in seconds, wherever you are." },
      { title: "Over-Ear Headphones", category: "Audio", price: 3499, image: "photo-1583394838336-acd977736f90", description: "Rich sound in a light, foldable frame." },
      { title: "Mesh Strap Watch", category: "Wearables", price: 3999, image: "photo-1786103776067-2df6237af61d", description: "Tracks workouts and sleep, with a rose gold mesh strap." },
      { title: "Home Speaker", category: "Speakers", price: 8999, image: "photo-1529359744902-86b2ab9edaea", description: "Room-filling sound with a voice assistant." },
      { title: "Power Bank 20000", category: "Charging", price: 2799, image: "photo-1760708825913-65a50b3dc39b", description: "Charges three devices at once." },
      { title: "Classic Film Camera", category: "Cameras", price: 5299, was: 5999, image: "photo-1563552744114-78ff178ac8de", description: "A 35mm film camera, tested and ready to shoot." },
    ],
    banners: [
      { title: "New in tech", image: "photo-1764137399490-418e64d6ddbb" },
      { title: "Sound, upgraded", image: "photo-1505740420928-5e560c06d30e" },
    ],
  },
  // F01: furniture
  f01: {
    categories: [
      { name: "Chairs", image: "photo-1699588772787-1eed3b726e0a", subtitle: "Dining, lounge and accent chairs" },
      { name: "Sofas", image: "photo-1691480152351-4b3f2c89ccff", subtitle: "Leather and fabric sofas" },
      { name: "Tables", image: "photo-1777513538143-8525eb3943f6", subtitle: "Coffee, side and dining tables" },
      { name: "Lighting", image: "photo-1565814329452-e1efa11c5b89", subtitle: "Pendants and floor lamps" },
      { name: "Storage", image: "photo-1767963758785-b9def36c13e3", subtitle: "Sideboards and shelves" },
    ],
    products: [
      { title: "Nordic Oak Chair", category: "Chairs", price: 12900, image: "photo-1699588772787-1eed3b726e0a", description: "Solid oak dining chair with a sculpted seat and curved back.", colours: ["#C8A27A", "#3B2A1E"] },
      { title: "Tan Club Chair", category: "Chairs", price: 38500, was: 42000, image: "photo-1579656381229-15bdb188da49", description: "Deep club chair in full-grain tan leather on a hardwood frame.", colours: ["#9A5B32"] },
      { title: "Bentwood Lounger", category: "Chairs", price: 24900, image: "photo-1617364852223-75f57e78dc96", description: "Springy bentwood frame with a soft padded cushion." },
      { title: "Leather Shell Chair", category: "Chairs", price: 29900, image: "photo-1572297794908-f2ee5a2930d6", description: "Moulded shell seat wrapped in cognac leather on a swivel base." },
      { title: "Spindle Back Chair", category: "Chairs", price: 9900, image: "photo-1650476524564-f94dc9669067", description: "A classic spindle chair in solid ash, hand-finished." },
      { title: "Chesterfield Sofa", category: "Sofas", price: 89900, image: "photo-1691480152351-4b3f2c89ccff", description: "Three-seater in tufted tan leather with solid wood legs." },
      { title: "Velvet Three-Seater", category: "Sofas", price: 64900, was: 72000, image: "photo-1555041469-a586c61ea9bc", description: "Deep green velvet sofa with feather-wrapped cushions." },
      { title: "Teak Coffee Table", category: "Tables", price: 21900, image: "photo-1777513538143-8525eb3943f6", description: "Low reclaimed-teak coffee table with a lower shelf." },
      { title: "Nesting Side Tables", category: "Tables", price: 11900, image: "photo-1611486212355-d276af4581c0", description: "A pair of walnut nesting tables that tuck away." },
      { title: "Hairpin Writing Desk", category: "Tables", price: 18500, image: "photo-1594125674956-61a9b49c8ecc", description: "Walnut top on brass-finished hairpin legs." },
      { title: "Dome Pendant Light", category: "Lighting", price: 6900, image: "photo-1565814329452-e1efa11c5b89", description: "Matte metal dome pendant with a warm glow." },
      { title: "Oak Sideboard", category: "Storage", price: 54900, image: "photo-1767963758785-b9def36c13e3", description: "Low oak sideboard with sliding doors and soft-close drawers." },
    ],
    banners: [
      { title: "Made for slow living", image: "photo-1765547090903-348b711f0eee" },
      { title: "Visit the workshop", image: "photo-1788296817269-8df0458ab799" },
    ],
  },
  // F02: dining furniture
  f02: {
    categories: [
      { name: "Dining chairs", image: "photo-1705320678447-78c5fe2615a7", subtitle: "Solid wood chairs with soft seats" },
      { name: "Dining tables", image: "photo-1657524398377-567034729507", subtitle: "Tables to gather around" },
      { name: "Benches & stools", image: "photo-1614014246201-14644e9b9c06", subtitle: "Extra seats that slide right in" },
    ],
    products: [
      { title: "Olive Seat Chair", category: "Dining chairs", price: 23490, image: "photo-1705320678447-78c5fe2615a7", description: "Solid oak frame with a soft olive cushion.", colours: ["#6B7A3A", "#C8A27A"] },
      { title: "Walnut Curve Chair", category: "Dining chairs", price: 18390, image: "photo-1730373451883-45a448eb9bfc", description: "A warm walnut chair with a gently curved back." },
      { title: "Round Back Chair", category: "Dining chairs", price: 16900, was: 19900, image: "photo-1748975026839-e68da17878b3", description: "Bent oak back that hugs you as you sit." },
      { title: "Dark Ash Chair", category: "Dining chairs", price: 15490, image: "photo-1666261014484-3b510d161a6d", description: "Dark-stained ash with a woven seat." },
      { title: "Spindle Chair", category: "Dining chairs", price: 12900, image: "photo-1572297794744-a19043e308f8", description: "A light spindle chair in natural beech." },
      { title: "Oak Dining Table", category: "Dining tables", price: 59900, image: "photo-1657524398377-567034729507", description: "Seats six, solid oak top with a soft oil finish." },
      { title: "Black Oak Table", category: "Dining tables", price: 104900, was: 119900, image: "photo-1788104317221-e85195344eb2", description: "A long table in smoked oak for big dinners." },
      { title: "Walnut Side Table", category: "Dining tables", price: 11900, image: "photo-1611486212355-d276af4581c0", description: "A pair of nesting side tables in walnut." },
      { title: "Low Oak Bench", category: "Benches & stools", price: 21900, image: "photo-1614014246201-14644e9b9c06", description: "A long bench that tucks under the table." },
      { title: "Oak Counter Stool", category: "Benches & stools", price: 8900, image: "photo-1634798245965-03669c757183", description: "Counter-height stool with a turned seat." },
    ],
    banners: [
      { title: "The Dusk collection", image: "photo-1547062200-f195b1c77e30" },
      { title: "Made to gather around", image: "photo-1604578762246-41134e37f9cc" },
    ],
    reviews: [
      { name: "Ananya S.", text: "The chairs are so comfortable we now sit at the table long after dinner is over." },
      { name: "Rahul K.", text: "Two men carried the table up three floors, set it up and took every bit of packaging away." },
      { name: "Meera P.", text: "Solid, heavy and not a single wobble. You can feel the oak under your hands." },
      { name: "Arjun T.", text: "They helped us measure our dining room on WhatsApp. The six-seater fits perfectly." },
      { name: "Sana M.", text: "The oil finish has already taken a few spills and wiped clean every time." },
      { name: "Kabir D.", text: "Bought the bench for the kids' side of the table. It's become everyone's favourite seat." },
    ],
  },
  // Theme 07: ceramics
  theme07: {
    categories: [
      { name: "Vases", image: "photo-1675780568075-80ab8f647bae", subtitle: "Southern gardens" },
      { name: "Cups & mugs", image: "photo-1782351094137-14cef7134c18", subtitle: "Heart of the home" },
      { name: "Tableware", image: "photo-1567763745030-bfe9c51bec27", subtitle: "Beauty of nature" },
    ],
    products: [
      { title: "Cloud Bowl Set", category: "Tableware", price: 3790, image: "photo-1530006498959-b7884e829a04", description: "Two deep bowls in a soft white glaze. 15×10 cm." },
      { title: "Speckled Green Cup", category: "Cups & mugs", price: 1290, image: "photo-1782351076283-73aa35f76058", description: "A speckled cup that fits right in your hands. 300 ml." },
      { title: "Moon Jar", category: "Vases", price: 5290, image: "photo-1612196808214-b8e1d6145a8c", description: "A round white jar, thrown in two halves and joined by hand. 24 cm." },
      { title: "Blue Dot Jug", category: "Tableware", price: 2290, image: "photo-1674405053661-d98f7f52be28", description: "A cheerful jug for water, milk or flowers. 1 L." },
      { title: "Blush Vase Trio", category: "Vases", price: 4590, was: 5290, image: "photo-1633738542859-b70b0237b1be", description: "Three pink vases in different sizes." },
      { title: "Floral Bowl Set", category: "Tableware", price: 3450, image: "photo-1567763745030-bfe9c51bec27", description: "Three hand-painted bowls with floral rims." },
      { title: "Rustic Clay Cup", category: "Cups & mugs", price: 1190, image: "photo-1782351094137-14cef7134c18", description: "Raw clay outside, glossy glaze inside. 250 ml." },
      { title: "Speckled Mug", category: "Cups & mugs", price: 1590, image: "photo-1520485521983-bfaa0bc6c80e", description: "A big everyday mug with a speckled glaze. 400 ml." },
      { title: "Sun Candle Holder", category: "Vases", price: 1890, image: "photo-1728551040634-db461e235b1f", description: "A yellow tea-light holder that glows warmly." },
      { title: "Stone Pitcher", category: "Tableware", price: 2690, image: "photo-1478234170285-53301bcf2461", description: "A tall white pitcher with a matte stone finish." },
      { title: "Sea Blue Plate Set", category: "Tableware", price: 4290, was: 4890, image: "photo-1578749556568-bc2c40e68b61", description: "Four dinner plates in a pale sea-blue glaze with raw rims. 27 cm." },
      { title: "Sunny Ruffle Vase", category: "Vases", price: 2890, image: "photo-1784901390624-cdf457c30168", description: "A small yellow vase with a ruffled rim. 18 cm." },
      { title: "Single Bud Vase", category: "Vases", price: 990, image: "photo-1581783342308-f792dbdd27c5", description: "A small white vase for one stem. 11 cm." },
      { title: "Porcelain Cup", category: "Cups & mugs", price: 1390, image: "photo-1514228742587-6b1558fcca3d", description: "A smooth white cup with a rounded handle. 280 ml." },
    ],
    banners: [
      { title: "Southern gardens", image: "photo-1656626277991-0fd06ae52d5c" },
      { title: "Made by hand", image: "photo-1508269151431-a34449ca161d" },
    ],
    reviews: [
      { name: "Ananya S.", text: "My morning coffee tastes better in this mug. Heavy in the hand, and the speckles are lovely." },
      { name: "Rahul K.", text: "Wrapped in so much paper it took ages to unpack. Not a single chip." },
      { name: "Meera P.", text: "The vase is even prettier in person. Every friend who visits asks where it's from." },
      { name: "Arjun T.", text: "Bought the plates for our new home. They go in the dishwasher every night and still look new." },
      { name: "Sana M.", text: "You can tell each piece is made by hand. Mine has a tiny thumbprint near the base and I love it." },
      { name: "Kabir D.", text: "Ordered a custom set of six bowls on WhatsApp. Fired in two weeks, exactly the blue I wanted." },
    ],
  },
  // Theme 08: bags
  theme08: {
    categories: [
      { name: "Shoulder bags", image: "photo-1761646238210-47bd7d592876", subtitle: "Soft shapes for every day" },
      { name: "Top handle", image: "photo-1584917865442-de89df76afd3", subtitle: "Structured and polished" },
      { name: "Totes", image: "photo-1624687943971-e86af76d57de", subtitle: "Room for everything" },
    ],
    products: [
      { title: "Indigo", category: "Shoulder bags", price: 19900, image: "photo-1761646238210-47bd7d592876", description: "A pleated round bag in deep blue, with a curved handle." },
      { title: "Sky", category: "Shoulder bags", price: 18500, image: "photo-1761646238211-f886612a21d6", description: "Soft pleated shoulder bag in pale blue." },
      { title: "Lagoon", category: "Totes", price: 23900, image: "photo-1760624295064-2de890f64524", description: "A roomy teal leather tote for every day." },
      { title: "Blush", category: "Shoulder bags", price: 16900, image: "photo-1566150905458-1bf1fc113f0d", description: "A small crossbody bag in blush leather." },
      { title: "Powder", category: "Top handle", price: 24900, was: 27900, image: "photo-1681747685985-a401c271156c", description: "A structured top-handle bag in soft pink." },
      { title: "Scarlet", category: "Top handle", price: 28000, image: "photo-1584917865442-de89df76afd3", description: "Bold red leather with gold hardware." },
      { title: "Cognac", category: "Totes", price: 25900, image: "photo-1691480150204-66dd1eb77391", description: "A classic tote in rich cognac leather." },
      { title: "Sunshine", category: "Top handle", price: 28900, image: "photo-1640901555383-7335ec5a6476", description: "A bright yellow box bag that lifts any outfit." },
      { title: "Emerald", category: "Top handle", price: 22500, image: "photo-1740961073515-87b7cb625cea", description: "A compact green bag with a short handle." },
      { title: "Ivory", category: "Shoulder bags", price: 21900, image: "photo-1774259479601-69a44c70bed1", description: "Smooth white leather with a silver clasp." },
    ],
    banners: [
      { title: "New season", image: "photo-1594223274512-ad4803739b7c" },
      { title: "Find your shape", image: "photo-1786484215720-7421dec7e56c" },
    ],
  },
  // Theme 09: luxury pet accessories
  theme09: {
    categories: [
      { name: "Collars & leashes", image: "photo-1667716705760-233650f8f3fe", subtitle: "Hand-stitched leather" },
      { name: "Harnesses", image: "photo-1618865843655-e2723e296243", subtitle: "Comfort on every walk" },
      { name: "Beds", image: "photo-1581888227599-779811939961", subtitle: "Soft places to rest" },
      { name: "Bowls & toys", image: "photo-1679224106783-c21b1841412a", subtitle: "For mealtime and play" },
    ],
    products: [
      { title: "Collar – The Classic", category: "Collars & leashes", price: 3990, image: "photo-1667716705760-233650f8f3fe", description: "Red leather collar with brass hardware." },
      { title: "Harness – The Trail", category: "Harnesses", price: 5490, image: "photo-1618865843655-e2723e296243", description: "Padded black harness for long walks." },
      { title: "Leash – The Rope", category: "Collars & leashes", price: 2990, image: "photo-1708062270853-ee7c66b69f07", description: "A soft braided leash in red." },
      { title: "Bed – The Cloud", category: "Beds", price: 8990, image: "photo-1581888227599-779811939961", description: "A plush grey bed with raised sides." },
      { title: "Harness – The Petal", category: "Harnesses", price: 4990, was: 5990, image: "photo-1787561375245-efc541f1ee87", description: "A light harness in soft lilac." },
      { title: "Bed – The Wicker", category: "Beds", price: 6490, image: "photo-1600369671236-e74521d4b6ad", description: "A woven basket bed with a cosy cushion." },
      { title: "Bowl – The Paw", category: "Bowls & toys", price: 1490, image: "photo-1679224106783-c21b1841412a", description: "A heavy non-slip bowl with a paw print." },
      { title: "Toy – The Bone", category: "Bowls & toys", price: 790, image: "photo-1535294435445-d7249524ef2e", description: "A tough rubber bone for chewing and fetch." },
      { title: "Sweater – The Knit", category: "Harnesses", price: 2490, image: "photo-1699686160376-940e512f65f8", description: "A warm knitted sweater for cold walks." },
      { title: "Treats – The Oat Bones", category: "Bowls & toys", price: 590, image: "photo-1568640347023-a616a30bc3bd", description: "Baked oat and peanut biscuits." },
    ],
    banners: [
      { title: "The Harmony collection", image: "photo-1566710582818-d673dc761201" },
      { title: "Made for the walk", image: "photo-1530700131180-d43d9b8cc41f" },
    ],
  },
  // Theme 10: everyday clothing and sneakers
  theme10: {
    categories: [
      { name: "Shoes", image: "photo-1543508282-6319a3e2621f", subtitle: "Sneakers for every day" },
      { name: "Hoodies", image: "photo-1620799140188-3b2a02fd9a77", subtitle: "Soft, warm and easy" },
      { name: "T-shirts", image: "photo-1581655353564-df123a1eb820", subtitle: "Everyday cotton tees" },
      { name: "Jackets", image: "photo-1611312449408-fcece27cdbb7", subtitle: "Layers for cooler days" },
      { name: "Caps", image: "photo-1521369909029-2afed882baee", subtitle: "Finish the look" },
    ],
    products: [
      { title: "Court Low Sneaker", category: "Shoes", price: 4290, image: "photo-1543508282-6319a3e2621f", description: "A clean low-top in black leather with a white stripe.", colours: ["#1B1B1B", "#F4F4F2"], sizes: SHOE_SIZES },
      { title: "Sunset Runner", category: "Shoes", price: 4890, was: 5690, image: "photo-1600185365483-26d7a4cc7519", description: "A white and red runner with a soft, springy sole.", colours: ["#F4F4F2", "#E5604D"], sizes: SHOE_SIZES },
      { title: "Cloud Hoodie", category: "Hoodies", price: 2490, image: "photo-1620799140188-3b2a02fd9a77", description: "A heavy white cotton hoodie with a roomy hood.", sizes: CLOTHING_SIZES },
      { title: "Denim Trucker Jacket", category: "Jackets", price: 3990, image: "photo-1611312449408-fcece27cdbb7", description: "A classic blue denim jacket that softens with wear.", sizes: CLOTHING_SIZES },
      { title: "Navy Daily Trainer", category: "Shoes", price: 3790, image: "photo-1786379582231-f4a593cacf2d", description: "A light navy trainer with a white sole for long days.", colours: ["#233B6E"], sizes: SHOE_SIZES },
      { title: "Sunny Graphic Hoodie", category: "Hoodies", price: 2690, image: "photo-1609873814058-a8928924184a", description: "A bright yellow hoodie with a bold back print.", sizes: CLOTHING_SIZES },
      { title: "Everyday White Tee", category: "T-shirts", price: 890, image: "photo-1581655353564-df123a1eb820", description: "A white crew-neck tee in soft combed cotton.", sizes: CLOTHING_SIZES },
      { title: "Street Runner", category: "Shoes", price: 5290, image: "photo-1631984564919-1f6b2313a71c", description: "A black and orange runner with a chunky sole.", colours: ["#1B1B1B", "#EE7A2B"], sizes: SHOE_SIZES },
      { title: "Cocoa Hoodie", category: "Hoodies", price: 2490, image: "photo-1578768079052-aa76e52ff62e", description: "A relaxed hoodie in warm brown.", sizes: CLOTHING_SIZES },
      { title: "Black Tee Pack", category: "T-shirts", price: 1490, was: 1790, image: "photo-1610502778270-c5c6f4c7d575", description: "Two black crew-neck tees for every day.", sizes: CLOTHING_SIZES },
      { title: "Light Wash Jacket", category: "Jackets", price: 3690, image: "photo-1543076447-215ad9ba6923", description: "A light blue washed denim jacket.", sizes: CLOTHING_SIZES },
      { title: "Washed Grey Cap", category: "Caps", price: 790, image: "photo-1521369909029-2afed882baee", description: "A soft washed cotton cap in grey." },
      { title: "Trucker Cap", category: "Caps", price: 890, image: "photo-1678721938524-1a3ee398de2a", description: "A white and black mesh-back cap." },
    ],
    banners: [
      { title: "New season", image: "photo-1441984904996-e0b6ba687e04" },
      { title: "Everyday layers", image: "photo-1489987707025-afc232f7ea0f" },
    ],
  },
  // Theme 11: running sneakers
  theme11: {
    categories: [
      { name: "Running", image: "photo-1600185365926-3a2ce3cdb9eb", subtitle: "Light shoes for every mile" },
      { name: "Lifestyle", image: "photo-1491553895911-0055eca6402d", subtitle: "Everyday comfort" },
      { name: "Basketball", image: "photo-1631984564919-1f6b2313a71c", subtitle: "Grip and support on court" },
    ],
    products: [
      { title: "Glide Pro Runner", category: "Running", price: 9499, image: "photo-1600185365483-26d7a4cc7519", description: "Our lightest runner, in washed coral and white.", colours: ["#F2A48C", "#FFFFFF"], sizes: SHOE_SIZES },
      { title: "Tempo Racer", category: "Running", price: 8299, image: "photo-1551107696-a4b0c5a0d9a2", description: "A pink and grey racer for fast days.", sizes: SHOE_SIZES },
      { title: "Swift Trainer", category: "Running", price: 7499, was: 8999, image: "photo-1600185365926-3a2ce3cdb9eb", description: "A white and orange trainer with a soft foam sole.", sizes: SHOE_SIZES },
      { title: "Night Pace", category: "Running", price: 6999, image: "photo-1786379582231-f4a593cacf2d", description: "A dark runner made for evening miles.", sizes: SHOE_SIZES },
      { title: "Feather Run", category: "Lifestyle", price: 6499, image: "photo-1491553895911-0055eca6402d", description: "A grey everyday sneaker that weighs almost nothing.", sizes: SHOE_SIZES },
      { title: "Court King High", category: "Basketball", price: 10999, image: "photo-1631984564919-1f6b2313a71c", description: "A high-top with ankle support and a grippy sole.", sizes: SHOE_SIZES },
      { title: "Hoop Elite", category: "Basketball", price: 11999, image: "photo-1605348532760-6753d2c43329", description: "A black and white court shoe with extra cushioning.", sizes: SHOE_SIZES },
      { title: "Mint Canvas Low", category: "Lifestyle", price: 3499, image: "photo-1564518125914-014ebd5f0346", description: "A soft mint canvas sneaker for easy days.", sizes: SHOE_SIZES },
      { title: "Pastel Cloud", category: "Lifestyle", price: 7999, image: "photo-1595950653106-6c9ebd614d3a", description: "A pastel sneaker with a cloud-soft sole.", sizes: SHOE_SIZES },
      { title: "Classic Court White", category: "Lifestyle", price: 5999, image: "photo-1695073621086-aa692bc32a3d", description: "Clean white leather that goes with everything.", sizes: SHOE_SIZES },
      { title: "Volt Trainer", category: "Running", price: 8799, image: "photo-1606107557195-0e29a4b5b4aa", description: "A bright volt trainer for gym and track.", sizes: SHOE_SIZES },
    ],
    banners: [
      { title: "Made for the long run", image: "photo-1515955656352-a1fa3ffcd111" },
      { title: "New drop", image: "photo-1600185365926-3a2ce3cdb9eb" },
    ],
  },
  // Theme 12: bright sneakers and gear
  theme12: {
    categories: [
      { name: "Running", image: "photo-1606107557195-0e29a4b5b4aa", subtitle: "Fast, light, bright" },
      { name: "Lifestyle", image: "photo-1605408499391-6368c628ef42", subtitle: "Everyday pairs" },
      { name: "Accessories", image: "photo-1606483956061-46a898dce538", subtitle: "Caps and bottles" },
    ],
    products: [
      { title: "Velocity Sprint Racer", category: "Running", price: 6990, image: "photo-1606107557195-0e29a4b5b4aa", description: "A volt green racer on a light, springy sole.", sizes: SHOE_SIZES },
      { title: "Ember Runner", category: "Running", price: 6490, image: "photo-1631087606988-a6be38fccaf6", description: "A warm brown knit runner.", sizes: SHOE_SIZES },
      { title: "Olive Sunbeam Runner", category: "Running", price: 5990, image: "photo-1582588678413-dbf45f4823e9", description: "An olive knit runner that breathes on hot days.", sizes: SHOE_SIZES },
      { title: "Retro Revival High-Top", category: "Lifestyle", price: 4990, was: 5990, image: "photo-1790516832949-14964f765b61", description: "A yellow and teal high-top with a retro feel.", sizes: SHOE_SIZES },
      { title: "Petal Low", category: "Lifestyle", price: 5490, image: "photo-1605408499391-6368c628ef42", description: "A black low-top that pops on pink.", sizes: SHOE_SIZES },
      { title: "Shadow Trail Trekker", category: "Running", price: 7490, image: "photo-1518894781321-630e638d0742", description: "A black and white trail shoe with deep grip.", sizes: SHOE_SIZES },
      { title: "Crimson Flyer", category: "Running", price: 7990, image: "photo-1542291026-7eec264c27ff", description: "A red runner with a soft knit upper.", sizes: SHOE_SIZES },
      { title: "Silver Wave", category: "Lifestyle", price: 8490, image: "photo-1746206673199-5b75dcec1018", description: "A silver and white runner with a wavy sole.", sizes: SHOE_SIZES },
      { title: "Steel Water Bottle", category: "Accessories", price: 1290, image: "photo-1544003484-3cd181d17917", description: "Keeps drinks cold for 24 hours. 750 ml." },
      { title: "Sage Water Bottle", category: "Accessories", price: 1190, image: "photo-1602143407151-7111542de6e8", description: "A matte sage bottle that fits any bag. 500 ml." },
      { title: "Red Rush", category: "Lifestyle", price: 6990, image: "photo-1761330461729-6e5aacbf11b8", description: "A bold red and white court sneaker.", sizes: SHOE_SIZES },
      { title: "Pastel Dream", category: "Lifestyle", price: 6290, image: "photo-1602029908596-aea280f6c5a3", description: "A white sneaker with soft yellow and mint details.", sizes: SHOE_SIZES },
      { title: "Black Logo Cap", category: "Accessories", price: 990, image: "photo-1606483956061-46a898dce538", description: "A black cotton cap with a curved peak." },
    ],
    banners: [
      { title: "Fresh drops", image: "photo-1767451436272-daa71c486b96" },
      { title: "Bright pairs", image: "photo-1606107557195-0e29a4b5b4aa" },
    ],
  },
  // Theme 13: donut shop
  theme13: {
    categories: [
      { name: "Classics", image: "photo-1783171375537-af3cca3ba347", subtitle: "Glazed, sugared and sprinkled" },
      { name: "Filled", image: "photo-1570727624862-3008fe67a6be", subtitle: "Soft centres, big flavour" },
      { name: "Boxes", image: "photo-1785386451920-a22dc8eb1206", subtitle: "Boxes to share" },
    ],
    products: [
      { title: "Strawberry Sprinkle", category: "Classics", price: 129, image: "photo-1783171375537-af3cca3ba347", description: "Pink strawberry glaze with rainbow sprinkles." },
      { title: "Raspberry Crunch", category: "Filled", price: 149, image: "photo-1570727624862-3008fe67a6be", description: "Filled with raspberry jam, topped with sprinkles." },
      { title: "Pink Glaze", category: "Classics", price: 119, image: "photo-1626094309830-abbb0c99da4a", description: "A soft ring with a glossy pink glaze." },
      { title: "Choco Sprinkle", category: "Classics", price: 129, image: "photo-1606312618137-72b28d41df4b", description: "Dark chocolate glaze and crunchy sprinkles." },
      { title: "Rose Velvet", category: "Filled", price: 159, image: "photo-1777972303314-74d4e450e01b", description: "Filled with rose cream, finished with gold sprinkles." },
      { title: "Strawberry Pair", category: "Boxes", price: 229, was: 258, image: "photo-1533910534207-90f31029a78e", description: "Two strawberry donuts with sprinkles." },
      { title: "Rainbow Trio", category: "Boxes", price: 349, image: "photo-1783171375527-4aee7f7e64de", description: "Three donuts with different glazes and toppings." },
      { title: "Mint Swirl Stack", category: "Boxes", price: 399, image: "photo-1631397833242-fc6213046352", description: "Three mint-glazed donuts with sprinkles." },
      { title: "Golden Honey Stack", category: "Boxes", price: 379, image: "photo-1464347477106-7648bc26261b", description: "Four honey-glazed donuts with sprinkles." },
      { title: "Chocolate Drizzle Box", category: "Boxes", price: 449, image: "photo-1551106652-a5bcf4b29ab6", description: "Three chocolate donuts with a white drizzle." },
      { title: "Party Box", category: "Boxes", price: 799, image: "photo-1785386451920-a22dc8eb1206", description: "Twelve mixed donuts: glazed, sugared and sprinkled." },
      { title: "Celebration Stack", category: "Filled", price: 499, image: "photo-1551024601-bec78aea704b", description: "A tower of filled donuts with drizzle and sprinkles." },
    ],
    banners: [
      { title: "Fresh every morning", image: "photo-1644501963068-a779762d3673" },
      { title: "Boxes to share", image: "photo-1785386451920-a22dc8eb1206" },
    ],
  },
  // Theme 14: spice blends
  theme14: {
    categories: [
      { name: "Blends", image: "photo-1742748912566-b2f1851e6021", subtitle: "Ready-mixed for every dish" },
      { name: "Chilli", image: "photo-1486548730767-5c679e8eda6b", subtitle: "From warm to fiery" },
      { name: "Herbs & tea", image: "photo-1677339443020-e37769511005", subtitle: "Dried herbs and tea blends" },
    ],
    products: [
      { title: "Cosiness", category: "Blends", price: 349, image: "photo-1594813592990-2449cd47da8b", description: "A warm garam masala with cinnamon and clove. 100 g." },
      { title: "Intensity", category: "Chilli", price: 299, image: "photo-1612078727125-4d6715a7e1b7", description: "A deep red chilli rub for grills and curries. 100 g." },
      { title: "Passion", category: "Chilli", price: 319, image: "photo-1602158335077-18c4fe45f6ca", description: "Smoked paprika with garlic and a little heat. 100 g." },
      { title: "Sweetness", category: "Blends", price: 279, image: "photo-1590692436462-19f981d30d33", description: "Chai spice with cardamom, ginger and cinnamon. 80 g." },
      { title: "Freshness", category: "Herbs & tea", price: 259, image: "photo-1677339443020-e37769511005", description: "Garden herbs for pasta, salads and roast vegetables. 50 g." },
      { title: "Crunch", category: "Blends", price: 239, image: "photo-1754513345664-7b8df119ceb7", description: "A toasted seed mix to sprinkle on anything. 120 g." },
      { title: "Calm", category: "Herbs & tea", price: 289, image: "photo-1754513346375-174bb9d083f1", description: "A herbal tea blend with chamomile and lemongrass. 60 g." },
      { title: "Brightness", category: "Blends", price: 269, was: 319, image: "photo-1617854307432-13950e24ba07", description: "Lemon pepper with sea salt and dried zest. 100 g." },
      { title: "Discovery Box", category: "Blends", price: 999, image: "photo-1742748912566-b2f1851e6021", description: "Six of our favourite blends in small tins." },
      { title: "Market Mix", category: "Chilli", price: 349, image: "photo-1486548730767-5c679e8eda6b", description: "Chilli, turmeric and cumin in one bold blend. 100 g." },
    ],
    banners: [
      { title: "Discover new tastes", image: "photo-1781773338964-bc0e969d2973" },
      { title: "Ground fresh", image: "photo-1635355995448-77b02d33621d" },
    ],
  },
  // Theme 15: fruit sodas
  theme15: {
    categories: [
      { name: "Cans", image: "photo-1781560149615-81883cdd1eec", subtitle: "Single flavours" },
      { name: "Packs", image: "photo-1781560149508-6e7331c69e59", subtitle: "Mixed packs to share" },
    ],
    products: [
      { title: "Mandarin Fizz", category: "Cans", price: 99, image: "photo-1781560149615-81883cdd1eec", description: "Bright and juicy. Sweet mandarin with a gentle fizz." },
      { title: "Guava Glow", category: "Cans", price: 99, image: "photo-1781559310444-f7f39d68c932", description: "Tropical and smooth. Ripe guava, lightly sparkling." },
      { title: "Strawberry Pop", category: "Cans", price: 99, image: "photo-1781560149535-5d26b925f174", description: "Sweet strawberry with a tangy finish." },
      { title: "Pineapple Guava", category: "Cans", price: 109, image: "photo-1781560149522-9797714b5c84", description: "Pineapple and guava. Our most refreshing can." },
      { title: "Orange Zest", category: "Cans", price: 99, image: "photo-1781560149889-21e394a4175f", description: "Zesty orange peel, crisp and cooling." },
      { title: "Citrus Trio", category: "Packs", price: 279, image: "photo-1781560149508-6e7331c69e59", description: "One each of strawberry, mandarin and guava." },
      { title: "Sunny Mix", category: "Packs", price: 289, image: "photo-1781559310925-3f34116c0636", description: "Three sunny flavours in one pack." },
      { title: "Fruit Fiesta", category: "Packs", price: 299, image: "photo-1781560149414-bd24871a00d3", description: "A three-can pack for picnics." },
      { title: "Share Pack", category: "Packs", price: 549, was: 599, image: "photo-1778877821074-253cb57ad765", description: "Six mixed cans to pass around." },
      { title: "Mandarin Six", category: "Packs", price: 549, image: "photo-1781560150438-2bc2bf7c4434", description: "Six cans of our best-selling mandarin." },
      { title: "Party Box", category: "Packs", price: 1099, image: "photo-1781560150113-156cf60751fc", description: "Twelve cans of every flavour." },
    ],
    banners: [
      { title: "New flavours", image: "photo-1781560149535-5d26b925f174" },
      { title: "Every flavour, one box", image: "photo-1781560150113-156cf60751fc" },
    ],
  },
  // Theme 16: grain skincare
  theme16: {
    categories: [
      { name: "Serums", image: "photo-1781344116880-029945a42b75", subtitle: "Light drops for every skin" },
      { name: "Creams", image: "photo-1763503839418-2b45c3d7a3c3", subtitle: "Rich and calming" },
      { name: "Cleansers", image: "photo-1688614586206-70a039559217", subtitle: "Gentle daily cleansing" },
    ],
    products: [
      { title: "Oat-Rice Serum", category: "Serums", price: 1290, image: "photo-1781344116880-029945a42b75", description: "A calming serum with oat extract and rice water. 30 ml." },
      { title: "Millet Peptide Elixir", category: "Serums", price: 1590, image: "photo-1781346325200-61cef7b29d76", description: "Millet peptides to firm and smooth. 30 ml." },
      { title: "Oat Cloud Cream", category: "Creams", price: 1190, image: "photo-1763503839418-2b45c3d7a3c3", description: "A whipped cream that melts in. 50 g." },
      { title: "Quinoa Night Oil", category: "Serums", price: 1490, image: "photo-1624454002302-36b824d7bd0a", description: "Quinoa and rosehip oil for overnight repair. 30 ml." },
      { title: "Barley Drops", category: "Serums", price: 990, image: "photo-1576426863848-c21f53c60b19", description: "Light hydrating drops with barley water. 30 ml." },
      { title: "Rice Water Cream", category: "Creams", price: 1290, image: "photo-1629732097571-b042b35aa3ed", description: "Brightening cream with fermented rice water. 50 g." },
      { title: "Golden Grain Oil", category: "Serums", price: 1390, image: "photo-1608571424634-58ae03e6edcf", description: "A golden face oil with oat and sesame. 30 ml." },
      { title: "Oat Cleansing Gel", category: "Cleansers", price: 790, image: "photo-1688614586206-70a039559217", description: "A soft gel cleanser that never feels tight. 100 ml." },
      { title: "Grain Glow Duo", category: "Creams", price: 2190, was: 2480, image: "photo-1601049413574-214d105b26e4", description: "Serum and cream together, for a morning glow." },
      { title: "Daily Ritual Set", category: "Cleansers", price: 2990, image: "photo-1739980213756-753aea153bb8", description: "Cleanser, serum and cream for a full routine." },
    ],
    banners: [
      { title: "Crafted for balance", image: "photo-1707539160277-e39464517645" },
      { title: "From the field", image: "photo-1676289124506-bdce1e1acc97" },
    ],
  },
  // Theme 17: modern lifestyle store
  theme17: {
    categories: [
      { name: "Women's Fashion", image: "photo-1617012803658-a9a7cfb35f4f", subtitle: "Easy pieces for every day" },
      { name: "Men's Essentials", image: "photo-1578768079052-aa76e52ff62e", subtitle: "Hoodies, tees and more" },
      { name: "Home & Living", image: "photo-1550731827-6ec2951e3099", subtitle: "Plants, lamps and calm" },
      { name: "Accessories", image: "photo-1545127398-14699f92334b", subtitle: "Tech and little extras" },
    ],
    products: [
      { title: "Canvas Tote Bag", category: "Accessories", price: 899, image: "photo-1574365569389-a10d488ca3fb", description: "A sturdy cotton canvas tote for every day." },
      { title: "Orange Crew Sweatshirt", category: "Women's Fashion", price: 1990, image: "photo-1578587018452-892bacefd3f2", description: "A soft brushed-cotton sweatshirt in bright orange.", sizes: CLOTHING_SIZES },
      { title: "Wireless Earbuds", category: "Accessories", price: 3990, was: 4990, image: "photo-1606841837239-c5a1a4a07af7", description: "Clear sound, 24-hour battery and a pocket-size case." },
      { title: "Minimal Lamp", category: "Home & Living", price: 2490, image: "photo-1643886418577-c63d4fab8537", description: "A soft green desk lamp with a warm glow." },
      { title: "Cream Headphones", category: "Accessories", price: 5990, image: "photo-1766338055584-5ffe426a7e57", description: "Over-ear headphones in a soft cream finish." },
      { title: "Fiddle Leaf Plant", category: "Home & Living", price: 1290, image: "photo-1550731827-6ec2951e3099", description: "A leafy plant in a white ceramic pot." },
      { title: "Cocoa Hoodie", category: "Men's Essentials", price: 2290, image: "photo-1578768079052-aa76e52ff62e", description: "A relaxed hoodie in warm brown.", sizes: CLOTHING_SIZES },
      { title: "Rust Knit Jumper", category: "Women's Fashion", price: 2490, image: "photo-1617012803658-a9a7cfb35f4f", description: "A chunky knit in a warm rust colour.", sizes: CLOTHING_SIZES },
      { title: "Kraft Shopper", category: "Accessories", price: 699, image: "photo-1544816155-12df9643f363", description: "A tough paper-look shopper that folds flat." },
      { title: "Studio Earbuds", category: "Accessories", price: 2990, image: "photo-1606741965326-cb990ae01bb2", description: "Light earbuds with a slim charging case." },
      { title: "Spider Plant Pot", category: "Home & Living", price: 890, image: "photo-1599067900192-1e0ecf2ce134", description: "An easy plant in a textured white pot." },
      { title: "Cloud Hoodie", category: "Men's Essentials", price: 2490, image: "photo-1620799140188-3b2a02fd9a77", description: "A heavy white cotton hoodie.", sizes: CLOTHING_SIZES },
      { title: "Little Sprout Pot", category: "Home & Living", price: 590, image: "photo-1599067897079-aedd464866d6", description: "A small pot with a fresh green sprout." },
    ],
    banners: [
      { title: "Live in style", image: "photo-1578587018452-892bacefd3f2" },
      { title: "Up to 50% off", image: "photo-1600185365483-26d7a4cc7519" },
    ],
  },
  // Theme 18: pink skincare
  theme18: {
    categories: [
      { name: "Serums", image: "photo-1766714613562-f59602e35203", subtitle: "Light drops, big glow" },
      { name: "Masks", image: "photo-1743928984149-278560f74cde", subtitle: "Sheet and sleeping masks" },
      { name: "Body", image: "photo-1787074637736-55969c9bbd42", subtitle: "Washes and lotions" },
    ],
    products: [
      { title: "Hydrating Serum", category: "Serums", price: 1290, image: "photo-1766714613562-f59602e35203", description: "A light serum that drenches skin in moisture. 30 ml." },
      { title: "Silk Face Mask", category: "Masks", price: 390, image: "photo-1743928984149-278560f74cde", description: "A rosehip sheet mask for soft, renewed skin." },
      { title: "Rose Body Wash", category: "Body", price: 690, image: "photo-1787074637736-55969c9bbd42", description: "A gentle rose-scented wash for every day. 250 ml." },
      { title: "Rose Sleeping Mask", category: "Masks", price: 1490, image: "photo-1631700611307-37dbcb89ef7e", description: "An overnight mask that works while you rest. 50 ml." },
      { title: "Glow Drops Duo", category: "Serums", price: 2190, was: 2580, image: "photo-1686121522744-dc323ce3fb26", description: "Two vitamin C serums for morning and night." },
      { title: "Collagen Mask", category: "Masks", price: 390, image: "photo-1743928217924-77ec5f39c4fb", description: "A plumping sheet mask with collagen." },
      { title: "Silk Body Lotion", category: "Body", price: 790, image: "photo-1787074637397-4597119d6dfa", description: "A rich lotion that sinks in fast. 250 ml." },
      { title: "Aloe Calm Mask", category: "Masks", price: 390, image: "photo-1748390359572-8e7a47bf5cb5", description: "A cooling aloe sheet mask for tired skin." },
      { title: "Petal Cream", category: "Body", price: 990, image: "photo-1765964492963-b0aa8c172431", description: "A soft cream scented with rose petals. 100 g." },
      { title: "Gentle Cleanser", category: "Serums", price: 590, image: "photo-1778665654058-dcd700142738", description: "A creamy cleanser that never strips. 150 ml." },
      { title: "Glow Mist", category: "Serums", price: 890, image: "photo-1773305676182-5f34519e11b6", description: "A refreshing mist for a quick glow. 100 ml." },
    ],
    banners: [
      { title: "Your best glow", image: "photo-1773305676182-5f34519e11b6" },
      { title: "The full routine", image: "photo-1766241883982-93328f309dc9" },
    ],
  },
  // Theme 19: protein drinks
  theme19: {
    categories: [
      { name: "Shakes", image: "photo-1579954115545-a95591f28bfc", subtitle: "20 g protein, ready to drink" },
      { name: "Smoothies", image: "photo-1514995428455-447d4443fa7f", subtitle: "Fruit and fibre" },
      { name: "Bundles", image: "photo-1693996045838-980674653385", subtitle: "Mix and save" },
    ],
    products: [
      { title: "Strawberry Protein Shake", category: "Shakes", price: 149, image: "photo-1579954115545-a95591f28bfc", description: "Real strawberry, 20 g protein, no added sugar." },
      { title: "Chocolate Cookie Shake", category: "Shakes", price: 149, image: "photo-1572490122747-3968b75cc699", description: "Cookies-and-cream taste with 20 g protein." },
      { title: "Salted Caramel Shake", category: "Shakes", price: 149, image: "photo-1786052598262-9c649b0d825f", description: "Smooth caramel with a pinch of sea salt." },
      { title: "Berry Smoothie", category: "Smoothies", price: 129, image: "photo-1589733955941-5eeaf752f6dd", description: "Mixed berries with prebiotic fibre." },
      { title: "Tropical Smoothie", category: "Smoothies", price: 129, image: "photo-1514995428455-447d4443fa7f", description: "Pineapple, banana and strawberry." },
      { title: "Pink Protein Cooler", category: "Shakes", price: 139, image: "photo-1638176311291-36b0eacc6b08", description: "A light pink protein drink for warm days." },
      { title: "Strawberry Cream", category: "Smoothies", price: 139, image: "photo-1686638745403-d21193f16b2f", description: "A creamy strawberry treat, still no added sugar." },
      { title: "Coffee Protein", category: "Shakes", price: 159, image: "photo-1788580210927-31e526de5639", description: "Cold coffee with 20 g protein." },
      { title: "Starter Bundle", category: "Bundles", price: 999, was: 1192, image: "photo-1693996045838-980674653385", description: "Eight bottles: two of every flavour." },
      { title: "Workout Week", category: "Bundles", price: 1299, image: "photo-1679384322991-f6f16a34aaa9", description: "Ten bottles for a full week of training." },
    ],
    banners: [
      { title: "Your gut's favourite", image: "photo-1514995428455-447d4443fa7f" },
      { title: "Strawberry is back", image: "photo-1589785186418-d00a641ebd35" },
    ],
  },
  // Theme 20: bikes and gear
  theme20: {
    categories: [
      { name: "Bikes", image: "photo-1789145349184-bb9032f6caa9", subtitle: "Road, gravel and city" },
      { name: "Helmets", image: "photo-1701522814490-9d67fe9ab5b7", subtitle: "Light and well vented" },
      { name: "Saddles", image: "photo-1722109879134-edc2661250be", subtitle: "Comfort for long rides" },
      { name: "Lights", image: "photo-1579118690145-7753994c2d56", subtitle: "See and be seen" },
      { name: "Drivetrain", image: "photo-1525104325683-eb7d21279760", subtitle: "Cassettes and chains" },
      { name: "Cockpit", image: "photo-1580224881685-6bb1d75f1046", subtitle: "Bars and stems" },
    ],
    products: [
      { title: "Gravel GR", category: "Bikes", price: 189000, image: "photo-1789145349184-bb9032f6caa9", description: "A full-carbon gravel bike, fast on roads and calm on dirt." },
      { title: "Road Aero", category: "Bikes", price: 214000, image: "photo-1576435728678-68d0fbf94e91", description: "An aero road bike with hydraulic disc brakes." },
      { title: "City Classic", category: "Bikes", price: 64900, image: "photo-1792955104888-40db17f71dc9", description: "A light steel city bike with leather touches." },
      { title: "Aero Helmet", category: "Helmets", price: 8900, image: "photo-1701522814490-9d67fe9ab5b7", description: "A light road helmet with 18 vents." },
      { title: "Trail Helmet", category: "Helmets", price: 7400, was: 8900, image: "photo-1701522814809-c339c2b60a7b", description: "An all-mountain helmet with a peak." },
      { title: "Leather Saddle", category: "Saddles", price: 6900, image: "photo-1722109879134-edc2661250be", description: "A classic leather saddle that shapes to you." },
      { title: "Front Light 1200", category: "Lights", price: 4900, image: "photo-1579118690145-7753994c2d56", description: "1200 lumens, USB-C charging, 4 modes." },
      { title: "12-Speed Cassette", category: "Drivetrain", price: 11900, image: "photo-1525104325683-eb7d21279760", description: "A light 10–45T cassette for gravel and road." },
      { title: "Carbon Handlebar", category: "Cockpit", price: 15900, image: "photo-1580224881685-6bb1d75f1046", description: "A flared carbon bar for control on rough roads." },
      { title: "Clip Pedal Set", category: "Drivetrain", price: 8400, image: "photo-1741649897268-ac29908a9a91", description: "Clipless pedals with adjustable tension." },
    ],
    banners: [
      { title: "Ride further", image: "photo-1765808925935-e4fab8f2f6c5" },
      { title: "Gravel GR", image: "photo-1789145349184-bb9032f6caa9" },
    ],
  },
  // Theme 21: demi-fine gold jewellery
  theme21: {
    categories: [
      { name: "Earrings", image: "photo-1708220040824-b273dd0a17cc", subtitle: "Hoops, studs and drops" },
      { name: "Necklaces", image: "photo-1786052337650-9e1c0dd01f5e", subtitle: "Chains and pendants to layer" },
      { name: "Bracelets", image: "photo-1777817117657-d2fa6aacef06", subtitle: "Stack them up" },
      { name: "Rings", image: "photo-1631982690223-8aa4be0a2497", subtitle: "Everyday gold rings" },
    ],
    products: [
      { title: "Ripple Hoop Earrings", category: "Earrings", price: 4490, image: "photo-1708220040824-b273dd0a17cc", description: "Chunky gold-plated hoops with a ripple finish." },
      { title: "Twisted Hoop Earrings", category: "Earrings", price: 3990, image: "photo-1617038220319-276d3cfab638", description: "Twisted 18k gold-plated hoops, light enough for every day." },
      { title: "Pearl Pendant Necklace", category: "Necklaces", price: 5490, image: "photo-1786052337650-9e1c0dd01f5e", description: "A freshwater pearl on a fine gold chain." },
      { title: "Star Drop Hoops", category: "Earrings", price: 3490, image: "photo-1617493255060-2745a8c22ebf", description: "Small hoops with a hanging gold star." },
      { title: "Mini Huggie Hoops", category: "Earrings", price: 2490, image: "photo-1632525230528-ec17c49bc168", description: "Tiny hoops that hug the earlobe." },
      { title: "Pearl Strand Necklace", category: "Necklaces", price: 6990, was: 7990, image: "photo-1595345705177-ffe090eb0784", description: "A classic strand of freshwater pearls." },
      { title: "Chunky Chain Bracelet", category: "Bracelets", price: 4990, image: "photo-1602173574767-37ac01994b2a", description: "A bold link bracelet in gold vermeil." },
      { title: "ID Bracelet", category: "Bracelets", price: 3990, image: "photo-1777999802051-f6f0296e76af", description: "A fine chain with a plate you can engrave." },
      { title: "Charm Bracelet Trio", category: "Bracelets", price: 5990, image: "photo-1778000000743-87e855360c51", description: "Three fine bracelets with tiny charms." },
      { title: "Stacking Ring Set", category: "Rings", price: 4490, image: "photo-1631982690223-8aa4be0a2497", description: "Three slim rings made to be worn together." },
      { title: "Solitaire Ring", category: "Rings", price: 7990, image: "photo-1598560917807-1bae44bd2be8", description: "A gold ring with a single bright stone." },
      { title: "Bangle Stack", category: "Bracelets", price: 6490, image: "photo-1786052347285-3ad7f12c738f", description: "Four gold bangles with different textures." },
    ],
    banners: [
      { title: "Everyday essentials", image: "photo-1633555234296-657a18d8b81a" },
      { title: "The pearl edit", image: "photo-1654699991520-aaaf4dd2608b" },
    ],
  },
  // Theme 22: fine gold jewellery
  theme22: {
    categories: [
      { name: "Rings", image: "photo-1784822041171-13e87aebc1bf", subtitle: "Carved and set by hand" },
      { name: "Earrings", image: "photo-1651160670627-2896ddf7822f", subtitle: "Drops and studs" },
      { name: "Necklaces", image: "photo-1758995115857-2de1eb6283d0", subtitle: "Heirloom necklaces" },
    ],
    products: [
      { title: "Asier Ring", category: "Rings", price: 42900, image: "photo-1786228578869-71ecde3dc43e", description: "Solid gold with a rectangular stone." },
      { title: "Malta Ring", category: "Rings", price: 38900, image: "photo-1611955167811-4711904bb9f8", description: "A carved band set with small diamonds." },
      { title: "Helios Earrings", category: "Earrings", price: 56900, image: "photo-1651160670627-2896ddf7822f", description: "Granulated gold drops inspired by temple doors." },
      { title: "Twin Bands", category: "Rings", price: 31900, image: "photo-1622398925373-3f91b1e275f5", description: "Two interlocking bands in 18k gold." },
      { title: "Rose Cluster Ring", category: "Rings", price: 47900, was: 52900, image: "photo-1784822041171-13e87aebc1bf", description: "A cluster of stones in rose gold." },
      { title: "Sun Studs", category: "Earrings", price: 24900, image: "photo-1626784215021-2e39ccf971cd", description: "Round studs with a sunburst setting." },
      { title: "Kora Drops", category: "Earrings", price: 34900, image: "photo-1626784215013-13322cb0e471", description: "Beaded gold drops with a ruby centre." },
      { title: "Lotus Hoops", category: "Earrings", price: 29900, image: "photo-1608508644127-ba99d7732fee", description: "Hammered gold hoops." },
      { title: "Temple Necklace", category: "Necklaces", price: 128900, image: "photo-1758995115857-2de1eb6283d0", description: "A statement necklace with matching earrings." },
      { title: "Coin Pendant", category: "Necklaces", price: 64900, image: "photo-1758995115518-26f90aa61b97", description: "A carved gold coin on a fine chain." },
      { title: "Kundan Choker", category: "Necklaces", price: 89900, image: "photo-1601121141461-920cb1993441", description: "A traditional choker in gold and stones." },
    ],
    banners: [
      { title: "Gifts to keep", image: "photo-1688132256337-52e0e4fed1b0" },
      { title: "The ring edit", image: "photo-1564428566702-e7db579d5b9e" },
    ],
  },
  // Theme 23: fragrance and fine jewellery
  theme23: {
    categories: [
      { name: "Fragrance", image: "photo-1557827983-012eb6ea8dc1", subtitle: "Eau de parfum and colognes" },
      { name: "Fine Jewellery", image: "photo-1593472129865-f71f62103a47", subtitle: "Rings and pearls" },
      { name: "Gift Sets", image: "photo-1625552186152-668cd2f0b707", subtitle: "Wrapped by hand" },
    ],
    products: [
      { title: "Diamond Promise Ring", category: "Fine Jewellery", price: 64900, image: "photo-1737498205249-b075c65b7b32", description: "A solitaire in white gold." },
      { title: "Blanc Petal", category: "Fragrance", price: 7900, image: "photo-1458538977777-0549b2370168", description: "A soft floral eau de parfum with rose and peony. 50 ml." },
      { title: "Daisy Bloom", category: "Fragrance", price: 6900, image: "photo-1763986665850-6e66549aa8e0", description: "A fresh floral with green notes. 50 ml." },
      { title: "Pearl Strand", category: "Fine Jewellery", price: 34900, image: "photo-1515562141207-7a88fb7ce338", description: "Freshwater pearls with a gold clasp." },
      { title: "Velvet Box Ring", category: "Fine Jewellery", price: 52900, image: "photo-1695238856436-caaa0e926030", description: "A rose-gold ring in a velvet box." },
      { title: "Clear Musk", category: "Fragrance", price: 8900, image: "photo-1760920250029-36af9369a0bb", description: "Clean white musk that feels like fresh linen. 100 ml." },
      { title: "Marine Teal", category: "Fragrance", price: 7400, image: "photo-1587017539504-67cfbddac569", description: "A fresh aquatic cologne with sea salt. 100 ml." },
      { title: "Noir Wood", category: "Fragrance", price: 9900, image: "photo-1761659760494-32b921a2449f", description: "A deep woody scent with cedar and vetiver. 50 ml." },
      { title: "Signature Gift Box", category: "Gift Sets", price: 12900, image: "photo-1759563871375-d5b140f6646e", description: "A fragrance and candle, wrapped by hand." },
      { title: "Discovery Set", category: "Gift Sets", price: 3900, image: "photo-1625552186152-668cd2f0b707", description: "Six travel sprays to find your favourite." },
      { title: "Golden Hour", category: "Fragrance", price: 10900, image: "photo-1622618991746-fe6004db3a47", description: "A warm amber and vanilla scent. 50 ml." },
      { title: "Rose Orb", category: "Fragrance", price: 8400, image: "photo-1533017568856-f6085fef5f1f", description: "A sweet floral with cherry blossom. 50 ml." },
    ],
    banners: [
      { title: "This season's essentials", image: "photo-1600086586698-368d69f00d6e" },
      { title: "Fine jewellery", image: "photo-1593472129865-f71f62103a47" },
    ],
  },
  // Theme 24: phone and tech accessories
  theme24: {
    categories: [
      { name: "Cases", image: "photo-1535157412991-2ef801c1748b", subtitle: "Slim, tough and colourful" },
      { name: "Audio", image: "photo-1585771724684-38269d6639fd", subtitle: "Headphones and earbuds" },
      { name: "Chargers", image: "photo-1591290619618-904f6dd935e3", subtitle: "Wireless and fast" },
      { name: "Cables", image: "photo-1492107376256-4026437926cd", subtitle: "USB-C and more" },
      { name: "Wearables", image: "photo-1642101373432-a9c683c34902", subtitle: "Smart watches" },
      { name: "Speakers", image: "photo-1608043152269-423dbba4e7e1", subtitle: "Sound anywhere" },
    ],
    products: [
      { title: "Studio Headphones", category: "Audio", price: 7999, was: 9999, image: "photo-1585771724684-38269d6639fd", description: "Over-ear headphones with active noise cancelling.", colours: ["#E46A2E", "#1B1B1B"] },
      { title: "Pastel Case Set", category: "Cases", price: 1499, image: "photo-1535157412991-2ef801c1748b", description: "Four soft-touch silicone cases in pastel colours.", colours: ["#F7C9D4", "#BDE4E6", "#2F3542", "#F4F1EA"] },
      { title: "Sport Earbuds", category: "Audio", price: 3499, was: 4299, image: "photo-1636134133682-27a21b8f20ba", description: "Sweat-proof earbuds with a 30-hour battery.", colours: ["#E46A2E", "#111111"] },
      { title: "USB-C Charge Cable", category: "Cables", price: 699, image: "photo-1492107376256-4026437926cd", description: "1 m braided USB-C cable for fast charging.", colours: ["#F4F4F2"] },
      { title: "Wireless Charging Pad", category: "Chargers", price: 1999, was: 2499, image: "photo-1591290619618-904f6dd935e3", description: "A 15 W wireless pad for phones and earbuds.", colours: ["#F4F4F2"] },
      { title: "Sport Smartwatch", category: "Wearables", price: 5999, image: "photo-1642101373432-a9c683c34902", description: "Heart rate, GPS and a 7-day battery.", colours: ["#111111", "#D7262E"] },
      { title: "Sunburst Case", category: "Cases", price: 899, image: "photo-1654588301119-7e23237ace60", description: "A bright yellow case with raised camera edges.", colours: ["#F2C94C"] },
      { title: "Rugged Speaker", category: "Speakers", price: 4499, was: 5499, image: "photo-1608043152269-423dbba4e7e1", description: "A waterproof speaker with deep bass.", colours: ["#111111"] },
      { title: "Magnetic Charger", category: "Chargers", price: 2499, image: "photo-1615526675159-e248c3021d3f", description: "Snaps onto your phone and charges at 15 W.", colours: ["#E8E8E8"] },
      { title: "Prism Case", category: "Cases", price: 1099, image: "photo-1581003989504-3e6ba26df4a2", description: "A bold graphic case with shock-proof corners.", colours: ["#E46A2E", "#F4F4F2"] },
      { title: "Power Bank 20000", category: "Chargers", price: 2799, image: "photo-1760708825913-65a50b3dc39b", description: "Charges three devices at once.", colours: ["#F4F4F2"] },
      { title: "Rose Smartwatch", category: "Wearables", price: 6999, image: "photo-1786103776067-2df6237af61d", description: "A rose-gold watch with a mesh strap.", colours: ["#E7B9A2"] },
      { title: "Night Headphones", category: "Audio", price: 4999, image: "photo-1637780852590-8ab27248ec41", description: "Lightweight wired headphones for the studio.", colours: ["#111111"] },
      { title: "Braided Cable 2 m", category: "Cables", price: 899, image: "photo-1639675960002-2f414c58ed79", description: "Extra-long cable that reaches the sofa.", colours: ["#F4F4F2"] },
      { title: "Home Speaker", category: "Speakers", price: 8999, image: "photo-1529359744902-86b2ab9edaea", description: "Room-filling sound with a voice assistant.", colours: ["#2B2B2B"] },
    ],
    banners: [
      { title: "Mix. Match. Snap on.", image: "photo-1535157412991-2ef801c1748b" },
      { title: "Sound that moves you", image: "photo-1585771724684-38269d6639fd" },
    ],
  },
  // Theme 25: burger joint
  theme25: {
    categories: [
      { name: "Burgers", image: "photo-1568901346375-23c9450c58cd", subtitle: "Smashed and stacked" },
      { name: "Sides", image: "photo-1598679253544-2c97992403ea", subtitle: "Fries, tenders and dogs" },
      { name: "Drinks", image: "photo-1553787499-6f9133860278", subtitle: "Shakes and sodas" },
    ],
    products: [
      { title: "Classic Cheeseburger", category: "Burgers", price: 249, image: "photo-1568901346375-23c9450c58cd", description: "A smashed patty, cheese, lettuce, tomato and house sauce." },
      { title: "Loaded Fries", category: "Sides", price: 149, image: "photo-1598679253544-2c97992403ea", description: "Crispy fries with cheese sauce and spring onion." },
      { title: "Chocolate Shake", category: "Drinks", price: 179, image: "photo-1553787499-6f9133860278", description: "Thick chocolate shake with whipped cream." },
      { title: "Double Smash", category: "Burgers", price: 329, image: "photo-1572802419224-296b0aeee0d9", description: "Two smashed patties, double cheese, pickles." },
      { title: "Chicken Tenders", category: "Sides", price: 199, image: "photo-1768204039907-77a974159ef0", description: "Five crispy tenders with fries and dip." },
      { title: "Crispy Stack", category: "Burgers", price: 289, was: 329, image: "photo-1757834787931-ddd70f3379a5", description: "Crispy chicken, slaw and spicy mayo." },
      { title: "Classic Hot Dog", category: "Sides", price: 169, image: "photo-1638368593249-7cadb261e8b3", description: "A grilled sausage with ketchup, mustard and onions." },
      { title: "Vanilla Cookie Shake", category: "Drinks", price: 189, image: "photo-1775708838877-a3b8d7383c31", description: "Vanilla shake blended with cookie crumbs." },
      { title: "BBQ Burger", category: "Burgers", price: 299, image: "photo-1586190848861-99aa4a171e90", description: "Smoky BBQ sauce, onion rings and cheddar." },
      { title: "Ketchup Fries", category: "Sides", price: 99, image: "photo-1518013431117-eb1465fa5752", description: "Golden fries with a side of ketchup." },
      { title: "Cola", category: "Drinks", price: 69, image: "photo-1605712916345-6ef6bcc2e29c", description: "Ice-cold cola with a red straw." },
      { title: "Lemon Soda", category: "Drinks", price: 79, image: "photo-1581636625402-29b2a704ef13", description: "Fresh lemon and soda over ice." },
      { title: "Pickle Melt", category: "Burgers", price: 279, image: "photo-1607013251379-e6eecfffe234", description: "Cheese, pickles and mustard on a toasted bun." },
      { title: "Nugget Box", category: "Sides", price: 179, image: "photo-1562967916-eb82221dfb92", description: "Ten crispy nuggets with two dips." },
    ],
    banners: [
      { title: "Something for everybody", image: "photo-1763689389824-dd2cea2e5772" },
      { title: "Shake o'clock", image: "photo-1553787499-6f9133860278" },
    ],
  },
  // Theme 26: dark fine jewellery
  theme26: {
    categories: [
      { name: "Rings", image: "photo-1499899833954-5ecd9439d17f", subtitle: "Solitaires and bands" },
      { name: "Earrings", image: "photo-1793054515055-1212a15a0662", subtitle: "Hoops and drops" },
      { name: "Necklaces", image: "photo-1786052337650-9e1c0dd01f5e", subtitle: "Pendants and chains" },
      { name: "Bracelets", image: "photo-1602173574767-37ac01994b2a", subtitle: "Links and chains" },
    ],
    products: [
      { title: "Queen Ring", category: "Rings", price: 66900, image: "photo-1499899833954-5ecd9439d17f", description: "A solitaire diamond on a fine gold band." },
      { title: "Laura Bracelet", category: "Bracelets", price: 25000, image: "photo-1602173574767-37ac01994b2a", description: "Chunky gold links that sit just right." },
      { title: "Diamond Necklace", category: "Necklaces", price: 39900, image: "photo-1786052337650-9e1c0dd01f5e", description: "A pear-cut pendant on a fine chain." },
      { title: "Yuna Bracelet", category: "Bracelets", price: 22000, image: "photo-1778000000743-87e855360c51", description: "Three fine chains with tiny charms." },
      { title: "Occa Earrings", category: "Earrings", price: 18000, image: "photo-1793054515055-1212a15a0662", description: "Textured gold hoops." },
      { title: "Twin Bands", category: "Rings", price: 31900, image: "photo-1793054514822-e704c2d4bd1e", description: "Two engraved gold bands." },
      { title: "Chain Ring", category: "Rings", price: 21900, image: "photo-1793054515168-de083df1b024", description: "A gold ring shaped like a chain link." },
      { title: "Oval Halo Ring", category: "Rings", price: 74900, was: 82900, image: "photo-1793054733083-542f5c2d2e42", description: "An oval stone wrapped in tiny diamonds." },
      { title: "Gold Trio Set", category: "Necklaces", price: 54900, image: "photo-1793054733027-daea491b5cc2", description: "Necklace, ring and earrings that go together." },
      { title: "Promise Ring Box", category: "Rings", price: 89900, image: "photo-1769230361954-69a5bd0fcb2e", description: "A diamond engagement ring in a velvet box." },
    ],
    banners: [
      { title: "Summer collections", image: "photo-1633555234296-657a18d8b81a" },
      { title: "Elegance in every detail", image: "photo-1769230361954-69a5bd0fcb2e" },
    ],
  },
  // Theme 27: handmade beaded jewellery
  theme27: {
    categories: [
      { name: "Necklaces", image: "photo-1629481995102-ff98d306dd8a", subtitle: "Bold and beaded" },
      { name: "Bracelets", image: "photo-1637808248242-57a6265593ed", subtitle: "Stack them up" },
      { name: "Bead kits", image: "photo-1646070107254-3713cec279c1", subtitle: "Make your own" },
    ],
    products: [
      { title: "Olive Jade Carabiner Necklace", category: "Necklaces", price: 6800, image: "photo-1767040276964-d2a39a86b1d4", description: "Green jade beads with a gold-filled carabiner clasp." },
      { title: "Ocean Jasper Necklace", category: "Necklaces", price: 7200, image: "photo-1601824096525-954268b9eb72", description: "Earthy jasper and Edison pearls." },
      { title: "Fiery Carnelian Necklace", category: "Necklaces", price: 5200, image: "photo-1560847133-e6f64dc352ea", description: "Bright carnelian beads, knotted by hand." },
      { title: "Rainbow Strand", category: "Necklaces", price: 5800, image: "photo-1629481995102-ff98d306dd8a", description: "A playful mix of gemstones in every colour." },
      { title: "Agate Duo", category: "Necklaces", price: 6400, was: 7400, image: "photo-1772124097506-4ed5b789ae83", description: "Two strands of agate to wear together or apart." },
      { title: "Gold Teal Collar", category: "Necklaces", price: 8200, image: "photo-1719862056552-b9de4f843beb", description: "Gold beads with teal accents." },
      { title: "Bracelet Stack", category: "Bracelets", price: 4800, image: "photo-1637808248242-57a6265593ed", description: "Five stretch bracelets in matching stones." },
      { title: "Beaded Cuff", category: "Bracelets", price: 3600, image: "photo-1601387603639-387c75bdcb0d", description: "A wide hand-woven cuff." },
      { title: "Letter Bead Kit", category: "Bead kits", price: 2400, image: "photo-1646070107254-3713cec279c1", description: "Everything you need to make three name bracelets." },
      { title: "Seed Bead Box", category: "Bead kits", price: 1800, image: "photo-1651958507150-87219b400741", description: "A box of glass seed beads in twelve colours." },
    ],
    banners: [
      { title: "Handmade for kind souls", image: "photo-1715374033196-0ff662284a7e" },
      { title: "Bold and beaded", image: "photo-1629481995102-ff98d306dd8a" },
    ],
  },
  // Theme 28: ethnic wear for every occasion
  theme28: {
    categories: [
      { name: "Sarees", image: "photo-1610189337543-1c5d8e64f574", subtitle: "Georgette, chiffon and party wear" },
      { name: "Silk Sarees", image: "photo-1679006831648-7c9ea12e5807", subtitle: "Banarasi, Kanjivaram and more" },
      { name: "Suits & Dresses", image: "photo-1745313452052-0e4e341f326c", subtitle: "Anarkalis and salwar suits" },
      { name: "Gowns", image: "photo-1756483509254-3cc48a5a15b2", subtitle: "Evening and cocktail gowns" },
      { name: "Kurtis", image: "photo-1773439878514-65d4aeb43046", subtitle: "Everyday kurtas and sets" },
      { name: "Wedding Collection", image: "photo-1654764746225-e63f5e90facd", subtitle: "Lehengas for the big day" },
    ],
    products: [
      { title: "Chinon Silk Party Wear Saree – Embroidered", category: "Sarees", price: 1914, was: 2500, image: "photo-1692992193981-d3d92fabd9cb", description: "Light chinon silk with embroidered borders, a festive pick for parties." },
      { title: "Banarasi Soft Silk Saree – White", category: "Silk Sarees", price: 1860, was: 2300, image: "photo-1729146768775-3662af38016e", description: "Ivory Banarasi soft silk with a fine gold zari border." },
      { title: "Festive Georgette Saree – Red", category: "Sarees", price: 1531, image: "photo-1610189337543-1c5d8e64f574", description: "Flowing georgette in festive red with a woven border." },
      { title: "Vichitra Silk Saree – Full Border Work", category: "Silk Sarees", price: 4368, was: 6000, image: "photo-1678705730064-a7ecbab4b3fb", description: "Vichitra silk with heavy zari work along the full border." },
      { title: "Embellished Evening Gown", category: "Gowns", price: 5500, image: "photo-1610202631408-fa6ba0f39ca3", description: "Navy gown with gold embroidery, made for evening events.", sizes: ["XS", "S", "M", "L", "XL", "XXL"] },
      { title: "Printed Anarkali Suit", category: "Suits & Dresses", price: 2450, image: "photo-1571908599538-7e1e6e92b064", description: "A flared anarkali in soft gold with a matching dupatta.", sizes: ["XS", "S", "M", "L", "XL", "XXL"] },
      { title: "Bridal Red Lehenga", category: "Wedding Collection", price: 15999, image: "photo-1759906760638-eeffcb471e53", description: "Hand-embroidered bridal lehenga with a net dupatta.", sizes: ["XS", "S", "M", "L", "XL", "XXL"] },
      { title: "Kanjivaram Silk Saree", category: "Silk Sarees", price: 8500, image: "photo-1679006831648-7c9ea12e5807", description: "Teal Kanjivaram silk with a temple border and rich pallu." },
      { title: "Pink Floral Kurta Set", category: "Kurtis", price: 1690, image: "photo-1741847639057-b51a25d42892", description: "Cotton kurta and pants in a soft floral print.", sizes: ["XS", "S", "M", "L", "XL", "XXL"] },
      { title: "White Chikankari Kurta Set", category: "Kurtis", price: 1890, image: "photo-1745313452052-0e4e341f326c", description: "Hand-done chikankari on breathable cotton.", sizes: ["XS", "S", "M", "L", "XL", "XXL"] },
      { title: "Blue Embroidered Kurta", category: "Kurtis", price: 1490, was: 1890, image: "photo-1773439878514-65d4aeb43046", description: "A straight kurta with thread work at the neck.", sizes: ["XS", "S", "M", "L", "XL", "XXL"] },
      { title: "Mint Lehenga Set", category: "Wedding Collection", price: 7900, image: "photo-1610048869310-d889ff25c374", description: "Mint lehenga with mirror work, light enough to dance in.", sizes: ["XS", "S", "M", "L", "XL", "XXL"] },
      { title: "Navy Velvet Anarkali Gown", category: "Gowns", price: 6200, image: "photo-1756483509254-3cc48a5a15b2", description: "Velvet anarkali gown with zardozi at the yoke.", sizes: ["XS", "S", "M", "L", "XL", "XXL"] },
      { title: "Yellow Haldi Lehenga", category: "Wedding Collection", price: 6900, was: 7900, image: "photo-1756483517695-d0aa21ee1ea1", description: "Sunny yellow lehenga for haldi and mehendi.", sizes: ["XS", "S", "M", "L", "XL", "XXL"] },
      { title: "Red Silk Saree with Zari Border", category: "Silk Sarees", price: 3290, was: 3990, image: "photo-1726068555279-3d7c0c1fc540", description: "Festive red silk with a wide zari border." },
      { title: "Pink Salwar Suit", category: "Suits & Dresses", price: 2190, image: "photo-1790499401365-24d8268efe7f", description: "A three-piece salwar suit in soft pink.", sizes: ["XS", "S", "M", "L", "XL", "XXL"] },
    ],
    banners: [
      { title: "Elegance redefined", image: "photo-1618901185975-d59f7091bcfe" },
      { title: "The wedding edit", image: "photo-1746372283841-dbb3838f9935" },
    ],
  },
  // Theme 29: handwoven silk saree house
  theme29: {
    categories: [
      { name: "Banarasi", image: "photo-1732381917604-bc8f046965ee", subtitle: "Zari florals from Varanasi" },
      { name: "Kanjivaram", image: "photo-1610189013429-a703f4b245cf", subtitle: "Temple borders from Kanchipuram" },
      { name: "Chanderi", image: "photo-1729146768775-3662af38016e", subtitle: "Sheer silk-cotton" },
      { name: "Paithani", image: "photo-1597897569252-9df44c7de0db", subtitle: "Peacocks on the pallu" },
      { name: "Bridal", image: "photo-1610173827043-9db50e0d8ef9", subtitle: "For the big day" },
    ],
    products: [
      { title: "Rose Banarasi Silk Saree", category: "Banarasi", price: 12500, was: 14900, image: "photo-1732381917604-bc8f046965ee", description: "Rose pink Banarasi silk with gold zari florals." },
      { title: "Ivory Gold Banarasi Saree", category: "Banarasi", price: 14900, image: "photo-1678705730064-a7ecbab4b3fb", description: "Ivory Banarasi with a heavy gold border and pallu." },
      { title: "Royal Blue Banarasi Saree", category: "Banarasi", price: 11800, image: "photo-1610189012906-4c0aa9b9781e", description: "Deep blue Banarasi with a contrast pallu." },
      { title: "Peacock Blue Kanjivaram Saree", category: "Kanjivaram", price: 18500, image: "photo-1610189013429-a703f4b245cf", description: "Pure mulberry silk with a temple border." },
      { title: "Temple Border Kanjivaram Saree", category: "Kanjivaram", price: 21500, was: 24000, image: "photo-1726068555279-3d7c0c1fc540", description: "Red and gold Kanjivaram, woven for weddings." },
      { title: "Mint Kanjivaram Saree", category: "Kanjivaram", price: 16200, image: "photo-1609748340041-f5d61e061ebc", description: "Soft mint Kanjivaram with a slim gold border." },
      { title: "Ivory Chanderi Saree", category: "Chanderi", price: 5400, image: "photo-1729146768775-3662af38016e", description: "Sheer Chanderi silk-cotton with gold buttis." },
      { title: "Blush Chanderi Saree", category: "Chanderi", price: 4900, image: "photo-1763017707718-3bee341d1e65", description: "Light blush Chanderi for summer celebrations." },
      { title: "Marigold Paithani Saree", category: "Paithani", price: 16800, image: "photo-1597897569252-9df44c7de0db", description: "Marigold Paithani with peacocks on the pallu." },
      { title: "Purple Paithani Silk Saree", category: "Paithani", price: 17900, was: 19900, image: "photo-1610030469983-98e550d6193c", description: "Purple Paithani with a lotus border." },
      { title: "Bridal Red Banarasi Lehenga", category: "Bridal", price: 48000, image: "photo-1610173827043-9db50e0d8ef9", description: "Handwoven Banarasi lehenga with a zari dupatta." },
      { title: "Maroon Bridal Kanjivaram Saree", category: "Bridal", price: 32000, image: "photo-1628477116196-48afe0d209e0", description: "Maroon and gold Kanjivaram for the wedding day." },
    ],
    banners: [
      { title: "Handwoven silks since 1985", image: "photo-1679006831648-7c9ea12e5807" },
      { title: "Know your weaves", image: "photo-1732381917604-bc8f046965ee" },
    ],
  },
  // Theme 30: saree boutique
  theme30: {
    categories: [
      { name: "Silk Sarees", image: "photo-1763017707718-3bee341d1e65", subtitle: "Elegant & rich" },
      { name: "Cotton Sarees", image: "photo-1609748340041-f5d61e061ebc", subtitle: "Comfort & class" },
      { name: "Georgette Sarees", image: "photo-1769275061202-cf3ef67d7279", subtitle: "Light & graceful" },
      { name: "Kanjivaram Sarees", image: "photo-1679006831648-7c9ea12e5807", subtitle: "Royal tradition" },
      { name: "Party Wear Sarees", image: "photo-1610030469668-8e9f641aaf27", subtitle: "For special moments" },
      { name: "Handloom Sarees", image: "photo-1692992193981-d3d92fabd9cb", subtitle: "Pure & authentic" },
    ],
    products: [
      { title: "Royal Blue Banarasi Silk Saree", category: "Silk Sarees", price: 8500, image: "photo-1610189013429-a703f4b245cf", description: "Banarasi silk in royal blue with a woven gold pallu." },
      { title: "Meenakari Silk Saree", category: "Silk Sarees", price: 6999, image: "photo-1617627143750-d86bc21e42bb", description: "Pink and orange silk with meenakari motifs." },
      { title: "Soft Georgette Saree in Coral", category: "Georgette Sarees", price: 4499, image: "photo-1610189337543-1c5d8e64f574", description: "Flowing coral georgette, light enough for long days." },
      { title: "Elegant Cotton Saree", category: "Cotton Sarees", price: 2999, image: "photo-1609748340041-f5d61e061ebc", description: "Breathable mint cotton with a contrast border." },
      { title: "Teal Kanjivaram Silk Saree", category: "Kanjivaram Sarees", price: 12500, was: 14500, image: "photo-1679006831648-7c9ea12e5807", description: "Teal Kanjivaram with a temple border." },
      { title: "Temple Gold Kanjivaram Saree", category: "Kanjivaram Sarees", price: 15900, image: "photo-1727430228383-aa1fb59db8bf", description: "Saffron Kanjivaram with a wide gold border." },
      { title: "Sequinned Party Wear Saree", category: "Party Wear Sarees", price: 5490, image: "photo-1610030469668-8e9f641aaf27", description: "Black georgette with scattered sequins." },
      { title: "Blush Organza Party Saree", category: "Party Wear Sarees", price: 4990, was: 5990, image: "photo-1792862288409-6a3dd857bc19", description: "Sheer blush organza with floral embroidery." },
      { title: "Handloom Ikat Saree", category: "Handloom Sarees", price: 3290, image: "photo-1692992193981-d3d92fabd9cb", description: "Handwoven ikat in blue and saffron." },
      { title: "Red Border Handloom Saree", category: "Handloom Sarees", price: 3590, image: "photo-1761125135357-99cbe52a6271", description: "Handloom cotton with a bold red border." },
      { title: "Floral Printed Cotton Saree", category: "Cotton Sarees", price: 2490, image: "photo-1769275061088-85697a30ee50", description: "Soft cotton with a hand-block floral print." },
      { title: "Pastel Georgette Saree", category: "Georgette Sarees", price: 3990, image: "photo-1769275061202-cf3ef67d7279", description: "Pastel georgette in a watercolour print." },
    ],
    banners: [
      { title: "Beautiful sarees for every story", image: "photo-1641699862936-be9f49b1c38d" },
      { title: "Traditional handloom", image: "photo-1619516388835-2b60acc4049e" },
    ],
  },
  // Theme 31: size-inclusive womenswear
  theme31: {
    categories: [
      { name: "Dresses", image: "photo-1632262049811-86d23941618b", subtitle: "Fit and flare to maxi" },
      { name: "Tops", image: "photo-1767785829225-2f6d286c4cf5", subtitle: "Peplums, wraps and more" },
      { name: "Co-ords", image: "photo-1763558990091-bdc2dc084fb6", subtitle: "Sets that match" },
      { name: "Shirts", image: "photo-1618585183251-d480da5554e7", subtitle: "Crisp and easy" },
      { name: "Tees", image: "photo-1768289222455-893014681363", subtitle: "Everyday cotton" },
      { name: "Skirts", image: "photo-1789110854735-67c4e4737aa2", subtitle: "Midis and minis" },
    ],
    products: [
      { title: "Off-Shoulder Waisted Cotton Tee", category: "Tees", price: 870, was: 1499, image: "photo-1768289222455-893014681363", description: "Soft cotton with a fitted waist and an off-shoulder neck.", sizes: PLUS_SIZES },
      { title: "Stretchable Ribbed Peplum Top", category: "Tops", price: 990, was: 1699, image: "photo-1766994063815-e4762e991c1f", description: "Ribbed stretch top with a flared peplum.", sizes: PLUS_SIZES },
      { title: "Ruffled Sleeve Fit & Flare Dress", category: "Dresses", price: 1980, was: 3299, image: "photo-1632262049811-86d23941618b", description: "Puff sleeves and a twirly skirt in sunny yellow.", sizes: PLUS_SIZES },
      { title: "Puff Sleeve Wrap Co-ord Set", category: "Co-ords", price: 2290, image: "photo-1763719161838-da20920db2de", description: "A wrap top and wide pants in a pink floral print.", sizes: PLUS_SIZES },
      { title: "Mint Garden Co-ord Set", category: "Co-ords", price: 2490, was: 2990, image: "photo-1763558990091-bdc2dc084fb6", description: "Relaxed shirt and pants in a mint floral print.", sizes: PLUS_SIZES },
      { title: "Red Floral Shirt Co-ord", category: "Co-ords", price: 2190, image: "photo-1763637896850-6fc44eaae7a6", description: "A breezy red floral shirt and matching pants.", sizes: PLUS_SIZES },
      { title: "Blue Floral Print Top", category: "Tops", price: 1290, image: "photo-1767785829225-2f6d286c4cf5", description: "A loose top in a blue floral print.", sizes: PLUS_SIZES },
      { title: "Striped Button-Down Shirt", category: "Shirts", price: 1390, was: 1690, image: "photo-1618585183251-d480da5554e7", description: "Crisp blue and white stripes in pure cotton.", sizes: PLUS_SIZES },
      { title: "Pinstripe Relaxed Shirt", category: "Shirts", price: 1490, image: "photo-1651309317367-66d6d0c14268", description: "An oversized shirt in fine pinstripes.", sizes: PLUS_SIZES },
      { title: "Polka Dot Midi Skirt", category: "Skirts", price: 1190, image: "photo-1789110519584-ce21260be4e6", description: "A flowy midi skirt in red polka dots.", sizes: PLUS_SIZES },
      { title: "Blue Floral Midi Skirt", category: "Skirts", price: 1350, image: "photo-1789110854735-67c4e4737aa2", description: "White cotton with a blue floral print.", sizes: PLUS_SIZES },
      { title: "Light Blue Skater Dress", category: "Dresses", price: 1690, was: 2190, image: "photo-1762341537225-c2afb11b8cc6", description: "A short skater dress in powder blue.", sizes: PLUS_SIZES },
      { title: "Red Floral Sundress", category: "Dresses", price: 1790, image: "photo-1542295669297-4d352b042bca", description: "Strappy sundress in a red floral print.", sizes: PLUS_SIZES },
      { title: "Classic Grey Tee", category: "Tees", price: 690, image: "photo-1626879210826-c953d2dfa15f", description: "The everyday crew neck in soft grey.", sizes: PLUS_SIZES },
      { title: "Rust Print Co-ord Set", category: "Co-ords", price: 2690, image: "photo-1767785829193-191aae29045b", description: "A tunic and pants in a rust block print.", sizes: PLUS_SIZES },
    ],
    banners: [
      { title: "Made for Indian bodies", image: "photo-1769063382633-ef27742cf2a1" },
      { title: "Co-ords for every day", image: "photo-1763558990091-bdc2dc084fb6" },
    ],
  },
  // Theme 32: playful home objects
  theme32: {
    categories: [
      { name: "Lighting", image: "photo-1720746382153-06585c99d43b", subtitle: "Lamps that glow" },
      { name: "Seating", image: "photo-1684165610413-2401399e0e59", subtitle: "Soft, round and comfy" },
      { name: "Tables", image: "photo-1752061159819-f290b8f48b08", subtitle: "Side tables and trolleys" },
      { name: "Decor", image: "photo-1705526966290-2de7b8a33f03", subtitle: "Vases, bowls and candles" },
      { name: "Audio", image: "photo-1584541728894-dbcae08f94ac", subtitle: "Radios with a retro soul" },
    ],
    products: [
      { title: "Arc Lamp", category: "Lighting", price: 12900, image: "photo-1720746382153-06585c99d43b", description: "A red dome lamp on a slim arc, for reading corners." },
      { title: "Loop Radio", category: "Audio", price: 8500, image: "photo-1584541728894-dbcae08f94ac", description: "A retro radio with Bluetooth and a warm sound." },
      { title: "Cloud Seat", category: "Seating", price: 24900, was: 28900, image: "photo-1684165610413-2401399e0e59", description: "A round boucle armchair you sink into." },
      { title: "Pebble Table", category: "Tables", price: 15900, image: "photo-1752061159819-f290b8f48b08", description: "A glossy cube side table in warm orange." },
      { title: "Mushroom Lamp", category: "Lighting", price: 6900, image: "photo-1787669622132-fcb5d6c5953a", description: "A little table lamp with a soft glow." },
      { title: "Bloom Vase", category: "Decor", price: 3200, image: "photo-1750872403611-26d804a27f89", description: "A glossy red vase for a few stems." },
      { title: "Teal Belly Vase", category: "Decor", price: 3800, image: "photo-1705526966290-2de7b8a33f03", description: "A round ceramic vase in deep teal." },
      { title: "Cone Pendant", category: "Lighting", price: 9900, image: "photo-1590003689662-0773d48b6417", description: "A black cone pendant with a brass inside." },
      { title: "Egg Chair", category: "Seating", price: 32900, image: "photo-1649436670165-031117eb4c4d", description: "A sculpted chair in tomato red." },
      { title: "Stack Bowls", category: "Decor", price: 2400, was: 2900, image: "photo-1567763745030-bfe9c51bec27", description: "Three hand-painted bowls that nest together." },
      { title: "Sunny Radio", category: "Audio", price: 7900, image: "photo-1703669059784-b40068f30c0c", description: "A pocket radio in sunshine yellow." },
      { title: "Red Trolley", category: "Tables", price: 11900, image: "photo-1750306955861-4ba2cd84cf07", description: "A two-tier steel trolley for plants or drinks." },
      { title: "Taper Candle Holder", category: "Decor", price: 1900, image: "photo-1729087176894-778570ba2bf8", description: "A slim brass holder for one tall candle." },
      { title: "Cushion in Cream", category: "Seating", price: 1800, image: "photo-1629949008265-af1bcaf59786", description: "A soft square cushion in textured cream." },
    ],
    banners: [
      { title: "Shape your space", image: "photo-1615884241403-c5ee2e600bef" },
      { title: "Made for everyday", image: "photo-1622347196821-2e71f9a7ebfc" },
    ],
  },
  // Theme 33: illustrated prints and stationery
  theme33: {
    categories: [
      { name: "Prints", image: "photo-1584448141569-69f342da535c", subtitle: "Illustrated places" },
      { name: "Tea Towels", image: "photo-1649015352520-45cb10548a3d", subtitle: "Printed cotton" },
      { name: "Stationery", image: "photo-1647559709298-c0e3dcb47092", subtitle: "Notebooks and more" },
      { name: "Cards", image: "photo-1680183718072-e9b55b649698", subtitle: "For every moment" },
      { name: "Calendars", image: "photo-1543168256-4ae2229821f1", subtitle: "A year of colour" },
      { name: "Homeware", image: "photo-1720698992880-ae93ea16aac9", subtitle: "Mugs and gifts" },
    ],
    products: [
      { title: "Winter Sports Print", category: "Prints", price: 1800, image: "photo-1584448141569-69f342da535c", description: "A vintage-style alpine travel poster, A3." },
      { title: "City Dreams Print", category: "Prints", price: 1600, image: "photo-1622509911920-2254ade3947b", description: "A bold illustrated portrait print, A3." },
      { title: "We Belong Here Print", category: "Prints", price: 1600, image: "photo-1620312768053-2ca8565c94b1", description: "Bright colours and a big message, A3." },
      { title: "Brushstroke Print", category: "Prints", price: 1400, image: "photo-1706630909453-c1058a447373", description: "Loose painted shapes in pink and blue, A4." },
      { title: "Sunset Shapes Print", category: "Prints", price: 1400, was: 1800, image: "photo-1655998233171-ee5b130acba5", description: "Soft shapes in coral and lilac, A4." },
      { title: "Botanical Garden Print", category: "Prints", price: 1600, image: "photo-1632258521940-b29d7d2ae9f5", description: "A framed bouquet in soft pinks, A3." },
      { title: "Striped Tea Towel", category: "Tea Towels", price: 950, image: "photo-1649015352520-45cb10548a3d", description: "Blue and white stripes on soft cotton." },
      { title: "Picnic Check Tea Towel", category: "Tea Towels", price: 950, image: "photo-1778046452025-78f80ff87884", description: "Red gingham for summer kitchens." },
      { title: "Lined Notebook", category: "Stationery", price: 750, image: "photo-1647559709298-c0e3dcb47092", description: "A5 notebook with 120 lined pages." },
      { title: "Botanical Card", category: "Cards", price: 250, image: "photo-1680183718072-e9b55b649698", description: "A pressed-flower card with a kraft envelope." },
      { title: "Blue Willow Card", category: "Cards", price: 250, image: "photo-1481011784351-b0227b9f4a80", description: "A blank card in blue and white." },
      { title: "2026 Wall Calendar", category: "Calendars", price: 1500, image: "photo-1543168256-4ae2229821f1", description: "Twelve months of illustrated places." },
      { title: "Desk Calendar", category: "Calendars", price: 900, image: "photo-1642489216436-4c5075b34d53", description: "A little calendar that stands on your desk." },
      { title: "Sunshine Mug", category: "Homeware", price: 1100, image: "photo-1720698992880-ae93ea16aac9", description: "A yellow stoneware mug for slow mornings." },
      { title: "Gift Box", category: "Homeware", price: 2400, image: "photo-1549465220-1a8b9238cd48", description: "A print, a card and a mug, wrapped and ready." },
    ],
    banners: [
      { title: "Gifts and stationery", image: "photo-1647559709298-c0e3dcb47092" },
      { title: "Travel posters", image: "photo-1610566725828-5e945c71393d" },
    ],
  },
  // Theme 34: luxe boutique
  theme34: {
    categories: [
      { name: "Bags", image: "photo-1681747685985-a401c271156c", subtitle: "Leather to carry every day" },
      { name: "Jewellery", image: "photo-1654699991520-aaaf4dd2608b", subtitle: "Pearls and gold" },
      { name: "Gifts", image: "photo-1592903297149-37fb25202dfa", subtitle: "Wrapped by hand" },
      { name: "Home", image: "photo-1602952706017-f3cc19eb98af", subtitle: "Candles and mugs" },
      { name: "Clothing", image: "photo-1666013138510-9dfad740e972", subtitle: "Satin and soft knits" },
    ],
    products: [
      { title: "Stylish Handmade Coffee Mug", category: "Home", price: 1850, image: "photo-1520485521983-bfaa0bc6c80e", description: "A white stoneware mug with a gold handle." },
      { title: "Luxury Leather Bag", category: "Bags", price: 7800, image: "photo-1681747685985-a401c271156c", description: "A structured rose leather bag with a top handle." },
      { title: "Luxe Gold Gift Box Set", category: "Gifts", price: 3450, image: "photo-1592903297149-37fb25202dfa", description: "A candle, a mug and a silk ribbon in a gift box." },
      { title: "Golden Muse Pearl Strand", category: "Jewellery", price: 2190, image: "photo-1654699991520-aaaf4dd2608b", description: "A strand of freshwater pearls." },
      { title: "Satin Slip Dress", category: "Clothing", price: 5600, was: 6800, image: "photo-1666013138510-9dfad740e972", description: "A bias-cut slip dress in deep wine satin.", sizes: ["XS", "S", "M", "L"] },
      { title: "Velvet Night Candle", category: "Home", price: 1450, image: "photo-1637508858752-f047b38a0dd8", description: "Rose and oud, 50 hours of burn." },
      { title: "Linen Glow Candle", category: "Home", price: 1250, image: "photo-1602952706017-f3cc19eb98af", description: "Fig and cedar in a glass jar." },
      { title: "Pearl Drop Necklace", category: "Jewellery", price: 2650, image: "photo-1515562141207-7a88fb7ce338", description: "A single pearl on a fine gold chain." },
      { title: "Silk Square Scarf", category: "Clothing", price: 2200, image: "photo-1689193502879-362660fad4a8", description: "A printed silk scarf to tie three ways." },
      { title: "Grey Satchel", category: "Bags", price: 6400, image: "photo-1605733513597-a8f8341084e6", description: "A soft leather satchel with a long strap." },
      { title: "Midnight Gift Box", category: "Gifts", price: 2800, image: "photo-1545844568-98bb15133ec0", description: "A dark box with a red ribbon, filled with treats." },
      { title: "Faux Fur Coat", category: "Clothing", price: 9800, image: "photo-1790384086829-08aba2dda785", description: "A plush burgundy coat for winter evenings.", sizes: ["S", "M", "L"] },
    ],
    banners: [
      { title: "Luxe collection", image: "photo-1629197520669-0210d6b270d9" },
      { title: "Join our VIP list", image: "photo-1666013138510-9dfad740e972" },
    ],
  },
  // Theme 35: pet food and supplies
  theme35: {
    categories: [
      { name: "Dog Food", image: "photo-1714068691210-073dc52c6c1d", subtitle: "Kibble and wet food" },
      { name: "Cat Food", image: "photo-1589924691995-400dc9ecc119", subtitle: "For kittens to seniors" },
      { name: "Treats", image: "photo-1761486691834-cd4925ad60b3", subtitle: "Rewards they'll love" },
      { name: "Toys", image: "photo-1535294435445-d7249524ef2e", subtitle: "Chew, fetch and play" },
      { name: "Beds & Bowls", image: "photo-1600369671236-e74521d4b6ad", subtitle: "Comfort at home" },
      { name: "Bird Food", image: "photo-1552728089-57bdde30beb3", subtitle: "Seeds and pellets" },
    ],
    products: [
      { title: "Adult Dog Kibble – Chicken, 3 kg", category: "Dog Food", price: 1450, was: 1650, image: "photo-1714068691210-073dc52c6c1d", description: "Complete dry food for adult dogs, with real chicken." },
      { title: "Puppy Starter Kibble, 1.5 kg", category: "Dog Food", price: 890, image: "photo-1764249453874-46864677b10e", description: "Small bites for growing puppies." },
      { title: "Salmon Cat Food, 2 kg", category: "Cat Food", price: 1290, image: "photo-1589924691995-400dc9ecc119", description: "Dry food for adult cats with salmon and rice." },
      { title: "Kitten Milk Formula", category: "Cat Food", price: 650, was: 790, image: "photo-1764576504536-dbdfa4cb1d9a", description: "Easy-to-mix milk for young kittens." },
      { title: "Oven Baked Dog Treats", category: "Treats", price: 450, image: "photo-1761486691834-cd4925ad60b3", description: "Crunchy dog biscuits with peanut butter." },
      { title: "Chicken Jerky Dog Treats", category: "Treats", price: 520, image: "photo-1761660304474-d921d4d3f49d", description: "Single-ingredient chicken strips." },
      { title: "Bone Chew Dog Toy", category: "Toys", price: 390, image: "photo-1535294435445-d7249524ef2e", description: "A tough rubber bone for heavy chewers." },
      { title: "Plush Duck Dog Toy", category: "Toys", price: 450, image: "photo-1591946614720-90a587da4a36", description: "A squeaky plush toy for fetch." },
      { title: "Feather Wand Cat Toy", category: "Toys", price: 290, was: 350, image: "photo-1585837575652-267c041d77d4", description: "A wand with feathers to chase and pounce." },
      { title: "Woven Dog Bed", category: "Beds & Bowls", price: 2490, was: 2990, image: "photo-1600369671236-e74521d4b6ad", description: "A rattan bed with a soft cushion." },
      { title: "Cosy Round Dog Bed", category: "Beds & Bowls", price: 1990, image: "photo-1581888227599-779811939961", description: "A plush round bed for curling up." },
      { title: "Ceramic Cat Bowl", category: "Beds & Bowls", price: 590, image: "photo-1734654901149-02a9a5f7993b", description: "A shallow pink bowl that's kind to whiskers." },
      { title: "FruitBlend Bird Food, 1 kg", category: "Bird Food", price: 690, image: "photo-1552728089-57bdde30beb3", description: "Seeds and fruit pellets for parrots and parakeets." },
      { title: "Macaw Nut Mix, 1 kg", category: "Bird Food", price: 990, image: "photo-1544923408-75c5cef46f14", description: "Nuts and seeds for large birds." },
    ],
    banners: [
      { title: "High quality pet food", image: "photo-1537151608828-ea2b11777ee8" },
      { title: "Spoil your true love", image: "photo-1596854273338-cbf078ec7071" },
    ],
  },
};

const REVIEWERS = [
  { name: "Ananya S.", text: "Lovely quality and it fits just right. Already ordered another one." },
  { name: "Rahul K.", text: "Arrived in two days, packed really well. Looks even better in person." },
  { name: "Meera P.", text: "Super comfortable. I've been wearing it almost every day." },
  { name: "Arjun T.", text: "Great value for the price. The finish feels premium." },
  { name: "Sana M.", text: "Exactly like the photos. Easy return process too, though I didn't need it." },
  { name: "Kabir D.", text: "My new favourite. Getting compliments every time I wear it." },
];

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/** The sample catalog for one theme, as store data. */
export function demoCatalogFor(theme: string, storeId = "demo") {
  const slugTheme = toSiteTheme(theme);
  const c = CATALOGS[slugTheme];
  const day = 86400000;
  const now = Date.now();
  const categories: CategoryData[] = c.categories.map((cat, i) => ({
    id: `demo-cat-${i + 1}`,
    name: cat.name,
    slug: slug(cat.name),
    subtitle: cat.subtitle,
    description: cat.subtitle,
    imageUrl: IMG(cat.image, 1000),
    isActive: true,
    position: i,
    itemCount: c.products.filter((p) => p.category === cat.name).length,
  }));
  const products: ProductData[] = c.products.map((p, i) => ({
    id: `demo-${slugTheme}-${i + 1}`,
    storeId,
    title: p.title,
    slug: slug(p.title),
    description: p.description,
    price: p.price * 100,
    ...(p.was ? { compareAtPrice: p.was * 100 } : {}),
    stock: 25,
    category: slug(p.category),
    images: [IMG(p.image, 1000)],
    status: "published",
    // first two are the newest, the rest are older, so "New" badges and sorting look natural
    createdAt: new Date(now - (i < 2 ? i + 1 : 40 + i * 3) * day).toISOString(),
    reviewCount: 3 + ((i * 7) % 9),
    rating: 4.6,
    ...(p.colours ? { colorSwatches: p.colours } : {}),
    ...(p.sizes ? { options: [{ id: "size", name: "Size", options: p.sizes }] } : {}),
  }));
  const banners: BannerData[] = c.banners.map((b, i) => ({
    id: `demo-banner-${i + 1}`,
    storeId,
    title: b.title,
    imageUrl: IMG(b.image, 1800),
    ctaLink: "/catalog",
    targetType: "custom",
    position: i,
    isActive: true,
  }));
  const people = c.reviews || REVIEWERS;
  const reviews: ReviewData[] = products.slice(0, people.length).map((p, i) => ({
    id: `demo-review-${i + 1}`,
    storeId,
    productId: p.id,
    customerName: people[i].name,
    rating: i % 3 === 2 ? 4 : 5,
    comment: people[i].text,
    verifiedPurchase: true,
    status: "approved",
    createdAt: new Date(now - (i + 2) * day).toISOString(),
  }));
  return { categories, products, banners, reviews };
}

/**
 * The shop as shown in a dashboard theme preview: its name, logo, contact and payment settings
 * stay, while products, categories, banners, reviews and the page content are the theme's samples.
 */
export function demoStoreFor(store: StoreData, theme: string): StoreData {
  const demo = demoCatalogFor(theme, store.id);
  return {
    ...store,
    ...demo,
    // the full theme (reviews and all) is shown in a preview, whatever the shop's plan
    planId: "pro",
    themeContent: undefined,
    orders: [],
    customers: [],
    discounts: [],
  };
}
