import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import ScreenShell from '../components/ScreenShell';
import { colors } from '../theme';
import { supabase } from '../utils/supabase';

const placeholderImage = require('../assets/no-picture.png');

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

export default function RecipeDetailScreen({ route, navigation }) {
  const { recipe } = route.params;
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from('recipes').select('name, description, created_at').eq('id', recipe.id).single(),
      supabase.from('recipe_ingredients').select('quantity, unit, ingredients(name)').eq('recipe_id', recipe.id),
    ]).then(([{ data: rec }, { data: ings }]) => {
      setDetails({ ...rec, ingredients: ings ?? [] });
      setLoading(false);
    });
  }, [recipe.id]);

  return (
    <ScreenShell navigation={navigation} activeTab="recipes">
      <View style={styles.outerContainer}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            <View style={styles.imageSection}>
              <View style={styles.imageWrapper}>
                <Image source={placeholderImage} style={styles.image} resizeMode="cover" />
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Back"
                onPress={() => navigation.goBack()}
                hitSlop={10}
                style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
              >
                <Ionicons name="arrow-back" size={24} color={colors.text} />
              </Pressable>
            </View>

            <View style={styles.divider} />

            <View style={styles.cardContent}>
              {loading ? (
                <ActivityIndicator size="large" color={colors.accent} style={styles.loader} />
              ) : (
                <>
                  <Text style={styles.recipeName}>{details.name}</Text>
                  <Text style={styles.dateText}>Created {formatDate(details.created_at)}</Text>

                  <View style={styles.sectionDivider} />

                  <View style={styles.section}>
                    <Text style={styles.sectionLabel}>Description</Text>
                    {details.description ? (
                      <Text style={styles.bodyText}>{details.description}</Text>
                    ) : (
                      <Text style={styles.placeholderText}>No description.</Text>
                    )}
                  </View>

                  <View style={styles.section}>
                    <Text style={styles.sectionLabel}>Ingredients</Text>
                    {details.ingredients.length === 0 ? (
                      <Text style={styles.placeholderText}>No ingredients listed.</Text>
                    ) : (
                      details.ingredients.map((item, index) => (
                        <View key={index} style={styles.ingredientRow}>
                          <Text style={styles.ingredientText}>
                            {[item.quantity, item.unit, item.ingredients?.name].filter(Boolean).join(' ')}
                          </Text>
                        </View>
                      ))
                    )}
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
  outerContainer: {
    flex: 1,
    alignSelf: 'stretch',
  },
  scroll: {
    flex: 1,
  },
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
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  backButtonPressed: {
    opacity: 0.85,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: colors.border,
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
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  dateText: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 16,
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
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  bodyText: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
  },
  placeholderText: {
    fontSize: 15,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  ingredientRow: {
    paddingVertical: 4,
  },
  ingredientText: {
    fontSize: 15,
    color: colors.text,
  },
});
