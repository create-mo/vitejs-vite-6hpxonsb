import { useEffect, useState } from 'react';
import { VexScore } from './VexScore';
import type { MusicPiece } from '../data/database';
import type { PlayEffect } from '../hooks/useAudioPlayer';

interface Props {
  piece: MusicPiece;
  composerName: string;
  onClose: () => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onStop: () => void;
  effect: PlayEffect;
  onEffectChange: (e: PlayEffect) => void;
}

const EFFECTS: { value: PlayEffect; label: string }[] = [
  { value: 'none',    label: 'Обычно' },
  { value: 'thirds',  label: 'Терции' },
  { value: 'arpeggio', label: 'Арпеджио' },
];

export const FullScreenScore = ({
  piece,
  composerName,
  onClose,
  isPlaying,
  onTogglePlay,
  onStop,
  effect,
  onEffectChange,
}: Props) => {
  const [opacity, setOpacity] = useState(0);

  useEffect(() => {
    requestAnimationFrame(() => setOpacity(1));
  }, []);

  const handleClose = () => {
    onStop();
    setOpacity(0);
    setTimeout(onClose, 300);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0, left: 0,
        width: '100vw', height: '100vh',
        background: 'rgba(255,255,255,0.98)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        opacity,
        transition: 'opacity 0.3s ease',
        backdropFilter: 'blur(10px)',
      }}
    >
      {/* TOOLBAR */}
      <div
        style={{
          height: '80px',
          padding: '0 40px',
          borderBottom: '1px solid #eee',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '2px', color: '#888' }}>
            {composerName}
          </div>
          <div style={{ fontSize: '20px', fontWeight: '500' }}>{piece.title}</div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
          {/* Плеер */}
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <button onClick={onTogglePlay} style={minimalBtnStyle} title={isPlaying ? 'Пауза' : 'Играть'}>
              {isPlaying ? (
                <svg width="24" height="24" viewBox="0 0 24 24">
                  <path d="M6 4h4v16H6zm8 0h4v16h-4z" fill="currentColor" />
                </svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" fill="currentColor" />
                </svg>
              )}
            </button>
            <button onClick={onStop} style={minimalBtnStyle} title="Стоп">
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path d="M6 6h12v12H6z" fill="currentColor" />
              </svg>
            </button>
          </div>

          {/* Переключатель эффектов */}
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            {EFFECTS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => { onStop(); onEffectChange(value); }}
                style={{
                  ...effectBtnStyle,
                  background: effect === value ? '#000' : 'transparent',
                  color: effect === value ? '#fff' : '#000',
                }}
              >
                {label}
              </button>
            ))}
          </div>

          <button onClick={handleClose} style={minimalBtnStyle}>
            <svg width="28" height="28" viewBox="0 0 24 24">
              <path
                d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
                fill="currentColor"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* SCORE */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '40px',
          display: 'flex',
          justifyContent: 'center',
          background: '#fafafa',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '1000px',
            background: '#fff',
            padding: '40px',
            boxShadow: '0 5px 20px rgba(0,0,0,0.03)',
          }}
        >
          <VexScore treble={piece.treble} bass={piece.bass} width={900} />
        </div>
      </div>
    </div>
  );
};

const minimalBtnStyle = {
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
  color: '#000',
  padding: '5px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  opacity: 0.7,
  transition: 'opacity 0.2s',
};

const effectBtnStyle = {
  border: '1px solid #000',
  borderRadius: '4px',
  padding: '4px 10px',
  fontSize: '11px',
  cursor: 'pointer',
  transition: 'all 0.15s',
  fontFamily: 'inherit',
  letterSpacing: '0.5px',
};
