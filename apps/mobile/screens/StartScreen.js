import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image as SvgIcon } from 'expo-image';
import AppHeader from '../components/AppHeader';
import ScreenShell from '../components/ScreenShell';
import { useAuth } from '../providers/AuthProvider';
import shared from '../sharedStyles';
import { colors } from '../theme';
import { aggregateIngredients, formatQuantity } from '../utils/aggregateIngredients';
import { supabase } from '../utils/supabase';

const placeholderImage = require('../assets/no-picture.png');

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

export default function StartScreen({ navigation }) {
  const { user } = useAuth();
  const displayName = user?.user_metadata?.display_name ?? null;
  const [upcoming, setUpcoming] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rangeKey, setRangeKey] = useState('2d');
  const [ingredients, setIngredients] = useState(null);
  const [fridgeLoading, setFridgeLoading] = useState(true);
  const [rangePickerOpen, setRangePickerOpen] = useState(false);
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
      .select('scheduled_for, recipes!inner(recipe_ingredients(quantity, unit, ingredients(name)))')
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

      load();
      loadFridgeRef.current?.();
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
        <Text style={shared.pageTitle}>
          {displayName ? `Hello, ${displayName}!` : 'Hello!'}
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
            <Image
              source={upcoming.imageUrl ? { uri: upcoming.imageUrl } : placeholderImage}
              style={styles.cardImage}
              resizeMode="cover"
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
            Everything to buy for the next
          </Text>
          <Pressable
            onPress={() => setRangePickerOpen(true)}
            style={({ pressed }) => [styles.rangePill, pressed && styles.pressed]}
          >
            <SvgIcon source={require('../assets/chevron_down_icon.svg')} style={{ width: 18, height: 18 }} contentFit="contain" />
            <Text style={[shared.typography.sub2, styles.rangePillText]}>{currentRange.label}</Text>
          </Pressable>
        </View>

        <View style={styles.fridgeCard}>
          {fridgeLoading ? (
            <ActivityIndicator color={colors.accent} />
          ) : ingredients.length === 0 ? (
            <Text style={styles.fridgeEmpty}>No ingredients to buy</Text>
          ) : (
            ingredients.map((it) => (
              <View key={`${it.name}|${it.unit ?? ''}`} style={styles.ingRow}>
                <Text style={[shared.typography.body, styles.ingName]}>{`•  ${it.name}`}</Text>
                <Text style={[shared.typography.body, styles.ingQty]}>
                  {[formatQuantity(it.quantity), it.unit].filter(Boolean).join(' ')}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <Modal
        visible={rangePickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setRangePickerOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setRangePickerOpen(false)}>
          <Pressable style={styles.menuCard} onPress={() => {}}>
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
          </Pressable>
        </Pressable>
      </Modal>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    alignSelf: 'stretch',
  },
  scroll: {
    paddingTop: 8,
    paddingBottom: 32,
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
    color: colors.text,
  },
  ingQty: {
    color: colors.text,
  },
  fridgeEmpty: {
    color: colors.white,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 24,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuCard: {
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
});
