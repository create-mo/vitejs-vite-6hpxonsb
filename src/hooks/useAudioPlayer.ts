import { useRef, useState, useCallback } from 'react';
import type { MusicPiece } from '../data/database';

export type PlaybackState = 'stopped' | 'playing' | 'paused';

interface UseAudioPlayerReturn {
  playbackState: PlaybackState;
  playPianoTone: (
    ctx: AudioContext,
    freq: number,
    time: number,
    duration: number
  ) => void;
  getFreq: (note: string) => number;
  togglePlayPause: (piece: MusicPiece, era?: string) => Promise<void>;
  stopAudio: () => void;
}

// Динамика по эпохам
const ERA_DYNAMICS: Record<string, { gain: number; sustain: number }> = {
  'Baroque': { gain: 0.3, sustain: 0.5 },
  'Classical': { gain: 0.4, sustain: 0.7 },
  'Romantic': { gain: 0.5, sustain: 0.9 },
  '20th Century': { gain: 0.35, sustain: 0.6 },
  'Contemporary': { gain: 0.4, sustain: 0.65 },
};

export const useAudioPlayer = (): UseAudioPlayerReturn => {
  const [playbackState, setPlaybackState] = useState<PlaybackState>('stopped');
  const audioContextRef = useRef<AudioContext | null>(null);
  const timeoutsRef = useRef<number[]>([]);

  const getFreq = useCallback((note: string): number => {
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
  }, []);

  const createOscillator = useCallback((ctx: AudioContext, freq: number): OscillatorNode => {
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = freq;
    return osc;
  }, []);

  // Sustain Pedal (ADSR envelope) - TODO: Использовать для продвинутого воспроизведения
  /*
  const _playPianoToneWithSustain = useCallback((
    ctx: AudioContext,
    freq: number,
    time: number,
    duration: number,
    dynamics: { gain: number; sustain: number } = { gain: 0.4, sustain: 0.7 }
  ): void => {
    const oscillator = ctx.createOscillator();
    oscillator.type = 'triangle';
    oscillator.frequency.value = freq;

    const gain = ctx.createGain();
    gain.connect(ctx.destination);

    const { gain: maxGain, sustain: sustainLevel } = dynamics;
    const attack = 0.01;
    const decay = 0.1;
    const release = 0.3;

    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(maxGain, time + attack);
    gain.gain.linearRampToValueAtTime(maxGain * sustainLevel, time + attack + decay);
    gain.gain.linearRampToValueAtTime(0, time + attack + decay + duration);

    oscillator.start(time);
    oscillator.stop(time + attack + decay + duration + release);
  }, []);
  */

  // Аккорды (treble + bass вместе)
  const playChord = useCallback((
    ctx: AudioContext,
    trebleFreqs: number[],
    bassFreqs: number[],
    time: number,
    duration: number,
    dynamics: { gain: number; sustain: number }
  ): void => {
    // Master gain для контроля общей громкости
    const masterGain = ctx.createGain();
    masterGain.gain.value = dynamics.gain;
    masterGain.connect(ctx.destination);

    // Treble oscillators
    const trebleOscillators = trebleFreqs.map(f => createOscillator(ctx, f));
    const trebleGainNodes = trebleOscillators.map(() => ctx.createGain());

    trebleOscillators.forEach((osc, i) => {
      trebleGainNodes[i].connect(masterGain);
      osc.connect(trebleGainNodes[i]);
      osc.start(time);
      osc.stop(time + duration);
    });

    // Bass oscillators
    const bassOscillators = bassFreqs.map(f => createOscillator(ctx, f));
    const bassGainNodes = bassOscillators.map(() => ctx.createGain());

    bassOscillators.forEach((osc, i) => {
      bassGainNodes[i].connect(masterGain);
      osc.connect(bassGainNodes[i]);
      osc.start(time);
      osc.stop(time + duration);
    });

    // Apply ADSR envelope to master gain
    const { sustain } = dynamics;
    const attack = 0.01;
    const decay = 0.1;

    masterGain.gain.setValueAtTime(0, time);
    masterGain.gain.linearRampToValueAtTime(dynamics.gain, time + attack);
    masterGain.gain.linearRampToValueAtTime(dynamics.gain * sustain, time + attack + decay);
    masterGain.gain.linearRampToValueAtTime(0, time + attack + decay + duration);
  }, [createOscillator]);

  const playPianoTone = useCallback((
    ctx: AudioContext,
    freq: number,
    time: number,
    duration: number
  ): void => {
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
  }, []);

  const stopAudio = useCallback(() => {
    timeoutsRef.current.forEach(window.clearTimeout);
    timeoutsRef.current = [];
    audioContextRef.current?.close();
    audioContextRef.current = null;
    setPlaybackState('stopped');
  }, []);

  const togglePlayPause = useCallback(async (piece: MusicPiece, era: string = 'Classical'): Promise<void> => {
    if (playbackState === 'stopped') {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new Ctx();
      audioContextRef.current = ctx;
      const beatTime = 60 / piece.tempo;
      let currentTime = ctx.currentTime + 0.1;
      const dynamics = ERA_DYNAMICS[era] || ERA_DYNAMICS['Classical'];

      piece.treble.forEach((measureString: string, measureIndex: number) => {
        const trebleNotes = measureString.split(',');
        const dur = (beatTime * 4) / trebleNotes.length;
        const bassNotes = piece.bass[measureIndex]?.split(',') || [];

        // Collect frequencies for this time slice
        const trebleFreqs: number[] = [];
        const bassFreqs: number[] = [];

        trebleNotes.forEach((noteStr: string) => {
          const parts = noteStr.trim().split('/');
          const freq = getFreq(parts[0] + '/' + parts[1]);
          if (freq > 0) trebleFreqs.push(freq);
        });

        bassNotes.forEach((noteStr: string) => {
          const parts = noteStr.trim().split('/');
          const freq = getFreq(parts[0] + '/' + parts[1]);
          if (freq > 0) bassFreqs.push(freq);
        });

        // Play as chord if multiple notes, or single note
        if (trebleFreqs.length > 0 || bassFreqs.length > 0) {
          playChord(ctx, trebleFreqs, bassFreqs, currentTime, dur, dynamics);
        }

        currentTime += dur;
      });

      timeoutsRef.current.push(
        window.setTimeout(
          () => setPlaybackState('stopped'),
          (currentTime - ctx.currentTime) * 1000
        )
      );
      setPlaybackState('playing');
    } else if (playbackState === 'playing') {
      audioContextRef.current?.suspend();
      setPlaybackState('paused');
    } else if (playbackState === 'paused') {
      audioContextRef.current?.resume();
      setPlaybackState('playing');
    }
  }, [playbackState, getFreq, playPianoTone, playChord]);

  return {
    playbackState,
    playPianoTone,
    getFreq,
    togglePlayPause,
    stopAudio,
  };
};
