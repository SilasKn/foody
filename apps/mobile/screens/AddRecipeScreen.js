import { Ionicons } from '@expo/vector-icons';
import { useMemo, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

import ScreenShell from '../components/ScreenShell';
import { colors } from '../theme';

export default function AddRecipeScreen({ navigation }) {
  const [recipeName, setRecipeName] = useState('');
  const [recipeDescription, setRecipeDescription] = useState('');
  const [ingredientInput, setIngredientInput] = useState('');
  const [ingredients, setIngredients] = useState([]);
  const [isPublic, setIsPublic] = useState(false);

  const [errorMessage, setErrorMessage] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  const toastTimeoutRef = useRef(null);

  const canSave = useMemo(() => recipeName.trim().length > 0, [recipeName]);

  const showToast = (msg) => {
    setToastMessage(msg);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => setToastMessage(''), 1800);
  };

  const addIngredient = () => {
    const next = ingredientInput.trim();
    if (!next) return;
    setIngredients((prev) => {
      if (prev.some((i) => i.toLowerCase() === next.toLowerCase())) return prev;
      return [...prev, next];
    });
    setIngredientInput('');
  };

  const removeIngredient = (idx) => {
    setIngredients((prev) => prev.filter((_, i) => i !== idx));
  };

  const onClear = () => {
    setRecipeName('');
    setRecipeDescription('');
    setIngredientInput('');
    setIngredients([]);
    setIsPublic(false);
    setErrorMessage('');
    setToastMessage('');
  };

  const onSave = () => {
    setErrorMessage('');
    const name = recipeName.trim();
    if (!name) {
      setErrorMessage('Please enter a recipe name.');
      return;
    }

    showToast('Saved locally (no database yet).');
  };

  return (
    <ScreenShell navigation={navigation} title="Add Recipe" activeTab="recipes">
      <KeyboardAvoidingView style={styles.flex} behavior="padding">
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            <Text style={styles.label}>Recipe name</Text>
            <TextInput
              value={recipeName}
              onChangeText={setRecipeName}
              placeholder="e.g. Spaghetti Aglio e Olio"
              placeholderTextColor="#666"
              style={styles.input}
              returnKeyType="next"
            />

            <Text style={styles.label}>Recipe description</Text>
            <TextInput
              value={recipeDescription}
              onChangeText={setRecipeDescription}
              placeholder="Short description / steps…"
              placeholderTextColor="#666"
              style={[styles.input, styles.textArea]}
              multiline
              textAlignVertical="top"
            />

            <Text style={styles.label}>Ingredients</Text>
            <View style={styles.ingredientRow}>
              <TextInput
                value={ingredientInput}
                onChangeText={setIngredientInput}
                placeholder="Add ingredient…"
                placeholderTextColor="#666"
                style={[styles.input, styles.ingredientInput]}
                returnKeyType="done"
                onSubmitEditing={addIngredient}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Add ingredient"
                onPress={addIngredient}
                style={({ pressed }) => [styles.addIconButton, pressed && styles.pressed]}
              >
                <Ionicons name="add" size={22} color={colors.text} />
              </Pressable>
            </View>

            {ingredients.length > 0 && (
              <View style={styles.ingredientsList}>
                {ingredients.map((ing, idx) => (
                  <View key={`${ing}-${idx}`} style={styles.ingredientItem}>
                    <Text style={styles.ingredientText}>{ing}</Text>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Remove ${ing}`}
                      onPress={() => removeIngredient(idx)}
                      hitSlop={10}
                      style={({ pressed }) => [styles.removeButton, pressed && styles.pressed]}
                    >
                      <Ionicons name="close" size={18} color={colors.text} />
                    </Pressable>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.toggleRow}>
              <Text style={styles.label}>Public</Text>
              <Switch
                value={isPublic}
                onValueChange={setIsPublic}
                trackColor={{ false: '#DDD', true: colors.accent }}
                thumbColor="#fff"
              />
            </View>

            {!!errorMessage && <Text style={styles.error}>{errorMessage}</Text>}
            {!!toastMessage && <Text style={styles.toast}>{toastMessage}</Text>}

            <View style={styles.buttonRow}>
              <Pressable
                accessibilityRole="button"
                onPress={onClear}
                style={({ pressed }) => [styles.clearButton, pressed && styles.pressed]}
              >
                <Text style={styles.clearButtonText}>Clear</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={onSave}
                disabled={!canSave}
                style={({ pressed }) => [
                  styles.saveButton,
                  !canSave && styles.saveButtonDisabled,
                  pressed && canSave && styles.saveButtonPressed,
                ]}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, alignSelf: 'stretch' },
  scrollContent: {
    flexGrow: 1,
    width: '100%',
    justifyContent: 'center',
    paddingVertical: 18,
  },
  card: {
    width: '100%',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 28,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
    minHeight: 420,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 14,
  },
  textArea: {
    height: 110,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  ingredientInput: {
    flex: 1,
    marginBottom: 0,
  },
  addIconButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.pillInactive,
  },
  ingredientsList: {
    marginTop: 12,
    marginBottom: 14,
    gap: 8,
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  ingredientText: {
    color: colors.text,
    fontWeight: '600',
    flex: 1,
    paddingRight: 10,
  },
  removeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.pillActive,
    borderWidth: 1,
    borderColor: colors.border,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    marginBottom: 10,
  },
  error: {
    color: '#B00020',
    fontWeight: '600',
    marginBottom: 10,
  },
  toast: {
    color: '#1B5E20',
    fontWeight: '700',
    marginBottom: 10,
  },
  buttonRow: {
    marginTop: 'auto',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 14,
    paddingTop: 10,
  },
  clearButton: {
    minWidth: 110,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 18,
    alignItems: 'center',
  },
  clearButtonText: {
    color: colors.text,
    fontWeight: '700',
  },
  saveButton: {
    minWidth: 110,
    borderRadius: 9999,
    backgroundColor: colors.accent,
    paddingVertical: 12,
    paddingHorizontal: 18,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonPressed: {
    opacity: 0.85,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.85,
  },
});

