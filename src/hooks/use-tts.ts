'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useAppStore } from '@/store/useAppStore';

// ── Native Platform Detection ────────────────────────────────────────────────

function isNativePlatform(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    // Capacitor 8: check the global Capacitor object
    const cap = (window as any).Capacitor;
    if (cap && typeof cap.isNativePlatform === 'function') {
      return cap.isNativePlatform();
    }
    // Fallback: check if running in Android WebView
    if (cap && cap.platform === 'android') return true;
    if (cap && cap.isNative === true) return true;
    return false;
  } catch {
    return false;
  }
}

// ── Capacitor TTS Plugin Loader ─────────────────────────────────────────────

let _ttsPlugin: any = undefined; // undefined = not loaded, null = unavailable, object = loaded

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

// ── Warm Storytelling Parameters ────────────────────────────────────────────

// Slower rate and slightly lower pitch for warm, atmospheric storytelling
const STORY_RATE_MULTIPLIER = 0.82;
const STORY_PITCH = 0.92;

// ── TTS Hook ────────────────────────────────────────────────────────────────

export function useTTS() {
  const { voiceSpeed, setIsSpeaking, setIsPlaying } = useAppStore();
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const [isNative, setIsNative] = useState(false);
  const [ttsAvailable, setTtsAvailable] = useState(true);
  const speakingRef = useRef(false);
  const stopRequestedRef = useRef(false);

  useEffect(() => {
    const native = isNativePlatform();
    setIsNative(native);
    if (native) {
      // Pre-load the TTS plugin
      getTTSPlugin().then(plugin => {
        setTtsAvailable(!!plugin);
        if (plugin) {
          // Warm up the TTS engine with a silent speak
          plugin.speak({ text: ' ', lang: 'ru-RU', rate: 1.0, pitch: 1.0, volume: 0 }).catch(() => {});
        }
      });
    } else {
      // Check Web Speech API availability
      if (typeof window !== 'undefined') {
        const hasWebSpeech = !!window.speechSynthesis;
        setTtsAvailable(hasWebSpeech);
        if (hasWebSpeech) {
          // Pre-load voices (they load asynchronously in some browsers)
          window.speechSynthesis.getVoices();
          window.speechSynthesis.onvoiceschanged = () => {
            window.speechSynthesis.getVoices();
          };
        }
      }
    }
  }, []);

  const speak = useCallback(async (text: string, onEnd?: () => void) => {
    stopRequestedRef.current = false;
    speakingRef.current = true;
    setIsSpeaking(true);

    // Try Capacitor native TTS first (works in APK)
    if (isNative) {
      try {
        const tts = await getTTSPlugin();
        if (tts) {
          const effectiveRate = Math.max(0.1, voiceSpeed * STORY_RATE_MULTIPLIER);
          try {
            // Capacitor TTS v8: speak() resolves when speech finishes
            await tts.speak({
              text,
              lang: 'ru-RU',
              rate: effectiveRate,
              pitch: STORY_PITCH,
              volume: 1.0,
              category: 'playback',
            });

            // If stop was requested during speech, don't call onEnd
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
            // Don't fall through to Web Speech API in native mode - it won't work
            speakingRef.current = false;
            setIsSpeaking(false);
            return;
          }
        }
      } catch (err) {
        console.warn('Capacitor TTS plugin unavailable:', err);
      }
    }

    // Fallback: Web Speech API (works in browser)
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      console.warn('No TTS available');
      speakingRef.current = false;
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();

    // Split text into sentences for more natural pausing
    const sentences = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [text];

    // Find the best Russian voice
    const voices = window.speechSynthesis.getVoices();
    const russianVoices = voices.filter(v => v.lang.startsWith('ru'));

    // Prefer neural/high-quality voices
    const bestVoice = russianVoices.find(v =>
      v.name.toLowerCase().includes('neural') ||
      v.name.toLowerCase().includes('premium') ||
      v.name.toLowerCase().includes('enhanced')
    ) || russianVoices.find(v =>
      v.name.toLowerCase().includes('google')
    ) || russianVoices[0] || undefined;

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
        // Small pause between sentences for natural feel
        setTimeout(() => {
          speakSentences(sentences, index + 1);
        }, 180);
      };

      utterance.onerror = (e) => {
        console.warn('Speech error:', e);
        speakingRef.current = false;
        setIsSpeaking(false);
      };

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    };

    speakSentences(sentences, 0);
  }, [voiceSpeed, setIsSpeaking, isNative]);

  const stop = useCallback(async () => {
    stopRequestedRef.current = true;
    speakingRef.current = false;

    // Stop Capacitor native TTS
    if (isNative) {
      try {
        const tts = await getTTSPlugin();
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
        const tts = await getTTSPlugin();
        if (tts) {
          // Capacitor TTS v8 doesn't have pause, so we stop
          stopRequestedRef.current = true;
          await tts.stop();
          speakingRef.current = false;
          setIsSpeaking(false);
        }
      } catch {
        // ignore
      }
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.pause();
    }
  }, [isNative, setIsSpeaking]);

  const resume = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.resume();
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRequestedRef.current = true;
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return {
    speak,
    stop,
    pause,
    resume,
    ttsAvailable,
    isNative,
  };
}
