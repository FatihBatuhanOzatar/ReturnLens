"use client";

import { useEffect, useState } from "react";
import type { RiskLevel } from "@/lib/types";

interface Props {
  score: number;
  riskLevel: RiskLevel;
  /** Animasyonu atla (print/SSR için). */
  noAnim?: boolean;
}

/**
 * 270° optik diyafram tarzı risk göstergesi.
 * Generic speedometer değil — her 2 birimde tick, 10'da etiketli, ince akrep + elmas uç.
 */
export function RiskGauge({ score, riskLevel: _riskLevel, noAnim = false }: Props) {
  const size = 320;
  const cx = size / 2;
  const cy = size / 2;
  const r = 130;
  const startAngle = 135;
  const endAngle = 405;
  const angleRange = endAngle - startAngle;

  const scoreAngle = startAngle + (score / 100) * angleRange;

  const polar = (ox: number, oy: number, rad: number, deg: number): [number, number] => {
    const t = (deg * Math.PI) / 180;
    return [ox + rad * Math.cos(t), oy + rad * Math.sin(t)];
  };
  const arcPath = (rad: number, a1: number, a2: number) => {
    const [x1, y1] = polar(cx, cy, rad, a1);
    const [x2, y2] = polar(cx, cy, rad, a2);
    const large = a2 - a1 > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${rad} ${rad} 0 ${large} 1 ${x2} ${y2}`;
  };

  // Tick mark'lar — her 2 birim
  const ticks: Array<{ v: number; big: boolean; x1: number; y1: number; x2: number; y2: number }> = [];
  for (let v = 0; v <= 100; v += 2) {
    const a = startAngle + (v / 100) * angleRange;
    const big = v % 10 === 0;
    const innerR = big ? r - 14 : r - 7;
    const outerR = r - 1;
    const [x1, y1] = polar(cx, cy, innerR, a);
    const [x2, y2] = polar(cx, cy, outerR, a);
    ticks.push({ v, big, x1, y1, x2, y2 });
  }

  const zoneArcs = [
    { from: 0, to: 33, color: "var(--risk-low)" },
    { from: 33, to: 66, color: "var(--risk-mid)" },
    { from: 66, to: 100, color: "var(--risk-high)" },
  ];

  const [needlePos, setNeedlePos] = useState(noAnim ? scoreAngle : startAngle);
  const [animScore, setAnimScore] = useState(noAnim ? score : 0);

  useEffect(() => {
    if (noAnim) {
      setNeedlePos(scoreAngle);
      setAnimScore(score);
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const dur = 1100;
    const ease = (t: number) => 1 - Math.pow(1 - t, 3);
    const animate = (now: number) => {
      const t = Math.min(1, (now - t0) / dur);
      setNeedlePos(startAngle + (scoreAngle - startAngle) * ease(t));
      setAnimScore(Math.round(score * ease(t)));
      if (t < 1) raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [score, scoreAngle, noAnim]);

  const labelTicks = [0, 20, 40, 60, 80, 100];

  const [nx, ny] = polar(cx, cy, r - 4, needlePos);
  const [bx, by] = polar(cx, cy, 28, needlePos + 180);
  const [tx, ty] = polar(cx, cy, r - 18, needlePos);

  return (
    <div className="gauge-svg-wrap">
      <svg viewBox={`0 0 ${size} ${size}`} width="100%" height="100%">
        <circle cx={cx} cy={cy} r={r + 8} fill="none" stroke="var(--rule)" strokeWidth="0.5" />
        <circle cx={cx} cy={cy} r={r - 30} fill="none" stroke="var(--rule)" strokeWidth="0.5" strokeDasharray="1 3" />
        <path d={arcPath(r, startAngle, endAngle)} fill="none" stroke="var(--rule)" strokeWidth="0.5" />

        {zoneArcs.map((z, i) => {
          const a1 = startAngle + (z.from / 100) * angleRange;
          const a2 = startAngle + (z.to / 100) * angleRange;
          return (
            <path key={i} d={arcPath(r + 6, a1, a2)} fill="none" stroke={z.color} strokeWidth="1.5" strokeLinecap="butt" opacity="0.85" />
          );
        })}

        {ticks.map((t, i) => (
          <line key={i}
            x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
            stroke={t.big ? "var(--ink)" : "var(--ink-mute)"}
            strokeWidth={t.big ? 0.8 : 0.4}
            opacity={t.big ? 0.85 : 0.5}
          />
        ))}

        {labelTicks.map(v => {
          const a = startAngle + (v / 100) * angleRange;
          const [lx, ly] = polar(cx, cy, r - 28, a);
          return (
            <text key={v} x={lx} y={ly} fontFamily="var(--font-mono)" fontSize="10"
                  fill="var(--ink-mute)" textAnchor="middle" dominantBaseline="middle" letterSpacing="0.5">
              {v.toString().padStart(2, "0")}
            </text>
          );
        })}

        {needlePos - startAngle > 0.5 && (() => {
          const a1 = startAngle;
          const a2 = needlePos;
          const [px1, py1] = polar(cx, cy, r + 6, a1);
          const [px2, py2] = polar(cx, cy, r + 6, a2);
          const large = a2 - a1 > 180 ? 1 : 0;
          return (
            <path d={`M ${px1} ${py1} A ${r + 6} ${r + 6} 0 ${large} 1 ${px2} ${py2}`}
                  fill="none" stroke="var(--ink)" strokeWidth="3" />
          );
        })()}

        <g>
          <line x1={bx} y1={by} x2={nx} y2={ny} stroke="var(--ink)" strokeWidth="1.2" strokeLinecap="round" />
          <g transform={`translate(${tx} ${ty}) rotate(${needlePos + 90})`}>
            <rect x="-3" y="-3" width="6" height="6" fill="var(--accent)" transform="rotate(45)" />
          </g>
        </g>

        <circle cx={cx} cy={cy} r="9" fill="var(--paper)" stroke="var(--ink)" strokeWidth="0.5" />
        <circle cx={cx} cy={cy} r="3" fill="var(--ink)" />

        {[startAngle, endAngle].map((a, i) => {
          const [x, y] = polar(cx, cy, r + 18, a);
          return (
            <g key={i}>
              <line x1={x - 4} y1={y} x2={x + 4} y2={y} stroke="var(--ink-mute)" strokeWidth="0.5" />
              <line x1={x} y1={y - 4} x2={x} y2={y + 4} stroke="var(--ink-mute)" strokeWidth="0.5" />
            </g>
          );
        })}
      </svg>

      <div className="gauge-score">
        <div className="num" style={{ color: "var(--ink)" }}>{animScore}</div>
        <div className="denom">/ 100</div>
        <div className="label">İade Risk Endeksi</div>
      </div>
    </div>
  );
}
