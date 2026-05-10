import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { FlatList, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import ScreenShell from '../components/ScreenShell';
import { useRecipes } from '../providers/RecipesProvider';
import shared from '../sharedStyles';
import { colors } from '../theme';

const placeholderImage = require('../assets/no-picture.png');
const searchIcon = require('../assets/search-icon.png');

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

  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const pageTitle = 'Your Recipes';
  const emptyText = 'No own recipes yet.';

  const filteredRecipes = searchQuery.trim()
    ? recipes.filter(r => r.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : recipes;

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
          <Text style={[shared.typography.sub1, styles.recipeTitle]} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={[shared.typography.sub2, styles.recipeDate]}>Added: {item.dateLabel}</Text>
          <Text style={[shared.typography.bodySmall, styles.recipeAuthor]}>{item.authorLabel}</Text>
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
        <View style={styles.pageHeaderRow}>
          <Text style={shared.pageTitle}>{pageTitle}</Text>
          <Pressable
            onPress={() => {
              setSearchVisible(v => !v);
              setSearchQuery('');
            }}
            style={({ pressed }) => pressed && styles.pressed}
            hitSlop={10}
          >
            <Image source={searchIcon} style={styles.searchIcon} />
          </Pressable>
        </View>
        {searchVisible && (
          <TextInput
            style={[shared.typography.body, styles.searchBar]}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search..."
            placeholderTextColor={colors.textMuted}
            autoFocus
            clearButtonMode="while-editing"
          />
        )}
        <FlatList
          style={styles.list}
          data={isLoading || errorMessage ? [] : filteredRecipes}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderRecipeCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            isLoading ? (
              <Text style={[shared.typography.body, styles.infoText]}>Loading recipes...</Text>
            ) : errorMessage ? (
              <Text style={[shared.typography.body, styles.errorText]}>{errorMessage}</Text>
            ) : (
              <Text style={[shared.typography.body, styles.infoText]}>{emptyText}</Text>
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
  list: {
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
  },
  recipeTitle: {
    color: colors.text,
  },
  recipeAuthor: {
    color: colors.text,
    opacity: 0.75,
  },
  infoText: {
    color: colors.text,
    opacity: 0.8,
    marginTop: 10,
  },
  errorText: {
    color: '#B00020',
    marginTop: 10,
  },
  pressed: {
    opacity: 0.8,
  },
  searchIcon: {
    width: 22,
    height: 22,
    opacity: 0.5,
    tintColor: colors.text,
  },
  searchBar: {
    marginBottom: 14,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    color: colors.text,
  },
});
