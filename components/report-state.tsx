"use client";

import type { Product, Analysis } from "@/lib/types";
import { RiskGauge } from "./risk-gauge";
import { StripesPlaceholder, SentimentBar } from "./ui";

interface Props {
  product: Product;
  analysis: Analysis;
  folioNum?: number;
  onBack: () => void;
}

export function ReportState({ product, analysis: a, folioNum = 42, onBack }: Props) {
  const riskClass =
    a.risk_level === "düşük" ? "risk-low"
    : a.risk_level === "orta" ? "risk-mid"
    : "risk-high";
  const riskLabel = a.risk_level.toUpperCase();
  const today = new Date().toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric" });

  return (
    <div className="fade-in">
      <div className="report-head">
        <div>
          <div className="section-label">§ Analiz Raporu</div>
          <div style={{
            marginTop: 10, fontFamily: "var(--font-mono)", fontSize: 11,
            letterSpacing: "0.06em", color: "var(--ink-mute)", textTransform: "uppercase"
          }}>
            ReturnLens · İade Risk Değerlendirmesi · {today}
          </div>
        </div>
        <button className="back-btn" onClick={onBack}>
          <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
            <path d="M13 8H3M7 4L3 8l4 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Geri Dön
        </button>
      </div>

      <div className="report-banner">
        <div className="report-banner-img">
          <StripesPlaceholder seed={11} />
          <div className="crosshair" style={{ position: "absolute", inset: 0 }}></div>
        </div>
        <div>
          <h2 className="report-banner-title">{product.title}</h2>
          <div className="report-banner-meta">
            <span>{product.brand}</span>
            <span>{product.rating != null ? `★ ${product.rating.toFixed(1)} / 5` : "Puan yok"}</span>
            <span><b>{product.reviewCount}</b> yorum</span>
            <span><b>{product.price.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺</b></span>
            <span>{product.marketplace}</span>
            <span>{product.category}</span>
          </div>
        </div>
        <div className="report-stamp">
          Rapor N°<br/>
          <span className="big">{String(folioNum).padStart(4, "0")} / 26</span>
        </div>
      </div>

      <div className="gauge-block">
        <div className="section-label">§01 — Risk Endeksi</div>
        <div className="gauge-grid" style={{ marginTop: 28 }}>
          <RiskGauge score={a.risk_score} riskLevel={a.risk_level} />
          <div className="gauge-readout">
            <div>
              <div className="gauge-stat-label">Değerlendirme</div>
              <div className={`risk-badge ${riskClass}`}>
                <span className="dot"></span>
                <span>{riskLabel} RİSK</span>
              </div>
            </div>
            <div>
              <div className="gauge-stat-label">Güvenilirlik Aralığı</div>
              <div className="confidence-meter">
                <div className="confidence-ticks">
                  {Array.from({ length: 11 }).map((_, i) => <span key={i}></span>)}
                </div>
                <div className="confidence-needle"
                  style={{ left: `${a.confidence}%` }}
                  data-val={`%${a.confidence}`}>
                </div>
              </div>
            </div>
            <div style={{ paddingTop: 18 }}>
              <div className="gauge-stat-label">Karşılaştırma</div>
              <div style={{
                fontFamily: "var(--font-serif)", fontSize: 17, fontStyle: "italic",
                lineHeight: 1.4, color: "var(--ink-soft)", marginTop: 6
              }}>
                {a.risk_score > 50
                  ? `Kategori ortalamasının üzerinde — bu segmentteki ortalama risk %${Math.max(20, a.risk_score - 18)}.`
                  : `Kategori ortalamasının altında — güvenli aralıkta.`}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="report-body">
        <div className="report-col report-col-left">
          <div className="report-block">
            <div className="report-block-head">
              <div className="section-label">§02 — Özet</div>
            </div>
            <div className="report-prose">
              <div className="lead">{a.summary}</div>
            </div>
            <div className="reco">
              <div className="reco-label">▸ Tavsiye</div>
              <div className="reco-text">&ldquo;{a.recommendation}&rdquo;</div>
            </div>
          </div>

          <div className="report-block">
            <div className="report-block-head">
              <div className="section-label">§03 — Artılar &amp; Eksiler</div>
            </div>
            <div className="pros-cons">
              <div className="pc-col pc-pros">
                <div className="pc-head">
                  <span className="glyph">+</span>
                  <span>Artılar · {a.pros.length}</span>
                </div>
                <ul className="pc-list">
                  {a.pros.map((p, i) => <li key={i}>{p}</li>)}
                </ul>
              </div>
              <div className="pc-col pc-cons">
                <div className="pc-head">
                  <span className="glyph">−</span>
                  <span>Eksiler · {a.cons.length}</span>
                </div>
                <ul className="pc-list">
                  {a.cons.map((c, i) => <li key={i}>{c}</li>)}
                </ul>
              </div>
            </div>
          </div>

          <div className="report-block">
            <div className="report-block-head">
              <div className="section-label">§04 — En Sık İade Nedenleri</div>
            </div>
            <div className="reasons">
              {a.return_reasons.map((r, i) => (
                <div className="reason" key={i}>
                  <span className="reason-n">{String(i + 1).padStart(2, "0")}</span>
                  <span className="reason-text">{r.text}</span>
                  <span className="reason-pct">%{r.pct.toString().padStart(2, "0")}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="report-block">
            <div className="report-block-head">
              <div className="section-label">§05 — Duygu Dağılımı</div>
              <span style={{
                fontFamily: "var(--font-mono)", fontSize: 10.5,
                color: "var(--ink-faint)", letterSpacing: "0.04em"
              }}>n = {product.reviewCount}</span>
            </div>
            <div className="sentiment">
              <SentimentBar cls="sent-pos" label="POZİTİF" pct={a.sentiment.positive} />
              <SentimentBar cls="sent-neu" label="NÖTR" pct={a.sentiment.neutral} />
              <SentimentBar cls="sent-neg" label="NEGATİF" pct={a.sentiment.negative} />
            </div>
          </div>
        </div>

        <div className="report-col report-col-right">
          {a.fake_review_warning && a.fake_review_details && (
            <div className="side-block">
              <div className="warning">
                <div className="warning-label">Sahte Yorum Sinyali</div>
                <div className="warning-text">{a.fake_review_details}</div>
              </div>
            </div>
          )}

          <div className="side-block">
            <div className="section-label">Marjinaller</div>
            <ul className="sidenote-list" style={{ marginTop: 14 }}>
              <li>
                <b>01</b>
                <span>Bu rapor {product.reviewCount} yorumun analizinden çıkarılmıştır. Yorumlar son 12 aydan seçilmiştir.</span>
              </li>
              <li>
                <b>02</b>
                <span>Risk skoru kategori normalizasyonu yapılmış olup, segmentler arası karşılaştırılabilir.</span>
              </li>
              <li>
                <b>03</b>
                <span>Güvenilirlik aralığı %50&apos;nin altına düştüğünde sonuç gösterge niteliğindedir.</span>
              </li>
            </ul>
          </div>

          <div className="side-block">
            <div className="note">
              <div className="note-label">Kategori Notu</div>
              <div className="note-text">&ldquo;{a.category_risk_note}&rdquo;</div>
            </div>
            <div className="note">
              <div className="note-label">Yöntem</div>
              <div className="note-text" style={{
                fontStyle: "normal", fontFamily: "var(--font-sans)",
                fontSize: 13, color: "var(--ink-soft)"
              }}>
                Gemini üzerinde ince ayarlanmış sınıflandırma modeli. Yorumlar paralel olarak işlenir, ardından risk skoru ağırlıklı ortalama ile hesaplanır.
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="report-cta">
        <div className="cta-line">
          Bu analiz işine yaradı mı? Bir ürün daha kontrol et.
        </div>
        <button className="btn-ghost" onClick={() => window.print()}>
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
            <path d="M4 6V2h8v4M4 11H2v3h12v-3h-2M4 11h8M4 11v3h8v-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Raporu yazdır
        </button>
        <button className="btn-primary" onClick={onBack}>
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
            <path d="M2 8a6 6 0 1 0 1.5-4M2 3v3h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Başka ürün analiz et
        </button>
      </div>
    </div>
  );
}
