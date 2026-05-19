// localStorage uzerinde analiz gecmisini yonetir.
// Maksimum 6 kayit tutar, en yenisi basta.

import type { Product, Analysis } from "./types";

export interface HistoryEntry {
  product: Product;
  analysis: Analysis;
  date: string; // ISO string
}

const STORAGE_KEY = "returnlens_history";
const MAX_ENTRIES = 6;

export function getHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as HistoryEntry[];
  } catch {
    return [];
  }
}

export function saveToHistory(product: Product, analysis: Analysis): void {
  if (typeof window === "undefined") return;
  try {
    const entries = getHistory();
    // Ayni urun varsa kaldir (yenisi basa eklenecek)
    const filtered = entries.filter(e => e.product.id !== product.id);
    const entry: HistoryEntry = {
      product,
      analysis,
      date: new Date().toISOString(),
    };
    const updated = [entry, ...filtered].slice(0, MAX_ENTRIES);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // localStorage dolu veya erisim yok, sessizce gec
  }
}

export function clearHistory(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}
