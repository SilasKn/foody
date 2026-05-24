import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { useAuth } from './AuthProvider';
import { supabase } from '../utils/supabase';
import { fetchSignedImageUrls } from '../utils/fetchSignedImageUrls';

const RecipesContext = createContext(null);
const FILTER_MODES = {
  MINE: 'mine',
  PUBLIC: 'public',
};

const formatRecipeDate = (value) => {
  if (!value) return 'Date unknown';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date unknown';

  const weekday = new Intl.DateTimeFormat('de-DE', { weekday: 'short' }).format(date);
  const dayMonth = new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit' }).format(date);
  return `${weekday} ${dayMonth}.`;
};

const mapRecipeRecord = (record, authorLabel, imageUrl = null) => ({
  id: record.id,
  name: record.name ?? '',
  author: record.author ?? null,
  created_at: record.created_at ?? null,
  public: Boolean(record.public),
  servings: record.servings ?? null,
  dateLabel: formatRecipeDate(record.created_at),
  authorLabel,
  imageUrl,
});

export function RecipesProvider({ children }) {
  const { user } = useAuth();
  const lastUserIdRef = useRef(null);
  const [filterMode, setFilterMode] = useState(FILTER_MODES.MINE);
  const [recipesByMode, setRecipesByMode] = useState({
    [FILTER_MODES.MINE]: [],
    [FILTER_MODES.PUBLIC]: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [hasFetchedByMode, setHasFetchedByMode] = useState({
    [FILTER_MODES.MINE]: false,
    [FILTER_MODES.PUBLIC]: false,
  });

  useEffect(() => {
    const currentUserId = user?.id ?? null;
    if (lastUserIdRef.current === currentUserId) return;
    lastUserIdRef.current = currentUserId;
    setRecipesByMode({
      [FILTER_MODES.MINE]: [],
      [FILTER_MODES.PUBLIC]: [],
    });
    setErrorMessage('');
    setHasFetchedByMode({
      [FILTER_MODES.MINE]: false,
      [FILTER_MODES.PUBLIC]: false,
    });
    setFilterMode(FILTER_MODES.MINE);
    setIsLoading(false);
  }, [user?.id]);

  const loadProfilesByAuthorId = useCallback(async (authorIds) => {
    if (!Array.isArray(authorIds) || authorIds.length === 0) return {};

    const { data, error } = await supabase
      .from('profiles')
      .select('user_id, username')
      .in('user_id', authorIds);

    if (error) throw error;

    return (data ?? []).reduce((acc, row) => {
      if (!row?.user_id) return acc;
      acc[row.user_id] = row.username ?? null;
      return acc;
    }, {});
  }, []);

  const loadFromBackend = useCallback(async (mode) => {
    if (!user?.id) {
      setRecipesByMode({
        [FILTER_MODES.MINE]: [],
        [FILTER_MODES.PUBLIC]: [],
      });
      setErrorMessage('');
      setHasFetchedByMode({
        [FILTER_MODES.MINE]: false,
        [FILTER_MODES.PUBLIC]: false,
      });
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    let query = supabase.from('recipes').select('id, name, author, created_at, public, servings');
    if (mode === FILTER_MODES.PUBLIC) {
      query = query.eq('public', true);
    } else {
      query = query.eq('author', user.id);
    }
    query = query.eq('draft', false);

    try {
      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        setErrorMessage(error.message ?? 'Failed to load recipes.');
        setIsLoading(false);
        return;
      }

      const records = Array.isArray(data) ? data : [];
      const authorIds = [...new Set(records.map((row) => row.author).filter(Boolean))];
      const [profilesByAuthorId, signedMap] = await Promise.all([
        loadProfilesByAuthorId(authorIds),
        fetchSignedImageUrls(records.map((r) => r.id)),
      ]);

      const mapped = records.map((record) => {
        const profileName = profilesByAuthorId[record.author];
        const authorLabel =
          mode === FILTER_MODES.MINE
            ? 'Author: You'
            : `Author: ${profileName?.trim() || 'Unknown author'}`;
        return mapRecipeRecord(record, authorLabel, signedMap[record.id] ?? null);
      });

      setRecipesByMode((prev) => ({ ...prev, [mode]: mapped }));
      setHasFetchedByMode((prev) => ({ ...prev, [mode]: true }));
      setIsLoading(false);
    } catch (err) {
      setErrorMessage(err?.message ?? 'Failed to load recipes.');
      setIsLoading(false);
    }
  }, [loadProfilesByAuthorId, user?.id]);

  const loadRecipesForMode = useCallback(async (mode) => {
    if (!mode || isLoading || hasFetchedByMode[mode]) return;
    await loadFromBackend(mode);
  }, [hasFetchedByMode, isLoading, loadFromBackend]);

  const refreshRecipesForMode = useCallback(async (mode) => {
    if (!mode) return;
    await loadFromBackend(mode);
  }, [loadFromBackend]);

  const prependRecipe = useCallback((record) => {
    if (!record?.id) return;
    setRecipesByMode((prev) => {
      const next = { ...prev };

      const mineWithoutDuplicate = next[FILTER_MODES.MINE].filter((item) => item.id !== record.id);
      next[FILTER_MODES.MINE] = [mapRecipeRecord(record, 'Author: You'), ...mineWithoutDuplicate];

      if (record.public) {
        const publicWithoutDuplicate = next[FILTER_MODES.PUBLIC].filter((item) => item.id !== record.id);
        next[FILTER_MODES.PUBLIC] = [
          mapRecipeRecord(record, 'Author: You'),
          ...publicWithoutDuplicate,
        ];
      }

      return next;
    });
    setHasFetchedByMode((prev) => ({ ...prev, [FILTER_MODES.MINE]: true }));
  }, []);

  const clearRecipes = useCallback(() => {
    setRecipesByMode({
      [FILTER_MODES.MINE]: [],
      [FILTER_MODES.PUBLIC]: [],
    });
    setErrorMessage('');
    setHasFetchedByMode({
      [FILTER_MODES.MINE]: false,
      [FILTER_MODES.PUBLIC]: false,
    });
    setFilterMode(FILTER_MODES.MINE);
    setIsLoading(false);
  }, []);

  const recipes = recipesByMode[filterMode] ?? [];
  const hasFetched = hasFetchedByMode[filterMode] ?? false;

  const value = useMemo(
    () => ({
      filterMode,
      setFilterMode,
      filterModes: FILTER_MODES,
      recipes,
      isLoading,
      errorMessage,
      hasFetched,
      loadRecipesForMode,
      refreshRecipesForMode,
      prependRecipe,
      clearRecipes,
    }),
    [
      filterMode,
      recipes,
      isLoading,
      errorMessage,
      hasFetched,
      loadRecipesForMode,
      refreshRecipesForMode,
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
