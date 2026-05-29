'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useAppStore } from '@/store/useAppStore';

// ── Native Platform Detection ────────────────────────────────────────────────

function isNativePlatform(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const cap = (window as any).Capacitor;
    if (cap && typeof cap.isNativePlatform === 'function') {
      return cap.isNativePlatform();
    }
    if (cap && cap.platform === 'android') return true;
    if (cap && cap.isNative === true) return true;
    return false;
  } catch {
    return false;
  }
}

// ── Capacitor TTS Plugin Loader ─────────────────────────────────────────────

let _ttsPlugin: any = undefined;

async function getTTSPlugin() {
  if (_ttsPlugin !== undefined) return _ttsPlugin;
  if (!isNativePlatform()) {
    _ttsPlugin = null;
    return null;
  }
  try {
    const mod = await import('@capacitor-community/text-to-speech');
    _ttsPlugin = mod.TextToSpeech;
    return _ttsPlugin;
  } catch (err) {
    console.warn('Failed to load Capacitor TTS plugin:', err);
    _ttsPlugin = null;
    return null;
  }
}

// ── Audio Player for Pre-recorded Files ─────────────────────────────────────

let _audioElement: HTMLAudioElement | null = null;

function getAudioElement(): HTMLAudioElement {
  if (!_audioElement) {
    _audioElement = new Audio();
    _audioElement.preload = 'auto';
  }
  return _audioElement;
}

// ── Warm Storytelling Parameters for native TTS fallback ────────────────────

const STORY_RATE_MULTIPLIER = 0.85;
const STORY_PITCH = 0.95;

// ── TTS Check Result ────────────────────────────────────────────────────────

export interface TTSCheckResult {
  available: boolean;
  hasRussianVoice: boolean;
  isNative: boolean;
}

// ── TTS Hook ────────────────────────────────────────────────────────────────

export function useTTS() {
  const { voiceSpeed, setIsSpeaking, setIsPlaying } = useAppStore();
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const [isNative, setIsNative] = useState(false);
  const [ttsAvailable, setTtsAvailable] = useState(true);
  const speakingRef = useRef(false);
  const stopRequestedRef = useRef(false);
  const audioPlayingRef = useRef(false);
  const currentAudioUrlRef = useRef<string | null>(null);

  useEffect(() => {
    const native = isNativePlatform();
    setIsNative(native);
    if (native) {
      getTTSPlugin().then(plugin => {
        setTtsAvailable(!!plugin);
      });
    } else {
      if (typeof window !== 'undefined') {
        const hasWebSpeech = !!window.speechSynthesis;
        setTtsAvailable(hasWebSpeech);
        if (hasWebSpeech) {
          window.speechSynthesis.getVoices();
          window.speechSynthesis.onvoiceschanged = () => {
            window.speechSynthesis.getVoices();
          };
        }
      }
    }
  }, []);

  // ── Play pre-recorded audio file ────────────────────────────────────

  const playAudio = useCallback(async (audioUrl: string, onEnd?: () => void): Promise<boolean> => {
    return new Promise((resolve) => {
      try {
        const audio = getAudioElement();

        // If same audio is already loaded and playing, don't restart
        if (audioPlayingRef.current && currentAudioUrlRef.current === audioUrl) {
          resolve(true);
          return;
        }

        audio.src = audioUrl;
        // Neural TTS audio is already at natural storytelling pace;
        // apply speed adjustment more gently to preserve quality
        audio.playbackRate = Math.max(0.5, Math.min(2.0, voiceSpeed));
        audio.volume = 1.0;
        audioPlayingRef.current = true;
        speakingRef.current = true;
        stopRequestedRef.current = false;
        currentAudioUrlRef.current = audioUrl;
        setIsSpeaking(true);

        const cleanup = () => {
          audioPlayingRef.current = false;
          speakingRef.current = false;
          currentAudioUrlRef.current = null;
          setIsSpeaking(false);
          audio.onended = null;
          audio.onerror = null;
        };

        audio.onended = () => {
          cleanup();
          if (!stopRequestedRef.current) {
            onEnd?.();
          }
          resolve(true);
        };

        audio.onerror = () => {
          console.warn('Audio playback failed:', audioUrl);
          cleanup();
          resolve(false);
        };

        audio.play().catch(() => {
          console.warn('Audio play() failed (autoplay policy?):', audioUrl);
          cleanup();
          resolve(false);
        });
      } catch {
        resolve(false);
      }
    });
  }, [voiceSpeed, setIsSpeaking]);

  // ── Main speak function ─────────────────────────────────────────────

  const speak = useCallback(async (text: string, onEnd?: () => void, audioUrl?: string) => {
    stopRequestedRef.current = false;

    // Priority 1: Pre-recorded audio file (neural TTS quality)
    if (audioUrl) {
      const success = await playAudio(audioUrl, onEnd);
      if (success) return;
      // If pre-recorded failed, fall through to live TTS
      console.info('Pre-recorded audio unavailable, falling back to live TTS');
    }

    speakingRef.current = true;
    setIsSpeaking(true);

    // Priority 2: Capacitor native TTS (works in APK)
    if (isNative) {
      try {
        const tts = await getTTSPlugin();
        if (tts) {
          const effectiveRate = Math.max(0.1, voiceSpeed * STORY_RATE_MULTIPLIER);
          try {
            await tts.speak({
              text,
              lang: 'ru-RU',
              rate: effectiveRate,
              pitch: STORY_PITCH,
              volume: 1.0,
              category: 'playback',
            });

            if (stopRequestedRef.current) {
              speakingRef.current = false;
              setIsSpeaking(false);
              return;
            }

            speakingRef.current = false;
            setIsSpeaking(false);
            onEnd?.();
            return;
          } catch (speakErr) {
            console.warn('Capacitor TTS speak failed:', speakErr);
            speakingRef.current = false;
            setIsSpeaking(false);
            return;
          }
        }
      } catch (err) {
        console.warn('Capacitor TTS plugin unavailable:', err);
      }
    }

    // Priority 3: Web Speech API (works in browser)
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      console.warn('No TTS available');
      speakingRef.current = false;
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();

    const sentences = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [text];
    const voices = window.speechSynthesis.getVoices();
    const russianVoices = voices.filter(v => v.lang.startsWith('ru'));
    const bestVoice = russianVoices.find(v =>
      v.name.toLowerCase().includes('neural') || v.name.toLowerCase().includes('premium')
    ) || russianVoices.find(v => v.name.toLowerCase().includes('google')) || russianVoices[0] || undefined;

    const speakSentences = async (sentences: string[], index: number) => {
      if (index >= sentences.length || stopRequestedRef.current) {
        speakingRef.current = false;
        setIsSpeaking(false);
        if (!stopRequestedRef.current) onEnd?.();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(sentences[index].trim());
      utterance.lang = 'ru-RU';
      utterance.rate = voiceSpeed * 0.88;
      utterance.pitch = STORY_PITCH;
      utterance.volume = 1.0;
      if (bestVoice) utterance.voice = bestVoice;

      utterance.onend = () => {
        setTimeout(() => { speakSentences(sentences, index + 1); }, 200);
      };
      utterance.onerror = () => {
        speakingRef.current = false;
        setIsSpeaking(false);
      };

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    };

    speakSentences(sentences, 0);
  }, [voiceSpeed, setIsSpeaking, isNative, playAudio]);

  // ── Stop ────────────────────────────────────────────────────────────

  const stop = useCallback(async () => {
    stopRequestedRef.current = true;
    speakingRef.current = false;

    // Stop pre-recorded audio
    if (audioPlayingRef.current) {
      try {
        const audio = getAudioElement();
        audio.pause();
        audio.currentTime = 0;
      } catch { /* ignore */ }
      audioPlayingRef.current = false;
      currentAudioUrlRef.current = null;
    }

    // Stop Capacitor TTS
    if (isNative) {
      try {
        const tts = await getTTSPlugin();
        if (tts) await tts.stop();
      } catch { /* ignore */ }
    }

    // Stop Web Speech API
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    setIsSpeaking(false);
    setIsPlaying(false);
  }, [setIsSpeaking, setIsPlaying, isNative]);

  // ── Pause / Resume ──────────────────────────────────────────────────

  const pause = useCallback(async () => {
    if (audioPlayingRef.current) {
      try {
        getAudioElement().pause();
      } catch { /* ignore */ }
      return;
    }
    if (isNative) {
      try {
        const tts = await getTTSPlugin();
        if (tts) { stopRequestedRef.current = true; await tts.stop(); }
      } catch { /* ignore */ }
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.pause();
    }
  }, [isNative]);

  const resume = useCallback(() => {
    if (audioPlayingRef.current) {
      try {
        getAudioElement().play();
      } catch { /* ignore */ }
      return;
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.resume();
    }
  }, []);

  // ── Check TTS availability ──────────────────────────────────────────

  const checkTTS = useCallback(async (): Promise<TTSCheckResult> => {
    const native = isNativePlatform();

    if (native) {
      const tts = await getTTSPlugin();
      if (tts) {
        try {
          const langs = await tts.getSupportedLanguages?.();
          const hasRu = Array.isArray(langs) && langs.some((l: string) => l.startsWith('ru'));
          return { available: true, hasRussianVoice: !!hasRu, isNative: true };
        } catch {
          return { available: true, hasRussianVoice: true, isNative: true };
        }
      }
      return { available: false, hasRussianVoice: false, isNative: true };
    }

    if (typeof window !== 'undefined' && window.speechSynthesis) {
      const voices = window.speechSynthesis.getVoices();
      const hasRu = voices.some(v => v.lang.startsWith('ru'));
      return { available: true, hasRussianVoice: hasRu, isNative: false };
    }

    return { available: false, hasRussianVoice: false, isNative: false };
  }, []);

  // ── Open TTS install/settings ───────────────────────────────────────

  const openTTSInstall = useCallback(async () => {
    if (isNativePlatform()) {
      try {
        const tts = await getTTSPlugin();
        if (tts && tts.openInstall) {
          await tts.openInstall();
          return;
        }
      } catch (err) {
        console.warn('Could not open TTS install:', err);
      }
    }
    if (typeof window !== 'undefined') {
      window.open('https://play.google.com/store/apps/details?id=com.google.android.tts', '_blank');
    }
  }, []);

  // ── Cleanup ─────────────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      stopRequestedRef.current = true;
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      if (_audioElement) {
        _audioElement.pause();
        _audioElement = null;
      }
    };
  }, []);

  return {
    speak,
    stop,
    pause,
    resume,
    checkTTS,
    openTTSInstall,
    ttsAvailable,
    isNative,
  };
}
