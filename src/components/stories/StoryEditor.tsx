'use client';

import { useAppStore } from '@/store/useAppStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ChevronLeft,
  Plus,
  Trash2,
  GripVertical,
  Sparkles,
  Loader2,
  Image as ImageIcon,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useCallback } from 'react';
import { saveStory as saveLocalStory } from '@/lib/client-storage';

interface PageFormData {
  text: string;
  illustrationPrompt: string;
  illustrationUrl: string;
  animationType: string;
  animationDuration: number;
}

interface StoryFormData {
  title: string;
  description: string;
  category: string;
  ageRange: string;
  author: string;
  pages: PageFormData[];
}

const ANIMATION_TYPES = [
  { value: 'fadeIn', label: 'Появление' },
  { value: 'slideRight', label: 'Слайд вправо' },
  { value: 'slideLeft', label: 'Слайд влево' },
  { value: 'slideUp', label: 'Слайд вверх' },
  { value: 'bounce', label: 'Прыжок' },
  { value: 'pulse', label: 'Пульсация' },
  { value: 'shake', label: 'Тряска' },
  { value: 'rotate', label: 'Вращение' },
];

const CATEGORIES = ['Русские народные', 'Авторские', 'Сказки народов мира', 'Обучающие'];
const AGE_RANGES = ['2-4', '3-6', '4-7', '5-8', '6-10'];

export function StoryEditor() {
  const { setCurrentView, stories, setStories } = useAppStore();
  const [saving, setSaving] = useState(false);
  const [generatingImage, setGeneratingImage] = useState<number | null>(null);
  const [generatingCover, setGeneratingCover] = useState(false);

  const [formData, setFormData] = useState<StoryFormData>({
    title: '',
    description: '',
    category: 'Русские народные',
    ageRange: '3-6',
    author: '',
    pages: [
      {
        text: '',
        illustrationPrompt: '',
        illustrationUrl: '',
        animationType: 'fadeIn',
        animationDuration: 1.5,
      },
    ],
  });

  const updateField = (field: keyof StoryFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updatePage = (index: number, field: keyof PageFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      pages: prev.pages.map((p, i) => i === index ? { ...p, [field]: value } : p),
    }));
  };

  const addPage = () => {
    setFormData(prev => ({
      ...prev,
      pages: [...prev.pages, {
        text: '',
        illustrationPrompt: '',
        illustrationUrl: '',
        animationType: 'fadeIn',
        animationDuration: 1.5,
      }],
    }));
  };

  const removePage = (index: number) => {
    if (formData.pages.length <= 1) return;
    setFormData(prev => ({
      ...prev,
      pages: prev.pages.filter((_, i) => i !== index),
    }));
  };

  const movePage = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= formData.pages.length) return;
    setFormData(prev => {
      const newPages = [...prev.pages];
      [newPages[index], newPages[newIndex]] = [newPages[newIndex], newPages[index]];
      return { ...prev, pages: newPages };
    });
  };

  const generateIllustration = async (pageIndex: number) => {
    const prompt = formData.pages[pageIndex].illustrationPrompt;
    if (!prompt) return;

    setGeneratingImage(pageIndex);
    try {
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      if (data.imageUrl) {
        updatePage(pageIndex, 'illustrationUrl', data.imageUrl);
      }
    } catch (err) {
      console.error('Error generating image:', err);
    } finally {
      setGeneratingImage(null);
    }
  };

  const generateCover = async () => {
    if (!formData.title) return;
    setGeneratingCover(true);
    try {
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: `Book cover illustration for children's story "${formData.title}": ${formData.description}` }),
      });
      const data = await res.json();
      if (data.imageUrl) {
        updateField('coverImage' as any, data.imageUrl);
      }
    } catch (err) {
      console.error('Error generating cover:', err);
    } finally {
      setGeneratingCover(false);
    }
  };

  const saveStory = async () => {
    if (!formData.title.trim()) {
      alert('Введите название сказки');
      return;
    }
    if (formData.pages.some(p => !p.text.trim())) {
      alert('Заполните текст на всех страницах');
      return;
    }

    setSaving(true);
    try {
      const storyPayload = {
        ...formData,
        pages: formData.pages.map((p, i) => ({
          pageNumber: i + 1,
          ...p,
        })),
      };

      try {
        const res = await fetch('/api/stories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(storyPayload),
        });
        const newStory = await res.json();
        setStories([newStory, ...stories]);
      } catch {
        // API unavailable — save to localStorage instead
        console.warn('API unavailable, saving to client-side storage');
        const saved = saveLocalStory(storyPayload as any);
        setStories([saved, ...stories]);
      }
      setCurrentView('library');
    } catch (err) {
      console.error('Error saving story:', err);
      alert('Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-rose-50 to-sky-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-rose-100 px-4 py-3">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <Button variant="ghost" size="sm" onClick={() => setCurrentView('library')} className="text-rose-700">
            <ChevronLeft className="w-5 h-5 mr-1" />
            Назад
          </Button>
          <h2 className="font-bold text-rose-900">Новая сказка</h2>
          <Button
            size="sm"
            onClick={saveStory}
            disabled={saving}
            className="bg-gradient-to-r from-rose-500 to-amber-500 text-white"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Сохранить'}
          </Button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Story Info */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-5 space-y-4">
            <h3 className="font-bold text-rose-900 text-lg flex items-center gap-2">
              📖 Информация о сказке
            </h3>

            <div>
              <Label className="text-rose-700">Название</Label>
              <Input
                value={formData.title}
                onChange={e => updateField('title', e.target.value)}
                placeholder="Введите название сказки..."
                className="border-rose-200 focus:border-rose-400"
              />
            </div>

            <div>
              <Label className="text-rose-700">Описание</Label>
              <Textarea
                value={formData.description}
                onChange={e => updateField('description', e.target.value)}
                placeholder="Краткое описание сказки..."
                rows={2}
                className="border-rose-200 focus:border-rose-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-rose-700">Категория</Label>
                <Select value={formData.category} onValueChange={v => updateField('category', v)}>
                  <SelectTrigger className="border-rose-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-rose-700">Возраст</Label>
                <Select value={formData.ageRange} onValueChange={v => updateField('ageRange', v)}>
                  <SelectTrigger className="border-rose-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AGE_RANGES.map(age => (
                      <SelectItem key={age} value={age}>{age} лет</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-rose-700">Автор</Label>
              <Input
                value={formData.author}
                onChange={e => updateField('author', e.target.value)}
                placeholder="Имя автора..."
                className="border-rose-200 focus:border-rose-400"
              />
            </div>

            {/* Cover Image Generation */}
            <div>
              <Label className="text-rose-700">Обложка</Label>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={generateCover}
                  disabled={generatingCover || !formData.title}
                  className="border-rose-200 text-rose-700"
                >
                  {generatingCover ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Sparkles className="w-4 h-4 mr-2" />
                  )}
                  Создать обложку
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pages */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-rose-900 text-lg flex items-center gap-2">
              📄 Страницы ({formData.pages.length})
            </h3>
            <Button
              onClick={addPage}
              size="sm"
              className="bg-gradient-to-r from-rose-500 to-amber-500 text-white"
            >
              <Plus className="w-4 h-4 mr-1" />
              Добавить страницу
            </Button>
          </div>

          <AnimatePresence>
            {formData.pages.map((page, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="border-0 shadow-md overflow-hidden">
                  <div className="bg-gradient-to-r from-rose-500 to-amber-500 px-4 py-2 flex items-center justify-between">
                    <span className="text-white font-medium text-sm">Страница {index + 1}</span>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-white/80 hover:text-white hover:bg-white/20"
                        onClick={() => movePage(index, 'up')}
                        disabled={index === 0}
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-white/80 hover:text-white hover:bg-white/20"
                        onClick={() => movePage(index, 'down')}
                        disabled={index === formData.pages.length - 1}
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-white/80 hover:text-white hover:bg-white/20"
                        onClick={() => removePage(index)}
                        disabled={formData.pages.length <= 1}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                  <CardContent className="p-4 space-y-3">
                    <div>
                      <Label className="text-rose-700 text-xs">Текст страницы</Label>
                      <Textarea
                        value={page.text}
                        onChange={e => updatePage(index, 'text', e.target.value)}
                        placeholder="Текст сказки на этой странице..."
                        rows={3}
                        className="border-rose-200 focus:border-rose-400 text-sm"
                      />
                    </div>

                    <div>
                      <Label className="text-rose-700 text-xs">Описание иллюстрации</Label>
                      <div className="flex gap-2">
                        <Input
                          value={page.illustrationPrompt}
                          onChange={e => updatePage(index, 'illustrationPrompt', e.target.value)}
                          placeholder="Опишите иллюстрацию для AI..."
                          className="border-rose-200 focus:border-rose-400 text-sm"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => generateIllustration(index)}
                          disabled={generatingImage === index || !page.illustrationPrompt}
                          className="border-rose-200 text-rose-600 shrink-0"
                        >
                          {generatingImage === index ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Sparkles className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {page.illustrationUrl && (
                      <div className="rounded-lg overflow-hidden h-32">
                        <img
                          src={page.illustrationUrl}
                          alt={`Иллюстрация ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-rose-700 text-xs">Анимация</Label>
                        <Select
                          value={page.animationType}
                          onValueChange={v => updatePage(index, 'animationType', v)}
                        >
                          <SelectTrigger className="border-rose-200 text-sm h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ANIMATION_TYPES.map(anim => (
                              <SelectItem key={anim.value} value={anim.value}>
                                {anim.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-rose-700 text-xs">Длительность (сек)</Label>
                        <Input
                          type="number"
                          value={page.animationDuration}
                          onChange={e => updatePage(index, 'animationDuration', parseFloat(e.target.value) || 1.5)}
                          step={0.5}
                          min={0.5}
                          max={5}
                          className="border-rose-200 focus:border-rose-400 text-sm h-9"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>

          <Button
            onClick={addPage}
            variant="outline"
            className="w-full border-dashed border-2 border-rose-300 text-rose-500 hover:bg-rose-50 hover:border-rose-400 h-14"
          >
            <Plus className="w-5 h-5 mr-2" />
            Добавить страницу
          </Button>
        </div>

        {/* Save button */}
        <div className="pb-8">
          <Button
            onClick={saveStory}
            disabled={saving}
            className="w-full h-12 bg-gradient-to-r from-rose-500 to-amber-500 text-white text-lg font-bold shadow-xl hover:shadow-2xl"
          >
            {saving ? (
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
            ) : (
              <Sparkles className="w-6 h-6 mr-2" />
            )}
            Сохранить сказку
          </Button>
        </div>
      </div>
    </div>
  );
}
