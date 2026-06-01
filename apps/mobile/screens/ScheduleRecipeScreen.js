import DateTimePicker from '@react-native-community/datetimepicker';
import { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Dimensions, Modal, PanResponder, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image as SvgIcon } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Dropdown from '../components/Dropdown';
import RecipeImage from '../components/RecipeImage';
import { useAuth } from '../providers/AuthProvider';
import shared from '../sharedStyles';
import { colors } from '../theme';
import { supabase } from '../utils/supabase';

const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];

function formatDateDisplay(date) {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${d}.${m}.${date.getFullYear()}`;
}

export default function ScheduleRecipeScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const SCREEN_H = Dimensions.get('screen').height;
  const SHEET_H = Math.round(SCREEN_H * 0.85);

  const backdropAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(SCREEN_H)).current;
  const dragY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(backdropAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, damping: 25, stiffness: 200 }),
    ]).start();
  }, []);

  const closeWithAnimation = () => {
    Animated.parallel([
      Animated.timing(backdropAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: SCREEN_H, duration: 220, useNativeDriver: true }),
    ]).start(() => navigation.goBack());
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

  const { recipe } = route.params;
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(null);
  const [tempPickerDate, setTempPickerDate] = useState(null);
  const [showPicker, setShowPicker] = useState(false);
  const [mealType, setMealType] = useState(null);
  const [servings, setServings] = useState(recipe.servings ?? 1);
  const [isServingsOpen, setIsServingsOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const servingsOptions = Array.from({ length: 10 }, (_, i) => i + 1);

  const canSchedule = selectedDate !== null && mealType !== null;

  const onDateChange = (event, date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
      if (event.type === 'set' && date) setSelectedDate(date);
    } else {
      if (date) setTempPickerDate(date);
    }
  };

  const onSchedule = async () => {
    if (!canSchedule || saving) return;
    setSaving(true);
    const isoDate = selectedDate.toISOString().split('T')[0];
    const { error } = await supabase.from('recipe_schedule').insert({
      recipe_id: recipe.id,
      user_id: user.id,
      scheduled_for: isoDate,
      scheduled_as: mealType,
      servings,
    });
    setSaving(false);
    if (error) {
      Alert.alert('Error', error.message);
      return;
    }
    Alert.alert('Scheduled!', `"${recipe.name}" added to your plan.`, [
      { text: 'OK', onPress: () => closeWithAnimation() },
    ]);
  };

  return (
    <View style={styles.container}>
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.45)', opacity: backdropAnim }]}
      />
      <Pressable
        style={StyleSheet.absoluteFillObject}
        onPress={closeWithAnimation}
      />
      <Animated.View
        style={[
          styles.sheet,
          { height: SHEET_H, transform: [{ translateY: Animated.add(slideAnim, dragY) }] },
        ]}
      >
        <View style={styles.imageSection}>
          <View style={styles.imageWrapper}>
            <RecipeImage
              imageUrl={recipe.imageUrl}
              style={styles.image}
            />
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back"
            onPress={closeWithAnimation}
            hitSlop={10}
            style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.85 }]}
          >
            <SvgIcon source={require('../assets/arrow_back_icon.svg')} style={[{ width: 24, height: 24 }, shared.iconOnAccent]} contentFit="contain" />
          </Pressable>
          <View {...panResponder.panHandlers} style={styles.dragHandleArea}>
            <View style={styles.dragHandle} />
          </View>
        </View>

        <View style={styles.divider} />

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          alwaysBounceVertical={false}
          overScrollMode="never"
        >
          <Text style={[shared.typography.h3, styles.sectionLabel]}>Schedule for :</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Select date"
            onPress={() => {
              setTempPickerDate(selectedDate ?? new Date());
              setShowPicker(true);
            }}
            style={({ pressed }) => [styles.dateDropdown, pressed && { opacity: 0.8 }]}
          >
            <Text style={[shared.typography.body, styles.dateDropdownText, !selectedDate && styles.datePlaceholder]}>
              {selectedDate ? formatDateDisplay(selectedDate) : 'TT.MM.JJJJ'}
            </Text>
            <SvgIcon source={require('../assets/chevron_down_icon.svg')} style={{ width: 20, height: 20 }} contentFit="contain" />
          </Pressable>

          <View style={styles.spacer} />

          <Text style={[shared.typography.h3, styles.sectionLabel]}>As type of meal:</Text>
          <View style={styles.mealGrid}>
            {MEAL_TYPES.map((type) => (
              <Pressable
                key={type}
                accessibilityRole="button"
                accessibilityLabel={type}
                onPress={() => setMealType(type)}
                style={({ pressed }) => [
                  styles.mealPill,
                  mealType === type && styles.mealPillActive,
                  pressed && { opacity: 0.8 },
                ]}
              >
                <Text style={[shared.typography.sub2, styles.mealPillText, mealType === type && styles.mealPillTextActive]}>
                  {type}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.spacer} />

          <Text style={[shared.typography.h3, styles.sectionLabel]}>Servings:</Text>
          <Dropdown
            value={servings}
            options={servingsOptions.map((n) => ({ value: n, label: String(n) }))}
            onChange={setServings}
            isOpen={isServingsOpen}
            setIsOpen={setIsServingsOpen}
            fullWidth
            maxVisibleItems={3}
            accessibilityLabel="Select servings"
          />
        </ScrollView>

        <View style={[styles.stickyFooter, { paddingBottom: insets.bottom + 12 }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Confirm schedule"
            onPress={onSchedule}
            disabled={!canSchedule || saving}
            style={({ pressed }) => [
              styles.scheduleButton,
              (!canSchedule || saving) && styles.scheduleButtonDisabled,
              pressed && canSchedule && !saving && { opacity: 0.85 },
            ]}
          >
            <Text style={[shared.typography.sub1, styles.scheduleButtonText]}>{saving ? 'Saving…' : 'Schedule'}</Text>
          </Pressable>
        </View>
      </Animated.View>

      {Platform.OS === 'ios' ? (
        <Modal
          visible={showPicker}
          transparent
          animationType="fade"
          onRequestClose={() => setShowPicker(false)}
        >
          <Pressable style={styles.pickerBackdrop} onPress={() => setShowPicker(false)}>
            <Pressable style={styles.pickerCard} onPress={() => {}}>
              <DateTimePicker
                style={styles.pickerSpinner}
                value={tempPickerDate ?? new Date()}
                mode="date"
                display="spinner"
                minimumDate={new Date()}
                onChange={onDateChange}
                locale="de-DE"
                themeVariant="light"
              />
              <Pressable style={styles.pickerDone} onPress={() => {
                if (tempPickerDate) setSelectedDate(tempPickerDate);
                setShowPicker(false);
              }}>
                <Text style={[shared.typography.sub1, styles.pickerDoneText]}>Done</Text>
              </Pressable>
            </Pressable>
          </Pressable>
        </Modal>
      ) : (
        showPicker && (
          <DateTimePicker
            value={selectedDate ?? new Date()}
            mode="date"
            display="default"
            minimumDate={new Date()}
            onChange={onDateChange}
          />
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
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
  },
  imageSection: {
    position: 'relative',
  },
  imageWrapper: {
    height: 220,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
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
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
    zIndex: 3,
  },
  dragHandleArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 10,
    paddingBottom: 14,
    alignItems: 'center',
    zIndex: 2,
  },
  dragHandle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.75)',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  sectionLabel: {
    color: colors.text,
    marginBottom: 10,
  },
  dateDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.white,
  },
  dateDropdownText: {
    color: colors.text,
  },
  datePlaceholder: {
    color: colors.textMuted,
  },
  spacer: {
    height: 20,
  },
  mealGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  mealPill: {
    width: '47%',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: 'center',
  },
  mealPillActive: {
    backgroundColor: colors.accent,
  },
  mealPillText: {
    color: colors.text,
  },
  mealPillTextActive: {
    color: colors.white,
  },
  stickyFooter: {
    paddingHorizontal: 24,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.white,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  scheduleButton: {
    backgroundColor: colors.accent,
    borderRadius: 9999,
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  scheduleButtonDisabled: {
    opacity: 0.4,
  },
  scheduleButtonText: {
    color: colors.white,
  },
  pickerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  pickerCard: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  pickerSpinner: {
    alignSelf: 'center',
  },
  pickerDone: {
    alignSelf: 'flex-end',
    marginRight: 28,
    marginTop: 8,
    marginBottom: 8,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  pickerDoneText: {
    color: colors.accent,
  },
});
