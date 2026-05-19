// data/products/*.json'u tek seferde yükler, normalize eder.
// Server-side (RSC) içinde import edilir; client'a Product[] olarak geçilir.

import { normalizeMany } from "./normalize";
import type { RawProduct, Product } from "./types";

// Static JSON imports — Next.js bunları build sırasında bundle eder.
import p1 from "@/data/products/p1_high_risk.json";
import p2 from "@/data/products/p2_low_risk.json";
import p3 from "@/data/products/p3_high_risk.json";
import p4 from "@/data/products/p4_high_risk.json";
import p5 from "@/data/products/p5_average_risk.json";
import p6 from "@/data/products/p6_low_risk.json";

export const RAW_PRODUCTS: RawProduct[] = [
  p1 as RawProduct,
  p2 as RawProduct,
  p3 as RawProduct,
  p4 as RawProduct,
  p5 as RawProduct,
  p6 as RawProduct,
];

export const PRODUCTS: Product[] = normalizeMany(RAW_PRODUCTS);

export function getRawProductById(id: string): RawProduct | undefined {
  return RAW_PRODUCTS.find(p => p.id === id);
}
