import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import ScreenShell from '../components/ScreenShell';
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

        // Batch-fetch images for all unique recipe IDs
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

        // Group entries by date
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
      <View style={styles.outerContainer}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.pageTitle}>Upcoming recipes</Text>

          {loading ? (
            <ActivityIndicator size="large" color={colors.accent} style={styles.loader} />
          ) : groups.length === 0 ? (
            <Text style={styles.emptyText}>Nothing scheduled yet.</Text>
          ) : (
            groups.map(group => (
              <View key={group.date}>
                <Text style={styles.dayHeader}>{parseDayHeader(group.date)}</Text>
                {group.entries.map(entry => (
                  <View key={entry.id} style={styles.recipeRow}>
                    <View style={styles.recipeImageWrapper}>
                      <Image
                        source={entry.imageUrl ? { uri: entry.imageUrl } : placeholderImage}
                        style={styles.recipeImage}
                        resizeMode="cover"
                      />
                    </View>
                    <View style={styles.recipeInfo}>
                      <Text style={styles.recipeName} numberOfLines={2}>
                        {entry.recipes?.name ?? '—'}
                      </Text>
                    </View>
                    <Text style={styles.mealType}>{entry.scheduled_as}</Text>
                  </View>
                ))}
              </View>
            ))
          )}
        </ScrollView>
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    alignSelf: 'stretch',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 4,
    paddingTop: 8,
    paddingBottom: 24,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  loader: {
    marginTop: 48,
  },
  emptyText: {
    fontSize: 15,
    color: colors.textMuted,
    fontStyle: 'italic',
    marginTop: 24,
  },
  dayHeader: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginTop: 24,
    marginBottom: 8,
  },
  recipeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  recipeImageWrapper: {
    width: 64,
    height: 64,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
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
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  mealType: {
    fontSize: 13,
    color: colors.textMuted,
    marginLeft: 8,
  },
});
