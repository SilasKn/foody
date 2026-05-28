import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image as SvgIcon } from 'expo-image';
import Animated, { LinearTransition } from 'react-native-reanimated';
import DateCarousel from '../components/DateCarousel';
import MonthCalendar from '../components/MonthCalendar';
import RecipeImage from '../components/RecipeImage';
import ScreenShell from '../components/ScreenShell';
import SwipeActionsRow from '../components/SwipeActionsRow';
import shared from '../sharedStyles';
import { colors } from '../theme';
import { supabase } from '../utils/supabase';

const personIcon = require('../assets/person_icon.svg');
const MEAL_TYPE_ORDER = { Breakfast: 0, Lunch: 1, Dinner: 2, Snack: 3 };

function todayIso() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function parseDayHeader(isoDate) {
  const [y, m, d] = isoDate.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  const dayName = dt.toLocaleDateString('en-US', { weekday: 'long' });
  return `${dayName}  ${String(d).padStart(2, '0')}.${String(m).padStart(2, '0')}.${String(y).slice(2)}`;
}

export default function CalendarScreen({ navigation }) {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('list');
  const [selectedDate, setSelectedDate] = useState(todayIso());

  const scheduledCountsByDate = useMemo(() => {
    const m = {};
    for (const g of groups) m[g.date] = g.entries.length;
    return m;
  }, [groups]);

  const entriesByDate = useMemo(() => {
    const m = {};
    for (const g of groups) m[g.date] = g.entries;
    return m;
  }, [groups]);

  const visibleGroups = useMemo(
    () => groups.filter(g => g.date >= selectedDate),
    [groups, selectedDate]
  );

  const scrollRef = useRef(null);
  const didMountRef = useRef(false);
  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }, [selectedDate]);

  function renderScheduledEntry(entry) {
    return (
      <Pressable
        key={entry.id}
        accessibilityRole="button"
        onPress={() => {
          navigation.navigate('RecipeDetail', {
            recipe: { id: entry.recipe_id, name: entry.recipes?.name ?? '', scheduledServings: entry.servings ?? null },
          });
        }}
        style={styles.recipeRow}
      >
        <View style={styles.recipeImageWrapper}>
          <RecipeImage
            imageUrl={entry.imageUrl}
            recipeId={entry.recipe_id}
            style={styles.recipeImage}
          />
        </View>
        <View style={styles.recipeInfo}>
          <Text style={[shared.typography.sub1, styles.recipeName]} numberOfLines={2}>
            {entry.recipes?.name ?? '—'}
          </Text>
          {entry.servings != null && (
            <View style={styles.servingsInfo}>
              <SvgIcon source={personIcon} style={styles.servingsIcon} contentFit="contain" />
              <Text style={[shared.typography.sub2, styles.servingsText]}>
                {entry.servings} {entry.servings === 1 ? 'Serving' : 'Servings'}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.mealTypePill}>
          <Text style={[shared.typography.sub2, styles.mealTypePillLabel]}>
            {entry.scheduled_as}
          </Text>
        </View>
      </Pressable>
    );
  }

  function handleReschedule(entry) {
    navigation.navigate('Reschedule', {
      entry: {
        id: entry.id,
        scheduled_for: entry.scheduled_for,
        scheduled_as: entry.scheduled_as,
        servings: entry.servings,
      },
    });
  }

  async function handleSwipeDelete(entryId) {
    setGroups(prev =>
      prev
        .map(g => ({ ...g, entries: g.entries.filter(e => e.id !== entryId) }))
        .filter(g => g.entries.length > 0)
    );
    const { error } = await supabase.from('recipe_schedule').delete().eq('id', entryId);
    if (error) Alert.alert('Error', 'Could not delete the scheduling.');
  }

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function load() {
        setLoading(true);
        const today = todayIso();

        const { data: pastEntries } = await supabase
          .from('recipe_schedule')
          .select('recipe_id, scheduled_for')
          .lt('scheduled_for', today);

        if (pastEntries && pastEntries.length > 0) {
          const latestByRecipe = {};
          for (const entry of pastEntries) {
            const existing = latestByRecipe[entry.recipe_id];
            if (!existing || entry.scheduled_for > existing) {
              latestByRecipe[entry.recipe_id] = entry.scheduled_for;
            }
          }

          try {
            await Promise.all(
              Object.entries(latestByRecipe).map(([recipeId, date]) =>
                supabase.from('recipes').update({ last_eaten: date }).eq('id', recipeId)
              )
            );
          } catch {}
        }

        await supabase.from('recipe_schedule').delete().lt('scheduled_for', today);

        const { data: entries } = await supabase
          .from('recipe_schedule')
          .select('id, scheduled_for, scheduled_as, recipe_id, servings, recipes(name)')
          .gte('scheduled_for', today)
          .order('scheduled_for', { ascending: true });

        if (!active) return;

        const rawEntries = entries ?? [];

        const uniqueIds = [...new Set(rawEntries.map(e => e.recipe_id))];
        let imageUrlMap = {};

        if (uniqueIds.length > 0) {
          const { data: imgRows } = await supabase
            .from('recipe_images')
            .select('recipe_id, file_path')
            .in('recipe_id', uniqueIds);

          if (imgRows && imgRows.length > 0) {
            const signedResults = await Promise.all(
              imgRows.map(row =>
                supabase.storage
                  .from('recipe_images')
                  .createSignedUrl(row.file_path, 3600)
                  .then(({ data }) => ({ recipe_id: row.recipe_id, url: data?.signedUrl ?? null }))
              )
            );
            signedResults.forEach(({ recipe_id, url }) => {
              imageUrlMap[recipe_id] = url;
            });
          }
        }

        const grouped = [];
        let currentDate = null;
        let currentGroup = null;
        for (const entry of rawEntries) {
          if (entry.scheduled_for !== currentDate) {
            currentDate = entry.scheduled_for;
            currentGroup = { date: currentDate, entries: [] };
            grouped.push(currentGroup);
          }
          currentGroup.entries.push({
            ...entry,
            imageUrl: imageUrlMap[entry.recipe_id] ?? null,
          });
        }

        for (const group of grouped) {
          group.entries.sort(
            (a, b) =>
              (MEAL_TYPE_ORDER[a.scheduled_as] ?? 99) -
              (MEAL_TYPE_ORDER[b.scheduled_as] ?? 99)
          );
        }

        if (active) {
          setGroups(grouped);
          setLoading(false);
        }
      }

      load();
      return () => { active = false; };
    }, [])
  );

  return (
    <ScreenShell navigation={navigation} activeTab="calendar">
      <View style={shared.outerContainer}>
        <ScrollView
          ref={scrollRef}
          style={[shared.scroll, styles.scrollOuter]}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={shared.pageTitle}>Scheduled recipes</Text>

          {viewMode === 'calendar' ? (
            <>
              <MonthCalendar
                scheduledCountsByDate={scheduledCountsByDate}
                selectedDate={selectedDate}
                onSelectDate={iso => setSelectedDate(iso)}
              />
              {selectedDate && (
                <View style={styles.dayListSection}>
                  <Text style={[shared.typography.sub2, styles.dayListHeader]}>
                    Scheduled for the picked date:
                  </Text>
                  {(entriesByDate[selectedDate] ?? []).length === 0 ? (
                    <View style={styles.emptyContainer}>
                      <Text style={[shared.typography.body, styles.emptyText]}>Nothing scheduled for this day.</Text>
                      <Image
                        source={require('../assets/created_images/no_recipes.png')}
                        style={styles.emptyImage}
                        resizeMode="contain"
                      />
                    </View>
                  ) : (
                    entriesByDate[selectedDate].map(entry => (
                      <SwipeActionsRow
                        key={entry.id}
                        onDelete={() => handleSwipeDelete(entry.id)}
                        onReschedule={() => handleReschedule(entry)}
                      >
                        {renderScheduledEntry(entry)}
                      </SwipeActionsRow>
                    ))
                  )}
                </View>
              )}
            </>
          ) : (
            <>
              <View style={styles.carouselWrapper}>
                <DateCarousel
                  selectedDate={selectedDate}
                  onSelectDate={iso => setSelectedDate(iso)}
                />
              </View>
              {loading ? (
                <ActivityIndicator size="large" color={colors.accent} style={styles.loader} />
              ) : visibleGroups.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={[shared.typography.body, styles.emptyText]}>Nothing scheduled yet.</Text>
                  <Image
                    source={require('../assets/created_images/no_recipes.png')}
                    style={styles.emptyImage}
                    resizeMode="contain"
                  />
                </View>
              ) : (
                visibleGroups.map(group => {
              if (group.entries.length === 1) {
                const entry = group.entries[0];
                return (
                  <SwipeActionsRow
                    key={group.date}
                    onDelete={() => handleSwipeDelete(entry.id)}
                    onReschedule={() => handleReschedule(entry)}
                    headerContent={
                      <Text style={[shared.typography.h3, styles.dayHeader]}>{parseDayHeader(group.date)}</Text>
                    }
                  >
                    {renderScheduledEntry(entry)}
                  </SwipeActionsRow>
                );
              }
              return (
                <Animated.View key={group.date} layout={LinearTransition.duration(220)}>
                  <Text style={[shared.typography.h3, styles.dayHeader]}>{parseDayHeader(group.date)}</Text>
                  {group.entries.map(entry => (
                    <SwipeActionsRow
                      key={entry.id}
                      onDelete={() => handleSwipeDelete(entry.id)}
                      onReschedule={() => handleReschedule(entry)}
                    >
                      {renderScheduledEntry(entry)}
                    </SwipeActionsRow>
                  ))}
                </Animated.View>
              );
                })
              )}
            </>
          )}
        </ScrollView>
      </View>

      <View style={shared.fabArea} pointerEvents="box-none">
        <Pressable
          style={({ pressed }) => [shared.fabMainButton, pressed && shared.pressed]}
          onPress={() => setViewMode(m => (m === 'list' ? 'calendar' : 'list'))}
          accessibilityRole="button"
          accessibilityLabel={viewMode === 'list' ? 'Show calendar view' : 'Show list view'}
        >
          <SvgIcon
            source={viewMode === 'list'
              ? require('../assets/calendar_icon_black.svg')
              : require('../assets/list_icon.svg')}
            style={styles.fabIcon}
            contentFit="contain"
          />
        </Pressable>
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  scrollOuter: {
    marginHorizontal: -18,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 8,
    paddingBottom: 100,
    paddingHorizontal: 18,
  },
  carouselWrapper: {
    marginHorizontal: -18,
    marginBottom: 8,
  },
  loader: {
    marginTop: 48,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: colors.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  emptyImage: {
    width: 80,
    height: 80,
    marginTop: 12,
  },
  dayHeader: {
    color: colors.textMuted,
    marginTop: 24,
    marginBottom: 8,
  },
  dayListSection: {
    marginTop: 16,
  },
  dayListHeader: {
    color: colors.textMuted,
    marginBottom: 8,
  },
  recipeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  recipeImageWrapper: {
    width: 64,
    height: 64,
  },
  recipeImage: {
    width: 64,
    height: 64,
    borderRadius: 34,
    backgroundColor: colors.imagePlaceholderBg,
  },
  recipeInfo: {
    flex: 1,
    marginLeft: 12,
  },
  recipeName: {
    color: colors.text,
  },
  servingsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  servingsIcon: {
    width: 12,
    height: 12,
    marginRight: 4,
    tintColor: colors.textMuted,
  },
  servingsText: {
    color: colors.textMuted,
    fontSize: 12,
  },
  mealTypePill: {
    backgroundColor: colors.accent,
    borderRadius: 9999,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginLeft: 8,
    alignSelf: 'center',
  },
  mealTypePillLabel: {
    color: colors.white,
  },
  fabIcon: {
    width: 26,
    height: 26,
    resizeMode: 'contain',
  },
});
