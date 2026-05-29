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
// Robust singleton audio element with proper state management

let _audioElement: HTMLAudioElement | null = null;

function getAudioElement(): HTMLAudioElement {
  if (!_audioElement) {
    _audioElement = new Audio();
    _audioElement.preload = 'auto';
  }
  return _audioElement;
}

/** Fully reset the audio element to a clean state */
function resetAudioElement(): HTMLAudioElement {
  const audio = getAudioElement();
  try {
    audio.pause();
    audio.removeAttribute('src');
    audio.currentTime = 0;
    audio.onended = null;
    audio.onerror = null;
    audio.onloadeddata = null;
    audio.oncanplay = null;
    // Force release of any pending resources
    audio.load();
  } catch { /* ignore */ }
  return audio;
}

// ── Warm Storytelling Parameters for native TTS fallback ────────────────────

const STORY_RATE_MULTIPLIER = 0.85;
const STORY_PITCH = 0.95;
const AUDIO_LOAD_TIMEOUT_MS = 10000; // 10s timeout for audio loading

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
  const audioTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
        // Clear any existing timeout
        if (audioTimeoutRef.current) {
          clearTimeout(audioTimeoutRef.current);
          audioTimeoutRef.current = null;
        }

        // Reset the audio element to a clean state before loading new source
        const audio = resetAudioElement();

        // If same audio is already loaded and playing, don't restart
        if (audioPlayingRef.current && currentAudioUrlRef.current === audioUrl) {
          resolve(true);
          return;
        }

        audioPlayingRef.current = true;
        speakingRef.current = true;
        stopRequestedRef.current = false;
        currentAudioUrlRef.current = audioUrl;
        setIsSpeaking(true);

        const cleanup = () => {
          if (audioTimeoutRef.current) {
            clearTimeout(audioTimeoutRef.current);
            audioTimeoutRef.current = null;
          }
          audioPlayingRef.current = false;
          speakingRef.current = false;
          currentAudioUrlRef.current = null;
          setIsSpeaking(false);
          audio.onended = null;
          audio.onerror = null;
          audio.onloadeddata = null;
          audio.oncanplay = null;
        };

        const handleSuccess = () => {
          cleanup();
          if (!stopRequestedRef.current) {
            onEnd?.();
          }
          resolve(true);
        };

        const handleFailure = (reason: string) => {
          console.warn(`Audio playback failed (${reason}):`, audioUrl);
          cleanup();
          resolve(false);
        };

        // Set up event handlers BEFORE setting src
        audio.onended = () => handleSuccess();
        audio.onerror = () => handleFailure('onerror');

        // Set loading timeout - if audio doesn't start playing within timeout, fail
        audioTimeoutRef.current = setTimeout(() => {
          if (audioPlayingRef.current && !audio.paused && audio.readyState < 2) {
            handleFailure('load_timeout');
          }
        }, AUDIO_LOAD_TIMEOUT_MS);

        // Set source and load
        audio.src = audioUrl;
        audio.playbackRate = Math.max(0.5, Math.min(2.0, voiceSpeed));
        audio.volume = 1.0;

        // Use canplay event for more reliable playback start
        const startPlay = () => {
          audio.play().then(() => {
            // Audio started playing successfully
            // Clear the load timeout since we're playing now
            if (audioTimeoutRef.current) {
              clearTimeout(audioTimeoutRef.current);
              audioTimeoutRef.current = null;
            }
          }).catch((err) => {
            handleFailure(`play_rejected: ${err?.message || 'unknown'}`);
          });
        };

        // Wait for audio to be ready before playing
        if (audio.readyState >= 3) {
          // Already loaded (cached)
          startPlay();
        } else {
          audio.oncanplay = () => {
            audio.oncanplay = null;
            startPlay();
          };
          // Also handle load error
          audio.load();
        }
      } catch (err) {
        console.warn('Audio playback exception:', err);
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

    // Clear timeout
    if (audioTimeoutRef.current) {
      clearTimeout(audioTimeoutRef.current);
      audioTimeoutRef.current = null;
    }

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
        const audio = getAudioElement();
        audio.pause();
        // Keep audioPlayingRef as true so we know audio is loaded
        // Just mark that we're paused, not speaking
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
        const audio = getAudioElement();
        if (audio.src && audio.paused) {
          audio.play().catch(() => { /* ignore */ });
        }
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
      if (audioTimeoutRef.current) {
        clearTimeout(audioTimeoutRef.current);
      }
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      if (_audioElement) {
        _audioElement.pause();
        _audioElement.removeAttribute('src');
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
