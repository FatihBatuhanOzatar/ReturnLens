// Küçük, yardımcı sunum component'leri.

export function LensIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="10" cy="10" r="3" stroke="currentColor" strokeWidth="0.8" strokeDasharray="1 1.5" />
      <line x1="15.2" y1="15.2" x2="21" y2="21" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <line x1="10" y1="3.5" x2="10" y2="5" stroke="currentColor" strokeWidth="0.8" />
      <line x1="10" y1="15" x2="10" y2="16.5" stroke="currentColor" strokeWidth="0.8" />
      <line x1="3.5" y1="10" x2="5" y2="10" stroke="currentColor" strokeWidth="0.8" />
      <line x1="15" y1="10" x2="16.5" y2="10" stroke="currentColor" strokeWidth="0.8" />
    </svg>
  );
}

export function RegistrationMarks() {
  const mark = (cls: string) => (
    <svg className={cls} viewBox="0 0 22 22" fill="none">
      <line x1="0" y1="6" x2="10" y2="6" stroke="currentColor" strokeWidth="0.6" />
      <line x1="6" y1="0" x2="6" y2="10" stroke="currentColor" strokeWidth="0.6" />
      <circle cx="6" cy="6" r="2.5" stroke="currentColor" strokeWidth="0.6" fill="none" />
    </svg>
  );
  return (
    <div className="regmarks" aria-hidden="true">
      {mark("tl")}{mark("tr")}{mark("bl")}{mark("br")}
    </div>
  );
}

export function StripesPlaceholder({ seed = 0 }: { seed?: number }) {
  const rot = (seed * 47) % 180;
  const id = `rl-stripes-${seed}`;
  return (
    <svg className="stripes" viewBox="0 0 100 100" preserveAspectRatio="none">
      <defs>
        <pattern id={id} patternUnits="userSpaceOnUse" width="4" height="4" patternTransform={`rotate(${rot})`}>
          <line x1="0" y1="0" x2="0" y2="4" stroke="var(--ink-faint)" strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect width="100" height="100" fill={`url(#${id})`} />
    </svg>
  );
}

export function NavBar() {
  const today = new Date().toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" });
  return (
    <nav className="nav">
      <div className="nav-brand">
        <span className="nav-mark"><LensIcon size={22} /></span>
        <span className="nav-name">Return<em>Lens</em></span>
      </div>
      <div className="nav-meta">
        <span><span className="dot"></span>v0.4 — Gemini engine</span>
        <span>İstanbul · {today}</span>
        <span aria-label="github">⌥ github</span>
      </div>
    </nav>
  );
}

export function Footer() {
  return (
    <footer className="foot">
      <span>ReturnLens · İade Riski Analiz Aracı</span>
      <span>Gemini AI ile güçlendirilmiştir · v0.4.2</span>
      <span>© 2026 · Beta</span>
    </footer>
  );
}

export function SentimentBar({ cls, label, pct }: { cls: string; label: string; pct: number }) {
  return (
    <div className={`sent-row ${cls}`}>
      <div className="sent-label">{label}</div>
      <div className="sent-bar-wrap">
        <div className="sent-bar-fill" style={{ width: `${pct}%` }}></div>
      </div>
      <div className="sent-pct">%{pct.toString().padStart(2, "0")}</div>
    </div>
  );
}
