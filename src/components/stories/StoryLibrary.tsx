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
import { getStories as getLocalStories, saveStory as saveLocalStory, deleteStory as deleteLocalStory, seedDemoStories } from '@/lib/client-storage';

// Soft pastel palette — warm, gentle, child-friendly
const CATEGORY_COLORS: Record<string, string> = {
  'Русские народные': 'bg-peach-100 text-orange-700 border-orange-200',
  'Авторские': 'bg-mint-50 text-teal-700 border-teal-200',
  'Сказки народов мира': 'bg-lavender-50 text-purple-700 border-purple-200',
  'Обучающие': 'bg-sky-50 text-sky-700 border-sky-200',
};

// Warm, gentle pastel gradients for covers
const COVER_GRADIENTS = [
  'from-amber-100 via-orange-50 to-yellow-100',
  'from-teal-100 via-emerald-50 to-cyan-100',
  'from-violet-100 via-purple-50 to-fuchsia-100',
  'from-sky-100 via-blue-50 to-indigo-100',
  'from-rose-100 via-pink-50 to-fuchsia-100',
  'from-lime-100 via-green-50 to-emerald-100',
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
      // Try API first
      try {
        let res = await fetch('/api/stories');
        let data = await res.json();

        // Seed demo stories via API if empty
        if (data.length === 0 && !seeded) {
          await fetch('/api/seed', { method: 'POST' });
          res = await fetch('/api/stories');
          data = await res.json();
          setSeeded(true);
        }

        setStories(data);
      } catch {
        // API unavailable — fall back to localStorage
        console.warn('API unavailable, using client-side storage');
        seedDemoStories();
        const localStories = getLocalStories();
        setStories(localStories);
      }
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
    const newFavorite = !story.isFavorite;
    // Optimistic update
    setStories(stories.map(s =>
      s.id === story.id ? { ...s, isFavorite: newFavorite } : s
    ));
    try {
      await fetch(`/api/stories/${story.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFavorite: newFavorite }),
      });
    } catch {
      // API unavailable — persist to localStorage
      saveLocalStory({ ...story, isFavorite: newFavorite });
    }
  };

  const deleteStory = async (story: Story) => {
    try {
      await fetch(`/api/stories/${story.id}`, { method: 'DELETE' });
    } catch {
      // API unavailable — delete from localStorage
      deleteLocalStory(story.id);
    }
    setStories(stories.filter(s => s.id !== story.id));
    setDeleteTarget(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50/80 via-orange-50/50 to-teal-50/80">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/70 backdrop-blur-xl border-b border-amber-100/50">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-gradient-to-br from-amber-400 to-orange-400 rounded-2xl flex items-center justify-center shadow-md">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-amber-900">Маленькие Истории</h1>
                <p className="text-xs text-amber-600/70">Сказки с анимацией и озвучкой</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-amber-700 hover:bg-amber-50 rounded-xl"
                onClick={() => setCurrentView('settings')}
              >
                ⚙️
              </Button>
              <Button
                size="sm"
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-md rounded-xl"
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
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md'
                    : 'bg-white/80 text-amber-800 border border-amber-200/50 hover:bg-amber-50'
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
            <h3 className="text-lg font-medium text-amber-800 mb-2">Сказок пока нет</h3>
            <p className="text-amber-600/70 mb-6">Добавьте первую сказку, чтобы начать!</p>
            <Button
              onClick={() => setCurrentView('editor')}
              className="bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl"
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
                  className="cursor-pointer group overflow-hidden border border-amber-100/30 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 rounded-2xl"
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
                        className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/70 backdrop-blur flex items-center justify-center shadow-sm hover:bg-white transition-all"
                      >
                        <Heart
                          className={`w-4 h-4 transition-all ${
                            story.isFavorite ? 'fill-orange-500 text-orange-500' : 'text-gray-400'
                          }`}
                        />
                      </button>

                      {/* Delete button */}
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeleteTarget(story); }}
                        className="absolute bottom-2 right-2 w-7 h-7 rounded-full bg-white/50 backdrop-blur flex items-center justify-center shadow-sm hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
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
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <div className="w-14 h-14 bg-white/80 backdrop-blur rounded-full flex items-center justify-center shadow-xl">
                          <BookOpen className="w-7 h-7 text-amber-600" />
                        </div>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-3 bg-white/80">
                      <h3 className="font-bold text-sm text-gray-800 line-clamp-1 mb-1">{story.title}</h3>
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
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-amber-50 text-amber-700 border-amber-100">
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
