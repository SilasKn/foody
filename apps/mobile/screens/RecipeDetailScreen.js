import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image as SvgIcon } from 'expo-image';
import RecipeImage from '../components/RecipeImage';
import ScreenShell from '../components/ScreenShell';
import shared from '../sharedStyles';
import { colors } from '../theme';
import { supabase } from '../utils/supabase';

const editIcon = require('../assets/edit_icon.svg');
const calendarIcon = require('../assets/calendar_icon_black.svg');
const personIcon = require('../assets/person_icon.svg');

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function formatScheduleDate(isoDate) {
  const [year, month, day] = isoDate.split('-');
  return `${day}.${month}.${year.slice(2)}`;
}

export default function RecipeDetailScreen({ route, navigation }) {
  const { recipe } = route.params;
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showScaled, setShowScaled] = useState(!!recipe.scheduledServings);
  const [servingsPickerOpen, setServingsPickerOpen] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function load() {
        setLoading(true);
        const [
          { data: rec,       error: recErr },
          { data: ings,      error: ingsErr },
          { data: imgData,   error: imgErr },
          { data: schedules },
        ] = await Promise.all([
          supabase.from('recipes').select('name, description, created_at, servings').eq('id', recipe.id).single(),
          supabase.from('recipe_ingredients').select('quantity, unit, ingredients(name)').eq('recipe_id', recipe.id),
          supabase.from('recipe_images').select('file_path').eq('recipe_id', recipe.id).maybeSingle(),
          supabase.from('recipe_schedule').select('id, scheduled_for, scheduled_as').eq('recipe_id', recipe.id).order('scheduled_for', { ascending: true }),
        ]);

        let imageUrl = null;
        if (imgData?.file_path) {
          const { data: signed } = await supabase.storage
            .from('recipe_images')
            .createSignedUrl(imgData.file_path, 3600);
          imageUrl = signed?.signedUrl ?? null;
        }

        if (active) {
          setDetails({ ...rec, ingredients: ings ?? [], schedules: schedules ?? [], imageUrl, imagePath: imgData?.file_path ?? null });
          setLoading(false);
        }
      }

      load();
      return () => { active = false; };
    }, [recipe.id])
  );

  const onDeleteSchedule = async (id) => {
    setDetails(prev => ({ ...prev, schedules: prev.schedules.filter(s => s.id !== id) }));
    const { error } = await supabase.from('recipe_schedule').delete().eq('id', id);
    if (error) Alert.alert('Error', 'Could not delete schedule entry.');
  };

  const onSchedulePress = () => {
    if (!details) return;
    navigation.navigate('ScheduleRecipe', {
      recipe: { id: recipe.id, name: details.name, imageUrl: details.imageUrl ?? null, servings: details.servings ?? 1 },
    });
  };

  const onEditPress = () => {
    if (!details) return;
    navigation.navigate('AddRecipe', {
      recipe: {
        id: recipe.id,
        name: details.name,
        description: details.description ?? '',
        servings: details.servings ?? 1,
        ingredients: details.ingredients.map((i) => ({
          name: i.ingredients?.name ?? '',
          quantity: i.quantity,
          unit: i.unit,
        })),
        existingImagePath: details.imagePath,
        existingImageUrl: details.imageUrl,
      },
    });
  };

  return (
    <ScreenShell navigation={navigation} activeTab="recipes">
      <View style={shared.outerContainer}>
        <ScrollView
          style={shared.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            <View style={styles.imageSection}>
              <View style={styles.imageWrapper}>
                <RecipeImage
                  imageUrl={details?.imageUrl}
                  style={styles.image}
                />
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Back"
                onPress={() => navigation.goBack()}
                hitSlop={10}
                style={({ pressed }) => [shared.circleButton, styles.backButton, pressed && shared.pressed]}
              >
                <SvgIcon source={require('../assets/arrow_back_icon.svg')} style={[{ width: 24, height: 24 }, shared.iconOnAccent]} contentFit="contain" />
              </Pressable>
            </View>

            <View style={styles.divider} />

            <View style={styles.cardContent}>
              {loading ? (
                <ActivityIndicator size="large" color={colors.accent} style={styles.loader} />
              ) : (
                <>
                  <Text style={[shared.typography.h2, styles.recipeName]}>{details.name}</Text>
                  <View style={styles.metaStrip}>
                    <View style={styles.metaChip}>
                      <SvgIcon source={calendarIcon} style={styles.metaChipIcon} contentFit="contain" />
                      <Text style={[shared.typography.sub2, styles.metaChipText]}>
                        {formatDate(details.created_at)}
                      </Text>
                    </View>
                    {details.servings != null && (
                      <View style={styles.metaChip}>
                        <SvgIcon source={personIcon} style={styles.metaChipIcon} contentFit="contain" />
                        <Text style={[shared.typography.sub2, styles.metaChipText]}>
                          {details.servings} {details.servings === 1 ? 'Serving' : 'Servings'}
                        </Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.sectionDivider} />

                  <View style={styles.section}>
                    <Text style={[shared.typography.h3, styles.sectionLabel]}>Description</Text>
                    {details.description ? (
                      <Text style={[shared.typography.body, styles.bodyText]}>{details.description}</Text>
                    ) : (
                      <Text style={[shared.typography.body, styles.placeholderText]}>No description.</Text>
                    )}
                  </View>

                  <View style={styles.section}>
                    <View style={styles.ingredientsHeader}>
                      <Text style={[shared.typography.h3, styles.sectionLabel, { marginBottom: 0 }]}>Ingredients</Text>
                      {recipe.scheduledServings != null && details.servings && (
                        <View style={styles.servingsDropdownWrap}>
                          <Pressable
                            accessibilityRole="button"
                            accessibilityLabel="Select servings mode"
                            onPress={() => setServingsPickerOpen(prev => !prev)}
                            style={({ pressed }) => [styles.servingsPill, pressed && shared.pressed]}
                          >
                            <SvgIcon source={require('../assets/chevron_down_icon.svg')} style={{ width: 18, height: 18 }} contentFit="contain" />
                            <Text style={[shared.typography.sub2, styles.servingsPillText]}>
                              {showScaled ? `Scheduled (${recipe.scheduledServings})` : `Recipe (${details.servings})`}
                            </Text>
                          </Pressable>
                          {servingsPickerOpen && (
                            <View style={styles.servingsMenuCard}>
                              <Pressable
                                accessibilityRole="button"
                                onPress={() => { setShowScaled(false); setServingsPickerOpen(false); }}
                                style={({ pressed }) => [styles.servingsMenuItem, !showScaled && styles.servingsMenuItemActive, pressed && shared.pressed]}
                              >
                                <Text style={shared.typography.body}>Recipe ({details.servings})</Text>
                              </Pressable>
                              <Pressable
                                accessibilityRole="button"
                                onPress={() => { setShowScaled(true); setServingsPickerOpen(false); }}
                                style={({ pressed }) => [styles.servingsMenuItem, showScaled && styles.servingsMenuItemActive, pressed && shared.pressed]}
                              >
                                <Text style={shared.typography.body}>Scheduled ({recipe.scheduledServings})</Text>
                              </Pressable>
                            </View>
                          )}
                        </View>
                      )}
                    </View>

                    {details.ingredients.length === 0 ? (
                      <Text style={[shared.typography.body, styles.placeholderText]}>No ingredients listed.</Text>
                    ) : (
                      details.ingredients.map((item, index) => {
                        const scale = showScaled && recipe.scheduledServings && details.servings
                          ? recipe.scheduledServings / details.servings
                          : 1;
                        const qty = item.quantity && scale !== 1
                          ? Math.round(item.quantity * scale * 100) / 100
                          : item.quantity;
                        return (
                          <View key={index} style={styles.ingredientRow}>
                            <Text style={[shared.typography.body, styles.ingredientText]}>
                              {[qty, item.unit, item.ingredients?.name].filter(Boolean).join(' ')}
                            </Text>
                          </View>
                        );
                      })
                    )}
                  </View>

                  <View style={styles.sectionDivider} />

                  <View style={styles.section}>
                    <Text style={[shared.typography.h3, styles.sectionLabel]}>Scheduled for:</Text>
                    {details.schedules.length === 0 ? (
                      <Text style={[shared.typography.body, styles.placeholderText]}>Not scheduled yet.</Text>
                    ) : (
                      details.schedules.map((entry) => (
                        <View key={entry.id} style={styles.scheduleEntryRow}>
                          <Text style={[shared.typography.body, styles.ingredientText]}>
                            — {formatScheduleDate(entry.scheduled_for)} as {entry.scheduled_as}
                          </Text>
                          <Pressable
                            accessibilityRole="button"
                            accessibilityLabel="Delete schedule entry"
                            onPress={() => onDeleteSchedule(entry.id)}
                            hitSlop={8}
                            style={({ pressed }) => pressed && { opacity: 0.5 }}
                          >
                            <SvgIcon source={require('../assets/close_icon_grey.svg')} style={{ width: 16, height: 16 }} contentFit="contain" />
                          </Pressable>
                        </View>
                      ))
                    )}
                  </View>

                  <View style={styles.actionsRow}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Edit recipe"
                      onPress={onEditPress}
                      style={({ pressed }) => [styles.editButton, pressed && shared.pressed]}
                    >
                      <SvgIcon source={editIcon} style={styles.editIcon} contentFit="contain" />
                    </Pressable>

                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Schedule recipe"
                      onPress={onSchedulePress}
                      style={({ pressed }) => [shared.pillButton, styles.scheduleButton, pressed && shared.pressed]}
                    >
                      <Text style={[shared.typography.sub1, styles.scheduleButtonText]}>Schedule</Text>
                    </Pressable>
                  </View>
                </>
              )}
            </View>
          </View>
        </ScrollView>
      </View>

    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 24,
  },
  imageSection: {
    position: 'relative',
  },
  imageWrapper: {
    height: 220,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
    backgroundColor: colors.imagePlaceholderBg,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  backButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 48,
    height: 48,
    borderRadius: 28,
    backgroundColor: colors.accent,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 28,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
    overflow: 'hidden',
    marginVertical: 20,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  cardContent: {
    padding: 24,
  },
  loader: {
    marginVertical: 32,
  },
  recipeName: {
    color: colors.text,
    marginBottom: 4,
  },
  metaStrip: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.imagePlaceholderBg,
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  metaChipIcon: {
    width: 14,
    height: 14,
    marginRight: 5,
    tintColor: colors.textMuted,
  },
  metaChipText: {
    color: colors.text,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginBottom: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionLabel: {
    color: colors.text,
    marginBottom: 8,
  },
  bodyText: {
    color: colors.text,
  },
  placeholderText: {
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  ingredientsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  servingsPill: {
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
  servingsPillText: {
    color: colors.text,
  },
  servingsDropdownWrap: {
    position: 'relative',
    zIndex: 10,
  },
  servingsMenuCard: {
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
  servingsMenuItem: {
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  servingsMenuItemActive: {
    backgroundColor: colors.pillActive,
  },
  ingredientRow: {
    paddingVertical: 4,
  },
  scheduleEntryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  ingredientText: {
    color: colors.text,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  scheduleButton: {
    backgroundColor: colors.accent,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  scheduleButtonText: {
    color: colors.white,
  },
  editButton: {
    width: 48,
    height: 48,
    borderRadius: 28,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  editIcon: {
    width: 24,
    height: 24,
  },
});
