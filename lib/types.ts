// ReturnLens — TypeScript types
// Hem ham JSON'unuzun şeması hem de tasarımın beklediği analiz şeması burada.

// ─── Ham veri (data/products/*.json) ─────────────────────────────────────────
export interface RawProductInfo {
  title: string;
  brand: string;
  price_current: number;
  price_original?: number;
  category: string;
  marketplace: string;
  favorite_count?: string;
  overall_rating: number | null;
  total_reviews: number | null;
  main_seller?: string;
  seller_rating?: number;
}

export interface RawReview {
  rating: number;
  text: string;
  date: string;
  seller?: string;
}

export interface RawProduct {
  id: string;
  product_info: RawProductInfo;
  reviews: RawReview[];
}

// ─── Tasarımın beklediği ürün özeti ─────────────────────────────────────────
// Liste/banner görünümleri için sadeleştirilmiş.
export interface Product {
  id: string;
  title: string;
  brand: string;
  price: number;
  rating: number | null;
  reviewCount: number;
  marketplace: string;        // "Trendyol" | "Amazon" | "Hepsiburada" vb.
  category: string;
  imgLabel: string;           // Görsel placeholder etiketi (ör. "KULAKLIK 01A")
}

// ─── Gemini'den dönecek analiz şeması ───────────────────────────────────────
// /api/analyze route bu şekilde JSON döndürmeli.
export type RiskLevel = "düşük" | "orta" | "yüksek";

export interface ReturnReason {
  text: string;
  pct: number;   // 0-100 — bu nedenin iadeler içindeki payı
}

export interface Sentiment {
  positive: number;  // 0-100
  neutral: number;
  negative: number;
}

export interface Analysis {
  risk_score: number;          // 1-100
  risk_level: RiskLevel;
  confidence: number;          // 50-100 (%)
  summary: string;             // 2-3 cümle özet
  recommendation: string;      // tavsiye (bir cümle)
  pros: string[];              // 3-6 madde
  cons: string[];              // 3-6 madde
  return_reasons: ReturnReason[]; // sıralı, en sık başta
  sentiment: Sentiment;
  fake_review_warning: boolean;
  fake_review_details: string | null;
  category_risk_note: string;
}

// Tek bir API yanıtı: ürün özeti + analiz
export interface AnalyzeResponse {
  product: Product;
  analysis: Analysis;
}
