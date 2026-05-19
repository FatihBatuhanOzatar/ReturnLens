"use client";

import { useState } from "react";
import type { Product } from "@/lib/types";
import type { HistoryEntry } from "@/lib/history";
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

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "az once";
  if (mins < 60) return `${mins} dk once`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} saat once`;
  const days = Math.floor(hrs / 24);
  return `${days} gun once`;
}

function riskColor(level: string): string {
  if (level === "dusuk" || level === "düşük") return "risk-low";
  if (level === "orta") return "risk-mid";
  return "risk-high";
}

interface Props {
  products: Product[];
  onAnalyze: (p: Product) => void;
  onAnalyzeUrl?: (url: string) => void;
  onAnalyzeImage?: (file: File) => void;
  history?: HistoryEntry[];
  onViewReport?: (entry: HistoryEntry) => void;
}

export function InitialState({ products, onAnalyze, onAnalyzeUrl, onAnalyzeImage, history = [], onViewReport }: Props) {
  const [filter, setFilter] = useState<string>("all");
  const [url, setUrl] = useState<string>("");
  const [inputMode, setInputMode] = useState<"screenshot" | "url">("screenshot");
  const [dragOver, setDragOver] = useState(false);
  const [previewName, setPreviewName] = useState<string | null>(null);

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim() && onAnalyzeUrl) {
      onAnalyzeUrl(url.trim());
    }
  };

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setPreviewName(file.name);
    if (onAnalyzeImage) onAnalyzeImage(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (const item of items) {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) handleFile(file);
        break;
      }
    }
  };

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

        {(onAnalyzeImage || onAnalyzeUrl) && (
          <div className="input-section">
            <div className="input-tabs">
              <button
                className={`input-tab ${inputMode === "screenshot" ? "active" : ""}`}
                onClick={() => setInputMode("screenshot")}
              >
                Ekran Görüntüsü
              </button>
              <button
                className={`input-tab ${inputMode === "url" ? "active" : ""}`}
                onClick={() => setInputMode("url")}
              >
                URL
              </button>
            </div>

            {inputMode === "screenshot" && onAnalyzeImage && (
              <div
                className={`drop-zone ${dragOver ? "drag-over" : ""}`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onPaste={handlePaste}
                tabIndex={0}
                onClick={() => {
                  const input = document.createElement("input");
                  input.type = "file";
                  input.accept = "image/*";
                  input.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (file) handleFile(file);
                  };
                  input.click();
                }}
              >
                <div className="drop-zone-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <path d="M21 15l-5-5L5 21" />
                  </svg>
                </div>
                <div className="drop-zone-text">
                  Yorumların ekran görüntüsünü <strong>sürükle</strong>, <strong>yapıştır</strong> veya <strong>tıkla</strong>
                </div>
                <div className="drop-zone-hint">
                  Trendyol, Amazon, Hepsiburada -- herhangi bir site
                </div>
              </div>
            )}

            {inputMode === "url" && onAnalyzeUrl && (
              <form className="url-form" onSubmit={handleUrlSubmit}>
                <input
                  type="url"
                  className="url-input"
                  placeholder="Trendyol ürün linkini yapıştır..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  required
                />
                <button type="submit" className="btn-primary url-submit">
                  Analiz Et
                  <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                    <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </form>
            )}
          </div>
        )}
      </section>

      {history.length > 0 && onViewReport && (
        <section className="history-section">
          <div className="history-head">
            <div className="section-label">Son Analizler</div>
            <span className="history-count">{history.length} rapor</span>
          </div>
          <div className="history-list">
            {history.map((entry, i) => (
              <button
                key={`${entry.product.id}-${i}`}
                className="history-item"
                onClick={() => onViewReport(entry)}
              >
                <span className={`history-score ${riskColor(entry.analysis.risk_level)}`}>
                  {entry.analysis.risk_score}
                </span>
                <span className="history-info">
                  <span className="history-title">{entry.product.title}</span>
                  <span className="history-meta">
                    {entry.product.marketplace} · {timeAgo(entry.date)}
                  </span>
                </span>
                <span className="history-arrow">
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                    <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

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
