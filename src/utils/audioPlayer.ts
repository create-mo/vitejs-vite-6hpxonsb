const NOTE_FREQUENCIES: Record<string, number> = {
  'C3': 130.81, 'C#3': 138.59, 'D3': 146.83, 'D#3': 155.56,
  'E3': 164.81, 'F3': 174.61, 'F#3': 185.00, 'G3': 196.00,
  'G#3': 207.65, 'A3': 220.00, 'A#3': 233.08, 'B3': 246.94,
  'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'D#4': 311.13,
  'E4': 329.63, 'F4': 349.23, 'F#4': 369.99, 'G4': 392.00,
  'G#4': 415.30, 'A4': 440.00, 'A#4': 466.16, 'B4': 493.88,
  'C5': 523.25, 'C#5': 554.37, 'D5': 587.33, 'D#5': 622.25,
  'E5': 659.25, 'F5': 698.46, 'F#5': 739.99, 'G5': 783.99,
  'G#5': 830.61, 'A5': 880.00, 'A#5': 932.33, 'B5': 987.77,
};

export class AudioPlayer {
  private audioContext: AudioContext | null = null;

  private getAudioContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }
    return this.audioContext;
  }

  async playNote(frequency: number, duration: number, startTime: number): Promise<void> {
    const ctx = this.getAudioContext();

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(frequency, startTime);

    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start(startTime);
    oscillator.stop(startTime + duration);
  }

  async playSequence(): Promise<void> {
    const ctx = this.getAudioContext();
    const currentTime = ctx.currentTime;

    const beatDuration = 0.5;

    this.playNote(NOTE_FREQUENCIES['C#5'], beatDuration, currentTime);
    this.playNote(NOTE_FREQUENCIES['B4'], beatDuration, currentTime + beatDuration);
    this.playNote(NOTE_FREQUENCIES['A4'], beatDuration, currentTime + beatDuration * 2);
    this.playNote(NOTE_FREQUENCIES['G#4'], beatDuration, currentTime + beatDuration * 3);

    this.playNote(NOTE_FREQUENCIES['C#3'], beatDuration * 2, currentTime);
    this.playNote(NOTE_FREQUENCIES['C#3'], beatDuration * 2, currentTime + beatDuration * 2);

    return new Promise(resolve => {
      setTimeout(resolve, beatDuration * 4 * 1000 + 100);
    });
  }

  close(): void {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

export const audioPlayer = new AudioPlayer();
