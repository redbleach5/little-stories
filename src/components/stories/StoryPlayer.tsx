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

const ILLUSTRATION_GRADIENTS = [
  'from-amber-200 via-rose-100 to-sky-200',
  'from-emerald-200 via-teal-100 to-amber-200',
  'from-sky-200 via-violet-100 to-rose-200',
  'from-rose-200 via-amber-100 to-emerald-200',
  'from-violet-200 via-pink-100 to-sky-200',
  'from-teal-200 via-emerald-100 to-amber-200',
];

const PAGE_EMOJIS = ['🌟', '🏡', '🐰', '🐺', '🐻', '🦊', '🎵', '🌲', '🌈', '🎉', '✨', '💫', '🦋', '🌺', '🍄'];

function IllustrationPlaceholder({ index }: { index: number }) {
  const emoji = PAGE_EMOJIS[index % PAGE_EMOJIS.length];
  return (
    <div className={`w-full h-full bg-gradient-to-br ${ILLUSTRATION_GRADIENTS[index % ILLUSTRATION_GRADIENTS.length]} flex items-center justify-center relative overflow-hidden`}>
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-4 left-4 w-8 h-8 rounded-full bg-white/40 animate-pulse" />
        <div className="absolute top-12 right-8 w-6 h-6 rounded-full bg-white/30 animate-pulse" style={{ animationDelay: '0.5s' }} />
        <div className="absolute bottom-8 left-12 w-10 h-10 rounded-full bg-white/20 animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-4 right-4 w-5 h-5 rounded-full bg-white/35 animate-pulse" style={{ animationDelay: '1.5s' }} />
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
    voiceSpeed,
    setVoiceSpeed,
    fontSize,
    autoPlay,
    setAutoPlay,
  } = useAppStore();

  const { speak, stop, pause, resume, isSpeaking } = useTTS();
  const [showControls, setShowControls] = useState(true);
  const [direction, setDirection] = useState(1);
  const controlsTimerRef = useRef<NodeJS.Timeout | null>(null);
  const autoPlayTimerRef = useRef<NodeJS.Timeout | null>(null);

  const page = currentStory?.pages?.[currentPage];
  const totalPages = currentStory?.pages?.length || 0;
  const progress = totalPages > 0 ? ((currentPage + 1) / totalPages) * 100 : 0;

  // textRevealed is controlled purely by AnimatePresence – always true

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
    if (!page) return;
    setIsPlaying(true);
    speak(page.text, () => {
      handleAutoPlayNext();
    });
  }, [page, speak, setIsPlaying, handleAutoPlayNext]);

  const togglePlay = useCallback(() => {
    if (isSpeaking) {
      pause();
      setIsPlaying(false);
    } else if (isPlaying) {
      resume();
    } else {
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

  // Auto-play current page on load
  useEffect(() => {
    if (autoPlay && page && !isSpeaking) {
      const timer = setTimeout(() => {
        speakPage();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [currentPage, autoPlay]);

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 to-amber-50">
        <p className="text-rose-400">Сказка не найдена</p>
      </div>
    );
  }

  const animType = page.animationType || 'fadeIn';
  const animVariant = ANIMATION_VARIANTS[animType] || ANIMATION_VARIANTS.fadeIn;
  const fontSizeClass = fontSize === 'large' ? 'text-xl' : fontSize === 'medium' ? 'text-base' : 'text-sm';

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-rose-50 to-sky-50 flex flex-col" onClick={handleScreenTap}>
      {/* Top bar */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-rose-100 px-4 py-3"
          >
            <div className="flex items-center justify-between max-w-2xl mx-auto">
              <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); goBack(); }} className="text-rose-700">
                <ChevronLeft className="w-5 h-5 mr-1" />
                Библиотека
              </Button>
              <div className="text-center">
                <h2 className="font-bold text-rose-900 text-sm">{currentStory.title}</h2>
                <p className="text-xs text-rose-400">{currentPage + 1} из {totalPages}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); restart(); }} className="text-rose-700">
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>
            <div className="mt-2 max-w-2xl mx-auto">
              <Progress value={progress} className="h-1.5 bg-rose-100 [&>[data-slot=indicator]]:bg-gradient-to-r [&>[data-slot=indicator]]:from-rose-400 [&>[data-slot=indicator]]:to-amber-400" />
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
              className="w-full h-full min-h-[200px] max-h-[400px] rounded-2xl overflow-hidden shadow-xl"
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
            className="bg-white/90 backdrop-blur rounded-2xl shadow-lg p-5 mb-4"
          >
            <p className={`${fontSizeClass} leading-relaxed text-gray-800 whitespace-pre-line`}>
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
                i === currentPage ? 'w-6 bg-rose-500' : 'bg-rose-200 hover:bg-rose-300'
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
            className="sticky bottom-0 z-20 bg-white/90 backdrop-blur-md border-t border-rose-100 px-4 py-3"
          >
            <div className="flex items-center justify-between max-w-2xl mx-auto">
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                disabled={currentPage === 0}
                className="text-rose-700 disabled:opacity-30"
              >
                <ArrowLeft className="w-6 h-6" />
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => { e.stopPropagation(); handleStop(); }}
                  className="text-rose-700"
                >
                  <Square className="w-5 h-5" />
                </Button>

                <Button
                  size="icon"
                  onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                  className="w-14 h-14 rounded-full bg-gradient-to-r from-rose-500 to-amber-500 text-white shadow-xl hover:shadow-2xl hover:scale-105 transition-all"
                >
                  {isSpeaking ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => { e.stopPropagation(); setAutoPlay(!autoPlay); }}
                  className={`text-rose-700 ${autoPlay ? 'bg-rose-100' : ''}`}
                >
                  {autoPlay ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                </Button>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => { e.stopPropagation(); handleNext(); }}
                disabled={currentPage >= totalPages - 1}
                className="text-rose-700 disabled:opacity-30"
              >
                <ArrowRight className="w-6 h-6" />
              </Button>
            </div>

            {/* Speed control */}
            <div className="flex items-center justify-center gap-2 mt-2 max-w-2xl mx-auto">
              <span className="text-xs text-rose-400">Скорость:</span>
              {[0.5, 0.75, 1.0, 1.25, 1.5].map(speed => (
                <button
                  key={speed}
                  onClick={(e) => { e.stopPropagation(); setVoiceSpeed(speed); }}
                  className={`px-2 py-0.5 rounded text-xs transition-all ${
                    voiceSpeed === speed
                      ? 'bg-rose-500 text-white'
                      : 'bg-rose-50 text-rose-600 hover:bg-rose-100'
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
