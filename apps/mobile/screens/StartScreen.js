import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image as SvgIcon } from 'expo-image';
import AppHeader from '../components/AppHeader';
import RecipeImage from '../components/RecipeImage';
import ScreenShell from '../components/ScreenShell';
import { useAuth } from '../providers/AuthProvider';
import shared from '../sharedStyles';
import { colors } from '../theme';
import { aggregateIngredients, formatQuantity } from '../utils/aggregateIngredients';
import { fetchSignedImageUrls } from '../utils/fetchSignedImageUrls';
import { supabase } from '../utils/supabase';

const RANGE_OPTIONS = [
  { key: 'today', label: 'Today', days: 1 },
  { key: '2d', label: '2 days', days: 2 },
  { key: '1w', label: '1 week', days: 7 },
  { key: '2w', label: '2 weeks', days: 14 },
];

function todayIso() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function addDaysIso(iso, n) {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(y, m - 1, d + n);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
}

function formatUpcomingDate(isoDate) {
  const [y, m, d] = isoDate.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  const dayShort = dt.toLocaleDateString('de-DE', { weekday: 'short' }).replace('.', '');
  return `${dayShort} ${String(d).padStart(2, '0')}.${String(m).padStart(2, '0')}.`;
}

function formatLastEaten(isoDate) {
  if (!isoDate) return null;
  const [year, month, day] = isoDate.split('-');
  return `${day}.${month}.${year}`;
}

export default function StartScreen({ navigation }) {
  const { user } = useAuth();
  const displayName = user?.user_metadata?.display_name ?? null;
  const [upcoming, setUpcoming] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rangeKey, setRangeKey] = useState('2d');
  const [ingredients, setIngredients] = useState(null);
  const [fridgeLoading, setFridgeLoading] = useState(true);
  const [rangePickerOpen, setRangePickerOpen] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [recsLoading, setRecsLoading] = useState(true);
  const fridgeRequestId = useRef(0);

  const currentRange = RANGE_OPTIONS.find((o) => o.key === rangeKey) ?? RANGE_OPTIONS[1];

  const loadFridge = useCallback(async () => {
    if (!user) {
      setIngredients([]);
      setFridgeLoading(false);
      return;
    }
    const reqId = ++fridgeRequestId.current;
    setFridgeLoading(true);
    const start = todayIso();
    const end = addDaysIso(start, currentRange.days);
    const { data } = await supabase
      .from('recipe_schedule')
      .select('scheduled_for, servings, recipes!inner(servings, recipe_ingredients(quantity, unit, ingredients(name)))')
      .eq('user_id', user.id)
      .gte('scheduled_for', start)
      .lt('scheduled_for', end);

    if (reqId !== fridgeRequestId.current) return;
    setIngredients(aggregateIngredients(data ?? []));
    setFridgeLoading(false);
  }, [user, currentRange.days]);

  const loadFridgeRef = useRef(loadFridge);
  loadFridgeRef.current = loadFridge;

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function load() {
        setLoading(true);
        const { data } = await supabase
          .from('recipe_schedule')
          .select('id, scheduled_for, scheduled_as, recipe_id, recipes(name)')
          .gte('scheduled_for', todayIso())
          .order('scheduled_for', { ascending: true })
          .limit(1)
          .single();

        if (!active) return;

        if (!data) {
          setUpcoming(null);
          setLoading(false);
          return;
        }

        let imageUrl = null;
        const { data: imgRow } = await supabase
          .from('recipe_images')
          .select('file_path')
          .eq('recipe_id', data.recipe_id)
          .limit(1)
          .single();

        if (imgRow) {
          const { data: signed } = await supabase.storage
            .from('recipe_images')
            .createSignedUrl(imgRow.file_path, 3600);
          imageUrl = signed?.signedUrl ?? null;
        }

        if (active) {
          setUpcoming({ ...data, imageUrl });
          setLoading(false);
        }
      }

      async function loadRecommendations() {
        if (!user) {
          setRecommendations([]);
          setRecsLoading(false);
          return;
        }
        setRecsLoading(true);

        const { data } = await supabase
          .from('recipes')
          .select('id, name, last_eaten')
          .eq('author', user.id)
          .eq('draft', false)
          .order('last_eaten', { ascending: true, nullsFirst: true })
          .limit(10);

        if (!active) return;

        const recipes = data ?? [];
        const signedMap = await fetchSignedImageUrls(recipes.map((r) => r.id));
        if (!active) return;

        setRecommendations(
          recipes.map((r) => ({
            id: r.id,
            name: r.name,
            lastEaten: r.last_eaten,
            imageUrl: signedMap[r.id] ?? null,
          }))
        );
        setRecsLoading(false);
      }

      load();
      loadFridgeRef.current?.();
      loadRecommendations();
      return () => { active = false; };
    }, [])
  );

  useEffect(() => {
    loadFridge();
  }, [loadFridge]);

  return (
    <ScreenShell navigation={navigation} activeTab="home">
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <AppHeader navigation={navigation} />
        <Text style={[shared.pageTitle, styles.greeting]}>
          {displayName ? `Hello, ${displayName}!` : 'Hello!'}
        </Text>
        <Text style={[shared.typography.bodySmall, styles.dateSubtitle]}>
          {new Date().toLocaleDateString('en-GB', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </Text>

        <Text style={[shared.typography.h3, styles.sectionSubtitle]}>Next scheduled recipe</Text>

        {loading ? (
          <ActivityIndicator color={colors.accent} style={styles.loader} />
        ) : upcoming ? (
          <Pressable
            onPress={() => navigation.navigate('RecipeDetail', {
              recipe: { id: upcoming.recipe_id, name: upcoming.recipes?.name ?? '' },
            })}
            style={({ pressed }) => [styles.card, pressed && styles.pressed]}
          >
            <RecipeImage
              imageUrl={upcoming.imageUrl}
              style={styles.cardImage}
            />
            <View style={styles.cardContent}>
              <Text style={[shared.typography.h3, styles.cardName]} numberOfLines={1}>{upcoming.recipes?.name ?? '—'}</Text>
              <Text style={[shared.typography.bodySmall, styles.cardDate]}>Scheduled for: {formatUpcomingDate(upcoming.scheduled_for)}</Text>
            </View>
          </Pressable>
        ) : (
          <Text style={[shared.typography.body, styles.emptyText]}>Nothing scheduled yet.</Text>
        )}

        <View style={styles.fridgeSubtitleRow}>
          <Text style={[shared.typography.h3, styles.fridgeSubtitleInline]}>
            Everything you need to buy
          </Text>
          <View style={styles.rangeDropdownWrap}>
            <Pressable
              onPress={() => setRangePickerOpen(prev => !prev)}
              style={({ pressed }) => [styles.rangePill, pressed && styles.pressed]}
            >
              <SvgIcon source={require('../assets/chevron_down_icon.svg')} style={{ width: 18, height: 18 }} contentFit="contain" />
              <Text style={[shared.typography.sub2, styles.rangePillText]}>{currentRange.label}</Text>
            </Pressable>
            {rangePickerOpen && (
              <View style={styles.menuCard}>
                {RANGE_OPTIONS.map((opt) => (
                  <Pressable
                    key={opt.key}
                    onPress={() => {
                      setRangeKey(opt.key);
                      setRangePickerOpen(false);
                    }}
                    style={({ pressed }) => [
                      styles.menuItem,
                      opt.key === rangeKey && styles.menuItemActive,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={shared.typography.body}>{opt.label}</Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        </View>

        <View style={styles.fridgeCard}>
          {fridgeLoading ? (
            <ActivityIndicator color={colors.accent} />
          ) : ingredients.length === 0 ? (
            <View style={styles.fridgeEmptyContainer}>
              <Text style={styles.fridgeEmpty}>No ingredients to buy</Text>
              <Image
                source={require('../assets/created_images/nothing_to_buy.png')}
                style={styles.fridgeEmptyImage}
                resizeMode="contain"
              />
            </View>
          ) : (
            ingredients.map((it) => (
              <View key={`${it.name}|${it.unit ?? ''}`} style={styles.ingRow}>
                <Text style={[shared.typography.body, styles.ingName]}>{`•  ${it.name}`}</Text>
                <Text style={[shared.typography.body, styles.ingQty]}>
                  {[formatQuantity(it.quantity), it.unit === 'unit' && it.quantity > 1 ? 'units' : it.unit].filter(Boolean).join(' ')}
                </Text>
              </View>
            ))
          )}
        </View>

        {(recsLoading || recommendations.length > 0) && (
          <>
            <Text style={[shared.typography.h3, styles.recsSubtitle]}>Try again?</Text>

            {recsLoading ? (
              <ActivityIndicator color={colors.accent} style={styles.loader} />
            ) : (
              <FlatList
                data={recommendations}
                keyExtractor={(item) => String(item.id)}
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.recsFlatList}
                contentContainerStyle={styles.recsFlatListContent}
                renderItem={({ item }) => (
                  <Pressable
                    onPress={() => navigation.navigate('RecipeDetail', {
                      recipe: { id: item.id, name: item.name },
                    })}
                    style={({ pressed }) => [styles.recCard, pressed && styles.pressed]}
                  >
                    <RecipeImage
                      imageUrl={item.imageUrl}
                      style={styles.recCardImage}
                    />
                    <View style={styles.recCardTextArea}>
                      <Text style={[shared.typography.sub1, styles.recCardName]} numberOfLines={1}>
                        {item.name}
                      </Text>
                      {item.lastEaten ? (
                        <Text style={[shared.typography.bodySmall, styles.recCardDate]} numberOfLines={1}>
                          last scheduled on: {formatLastEaten(item.lastEaten)}
                        </Text>
                      ) : null}
                    </View>
                  </Pressable>
                )}
              />
            )}
          </>
        )}
      </ScrollView>

    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    alignSelf: 'stretch',
    marginHorizontal: -18,
  },
  scroll: {
    paddingTop: 8,
    paddingBottom: 32,
    paddingHorizontal: 18,
  },
  greeting: {
    marginBottom: 2,
  },
  dateSubtitle: {
    color: colors.textMuted,
    marginBottom: 16,
  },
  sectionTitle: {
    color: colors.text,
    textDecorationLine: 'underline',
    marginBottom: 4,
    marginTop: 10,
  },
  sectionSubtitle: {
    color: colors.textMuted,
    marginBottom: 14,
  },
  loader: {
    marginTop: 24,
  },
  emptyText: {
    color: colors.textMuted,
    fontStyle: 'italic',
    marginTop: 8,
  },
  card: {
    height: 126,
    borderRadius: 30,
    backgroundColor: colors.white,
    overflow: 'hidden',
    flexDirection: 'row',
    elevation: 4,
  },
  cardImage: {
    width: 110,
    height: '100%',
  },
  cardContent: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 18,
    gap: 4,
  },
  cardDate: {
    color: colors.text,
  },
  cardName: {
    color: colors.text,
  },
  pressed: {
    opacity: 0.8,
  },
  fridgeTitle: {
    marginTop: 28,
  },
  fridgeSubtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 14,
    marginTop: 14
  },
  fridgeSubtitleInline: {
    color: colors.textMuted,
    flexShrink: 1,
  },
  rangeDropdownWrap: {
    position: 'relative',
    zIndex: 10,
  },
  rangePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cream,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  rangePillText: {
    color: colors.text,
  },
  fridgeCard: {
    backgroundColor: colors.accent2,
    color: colors.white,
    borderRadius: 24,
    padding: 18,
    minHeight: 120,
    marginTop: 4,
    elevation: 4,
  },
  ingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    gap: 12,
  },
  ingName: {
    flex: 1,
    color: colors.white,
  },
  ingQty: {
    color: colors.white,
  },
  fridgeEmptyContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  fridgeEmpty: {
    color: colors.white,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  fridgeEmptyImage: {
    width: 80,
    height: 80,
    marginTop: 12,
  },
  menuCard: {
    position: 'absolute',
    top: 40,
    right: 0,
    backgroundColor: colors.white,
    borderRadius: 16,
    paddingVertical: 8,
    minWidth: 180,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  menuItem: {
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  menuItemActive: {
    backgroundColor: colors.pillActive,
  },
  recsSubtitle: {
    color: colors.textMuted,
    marginTop: 20,
    marginBottom: 14,
  },
  recsFlatList: {
    marginHorizontal: -18,
  },
  recsFlatListContent: {
    paddingHorizontal: 18,
    gap: 12,
  },
  recCard: {
    width: 160,
    borderRadius: 16,
    backgroundColor: colors.white,
    overflow: 'hidden',
    shadowColor: colors.border,
    shadowOpacity: 0.16,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  recCardImage: {
    width: 160,
    height: 120,
  },
  recCardTextArea: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 2,
  },
  recCardName: {
    color: colors.text,
  },
  recCardDate: {
    color: colors.textMuted,
  },
});
