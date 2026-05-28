'use client';

import { useAppStore } from '@/store/useAppStore';
import { useTTS, TTSCheckResult } from '@/hooks/use-tts';
import { Button } from '@/components/ui/button';
import { Volume2, VolumeX, BookOpen, Check, ChevronRight, Download } from 'lucide-react';
import { useState, useEffect } from 'react';

const ONBOARDING_KEY = 'little-stories-onboarding-done';

export function OnboardingScreen() {
  const { setCurrentView } = useAppStore();
  const { checkTTS, openTTSInstall } = useTTS();
  const [ttsCheck, setTtsCheck] = useState<TTSCheckResult | null>(null);
  const [step, setStep] = useState(0); // 0=checking, 1=welcome, 2=tts-setup, 3=done

  useEffect(() => {
    // Check if onboarding was already completed
    if (typeof window !== 'undefined') {
      const done = localStorage.getItem(ONBOARDING_KEY);
      if (done) {
        setCurrentView('library');
        return;
      }
    }

    // Check TTS availability
    checkTTS().then(result => {
      setTtsCheck(result);
      if (result.available && result.hasRussianVoice) {
        // TTS is fully available — skip setup, go to welcome
        setStep(1);
      } else if (result.available) {
        // TTS available but no Russian voice
        setStep(2);
      } else {
        // TTS not available
        setStep(2);
      }
    });
  }, []);

  const handleContinue = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(ONBOARDING_KEY, '1');
    }
    setCurrentView('library');
  };

  const handleInstallTTS = async () => {
    await openTTSInstall();
  };

  const handleSkipTTS = () => {
    setStep(1);
  };

  // Loading state
  if (step === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] via-[#FFF0E0] to-[#FFE8D6] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-[#C4636A] to-[#D47A80] rounded-2xl flex items-center justify-center shadow-lg shadow-[#C4636A]/20 mx-auto mb-4 animate-pulse">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <p className="text-[#8B6B58]">Подготовка...</p>
        </div>
      </div>
    );
  }

  // Welcome step
  if (step === 1) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] via-[#FFF0E0] to-[#FFE8D6] flex items-center justify-center px-6">
        <div className="max-w-sm w-full text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-[#C4636A] to-[#C9952C] rounded-3xl flex items-center justify-center shadow-xl shadow-[#C4636A]/20 mx-auto mb-6">
            <BookOpen className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[#5C3D2E] mb-2">Маленькие Истории</h1>
          <p className="text-[#8B6B58] mb-2">Сказки с анимацией и озвучкой</p>
          
          {ttsCheck && ttsCheck.available && ttsCheck.hasRussianVoice && (
            <div className="bg-[#C8E6C9]/60 border border-[#A5D6A7]/50 rounded-xl px-4 py-2.5 mb-4 flex items-center justify-center gap-2">
              <Check className="w-4 h-4 text-[#2E7D32]" />
              <span className="text-sm text-[#2E7D32] font-medium">Озвучка готова к работе</span>
            </div>
          )}
          
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-md shadow-[#5C3D2E]/5 p-5 mb-6 text-left space-y-3">
            <div className="flex items-start gap-3">
              <span className="text-2xl">📖</span>
              <div>
                <p className="font-medium text-[#5C3D2E] text-sm">5 сказок в сборке</p>
                <p className="text-xs text-[#8B6B58]">Колобок, Теремок, Репка, Курочка Ряба, Маша и Медведь</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">🎨</span>
              <div>
                <p className="font-medium text-[#5C3D2E] text-sm">Анимации и иллюстрации</p>
                <p className="text-xs text-[#8B6B58]">Красивые переходы между страницами</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">🔊</span>
              <div>
                <p className="font-medium text-[#5C3D2E] text-sm">Озвучка на русском</p>
                <p className="text-xs text-[#8B6B58]">Предзаписанное аудио для всех сказок + синтезатор речи</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">✨</span>
              <div>
                <p className="font-medium text-[#5C3D2E] text-sm">Создайте свою сказку</p>
                <p className="text-xs text-[#8B6B58]">Добавляйте свои истории с AI-иллюстрациями</p>
              </div>
            </div>
          </div>

          <Button
            onClick={handleContinue}
            className="w-full h-12 bg-gradient-to-r from-[#C4636A] to-[#C9952C] text-white text-lg font-bold shadow-xl shadow-[#C4636A]/15 hover:shadow-2xl rounded-2xl"
          >
            Начать чтение
            <ChevronRight className="w-5 h-5 ml-1" />
          </Button>
        </div>
      </div>
    );
  }

  // TTS Setup step
  if (step === 2) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] via-[#FFF0E0] to-[#FFE8D6] flex items-center justify-center px-6">
        <div className="max-w-sm w-full text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-[#C9952C] to-[#C4636A] rounded-3xl flex items-center justify-center shadow-xl shadow-[#C9952C]/20 mx-auto mb-6">
            <Volume2 className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-xl font-bold text-[#5C3D2E] mb-2">Озвучка сказок</h1>
          <p className="text-[#8B6B58] mb-6 text-sm">
            Для озвучки новых сказок нужен синтезатор речи Google. 
            Все 5 встроенных сказок уже озвучены и работают без установки.
          </p>

          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-md shadow-[#5C3D2E]/5 p-5 mb-6 text-left space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-[#C8E6C9]/60 rounded-lg flex items-center justify-center shrink-0">
                <Check className="w-4 h-4 text-[#2E7D32]" />
              </div>
              <div>
                <p className="font-medium text-[#5C3D2E] text-sm">Встроенные сказки</p>
                <p className="text-xs text-[#8B6B58]">Озвучка уже в приложении — работает сразу</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-[#FFE8D6]/60 rounded-lg flex items-center justify-center shrink-0">
                <Download className="w-4 h-4 text-[#A0522D]" />
              </div>
              <div>
                <p className="font-medium text-[#5C3D2E] text-sm">Новые сказки</p>
                <p className="text-xs text-[#8B6B58]">Нужен Google Синтез речи для озвучки текста</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              onClick={handleInstallTTS}
              className="w-full h-12 bg-gradient-to-r from-[#C4636A] to-[#C9952C] text-white font-bold shadow-xl shadow-[#C4636A]/15 rounded-2xl"
            >
              <Download className="w-5 h-5 mr-2" />
              Установить Google Синтез речи
            </Button>
            <Button
              onClick={handleSkipTTS}
              variant="ghost"
              className="w-full text-[#8B6B58] hover:bg-[#FFF5EB] rounded-2xl"
            >
              Продолжить без озвучки новых сказок
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
