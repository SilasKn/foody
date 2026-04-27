import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useMemo, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '../theme';

export default function AddRecipeScreen({ navigation }) {
  const unitOptions = ['g', 'ml', 'unit'];

  const [recipeName, setRecipeName] = useState('');
  const [recipeDescription, setRecipeDescription] = useState('');
  const [ingredientInput, setIngredientInput] = useState('');
  const [ingredientQuantityInput, setIngredientQuantityInput] = useState('');
  const [ingredientUnit, setIngredientUnit] = useState('g');
  const [showUnitPickerIOS, setShowUnitPickerIOS] = useState(false);
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
    const name = ingredientInput.trim();
    const quantityRaw = ingredientQuantityInput.trim().replace(',', '.');
    const quantity = Number(quantityRaw);

    if (!name) {
      setErrorMessage('Please enter an ingredient name.');
      return;
    }
    if (!quantityRaw || Number.isNaN(quantity) || quantity <= 0) {
      setErrorMessage('Please enter a valid positive quantity.');
      return;
    }

    setErrorMessage('');
    setIngredients((prev) => {
      const hasDuplicate = prev.some(
        (i) =>
          i.name.toLowerCase() === name.toLowerCase() &&
          i.quantity === quantity &&
          i.unit === ingredientUnit
      );
      if (hasDuplicate) return prev;

      return [...prev, { name, quantity, unit: ingredientUnit }];
    });
    setIngredientInput('');
    setIngredientQuantityInput('');
    setIngredientUnit('g');
    setShowUnitPickerIOS(false);
  };

  const removeIngredient = (idx) => {
    setIngredients((prev) => prev.filter((_, i) => i !== idx));
  };

  const onClear = () => {
    setRecipeName('');
    setRecipeDescription('');
    setIngredientInput('');
    setIngredientQuantityInput('');
    setIngredientUnit('g');
    setShowUnitPickerIOS(false);
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
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.modalBody}>
          <View style={styles.card}>
            <View style={styles.backRow}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Back"
                onPress={() => navigation.goBack()}
                hitSlop={10}
                style={({ pressed }) => [styles.backButton, pressed && styles.fabPressed]}
              >
                <Ionicons name="arrow-back" size={24} color={colors.text} />
              </Pressable>
            </View>

            <ScrollView
              style={styles.cardScroll}
              contentContainerStyle={styles.cardScrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
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
              </View>
              <View style={styles.ingredientMetaRow}>
                <View style={styles.quantityInputWrap}>
                  <TextInput
                    value={ingredientQuantityInput}
                    onChangeText={setIngredientQuantityInput}
                    placeholder="Quantity"
                    placeholderTextColor="#666"
                    keyboardType="numeric"
                    style={[styles.input, styles.quantityInput]}
                  />
                </View>
                {Platform.OS === 'ios' ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Select unit"
                    onPress={() => setShowUnitPickerIOS((prev) => !prev)}
                    style={({ pressed }) => [
                      styles.unitFieldButton,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={styles.unitFieldText}>{ingredientUnit}</Text>
                    <Ionicons name="chevron-down" size={18} color={colors.text} />
                  </Pressable>
                ) : (
                  <View style={styles.pickerWrap}>
                    <Picker
                      selectedValue={ingredientUnit}
                      onValueChange={(value) => setIngredientUnit(value)}
                      style={styles.picker}
                      dropdownIconColor={colors.text}
                    >
                      {unitOptions.map((unit) => (
                        <Picker.Item key={unit} label={unit} value={unit} />
                      ))}
                    </Picker>
                  </View>
                )}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Add ingredient"
                  onPress={addIngredient}
                  style={({ pressed }) => [styles.addIconButton, pressed && styles.pressed]}
                >
                  <Ionicons name="add" size={22} color={colors.text} />
                </Pressable>
              </View>
              {Platform.OS === 'ios' && showUnitPickerIOS && (
                <View style={styles.iosPickerPanel}>
                  <View style={styles.iosPickerHeader}>
                    <Text style={styles.iosPickerTitle}>Unit</Text>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Done selecting unit"
                      onPress={() => setShowUnitPickerIOS(false)}
                      style={({ pressed }) => [styles.iosPickerDone, pressed && styles.pressed]}
                    >
                      <Text style={styles.iosPickerDoneText}>Done</Text>
                    </Pressable>
                  </View>
                  <Picker
                    selectedValue={ingredientUnit}
                    onValueChange={(value) => setIngredientUnit(value)}
                    style={styles.iosPicker}
                    itemStyle={styles.iosPickerItem}
                  >
                    {unitOptions.map((unit) => (
                      <Picker.Item key={unit} label={unit} value={unit} />
                    ))}
                  </Picker>
                </View>
              )}

              {ingredients.length > 0 && (
                <View style={styles.ingredientsList}>
                  {ingredients.map((ing, idx) => (
                    <View key={`${ing.name}-${ing.quantity}-${ing.unit}-${idx}`} style={styles.ingredientItem}>
                      <Text style={styles.ingredientText}>
                        {ing.name} - {ing.quantity} {ing.unit}
                      </Text>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Remove ${ing.name}`}
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
            </ScrollView>

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
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  flex: { flex: 1 },
  modalBody: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: 'transparent',
    justifyContent: 'center',
  },
  card: {
    width: '100%',
    height: '82%',
    maxHeight: '82%',
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
    overflow: 'hidden',
  },
  backRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 14,
  },
  backButton: {
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
  fabPressed: {
    opacity: 0.85,
  },
  cardScroll: {
    flexGrow: 1,
    flexShrink: 1,
    minHeight: 1,
  },
  cardScrollContent: {
    flexGrow: 1,
    paddingBottom: 12,
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
    marginBottom: 10,
  },
  ingredientInput: {
    marginBottom: 0,
  },
  ingredientMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 2,
    width: '100%',
  },
  quantityInputWrap: {
    flex: 1,
    minWidth: 0,
  },
  quantityInput: {
    width: '100%',
    marginBottom: 0,
  },
  unitFieldButton: {
    width: 92,
    height: 44,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  unitFieldText: {
    color: colors.text,
    fontWeight: '600',
    fontSize: 14,
  },
  pickerWrap: {
    width: 92,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  picker: {
    height: 44,
  },
  iosPickerPanel: {
    marginTop: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  iosPickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#DDD',
  },
  iosPickerTitle: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 13,
  },
  iosPickerDone: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 9999,
    paddingVertical: 4,
    paddingHorizontal: 10,
    backgroundColor: colors.pillInactive,
  },
  iosPickerDoneText: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 12,
  },
  iosPicker: {
    height: 170,
  },
  iosPickerItem: {
    color: colors.text,
    fontSize: 18,
  },
  addIconButton: {
    flexShrink: 0,
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
    marginTop: 12,
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
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#DDD',
    backgroundColor: '#fff',
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

