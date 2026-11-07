// Shopper wordmark: a calligraphic "S" whose tail curls round and sweeps underneath "hopper".

type Cubic = [number, number, number, number, number, number, number, number];

// Centreline of the S and its swash, as one continuous pen stroke.
const S_STROKE: Cubic[] = [
  [24.2, 9, 22.6, 4, 13.2, 3.4, 11.6, 8.6], // top arc
  [11.6, 8.6, 10.6, 12.8, 15.6, 15.4, 18.6, 18], // spine
  [18.6, 18, 22.4, 21.4, 22.8, 28, 18.6, 31.6], // lower bowl
  [18.6, 31.6, 14.6, 35, 7.6, 34.6, 5.4, 31.4], // bottom
  [5.4, 31.4, 4.4, 29.8, 1.2, 30.4, 1.4, 34], // curl
  [1.4, 34, 1.6, 38.6, 8, 40.6, 16, 40.8], // turn into the swash
  [16, 40.8, 50, 41.6, 100, 39, 132, 30.5], // swash under "hopper"
];

/**
 * Outline a centreline as if written with a broad-nib pen: strokes running along the nib
 * are thin, strokes across it are thick, and the swash tapers to a point.
 */
function nibOutline(segs: Cubic[], { wMax = 4.6, wMin = 1.2, nibDeg = 30, startTaper = 0.06, endTaper = 0.28, steps = 50 } = {}) {
  const pts: { x: number; y: number; dx: number; dy: number }[] = [];
  segs.forEach(([x0, y0, x1, y1, x2, y2, x3, y3], si) => {
    for (let i = si ? 1 : 0; i <= steps; i++) {
      const t = i / steps;
      const u = 1 - t;
      pts.push({
        x: u * u * u * x0 + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * x3,
        y: u * u * u * y0 + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * y3,
        dx: 3 * u * u * (x1 - x0) + 6 * u * t * (x2 - x1) + 3 * t * t * (x3 - x2),
        dy: 3 * u * u * (y1 - y0) + 6 * u * t * (y2 - y1) + 3 * t * t * (y3 - y2),
      });
    }
  });

  const nib = (nibDeg * Math.PI) / 180;
  const left: string[] = [];
  const right: string[] = [];
  pts.forEach((p, i) => {
    const len = Math.hypot(p.dx, p.dy) || 1;
    const f = i / (pts.length - 1);
    let w = wMin + (wMax - wMin) * Math.abs(Math.sin(Math.atan2(p.dy, p.dx) - nib));
    if (f < startTaper) w *= 0.35 + 0.65 * (f / startTaper);
    if (f > 1 - endTaper) w *= Math.pow((1 - f) / endTaper, 0.9);
    const nx = (-p.dy / len) * (w / 2);
    const ny = (p.dx / len) * (w / 2);
    left.push(`${(p.x + nx).toFixed(1)} ${(p.y + ny).toFixed(1)}`);
    right.push(`${(p.x - nx).toFixed(1)} ${(p.y - ny).toFixed(1)}`);
  });
  return `M${left.join("L")}L${right.reverse().join("L")}Z`;
}

const S_PATH = nibOutline(S_STROKE);

export function ShopperWordmark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="-1.5 0 137 46" role="img" aria-label="Shopper" className={className}>
      <path className="chart-fade" d={S_PATH} fill="currentColor" />
      <text x="27" y="31" fill="currentColor" fontSize="23" fontWeight="700" letterSpacing="-0.5" style={{ fontFamily: "inherit" }}>
        hopper
      </text>
    </svg>
  );
}
