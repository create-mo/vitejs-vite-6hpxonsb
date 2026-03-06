import { useRef, useState, useLayoutEffect, useEffect } from 'react';
import { DATABASE, type ComposerNode, type MusicPiece } from '../data/database';
import { VexScore } from './VexScore';
import { FullScreenScore } from './FullScreenScore';
import { StaveRoad } from './StaveRoad';

// ПАРАМЕТРЫ МИРА
const GRID_X = 600;
const GRID_Y = 250;
const WORLD_HEIGHT = 2000;
const HORIZON_Y = WORLD_HEIGHT / 2;

const AsyncImage = ({ src, alt }: { src: string; alt: string }) => {
  const [loaded, setLoaded] = useState(false);
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: '#eee',
        position: 'relative',
      }}
    >
      <img
        src={src}
        alt={alt}
        onLoad={() => setLoaded(true)}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          filter: 'grayscale(100%) contrast(120%) brightness(1.1)',
          opacity: loaded ? 1 : 0,
          transition: 'opacity 0.5s ease',
        }}
      />
      {!loaded && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: '10px',
            color: '#999',
          }}
        >
          ...
        </div>
      )}
    </div>
  );
};

export const ScoreCanvas = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(0.6);
  const [cameraY, setCameraY] = useState(0); // Вертикальное смещение камеры

  // UI & Audio State
  const [activeNode, setActiveNode] = useState<ComposerNode | null>(null);
  const [activePieceIndex, setActivePieceIndex] = useState(0);
  const [fullScreenPiece, setFullScreenPiece] = useState<{
    piece: MusicPiece;
    composer: string;
  } | null>(null);
  const [playbackState, setPlaybackState] = useState<
    'stopped' | 'playing' | 'paused'
  >('stopped');
  const audioCtxRef = useRef<AudioContext | null>(null);
  const timeoutsRef = useRef<number[]>([]);

  // === ЛОГИКА СЛЕДЯЩЕЙ КАМЕРЫ ===
  const handleScroll = () => {
    if (!scrollRef.current) return;

    // 1. Где мы сейчас по X (в координатах сетки)
    const scrollLeft = scrollRef.current.scrollLeft;
    const viewportCenter = scrollLeft + window.innerWidth / 2;
    const mapX = (viewportCenter - 200) / (GRID_X * zoom); // 200 - отступ слева

    // 2. Ищем соседей (между какими авторами мы находимся)
    // Сортируем базу по X
    const sortedNodes = [...DATABASE].sort((a, b) => a.x - b.x);

    // Находим левого и правого соседа
    let leftNode = sortedNodes[0];
    let rightNode = sortedNodes[sortedNodes.length - 1];

    for (let i = 0; i < sortedNodes.length - 1; i++) {
      if (sortedNodes[i].x <= mapX && sortedNodes[i + 1].x > mapX) {
        leftNode = sortedNodes[i];
        rightNode = sortedNodes[i + 1];
        break;
      }
    }

    // 3. Интерполяция Y
    // Насколько далеко мы ушли от левого соседа (0..1)
    const t = Math.max(
      0,
      Math.min(1, (mapX - leftNode.x) / (rightNode.x - leftNode.x))
    );

    // Вычисляем идеальный Y дороги в этой точке
    const targetY = (1 - t) * leftNode.y + t * rightNode.y;

    // 4. Смещаем камеру (инвертируем Y, чтобы поднять контент)
    // Сглаживание не нужно, так как скролл сам по себе плавный
    setCameraY(-targetY * GRID_Y);
  };

  // Слушаем скролл
  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.addEventListener('scroll', handleScroll);
      handleScroll(); // Init
      return () => el.removeEventListener('scroll', handleScroll);
    }
  }, [zoom]);

  // === АУДИО ===
  const playPianoTone = (
    ctx: AudioContext,
    freq: number,
    time: number,
    duration: number
  ) => {
    const osc1 = ctx.createOscillator();
    osc1.type = 'triangle';
    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    const gain = ctx.createGain();
    osc1.frequency.value = freq;
    osc2.frequency.value = freq * 2;
    const master = ctx.createGain();
    osc1.connect(master);
    osc2.connect(master);
    master.connect(gain);
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.4, time + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.01, time + duration);
    osc1.start(time);
    osc2.start(time);
    osc1.stop(time + duration);
    osc2.stop(time + duration);
  };

  const stopAudio = () => {
    timeoutsRef.current.forEach(window.clearTimeout);
    timeoutsRef.current = [];
    audioCtxRef.current?.close();
    audioCtxRef.current = null;
    setPlaybackState('stopped');
  };

  const togglePlayPause = async (piece: MusicPiece) => {
    if (playbackState === 'stopped') {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new Ctx();
      audioCtxRef.current = ctx;
      const beatTime = 60 / piece.tempo;
      let currentTime = ctx.currentTime + 0.1;
      piece.treble.forEach((ms) => {
        const notes = ms.split(',');
        const dur = (beatTime * 4) / notes.length;
        notes.forEach((n) => {
          const parts = n.trim().split('/');
          const freq = getFreq(parts[0] + '/' + parts[1]);
          if (freq > 0) playPianoTone(ctx, freq, currentTime, dur);
          currentTime += dur;
        });
      });
      timeoutsRef.current.push(
        window.setTimeout(
          () => setPlaybackState('stopped'),
          (currentTime - ctx.currentTime) * 1000
        )
      );
      setPlaybackState('playing');
    } else if (playbackState === 'playing') {
      audioCtxRef.current?.suspend();
      setPlaybackState('paused');
    } else if (playbackState === 'paused') {
      audioCtxRef.current?.resume();
      setPlaybackState('playing');
    }
  };

  const getFreq = (note: string) => {
    const notes = [
      'c',
      'c#',
      'd',
      'd#',
      'e',
      'f',
      'f#',
      'g',
      'g#',
      'a',
      'a#',
      'b',
    ];
    const parts = note.toLowerCase().split('/');
    const name = parts[0];
    const oct = parseInt(parts[1]) || 4;
    let idx = notes.indexOf(name);
    if (idx === -1 && name.includes('b')) idx = notes.indexOf(name[0]) - 1;
    if (idx === -1) return 0;
    return 440 * Math.pow(2, (idx + (oct + 1) * 12 - 69) / 12);
  };

  // Helper functions
  const getNodePos = (node: ComposerNode) => ({
    x: node.x * GRID_X + 200,
    y: HORIZON_Y + node.y * GRID_Y,
  });

  const renderRoads = () => {
    return DATABASE.map((node) => {
      const start = getNodePos(node);
      return node.predecessors.map((predId) => {
        const pred = DATABASE.find((n) => n.id === predId);
        if (!pred) return null;
        const end = getNodePos(pred);
        return (
          <StaveRoad
            key={`${pred.id}-${node.id}`}
            startX={end.x + 60}
            startY={end.y}
            endX={start.x}
            endY={start.y}
            label={`${pred.era} → ${node.era}`}
          />
        );
      });
    });
  };

  return (
    <div
      style={{
        height: '100vh',
        background: '#fff',
        color: '#000',
        fontFamily: 'Inter, sans-serif',
        overflow: 'hidden',
      }}
    >
      {/* FULL SCREEN MODAL */}
      {fullScreenPiece && (
        <FullScreenScore
          piece={fullScreenPiece.piece}
          composerName={fullScreenPiece.composer}
          onClose={() => setFullScreenPiece(null)}
          isPlaying={playbackState === 'playing'}
          onTogglePlay={() => togglePlayPause(fullScreenPiece.piece)}
          onStop={stopAudio}
        />
      )}

      {/* CENTERED CARD (FIXED OVERLAY) */}
      {activeNode && (
        <>
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(255,255,255,0.7)',
              zIndex: 190,
              backdropFilter: 'blur(5px)',
            }}
            onClick={() => {
              setActiveNode(null);
              stopAudio();
            }}
          />
          <div
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 'min(500px, 90vw)',
              background: '#fff',
              border: '1px solid #000',
              boxShadow: '0 30px 60px rgba(0,0,0,0.1)',
              zIndex: 200,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{ display: 'flex', borderBottom: '1px solid #eee' }}>
              <div style={{ width: '120px', height: '140px' }}>
                <AsyncImage src={activeNode.image} alt={activeNode.label} />
              </div>
              <div
                style={{
                  flex: 1,
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                }}
              >
                <div style={{ fontSize: '10px', textTransform: 'uppercase' }}>
                  {activeNode.era}
                </div>
                <div
                  style={{
                    fontSize: '24px',
                    fontWeight: 'bold',
                    fontFamily: 'serif',
                  }}
                >
                  {activeNode.label}
                </div>
                <div style={{ fontSize: '12px', opacity: 0.5 }}>
                  {activeNode.lifeDates}
                </div>
              </div>
            </div>
            <div
              style={{
                padding: '15px 20px',
                background: '#fafafa',
                borderBottom: '1px solid #eee',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ display: 'flex', gap: '15px' }}>
                <button
                  onClick={() =>
                    togglePlayPause(activeNode.pieces[activePieceIndex])
                  }
                  style={minimalBtnStyle}
                >
                  {playbackState === 'playing' ? (
                    <svg width="24" height="24" viewBox="0 0 24 24">
                      <path d="M6 4h4v16H6zm8 0h4v16h-4z" fill="currentColor" />
                    </svg>
                  ) : (
                    <svg width="24" height="24" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" fill="currentColor" />
                    </svg>
                  )}
                </button>
                <button onClick={stopAudio} style={minimalBtnStyle}>
                  <svg width="20" height="20" viewBox="0 0 24 24">
                    <path d="M6 6h12v12H6z" fill="currentColor" />
                  </svg>
                </button>
              </div>
              <div
                style={{
                  display: 'flex',
                  gap: '8px',
                  overflowX: 'auto',
                  maxWidth: '200px',
                }}
              >
                {activeNode.pieces.map((p, idx) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      stopAudio();
                      setActivePieceIndex(idx);
                    }}
                    style={{
                      ...bubbleStyle,
                      borderColor: activePieceIndex === idx ? '#000' : '#eee',
                      fontWeight: activePieceIndex === idx ? 'bold' : 'normal',
                    }}
                  >
                    {p.title}
                  </button>
                ))}
              </div>
            </div>
            <div
              style={{
                padding: '20px',
                cursor: 'pointer',
                textAlign: 'center',
              }}
              onClick={() => {
                stopAudio();
                setFullScreenPiece({
                  piece: activeNode.pieces[activePieceIndex],
                  composer: activeNode.label,
                });
              }}
            >
              <VexScore
                treble={activeNode.pieces[activePieceIndex].treble}
                bass={activeNode.pieces[activePieceIndex].bass}
                width={460}
                limit={2}
              />
              <div
                style={{
                  fontSize: '10px',
                  textTransform: 'uppercase',
                  marginTop: '10px',
                }}
              >
                Click to Expand ↗
              </div>
            </div>
          </div>
        </>
      )}

      {/* HUD */}
      <div
        style={{
          position: 'fixed',
          top: 20,
          left: 30,
          zIndex: 100,
          pointerEvents: 'none',
        }}
      >
        <h1 style={{ fontSize: '28px', fontWeight: '900', margin: 0 }}>
          TIMELINE
        </h1>
      </div>
      <div
        style={{
          position: 'fixed',
          bottom: 30,
          right: 30,
          display: 'flex',
          gap: '10px',
          zIndex: 100,
        }}
      >
        <button
          onClick={() => setZoom((z) => Math.max(0.3, z - 0.1))}
          style={zoomBtnStyle}
        >
          -
        </button>
        <button
          onClick={() => setZoom((z) => Math.min(1.0, z + 0.1))}
          style={zoomBtnStyle}
        >
          +
        </button>
      </div>

      {/* WORLD */}
      <div
        ref={scrollRef}
        style={{
          width: '100%',
          height: '100%',
          overflowX: 'auto',
          overflowY: 'hidden',
          cursor: 'grab',
        }}
      >
        <div
          style={{
            width: '10000px',
            height: WORLD_HEIGHT,
            // ПРИМЕНЯЕМ СМЕЩЕНИЕ КАМЕРЫ (cameraY)
            transform: `scale(${zoom}) translateY(${cameraY}px)`,
            transformOrigin: 'center center',
            transition: 'transform 0.1s linear', // Быстрая реакция на скролл
            position: 'relative',
          }}
        >
          <svg
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
            }}
          >
            {renderRoads()}
          </svg>
          {DATABASE.map((node) => {
            const pos = getNodePos(node);
            return (
              <div
                key={node.id}
                style={{
                  position: 'absolute',
                  left: pos.x,
                  top: pos.y - 40,
                  zIndex: 10,
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                }}
                onClick={() => {
                  setActiveNode(node);
                  setActivePieceIndex(0);
                  stopAudio();
                }}
              >
                <div
                  style={{
                    width: '70px',
                    height: '70px',
                    borderRadius: '50%',
                    overflow: 'hidden',
                    border: '1px solid #000',
                    background: '#fff',
                    marginBottom: '10px',
                    transition: 'transform 0.2s',
                  }}
                >
                  <AsyncImage src={node.image} alt={node.label} />
                </div>
                <div
                  style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    background: 'rgba(255,255,255,0.8)',
                    padding: '2px 8px',
                  }}
                >
                  {node.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Стили
const zoomBtnStyle = {
  width: '40px',
  height: '40px',
  background: '#fff',
  border: '1px solid #000',
  color: '#000',
  fontSize: '20px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};
const minimalBtnStyle = {
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
  padding: '5px',
};
const bubbleStyle = {
  border: '1px solid #eee',
  borderRadius: '15px',
  padding: '6px 12px',
  fontSize: '11px',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  background: 'transparent',
};
