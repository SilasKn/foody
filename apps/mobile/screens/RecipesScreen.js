import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import ScreenShell from '../components/ScreenShell';
import { useRecipes } from '../providers/RecipesProvider';
import { colors } from '../theme';

export default function RecipesScreen({ navigation }) {
  const { recipes, isLoading, errorMessage, loadMyRecipes } = useRecipes();

  useEffect(() => {
    loadMyRecipes();
  }, [loadMyRecipes]);

  const renderRecipeCard = ({ item }) => (
    <View style={styles.recipeCard}>
      <View style={styles.recipeCardRail} />
      <View style={styles.recipeCardContent}>
        <Text style={styles.recipeDate}>{item.dateLabel}</Text>
        <Text style={styles.recipeTitle} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.recipeAuthor}>{item.authorLabel}</Text>
      </View>
    </View>
  );

  return (
    <ScreenShell
      navigation={navigation}
      title="Your recipes"
      activeTab="recipes"
    >
      <View style={styles.content}>
        {isLoading ? (
          <Text style={styles.infoText}>Loading recipes...</Text>
        ) : errorMessage ? (
          <Text style={styles.errorText}>{errorMessage}</Text>
        ) : recipes.length === 0 ? (
          <Text style={styles.infoText}>No recipes yet.</Text>
        ) : (
          <FlatList
            data={recipes}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderRecipeCard}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Add recipe"
        onPress={() => navigation.navigate('AddRecipe')}
        style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
      >
        <Ionicons name="add" size={26} color={colors.text} />
      </Pressable>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  content: {
    alignSelf: 'stretch',
    flex: 1,
  },
  listContent: {
    paddingTop: 4,
    paddingBottom: 96,
    gap: 16,
  },
  recipeCard: {
    height: 126,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#fff',
    overflow: 'hidden',
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOpacity: 0.16,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  recipeCardRail: {
    width: 34,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    backgroundColor: '#fff',
  },
  recipeCardContent: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 18,
    gap: 4,
  },
  recipeDate: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '500',
  },
  recipeTitle: {
    color: colors.text,
    fontSize: 34,
    fontWeight: '700',
    lineHeight: 36,
  },
  recipeAuthor: {
    color: colors.text,
    fontSize: 14,
    opacity: 0.75,
    fontWeight: '600',
  },
  infoText: {
    color: colors.text,
    opacity: 0.8,
    marginTop: 10,
    fontSize: 15,
  },
  errorText: {
    color: '#B00020',
    marginTop: 10,
    fontSize: 15,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accent,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  fabPressed: {
    opacity: 0.85,
  },
});
