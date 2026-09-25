/** Graduated rule. `units` ticks, numeral every 10, rendered at 10px/unit and cropped at the edge. */
export function Rule({
  units = 200,
  height = 40,
  className = "",
}: {
  units?: number;
  height?: number;
  className?: string;
}) {
  const ticks = Array.from({ length: units + 1 }, (_, i) => i);
  return (
    <svg
      className={`rule ${className}`}
      viewBox={`0 0 ${units * 10} ${height}`}
      preserveAspectRatio="xMinYMax slice"
      aria-hidden="true"
    >
      {ticks.map((i) => {
        const size = i % 10 === 0 ? height : i % 5 === 0 ? height * 0.55 : height * 0.3;
        return <line key={i} x1={i * 10} x2={i * 10} y1={height} y2={height - size} />;
      })}
      {ticks
        .filter((i) => i % 10 === 0 && i > 0)
        .map((i) => (
          <text key={i} x={i * 10 + 4} y={height - 22}>
            {i}
          </text>
        ))}
    </svg>
  );
}
