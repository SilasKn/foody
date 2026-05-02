import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import ScreenShell from '../components/ScreenShell';
import { colors } from '../theme';

const placeholderImage = require('../assets/no-picture.png');

export default function RecipeDetailScreen({ route, navigation }) {
  const { recipe } = route.params;

  return (
    <ScreenShell navigation={navigation} activeTab="recipes">
      <View style={styles.outerContainer}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
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

          <View style={styles.card}>
            <Text style={styles.recipeName}>{recipe.name}</Text>
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Ingredients:</Text>
            </View>
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Description:</Text>
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
    gap: 16,
    paddingBottom: 24,
  },
  imageSection: {
    position: 'relative',
  },
  imageWrapper: {
    height: 220,
    borderRadius: 28,
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
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  recipeName: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  section: {
    marginTop: 12,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
});
