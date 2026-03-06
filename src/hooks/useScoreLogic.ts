import { useEffect, useState } from 'react';
import * as Vex from 'vexflow';

// === 1. РАСШИРЕННАЯ БАЗА МЕЛОДИЙ ===
export const THEMES: Record<string, { treble: string[], bass: string[], label: string, tempo: number, composer: string }> = {
    // --- BAROQUE ---
    'vivaldi_spring': {
        label: 'The Four Seasons: Spring',
        composer: 'Antonio Vivaldi',
        tempo: 100,
        treble: ['e/5, g#/4, g#/4, g#/4', 'f#/4, e/4, b/3, b/3', 'e/5, g#/4, g#/4, g#/4', 'f#/4, e/4, b/3'],
        bass:   ['e/3, b/3, e/4, b/3',   'e/3, b/3, e/4, b/3', 'e/3, b/3, e/4, b/3',   'e/3, b/3, e/4']
    },
    'bach_minuet': {
        label: 'Minuet in G',
        composer: 'J.S. Bach',
        tempo: 120,
        treble: ['d/5, g/4, a/4, b/4, c/5', 'd/5, g/4, g/4', 'e/5, c/5, d/5, e/5, f/5', 'g/5, g/4, g/4'],
        bass:   ['g/3, b/3, d/4',          'b/3, d/4',      'c/4, e/4, c/4',           'b/3, g/3']
    },
    'handel_sarabande': {
        label: 'Sarabande',
        composer: 'G.F. Handel',
        tempo: 60,
        treble: ['d/5, a/4, f/4', 'g/4, a/4, g/4', 'f/4, e/4, d/4', 'e/4, a/3, a/3'],
        bass:   ['d/3, f/3, a/3', 'c#/3, e/3, a/3', 'd/3, f/3, a/3', 'a/2, c#/3, e/3']
    },

    // --- CLASSICAL ---
    'haydn_surprise': {
        label: 'Surprise Symphony (No. 94)',
        composer: 'Joseph Haydn',
        tempo: 110,
        treble: ['c/4, c/4, e/4, e/4', 'g/4, g/4, e/4', 'f/4, f/4, d/4, d/4', 'b/3, b/3, g/3'],
        bass:   ['c/3, e/3, g/3, c/4', 'c/3, e/3, g/3', 'g/2, b/2, d/3, g/3', 'g/2, g/2, g/2']
    },
    'mozart_sonata': {
        label: 'Sonata Facile (K.545)',
        composer: 'W.A. Mozart',
        tempo: 140,
        treble: ['c/5, e/5, g/5', 'b/4, c/5, d/5, c/5', 'a/4, g/4, c/5, g/4, f/4, g/4', 'e/4/h'],
        bass:   ['c/3, g/3, e/3, g/3', 'c/3, g/3, e/3, g/3', 'c/3, a/3, f/3, a/3',    'c/3, g/3, e/3, g/3']
    },
    'beethoven_ode': {
        label: 'Ode to Joy (Symphony No. 9)',
        composer: 'L.v. Beethoven',
        tempo: 120,
        treble: ['e/4, e/4, f/4, g/4', 'g/4, f/4, e/4, d/4', 'c/4, c/4, d/4, e/4', 'e/4, d/4, d/4'],
        bass:   ['c/3, e/3, g/3',      'c/3, f/3, a/3',      'c/3, e/3, g/3',      'g/2, b/2, d/3']
    },

    // --- ROMANTIC ---
    'schubert_trout': {
        label: 'The Trout (Quintet)',
        composer: 'Franz Schubert',
        tempo: 100,
        treble: ['d/5, b/4, g/4, b/4', 'd/5, b/4, g/4', 'c/5, a/4, f#/4, a/4', 'c/5, a/4, f#/4'],
        bass:   ['g/3, b/3, d/4',      'g/3, d/4',      'd/3, f#/3, a/3',      'd/3, a/3']
    },
    'chopin_nocturne': {
        label: 'Nocturne in Eb Major',
        composer: 'Frederic Chopin',
        tempo: 90,
        treble: ['g/4, f/4, g/4', 'bb/4, g/4', 'c/5, bb/4', 'eb/5, d/5, c/5'],
        bass:   ['eb/3, bb/3, g/3', 'eb/3, bb/3', 'ab/3, c/4', 'ab/3, eb/4']
    },
    'tchaikovsky_swan': {
        label: 'Swan Lake Theme',
        composer: 'P.I. Tchaikovsky',
        tempo: 100,
        treble: ['b/4, a/4, f#/4', 'd/4, e/4, f#/4', 'b/3, d/4, f#/4', 'a/4, g/4, e/4'],
        bass:   ['b/2, f#/3',      'b/2, d/3',       'b/2, f#/3',      'e/3, g/3']
    }
};

// === 2. ТАЙМЛАЙН ПРОИЗВЕДЕНИЙ ===
// Теперь мы перечисляем не эпохи, а произведения подряд
export const SCORE_SEQUENCE = [
    // Baroque
    { id: 'baroque', era: 'Baroque', themeKey: 'vivaldi_spring' },
    { id: 'baroque', era: 'Baroque', themeKey: 'bach_minuet' },
    { id: 'baroque', era: 'Baroque', themeKey: 'handel_sarabande' },
    // Classical
    { id: 'classical', era: 'Classical', themeKey: 'haydn_surprise' },
    { id: 'classical', era: 'Classical', themeKey: 'mozart_sonata' },
    { id: 'classical', era: 'Classical', themeKey: 'beethoven_ode' },
    // Romantic
    { id: 'romantic', era: 'Romantic', themeKey: 'schubert_trout' },
    { id: 'romantic', era: 'Romantic', themeKey: 'chopin_nocturne' },
    { id: 'romantic', era: 'Romantic', themeKey: 'tchaikovsky_swan' }
];

export const useScoreLogic = (containerRef: React.RefObject<HTMLDivElement>) => {
  const [status, setStatus] = useState<string>("Инициализация...");

  useEffect(() => {
    if (!containerRef.current) return;

    const run = async () => {
      try {
        const VF = Vex.Flow || (Vex.default as any)?.Flow || Vex;
        if (!VF || !VF.Factory) throw new Error("VexFlow Error");

        containerRef.current!.innerHTML = '';
        
        const MEASURE_WIDTH = 320;
        // Каждое произведение занимает 4 такта
        const TOTAL_MEASURES = SCORE_SEQUENCE.length * 4; 
        const TOTAL_WIDTH = MEASURE_WIDTH * TOTAL_MEASURES + 100; 
        const HEIGHT = 500; // Чуть выше для подписей

        const renderer = new VF.Renderer(containerRef.current!, VF.Renderer.Backends.SVG);
        renderer.resize(TOTAL_WIDTH, HEIGHT);
        const context = renderer.getContext();
        context.setFont('Bravura', 12); 

        // === ГЕНЕРАЦИЯ ЛЕНТЫ ===
        let globalMeasureIndex = 0;

        SCORE_SEQUENCE.forEach((item, index) => {
            const theme = THEMES[item.themeKey];
            const isEraStart = index === 0 || SCORE_SEQUENCE[index - 1].era !== item.era;
            const eraColor = getEraColor(item.era);

            // Рисуем 4 такта для каждого произведения
            for (let m = 0; m < 4; m++) {
                const xPos = globalMeasureIndex * MEASURE_WIDTH + 20;
                const yPos = 100; // Отступ сверху

                // 1. ЗАГОЛОВОК ЭПОХИ (ТОЛЬКО В НАЧАЛЕ НОВОЙ ЭПОХИ)
                if (isEraStart && m === 0) {
                    context.save();
                    context.setFont('sans-serif', 28, 'bold');
                    context.setFillStyle(eraColor);
                    context.fillText(item.era, xPos, yPos - 60);
                    
                    // Толстая черта разделителя эпохи
                    context.beginPath();
                    context.setStrokeStyle(eraColor);
                    context.setLineWidth(4);
                    context.moveTo(xPos - 10, yPos - 70);
                    context.lineTo(xPos - 10, yPos + 300);
                    context.stroke();
                    context.restore();
                }

                // 2. ЗАГОЛОВОК АВТОРА (В НАЧАЛЕ ПРОИЗВЕДЕНИЯ)
                if (m === 0) {
                    context.save();
                    context.setFont('sans-serif', 16, 'bold');
                    context.setFillStyle('#333');
                    context.fillText(theme.composer, xPos, yPos - 30);
                    
                    context.setFont('sans-serif', 14, 'italic');
                    context.setFillStyle('#666');
                    context.fillText(theme.label, xPos, yPos - 10);
                    context.restore();
                    
                    // Тонкая черта разделителя произведений
                    if (!isEraStart) {
                        context.beginPath();
                        context.setStrokeStyle('#ccc');
                        context.setLineWidth(1);
                        context.setLineDash([5, 5]); // Пунктир
                        context.moveTo(xPos - 10, yPos - 40);
                        context.lineTo(xPos - 10, yPos + 300);
                        context.stroke();
                        context.setLineDash([]);
                    }
                }

                // Рисуем стан
                const staveTreble = new VF.Stave(xPos, yPos, MEASURE_WIDTH);
                const staveBass = new VF.Stave(xPos, yPos + 110, MEASURE_WIDTH);

                // Ключи рисуем в начале КАЖДОГО произведения (или эпохи)
                if (m === 0) {
                    staveTreble.addClef("treble").addTimeSignature("4/4");
                    staveBass.addClef("bass").addTimeSignature("4/4");
                }

                staveTreble.setContext(context).draw();
                staveBass.setContext(context).draw();

                // РИСУЕМ НОТЫ
                if (theme.treble[m]) {
                    drawVoice(VF, context, staveTreble, theme.treble[m], 'treble', MEASURE_WIDTH);
                }
                if (theme.bass[m]) {
                    drawVoice(VF, context, staveBass, theme.bass[m], 'bass', MEASURE_WIDTH);
                }

                // Соединители
                if (m === 0) {
                    new VF.StaveConnector(staveTreble, staveBass).setType(VF.StaveConnector.type.BRACE).setContext(context).draw();
                    new VF.StaveConnector(staveTreble, staveBass).setType(VF.StaveConnector.type.SINGLE_LEFT).setContext(context).draw();
                }
                new VF.StaveConnector(staveTreble, staveBass).setType(VF.StaveConnector.type.SINGLE_RIGHT).setContext(context).draw();

                globalMeasureIndex++;
            }
        });
        
        setStatus(`✅ Библиотека загружена: ${SCORE_SEQUENCE.length} произведений.`);

      } catch (e: any) {
        console.error(e);
        setStatus(`❌ Ошибка: ${e.message}`);
      }
    };

    const timer = setTimeout(run, 100);
    return () => clearTimeout(timer);

  }, [containerRef]);

  return { status };
};

// === ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ===

function getEraColor(era: string) {
    switch(era) {
        case 'Baroque': return '#8d6e63';   // Коричневый
        case 'Classical': return '#4db6ac'; // Бирюзовый
        case 'Romantic': return '#e57373';  // Розовый
        default: return '#9575cd';
    }
}

function drawVoice(VF: any, context: any, stave: any, noteData: string, clef: string, width: number) {
    if (!noteData) return;
    
    // Парсер
    const notes = noteData.split(',').map(n => {
        if (n.includes('r')) return new VF.StaveNote({ keys: ["b/4"], duration: "qr", clef });
        const parts = n.trim().split('/');
        return new VF.StaveNote({ keys: [`${parts[0]}/${parts[1]}`], duration: parts[2] || 'q', clef });
    });

    if (notes.length > 0) {
        const voice = new VF.Voice({num_beats: 4, beat_value: 4});
        voice.setStrict(false);
        voice.addTickables(notes);
        new VF.Formatter().joinVoices([voice]).format([voice], width - 50);
        voice.draw(context, stave);
    }
}