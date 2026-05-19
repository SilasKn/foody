import { useEffect, useMemo, useRef } from 'react';
import { Dimensions, FlatList, StyleSheet, Text, View } from 'react-native';
import shared from '../sharedStyles';
import { colors } from '../theme';

const ITEM_WIDTH = 56;
const DAYS_BEFORE = 365;
const DAYS_AFTER = 365;
const TOTAL_DAYS = DAYS_BEFORE + DAYS_AFTER + 1;

const SCREEN_WIDTH = Dimensions.get('window').width;
const SIDE_PAD = (SCREEN_WIDTH - ITEM_WIDTH) / 2;

function toIso(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function buildDates() {
  const now = new Date();
  const anchor = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const out = new Array(TOTAL_DAYS);
  for (let i = 0; i < TOTAL_DAYS; i++) {
    const d = new Date(anchor);
    d.setDate(anchor.getDate() + (i - DAYS_BEFORE));
    out[i] = {
      iso: toIso(d),
      weekday: d.toLocaleDateString('en-US', { weekday: 'short' }),
      day: d.getDate(),
    };
  }
  return out;
}

function DayCell({ item, isSelected }) {
  return (
    <View style={styles.cell}>
      <Text
        style={[
          shared.typography.sub2,
          styles.weekday,
          isSelected && styles.weekdaySelected,
        ]}
      >
        {item.weekday}
      </Text>
      <View style={[styles.bubble, isSelected && styles.bubbleSelected]}>
        <Text
          style={[
            shared.typography.sub1,
            styles.dayNumber,
            isSelected && styles.dayNumberSelected,
          ]}
        >
          {item.day}
        </Text>
      </View>
    </View>
  );
}

export default function DateCarousel({ selectedDate, onSelectDate }) {
  const listRef = useRef(null);
  const didMountRef = useRef(false);
  const selfSnapRef = useRef(false);
  const dates = useMemo(() => buildDates(), []);
  const indexByIso = useMemo(() => {
    const m = {};
    dates.forEach((d, i) => { m[d.iso] = i; });
    return m;
  }, [dates]);

  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    if (selfSnapRef.current) {
      selfSnapRef.current = false;
      return;
    }
    const idx = indexByIso[selectedDate];
    if (idx == null) return;
    listRef.current?.scrollToIndex({ index: idx, animated: true });
  }, [selectedDate, indexByIso]);

  return (
    <View style={styles.container}>
      <FlatList
        ref={listRef}
        data={dates}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={item => item.iso}
        contentOffset={{ x: DAYS_BEFORE * ITEM_WIDTH, y: 0 }}
        getItemLayout={(_, i) => ({ length: ITEM_WIDTH, offset: ITEM_WIDTH * i, index: i })}
        snapToInterval={ITEM_WIDTH}
        decelerationRate="fast"
        contentContainerStyle={styles.content}
        renderItem={({ item }) => (
          <DayCell item={item} isSelected={item.iso === selectedDate} />
        )}
        onMomentumScrollEnd={e => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / ITEM_WIDTH);
          const next = dates[idx];
          if (next && next.iso !== selectedDate) {
            selfSnapRef.current = true;
            onSelectDate(next.iso);
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.cream,
    paddingVertical: 8,
  },
  content: {
    paddingHorizontal: SIDE_PAD,
  },
  cell: {
    width: ITEM_WIDTH,
    alignItems: 'center',
  },
  weekday: {
    color: colors.textMuted,
    marginBottom: 6,
  },
  weekdaySelected: {
    color: colors.text,
    fontFamily: 'Poppins-SemiBold',
  },
  bubble: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubbleSelected: {
    backgroundColor: colors.accent,
  },
  dayNumber: {
    color: colors.text,
  },
  dayNumberSelected: {
    color: colors.white,
  },
});
