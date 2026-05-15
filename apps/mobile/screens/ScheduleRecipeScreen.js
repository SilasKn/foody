import DateTimePicker from '@react-native-community/datetimepicker';
import { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Dimensions, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image as SvgIcon } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
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
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const cardSlideAnim = useRef(new Animated.Value(Dimensions.get('window').height)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(backdropAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.spring(cardSlideAnim, { toValue: 0, useNativeDriver: true, damping: 25, stiffness: 200 }),
    ]).start();
  }, []);

  const { recipe } = route.params;
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(null);
  const [tempPickerDate, setTempPickerDate] = useState(null);
  const [showPicker, setShowPicker] = useState(false);
  const [mealType, setMealType] = useState(null);
  const [saving, setSaving] = useState(false);

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
    });
    setSaving(false);
    if (error) {
      Alert.alert('Error', error.message);
      return;
    }
    Alert.alert('Scheduled!', `"${recipe.name}" added to your plan.`, [
      { text: 'OK', onPress: () => navigation.goBack() },
    ]);
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.35)', opacity: backdropAnim }]} />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.modalBody}>
        <Animated.View style={[styles.card, { transform: [{ translateY: cardSlideAnim }] }]}>
          <View style={styles.imageSection}>
            <View style={styles.imageWrapper}>
              <RecipeImage
                imageUrl={recipe.imageUrl}
                recipeId={recipe.id}
                style={styles.image}
              />
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Back"
              onPress={() => navigation.goBack()}
              hitSlop={10}
              style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.85 }]}
            >
              <SvgIcon source={require('../assets/arrow_back_icon.svg')} style={{ width: 24, height: 24 }} contentFit="contain" />
            </Pressable>
          </View>

          <View style={styles.divider} />

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.cardContent}>
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
          </ScrollView>
        </Animated.View>
      </View>

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
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: {
    flex: 1,
  },
  modalBody: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 16,
    justifyContent: 'center',
  },
  card: {
    width: '100%',
    height: '85%',
    maxHeight: '85%',
    backgroundColor: colors.white,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
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
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  cardContent: {
    padding: 24,
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
  scheduleButton: {
    alignSelf: 'flex-end',
    backgroundColor: colors.accent,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: colors.border,
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
