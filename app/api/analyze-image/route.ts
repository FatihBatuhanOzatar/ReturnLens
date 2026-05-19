// POST /api/analyze-image
// Ekran görüntüsünden yorumları okuyup iade riski analizi yapar (Gemini Vision)

import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { Analysis } from "@/lib/types";

const SYSTEM_PROMPT = `Sen bir e-ticaret iade riski analiz asistanısın.
Sana bir e-ticaret sitesindeki ürün yorumlarının ekran görüntüsü verilecek.

GÖREVLERİN:
1. Görseldeki tüm yorumları oku ve anla.
2. Eğer görünüyorsa ürün adını, markasını, fiyatını ve puanını belirle.
3. Yorumları analiz ederek iade riski değerlendirmesi yap.

ÇIKTI ŞEMASI (kesinlikle bu şekilde, başka alan yok — sadece JSON):
{
  "product_name": "<görselden çıkarılan ürün adı, yoksa 'Bilinmeyen Ürün'>",
  "product_brand": "<marka, yoksa 'Bilinmeyen'>",
  "product_price": <fiyat sayı olarak, yoksa 0>,
  "product_rating": <puan 1-5 arası veya null>,
  "review_count": <görseldeki yorum sayısı>,
  "risk_score": <1-100 arası tamsayı>,
  "risk_level": "düşük" | "orta" | "yüksek",
  "confidence": <50-100 arası tamsayı>,
  "summary": "<2-3 cümlelik özet>",
  "recommendation": "<bir cümle tavsiye>",
  "pros": ["<artı 1>", "<artı 2>", ...],
  "cons": ["<eksi 1>", "<eksi 2>", ...],
  "return_reasons": [
    { "text": "<en sık iade nedeni>", "pct": <0-100> },
    ...
  ],
  "sentiment": {
    "positive": <0-100>,
    "neutral": <0-100>,
    "negative": <0-100>
  },
  "fake_review_warning": <true | false>,
  "fake_review_details": "<açıklama veya null>",
  "category_risk_note": "<bir cümle>"
}

KURALLAR:
- risk_score 0-33 ise risk_level "düşük", 34-66 ise "orta", 67+ ise "yüksek"
- Görselde çok az yorum varsa (5'ten az) confidence 65'i geçmesin
- pros ve cons en az 3, en fazla 6 madde olsun
- return_reasons en fazla 5 madde, pct toplamı yaklaşık 100
- sentiment toplamı 100 olmalı
- Sadece JSON döndür, açıklama yapma`;

const USE_MOCK = process.env.USE_MOCK === "true";

export async function POST(req: Request) {
  try {
    const { image, mimeType } = await req.json();

    if (!image) {
      return NextResponse.json({ error: "Görsel verisi bulunamadı." }, { status: 400 });
    }

    if (USE_MOCK) {
      return NextResponse.json({
        product: {
          id: "screenshot-mock",
          title: "Ekran Görüntüsünden Ürün",
          brand: "Bilinmeyen",
          price: 0,
          rating: 3.8,
          reviewCount: 12,
          marketplace: "Ekran Görüntüsü",
          category: "Genel",
          imgLabel: "SS",
        },
        analysis: {
          risk_score: 42,
          risk_level: "orta" as const,
          confidence: 72,
          summary: "Ekran görüntüsündeki yorumlara göre ürünün iade riski orta seviyededir.",
          recommendation: "Satıcı puanını ve kargo süresini kontrol etmenizi tavsiye ederiz.",
          pros: ["Fiyat/performans oranı iyi", "Hızlı kargo", "Kullanımı kolay"],
          cons: ["Malzeme kalitesi düşük", "Beden/renk uyumsuzluğu", "Ambalaj yetersiz"],
          return_reasons: [
            { text: "Beklentinin altında kalite", pct: 35 },
            { text: "Beden/boyut uyumsuzluğu", pct: 28 },
            { text: "Renk farklılığı", pct: 20 },
            { text: "Hasarlı teslimat", pct: 17 },
          ],
          sentiment: { positive: 52, neutral: 18, negative: 30 },
          fake_review_warning: false,
          fake_review_details: null,
          category_risk_note: "Genel kategori iade oranı ortalama seviyededir.",
        },
      });
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

    // Base64 görseli Gemini'ye gönder
    const result = await model.generateContent([
      SYSTEM_PROMPT,
      {
        inlineData: {
          mimeType: mimeType || "image/png",
          data: image, // base64 string
        },
      },
      "Bu ekran görüntüsündeki yorumları analiz et ve JSON yanıtı üret.",
    ]);

    const text = result.response.text();
    const parsed = JSON.parse(text);

    // Product ve Analysis objelerini ayır
    const product = {
      id: `ss-${Date.now()}`,
      title: parsed.product_name || "Ekran Görüntüsünden Ürün",
      brand: parsed.product_brand || "Bilinmeyen",
      price: parsed.product_price || 0,
      rating: parsed.product_rating || null,
      reviewCount: parsed.review_count || 0,
      marketplace: "Ekran Görüntüsü",
      category: "Genel",
      imgLabel: "SS",
    };

    const analysis: Analysis = {
      risk_score: parsed.risk_score,
      risk_level: parsed.risk_level,
      confidence: parsed.confidence,
      summary: parsed.summary,
      recommendation: parsed.recommendation,
      pros: parsed.pros,
      cons: parsed.cons,
      return_reasons: parsed.return_reasons,
      sentiment: parsed.sentiment,
      fake_review_warning: parsed.fake_review_warning,
      fake_review_details: parsed.fake_review_details,
      category_risk_note: parsed.category_risk_note,
    };

    return NextResponse.json({ product, analysis });
  } catch (err: any) {
    console.error("[/api/analyze-image]", err);

    if (err.status === 429 || err.message?.includes("429")) {
      return NextResponse.json(
        { error: "Gemini API kotası dolmuş. Lütfen bir süre sonra tekrar deneyin." },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Bilinmeyen hata" },
      { status: 500 }
    );
  }
}
