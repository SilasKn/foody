import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import ScreenShell from '../components/ScreenShell';
import shared from '../sharedStyles';
import { colors } from '../theme';
import { supabase } from '../utils/supabase';

const placeholderImage = require('../assets/no-picture.png');

function todayIso() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function formatUpcomingDate(isoDate) {
  const [y, m, d] = isoDate.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  const dayShort = dt.toLocaleDateString('de-DE', { weekday: 'short' }).replace('.', '');
  return `${dayShort} ${String(d).padStart(2, '0')}.${String(m).padStart(2, '0')}.`;
}

export default function StartScreen({ navigation }) {
  const [upcoming, setUpcoming] = useState(null);
  const [loading, setLoading] = useState(true);

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
      return () => { active = false; };
    }, [])
  );

  return (
    <ScreenShell navigation={navigation} activeTab="home">
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={shared.pageTitle}>Home</Text>

        <Text style={styles.sectionTitle}>Upcoming</Text>
        <Text style={styles.sectionSubtitle}>Next scheduled recipe</Text>

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
              <Text style={styles.cardName} numberOfLines={1}>{upcoming.recipes?.name ?? '—'}</Text>
              <Text style={styles.cardDate}>Scheduled for: {formatUpcomingDate(upcoming.scheduled_for)}</Text>
            </View>
          </Pressable>
        ) : (
          <Text style={styles.emptyText}>Nothing scheduled yet.</Text>
        )}
      </ScrollView>
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
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    textDecorationLine: 'underline',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 14,
  },
  loader: {
    marginTop: 24,
  },
  emptyText: {
    fontSize: 15,
    color: colors.textMuted,
    fontStyle: 'italic',
    marginTop: 8,
  },
  card: {
    height: 126,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    overflow: 'hidden',
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOpacity: 0.16,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
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
    fontSize: 17,
    fontWeight: '500',
    color: colors.text,
  },
  cardName: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    lineHeight: 36,
  },
  pressed: {
    opacity: 0.8,
  },
});
