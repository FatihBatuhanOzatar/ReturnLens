"use client";

import { useState } from "react";
import type { Product, Analysis } from "@/lib/types";
import { PRODUCTS } from "@/lib/products";
import { NavBar, Footer, RegistrationMarks } from "@/components/ui";
import { InitialState } from "@/components/initial-state";
import { LoadingState } from "@/components/loading-state";
import { ReportState } from "@/components/report-state";

type AppState = "select" | "loading" | "report" | "error";

export default function Home() {
  const [state, setState] = useState<AppState>("select");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async (product: Product) => {
    setSelectedProduct(product);
    setAnalysis(null);
    setError(null);
    setState("loading");
    window.scrollTo({ top: 0, behavior: "instant" });

    try {
      // İsteğe bağlı: loading animasyonu için minimum 3 sn göster
      const [res] = await Promise.all([
        fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId: product.id }),
        }),
        new Promise(r => setTimeout(r, 3000)),
      ]);

      if (!res.ok) throw new Error(`API ${res.status}`);
      const data: { analysis: Analysis } = await res.json();
      setAnalysis(data.analysis);
      setState("report");
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : "Bilinmeyen hata");
      setState("error");
    }
  };

  const handleBack = () => {
    setState("select");
    setSelectedProduct(null);
    setAnalysis(null);
    setError(null);
    setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 50);
  };

  return (
    <>
      <RegistrationMarks />
      <div className="shell">
        <NavBar />

        {state === "select" && (
          <InitialState products={PRODUCTS} onAnalyze={handleAnalyze} />
        )}

        {state === "loading" && selectedProduct && (
          <LoadingState product={selectedProduct} />
        )}

        {state === "report" && selectedProduct && analysis && (
          <ReportState
            product={selectedProduct}
            analysis={analysis}
            onBack={handleBack}
          />
        )}

        {state === "error" && (
          <div style={{ padding: "80px 0", textAlign: "center" }}>
            <h2 style={{ fontFamily: "var(--font-serif)", fontSize: 28, marginBottom: 12 }}>
              Bir sorun oluştu.
            </h2>
            <p style={{ color: "var(--ink-mute)", marginBottom: 24 }}>{error}</p>
            <button className="btn-ghost" onClick={handleBack}>← Geri Dön</button>
          </div>
        )}

        <Footer />
      </div>
    </>
  );
}
