// POST /api/analyze
// Bir ürünün ham yorumlarını Gemini'ye gönderir, yapılandırılmış Analysis JSON döner.

import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getRawProductById, RAW_PRODUCTS } from "@/lib/products";
import { normalizeProduct } from "@/lib/normalize";
import type { Analysis, AnalyzeResponse } from "@/lib/types";

// Gemini'ye verilecek system prompt — Türkçe iade riski analizi
const SYSTEM_PROMPT = `Sen bir e-ticaret iade riski analiz asistanısın. Türkçe ürün yorumlarını okuyup yapılandırılmış JSON üreteceksin.

ÇIKTI ŞEMASI (kesinlikle bu şekilde, başka alan yok, başka açıklama yok — sadece JSON):
{
  "risk_score": <1-100 arası tamsayı>,
  "risk_level": "düşük" | "orta" | "yüksek",
  "confidence": <50-100 arası tamsayı — güvenilirlik yüzdesi>,
  "summary": "<2-3 cümlelik özet>",
  "recommendation": "<bir cümle tavsiye>",
  "pros": ["<artı 1>", "<artı 2>", ...], // 3-6 madde
  "cons": ["<eksi 1>", "<eksi 2>", ...], // 3-6 madde
  "return_reasons": [
    { "text": "<en sık iade nedeni>", "pct": <0-100> },
    ...
  ], // En sık başta, max 5 madde, pct toplamı yaklaşık 100 olmalı
  "sentiment": {
    "positive": <0-100>,
    "neutral": <0-100>,
    "negative": <0-100>
  }, // Toplamı 100 olmalı
  "fake_review_warning": <true | false>,
  "fake_review_details": "<sahte yorum tespit edildiyse açıklama, yoksa null>",
  "category_risk_note": "<bu kategorinin genel iade eğilimi hakkında bir cümle>"
}

KURALLAR:
- risk_score 0-33 ise risk_level "düşük", 34-66 ise "orta", 67+ ise "yüksek"
- Sahte yorumu sadece şüpheli kalıplar varsa (benzer dilbilgisi, aynı tarih kümesi vs.) işaretle
- Yorum sayısı 15'ten azsa confidence 70'i geçmesin
- Sadece JSON döndür, açıklama yapma`;

// Mock modu: .env.local'a USE_MOCK=true ekle veya API key yoksa otomatik aktif olur
const USE_MOCK = process.env.USE_MOCK === "true";

function getMockAnalysis(rating: number | null): Analysis {
  const r = rating ?? 3.0;
  const score = Math.round(Math.max(10, Math.min(95, (5 - r) * 22 + 10)));
  const level = score <= 33 ? "düşük" : score <= 66 ? "orta" : "yüksek";
  return {
    risk_score: score,
    risk_level: level as Analysis["risk_level"],
    confidence: 85,
    summary: "Bu üründe iade riski " + level + " seviyededir. Yorumların önemli bir kısmı şarj alımı, tek kulaklık çalışması ve senkronizasyon problemlerine işaret ediyor. Pozitif yorumlar ses kalitesini ve tasarımı övse de, kullanım ömrü kısa sürede sorun çıkaran bir model olarak öne çıkıyor.",
    recommendation: "Aynı fiyat bandında ses kalitesi yorumları yüksek, garantisi resmi distribütör üzerinden gelen alternatifleri değerlendirmenizi tavsiye ederiz.",
    pros: ["Ses kalitesi fiyatına göre tatmin edici", "Hafif ve ergonomik tasarım", "Hızlı eşleşme — kutudan çıktığı gibi", "Kargo paketleme özenli"],
    cons: ["Şarj yuvası belli süre sonra temas problemi yapıyor", "Sol kulaklık ayrı çalışıyor, çift kullanımda kesinti", "Batarya 6-8 ay sonra dramatik düşüyor", "Bas tepkisi düşük, müzik dinleme için zayıf"],
    return_reasons: [
      { text: "Şarj almama / kontak sorunu", pct: 38 },
      { text: "Tek kulaklık eşleşme hatası", pct: 24 },
      { text: "Ses kalitesi beklentinin altında", pct: 18 },
      { text: "Mikrofon arızası", pct: 11 },
      { text: "Diğer", pct: 9 },
    ],
    sentiment: { positive: 48, neutral: 14, negative: 38 },
    fake_review_warning: true,
    fake_review_details: "Yorumların yaklaşık %12'si benzer dilbilgisi yapısı ve yüklenme tarihi nedeniyle organik dışı olarak işaretlendi.",
    category_risk_note: "Bluetooth kulaklık kategorisi genel olarak orta-yüksek iade oranına sahiptir; ortalama iade oranı %22 civarındadır.",
  };
}

export async function POST(req: Request) {
  try {
    const { productId, rawProduct } = await req.json();
    let raw = rawProduct;
    
    // Eğer dışarıdan scrape edilmiş ürün gelmediyse, lokal dosyadan ID ile ara
    if (!raw && productId) {
      raw = getRawProductById(productId);
    }

    if (!raw) {
      return NextResponse.json({ error: "Ürün bulunamadı veya geçerli bir veri sağlanmadı." }, { status: 404 });
    }

    // Mock modunda Gemini'ye gitmeden sahte veri döndür
    if (USE_MOCK) {
      const response: AnalyzeResponse = {
        product: normalizeProduct(raw),
        analysis: getMockAnalysis(raw.product_info.overall_rating),
      };
      return NextResponse.json(response);
    }

    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GOOGLE_GENERATIVE_AI_API_KEY ayarlı değil" },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-3.5-flash",
      generationConfig: { responseMimeType: "application/json" },
    });

    // Yorumları kısa bir formata sokup prompt'a ekle
    const reviewsBlock = raw.reviews
      .slice(0, 60) // çok uzun olmasın
      .map(r => `[${r.rating}★] ${r.text}`)
      .join("\n");

    const userPrompt = `${SYSTEM_PROMPT}

ÜRÜN: ${raw.product_info.title}
MARKA: ${raw.product_info.brand}
KATEGORİ: ${raw.product_info.category}
FİYAT: ${raw.product_info.price_current}₺
GENEL PUAN: ${raw.product_info.overall_rating ?? "yok"} / 5 (${raw.product_info.total_reviews} yorum)

YORUMLAR:
${reviewsBlock}

JSON yanıtı üret:`;

    const result = await model.generateContent(userPrompt);
    const text = result.response.text();
    const analysis = JSON.parse(text) as Analysis;

    // Tasarımın beklediği şekilde Product + Analysis döndür
    const response: AnalyzeResponse = {
      product: normalizeProduct(raw),
      analysis,
    };
    return NextResponse.json(response);
  } catch (err: any) {
    console.error("[/api/analyze]", err);
    
    // Spesifik hata kontrolü - 429 Too Many Requests (Kota limiti)
    if (err.status === 429 || (err.message && err.message.includes('429'))) {
      return NextResponse.json(
        { error: "Gemini API ücretsiz kotası dolmuş. Lütfen bir süre sonra tekrar deneyin veya API anahtarınızı güncelleyin." },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Bilinmeyen hata" },
      { status: 500 }
    );
  }
}

// Build sırasında hangi ürünlerin var olduğunu görmek için yardımcı GET
export async function GET() {
  return NextResponse.json({
    available: RAW_PRODUCTS.map(p => ({ id: p.id, title: p.product_info.title })),
  });
}
