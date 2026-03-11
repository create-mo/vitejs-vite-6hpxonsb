import { useEffect, useRef } from 'react';
// @ts-ignore
import Vex from 'vexflow';

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

    ref.current.innerHTML = '';

    const VF = Vex;
    if (!VF || !VF.Renderer) return;

    const rows = Math.ceil(viewTreble.length / 2);
    const height = Math.max(rows * 150 + 20, 150);

    const renderer = new VF.Renderer(ref.current, VF.Renderer.Backends.SVG);
    renderer.resize(width, height);
    const context = renderer.getContext();

    let currentY = 20;

    for (let row = 0; row < rows; row++) {
      const startIdx = row * 2;
      const endIdx = Math.min(startIdx + 2, viewTreble.length);

      // Создаем стан
      const stave = new VF.Stave(10, currentY, width - 20);
      stave.addClef('treble').addTimeSignature('4/4');
      stave.setContext(context).draw();

      // Создаем ноты для тактов
      const notes: any[] = [];

      for (let i = startIdx; i < endIdx; i++) {
        const trebleNoteStr = viewTreble[i] || '';

        if (trebleNoteStr) {
          const trebleNotes = trebleNoteStr.split(',').map((n: string) => n.trim());
          const validNotes = trebleNotes.filter((n: string) => n && n !== 'rest');
          if (validNotes.length > 0) {
            notes.push(new VF.StaveNote({ keys: validNotes, duration: 'q' }));
          }
        }
      }

      if (notes.length > 0) {
        const voice = new VF.Voice({ numBeats: notes.length * 4, beatValue: 4 }).addTickables(notes);
        new VF.Formatter().joinVoices([voice]).format([voice], width - 60);
        voice.setContext(context).draw();
      }

      currentY += 120;
    }

  }, [viewTreble, viewBass, width]);

  return <div ref={ref} style={{ width }} />;
};
