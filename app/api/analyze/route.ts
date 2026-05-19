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

export async function POST(req: Request) {
  try {
    const { productId } = await req.json();
    const raw = getRawProductById(productId);
    if (!raw) {
      return NextResponse.json({ error: "Ürün bulunamadı" }, { status: 404 });
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
      model: "gemini-2.0-flash-exp",
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
