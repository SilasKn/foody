import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import shared from '../sharedStyles';
import { colors } from '../theme';
import { supabase } from '../utils/supabase';

const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];

function parseIsoToLocalDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function dateToIsoLocal(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function formatDateDisplay(date) {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${d}.${m}.${date.getFullYear()}`;
}

export default function RescheduleScreen({ route, navigation }) {
  const { entry } = route.params;

  const backdropAnim = useRef(new Animated.Value(0)).current;
  const cardOpacityAnim = useRef(new Animated.Value(0)).current;
  const cardScaleAnim = useRef(new Animated.Value(0.96)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(backdropAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.timing(cardOpacityAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.spring(cardScaleAnim, { toValue: 1, useNativeDriver: true, damping: 18, stiffness: 220 }),
    ]).start();
  }, []);

  const [selectedDate, setSelectedDate] = useState(() => parseIsoToLocalDate(entry.scheduled_for));
  const [tempPickerDate, setTempPickerDate] = useState(null);
  const [showPicker, setShowPicker] = useState(false);
  const [mealType, setMealType] = useState(entry.scheduled_as);
  const [saving, setSaving] = useState(false);

  const canReschedule = selectedDate !== null && mealType !== null;

  const onDateChange = (event, date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
      if (event.type === 'set' && date) setSelectedDate(date);
    } else {
      if (date) setTempPickerDate(date);
    }
  };

  const onReschedule = async () => {
    if (!canReschedule || saving) return;
    setSaving(true);
    const isoDate = dateToIsoLocal(selectedDate);
    const { data, error } = await supabase
      .from('recipe_schedule')
      .update({ scheduled_for: isoDate, scheduled_as: mealType })
      .eq('id', entry.id)
      .select('id');
    setSaving(false);
    if (error) {
      Alert.alert('Error', error.message);
      return;
    }
    if (!data || data.length === 0) {
      Alert.alert('Error', 'Could not save the change. Please try again.');
      return;
    }
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <Pressable style={StyleSheet.absoluteFillObject} onPress={() => navigation.goBack()}>
        <Animated.View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.35)', opacity: backdropAnim }]} />
      </Pressable>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']} pointerEvents="box-none">
        <View style={styles.centerWrap} pointerEvents="box-none">
          <Animated.View
            style={[styles.card, { opacity: cardOpacityAnim, transform: [{ scale: cardScaleAnim }] }]}
          >
            <Text style={[shared.typography.h3, styles.title]}>Reschedule the recipe:</Text>

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
              <Ionicons name="chevron-down" size={20} color={colors.text} />
            </Pressable>

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
              accessibilityLabel="Confirm reschedule"
              onPress={onReschedule}
              disabled={!canReschedule || saving}
              style={({ pressed }) => [
                styles.rescheduleButton,
                (!canReschedule || saving) && styles.rescheduleButtonDisabled,
                pressed && canReschedule && !saving && { opacity: 0.85 },
              ]}
            >
              <Text style={[shared.typography.sub1, styles.rescheduleButtonText]}>{saving ? 'Saving…' : 'Reschedule'}</Text>
            </Pressable>
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
  safe: { flex: 1 },
  centerWrap: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  title: {
    color: colors.text,
    marginBottom: 12,
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
    marginBottom: 20,
  },
  dateDropdownText: {
    color: colors.text,
  },
  datePlaceholder: {
    color: colors.textMuted,
  },
  sectionLabel: {
    color: colors.text,
    marginBottom: 10,
  },
  mealGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
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
  rescheduleButton: {
    alignSelf: 'flex-end',
    backgroundColor: colors.accent,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  rescheduleButtonDisabled: {
    opacity: 0.4,
  },
  rescheduleButtonText: {
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
    paddingBottom: 24,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  pickerDone: {
    alignSelf: 'flex-end',
    marginRight: 20,
    marginTop: 4,
  },
  pickerDoneText: {
    color: colors.accent,
  },
});
