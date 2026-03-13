import React, { useMemo } from 'react';

interface Props {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  label: string;
}

export const StaveRoad = ({ startX, startY, endX, endY, label }: Props) => {
  const midX = (startX + endX) / 2;
  const roadId = `road-${Math.floor(startX)}-${Math.floor(endY)}`;

  const scatteredNotes = useMemo(() => {
    const notes = [];
    const count = 12; // Чуть меньше клякс, чтобы было чище

    for (let i = 0; i < count; i++) {
      // Равномерное распределение по длине (0.1 - 0.9)
      const t = 0.1 + (i / count) * 0.8 + (Math.random() - 0.5) * 0.1;

      const noteX = (1 - t) * startX + t * endX;

      // ИНТЕРПОЛЯЦИЯ Y ДЛЯ КРИВОЙ БЕЗЬЕ
      // Формула квадратичной кривой Безье для Y: (1-t)^2 * y0 + 2(1-t)t * y1 + t^2 * y2
      // Но у нас кубическая (через 2 контрольные точки с одинаковым Y).
      // Упрощенно для центра дороги:
      const roadYAtT = (1 - t) * startY + t * endY; // Линейная интерполяция (грубо, но для клякс сойдет)

      // ОЧЕНЬ МАЛЕНЬКИЙ РАЗБРОС (Строго внутри стана)
      // Стан высотой 20px (линии на -10, -5, 0, 5, 10). Делаем разброс +/- 5px
      const yOffset = (Math.random() - 0.5) * 10;

      // Убедимся, что нота не вылезает за границы стана (±10px от центра)
      const clampedYOffset = Math.max(-10, Math.min(10, yOffset));
      const noteY = roadYAtT + clampedYOffset;
      const size = Math.random() * 2 + 1.5;

      notes.push(
        <ellipse
          key={i}
          cx={noteX}
          cy={noteY}
          rx={size}
          ry={size * 0.8}
          fill="#000"
          opacity={0.8}
        />
      );
    }
    return notes;
  }, [startX, startY, endX, endY]);

  const mainPathD = `M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`;

  return (
    <g className="stave-road">
      {/* Линии стана */}
      {[-10, -5, 0, 5, 10].map((offset, i) => (
        <path
          key={i}
          d={mainPathD}
          stroke="#000"
          strokeWidth={0.5}
          fill="none"
          opacity={0.4}
          transform={`translate(0, ${offset})`}
        />
      ))}
      {/* Кляксы */}
      {scatteredNotes}
      {/* Текст (вписан в кривую) */}
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
