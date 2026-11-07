/** States and union territories, as buyers pick them at checkout. */
export const INDIA_STATES = [
  "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chandigarh", "Chhattisgarh",
  "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir",
  "Jharkhand", "Karnataka", "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya",
  "Mizoram", "Nagaland", "Odisha", "Puducherry", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
  "Uttar Pradesh", "Uttarakhand", "West Bengal",
];

/** India Post's names that differ from the list above. */
const ALIASES: Record<string, string> = {
  "andaman & nicobar islands": "Andaman and Nicobar Islands",
  "jammu & kashmir": "Jammu and Kashmir",
  "dadra & nagar haveli": "Dadra and Nagar Haveli and Daman and Diu",
  "daman & diu": "Dadra and Nagar Haveli and Daman and Diu",
  "dadra and nagar haveli": "Dadra and Nagar Haveli and Daman and Diu",
  "daman and diu": "Dadra and Nagar Haveli and Daman and Diu",
  "pondicherry": "Puducherry",
  "orissa": "Odisha",
  "uttaranchal": "Uttarakhand",
  "new delhi": "Delhi",
};

export function matchState(name: string): string {
  const n = name.trim().toLowerCase();
  if (ALIASES[n]) return ALIASES[n];
  return INDIA_STATES.find((s) => s.toLowerCase() === n.replace(/&/g, "and")) || "";
}

/** The state a PIN code belongs to, from its first digits (used when India Post can't be reached). */
export function stateFromPin(pin: string): string {
  const p2 = Number(pin.slice(0, 2));
  const p3 = Number(pin.slice(0, 3));
  if (p3 >= 744 && p3 <= 744) return "Andaman and Nicobar Islands";
  if (p3 >= 682 && p3 <= 682 && pin.startsWith("6825")) return "Lakshadweep";
  if (p3 === 403) return "Goa";
  if (p3 === 160) return "Chandigarh";
  if (p3 === 194) return "Ladakh";
  if (p3 === 605 || p3 === 533 && pin.startsWith("5334")) return "Puducherry";
  if (p3 === 737) return "Sikkim";
  if (p3 === 790 || p3 === 791 || p3 === 792) return "Arunachal Pradesh";
  if (p3 === 793 || p3 === 794) return "Meghalaya";
  if (p3 === 795) return "Manipur";
  if (p3 === 796) return "Mizoram";
  if (p3 === 797 || p3 === 798) return "Nagaland";
  if (p3 === 799) return "Tripura";
  if (p3 === 396 && pin.startsWith("3962")) return "Dadra and Nagar Haveli and Daman and Diu";
  if (p2 === 11) return "Delhi";
  if (p2 >= 12 && p2 <= 13) return "Haryana";
  if (p2 >= 14 && p2 <= 16) return "Punjab";
  if (p2 === 17) return "Himachal Pradesh";
  if (p2 >= 18 && p2 <= 19) return "Jammu and Kashmir";
  if (p2 >= 20 && p2 <= 28) return p3 >= 244 && p3 <= 249 ? "Uttarakhand" : "Uttar Pradesh";
  if (p2 >= 30 && p2 <= 34) return "Rajasthan";
  if (p2 >= 36 && p2 <= 39) return "Gujarat";
  if (p2 >= 40 && p2 <= 44) return "Maharashtra";
  if (p2 >= 45 && p2 <= 48) return "Madhya Pradesh";
  if (p2 === 49) return "Chhattisgarh";
  if (p2 >= 50 && p2 <= 50) return "Telangana";
  if (p2 >= 51 && p2 <= 53) return "Andhra Pradesh";
  if (p2 >= 56 && p2 <= 59) return "Karnataka";
  if (p2 >= 60 && p2 <= 66) return "Tamil Nadu";
  if (p2 >= 67 && p2 <= 69) return "Kerala";
  if (p2 >= 70 && p2 <= 74) return "West Bengal";
  if (p2 >= 75 && p2 <= 77) return "Odisha";
  if (p2 === 78) return "Assam";
  if (p2 >= 80 && p2 <= 85) return p2 >= 81 && p3 >= 814 && p3 <= 835 && p3 !== 821 ? "Jharkhand" : "Bihar";
  return "";
}
