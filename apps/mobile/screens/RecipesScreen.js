import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import ScreenShell from '../components/ScreenShell';
import { useRecipes } from '../providers/RecipesProvider';
import { colors } from '../theme';

export default function RecipesScreen({ navigation }) {
  const {
    recipes,
    isLoading,
    errorMessage,
    filterMode,
    setFilterMode,
    filterModes,
    loadRecipesForMode,
  } = useRecipes();
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  useEffect(() => {
    loadRecipesForMode(filterMode);
  }, [filterMode, loadRecipesForMode]);

  const pageTitle = filterMode === filterModes.PUBLIC ? 'Public Recipes' : 'Your Recipes';
  const emptyText = filterMode === filterModes.PUBLIC ? 'No public recipes found.' : 'No own recipes yet.';

  const applyMode = (mode) => {
    setFilterMode(mode);
    setIsFilterOpen(false);
  };

  const renderListHeader = () => (
    <View style={styles.pageHeaderRow}>
      <Text style={styles.pageTitle}>{pageTitle}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Open recipe filter"
        onPress={() => setIsFilterOpen(true)}
        style={({ pressed }) => [styles.filterButton, pressed && styles.pressed]}
      >
        <Ionicons name="options-outline" size={22} color={colors.text} />
      </Pressable>
    </View>
  );

  const renderRecipeCard = ({ item }) => (
    <View style={styles.recipeCard}>
      <View style={styles.recipeCardRail} />
      <View style={styles.recipeCardContent}>
        <Text style={styles.recipeTitle} numberOfLines={1}>
            {item.name}
        </Text>
        <Text style={styles.recipeDate}>Added: {item.dateLabel}</Text>
        <Text style={styles.recipeAuthor}>{item.authorLabel}</Text>
      </View>
    </View>
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

      <Modal
        transparent
        animationType="fade"
        visible={isFilterOpen}
        onRequestClose={() => setIsFilterOpen(false)}
      >
        <Pressable style={styles.dropdownOverlay} onPress={() => setIsFilterOpen(false)}>
          <Pressable style={styles.dropdownMenu} onPress={() => {}}>
            <Pressable
              accessibilityRole="button"
              onPress={() => applyMode(filterModes.MINE)}
              style={({ pressed }) => [styles.dropdownItem, pressed && styles.pressed]}
            >
              <Text style={styles.dropdownItemText}>My recipes</Text>
              {filterMode === filterModes.MINE && (
                <Ionicons name="checkmark" size={18} color={colors.text} />
              )}
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => applyMode(filterModes.PUBLIC)}
              style={({ pressed }) => [styles.dropdownItem, pressed && styles.pressed]}
            >
              <Text style={styles.dropdownItemText}>Public recipes</Text>
              {filterMode === filterModes.PUBLIC && (
                <Ionicons name="checkmark" size={18} color={colors.text} />
              )}
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

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
    paddingTop: 8,
    paddingBottom: 96,
    gap: 16,
  },
  pageHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    marginBottom: 16,
  },
  pageTitle: {
    flex: 1,
    textAlign: 'left',
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
  },
  filterButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    marginLeft: 10,
  },
  dropdownOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  dropdownMenu: {
    position: 'absolute',
    top: 120,
    right: 24,
    width: 180,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.14,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 6,
  },
  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  dropdownItemText: {
    color: colors.text,
    fontWeight: '600',
    fontSize: 14,
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
  pressed: {
    opacity: 0.8,
  },
});
