import { api } from './api';

export interface TTSState {
  enabled: boolean;
  playingId: string | number | null;
  loadingId: string | number | null;
}

type StateListener = (state: TTSState) => void;

class TTSService {
  private enabled: boolean = true;
  private playingId: string | number | null = null;
  private loadingId: string | number | null = null;
  private currentAudio: HTMLAudioElement | null = null;
  private audioUrlCache: Map<string, string> = new Map();
  private listeners: Set<StateListener> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('hail_mary_tts_enabled');
      this.enabled = saved !== null ? saved === 'true' : true;
    }
  }

  public subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const state = this.getState();
    this.listeners.forEach((listener) => {
      try {
        listener(state);
      } catch {
        // Ignore subscriber error
      }
    });
  }

  public getState(): TTSState {
    return {
      enabled: this.enabled,
      playingId: this.playingId,
      loadingId: this.loadingId,
    };
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public toggle(): boolean {
    this.enabled = !this.enabled;
    if (typeof window !== 'undefined') {
      localStorage.setItem('hail_mary_tts_enabled', String(this.enabled));
    }
    if (!this.enabled) {
      this.stop();
    }
    this.notify();
    return this.enabled;
  }

  public isPlaying(id?: string | number): boolean {
    if (id !== undefined) {
      return this.playingId === id;
    }
    return this.playingId !== null;
  }

  public isLoading(id?: string | number): boolean {
    if (id !== undefined) {
      return this.loadingId === id;
    }
    return this.loadingId !== null;
  }

  public stop() {
    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
      } catch {}
      this.currentAudio = null;
    }

    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }

    this.playingId = null;
    this.loadingId = null;
    this.notify();
  }

  public async playMessage(
    id: string | number,
    text: string,
    options?: {
      sessionId?: number;
      userMail?: string;
      force?: boolean;
    }
  ): Promise<void> {
    if (!text || !text.trim()) return;

    // If already playing this message, clicking again toggles/stops it
    if (this.playingId === id) {
      this.stop();
      return;
    }

    // If disabled and not explicitly triggered by user click (force !== true)
    if (!this.enabled && !options?.force) {
      return;
    }

    // Stop previous transmission
    this.stop();

    const cleanText = text.trim();
    const cacheKey = `${id}_${cleanText}`;

    // 1. Check if audio URL is already cached in memory
    const cachedUrl = this.audioUrlCache.get(cacheKey);
    if (cachedUrl) {
      this.playAudioUrl(id, cachedUrl);
      return;
    }

    // 2. Synthesize audio via backend Soprano TTS endpoint
    this.loadingId = id;
    this.notify();

    try {
      const blob = await api.synthesizeSpeech(cleanText, options?.sessionId, options?.userMail);
      if (blob && blob.size > 0) {
        const audioUrl = URL.createObjectURL(blob);
        this.audioUrlCache.set(cacheKey, audioUrl);
        this.loadingId = null;
        this.playAudioUrl(id, audioUrl);
        return;
      }
    } catch {
      // Backend synthesis error - will fallback below
    }

    // 3. Fallback: Browser Web Speech API if backend TTS was unreachable or failed
    this.loadingId = null;
    this.playSpeechSynthesisFallback(id, cleanText);
  }

  private playAudioUrl(id: string | number, url: string) {
    try {
      const audio = new Audio(url);
      this.currentAudio = audio;
      this.playingId = id;
      this.notify();

      audio.onended = () => {
        if (this.playingId === id) {
          this.playingId = null;
          this.currentAudio = null;
          this.notify();
        }
      };

      audio.onerror = () => {
        if (this.playingId === id) {
          this.playingId = null;
          this.currentAudio = null;
          this.notify();
        }
      };

      audio.play().catch(() => {
        // Autoplay may be restricted until first user interaction
        this.playingId = null;
        this.currentAudio = null;
        this.notify();
      });
    } catch {
      this.playingId = null;
      this.currentAudio = null;
      this.notify();
    }
  }

  private playSpeechSynthesisFallback(id: string | number, text: string) {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      this.notify();
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 0.95;

      this.playingId = id;
      this.notify();

      utterance.onend = () => {
        if (this.playingId === id) {
          this.playingId = null;
          this.notify();
        }
      };

      utterance.onerror = () => {
        if (this.playingId === id) {
          this.playingId = null;
          this.notify();
        }
      };

      window.speechSynthesis.speak(utterance);
    } catch {
      this.playingId = null;
      this.notify();
    }
  }
}

export const ttsService = new TTSService();
