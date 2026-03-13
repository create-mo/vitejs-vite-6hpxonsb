import React, { useMemo } from 'react';

interface Props {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  label: string;
}

interface Point {
  x: number;
  y: number;
}

// Point on cubic Bezier curve at parameter t ∈ [0, 1]
// P(t) = (1-t)³·P0 + 3(1-t)²t·P1 + 3(1-t)t²·P2 + t³·P3
const bezierPoint = (t: number, p0: Point, p1: Point, p2: Point, p3: Point): Point => {
  const u = 1 - t;
  const u2 = u * u;
  const u3 = u2 * u;
  const t2 = t * t;
  const t3 = t2 * t;

  return {
    x: u3 * p0.x + 3 * u2 * t * p1.x + 3 * u * t2 * p2.x + t3 * p3.x,
    y: u3 * p0.y + 3 * u2 * t * p1.y + 3 * u * t2 * p2.y + t3 * p3.y,
  };
};

// First derivative (tangent vector) of cubic Bezier at parameter t
// P'(t) = 3(1-t)²·(P1-P0) + 6(1-t)t·(P2-P1) + 3t²·(P3-P2)
const bezierTangent = (t: number, p0: Point, p1: Point, p2: Point, p3: Point): Point => {
  const u = 1 - t;

  return {
    x: 3 * u * u * (p1.x - p0.x) + 6 * u * t * (p2.x - p1.x) + 3 * t * t * (p3.x - p2.x),
    y: 3 * u * u * (p1.y - p0.y) + 6 * u * t * (p2.y - p1.y) + 3 * t * t * (p3.y - p2.y),
  };
};

// Unit normal vector (perpendicular to tangent, pointing "upward" on the staff)
// Normal is tangent rotated 90° counter-clockwise: (tx, ty) → (-ty, tx)
// Then normalized to unit length
const bezierNormal = (tangent: Point): Point => {
  const length = Math.sqrt(tangent.x * tangent.x + tangent.y * tangent.y);
  if (length < 1e-6) return { x: 0, y: -1 }; // fallback for zero-length tangent (shouldn't happen)

  return {
    x: -tangent.y / length,
    y: tangent.x / length,
  };
};

// Build an SVG path string for a staff line offset by `offsetPx` pixels along the normal
// We offset the control points at t=0, t=0.5, and t=1 to approximate a parallel offset curve
const buildOffsetPath = (
  p0: Point,
  p1: Point,
  p2: Point,
  p3: Point,
  offsetPx: number
): string => {
  // Sample tangent/normal at key points to offset the path
  const n0 = bezierNormal(bezierTangent(0, p0, p1, p2, p3));
  const n_mid = bezierNormal(bezierTangent(0.5, p0, p1, p2, p3));
  const n1 = bezierNormal(bezierTangent(1, p0, p1, p2, p3));

  // Offset endpoints and control points along the normal at the nearest parameter value
  // Endpoints use their respective normals (t=0 and t=1)
  // Control points: P1 uses normal at t=0 (closer to start), P2 uses normal at t=1 (closer to end)
  const p0_offset: Point = {
    x: p0.x + n0.x * offsetPx,
    y: p0.y + n0.y * offsetPx,
  };
  const p1_offset: Point = {
    x: p1.x + n0.x * offsetPx,
    y: p1.y + n0.y * offsetPx,
  };
  const p2_offset: Point = {
    x: p2.x + n1.x * offsetPx,
    y: p2.y + n1.y * offsetPx,
  };
  const p3_offset: Point = {
    x: p3.x + n1.x * offsetPx,
    y: p3.y + n1.y * offsetPx,
  };

  return `M ${p0_offset.x} ${p0_offset.y} C ${p1_offset.x} ${p1_offset.y}, ${p2_offset.x} ${p2_offset.y}, ${p3_offset.x} ${p3_offset.y}`;
};

export const StaveRoad = ({ startX, startY, endX, endY, label }: Props) => {
  const midX = (startX + endX) / 2;
  const roadId = `road-${Math.floor(startX)}-${Math.floor(endY)}`;

  const p0: Point = { x: startX, y: startY };
  const p1: Point = { x: midX, y: startY };
  const p2: Point = { x: midX, y: endY };
  const p3: Point = { x: endX, y: endY };

  // Generate SVG path strings for all 5 staff lines (offsets: -10, -5, 0, 5, 10 px)
  const staffLinePaths = useMemo(
    () => {
      const offsets = [-10, -5, 0, 5, 10];
      return offsets.map((offset) => buildOffsetPath(p0, p1, p2, p3, offset));
    },
    [startX, startY, endX, endY]
  );

  // Generate scattered note dots along the curve
  const scatteredNotes = useMemo(() => {
    const notes = [];
    const count = 12;

    for (let i = 0; i < count; i++) {
      // Spread notes from t=0.1 to t=0.9 with small random jitter
      const t = 0.1 + (i / count) * 0.8 + (Math.random() - 0.5) * 0.1;

      // Position on the center curve
      const point = bezierPoint(t, p0, p1, p2, p3);

      // Tangent and normal at this position
      const tangent = bezierTangent(t, p0, p1, p2, p3);
      const normal = bezierNormal(tangent);

      // Random offset along the normal, within staff bounds (±8 px to stay away from ±10 line boundary)
      const normalOffset = (Math.random() - 0.5) * 16; // ±8 px

      // Final note position
      const noteX = point.x + normal.x * normalOffset;
      const noteY = point.y + normal.y * normalOffset;

      // Ellipse dimensions
      const size = Math.random() * 2 + 1.5; // rx ∈ [1.5, 3.5]
      const sizeY = size * 0.8;

      // Rotate ellipse to align with the curve (tangent direction)
      const angle = (Math.atan2(tangent.y, tangent.x) * 180) / Math.PI;

      notes.push(
        <ellipse
          key={i}
          cx={noteX}
          cy={noteY}
          rx={size}
          ry={sizeY}
          fill="#000"
          opacity={0.8}
          transform={`rotate(${angle}, ${noteX}, ${noteY})`}
        />
      );
    }
    return notes;
  }, [startX, startY, endX, endY]);

  // Center curve path (for text label)
  const mainPathD = `M ${p0.x} ${p0.y} C ${p1.x} ${p1.y}, ${p2.x} ${p2.y}, ${p3.x} ${p3.y}`;

  return (
    <g className="stave-road">
      {/* Five staff lines with proper offset curves */}
      {staffLinePaths.map((pathD, i) => (
        <path
          key={i}
          d={pathD}
          stroke="#000"
          strokeWidth={0.5}
          fill="none"
          opacity={0.4}
        />
      ))}

      {/* Scattered note dots */}
      {scatteredNotes}

      {/* Text label along center curve */}
      <path id={roadId} d={mainPathD} fill="none" stroke="none" />
      <text
        fill="#000"
        fontSize="9px"
        fontWeight="600"
        letterSpacing="2px"
        opacity={0.7}
        style={{ textTransform: 'uppercase' }}
      >
        <textPath href={`#${roadId}`} startOffset="50%" textAnchor="middle">
          {label}
        </textPath>
      </text>
    </g>
  );
};
