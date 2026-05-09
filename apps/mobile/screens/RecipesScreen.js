import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import ScreenShell from '../components/ScreenShell';
import { useRecipes } from '../providers/RecipesProvider';
import shared from '../sharedStyles';
import { colors } from '../theme';

const placeholderImage = require('../assets/no-picture.png');

export default function RecipesScreen({ navigation }) {
  const {
    recipes,
    isLoading,
    errorMessage,
    filterModes,
    loadRecipesForMode,
  } = useRecipes();

  useEffect(() => {
    loadRecipesForMode(filterModes.MINE);
  }, [filterModes.MINE, loadRecipesForMode]);

  const pageTitle = 'Your Recipes';
  const emptyText = 'No own recipes yet.';

  const renderListHeader = () => (
    <View style={styles.pageHeaderRow}>
      <Text style={shared.pageTitle}>{pageTitle}</Text>
    </View>
  );

  const renderRecipeCard = ({ item }) => (
    <Pressable
      onPress={() => navigation.navigate('RecipeDetail', { recipe: { id: item.id, name: item.name } })}
      style={({ pressed }) => pressed && styles.pressed}
    >
      <View style={styles.recipeCard}>
        <Image
          source={item.imageUrl ? { uri: item.imageUrl } : placeholderImage}
          style={styles.recipeCardImage}
          resizeMode="cover"
        />
        <View style={styles.recipeCardContent}>
          <Text style={styles.recipeTitle} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.recipeDate}>Added: {item.dateLabel}</Text>
          <Text style={styles.recipeAuthor}>{item.authorLabel}</Text>
        </View>
      </View>
    </Pressable>
  );

  return (
    <ScreenShell
      navigation={navigation}
      activeTab="recipes"
    >
      <View style={styles.content}>
        <FlatList
          data={isLoading || errorMessage ? [] : recipes}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderRecipeCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={renderListHeader}
          ListEmptyComponent={
            isLoading ? (
              <Text style={styles.infoText}>Loading recipes...</Text>
            ) : errorMessage ? (
              <Text style={styles.errorText}>{errorMessage}</Text>
            ) : (
              <Text style={styles.infoText}>{emptyText}</Text>
            )
          }
        />
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Add recipe"
        onPress={() => navigation.navigate('AddRecipe')}
        style={({ pressed }) => [shared.fabArea, shared.fabMainButton, pressed && shared.pressed]}
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
    paddingTop: 8,
    paddingBottom: 96,
    gap: 16,
  },
  pageHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  recipeCard: {
    height: 126,
    borderRadius: 30,
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
  recipeCardImage: {
    width: 110,
    height: '100%',
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
    fontSize: 24,
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
  pressed: {
    opacity: 0.8,
  },
});
