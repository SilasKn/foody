import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { useAuth } from './AuthProvider';
import { supabase } from '../utils/supabase';

const RecipesContext = createContext(null);

const formatRecipeDate = (value) => {
  if (!value) return 'Date unknown';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date unknown';

  const weekday = new Intl.DateTimeFormat('de-DE', { weekday: 'short' }).format(date);
  const dayMonth = new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit' }).format(date);
  return `${weekday} ${dayMonth}.`;
};

const mapRecipeRecord = (record) => ({
  id: record.id,
  name: record.name ?? '',
  author: record.author ?? null,
  created_at: record.created_at ?? null,
  dateLabel: formatRecipeDate(record.created_at),
  authorLabel: 'Author: You',
});

export function RecipesProvider({ children }) {
  const { user } = useAuth();
  const lastUserIdRef = useRef(null);
  const [recipes, setRecipes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [hasFetched, setHasFetched] = useState(false);

  useEffect(() => {
    const currentUserId = user?.id ?? null;
    if (lastUserIdRef.current === currentUserId) return;
    lastUserIdRef.current = currentUserId;
    setRecipes([]);
    setErrorMessage('');
    setHasFetched(false);
    setIsLoading(false);
  }, [user?.id]);

  const loadFromBackend = useCallback(async () => {
    if (!user?.id) {
      setRecipes([]);
      setErrorMessage('');
      setHasFetched(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    const { data, error } = await supabase
      .from('recipes')
      .select('id, name, author, created_at')
      .eq('author', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      setErrorMessage(error.message ?? 'Failed to load recipes.');
      setIsLoading(false);
      return;
    }

    setRecipes(Array.isArray(data) ? data.map(mapRecipeRecord) : []);
    setHasFetched(true);
    setIsLoading(false);
  }, [user?.id]);

  const loadMyRecipes = useCallback(async () => {
    if (hasFetched || isLoading) return;
    await loadFromBackend();
  }, [hasFetched, isLoading, loadFromBackend]);

  const refreshMyRecipes = useCallback(async () => {
    await loadFromBackend();
  }, [loadFromBackend]);

  const prependRecipe = useCallback((record) => {
    if (!record?.id) return;
    setRecipes((prev) => {
      const withoutDuplicate = prev.filter((item) => item.id !== record.id);
      return [mapRecipeRecord(record), ...withoutDuplicate];
    });
    setHasFetched(true);
  }, []);

  const clearRecipes = useCallback(() => {
    setRecipes([]);
    setErrorMessage('');
    setHasFetched(false);
    setIsLoading(false);
  }, []);

  const value = useMemo(
    () => ({
      recipes,
      isLoading,
      errorMessage,
      hasFetched,
      loadMyRecipes,
      refreshMyRecipes,
      prependRecipe,
      clearRecipes,
    }),
    [
      recipes,
      isLoading,
      errorMessage,
      hasFetched,
      loadMyRecipes,
      refreshMyRecipes,
      prependRecipe,
      clearRecipes,
    ]
  );

  return <RecipesContext.Provider value={value}>{children}</RecipesContext.Provider>;
}

export function useRecipes() {
  const context = useContext(RecipesContext);
  if (!context) throw new Error('useRecipes must be used within a RecipesProvider');
  return context;
}
