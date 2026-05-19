"use client";

import { useState, useEffect } from "react";
import type { Product } from "@/lib/types";

interface Props {
  product: Product | null;
  statusCode: number;
  message: string;
  onBack: () => void;
  onRetry: () => void;
}

const ERROR_MAP: Record<number, { title: string; icon: string; retryable: boolean; retryDelay?: number }> = {
  429: {
    title: "Analiz motoru şu an yoğun",
    icon: "⏳",
    retryable: true,
    retryDelay: 60,
  },
  500: {
    title: "Analiz tamamlanamadı",
    icon: "⚠",
    retryable: true,
  },
  404: {
    title: "Ürün bulunamadı",
    icon: "∅",
    retryable: false,
  },
  0: {
    title: "Bağlantı kurulamadı",
    icon: "⊘",
    retryable: true,
  },
};

export function ErrorState({ product, statusCode, message, onBack, onRetry }: Props) {
  const config = ERROR_MAP[statusCode] || ERROR_MAP[500];
  const [countdown, setCountdown] = useState(config.retryDelay ?? 0);

  useEffect(() => {
    if (countdown <= 0) return;
    const id = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          clearInterval(id);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [countdown]);

  const canRetry = config.retryable && countdown === 0;

  return (
    <div className="error-wrap fade-in">
      <div className="error-card">
        <span className="error-card-folio">
          Hata · {statusCode || "Ağ Hatası"}
        </span>

        <div className="error-icon">{config.icon}</div>
        <h2 className="error-title">{config.title}</h2>
        <p className="error-message">{message}</p>

        {product && (
          <div className="error-product">
            <span>{product.title}</span>
            <span className="error-product-meta">
              {product.marketplace} · {product.price.toLocaleString("tr-TR")}₺
            </span>
          </div>
        )}

        {statusCode === 429 && countdown > 0 && (
          <div className="error-countdown">
            <div className="error-countdown-label">Otomatik yeniden deneme</div>
            <div className="error-countdown-num">
              {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, "0")}
            </div>
          </div>
        )}

        <div className="error-actions">
          {canRetry && (
            <button className="btn-primary" onClick={onRetry}>
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                <path d="M2 8a6 6 0 1 0 1.5-4M2 3v3h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Tekrar dene
            </button>
          )}
          <button className="btn-ghost" onClick={onBack}>
            <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
              <path d="M13 8H3M7 4L3 8l4 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Ürün seçimine dön
          </button>
        </div>

        <div className="error-help">
          {statusCode === 429
            ? "Gemini API ücretsiz kotası dolmuş olabilir. Yeni bir API anahtarı ile tekrar deneyebilirsin."
            : "Sorun devam ederse sayfayı yenile veya farklı bir ürün dene."}
        </div>
      </div>
    </div>
  );
}
