"use client";
import { useEffect, useRef, useState } from "react";
/** Graduated rule. `units` ticks, numeral every 10, rendered at 10px/unit and cropped at the edge. */
export function Rule({
  units = 200,
  height = 44,
  vertical = false,
  className = "",
}: {
  units?: number;
  height?: number;
  vertical?: boolean;
  className?: string;
}) {
  const ticks = Array.from({ length: units + 1 }, (_, i) => i);
  const len = units * 10;
  return (
    <svg
      className={`rule ${className}`}
      viewBox={vertical ? `0 0 ${height} ${len}` : `0 0 ${len} ${height}`}
      preserveAspectRatio={vertical ? "xMaxYMin slice" : "xMinYMax slice"}
      aria-hidden="true"
    >
      {ticks.map((i) => {
        const size = i % 10 === 0 ? height : i % 5 === 0 ? height * 0.55 : height * 0.3;
        const x = i * 10;
        return vertical ? (
          <line key={i} x1={height} x2={height - size} y1={x} y2={x} />
        ) : (
          <line key={i} x1={x} x2={x} y1={height} y2={height - size} />
        );
      })}
      {ticks
        .filter((i) => i % 10 === 0 && i > 0)
        .map((i) =>
          vertical ? (
            <text key={i} x={height - 14} y={i * 10 - 4} textAnchor="end">
              {i}
            </text>
          ) : (
            <text key={i} x={i * 10 + 4} y={height - 22}>
              {i}
            </text>
          ),
        )}
    </svg>
  );
}
/** Wraps a headline and reads its rendered width back as a dimension line. */
export function Measured({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState<number | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) =>
      setWidth(Math.round(entry.contentRect.width)),
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return (
    <div className="measured">
      <div ref={ref} className="measured-target">
        {children}
      </div>
      <div className="dimension" aria-hidden="true">
        <span className="dimension-line" />
        <span className="dimension-label">
          {width ? `${width.toLocaleString()} px` : "measuring"}
        </span>
      </div>
    </div>
  );
}
