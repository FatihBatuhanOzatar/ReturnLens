import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

// ── Gemini client ──────────────────────────────────────────────
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// ── Prompt Template ────────────────────────────────────────────
function buildPrompt(product: ProductData): string {
  const { product_info: info, reviews } = product;

  const reviewBlock = reviews
    .map(
      (r, i) =>
        `[${i + 1}] ⭐${r.rating} | ${r.date} | Satıcı: ${r.seller ?? "Bilinmiyor"}\n"${r.text}"`
    )
    .join("\n\n");

  return `Sen bir e-ticaret ürün analisti ve iade risk değerlendirme uzmanısın.

Aşağıdaki ürün bilgilerini ve kullanıcı yorumlarını dikkatlice analiz et.
Sahte yorumları (örneğin: "yorumum üste çıksın diye 5 yıldız veriyorum" gibi) tespit et ve analizi buna göre ayarla.

## ÜRÜN BİLGİLERİ
- Ürün: ${info.title}
- Marka: ${info.brand}
- Fiyat: ${info.price_current} TL${info.price_original ? ` (Orijinal: ${info.price_original} TL)` : ""}
- Kategori: ${info.category}
- Pazar Yeri: ${info.marketplace}
- Genel Puan: ${info.overall_rating ?? "Belirtilmemiş"} / 5
- Toplam Yorum: ${info.total_reviews ?? "Belirtilmemiş"}
- Ana Satıcı: ${info.main_seller}
- Satıcı Puanı: ${info.seller_rating ?? "Belirtilmemiş"}

## KULLANICI YORUMLARI (${reviews.length} adet)
${reviewBlock}

## GÖREV
Yukarıdaki verileri analiz ederek aşağıdaki JSON formatında yanıt ver. Başka hiçbir metin ekleme, sadece JSON döndür:

{
  "risk_score": <1-100 arası sayı, 100 en yüksek iade riski>,
  "risk_level": "<düşük | orta | yüksek>",
  "confidence": <50-100 arası, analizin güvenilirlik yüzdesi>,
  "summary": "<Türkçe, 2-3 cümle ile genel değerlendirme>",
  "pros": ["<olumlu yön 1>", "<olumlu yön 2>", ...],
  "cons": ["<olumsuz yön 1>", "<olumsuz yön 2>", ...],
  "return_reasons": ["<en sık iade nedeni 1>", "<en sık iade nedeni 2>", ...],
  "fake_review_warning": <true | false>,
  "fake_review_details": "<varsa sahte yorum açıklaması, yoksa null>",
  "recommendation": "<Türkçe, kullanıcıya 1-2 cümlelik tavsiye>",
  "review_sentiment": {
    "positive_pct": <yüzde>,
    "negative_pct": <yüzde>,
    "neutral_pct": <yüzde>
  },
  "category_risk_note": "<Bu kategori genel olarak iade açısından nasıl? 1 cümle>"
}`;
}

// ── Types ──────────────────────────────────────────────────────
interface Review {
  rating: number;
  text: string;
  date: string;
  seller: string | null;
}

interface ProductInfo {
  title: string;
  brand: string;
  price_current: number;
  price_original?: number;
  category: string;
  marketplace: string;
  favorite_count?: string;
  overall_rating: number | null;
  total_reviews: number | null;
  main_seller: string;
  seller_rating: number | null;
}

interface ProductData {
  id: string;
  product_info: ProductInfo;
  reviews: Review[];
}

interface AnalysisResult {
  risk_score: number;
  risk_level: string;
  confidence: number;
  summary: string;
  pros: string[];
  cons: string[];
  return_reasons: string[];
  fake_review_warning: boolean;
  fake_review_details: string | null;
  recommendation: string;
  review_sentiment: {
    positive_pct: number;
    negative_pct: number;
    neutral_pct: number;
  };
  category_risk_note: string;
}

// ── Helpers ────────────────────────────────────────────────────

/** List all available product IDs from the data directory */
async function listProductIds(): Promise<string[]> {
  const dataDir = path.join(process.cwd(), "data", "products");
  const files = await fs.readdir(dataDir);
  return files
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.replace(".json", ""));
}

/** Load a single product JSON by ID */
async function loadProduct(productId: string): Promise<ProductData> {
  const filePath = path.join(
    process.cwd(),
    "data",
    "products",
    `${productId}.json`
  );
  const raw = await fs.readFile(filePath, "utf-8");
  return JSON.parse(raw) as ProductData;
}

/** Send prompt to Gemini and parse the JSON response */
async function analyzeWithGemini(
  product: ProductData
): Promise<AnalysisResult> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = buildPrompt(product);

  const result = await model.generateContent(prompt);
  const response = result.response;
  const text = response.text();

  // Gemini may wrap JSON in ```json ... ``` — strip it
  const cleaned = text
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();

  return JSON.parse(cleaned) as AnalysisResult;
}

// ── POST /api/analyze ──────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId } = body as { productId?: string };

    if (!productId) {
      return NextResponse.json(
        { error: "productId alanı gerekli." },
        { status: 400 }
      );
    }

    // Validate that the product exists
    const availableIds = await listProductIds();
    if (!availableIds.includes(productId)) {
      return NextResponse.json(
        {
          error: `Ürün bulunamadı: "${productId}"`,
          available: availableIds,
        },
        { status: 404 }
      );
    }

    // Load the product data
    const product = await loadProduct(productId);

    // Call Gemini for analysis
    const analysis = await analyzeWithGemini(product);

    // Return analysis combined with product info
    return NextResponse.json({
      success: true,
      product: {
        id: product.id,
        title: product.product_info.title,
        brand: product.product_info.brand,
        price: product.product_info.price_current,
        rating: product.product_info.overall_rating,
        reviewCount: product.reviews.length,
        marketplace: product.product_info.marketplace,
      },
      analysis,
    });
  } catch (err) {
    console.error("[/api/analyze] Error:", err);

    const message =
      err instanceof Error ? err.message : "Bilinmeyen bir hata oluştu.";

    // Detect Gemini rate limit errors
    if (message.includes("429") || message.includes("Too Many Requests")) {
      return NextResponse.json(
        {
          error: "API kota limiti aşıldı.",
          details:
            "Gemini API ücretsiz kullanım kotası dolmuş. Lütfen birkaç dakika bekleyip tekrar deneyin veya API planınızı yükseltin.",
          retryable: true,
        },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: "Analiz sırasında bir hata oluştu.", details: message },
      { status: 500 }
    );
  }
}

// ── GET /api/analyze — list available products ─────────────────
export async function GET() {
  try {
    const ids = await listProductIds();

    // Load basic info for each product
    const products = await Promise.all(
      ids.map(async (id) => {
        const product = await loadProduct(id);
        return {
          id,
          title: product.product_info.title,
          brand: product.product_info.brand,
          price: product.product_info.price_current,
          rating: product.product_info.overall_rating,
          reviewCount: product.reviews.length,
          marketplace: product.product_info.marketplace,
          category: product.product_info.category,
        };
      })
    );

    return NextResponse.json({ products });
  } catch (err) {
    console.error("[/api/analyze] GET Error:", err);
    return NextResponse.json(
      { error: "Ürün listesi alınamadı." },
      { status: 500 }
    );
  }
}
