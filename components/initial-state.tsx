"use client";

import { useState } from "react";
import type { Product } from "@/lib/types";
import { StripesPlaceholder } from "./ui";

interface CardProps {
  product: Product;
  idx: number;
  onAnalyze: (p: Product) => void;
}

function ProductCard({ product, idx, onAnalyze }: CardProps) {
  const folio = `N° ${(idx + 1).toString().padStart(3, "0")}`;
  return (
    <article className="product-card">
      <div className="product-folio">{folio}</div>
      <div className="product-img">
        <StripesPlaceholder seed={idx + 3} />
        <div className="crosshair"></div>
        <span className="product-img-label">{product.imgLabel}</span>
      </div>
      <div className="product-meta">
        <span className={`market-badge ${product.marketplace.toLowerCase()}`}>
          {product.marketplace}
        </span>
        <span>· {product.category}</span>
      </div>
      <h3 className="product-title">{product.title}</h3>
      <div className="product-stats">
        <div>
          <span className="product-stat-label">Puan</span>
          <span className="product-stat-val">
            {product.rating != null ? product.rating.toFixed(1) + " ★" : "—"}
          </span>
        </div>
        <div>
          <span className="product-stat-label">Yorum</span>
          <span className="product-stat-val">{product.reviewCount}</span>
        </div>
        <div style={{ textAlign: "right" }}>
          <span className="product-stat-label">Fiyat</span>
          <span className="product-price">
            {product.price.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
            <small>₺</small>
          </span>
        </div>
      </div>
      <button className="btn-analyze" onClick={() => onAnalyze(product)}>
        <span>Analiz Et</span>
        <svg viewBox="0 0 16 16" fill="none">
          <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </article>
  );
}

interface Props {
  products: Product[];
  onAnalyze: (p: Product) => void;
}

export function InitialState({ products, onAnalyze }: Props) {
  const [filter, setFilter] = useState<string>("all");

  // marketplace listesini ürünlerden dinamik türet
  const marketplaces = Array.from(new Set(products.map(p => p.marketplace)));
  const filters = [
    { key: "all", label: "Tümü" },
    ...marketplaces.map(m => ({ key: m, label: m })),
  ];
  const filtered = filter === "all" ? products : products.filter(p => p.marketplace === filter);

  return (
    <div className="fade-in">
      <section className="hero">
        <div>
          <div className="hero-eyebrow">
            <span>Vol. 01 — Edisyon 04</span>
            <span>● Canlı</span>
            <span>{new Date().toLocaleDateString("tr-TR", { month: "long", year: "numeric" })}</span>
          </div>
          <h1>
            Satın almadan önce<br/>
            <em>iade riskini</em> öğren.
          </h1>
        </div>
        <p className="hero-sub">
          ReturnLens, ürün yorumlarını okuyup iade olasılığını rakama döken bir analiz aracıdır.
          Tıpkı bir kredi raporu gibi — sadece ürünler için.
        </p>
        <div className="hero-steps">
          <div className="hero-step">
            <span className="hero-step-n">01</span>
            <div>
              <div className="hero-step-t">Ürün seç</div>
              <div className="hero-step-d">Kataloğumuzdan bir ürün belirle.</div>
            </div>
          </div>
          <div className="hero-step">
            <span className="hero-step-n">02</span>
            <div>
              <div className="hero-step-t">Yorumlar okunur</div>
              <div className="hero-step-d">Gemini onlarca yorumu paralel inceler.</div>
            </div>
          </div>
          <div className="hero-step">
            <span className="hero-step-n">03</span>
            <div>
              <div className="hero-step-t">Rapor üretilir</div>
              <div className="hero-step-d">İade riski 100 üzerinden puanlanır.</div>
            </div>
          </div>
        </div>
      </section>

      <section className="products-section">
        <div className="products-head">
          <div>
            <div className="section-label">§01 — Katalog</div>
            <h2>Bir ürün seç ve <em>analiz et</em>.</h2>
          </div>
          <div className="products-filter">
            {filters.map(f => (
              <button key={f.key} className={filter === f.key ? "on" : ""} onClick={() => setFilter(f.key)}>
                {f.label}
              </button>
            ))}
          </div>
        </div>
        <div className="product-grid">
          {filtered.map((p, i) => (
            <ProductCard key={p.id} product={p} idx={i} onAnalyze={onAnalyze} />
          ))}
        </div>
      </section>
    </div>
  );
}
