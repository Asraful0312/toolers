import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

const STORAGE_KEYS = {
  SAVED_TOOLS: 'tooly_saved_tools',
  RECENT_TOOLS: 'tooly_recent_tools',
};

interface StorageContextType {
  savedTools: string[];
  recentTools: string[];
  addToSaved: (toolId: string) => void;
  removeFromSaved: (toolId: string) => void;
  isToolSaved: (toolId: string) => boolean;
  addToRecent: (toolId: string) => void;
  clearRecent: () => void;
}

const StorageContext = createContext<StorageContextType>({
  savedTools: [],
  recentTools: [],
  addToSaved: () => {},
  removeFromSaved: () => {},
  isToolSaved: () => false,
  addToRecent: () => {},
  clearRecent: () => {},
});

export const useStorage = () => useContext(StorageContext);

export const StorageProvider = ({ children }: { children: ReactNode }) => {
  const [savedTools, setSavedTools] = useState<string[]>([]);
  const [recentTools, setRecentTools] = useState<string[]>([]);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [saved, recent] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.SAVED_TOOLS),
        AsyncStorage.getItem(STORAGE_KEYS.RECENT_TOOLS),
      ]);
      if (saved) setSavedTools(JSON.parse(saved));
      if (recent) setRecentTools(JSON.parse(recent));
    } catch (error) {
      console.error('Error loading storage:', error);
    }
  };

  const addToSaved = async (toolId: string) => {
    if (!savedTools.includes(toolId)) {
      const updated = [...savedTools, toolId];
      setSavedTools(updated);
      await AsyncStorage.setItem(STORAGE_KEYS.SAVED_TOOLS, JSON.stringify(updated));
    }
  };

  const removeFromSaved = async (toolId: string) => {
    const updated = savedTools.filter((id) => id !== toolId);
    setSavedTools(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.SAVED_TOOLS, JSON.stringify(updated));
  };

  const isToolSaved = (toolId: string) => savedTools.includes(toolId);

  const addToRecent = async (toolId: string) => {
    // Remove if exists, then add to front (max 20 items)
    const filtered = recentTools.filter((id) => id !== toolId);
    const updated = [toolId, ...filtered].slice(0, 20);
    setRecentTools(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.RECENT_TOOLS, JSON.stringify(updated));
  };

  const clearRecent = async () => {
    setRecentTools([]);
    await AsyncStorage.removeItem(STORAGE_KEYS.RECENT_TOOLS);
  };

  return (
    <StorageContext.Provider
      value={{
        savedTools,
        recentTools,
        addToSaved,
        removeFromSaved,
        isToolSaved,
        addToRecent,
        clearRecent,
      }}
    >
      {children}
    </StorageContext.Provider>
  );
};
