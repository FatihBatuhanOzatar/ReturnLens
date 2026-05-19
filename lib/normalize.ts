// Ham JSON şemasını (RawProduct) tasarımın beklediği Product şemasına çevirir.
import type { RawProduct, Product } from "./types";

/**
 * Görsel placeholder etiketi türetir: "KULAKLIK 01A", "ÇANTA 02B" gibi.
 * Kategorinin son segmentinden + id'nin son karakterinden çıkarır.
 */
function imgLabelFor(raw: RawProduct): string {
  const lastSegment = raw.product_info.category.split("/").pop()?.trim() ?? "ÜRÜN";
  const word = lastSegment.split(" ")[0].toUpperCase().slice(0, 12);
  const idx = raw.id.match(/\d+/)?.[0]?.padStart(2, "0") ?? "00";
  const letter = String.fromCharCode(64 + (parseInt(idx, 10) % 6 || 1)); // A-F
  return `${word} ${idx}${letter}`;
}

export function normalizeProduct(raw: RawProduct): Product {
  return {
    id: raw.id,
    title: raw.product_info.title,
    brand: raw.product_info.brand,
    price: raw.product_info.price_current,
    rating: raw.product_info.overall_rating ?? null,
    reviewCount: raw.product_info.total_reviews ?? raw.reviews.length,
    marketplace: raw.product_info.marketplace,
    category: raw.product_info.category,
    imgLabel: imgLabelFor(raw),
  };
}

export function normalizeMany(raws: RawProduct[]): Product[] {
  return raws.map(normalizeProduct);
}
