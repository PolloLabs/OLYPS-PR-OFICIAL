/**
 * Utilitário de sons para o PDV
 * Gera bips sonoros usando Web Audio API
 */

export interface SoundConfig {
  frequency: number;
  duration: number;
  volume: number;
  type: 'sine' | 'square' | 'sawtooth' | 'triangle';
}

export const defaultConfigs: Record<string, SoundConfig> = {
  success: {
    frequency: 800,
    duration: 200,
    volume: 0.3,
    type: 'sine',
  },
  error: {
    frequency: 400,
    duration: 500,
    volume: 0.3,
    type: 'sine',
  },
  beep: {
    frequency: 600,
    duration: 150,
    volume: 0.2,
    type: 'sine',
  },
  scan: {
    frequency: 1000,
    duration: 100,
    volume: 0.2,
    type: 'square',
  },
};

export function isSoundEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  const saved = localStorage.getItem('pdv_sound_enabled');
  return saved === null ? true : saved === 'true';
}

export function setSoundEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('pdv_sound_enabled', String(enabled));
}

/**
 * Toca um som com os parâmetros especificados
 */
export function playSound(config: SoundConfig): void {
  if (!isSoundEnabled()) return;
  try {
    const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = config.frequency;
    oscillator.type = config.type;
    
    gainNode.gain.setValueAtTime(config.volume, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + (config.duration / 1000));
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + (config.duration / 1000));

    setTimeout(() => {
      try {
        audioContext.close();
      } catch {
        // ignore
      }
    }, config.duration + 100);
  } catch (error) {
    console.error('Erro ao tocar som:', error);
  }
}

/**
 * Toca som de sucesso (bip agudo e curto: 800Hz, 200ms)
 */
export function playSuccessSound(): void {
  playSound(defaultConfigs.success);
}

/**
 * Toca som de erro (bip grave e longo: 400Hz, 500ms)
 */
export function playErrorSound(): void {
  playSound(defaultConfigs.error);
}

/**
 * Toca som de beep genérico
 */
export function playBeepSound(frequency?: number, duration?: number): void {
  playSound({
    ...defaultConfigs.beep,
    frequency: frequency || defaultConfigs.beep.frequency,
    duration: duration || defaultConfigs.beep.duration,
  });
}

/**
 * Toca som de scanner de código de barras
 */
export function playScanSound(): void {
  playSound(defaultConfigs.scan);
}

export default {
  playSound,
  playSuccessSound,
  playErrorSound,
  playBeepSound,
  playScanSound,
  isSoundEnabled,
  setSoundEnabled,
};
