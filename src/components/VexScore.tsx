import { useEffect, useRef } from 'react';
import * as Vex from 'vexflow';

interface Props {
  treble: string[];
  bass: string[];
  width: number;
  limit?: number;
}

export const VexScore = ({ treble, bass, width, limit }: Props) => {
  const ref = useRef<HTMLDivElement>(null);

  const viewTreble = limit ? treble.slice(0, limit) : treble;
  const viewBass = limit ? bass.slice(0, limit) : bass;

  useEffect(() => {
    if (!ref.current) return;

    const VF = Vex.Flow || (Vex.default as any)?.Flow || Vex;
    ref.current.innerHTML = '';

    // Высота зависит от количества строк
    const rows = Math.ceil(viewTreble.length / 2);
    // 260px на строку + отступы
    const height = rows * 260 + 20;

    const renderer = new VF.Renderer(ref.current, VF.Renderer.Backends.SVG);
    renderer.resize(width, height);

    const context = renderer.getContext();
    context.setFont('Bravura', 12);

    let x = 0;
    let y = 0;

    for (let i = 0; i < viewTreble.length; i++) {
      // Перенос строки каждые 2 такта
      if (i > 0 && i % 2 === 0) {
        x = 0;
        y += 240;
      } else if (i > 0) {
        x += width / 2;
      }

      const staveWidth = width / 2;
      const staveTreble = new VF.Stave(x, y, staveWidth);
      const staveBass = new VF.Stave(x, y + 110, staveWidth);

      if (i === 0) {
        staveTreble.addClef('treble').addTimeSignature('4/4');
        staveBass.addClef('bass').addTimeSignature('4/4');
      }

      staveTreble.setContext(context).draw();
      staveBass.setContext(context).draw();

      const safeCreateNotes = (notesData: string, clef: string) => {
        if (!notesData) return [];
        const rawNotes = notesData.split(',');
        const validNotes: any[] = [];

        rawNotes.forEach((n) => {
          try {
            const parts = n.trim().split('/');
            if (parts.length < 2) return;
            const key = `${parts[0]}/${parts[1]}`;
            const duration = parts[2] || 'q';

            // Дополнительная валидация
            if (key.includes('undefined')) return;

            const note = new VF.StaveNote({
              keys: [key],
              duration: duration,
              clef,
            });
            validNotes.push(note);
          } catch (e) {
            // Молчим об ошибках в консоли, чтобы не пугать
          }
        });
        return validNotes;
      };

      if (viewTreble[i]) {
        const notes = safeCreateNotes(viewTreble[i], 'treble');
        if (notes.length) {
          const voice = new VF.Voice({ num_beats: 4, beat_value: 4 });
          voice.setStrict(false);
          voice.addTickables(notes);
          new VF.Formatter()
            .joinVoices([voice])
            .format([voice], staveWidth - 20);
          voice.draw(context, staveTreble);
        }
      }

      if (viewBass[i]) {
        const notes = safeCreateNotes(viewBass[i], 'bass');
        if (notes.length) {
          const voice = new VF.Voice({ num_beats: 4, beat_value: 4 });
          voice.setStrict(false);
          voice.addTickables(notes);
          new VF.Formatter()
            .joinVoices([voice])
            .format([voice], staveWidth - 20);
          voice.draw(context, staveBass);
        }
      }
    }
  }, [viewTreble, viewBass, width]);

  return <div ref={ref} />;
};
