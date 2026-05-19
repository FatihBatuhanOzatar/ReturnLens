"use client";

import { useState, useEffect } from "react";
import type { Product, Analysis } from "@/lib/types";
import { PRODUCTS } from "@/lib/products";
import { getHistory, saveToHistory, type HistoryEntry } from "@/lib/history";
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
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  // localStorage'dan gecmisi yukle (client-side only)
  useEffect(() => {
    setHistory(getHistory());
  }, []);

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
      saveToHistory(product, data.analysis);
      setHistory(getHistory());
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

  const handleAnalyzeUrl = async (url: string) => {
    if (!url || !url.includes("trendyol.com")) {
      alert("Lütfen geçerli bir Trendyol ürün linki girin.");
      return;
    }
    
    // Geçici ürün ile loading'i başlat
    const tempProduct: Product = {
      id: "temp",
      title: "URL'den ürün bilgileri çekiliyor...",
      brand: "Trendyol",
      price: 0,
      rating: null,
      reviewCount: 0,
      marketplace: "Trendyol",
      category: "Genel",
      imgLabel: "URL",
    };
    
    setSelectedProduct(tempProduct);
    setAnalysis(null);
    setErrorInfo(null);
    setState("loading");
    window.scrollTo({ top: 0, behavior: "instant" });

    try {
      // 1. Scraping işlemi
      const scrapeRes = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      if (!scrapeRes.ok) {
        let msg = "Ürün bilgileri çekilemedi.";
        try { const b = await scrapeRes.json(); if (b.error) msg = b.error; } catch {}
        setErrorInfo({ statusCode: scrapeRes.status, message: msg });
        setState("error");
        return;
      }
      
      const { rawProduct } = await scrapeRes.json();
      
      // Loading ekranını gerçek ürün bilgileriyle güncelle
      const scrapedProduct: Product = {
        id: rawProduct.id,
        title: rawProduct.product_info.title,
        brand: rawProduct.product_info.brand,
        price: rawProduct.product_info.price_current,
        rating: rawProduct.product_info.overall_rating,
        reviewCount: rawProduct.product_info.total_reviews ?? rawProduct.reviews.length,
        marketplace: rawProduct.product_info.marketplace,
        category: rawProduct.product_info.category,
        imgLabel: "ÖZEL",
      };
      setSelectedProduct(scrapedProduct);

      // 2. Gemini Analizi (rawProduct direkt gönderiliyor)
      const [analyzeRes] = await Promise.all([
        fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rawProduct }),
        }),
        new Promise(r => setTimeout(r, 2000)), // Çok hızlı geçmesin
      ]);

      if (!analyzeRes.ok) {
        let serverMessage = `Sunucu ${analyzeRes.status} hatası döndürdü.`;
        try {
          const body = await analyzeRes.json();
          if (body.error) serverMessage = body.error;
        } catch {}
        setErrorInfo({ statusCode: analyzeRes.status, message: serverMessage });
        setState("error");
        return;
      }

      const data: { analysis: Analysis } = await analyzeRes.json();
      setAnalysis(data.analysis);
      saveToHistory(scrapedProduct, data.analysis);
      setHistory(getHistory());
      setState("report");

    } catch (e) {
      console.error(e);
      setErrorInfo({
        statusCode: 0,
        message: e instanceof Error ? "Sunucuya ulaşılamıyor." : "Bilinmeyen bir hata oluştu.",
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

  const handleViewReport = (entry: HistoryEntry) => {
    setSelectedProduct(entry.product);
    setAnalysis(entry.analysis);
    setState("report");
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  return (
    <>
      <RegistrationMarks />
      <div className="shell">
        <NavBar />

        {state === "select" && (
          <InitialState
            products={PRODUCTS}
            onAnalyze={handleAnalyze}
            onAnalyzeUrl={handleAnalyzeUrl}
            history={history}
            onViewReport={handleViewReport}
          />
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
