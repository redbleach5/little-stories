'use client';

import { useAppStore } from '@/store/useAppStore';
import { StoryLibrary } from '@/components/stories/StoryLibrary';
import { StoryPlayer } from '@/components/stories/StoryPlayer';
import { StoryEditor } from '@/components/stories/StoryEditor';
import { StorySettings } from '@/components/stories/StorySettings';
import { OnboardingScreen } from '@/components/stories/OnboardingScreen';

export default function Home() {
  const { currentView } = useAppStore();

  return (
    <main>
      {currentView === 'onboarding' && <OnboardingScreen />}
      {currentView === 'library' && <StoryLibrary />}
      {currentView === 'player' && <StoryPlayer />}
      {currentView === 'editor' && <StoryEditor />}
      {currentView === 'settings' && <StorySettings />}
    </main>
  );
}
