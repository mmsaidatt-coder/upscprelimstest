type RadarDatum = {
  label: string;
  value: number;
};

function polarToCartesian(angle: number, radius: number) {
  return {
    x: 100 + Math.cos(angle) * radius,
    y: 100 + Math.sin(angle) * radius,
  };
}

export function RadarChart({ data }: { data: RadarDatum[] }) {
  if (!data.length) {
    return (
      <div className="card p-5 text-sm text-[var(--muted)]">
        Complete a test to see the subject radar.
      </div>
    );
  }

  const angles = data.map((_, i) => (-Math.PI / 2) + (i * Math.PI * 2) / data.length);
  const polygonPoints = data
    .map((item, i) => polarToCartesian(angles[i]!, 68 * (item.value / 100)))
    .map((p) => `${p.x},${p.y}`)
    .join(" ");

  const levelPolygons = [25, 50, 75, 100].map((level) =>
    data
      .map((_, i) => polarToCartesian(angles[i]!, 68 * (level / 100)))
      .map((p) => `${p.x},${p.y}`)
      .join(" "),
  );

  return (
    <div className="card p-5">
      <p className="text-sm font-semibold text-[var(--foreground)]">Subject radar</p>
      <p className="text-xs text-[var(--muted)]">Accuracy by subject</p>

      <svg viewBox="0 0 200 200" className="mx-auto mt-4 block w-full max-w-[280px]">
        {levelPolygons.map((points, i) => (
          <polygon
            key={points}
            points={points}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={i === levelPolygons.length - 1 ? 1.2 : 0.8}
          />
        ))}

        {angles.map((angle) => {
          const p = polarToCartesian(angle, 72);
          return <line key={angle} x1="100" y1="100" x2={p.x} y2={p.y} stroke="#e5e7eb" />;
        })}

        <polygon
          points={polygonPoints}
          fill="rgba(5, 150, 105, 0.15)"
          stroke="rgba(5, 150, 105, 0.8)"
          strokeWidth="2"
        />

        {data.map((item, i) => {
          const p = polarToCartesian(angles[i]!, 68 * (item.value / 100));
          const lp = polarToCartesian(angles[i]!, 88);
          return (
            <g key={item.label}>
              <circle cx={p.x} cy={p.y} r="3.5" fill="var(--accent)" />
              <text
                x={lp.x}
                y={lp.y}
                textAnchor="middle"
                dominantBaseline="middle"
                style={{ fontSize: "7px", fill: "#6b7280", fontWeight: 600 }}
              >
                {item.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
