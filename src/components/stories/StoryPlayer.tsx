'use client';

import { useAppStore, StoryPage } from '@/store/useAppStore';
import { useTTS } from '@/hooks/use-tts';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  ArrowLeft,
  ArrowRight,
  Play,
  Pause,
  Square,
  Volume2,
  VolumeX,
  ChevronLeft,
  RotateCcw,
  AlertCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCallback, useEffect, useState, useRef } from 'react';

const ANIMATION_VARIANTS: Record<string, any> = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  slideRight: {
    initial: { opacity: 0, x: -80 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 80 },
  },
  slideLeft: {
    initial: { opacity: 0, x: 80 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -80 },
  },
  slideUp: {
    initial: { opacity: 0, y: 80 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -80 },
  },
  bounce: {
    initial: { opacity: 0, scale: 0.3 },
    animate: { opacity: 1, scale: 1, transition: { type: 'spring', bounce: 0.5 } },
    exit: { opacity: 0, scale: 0.8 },
  },
  pulse: {
    initial: { opacity: 0, scale: 0.8 },
    animate: { opacity: 1, scale: [1, 1.05, 1] },
    exit: { opacity: 0, scale: 0.9 },
  },
  shake: {
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      x: [0, -10, 10, -5, 5, 0],
    },
    exit: { opacity: 0 },
  },
  rotate: {
    initial: { opacity: 0, rotate: -180, scale: 0.5 },
    animate: { opacity: 1, rotate: 0, scale: 1 },
    exit: { opacity: 0, rotate: 180, scale: 0.5 },
  },
};

// Warm cozy illustration gradients — muted, harmonious
const ILLUSTRATION_GRADIENTS = [
  'from-[#FFF0E0] via-[#FFE4CC] to-[#FFD6B8]',
  'from-[#E8F5E9] via-[#C8E6C9] to-[#DCEDC8]',
  'from-[#EDE7F6] via-[#D1C4E9] to-[#E1BEE7]',
  'from-[#E3F2FD] via-[#BBDEFB] to-[#B3E5FC]',
  'from-[#FFF8E1] via-[#FFECB3] to-[#FFE082]',
  'from-[#FCE4EC] via-[#F8BBD0] to-[#F48FB1]',
];

const PAGE_EMOJIS = ['🌟', '🏡', '🐰', '🐺', '🐻', '🦊', '🎵', '🌲', '🌈', '🎉', '✨', '💫', '🦋', '🌺', '🍄'];

function IllustrationPlaceholder({ index }: { index: number }) {
  const emoji = PAGE_EMOJIS[index % PAGE_EMOJIS.length];
  return (
    <div className={`w-full h-full bg-gradient-to-br ${ILLUSTRATION_GRADIENTS[index % ILLUSTRATION_GRADIENTS.length]} flex items-center justify-center relative overflow-hidden`}>
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-4 left-4 w-12 h-12 rounded-full bg-white/50 animate-pulse" />
        <div className="absolute top-16 right-10 w-8 h-8 rounded-full bg-white/40 animate-pulse" style={{ animationDelay: '0.5s' }} />
        <div className="absolute bottom-10 left-16 w-14 h-14 rounded-full bg-white/30 animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-6 right-6 w-7 h-7 rounded-full bg-white/45 animate-pulse" style={{ animationDelay: '1.5s' }} />
      </div>
      <span className="text-7xl drop-shadow-xl z-10">{emoji}</span>
    </div>
  );
}

export function StoryPlayer() {
  const {
    currentStory,
    currentPage,
    setCurrentPage,
    setCurrentView,
    isPlaying,
    setIsPlaying,
    isSpeaking,
    voiceSpeed,
    setVoiceSpeed,
    fontSize,
    autoPlay,
    setAutoPlay,
  } = useAppStore();

  const { speak, stop, pause, resume, ttsAvailable } = useTTS();
  const [showControls, setShowControls] = useState(true);
  const [direction, setDirection] = useState(1);
  const controlsTimerRef = useRef<NodeJS.Timeout | null>(null);
  const autoPlayTimerRef = useRef<NodeJS.Timeout | null>(null);

  const page = currentStory?.pages?.[currentPage];
  const totalPages = currentStory?.pages?.length || 0;
  const progress = totalPages > 0 ? ((currentPage + 1) / totalPages) * 100 : 0;

  const goToPage = useCallback((pageNum: number) => {
    if (pageNum < 0 || pageNum >= totalPages) return;
    stop();
    setDirection(pageNum > currentPage ? 1 : -1);
    setCurrentPage(pageNum);
  }, [currentPage, totalPages, stop, setCurrentPage]);

  const handleAutoPlayNext = useCallback(() => {
    if (autoPlay && currentPage < totalPages - 1) {
      if (autoPlayTimerRef.current) clearTimeout(autoPlayTimerRef.current);
      autoPlayTimerRef.current = setTimeout(() => {
        goToPage(currentPage + 1);
      }, 1500);
    } else if (autoPlay && currentPage >= totalPages - 1) {
      setIsPlaying(false);
    }
  }, [autoPlay, currentPage, totalPages, goToPage, setIsPlaying]);

  const speakPage = useCallback(() => {
    if (!page) {
      console.warn('speakPage: no page available');
      return;
    }
    setIsPlaying(true);
    speak(page.text, () => {
      handleAutoPlayNext();
    }, page.audioUrl);
  }, [page, speak, setIsPlaying, handleAutoPlayNext]);

  const togglePlay = useCallback(() => {
    if (isSpeaking) {
      // Currently speaking - pause
      pause();
      setIsPlaying(false);
    } else if (isPlaying) {
      // Playing but paused - resume audio
      resume();
      setIsSpeaking(true);
    } else {
      // Not playing - start
      speakPage();
    }
  }, [isSpeaking, isPlaying, pause, resume, speakPage, setIsPlaying]);

  const handleStop = useCallback(() => {
    stop();
  }, [stop]);

  const handleNext = useCallback(() => {
    if (currentPage < totalPages - 1) {
      goToPage(currentPage + 1);
    }
  }, [currentPage, totalPages, goToPage]);

  const handlePrev = useCallback(() => {
    if (currentPage > 0) {
      goToPage(currentPage - 1);
    }
  }, [currentPage, goToPage]);

  const restart = useCallback(() => {
    stop();
    setCurrentPage(0);
  }, [stop, setCurrentPage]);

  const goBack = useCallback(() => {
    stop();
    setCurrentView('library');
  }, [stop, setCurrentView]);

  // Auto-play current page on page change when autoplay is on
  useEffect(() => {
    if (autoPlay && page && !isSpeaking && !isPlaying) {
      const timer = setTimeout(() => {
        speakPage();
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [currentPage, autoPlay]); // eslint-disable-line react-hooks/exhaustive-deps

  // Show/hide controls on tap
  const handleScreenTap = useCallback(() => {
    setShowControls(prev => !prev);
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    controlsTimerRef.current = setTimeout(() => setShowControls(true), 5000);
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (autoPlayTimerRef.current) clearTimeout(autoPlayTimerRef.current);
      if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    };
  }, []);

  if (!currentStory || !page) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FFF9F2] via-[#FFF0E0] to-[#FFE8D6]">
        <p className="text-warm-brown-light">Сказка не найдена</p>
      </div>
    );
  }

  const animType = page.animationType || 'fadeIn';
  const animVariant = ANIMATION_VARIANTS[animType] || ANIMATION_VARIANTS.fadeIn;
  const fontSizeClass = fontSize === 'large' ? 'text-xl' : fontSize === 'medium' ? 'text-base' : 'text-sm';

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] via-[#FFF0E0] to-[#FFE8D6] flex flex-col" onClick={handleScreenTap}>
      {/* TTS Unavailable Warning */}
      {!ttsAvailable && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <p className="text-xs text-amber-700">Озвучка недоступна на этом устройстве. Установите синтезатор речи Google.</p>
        </div>
      )}

      {/* Top bar */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-[#E8DDD4]/60 px-4 py-3"
          >
            <div className="flex items-center justify-between max-w-2xl mx-auto">
              <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); goBack(); }} className="text-[#8B6B58]">
                <ChevronLeft className="w-5 h-5 mr-1" />
                <span className="text-sm">Библиотека</span>
              </Button>
              <div className="text-center">
                <h2 className="font-bold text-[#5C3D2E] text-sm">{currentStory.title}</h2>
                <p className="text-xs text-[#8B6B58]">{currentPage + 1} из {totalPages}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); restart(); }} className="text-[#8B6B58]">
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>
            <div className="mt-2 max-w-2xl mx-auto">
              <Progress value={progress} className="h-1.5 bg-[#E8DDD4] [&>[data-slot=indicator]]:bg-gradient-to-r [&>[data-slot=indicator]]:from-[#C4636A] [&>[data-slot=indicator]]:to-[#C9952C]" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full px-4 py-4">
        {/* Illustration */}
        <div className="flex-1 min-h-0 mb-4">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentPage}
              custom={direction}
              initial={animVariant.initial}
              animate={animVariant.animate}
              exit={animVariant.exit}
              transition={{ duration: page.animationDuration || 1.0 }}
              className="w-full h-full min-h-[200px] max-h-[400px] rounded-2xl overflow-hidden shadow-xl shadow-[#C4636A]/8"
            >
              {page.illustrationUrl ? (
                <img
                  src={page.illustrationUrl}
                  alt={`Страница ${currentPage + 1}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <IllustrationPlaceholder index={currentPage} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Text */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`text-${currentPage}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-md shadow-[#5C3D2E]/5 p-5 mb-4 border border-[#E8DDD4]/40"
          >
            <p className={`${fontSizeClass} leading-relaxed text-[#5C3D2E] whitespace-pre-line`}>
              {page.text}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Page dots */}
        <div className="flex justify-center gap-1.5 mb-3">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={(e) => { e.stopPropagation(); goToPage(i); }}
              className={`w-2 h-2 rounded-full transition-all ${
                i === currentPage ? 'w-6 bg-[#C4636A]' : 'bg-[#D4C4B0] hover:bg-[#BFA68E]'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Bottom controls */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="sticky bottom-0 z-20 bg-white/80 backdrop-blur-xl border-t border-[#E8DDD4]/60 px-4 py-3"
          >
            <div className="flex items-center justify-between max-w-2xl mx-auto">
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                disabled={currentPage === 0}
                className="text-[#8B6B58] disabled:opacity-30"
              >
                <ArrowLeft className="w-6 h-6" />
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => { e.stopPropagation(); handleStop(); }}
                  className="text-[#8B6B58]"
                >
                  <Square className="w-5 h-5" />
                </Button>

                <Button
                  size="icon"
                  onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                  className="w-14 h-14 rounded-full bg-gradient-to-br from-[#C4636A] to-[#D47A80] text-white shadow-xl shadow-[#C4636A]/25 hover:shadow-2xl hover:scale-105 transition-all"
                >
                  {isSpeaking ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => { e.stopPropagation(); setAutoPlay(!autoPlay); }}
                  className={`text-[#8B6B58] ${autoPlay ? 'bg-[#C4636A]/10' : ''}`}
                >
                  {autoPlay ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                </Button>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => { e.stopPropagation(); handleNext(); }}
                disabled={currentPage >= totalPages - 1}
                className="text-[#8B6B58] disabled:opacity-30"
              >
                <ArrowRight className="w-6 h-6" />
              </Button>
            </div>

            {/* Speed control */}
            <div className="flex items-center justify-center gap-2 mt-2 max-w-2xl mx-auto">
              <span className="text-xs text-[#8B6B58]">Скорость:</span>
              {[0.5, 0.75, 1.0, 1.25, 1.5].map(speed => (
                <button
                  key={speed}
                  onClick={(e) => { e.stopPropagation(); setVoiceSpeed(speed); }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                    voiceSpeed === speed
                      ? 'bg-[#C4636A] text-white shadow-sm'
                      : 'bg-[#FFF5EB] text-[#8B6B58] hover:bg-[#FFE8D6]'
                  }`}
                >
                  {speed}x
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
