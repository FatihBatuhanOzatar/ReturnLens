import { NextResponse } from "next/server";
import type { RawProduct, RawProductInfo, RawReview } from "@/lib/types";

export async function POST(req: Request) {
  try {
    const { url } = await req.json();
    if (!url || !url.includes("trendyol.com")) {
      return NextResponse.json({ error: "Şimdilik sadece Trendyol URL'leri desteklenmektedir." }, { status: 400 });
    }

    const match = url.match(/-p-(\d+)/);
    if (!match) {
      return NextResponse.json({ error: "Ürün linkinden ID bulunamadı. Lütfen geçerli bir Trendyol ürün linki girin." }, { status: 400 });
    }
    const productId = match[1];

    // 1. Ürün detaylarını çek
    const productRes = await fetch(`https://public-mdc.trendyol.com/discovery-web-productgw-service/api/productDetail/${productId}`);
    if (!productRes.ok) {
       return NextResponse.json({ error: "Trendyol'dan ürün bilgisi çekilemedi." }, { status: 500 });
    }
    const productData = await productRes.json();
    
    // 2. Yorumları çek
    const reviewRes = await fetch(`https://public-mdc.trendyol.com/discovery-web-socialgw-service/api/review/${productId}`);
    let reviewsData = null;
    if (reviewRes.ok) {
       reviewsData = await reviewRes.json();
    }

    const result = productData.result;
    if (!result) {
       return NextResponse.json({ error: "Trendyol bu ürün için eksik veri döndürdü." }, { status: 500 });
    }

    // 3. Veriyi RawProduct şemasına dönüştür
    const rawProductInfo: RawProductInfo = {
      title: result.name || "Bilinmeyen Ürün",
      brand: result.brand?.name || "Bilinmeyen Marka",
      price_current: result.price?.discountedPrice?.value || 0,
      price_original: result.price?.originalPrice?.value || undefined,
      category: result.category?.name || "Genel",
      marketplace: "Trendyol",
      favorite_count: result.favoriteCount?.toString(),
      overall_rating: result.ratingScore?.averageRating || null,
      total_reviews: result.ratingScore?.totalCount || null,
      main_seller: result.merchant?.name || undefined,
      seller_rating: result.merchant?.merchantScore || undefined,
    };

    const rawReviews: RawReview[] = (reviewsData?.result?.productReviews?.content || []).map((r: any) => ({
      rating: r.rate,
      text: r.comment,
      date: r.commentDateISOtype || new Date().toISOString(),
      seller: r.sellerName,
    }));

    const rawProduct: RawProduct = {
      id: productId,
      product_info: rawProductInfo,
      reviews: rawReviews,
    };

    return NextResponse.json({ rawProduct });
  } catch (err: any) {
    console.error("[/api/scrape]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Sunucu hatası" }, { status: 500 });
  }
}
