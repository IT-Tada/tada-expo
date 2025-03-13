import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Universe {
  id: string;
  nameKey: string;
  descriptionKey: string;
  image: string;
}

export type AgeRange = 'under-3' | '3-5' | '6-9' | '10-15' | '16-plus';

export interface UserPreferences {
  ageRange: AgeRange | null;
  language: string;
  lastUpdated: string;
}

interface StoryState {
  selectedUniverse: Universe | null;
  remainingStories: number;
  userPreferences: UserPreferences;
  setSelectedUniverse: (universe: Universe | null) => void;
  decrementRemainingStories: () => void;
  setUserPreferences: (preferences: Partial<UserPreferences>) => void;
}

const defaultPreferences: UserPreferences = {
  ageRange: null,
  language: 'fr-FR',
  lastUpdated: new Date().toISOString(),
};

export const useStoryStore = create<StoryState>()(
  persist(
    (set) => ({
      selectedUniverse: null,
      remainingStories: 5,
      userPreferences: defaultPreferences,
      setSelectedUniverse: (universe) => set({ selectedUniverse: universe }),
      decrementRemainingStories: () =>
        set((state) => ({ remainingStories: Math.max(0, state.remainingStories - 1) })),
      setUserPreferences: (preferences) =>
        set((state) => ({
          userPreferences: {
            ...state.userPreferences,
            ...preferences,
            lastUpdated: new Date().toISOString(),
          },
        })),
    }),
    {
      name: 'story-preferences',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);