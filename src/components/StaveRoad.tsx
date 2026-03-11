import { useMemo } from 'react';

interface Props {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  label: string;
}

// Детерминистический генератор случайных чисел через seed
const deterministicRandom = (seed: number) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

// Получить seed на основе координат (детерминистически)
const getSeed = (startX: number, endY: number) => {
  return Math.floor(startX * 1000 + endY * 1000);
};

// 5 линий нотоносца (высота 20px)
const STAVE_LINES = [-10, -5, 0, 5, 10];

export const StaveRoad = ({ startX, startY, endX, endY, label }: Props) => {
  // Детерминистический seed
  const seed = getSeed(startX, endY);
  const random = deterministicRandom(seed);

  const midX = (startX + endX) / 2;
  const roadId = `road-${Math.floor(startX)}-${Math.floor(endY)}`;

  // Центр стана ровно между startY и endY
  const staveCenterY = (startY + endY) / 2;

  // Расчёт провисания арки (Cubic Bezier)
  const chord = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
  const sagitta = chord / 8; // Провисание ~1/8 хорды

  const scatteredNotes = useMemo(() => {
    const notes = [];
    const count = 12;

    for (let i = 0; i < count; i++) {
      // Равномерное распределение по длине (0.1 - 0.9)
      const t = 0.1 + (i / count) * 0.8 + (random - 0.5) * 0.1;

      const noteX = (1 - t) * startX + t * endX;

      // Кляксы строго внутри границ стана
      const noteLineIndex = (i + seed) % STAVE_LINES.length;
      const microOffset = (deterministicRandom(seed + i) - 0.5) * 2; // +/- 1px jitter
      const noteY = staveCenterY + STAVE_LINES[noteLineIndex] + microOffset;

      // Детерминистический размер
      const noteIndexForSize = deterministicRandom(seed + i);
      const size = 1.5 + noteIndexForSize * 0.5;

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
  }, [startX, startY, endX, endY, seed]); // Все зависимости!

  // Cubic Bezier path с аркой (симметричная)
  const pathD = `M ${startX} ${startY + sagitta} C ${midX} ${startY + sagitta}, ${midX} ${endY + sagitta}, ${endX} ${endY + sagitta}`;

  return (
    <g className="stave-road">
      {/* Линии стана */}
      {STAVE_LINES.map((offset, i) => (
        <path
          key={i}
          d={pathD}
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
      <path id={roadId} d={pathD} fill="none" stroke="none" />
      <text
        fill="#000"
        fontSize="9px"
        fontWeight="600"
        letterSpacing="2px"
        opacity={0.7}
      >
        <textPath href={`#${roadId}`} startOffset="50%" textAnchor="middle">
          {label}
        </textPath>
      </text>
    </g>
  );
};
