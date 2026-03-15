import React, { useRef, useEffect, useState, useCallback } from 'react';
import type { ComposerNode, MusicPiece } from '../data/database';
import type { Era } from '../hooks/useAudioPlayer';

interface AcousticLensProps {
  composer: ComposerNode;
  onClose: () => void;
  onPlayPiece: (piece: MusicPiece, era: Era) => void;
  onStop: () => void;
  playingPieceId: string | null;
  isPlaying: boolean;
}

const PIECE_SPACING = 72; // px between opus lines
const LENS_WIDTH    = 260;
const FRICTION      = 0.90;
const MAX_SKEW      = 0.13;

type PieceSize = 'large' | 'medium' | 'small';

function getPieceSize(title: string): PieceSize {
  const t = title.toLowerCase();
  if (/\b(opera|oratorio|ballad|ballet|symphony|mass|requiem|passion|cantata|concerto gross)\b/.test(t)) {
    return 'large';
  }
  if (/\b(nocturne|sonata|concerto|quartet|quintet|etude|étude|study|fantasia|impromptu|variation|scherzo|caprice|rhapsod)\b/.test(t)) {
    return 'medium';
  }
  return 'small';
}

const HEIGHT_RATIO: Record<PieceSize, number> = {
  large:  0.76,
  medium: 0.40,
  small:  0.14,
};

const LINE_WIDTH: Record<PieceSize, number> = {
  large:  1.5,
  medium: 1.0,
  small:  0.6,
};

export const AcousticLens: React.FC<AcousticLensProps> = ({
  composer, onClose, onPlayPiece, onStop, playingPieceId, isPlaying,
}) => {
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const scrollXRef  = useRef(0);
  const velRef      = useRef(0);
  const dragRef     = useRef<{ x: number; t: number; last: number } | null>(null);
  const rafRef      = useRef(0);
  const focusIdRef  = useRef<string | null>(null);

  const [focusedPiece, setFocusedPiece] = useState<MusicPiece | null>(null);
  const [titleVisible, setTitleVisible] = useState(false);

  const pieces = composer.pieces;

  // Инициализация: первое произведение в центре
  useEffect(() => {
    const w = window.innerWidth;
    scrollXRef.current = w / 2;
    setFocusedPiece(pieces[0] ?? null);
    focusIdRef.current = pieces[0]?.id ?? null;
  }, [pieces]);

  // RAF рендер-петля
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const render = () => {
      const W = canvas.width;
      const H = canvas.height;
      const cx = W / 2; // центр экрана по X

      // Физика
      if (!dragRef.current && Math.abs(velRef.current) > 0.2) {
        scrollXRef.current += velRef.current;
        velRef.current *= FRICTION;
      } else if (!dragRef.current) {
        velRef.current = 0;
      }

      // Границы скролла
      const n = pieces.length;
      const minScroll = cx - (n - 1) * PIECE_SPACING;
      const maxScroll = cx;
      if (n > 0) {
        scrollXRef.current = Math.max(minScroll, Math.min(maxScroll, scrollXRef.current));
        if (scrollXRef.current === minScroll || scrollXRef.current === maxScroll) {
          velRef.current *= -0.2; // лёгкий отскок
        }
      }

      const scroll = scrollXRef.current;
      const vel    = velRef.current;

      ctx.clearRect(0, 0, W, H);

      // Найти сфокусированное произведение
      let focusIdx = -1;
      let minDist  = Infinity;
      pieces.forEach((_, i) => {
        const x    = i * PIECE_SPACING + scroll;
        const dist = Math.abs(x - cx);
        if (dist < minDist) { minDist = dist; focusIdx = i; }
      });

      const focused = focusIdx >= 0 ? pieces[focusIdx] : null;
      if (focused?.id !== focusIdRef.current) {
        focusIdRef.current = focused?.id ?? null;
        setFocusedPiece(focused);
        setTitleVisible(false);
        // Небольшой delay для fade-in заголовка
        setTimeout(() => setTitleVisible(true), 80);
        navigator.vibrate?.([5]);
      }

      // Skew эффект инерции
      const skew = Math.max(-MAX_SKEW, Math.min(MAX_SKEW, -vel * 0.0025));

      ctx.save();
      ctx.translate(cx, H / 2);
      ctx.transform(1, 0, skew, 1, 0, 0);
      ctx.translate(-cx, -H / 2);

      pieces.forEach((piece, i) => {
        const x = i * PIECE_SPACING + scroll;
        if (x < -30 || x > W + 30) return;

        const size = getPieceSize(piece.title);
        const h    = H * HEIGHT_RATIO[size];
        const y0   = (H - h) / 2;
        const dist = Math.abs(x - cx);

        const isFocused = i === focusIdx;
        const isPlaying_ = piece.id === playingPieceId && isPlaying;
        const alpha = isFocused
          ? 1.0
          : Math.max(0.15, 0.9 - dist / (W * 0.35));

        if (isFocused || isPlaying_) {
          ctx.shadowBlur  = isPlaying_ ? 40 : 22;
          ctx.shadowColor = isPlaying_
            ? 'rgba(212, 175, 55, 0.95)'
            : 'rgba(240, 235, 218, 0.85)';
        } else {
          ctx.shadowBlur = 0;
        }

        const baseW = LINE_WIDTH[size];
        ctx.lineWidth   = isFocused ? baseW * 2.5 : baseW;
        ctx.strokeStyle = isPlaying_
          ? `rgba(212, 175, 55, ${alpha})`
          : `rgba(220, 215, 200, ${alpha})`;

        ctx.beginPath();
        ctx.moveTo(x, y0);
        ctx.lineTo(x, y0 + h);
        ctx.stroke();
      });

      ctx.restore();

      rafRef.current = requestAnimationFrame(render);
    };

    rafRef.current = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pieces, playingPieceId, isPlaying]);

  // ─── Обработчики ввода ──────────────────────────────────────────────────────

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    dragRef.current = { x: e.clientX, t: Date.now(), last: e.clientX };
    velRef.current  = 0;
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.last;
    scrollXRef.current += dx;
    velRef.current      = dx;
    dragRef.current.last = e.clientX;
  }, []);

  const handleMouseUp = useCallback(() => {
    dragRef.current = null;
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    scrollXRef.current -= delta * 0.8;
    velRef.current      = -delta * 0.15;
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    dragRef.current = { x: touch.clientX, t: Date.now(), last: touch.clientX };
    velRef.current  = 0;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!dragRef.current) return;
    const touch = e.touches[0];
    const dx = touch.clientX - dragRef.current.last;
    scrollXRef.current += dx;
    velRef.current      = dx;
    dragRef.current.last = touch.clientX;
  }, []);

  const handleTouchEnd = useCallback(() => {
    dragRef.current = null;
  }, []);

  const handlePlay = useCallback(() => {
    if (!focusedPiece) return;
    if (isPlaying && playingPieceId === focusedPiece.id) {
      onStop();
    } else {
      onPlayPiece(focusedPiece, composer.era as Era);
    }
  }, [focusedPiece, isPlaying, playingPieceId, onPlayPiece, onStop, composer.era]);

  // ─── Рендер ─────────────────────────────────────────────────────────────────

  const isCurrentlyPlaying = focusedPiece?.id === playingPieceId && isPlaying;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 500,
        background: 'linear-gradient(160deg, #080808 0%, #180e06 60%, #0a0808 100%)',
        overflow: 'hidden',
      }}
    >
      {/* Opus Spectrum Canvas */}
      <canvas
        ref={canvasRef}
        style={{ position: 'absolute', inset: 0, cursor: 'grab' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />

      {/* Frosted Glass Lens */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          bottom: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: `${LENS_WIDTH}px`,
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
          background: 'rgba(255, 255, 255, 0.025)',
          borderLeft:  '1px solid rgba(255,255,255,0.07)',
          borderRight: '1px solid rgba(255,255,255,0.07)',
          pointerEvents: 'none',
        }}
      />

      {/* Верхняя метка эпохи */}
      <div
        style={{
          position: 'fixed',
          top: 28,
          left: '50%',
          transform: 'translateX(-50%)',
          textAlign: 'center',
          pointerEvents: 'none',
        }}
      >
        <div style={{
          fontFamily: 'SF Pro Display, Roboto, sans-serif',
          fontSize: '10px',
          fontWeight: '300',
          letterSpacing: '0.35em',
          color: 'rgba(212, 175, 55, 0.6)',
          textTransform: 'uppercase',
        }}>
          {composer.era}
        </div>
        <div style={{
          fontFamily: 'SF Pro Display, Georgia, serif',
          fontSize: '18px',
          fontWeight: '300',
          letterSpacing: '0.1em',
          color: 'rgba(229, 224, 210, 0.9)',
          marginTop: '6px',
        }}>
          {composer.label}
        </div>
        {composer.life_dates && (
          <div style={{
            fontFamily: 'SF Pro Display, Roboto, sans-serif',
            fontSize: '11px',
            fontWeight: '300',
            letterSpacing: '0.2em',
            color: 'rgba(180, 175, 165, 0.5)',
            marginTop: '4px',
          }}>
            {composer.life_dates}
          </div>
        )}
      </div>

      {/* Название сфокусированного произведения */}
      {focusedPiece && (
        <div
          style={{
            position: 'fixed',
            top: '20%',
            left: '50%',
            transform: 'translateX(-50%)',
            textAlign: 'center',
            pointerEvents: 'none',
            transition: 'opacity 0.25s ease, transform 0.25s ease',
            opacity: titleVisible ? 1 : 0,
            width: `${LENS_WIDTH - 20}px`,
          }}
        >
          <div style={{
            fontFamily: 'SF Pro Display, Georgia, serif',
            fontSize: '13px',
            fontWeight: '300',
            letterSpacing: '0.05em',
            color: 'rgba(229, 224, 210, 0.9)',
            lineHeight: 1.4,
            wordBreak: 'break-word',
          }}>
            {focusedPiece.title}
          </div>
          <div style={{
            marginTop: '6px',
            fontFamily: 'SF Pro Display, Roboto, sans-serif',
            fontSize: '10px',
            fontWeight: '400',
            letterSpacing: '0.25em',
            color: 'rgba(180, 155, 100, 0.55)',
            textTransform: 'uppercase',
          }}>
            {getPieceSize(focusedPiece.title)}
          </div>
        </div>
      )}

      {/* Play / Stop кнопка */}
      {focusedPiece && (
        <button
          onClick={handlePlay}
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '44px',
            height: '44px',
            background: isCurrentlyPlaying
              ? 'rgba(212, 175, 55, 0.15)'
              : 'rgba(255, 255, 255, 0.06)',
            border: `1px solid ${isCurrentlyPlaying
              ? 'rgba(212, 175, 55, 0.5)'
              : 'rgba(255, 255, 255, 0.12)'}`,
            borderRadius: '50%',
            color: isCurrentlyPlaying ? '#d4af37' : 'rgba(229, 224, 210, 0.8)',
            fontSize: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            backdropFilter: 'blur(8px)',
            zIndex: 10,
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(212, 175, 55, 0.2)';
            e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.6)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = isCurrentlyPlaying
              ? 'rgba(212, 175, 55, 0.15)'
              : 'rgba(255, 255, 255, 0.06)';
            e.currentTarget.style.borderColor = isCurrentlyPlaying
              ? 'rgba(212, 175, 55, 0.5)'
              : 'rgba(255, 255, 255, 0.12)';
          }}
        >
          {isCurrentlyPlaying ? '■' : '▶'}
        </button>
      )}

      {/* Счётчик произведений */}
      <div style={{
        position: 'fixed',
        bottom: 40,
        left: '50%',
        transform: 'translateX(-50%)',
        textAlign: 'center',
        pointerEvents: 'none',
      }}>
        <div style={{
          fontFamily: 'SF Pro Display, Roboto, sans-serif',
          fontSize: '10px',
          letterSpacing: '0.3em',
          color: 'rgba(150, 145, 135, 0.4)',
          textTransform: 'uppercase',
        }}>
          {focusedPiece
            ? `${pieces.indexOf(focusedPiece) + 1} / ${pieces.length}`
            : `${pieces.length} works`
          }
        </div>
        <div style={{
          marginTop: '8px',
          fontSize: '9px',
          letterSpacing: '0.2em',
          color: 'rgba(120, 115, 105, 0.35)',
          fontFamily: 'SF Pro Display, Roboto, sans-serif',
        }}>
          drag or scroll to navigate
        </div>
      </div>

      {/* Кнопка назад */}
      <button
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 24,
          left: 28,
          padding: '7px 14px',
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '3px',
          color: 'rgba(180, 175, 165, 0.7)',
          fontFamily: 'SF Pro Display, Roboto, sans-serif',
          fontSize: '11px',
          letterSpacing: '0.1em',
          cursor: 'pointer',
          zIndex: 20,
        }}
        onMouseEnter={e => e.currentTarget.style.color = 'rgba(229, 224, 210, 1)'}
        onMouseLeave={e => e.currentTarget.style.color = 'rgba(180, 175, 165, 0.7)'}
      >
        ← MAP
      </button>
    </div>
  );
};
