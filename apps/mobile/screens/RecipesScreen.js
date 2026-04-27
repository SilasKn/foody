import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import ScreenShell from '../components/ScreenShell';
import { colors } from '../theme';

export default function RecipesScreen({ navigation }) {
  return (
    <ScreenShell
      navigation={navigation}
      title="Your recipes"
      activeTab="recipes"
    >
      <View style={styles.content} />

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
  fab: {
    position: 'absolute',
    right: 18,
    bottom: 96,
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
