import { Image as SvgIcon } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Image,
  Keyboard,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import RecipeImage from '../components/RecipeImage';
import { useAuth } from '../providers/AuthProvider';
import { useRecipes } from '../providers/RecipesProvider';
import shared from '../sharedStyles';
import { colors } from '../theme';
import { uploadImage } from '../utils/imageUpload';
import { supabase } from '../utils/supabase';

function Dropdown({
  value,
  options,
  onChange,
  isOpen,
  setIsOpen,
  fullWidth = false,
  listAbsolute = false,
  accessibilityLabel,
}) {
  const selected = options.find((opt) => opt.value === value);
  return (
    <View style={fullWidth ? styles.dropdownFullWrap : null}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        onPress={() => setIsOpen((prev) => !prev)}
        style={({ pressed }) => [
          styles.dropdownTrigger,
          fullWidth ? styles.dropdownTriggerFull : styles.dropdownTriggerCompact,
          isOpen && styles.dropdownTriggerOpen,
          pressed && shared.pressed,
        ]}
      >
        <Text style={[shared.typography.sub2, styles.dropdownTriggerText]}>
          {selected ? selected.label : ''}
        </Text>
        <SvgIcon
          source={require('../assets/chevron_down_icon.svg')}
          style={[
            { width: 18, height: 18 },
            isOpen && { transform: [{ rotate: '180deg' }] },
          ]}
          contentFit="contain"
        />
      </Pressable>
      {isOpen && (
        <View
          style={[
            styles.dropdownList,
            listAbsolute && styles.dropdownListAbsolute,
            fullWidth && styles.dropdownListFull,
          ]}
        >
          {options.map((opt, idx) => {
            const isSelected = opt.value === value;
            return (
              <Pressable
                key={String(opt.value)}
                accessibilityRole="button"
                accessibilityLabel={`Select ${opt.label}`}
                onPress={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                style={({ pressed }) => [
                  styles.dropdownListItem,
                  idx === 0 && styles.dropdownListItemFirst,
                  pressed && shared.pressed,
                ]}
              >
                <Text
                  style={[
                    shared.typography.sub1,
                    styles.dropdownListItemText,
                    isSelected && styles.dropdownListItemTextSelected,
                  ]}
                >
                  {opt.label}
                </Text>
                {isSelected && (
                  <SvgIcon
                    source={require('../assets/check_icon.svg')}
                    style={{ width: 18, height: 18 }}
                    contentFit="contain"
                  />
                )}
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

export default function AddRecipeScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const SCREEN_H = Dimensions.get('screen').height;
  const COLLAPSED_H = Math.round(SCREEN_H * 0.9);
  const EXPANDED_H = SCREEN_H - insets.top;

  const backdropAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(SCREEN_H)).current;
  const dragY = useRef(new Animated.Value(0)).current;
  const heightAnim = useRef(new Animated.Value(COLLAPSED_H)).current;
  const scrollRef = useRef(null);
  const currentScrollY = useRef(0);
  const closeScrollTimeoutRef = useRef(null);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [showUnitPadding, setShowUnitPadding] = useState(false);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(backdropAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, damping: 25, stiffness: 200 }),
    ]).start();
  }, []);

  useEffect(() => {
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const onShow = (e) => {
      setKeyboardVisible(true);
      Animated.timing(heightAnim, {
        toValue: EXPANDED_H,
        duration: e?.duration ?? 250,
        useNativeDriver: false,
      }).start();
    };
    const onHide = (e) => {
      setKeyboardVisible(false);
      Animated.timing(heightAnim, {
        toValue: COLLAPSED_H,
        duration: e?.duration ?? 250,
        useNativeDriver: false,
      }).start();
    };
    const s = Keyboard.addListener(showEvt, onShow);
    const h = Keyboard.addListener(hideEvt, onHide);
    return () => {
      s.remove();
      h.remove();
    };
  }, [EXPANDED_H, COLLAPSED_H]);

  const closeWithAnimation = () => {
    Animated.parallel([
      Animated.timing(backdropAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: SCREEN_H, duration: 220, useNativeDriver: true }),
    ]).start(() => {
      navigation.goBack();
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gs) => gs.dy > 6 && gs.dy > Math.abs(gs.dx),
      onPanResponderMove: (_, gs) => {
        if (gs.dy > 0) dragY.setValue(gs.dy);
      },
      onPanResponderRelease: (_, gs) => {
        if (gs.dy > 120 || gs.vy > 0.6) {
          Animated.parallel([
            Animated.timing(backdropAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
            Animated.timing(dragY, { toValue: SCREEN_H, duration: 220, useNativeDriver: true }),
          ]).start(() => navigation.goBack());
        } else {
          Animated.spring(dragY, {
            toValue: 0,
            useNativeDriver: true,
            damping: 20,
            stiffness: 200,
          }).start();
        }
      },
    })
  ).current;

  const unitOptions = ['g', 'ml', 'unit'];
  const servingsOptions = Array.from({ length: 10 }, (_, i) => i + 1);
  const UNIT_LIST_HEIGHT = unitOptions.length * 44;
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
  const [isUnitOpen, setIsUnitOpen] = useState(false);
  const [ingredients, setIngredients] = useState(editRecipe?.ingredients ?? []);
  const [servings, setServings] = useState(editRecipe?.servings ?? 1);
  const [isServingsOpen, setIsServingsOpen] = useState(false);
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
      if (closeScrollTimeoutRef.current) clearTimeout(closeScrollTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (isUnitOpen) {
      setShowUnitPadding(true);
      const frame = requestAnimationFrame(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      });
      return () => cancelAnimationFrame(frame);
    }
    if (!showUnitPadding) return;
    const target = Math.max(0, currentScrollY.current - UNIT_LIST_HEIGHT);
    scrollRef.current?.scrollTo({ y: target, animated: true });
    closeScrollTimeoutRef.current = setTimeout(() => {
      setShowUnitPadding(false);
      closeScrollTimeoutRef.current = null;
    }, 320);
    return () => {
      if (closeScrollTimeoutRef.current) {
        clearTimeout(closeScrollTimeoutRef.current);
        closeScrollTimeoutRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isUnitOpen]);

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
    setIsUnitOpen(false);
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
    setIsUnitOpen(false);
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
          .update({ name, description: recipeDescription.trim(), servings })
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
              servings,
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
        closeWithAnimation();
      }, 900);
    } catch (err) {
      setErrorMessage(err?.message ?? 'Failed to save recipe.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.45)', opacity: backdropAnim }]}
      />
      <Pressable
        style={StyleSheet.absoluteFillObject}
        onPress={() => {
          if (keyboardVisible) {
            Keyboard.dismiss();
          } else {
            closeWithAnimation();
          }
        }}
      />
      <Animated.View
        style={[
          styles.sheetOuter,
          { transform: [{ translateY: Animated.add(slideAnim, dragY) }] },
        ]}
      >
        <Animated.View style={[styles.sheet, { height: heightAnim }]}>
        <View {...panResponder.panHandlers} style={styles.dragHandleArea}>
          <View style={styles.dragHandle} />
        </View>

        <View style={styles.headerRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back"
            onPress={closeWithAnimation}
            hitSlop={10}
            style={({ pressed }) => [shared.circleButton, styles.backButton, pressed && shared.pressed]}
          >
            <SvgIcon source={require('../assets/arrow_back_icon.svg')} style={{ width: 24, height: 24 }} contentFit="contain" />
          </Pressable>
          {editRecipe && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Delete recipe"
              onPress={onDeletePress}
              hitSlop={10}
              style={({ pressed }) => [pressed && shared.pressed]}
            >
              <Text style={[shared.typography.sub1, styles.deleteText]}>Delete</Text>
            </Pressable>
          )}
        </View>

        <ScrollView
          ref={scrollRef}
          style={styles.cardScroll}
          contentContainerStyle={[
            styles.cardScrollContent,
            showUnitPadding && { paddingBottom: 16 + UNIT_LIST_HEIGHT },
          ]}
          onScroll={(e) => {
            currentScrollY.current = e.nativeEvent.contentOffset.y;
          }}
          scrollEventThrottle={16}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          alwaysBounceVertical={false}
          overScrollMode="never"
          showsVerticalScrollIndicator={false}
        >
              <Text style={[shared.typography.sub2, styles.label]}>Recipe name</Text>
              <TextInput
                value={recipeName}
                onChangeText={setRecipeName}
                placeholder="e.g. Spaghetti Aglio e Olio"
                placeholderTextColor="#666"
                style={styles.input}
                returnKeyType="next"
              />

              <Text style={[shared.typography.sub2, styles.label]}>Recipe description</Text>
              <TextInput
                value={recipeDescription}
                onChangeText={setRecipeDescription}
                placeholder="Short description / steps…"
                placeholderTextColor="#666"
                style={[styles.input, styles.textArea]}
                multiline
                textAlignVertical="top"
              />

              <Text style={[shared.typography.sub2, styles.label]}>Recipe Image</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={selectedImage ? 'Change recipe image' : 'Add recipe image'}
                onPress={pickImage}
                style={({ pressed }) => [styles.imagePicker, pressed && shared.pressed]}
              >
                {displayImageUri !== null ? (
                  <>
                    <Image
                      source={{ uri: displayImageUri }}
                      style={styles.imagePreview}
                      resizeMode="cover"
                    />
                    <View style={styles.imageOverlay} pointerEvents="none">
                      <SvgIcon source={require('../assets/camera_icon_white.svg')} style={{ width: 28, height: 28 }} contentFit="contain" />
                      <Text style={[shared.typography.sub2, styles.imageOverlayText]}>Edit</Text>
                    </View>
                  </>
                ) : editRecipe ? (
                  <>
                    <RecipeImage
                      imageUrl={null}
                      recipeId={editRecipe.id}
                      style={styles.imagePreview}
                    />
                    <View style={styles.imageOverlay} pointerEvents="none">
                      <SvgIcon source={require('../assets/camera_icon_white.svg')} style={{ width: 28, height: 28 }} contentFit="contain" />
                      <Text style={[shared.typography.sub2, styles.imageOverlayText]}>Add photo</Text>
                    </View>
                  </>
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <SvgIcon source={require('../assets/camera_icon_grey.svg')} style={{ width: 28, height: 28 }} contentFit="contain" />
                    <Text style={[shared.typography.sub2, styles.imagePlaceholderText]}>Add photo</Text>
                  </View>
                )}
              </Pressable>
              {(selectedImage !== null || (!imageRemoved && !!existingImageUrl)) && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Remove image"
                  onPress={onRemoveImage}
                  style={({ pressed }) => [styles.removeImageButton, pressed && shared.pressed]}
                >
                  <Text style={[shared.typography.bodySmall, styles.removeImageText]}>Remove image</Text>
                </Pressable>
              )}

              <Text style={[shared.typography.sub2, styles.label]}>Ingredients</Text>
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
                <View style={styles.unitAnchor}>
                  <Dropdown
                    value={ingredientUnit}
                    options={unitOptions.map((u) => ({ value: u, label: u }))}
                    onChange={setIngredientUnit}
                    isOpen={isUnitOpen}
                    setIsOpen={setIsUnitOpen}
                    listAbsolute
                    accessibilityLabel="Select unit"
                  />
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Add ingredient"
                  onPress={addIngredient}
                  style={({ pressed }) => [styles.addIconButton, pressed && shared.pressed]}
                >
                  <SvgIcon source={require('../assets/plus_icon.svg')} style={{ width: 22, height: 22 }} contentFit="contain" />
                </Pressable>
              </View>

              {ingredients.length > 0 && (
                <View style={styles.ingredientsList}>
                  {ingredients.map((ing, idx) => (
                    <View key={`${ing.name}-${ing.quantity}-${ing.unit}-${idx}`} style={styles.ingredientItem}>
                      <Text style={[shared.typography.sub1, styles.ingredientText]}>
                        {ing.name} - {ing.quantity} {ing.unit}
                      </Text>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Remove ${ing.name}`}
                        onPress={() => removeIngredient(idx)}
                        hitSlop={10}
                        style={({ pressed }) => [styles.removeButton, pressed && shared.pressed]}
                      >
                        <SvgIcon source={require('../assets/close_icon_black.svg')} style={{ width: 18, height: 18 }} contentFit="contain" />
                      </Pressable>
                    </View>
                  ))}
                </View>
              )}

              <Text style={[shared.typography.sub2, styles.label]}>Servings</Text>
              <Dropdown
                value={servings}
                options={servingsOptions.map((n) => ({ value: n, label: String(n) }))}
                onChange={setServings}
                isOpen={isServingsOpen}
                setIsOpen={setIsServingsOpen}
                fullWidth
                accessibilityLabel="Select servings"
              />

              {!!errorMessage && <Text style={[shared.typography.body, styles.error]}>{errorMessage}</Text>}
              {!!toastMessage && <Text style={[shared.typography.body, styles.toast]}>{toastMessage}</Text>}
        </ScrollView>

        <View style={[styles.stickyFooter, { paddingBottom: insets.bottom + 12 }]}>
          <Pressable
            accessibilityRole="button"
            onPress={onSave}
            disabled={!canSave}
            style={({ pressed }) => [
              shared.pillButton,
              styles.saveButton,
              !canSave && styles.saveButtonDisabled,
              pressed && canSave && shared.pressed,
            ]}
          >
            <Text style={[shared.typography.sub1, styles.saveButtonText]}>{isSaving ? 'Saving...' : 'Save'}</Text>
          </Pressable>
        </View>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  sheetOuter: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -4 },
    elevation: 8,
    overflow: 'hidden',
    paddingHorizontal: 18,
  },
  dragHandleArea: {
    paddingTop: 8,
    paddingBottom: 6,
    alignItems: 'center',
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    opacity: 0.25,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  deleteText: {
    color: colors.danger,
    textDecorationLine: 'underline',
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 28,
    backgroundColor: colors.accent,
  },
  cardScroll: {
    flexGrow: 1,
    flexShrink: 1,
    minHeight: 1,
  },
  cardScrollContent: {
    flexGrow: 1,
    paddingBottom: 16,
  },
  label: {
    color: colors.text,
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 10,
  },
  textArea: {
    height: 100,
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
  unitAnchor: {
    position: 'relative',
  },
  dropdownFullWrap: {
    alignSelf: 'stretch',
    marginBottom: 10,
  },
  dropdownTrigger: {
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
  dropdownTriggerCompact: {
    width: 92,
  },
  dropdownTriggerFull: {
    alignSelf: 'stretch',
  },
  dropdownTriggerOpen: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderBottomWidth: 0,
  },
  dropdownTriggerText: {
    color: colors.text,
  },
  dropdownList: {
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: colors.border,
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  dropdownListAbsolute: {
    position: 'absolute',
    top: 44,
    left: 0,
    right: 0,
    zIndex: 10,
    elevation: 10,
  },
  dropdownListFull: {
    alignSelf: 'stretch',
  },
  dropdownListItem: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: '#DDD',
  },
  dropdownListItemFirst: {
    borderTopWidth: 0,
  },
  dropdownListItemText: {
    color: colors.text,
  },
  dropdownListItemTextSelected: {
    fontWeight: '700',
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
    marginBottom: 10,
  },
  toast: {
    color: '#1B5E20',
    marginBottom: 10,
  },
  stickyFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.white,
  },
  saveButton: {
    minWidth: 110,
    backgroundColor: colors.accent,
    paddingVertical: 12,
    paddingHorizontal: 18,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
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
  },
  removeImageButton: {
    marginBottom: 14,
    alignSelf: 'flex-start',
  },
  removeImageText: {
    color: colors.danger,
    textDecorationLine: 'underline',
  },
});

