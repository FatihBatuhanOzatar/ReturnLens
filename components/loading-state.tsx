"use client";

import { useEffect, useState } from "react";
import type { Product } from "@/lib/types";
import { StripesPlaceholder } from "./ui";

const STEPS = [
  { label: "Yorumlar çekiliyor", time: "~1s" },
  { label: "Dil işleme · token analizi", time: "~2s" },
  { label: "Duygu sınıflandırması", time: "~2s" },
  { label: "İade nedenleri çıkarımı", time: "~1s" },
  { label: "Risk skoru hesaplanıyor", time: "~1s" },
];

export function LoadingState({ product }: { product: Product }) {
  const [stepIdx, setStepIdx] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setProgress(p => Math.min(98, p + Math.random() * 3 + 1.5));
    }, 70);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const stepDur = 600;
    const timers = STEPS.map((_, i) =>
      setTimeout(() => setStepIdx(i + 1), stepDur * (i + 1))
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="loading-wrap fade-in">
      <div className="loading-card">
        <span className="loading-card-folio">
          Analiz · İşlem N° {String(Math.floor(Math.random() * 9000) + 1000)}
        </span>

        <div className="loading-product">
          <div className="loading-product-img">
            <StripesPlaceholder seed={7} />
            <div className="crosshair" style={{ position: "absolute", inset: 0 }}></div>
          </div>
          <div className="loading-product-info">
            <h3>{product.title}</h3>
            <div className="meta">
              {product.rating != null ? `★ ${product.rating.toFixed(1)} · ` : ""}
              {product.reviewCount} yorum · {product.price.toLocaleString("tr-TR")}₺ · {product.marketplace}
            </div>
          </div>
        </div>

        <h2 className="loading-status">Yorumlar inceleniyor…</h2>
        <div className="loading-substatus">
          Gemini iade riskini hesaplıyor — bu birkaç saniye sürebilir
        </div>

        <div className="loading-steps">
          {STEPS.map((s, i) => (
            <div key={i}
              className={`loading-step ${i < stepIdx ? "done" : i === stepIdx ? "active" : ""}`}>
              <span className="loading-step-tick"></span>
              <span>{s.label}</span>
              <span className="loading-step-time">{s.time}</span>
            </div>
          ))}
        </div>

        <div className="loading-progress">
          <div className="loading-progress-ticks">
            {Array.from({ length: 21 }).map((_, i) => <span key={i}></span>)}
          </div>
          <div className="loading-progress-fill" style={{ width: `${progress}%` }}></div>
          <div className="loading-progress-needle" style={{ left: `${progress}%` }}></div>
        </div>
      </div>
    </div>
  );
}
