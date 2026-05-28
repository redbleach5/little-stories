import { create } from 'zustand';

export type ViewType = 'library' | 'player' | 'editor' | 'settings';

export interface StoryPage {
  id: string;
  pageNumber: number;
  text: string;
  illustrationUrl: string;
  illustrationPrompt: string;
  animationType: string;
  animationDuration: number;
}

export interface Story {
  id: string;
  title: string;
  description: string;
  category: string;
  ageRange: string;
  coverImage: string;
  author: string;
  duration: number;
  isFavorite: boolean;
  createdAt: string;
  pages: StoryPage[];
}

interface AppState {
  // Navigation
  currentView: ViewType;
  setCurrentView: (view: ViewType) => void;

  // Stories
  stories: Story[];
  setStories: (stories: Story[]) => void;
  currentStory: Story | null;
  setCurrentStory: (story: Story | null) => void;

  // Player
  currentPage: number;
  setCurrentPage: (page: number) => void;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  voiceSpeed: number;
  setVoiceSpeed: (speed: number) => void;
  isSpeaking: boolean;
  setIsSpeaking: (speaking: boolean) => void;

  // Editor
  editingStory: Story | null;
  setEditingStory: (story: Story | null) => void;

  // Settings
  fontSize: 'small' | 'medium' | 'large';
  setFontSize: (size: 'small' | 'medium' | 'large') => void;
  autoPlay: boolean;
  setAutoPlay: (auto: boolean) => void;

  // Loading
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentView: 'library',
  setCurrentView: (view) => set({ currentView: view }),

  stories: [],
  setStories: (stories) => set({ stories }),
  currentStory: null,
  setCurrentStory: (story) => set({ currentStory: story, currentPage: 0 }),

  currentPage: 0,
  setCurrentPage: (page) => set({ currentPage: page }),
  isPlaying: false,
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  voiceSpeed: 1.0,
  setVoiceSpeed: (speed) => set({ voiceSpeed: speed }),
  isSpeaking: false,
  setIsSpeaking: (speaking) => set({ isSpeaking: speaking }),

  editingStory: null,
  setEditingStory: (story) => set({ editingStory: story }),

  fontSize: 'large',
  setFontSize: (size) => set({ fontSize: size }),
  autoPlay: false,
  setAutoPlay: (auto) => set({ autoPlay: auto }),

  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),
}));
