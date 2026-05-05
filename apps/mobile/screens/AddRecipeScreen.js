import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const placeholderImage = require('../assets/no-picture.png');

import { useAuth } from '../providers/AuthProvider';
import { useRecipes } from '../providers/RecipesProvider';
import { colors } from '../theme';
import { uploadImage } from '../utils/imageUpload';
import { supabase } from '../utils/supabase';

export default function AddRecipeScreen({ navigation, route }) {
  const unitOptions = ['g', 'ml', 'unit'];
  const { user } = useAuth();
  const { prependRecipe, refreshRecipesForMode, filterModes } = useRecipes();

  const editRecipe = route?.params?.recipe ?? null;
  const existingImagePath = editRecipe?.existingImagePath ?? null;
  const existingImageUrl = editRecipe?.existingImageUrl ?? null;

  const [recipeName, setRecipeName] = useState(editRecipe?.name ?? '');
  const [recipeDescription, setRecipeDescription] = useState(editRecipe?.description ?? '');
  const [ingredientInput, setIngredientInput] = useState('');
  const [ingredientQuantityInput, setIngredientQuantityInput] = useState('');
  const [ingredientUnit, setIngredientUnit] = useState('g');
  const [showUnitPickerIOS, setShowUnitPickerIOS] = useState(false);
  const [ingredients, setIngredients] = useState(editRecipe?.ingredients ?? []);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageRemoved, setImageRemoved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [errorMessage, setErrorMessage] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  const toastTimeoutRef = useRef(null);
  const closeTimeoutRef = useRef(null);

  const canSave = useMemo(() => recipeName.trim().length > 0 && !isSaving, [recipeName, isSaving]);
  const displayImageUri = selectedImage?.uri ?? (imageRemoved ? null : existingImageUrl) ?? null;

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    };
  }, []);

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

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.[0]) {
      const asset = result.assets[0];
      setSelectedImage({ uri: asset.uri, width: asset.width, height: asset.height });
      setImageRemoved(false);
    }
  };

  const normalizeIngredientName = (name) => name.trim().toLowerCase();

  const getIngredientIdsByName = async (ingredientNames) => {
    const uniqueOriginalNames = [];
    const uniqueNormalizedNames = [];
    const originalByNormalizedName = {};
    const seen = new Set();

    ingredientNames.forEach((name) => {
      const normalized = normalizeIngredientName(name);
      if (!normalized || seen.has(normalized)) return;
      seen.add(normalized);
      uniqueNormalizedNames.push(normalized);
      uniqueOriginalNames.push(name.trim());
      originalByNormalizedName[normalized] = name.trim();
    });

    const { data: existingIngredients, error: existingIngredientsError } = await supabase
      .from('ingredients')
      .select('id, name');

    if (existingIngredientsError) {
      throw existingIngredientsError;
    }

    const ingredientIdByNormalizedName = {};
    (existingIngredients ?? []).forEach((item) => {
      const normalized = normalizeIngredientName(item.name ?? '');
      if (!normalized) return;
      if (!ingredientIdByNormalizedName[normalized]) {
        ingredientIdByNormalizedName[normalized] = item.id;
      }
    });

    const missingNormalizedNames = uniqueNormalizedNames.filter(
      (normalizedName) => !ingredientIdByNormalizedName[normalizedName]
    );

    if (missingNormalizedNames.length > 0) {
      const ingredientsToInsert = missingNormalizedNames.map((normalizedName) => ({
        name: originalByNormalizedName[normalizedName],
      }));

      const { data: insertedIngredients, error: insertIngredientsError } = await supabase
        .from('ingredients')
        .insert(ingredientsToInsert)
        .select('id, name');

      if (insertIngredientsError) {
        throw insertIngredientsError;
      }

      (insertedIngredients ?? []).forEach((item) => {
        const normalized = normalizeIngredientName(item.name ?? '');
        if (!normalized) return;
        ingredientIdByNormalizedName[normalized] = item.id;
      });
    }

    return ingredientNames.reduce((acc, name) => {
      const normalized = normalizeIngredientName(name);
      acc[normalized] = ingredientIdByNormalizedName[normalized];
      return acc;
    }, {});
  };

  const onClear = () => {
    if (isSaving) return;
    setRecipeName('');
    setRecipeDescription('');
    setIngredientInput('');
    setIngredientQuantityInput('');
    setIngredientUnit('g');
    setShowUnitPickerIOS(false);
    setIngredients([]);
    setSelectedImage(null);
    setImageRemoved(false);
    setErrorMessage('');
    setToastMessage('');
  };

  const onDeletePress = () => {
    Alert.alert(
      'Delete Recipe',
      'Are you sure you want to delete this recipe? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await supabase.from('recipe_ingredients').delete().eq('recipe_id', editRecipe.id);
            await supabase.from('recipes').delete().eq('id', editRecipe.id);
            refreshRecipesForMode(filterModes.MINE);
            navigation.navigate('Recipes');
          },
        },
      ]
    );
  };

  const onRemoveImage = () => {
    if (selectedImage) {
      setSelectedImage(null);
    } else {
      setImageRemoved(true);
    }
  };

  const onSave = async () => {
    if (isSaving) return;
    setErrorMessage('');
    setToastMessage('');
    const name = recipeName.trim();
    if (!name) {
      setErrorMessage('Please enter a recipe name.');
      return;
    }
    if (!user?.id) {
      setErrorMessage('Please log in again.');
      return;
    }

    setIsSaving(true);

    try {
      if (editRecipe) {
        const { error: updateError } = await supabase
          .from('recipes')
          .update({ name, description: recipeDescription.trim() })
          .eq('id', editRecipe.id);
        if (updateError) throw updateError;

        const { error: deleteError } = await supabase
          .from('recipe_ingredients')
          .delete()
          .eq('recipe_id', editRecipe.id);
        if (deleteError) throw deleteError;

        const { count, error: countError } = await supabase
          .from('recipe_ingredients')
          .select('*', { count: 'exact', head: true })
          .eq('recipe_id', editRecipe.id);
        if (countError) throw countError;
        if (count > 0) throw new Error('Could not clear existing ingredients. Check database permissions.');

        if (ingredients.length > 0) {
          const ingredientNames = ingredients.map((item) => item.name);
          const ingredientIdByNormalizedName = await getIngredientIdsByName(ingredientNames);

          const recipeIngredientsToInsert = ingredients.map((item) => {
            const ingredientId = ingredientIdByNormalizedName[normalizeIngredientName(item.name)];
            if (!ingredientId) throw new Error(`Missing ingredient id for "${item.name}".`);
            return {
              recipe_id: editRecipe.id,
              ingredient_id: ingredientId,
              quantity: item.quantity,
              unit: item.unit,
            };
          });

          const { error: insertError } = await supabase
            .from('recipe_ingredients')
            .insert(recipeIngredientsToInsert);
          if (insertError) throw insertError;
        }

        if (selectedImage) {
          if (existingImagePath) {
            await supabase.storage.from('recipe_images').remove([existingImagePath]);
            await supabase.from('recipe_images').delete().eq('recipe_id', editRecipe.id);
          }
          await uploadImage(supabase, user, editRecipe.id, selectedImage);
        } else if (imageRemoved && existingImagePath) {
          await supabase.storage.from('recipe_images').remove([existingImagePath]);
          await supabase.from('recipe_images').delete().eq('recipe_id', editRecipe.id);
        }
        await refreshRecipesForMode(filterModes.MINE);
        showToast('Recipe updated successfully.');
      } else {
        let draftRecipeId = null;
        try {
          const { data: createdRecipe, error: recipeInsertError } = await supabase
            .from('recipes')
            .insert({
              name,
              description: recipeDescription.trim(),
              author: user.id,
              public: false,
              draft: true,
            })
            .select('id, name, author, created_at')
            .single();

          if (recipeInsertError) throw recipeInsertError;
          if (!createdRecipe?.id) throw new Error('Failed to create recipe.');
          draftRecipeId = createdRecipe.id;

          if (ingredients.length > 0) {
            const ingredientNames = ingredients.map((item) => item.name);
            const ingredientIdByNormalizedName = await getIngredientIdsByName(ingredientNames);

            const recipeIngredientsToInsert = ingredients.map((item) => {
              const ingredientId = ingredientIdByNormalizedName[normalizeIngredientName(item.name)];
              if (!ingredientId) {
                throw new Error(`Missing ingredient id for "${item.name}".`);
              }
              return {
                recipe_id: createdRecipe.id,
                ingredient_id: ingredientId,
                quantity: item.quantity,
                unit: item.unit,
              };
            });

            const { error: recipeIngredientsInsertError } = await supabase
              .from('recipe_ingredients')
              .insert(recipeIngredientsToInsert);

            if (recipeIngredientsInsertError) throw recipeIngredientsInsertError;
          }

          if (selectedImage) await uploadImage(supabase, user, createdRecipe.id, selectedImage);

          const { error: finalizeError } = await supabase
            .from('recipes')
            .update({ draft: false })
            .eq('id', createdRecipe.id);
          if (finalizeError) throw finalizeError;

          prependRecipe(createdRecipe);
          showToast('Recipe saved successfully.');
        } catch (createErr) {
          if (draftRecipeId) {
            await supabase.from('recipe_ingredients').delete().eq('recipe_id', draftRecipeId);
            await supabase.from('recipes').delete().eq('id', draftRecipeId);
          }
          throw createErr;
        }
      }

      closeTimeoutRef.current = setTimeout(() => {
        navigation.goBack();
      }, 900);
    } catch (err) {
      setErrorMessage(err?.message ?? 'Failed to save recipe.');
    } finally {
      setIsSaving(false);
    }
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
              {editRecipe && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Delete recipe"
                  onPress={onDeletePress}
                  hitSlop={10}
                  style={({ pressed }) => [pressed && styles.pressed]}
                >
                  <Text style={styles.deleteText}>Delete</Text>
                </Pressable>
              )}
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

              <Text style={styles.label}>Recipe Image</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={selectedImage ? 'Change recipe image' : 'Add recipe image'}
                onPress={pickImage}
                style={({ pressed }) => [styles.imagePicker, pressed && styles.pressed]}
              >
                {(displayImageUri !== null || imageRemoved) ? (
                  <>
                    <Image
                      source={displayImageUri ? { uri: displayImageUri } : placeholderImage}
                      style={styles.imagePreview}
                      resizeMode="cover"
                    />
                    <View style={styles.imageOverlay} pointerEvents="none">
                      <Ionicons name="camera-outline" size={28} color={colors.white} />
                      <Text style={styles.imageOverlayText}>Edit</Text>
                    </View>
                  </>
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Ionicons name="camera-outline" size={28} color={colors.textMuted} />
                    <Text style={styles.imagePlaceholderText}>Add photo</Text>
                  </View>
                )}
              </Pressable>
              {(selectedImage !== null || (!imageRemoved && !!existingImageUrl)) && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Remove image"
                  onPress={onRemoveImage}
                  style={({ pressed }) => [styles.removeImageButton, pressed && styles.pressed]}
                >
                  <Text style={styles.removeImageText}>Remove image</Text>
                </Pressable>
              )}

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

              {!!errorMessage && <Text style={styles.error}>{errorMessage}</Text>}
              {!!toastMessage && <Text style={styles.toast}>{toastMessage}</Text>}
            </ScrollView>

            <View style={styles.buttonRow}>
              {!editRecipe && (
                <Pressable
                  accessibilityRole="button"
                  onPress={onClear}
                  disabled={isSaving}
                  style={({ pressed }) => [styles.clearButton, pressed && styles.pressed]}
                >
                  <Text style={styles.clearButtonText}>Clear</Text>
                </Pressable>
              )}
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
                <Text style={styles.saveButtonText}>{isSaving ? 'Saving...' : 'Save'}</Text>
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
    height: '74%',
    maxHeight: '74%',
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  deleteText: {
    color: colors.danger,
    fontWeight: '600',
    fontSize: 15,
    textDecorationLine: 'underline',
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
  imagePicker: {
    height: 120,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    marginBottom: 6,
    overflow: 'hidden',
  },
  imagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.imagePlaceholderBg,
    gap: 6,
  },
  imagePlaceholderText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.accentOverlay,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  imageOverlayText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '600',
  },
  removeImageButton: {
    marginBottom: 14,
    alignSelf: 'flex-start',
  },
  removeImageText: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});

