import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image as SvgIcon } from 'expo-image';
import shared from '../sharedStyles';
import { colors } from '../theme';

const WEEKDAY_LABELS = ['Mo', 'Tue', 'We', 'Thur', 'Fri', 'Sat', 'Sun'];
const TOTAL_CELLS = 42;

function isoFor(y, mZeroBased, d) {
  return `${y}-${String(mZeroBased + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

export default function MonthCalendar({
  scheduledCountsByDate = {},
  selectedDate = null,
  onSelectDate,
}) {
  const [viewed, setViewed] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  function goPrev() {
    setViewed(v => new Date(v.getFullYear(), v.getMonth() - 1, 1));
  }
  function goNext() {
    setViewed(v => new Date(v.getFullYear(), v.getMonth() + 1, 1));
  }

  const year = viewed.getFullYear();
  const month = viewed.getMonth();
  const monthLabel = viewed.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDow = (new Date(year, month, 1).getDay() + 6) % 7;

  const cells = Array.from({ length: TOTAL_CELLS }, (_, i) => {
    const day = i - firstDow + 1;
    return day >= 1 && day <= daysInMonth ? day : null;
  });

  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
  const todayDate = isCurrentMonth ? today.getDate() : null;

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Pressable
          onPress={goPrev}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Previous month"
        >
          <SvgIcon source={require('../assets/chevron_back_icon.svg')} style={{ width: 22, height: 22 }} contentFit="contain" />
        </Pressable>
        <Text style={[shared.typography.h3, styles.monthLabel]}>{monthLabel}</Text>
        <Pressable
          onPress={goNext}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Next month"
        >
          <SvgIcon source={require('../assets/chevron_forward_icon.svg')} style={{ width: 22, height: 22 }} contentFit="contain" />
        </Pressable>
      </View>

      <View style={styles.headerDivider} />

      <View style={styles.weekdayRow}>
        {WEEKDAY_LABELS.map(label => (
          <Text key={label} style={[shared.typography.sub2, styles.weekdayLabel]}>
            {label}
          </Text>
        ))}
      </View>

      <View style={styles.grid}>
        {Array.from({ length: 6 }).map((_, rowIdx) => {
          const isLastRow = rowIdx === 5;
          return (
            <View
              key={rowIdx}
              style={[styles.row, !isLastRow && styles.rowBorderBottom]}
            >
              {Array.from({ length: 7 }).map((_, colIdx) => {
                const i = rowIdx * 7 + colIdx;
                const day = cells[i];
                const isLastCol = colIdx === 6;
                const iso = day !== null ? isoFor(year, month, day) : null;
                const isSelected = iso !== null && iso === selectedDate;
                const count = iso !== null ? (scheduledCountsByDate[iso] ?? 0) : 0;
                return (
                  <Pressable
                    key={colIdx}
                    style={[styles.cell, !isLastCol && styles.cellBorderRight]}
                    onPress={day !== null ? () => onSelectDate?.(iso) : undefined}
                    disabled={day === null}
                  >
                    {day !== null && (
                      <View style={[styles.dayContent, isSelected && styles.dayContentSelected]}>
                        {day === todayDate ? (
                          <View style={styles.todayCircle}>
                            <Text style={[shared.typography.sub1, styles.cellText]}>{day}</Text>
                          </View>
                        ) : (
                          <Text style={[shared.typography.sub1, styles.cellText]}>{day}</Text>
                        )}
                        {count > 0 && (
                          <View style={styles.dotsRow}>
                            {Array.from({ length: count }).map((_, dotIdx) => (
                              <View key={dotIdx} style={styles.dot} />
                            ))}
                          </View>
                        )}
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 6,
    borderColor: colors.accent2,
    borderRadius: 24,
    backgroundColor: colors.white,
    padding: 12,
    marginTop: 16,
    aspectRatio: 0.85,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  monthLabel: {
    color: colors.text,
    textAlign: 'center',
    flex: 1,
  },
  headerDivider: {
    height: 1,
    backgroundColor: colors.text,
    marginTop: 8,
    marginBottom: 4,
  },
  weekdayRow: {
    flexDirection: 'row',
    paddingVertical: 4,
  },
  weekdayLabel: {
    flex: 1,
    textAlign: 'center',
    color: colors.textMuted,
  },
  grid: {
    flex: 1,
    overflow: 'hidden',
  },
  row: {
    flex: 1,
    flexDirection: 'row',
  },
  rowBorderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: colors.text,
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellBorderRight: {
    borderRightWidth: 1,
    borderRightColor: colors.text,
  },
  cellText: {
    color: colors.text,
  },
  todayCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.pillActive,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  dayContentSelected: {
    borderColor: colors.textMuted,
  },
  dotsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 2,
    maxWidth: 28,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.accent,
    marginHorizontal: 1,
    marginVertical: 1,
  },
});
