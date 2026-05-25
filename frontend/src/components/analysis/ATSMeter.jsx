import { useEffect, useRef, useState } from "react";
import { scoreColor, scoreLabel } from "../../utils/formatters";

export default function ATSMeter({ score = 0 }) {
  const [displayScore, setDisplayScore] = useState(0);
  const animRef = useRef(null);

  useEffect(() => {
    const start = 0;
    const end = score;
    const duration = 1200;
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayScore(Math.round(start + (end - start) * eased));
      if (progress < 1) animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [score]);

  // SVG arc math
  const R = 80;
  const cx = 100;
  const cy = 100;
  const startAngle = -210;
  const endAngle = 30;
  const totalAngle = endAngle - startAngle; // 240 deg
  const fillAngle = startAngle + (totalAngle * displayScore) / 100;

  const toXY = (angleDeg, r) => {
    const rad = (angleDeg * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };

  const describeArc = (fromAngle, toAngle) => {
    const s = toXY(fromAngle, R);
    const e = toXY(toAngle, R);
    const large = toAngle - fromAngle > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${R} ${R} 0 ${large} 1 ${e.x} ${e.y}`;
  };

  const color = scoreColor(displayScore);
  const label = scoreLabel(displayScore);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
      <svg width={200} height={160} viewBox="0 0 200 200">
        {/* Background arc */}
        <path
          d={describeArc(startAngle, endAngle)}
          fill="none"
          stroke="rgba(255,255,255,0.07)"
          strokeWidth={16}
          strokeLinecap="round"
        />
        {/* Score arc */}
        {displayScore > 0 && (
          <path
            d={describeArc(startAngle, fillAngle)}
            fill="none"
            stroke={color}
            strokeWidth={16}
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 8px ${color})` }}
          />
        )}
        {/* Tick marks */}
        {[0, 25, 50, 75, 100].map((pct) => {
          const angle = startAngle + (totalAngle * pct) / 100;
          const outer = toXY(angle, R + 14);
          const inner = toXY(angle, R + 8);
          return (
            <line
              key={pct}
              x1={inner.x} y1={inner.y}
              x2={outer.x} y2={outer.y}
              stroke="rgba(255,255,255,0.2)"
              strokeWidth={1.5}
              strokeLinecap="round"
            />
          );
        })}
        {/* Center score */}
        <text x={cx} y={cy - 4} textAnchor="middle" fontFamily="Space Grotesk" fontSize={38} fontWeight={800} fill={color}>
          {displayScore}
        </text>
        <text x={cx} y={cy + 20} textAnchor="middle" fontFamily="Inter" fontSize={12} fill="rgba(255,255,255,0.5)">
          out of 100
        </text>
        {/* Label */}
        <text x={cx} y={cy + 52} textAnchor="middle" fontFamily="Inter" fontSize={13} fontWeight={600} fill={color}>
          {label}
        </text>
        {/* Range labels */}
        <text x={toXY(startAngle, R + 22).x} y={toXY(startAngle, R + 22).y} textAnchor="middle" fontFamily="Inter" fontSize={9} fill="rgba(255,255,255,0.3)">0</text>
        <text x={toXY(endAngle, R + 22).x} y={toXY(endAngle, R + 22).y} textAnchor="middle" fontFamily="Inter" fontSize={9} fill="rgba(255,255,255,0.3)">100</text>
      </svg>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
        {[["0–40", "var(--accent-red)"], ["40–60", "var(--accent)"], ["60–80", "#60A5FA"], ["80+", "var(--accent-green)"]].map(
          ([range, c]) => (
            <div key={range} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--text-muted)" }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: c }} />
              {range}
            </div>
          )
        )}
      </div>
    </div>
  );
}
