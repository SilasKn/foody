import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, Image, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import ScreenShell from '../components/ScreenShell';
import { useAuth } from '../providers/AuthProvider';
import { colors } from '../theme';
import { supabase } from '../utils/supabase';

const placeholderImage = require('../assets/no-picture.png');

const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];

function formatDateDisplay(date) {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${d}.${m}.${date.getFullYear()}`;
}

export default function ScheduleRecipeScreen({ route, navigation }) {
  const { recipe } = route.params;
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(null);
  const [showPicker, setShowPicker] = useState(false);
  const [mealType, setMealType] = useState(null);
  const [saving, setSaving] = useState(false);

  const canSchedule = selectedDate !== null && mealType !== null;

  const onDateChange = (event, date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
      if (event.type === 'set' && date) setSelectedDate(date);
    } else {
      if (date) setSelectedDate(date);
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
    <ScreenShell navigation={navigation} activeTab="recipes">
      <View style={styles.outerContainer}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            <View style={styles.imageSection}>
              <View style={styles.imageWrapper}>
                <Image
                  source={recipe.imageUrl ? { uri: recipe.imageUrl } : placeholderImage}
                  style={styles.image}
                  resizeMode="cover"
                />
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Back"
                onPress={() => navigation.goBack()}
                hitSlop={10}
                style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.85 }]}
              >
                <Ionicons name="arrow-back" size={24} color={colors.text} />
              </Pressable>
            </View>

            <View style={styles.divider} />

            <View style={styles.cardContent}>
              <Text style={styles.sectionLabel}>Schedule for :</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Select date"
                onPress={() => setShowPicker(true)}
                style={({ pressed }) => [styles.dateDropdown, pressed && { opacity: 0.8 }]}
              >
                <Text style={[styles.dateDropdownText, !selectedDate && styles.datePlaceholder]}>
                  {selectedDate ? formatDateDisplay(selectedDate) : 'TT.MM.JJJJ'}
                </Text>
                <Ionicons name="chevron-down" size={20} color={colors.text} />
              </Pressable>

              <View style={styles.spacer} />

              <Text style={styles.sectionLabel}>As type of meal:</Text>
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
                    <Text style={[styles.mealPillText, mealType === type && styles.mealPillTextActive]}>
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
                <Text style={styles.scheduleButtonText}>{saving ? 'Saving…' : 'Schedule'}</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </View>

      {Platform.OS === 'ios' ? (
        <Modal
          visible={showPicker}
          transparent
          animationType="fade"
          onRequestClose={() => setShowPicker(false)}
        >
          <Pressable style={styles.pickerBackdrop} onPress={() => setShowPicker(false)}>
            <View style={styles.pickerCard}>
              <DateTimePicker
                value={selectedDate ?? new Date()}
                mode="date"
                display="spinner"
                minimumDate={new Date()}
                onChange={onDateChange}
                locale="de-DE"
              />
              <Pressable style={styles.pickerDone} onPress={() => setShowPicker(false)}>
                <Text style={styles.pickerDoneText}>Done</Text>
              </Pressable>
            </View>
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
    paddingBottom: 24,
  },
  card: {
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
    marginVertical: 20,
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
  cardContent: {
    padding: 24,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '700',
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
    fontSize: 15,
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
    fontSize: 15,
    color: colors.text,
    fontWeight: '500',
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
    fontWeight: '600',
    fontSize: 15,
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
    fontSize: 16,
    fontWeight: '600',
    color: colors.accent,
  },
});
