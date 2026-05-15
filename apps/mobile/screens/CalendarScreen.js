import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import { Alert, ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { LinearTransition } from 'react-native-reanimated';
import MonthCalendar from '../components/MonthCalendar';
import ScreenShell from '../components/ScreenShell';
import SwipeActionsRow from '../components/SwipeActionsRow';
import shared from '../sharedStyles';
import { colors } from '../theme';
import { supabase } from '../utils/supabase';

const placeholderImage = require('../assets/no-picture.png');

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

  function renderScheduledEntry(entry) {
    return (
      <Pressable
        key={entry.id}
        accessibilityRole="button"
        onPress={() => {
          navigation.navigate('RecipeDetail', {
            recipe: { id: entry.recipe_id, name: entry.recipes?.name ?? '' },
          });
        }}
        style={styles.recipeRow}
      >
        <View style={styles.recipeImageWrapper}>
          <Image
            source={entry.imageUrl ? { uri: entry.imageUrl } : placeholderImage}
            style={styles.recipeImage}
            resizeMode="cover"
          />
        </View>
        <View style={styles.recipeInfo}>
          <Text style={[shared.typography.sub1, styles.recipeName]} numberOfLines={2}>
            {entry.recipes?.name ?? '—'}
          </Text>
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

        const [, { data: entries }] = await Promise.all([
          supabase.from('recipe_schedule').delete().lt('scheduled_for', todayIso()),
          supabase
            .from('recipe_schedule')
            .select('id, scheduled_for, scheduled_as, recipe_id, recipes(name)')
            .gte('scheduled_for', todayIso())
            .order('scheduled_for', { ascending: true }),
        ]);

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
          style={shared.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={shared.pageTitle}>Scheduled recipes</Text>

          {viewMode === 'calendar' ? (
            <>
              <MonthCalendar
                scheduledCountsByDate={scheduledCountsByDate}
                selectedDate={selectedDate}
                onSelectDate={iso => setSelectedDate(prev => (prev === iso ? null : iso))}
              />
              {selectedDate && (
                <View style={styles.dayListSection}>
                  <Text style={[shared.typography.sub2, styles.dayListHeader]}>
                    Scheduled for the picked date:
                  </Text>
                  {(entriesByDate[selectedDate] ?? []).length === 0 ? (
                    <Text style={[shared.typography.body, styles.emptyText]}>
                      Nothing scheduled for this day.
                    </Text>
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
          ) : loading ? (
            <ActivityIndicator size="large" color={colors.accent} style={styles.loader} />
          ) : groups.length === 0 ? (
            <Text style={[shared.typography.body, styles.emptyText]}>Nothing scheduled yet.</Text>
          ) : (
            groups.map(group => {
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
        </ScrollView>
      </View>

      <View style={shared.fabArea} pointerEvents="box-none">
        <Pressable
          style={({ pressed }) => [shared.fabMainButton, pressed && shared.pressed]}
          onPress={() => setViewMode(m => (m === 'list' ? 'calendar' : 'list'))}
          accessibilityRole="button"
          accessibilityLabel={viewMode === 'list' ? 'Show calendar view' : 'Show list view'}
        >
          <Image
            source={viewMode === 'list'
              ? require('../assets/calendar_icon_black.svg')
              : require('../assets/list-icon.png')}
            style={styles.fabIcon}
          />
        </Pressable>
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingTop: 8,
    paddingBottom: 100,
  },
  loader: {
    marginTop: 48,
  },
  emptyText: {
    color: colors.textMuted,
    fontStyle: 'italic',
    marginTop: 24,
  },
  dayHeader: {
    color: colors.text,
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
