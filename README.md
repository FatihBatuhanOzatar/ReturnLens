# ReturnLens

Urun yorumlarini analiz edip iade riskini puanlayan bir arac. Gemini AI ile yorumlari okuyor, risk skoru hesapliyor, duygu dagilimini cikartiyor ve rapor uretiyor.

## Ne yapiyor?

1. Kullanici bir urun secer (su an katalogdan, ileride URL ile)
2. Urune ait yorumlar Gemini'ye gonderilir
3. Gemini yapilandirilmis JSON olarak analiz dondurur
4. Sonuc editoryal bir rapor formatinda gosterilir

Rapor icerigi:
- 1-100 arasi iade risk skoru (gauge gorseli ile)
- Risk seviyesi (dusuk / orta / yuksek)
- Ozet ve tavsiye
- Artilar ve eksiler listesi
- En sik iade nedenleri (yuzde dagilimi ile)
- Duygu siniflandirmasi (pozitif / notr / negatif)
- Sahte yorum uyarisi (varsa)

## Kurulum

```bash
git clone https://github.com/FatihBatuhanOzatar/ReturnLens.git
cd ReturnLens
npm install
```

## Calistirilmasi

`.env.local` dosyasi olustur:

```
GOOGLE_GENERATIVE_AI_API_KEY=senin-api-anahtarin
```

API anahtarini [Google AI Studio](https://aistudio.google.com/apikey) uzerinden ucretsiz alabilirsin.

Gelistirme sunucusunu baslat:

```bash
npm run dev
```

Tarayicida `http://localhost:3000` adresini ac.


## Teknoloji

- **Frontend:** Next.js 16, React 19, TypeScript
- **Stil:** Vanilla CSS ile ozel tasarim sistemi (oklch renk paleti, Newsreader + Geist fontlari)
- **AI:** Google Gemini 2.0 Flash (yapilandirilmis JSON cikti)
- **Veri:** Statik JSON urun dosyalari (6 ornek urun)

## Proje yapisi

```
app/
  globals.css          Tasarim tokenlari ve tum bilesen stilleri
  layout.tsx           Root layout, font yuklemesi, metadata
  page.tsx             Ana sayfa, state machine (select/loading/report/error)
  api/analyze/route.ts Gemini API endpoint

components/
  ui.tsx               NavBar, Footer, yardimci bilesenler
  initial-state.tsx    Urun katalogu ve hero bolumu
  loading-state.tsx    5 adimli yukleme animasyonu
  report-state.tsx     Tam analiz raporu
  risk-gauge.tsx       270 derece SVG risk gostergesi
  error-state.tsx      Hata durumu (429, 500, ag hatasi)

lib/
  types.ts             TypeScript arayuzleri
  normalize.ts         Ham JSON'u Product semasina donusturur
  products.ts          Urun verilerini yukler ve normalize eder

data/products/         6 ornek urun JSON dosyasi
```
