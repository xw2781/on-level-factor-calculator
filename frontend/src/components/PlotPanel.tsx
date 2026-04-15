import type { WeightResponse } from '../lib/types';

type PlotPanelProps = {
  result: WeightResponse | null;
  visible: boolean;
};

type Point = { x: number; y: number };

function dateDiffInYears(base: Date, value: Date): number {
  return (value.getTime() - base.getTime()) / (1000 * 60 * 60 * 24 * 365);
}

function pointsToString(points: Point[]): string {
  return points.map((point) => `${point.x},${point.y}`).join(' ');
}

function quarterStartX(quarter: number): number {
  if (quarter === 1) return 1;
  if (quarter === 2) return 1.25;
  if (quarter === 3) return 1.5;
  return 1.75;
}

const palette = ['#f05d5e', '#f7b267', '#f4d35e', '#62c370', '#4ea5d9', '#8b80f9', '#ef798a'];

export function PlotPanel({ result, visible }: PlotPanelProps) {
  if (!visible) {
    return null;
  }

  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Plot</p>
          <h2>Quarter exposure map</h2>
        </div>
      </div>

      {result ? (
        <PlotGraphic result={result} />
      ) : (
        <p className="placeholder-text">Generate weights first to unlock the visual plot.</p>
      )}
    </section>
  );
}

function PlotGraphic({ result }: { result: WeightResponse }) {
  const startDates = result.plot.inforce_start_dates.map((value) => new Date(`${value}T00:00:00`));
  const baseYear = result.plot.year - 1;
  const baseDate = new Date(baseYear, 0, 1);
  const termYears = result.plot.policy_term_months / 12;
  const qx = quarterStartX(result.plot.quarter);
  const labels = startDates.map((dateValue) => dateValue.toLocaleDateString());

  const polygons = startDates.slice(0, -1).map((startDate, index) => {
    const nextDate = startDates[index + 1];
    const startX = dateDiffInYears(baseDate, startDate);
    const width = dateDiffInYears(startDate, nextDate);
    const points: Point[] = [
      { x: startX * 320, y: 260 },
      { x: (startX + width) * 320, y: 260 },
      { x: (startX + width + termYears) * 320, y: 40 },
      { x: (startX + termYears) * 320, y: 40 },
    ];

    return {
      color: palette[index % palette.length],
      label: labels[index],
      weight: result.plot.weight_values[index] ?? 0,
      points,
    };
  });

  return (
    <div className="plot-shell">
      <svg viewBox="0 0 960 320" className="plot-svg" role="img" aria-label="Quarter exposure plot">
        <rect x="0" y="40" width="960" height="220" fill="rgba(247, 248, 252, 0.04)" rx="18" />
        <rect x={qx * 320} y="40" width="80" height="220" fill="rgba(255, 132, 145, 0.18)" />

        {[0, 1, 2, 3].map((tick) => (
          <g key={tick}>
            <line
              x1={tick * 320}
              x2={tick * 320}
              y1={40}
              y2={260}
              stroke="rgba(255,255,255,0.14)"
              strokeWidth="1"
            />
            {tick < 3 ? (
              <text x={tick * 320 + 160} y="22" className="plot-year-label">
                {baseYear + tick}
              </text>
            ) : null}
          </g>
        ))}

        {polygons.map((polygon, index) => (
          <g key={`${polygon.label}-${index}`}>
            <polygon
              points={pointsToString(polygon.points)}
              fill={polygon.color}
              opacity="0.28"
              stroke={polygon.color}
              strokeWidth="2"
            />
            <text x={polygon.points[0].x + 8} y="284" className="plot-date-label">
              {polygon.label}
            </text>
            <text
              x={(polygon.points[0].x + polygon.points[1].x + polygon.points[2].x + polygon.points[3].x) / 4}
              y="150"
              className="plot-weight-label"
            >
              {(polygon.weight * 100).toFixed(2)}%
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
