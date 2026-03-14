import { useState } from 'react';
import type { MusicPiece } from '../data/database';
import type { Era } from '../hooks/useAudioPlayer';

interface Props {
  piece: MusicPiece;
  composerName: string;
  era: Era;
  index: number;
  total: number;
  onExpand: () => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onStop: () => void;
}

export const FloatingPieceCard = ({
  piece,
  era,
  index,
  total,
  onExpand,
  isPlaying,
  onTogglePlay,
  onStop,
}: Props) => {
  const [hovered, setHovered] = useState(false);

  // Расположение карточек по спирали вокруг композитора, чтобы не налезали
  const angle = (index / total) * Math.PI * 2;
  // Увеличиваем радиус для большего количества карточек
  const baseRadius = Math.min(200 + (total - 1) * 40, 400);
  const offsetX = Math.cos(angle) * baseRadius;
  const offsetY = Math.sin(angle) * baseRadius;

  return (
    <div
      style={{
        position: 'absolute',
        left: `calc(50% + ${offsetX}px)`,
        top: `calc(50% + ${offsetY}px)`,
        transform: `translate(-50%, -50%) ${hovered ? 'scale(1.05)' : 'scale(1)'}`,
        width: '140px',
        background: '#fff',
        border: '1px solid #000',
        borderRadius: '8px',
        padding: '12px',
        boxShadow: hovered ? '0 10px 30px rgba(0,0,0,0.2)' : '0 4px 12px rgba(0,0,0,0.1)',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        zIndex: 50,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Заголовок произведения */}
      <div
        style={{
          fontSize: '11px',
          fontWeight: 'bold',
          marginBottom: '6px',
          whiteSpace: 'normal',
          wordWrap: 'break-word',
          lineHeight: '1.2',
        }}
      >
        {piece.title}
      </div>

      {/* Год (если есть) */}
      <div style={{ fontSize: '9px', color: '#999', marginBottom: '8px' }}>
        {era}
      </div>

      {/* Контролы плеера */}
      {piece.treble.length > 0 && (
        <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onTogglePlay();
            }}
            style={{
              flex: 1,
              background: isPlaying ? '#000' : 'transparent',
              border: '1px solid #000',
              color: isPlaying ? '#fff' : '#000',
              padding: '4px',
              cursor: 'pointer',
              borderRadius: '4px',
              fontSize: '9px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {isPlaying ? '⏸' : '▶'}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onStop();
            }}
            style={{
              flex: 1,
              background: 'transparent',
              border: '1px solid #999',
              color: '#999',
              padding: '4px',
              cursor: 'pointer',
              borderRadius: '4px',
              fontSize: '9px',
            }}
          >
            ◼
          </button>
        </div>
      )}

      {/* Expand кнопка */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onExpand();
        }}
        style={{
          width: '100%',
          background: '#f0f0f0',
          border: '1px solid #ddd',
          padding: '6px',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '9px',
          fontWeight: 'bold',
        }}
      >
        Развернуть ↗
      </button>
    </div>
  );
};
