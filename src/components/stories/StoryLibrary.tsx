'use client';

import { useAppStore, Story } from '@/store/useAppStore';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Heart, BookOpen, Clock, User, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

const CATEGORY_COLORS: Record<string, string> = {
  'Русские народные': 'bg-amber-100 text-amber-800 border-amber-200',
  'Авторские': 'bg-emerald-100 text-emerald-800 border-emerald-200',
  'Сказки народов мира': 'bg-sky-100 text-sky-800 border-sky-200',
  'Обучающие': 'bg-violet-100 text-violet-800 border-violet-200',
};

const COVER_GRADIENTS = [
  'from-rose-300 via-pink-200 to-amber-100',
  'from-sky-300 via-cyan-200 to-emerald-100',
  'from-amber-300 via-orange-200 to-rose-100',
  'from-emerald-300 via-teal-200 to-sky-100',
  'from-violet-300 via-purple-200 to-pink-100',
  'from-rose-300 via-fuchsia-200 to-violet-100',
];

const STORY_EMOJIS: Record<string, string> = {
  'Колобок': '🟡',
  'Теремок': '🏠',
  'Репка': '🥕',
  'Курочка Ряба': '🐔',
  'Маша и Медведь': '🐻',
};

function StoryEmoji({ title }: { title: string }) {
  const emoji = STORY_EMOJIS[title] || '📖';
  return <span className="text-6xl drop-shadow-lg">{emoji}</span>;
}

export function StoryLibrary() {
  const { stories, setCurrentStory, setCurrentView, setStories, setIsLoading } = useAppStore();
  const [selectedCategory, setSelectedCategory] = useState<string>('Все');
  const [seeded, setSeeded] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Story | null>(null);

  useEffect(() => {
    loadStories();
  }, []);

  const loadStories = async () => {
    setIsLoading(true);
    try {
      let res = await fetch('/api/stories');
      let data = await res.json();

      // Seed demo stories if empty
      if (data.length === 0 && !seeded) {
        await fetch('/api/seed', { method: 'POST' });
        res = await fetch('/api/stories');
        data = await res.json();
        setSeeded(true);
      }

      setStories(data);
    } catch (err) {
      console.error('Error loading stories:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const categories = ['Все', ...Array.from(new Set(stories.map(s => s.category)))];
  const filteredStories = selectedCategory === 'Все'
    ? stories
    : stories.filter(s => s.category === selectedCategory);

  const handleOpenStory = (story: Story) => {
    setCurrentStory(story);
    setCurrentView('player');
  };

  const toggleFavorite = async (e: React.MouseEvent, story: Story) => {
    e.stopPropagation();
    try {
      await fetch(`/api/stories/${story.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFavorite: !story.isFavorite }),
      });
      setStories(stories.map(s =>
        s.id === story.id ? { ...s, isFavorite: !s.isFavorite } : s
      ));
    } catch (err) {
      console.error('Error toggling favorite:', err);
    }
  };

  const deleteStory = async (story: Story) => {
    try {
      await fetch(`/api/stories/${story.id}`, { method: 'DELETE' });
      setStories(stories.filter(s => s.id !== story.id));
      setDeleteTarget(null);
    } catch (err) {
      console.error('Error deleting story:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-rose-50 to-sky-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-rose-100">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-rose-400 to-amber-400 rounded-xl flex items-center justify-center shadow-lg">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-rose-900">Маленькие Истории</h1>
                <p className="text-xs text-rose-500">Сказки с анимацией и озвучкой</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="border-rose-200 text-rose-700 hover:bg-rose-50"
                onClick={() => setCurrentView('settings')}
              >
                ⚙️
              </Button>
              <Button
                size="sm"
                className="bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white shadow-lg"
                onClick={() => setCurrentView('editor')}
              >
                ✨ Новая сказка
              </Button>
            </div>
          </div>

          {/* Categories */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-gradient-to-r from-rose-500 to-amber-500 text-white shadow-md'
                    : 'bg-white text-rose-700 border border-rose-200 hover:bg-rose-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stories Grid */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        {filteredStories.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-lg font-medium text-rose-800 mb-2">Сказок пока нет</h3>
            <p className="text-rose-500 mb-6">Добавьте первую сказку, чтобы начать!</p>
            <Button
              onClick={() => setCurrentView('editor')}
              className="bg-gradient-to-r from-rose-500 to-amber-500 text-white"
            >
              ✨ Создать сказку
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredStories.map((story, index) => (
              <motion.div
                key={story.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
              >
                <Card
                  className="cursor-pointer group overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                  onClick={() => handleOpenStory(story)}
                >
                  <CardContent className="p-0">
                    {/* Cover */}
                    <div className={`relative aspect-[3/4] bg-gradient-to-br ${COVER_GRADIENTS[index % COVER_GRADIENTS.length]} flex flex-col items-center justify-center overflow-hidden`}>
                      {story.coverImage ? (
                        <img
                          src={story.coverImage}
                          alt={story.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <StoryEmoji title={story.title} />
                      )}

                      {/* Favorite button */}
                      <button
                        onClick={(e) => toggleFavorite(e, story)}
                        className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/80 backdrop-blur flex items-center justify-center shadow-sm hover:bg-white transition-all"
                      >
                        <Heart
                          className={`w-4 h-4 transition-all ${
                            story.isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400'
                          }`}
                        />
                      </button>

                      {/* Delete button */}
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeleteTarget(story); }}
                        className="absolute bottom-2 right-2 w-7 h-7 rounded-full bg-white/60 backdrop-blur flex items-center justify-center shadow-sm hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-gray-400 hover:text-red-500" />
                      </button>

                      {/* Category badge */}
                      <div className="absolute top-2 left-2">
                        <Badge
                          variant="outline"
                          className={`text-[10px] px-1.5 py-0 ${CATEGORY_COLORS[story.category] || 'bg-gray-100 text-gray-700 border-gray-200'}`}
                        >
                          {story.category}
                        </Badge>
                      </div>

                      {/* Play overlay */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <div className="w-14 h-14 bg-white/90 rounded-full flex items-center justify-center shadow-xl">
                          <BookOpen className="w-7 h-7 text-rose-600" />
                        </div>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-3 bg-white">
                      <h3 className="font-bold text-sm text-gray-900 line-clamp-1 mb-1">{story.title}</h3>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span className="flex items-center gap-0.5">
                          <Clock className="w-3 h-3" />
                          {story.duration} мин
                        </span>
                        <span className="flex items-center gap-0.5">
                          <User className="w-3 h-3" />
                          {story.author}
                        </span>
                      </div>
                      <div className="mt-1">
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-rose-50 text-rose-600 border-rose-100">
                          {story.ageRange} лет
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить сказку?</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите удалить сказку «{deleteTarget?.title}»? Это действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && deleteStory(deleteTarget)}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
