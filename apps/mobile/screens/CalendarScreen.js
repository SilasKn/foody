import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useRef, useState } from 'react';
import { Alert, Animated, ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScreenShell from '../components/ScreenShell';
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
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleteMode, setDeleteMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const anim = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

  function toggleMenu() {
    const toValue = menuOpen ? 0 : 1;
    setMenuOpen(!menuOpen);
    Animated.spring(anim, { toValue, useNativeDriver: true, friction: 6 }).start();
  }

  function subButtonStyle(offsetMultiplier) {
    return {
      opacity: anim,
      transform: [{ translateY: anim.interpolate({
        inputRange: [0, 1],
        outputRange: [20 * offsetMultiplier, 0],
      }) }],
    };
  }

  function enterDeleteMode() {
    setSelectedIds(new Set());
    setMenuOpen(false);
    anim.setValue(0);
    setDeleteMode(true);
  }

  function exitDeleteMode() {
    setDeleteMode(false);
    setSelectedIds(new Set());
  }

  function toggleSelect(id) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function handleDelete() {
    if (selectedIds.size === 0) {
      setDeleteMode(false);
      return;
    }
    const ids = [...selectedIds];
    setGroups(prev =>
      prev
        .map(g => ({ ...g, entries: g.entries.filter(e => !selectedIds.has(e.id)) }))
        .filter(g => g.entries.length > 0)
    );
    setDeleteMode(false);
    setSelectedIds(new Set());
    const { error } = await supabase.from('recipe_schedule').delete().in('id', ids);
    if (error) Alert.alert('Error', 'Could not delete the selected entries.');
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
    <ScreenShell navigation={navigation} activeTab="calendar" hideTabBar={deleteMode}>
      <View style={shared.outerContainer}>
        <ScrollView
          style={shared.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            deleteMode && { paddingBottom: 100 + insets.bottom },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <Text style={shared.pageTitle}>Scheduled recipes</Text>

          {loading ? (
            <ActivityIndicator size="large" color={colors.accent} style={styles.loader} />
          ) : groups.length === 0 ? (
            <Text style={[shared.typography.body, styles.emptyText]}>Nothing scheduled yet.</Text>
          ) : (
            groups.map(group => (
              <View key={group.date}>
                <Text style={[shared.typography.h3, styles.dayHeader]}>{parseDayHeader(group.date)}</Text>
                {group.entries.map(entry => (
                  <Pressable
                    key={entry.id}
                    accessibilityRole="button"
                    onPress={() => {
                      if (deleteMode) {
                        toggleSelect(entry.id);
                      } else {
                        navigation.navigate('RecipeDetail', {
                          recipe: { id: entry.recipe_id, name: entry.recipes?.name ?? '' },
                        });
                      }
                    }}
                    style={({ pressed }) => [styles.recipeRow, pressed && { opacity: 0.75 }]}
                  >
                    {deleteMode && (
                      <Ionicons
                        name={selectedIds.has(entry.id) ? 'checkbox' : 'square-outline'}
                        size={24}
                        color={selectedIds.has(entry.id) ? colors.accent : colors.textMuted}
                        style={styles.checkboxIcon}
                      />
                    )}
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
                ))}
              </View>
            ))
          )}
        </ScrollView>
      </View>

      {!deleteMode && (
        <View style={shared.fabArea} pointerEvents="box-none">
          <Animated.View style={subButtonStyle(2)}>
            <Pressable style={shared.fabSubButton} onPress={enterDeleteMode}>
              <Image source={require('../assets/trashcan-icon.png')} style={styles.fabIcon} />
            </Pressable>
          </Animated.View>
          <Animated.View style={subButtonStyle(1)}>
            <Pressable style={shared.fabSubButton} onPress={() => {}}>
              <Image source={require('../assets/calendar-icon.png')} style={styles.fabIcon} />
            </Pressable>
          </Animated.View>
          <Pressable
            style={({ pressed }) => [shared.fabMainButton, pressed && shared.pressed]}
            onPress={toggleMenu}
            accessibilityRole="button"
            accessibilityLabel="Open menu"
          >
            <Image source={require('../assets/icon_drei_punkte.png')} style={styles.fabIcon} />
          </Pressable>
        </View>
      )}

      {deleteMode && (
        <View style={[styles.actionBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <Pressable
            style={({ pressed }) => [shared.pillButton, styles.backBtn, pressed && shared.pressed]}
            onPress={exitDeleteMode}
            accessibilityRole="button"
          >
            <Text style={[shared.typography.sub1, styles.backBtnLabel]}>Back</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [shared.pillButton, styles.deleteBtn, pressed && shared.pressed]}
            onPress={handleDelete}
            accessibilityRole="button"
          >
            <Text style={[shared.typography.sub1, styles.deleteBtnLabel]}>Delete</Text>
          </Pressable>
        </View>
      )}
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
  recipeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  checkboxIcon: {
    marginRight: 10,
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
  actionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: colors.cream,
  },
  backBtn: {
    flex: 1,
    paddingVertical: 18,
    backgroundColor: colors.white,
  },
  backBtnLabel: {
    color: colors.text,
  },
  deleteBtn: {
    flex: 1,
    paddingVertical: 18,
    backgroundColor: colors.danger,
  },
  deleteBtnLabel: {
    color: colors.white,
  },
});
