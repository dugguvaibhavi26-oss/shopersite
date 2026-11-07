export interface FontOption {
  id: string;
  name: string;
  category: "sans" | "serif" | "display";
  fontFamily: string;
  googleFontFamily: string;
  description: string;
  sampleHeadline: string;
}

export const AVAILABLE_FONTS: FontOption[] = [
  {
    id: "outfit",
    name: "Outfit",
    category: "sans",
    fontFamily: "'Outfit', sans-serif",
    googleFontFamily: "Outfit:wght@300;400;500;600;700;800",
    description: "Modern, crisp & high-street fashion (Recommended for Lume)",
    sampleHeadline: "Style That Moves With You",
  },
  {
    id: "plus-jakarta-sans",
    name: "Plus Jakarta Sans",
    category: "sans",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    googleFontFamily: "Plus Jakarta Sans:wght@300;400;500;600;700;800",
    description: "Refined geometric sans, contemporary & clean",
    sampleHeadline: "Curated Modern Wardrobe",
  },
  {
    id: "dm-sans",
    name: "DM Sans",
    category: "sans",
    fontFamily: "'DM San s', sans-serif",
    googleFontFamily: "DM Sans:ital,opsz,wght@0,9..40,400;0,9..40,600;0,9..40,700;1,9..40,400",
    description: "Editorial, balanced & high-end boutique aesthetic",
    sampleHeadline: "Minimalist Essentials & Silhouettes",
  },
  {
    id: "inter",
    name: "Inter",
    category: "sans",
    fontFamily: "'Inter', sans-serif",
    googleFontFamily: "Inter:wght@300;400;500;600;700",
    description: "Ultra-legible, neutral modern minimalist",
    sampleHeadline: "Everyday Functional Design",
  },
  {
    id: "manrope",
    name: "Manrope",
    category: "sans",
    fontFamily: "'Manrope', sans-serif",
    googleFontFamily: "Manrope:wght@300;400;500;600;700;800",
    description: "Contemporary European luxury branding",
    sampleHeadline: "Precision Tailored Apparel",
  },
  {
    id: "space-grotesk",
    name: "Space Grotesk",
    category: "sans",
    fontFamily: "'Space Grotesk', sans-serif",
    googleFontFamily: "Space Grotesk:wght@400;500;600;700",
    description: "Bold, modern streetwear & youth culture",
    sampleHeadline: "Street Culture & New Drops",
  },
  {
    id: "playfair-display",
    name: "Playfair Display",
    category: "serif",
    fontFamily: "'Playfair Display', serif",
    googleFontFamily: "Playfair Display:ital,wght@0,400;0,600;0,700;1,400",
    description: "Classic high-fashion editorial serif (Vogue style)",
    sampleHeadline: "Haute Couture & Fine Tailoring",
  },
  {
    id: "cinzel",
    name: "Cinzel",
    category: "serif",
    fontFamily: "'Cinzel', serif",
    googleFontFamily: "Cinzel:wght@400;600;700",
    description: "Timeless Roman serif for luxury jewellery & couture",
    sampleHeadline: "Timeless Luxury & Heritage",
  },
  {
    id: "cormorant-garamond",
    name: "Cormorant Garamond",
    category: "serif",
    fontFamily: "'Cormorant Garamond', serif",
    googleFontFamily: "Cormorant Garamond:ital,wght@0,400;0,600;0,700;1,400",
    description: "Artisanal, poetic & organic elegance",
    sampleHeadline: "Artisanal Fabrics & Pure Silks",
  },
];

export function getFontFamily(fontNameOrId?: string): string {
  if (!fontNameOrId) return "'Outfit', sans-serif";
  const found = AVAILABLE_FONTS.find(
    (f) =>
      f.id === fontNameOrId.toLowerCase() ||
      f.name.toLowerCase() === fontNameOrId.toLowerCase()
  );
  return found ? found.fontFamily : `'${fontNameOrId}', sans-serif`;
}
