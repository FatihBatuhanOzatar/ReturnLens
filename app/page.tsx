"use client";

import { useState } from "react";
import type { Product, Analysis } from "@/lib/types";
import { PRODUCTS } from "@/lib/products";
import { NavBar, Footer, RegistrationMarks } from "@/components/ui";
import { InitialState } from "@/components/initial-state";
import { LoadingState } from "@/components/loading-state";
import { ReportState } from "@/components/report-state";
import { ErrorState } from "@/components/error-state";

type AppState = "select" | "loading" | "report" | "error";

interface ErrorInfo {
  statusCode: number;
  message: string;
}

export default function Home() {
  const [state, setState] = useState<AppState>("select");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [errorInfo, setErrorInfo] = useState<ErrorInfo | null>(null);

  const handleAnalyze = async (product: Product) => {
    setSelectedProduct(product);
    setAnalysis(null);
    setErrorInfo(null);
    setState("loading");
    window.scrollTo({ top: 0, behavior: "instant" });

    try {
      // Loading animasyonu için minimum 3 sn göster
      const [res] = await Promise.all([
        fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId: product.id }),
        }),
        new Promise(r => setTimeout(r, 3000)),
      ]);

      if (!res.ok) {
        // API'den dönen hata mesajını oku
        let serverMessage = `Sunucu ${res.status} hatası döndürdü.`;
        try {
          const body = await res.json();
          if (body.error) serverMessage = body.error;
        } catch {
          // JSON parse başarısız olursa default mesajla devam et
        }
        setErrorInfo({ statusCode: res.status, message: serverMessage });
        setState("error");
        return;
      }

      const data: { analysis: Analysis } = await res.json();
      setAnalysis(data.analysis);
      setState("report");
    } catch (e) {
      console.error(e);
      // Network hatası (fetch başarısız)
      setErrorInfo({
        statusCode: 0,
        message: e instanceof Error
          ? "Sunucuya ulaşılamıyor. İnternet bağlantını kontrol et."
          : "Bilinmeyen bir hata oluştu.",
      });
      setState("error");
    }
  };

  const handleBack = () => {
    setState("select");
    setSelectedProduct(null);
    setAnalysis(null);
    setErrorInfo(null);
    setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 50);
  };

  const handleRetry = () => {
    if (selectedProduct) {
      handleAnalyze(selectedProduct);
    }
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

        {state === "error" && errorInfo && (
          <ErrorState
            product={selectedProduct}
            statusCode={errorInfo.statusCode}
            message={errorInfo.message}
            onBack={handleBack}
            onRetry={handleRetry}
          />
        )}

        <Footer />
      </div>
    </>
  );
}
