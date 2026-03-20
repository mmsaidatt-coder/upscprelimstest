type ScatterPoint = {
  index: number;
  value: number;
  correct: boolean;
};

export function PacingChart({ data }: { data: ScatterPoint[] }) {
  if (!data.length) {
    return (
      <div className="card p-5 text-sm text-[var(--muted)]">
        Pacing chart appears after your first attempt.
      </div>
    );
  }

  const width = 360;
  const height = 220;
  const padding = 24;
  const maxY = Math.max(...data.map((p) => p.value), 10);
  const average = data.reduce((s, p) => s + p.value, 0) / Math.max(data.length, 1);

  const xFor = (i: number) => padding + ((width - padding * 2) * i) / Math.max(data.length - 1, 1);
  const yFor = (v: number) => height - padding - ((height - padding * 2) * v) / maxY;

  return (
    <div className="card p-5">
      <p className="text-sm font-semibold text-[var(--foreground)]">Pacing</p>
      <p className="text-xs text-[var(--muted)]">Time per question</p>

      <svg viewBox={`0 0 ${width} ${height}`} className="mt-4 block w-full">
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#e5e7eb" />
        <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#e5e7eb" />

        <line
          x1={padding}
          y1={yFor(average)}
          x2={width - padding}
          y2={yFor(average)}
          stroke="#f59e0b"
          strokeWidth="1"
          strokeDasharray="4 4"
          opacity="0.6"
        />

        {data.map((p) => (
          <g key={p.index}>
            <circle
              cx={xFor(p.index)}
              cy={yFor(p.value)}
              r="4.5"
              fill={p.correct ? "var(--accent)" : "var(--danger)"}
              opacity="0.85"
            />
            <title>{`Q${p.index + 1}: ${p.value}s`}</title>
          </g>
        ))}
      </svg>

      <div className="mt-3 flex items-center gap-4 text-[11px] text-[var(--muted)]">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[var(--accent)]" />
          Correct
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[var(--danger)]" />
          Incorrect
        </span>
      </div>
    </div>
  );
}
