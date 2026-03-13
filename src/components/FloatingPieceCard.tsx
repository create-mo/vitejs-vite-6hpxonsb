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
  composerName,
  era,
  index,
  total,
  onExpand,
  isPlaying,
  onTogglePlay,
  onStop,
}: Props) => {
  const [hovered, setHovered] = useState(false);

  // Расположение карточек по кругу вокруг композитора
  const angle = (index / total) * Math.PI * 2;
  const radius = 150; // px
  const offsetX = Math.cos(angle) * radius;
  const offsetY = Math.sin(angle) * radius;

  return (
    <div
      style={{
        position: 'absolute',
        left: offsetX,
        top: offsetY,
        width: '140px',
        background: '#fff',
        border: '1px solid #000',
        borderRadius: '8px',
        padding: '12px',
        boxShadow: hovered ? '0 10px 30px rgba(0,0,0,0.2)' : '0 4px 12px rgba(0,0,0,0.1)',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        transform: hovered ? 'scale(1.05)' : 'scale(1)',
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
