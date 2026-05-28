'use client';

import { useAppStore } from '@/store/useAppStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ChevronLeft, BookOpen, Type, Volume2, Play, Palette } from 'lucide-react';

export function StorySettings() {
  const {
    setCurrentView,
    fontSize,
    setFontSize,
    autoPlay,
    setAutoPlay,
    voiceSpeed,
    setVoiceSpeed,
  } = useAppStore();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] via-[#FFF0E0] to-[#FFE8D6]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-[#E8DDD4]/50 px-4 py-3">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <Button variant="ghost" size="sm" onClick={() => setCurrentView('library')} className="text-[#8B6B58]">
            <ChevronLeft className="w-5 h-5 mr-1" />
            Назад
          </Button>
          <h2 className="font-bold text-[#5C3D2E]">Настройки</h2>
          <div className="w-16" />
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Reading settings */}
        <Card className="border-0 shadow-md shadow-[#5C3D2E]/5">
          <CardContent className="p-5 space-y-5">
            <h3 className="font-bold text-[#5C3D2E] text-lg flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Чтение
            </h3>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Type className="w-5 h-5 text-[#C9952C]" />
                <div>
                  <Label className="text-[#5C3D2E]">Размер текста</Label>
                  <p className="text-xs text-[#8B6B58]">Размер шрифта при чтении</p>
                </div>
              </div>
              <Select value={fontSize} onValueChange={(v: any) => setFontSize(v)}>
                <SelectTrigger className="w-28 border-[#E8DDD4]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Маленький</SelectItem>
                  <SelectItem value="medium">Средний</SelectItem>
                  <SelectItem value="large">Большой</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Play className="w-5 h-5 text-[#C9952C]" />
                <div>
                  <Label className="text-[#5C3D2E]">Автовоспроизведение</Label>
                  <p className="text-xs text-[#8B6B58]">Автоматически переходить к следующей странице</p>
                </div>
              </div>
              <Switch
                checked={autoPlay}
                onCheckedChange={setAutoPlay}
              />
            </div>
          </CardContent>
        </Card>

        {/* Voice settings */}
        <Card className="border-0 shadow-md shadow-[#5C3D2E]/5">
          <CardContent className="p-5 space-y-5">
            <h3 className="font-bold text-[#5C3D2E] text-lg flex items-center gap-2">
              <Volume2 className="w-5 h-5" />
              Озвучка
            </h3>

            <div>
              <Label className="text-[#5C3D2E]">Скорость чтения</Label>
              <p className="text-xs text-[#8B6B58] mb-2">Медленнее — более душевно, быстрее — динамичнее</p>
              <div className="flex gap-2 mt-2">
                {[0.5, 0.75, 1.0, 1.25, 1.5].map(speed => (
                  <button
                    key={speed}
                    onClick={() => setVoiceSpeed(speed)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      voiceSpeed === speed
                        ? 'bg-gradient-to-r from-[#C4636A] to-[#C9952C] text-white shadow-md shadow-[#C4636A]/15'
                        : 'bg-white text-[#8B6B58] border border-[#E8DDD4] hover:bg-[#FFF5EB]'
                    }`}
                  >
                    {speed}x
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* About */}
        <Card className="border-0 shadow-md shadow-[#5C3D2E]/5">
          <CardContent className="p-5">
            <h3 className="font-bold text-[#5C3D2E] text-lg flex items-center gap-2 mb-3">
              <Palette className="w-5 h-5" />
              О приложении
            </h3>
            <p className="text-sm text-[#8B6B58] leading-relaxed">
              «Маленькие Истории» — приложение для детей с коллекцией сказок, анимациями и озвучкой на русском языке.
              Создавайте свои сказки с иллюстрациями, генерируемыми искусственным интеллектом!
            </p>
            <div className="mt-3 flex gap-2">
              <span className="text-xs bg-[#FFE8D6] text-[#A0522D] px-2 py-1 rounded">v1.2.0</span>
              <span className="text-xs bg-[#C8E6C9] text-[#2E7D32] px-2 py-1 rounded">PWA</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
