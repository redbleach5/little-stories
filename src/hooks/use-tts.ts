'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useAppStore } from '@/store/useAppStore';

// Detect if running in Capacitor native environment
function isCapacitorNative(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(window as any).Capacitor?.isNativePlatform?.();
}

// Capacitor TTS plugin (loaded dynamically to avoid errors in browser)
let capacitorTTS: any = null;
async function getCapacitorTTS() {
  if (capacitorTTS) return capacitorTTS;
  try {
    const mod = await import('@capacitor-community/text-to-speech');
    capacitorTTS = mod.TextToSpeech;
    return capacitorTTS;
  } catch {
    return null;
  }
}

export function useTTS() {
  const { voiceSpeed, setIsSpeaking, setIsPlaying } = useAppStore();
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const [isNative, setIsNative] = useState(false);

  useEffect(() => {
    setIsNative(isCapacitorNative());
  }, []);

  const speak = useCallback(async (text: string, onEnd?: () => void) => {
    // Try Capacitor native TTS first (works in APK)
    if (isNative) {
      try {
        const tts = await getCapacitorTTS();
        if (tts) {
          await tts.speak({
            text,
            lang: 'ru-RU',
            rate: voiceSpeed,
            pitch: 1.1,
          });
          setIsSpeaking(true);
          // Capacitor TTS doesn't have onEnd callback easily,
          // so estimate duration: ~150 words per minute at rate 1.0
          const wordCount = text.split(/\s+/).length;
          const durationMs = (wordCount / (150 * voiceSpeed)) * 60 * 1000;
          setTimeout(() => {
            setIsSpeaking(false);
            onEnd?.();
          }, durationMs);
          return;
        }
      } catch (err) {
        console.warn('Capacitor TTS failed, falling back to Web Speech API:', err);
      }
    }

    // Fallback: Web Speech API (works in browser)
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      console.warn('No TTS available');
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ru-RU';
    utterance.rate = voiceSpeed;
    utterance.pitch = 1.1;

    // Try to find a Russian voice
    const voices = window.speechSynthesis.getVoices();
    const russianVoice = voices.find(v => v.lang.startsWith('ru'));
    if (russianVoice) {
      utterance.voice = russianVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      onEnd?.();
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [voiceSpeed, setIsSpeaking, isNative]);

  const stop = useCallback(async () => {
    // Stop Capacitor native TTS
    if (isNative) {
      try {
        const tts = await getCapacitorTTS();
        if (tts) {
          await tts.stop();
        }
      } catch {
        // ignore
      }
    }

    // Stop Web Speech API
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    setIsSpeaking(false);
    setIsPlaying(false);
  }, [setIsSpeaking, setIsPlaying, isNative]);

  const pause = useCallback(async () => {
    if (isNative) {
      try {
        const tts = await getCapacitorTTS();
        if (tts) {
          // Capacitor TTS doesn't have pause, so we stop
          await tts.stop();
        }
      } catch {
        // ignore
      }
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.pause();
    }
  }, [isNative]);

  const resume = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.resume();
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return { speak, stop, pause, resume, isSpeaking: useAppStore.getState().isSpeaking };
}
