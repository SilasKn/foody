import { useMemo, useRef, useState } from 'react';
import { Dimensions, FlatList, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import shared from '../sharedStyles';
import { colors } from '../theme';

const ITEM_WIDTH = 56;
const BUBBLE_SIZE = 40;
const PAST_DAYS = 7;
const FUTURE_DAYS = 365;
const TOTAL_DAYS = PAST_DAYS + FUTURE_DAYS + 1;

const CONTAINER_PADDING_TOP = 8;
const WEEKDAY_LINE_HEIGHT = 22;
const WEEKDAY_MARGIN_BOTTOM = 6;

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
    d.setDate(anchor.getDate() + (i - PAST_DAYS));
    out[i] = {
      iso: toIso(d),
      weekday: d.toLocaleDateString('en-US', { weekday: 'short' }),
      day: d.getDate(),
      past: i < PAST_DAYS,
    };
  }
  return out;
}

function DayCell({ item, isCenter }) {
  return (
    <View style={styles.cell}>
      <Text style={[shared.typography.sub2, styles.weekday, item.past && styles.pastText]}>
        {item.weekday}
      </Text>
      <View style={[styles.bubble, isCenter && styles.bubbleHidden, item.past && styles.pastBubble]}>
        {!isCenter && (
          <Text style={[shared.typography.sub1, styles.dayNumber, item.past && styles.pastText]}>
            {item.day}
          </Text>
        )}
      </View>
    </View>
  );
}

export default function DateCarousel({ selectedDate, onSelectDate }) {
  const listRef = useRef(null);
  const dates = useMemo(() => buildDates(), []);
  const [centerIso, setCenterIso] = useState(dates[PAST_DAYS].iso);

  const centerDay = useMemo(() => {
    const found = dates.find(d => d.iso === centerIso);
    return found ? found.day : '';
  }, [dates, centerIso]);

  function handleScroll(e) {
    const x = e.nativeEvent.contentOffset.x;
    const rawIdx = Math.max(0, Math.min(dates.length - 1, Math.round(x / ITEM_WIDTH)));
    const idx = Math.max(PAST_DAYS, rawIdx);
    const iso = dates[idx].iso;
    if (iso !== centerIso) {
      setCenterIso(iso);
      Haptics.selectionAsync();
    }
  }

  function handleMomentumScrollEnd(e) {
    const rawIdx = Math.round(e.nativeEvent.contentOffset.x / ITEM_WIDTH);
    if (rawIdx < PAST_DAYS) {
      listRef.current?.scrollToOffset({ offset: PAST_DAYS * ITEM_WIDTH, animated: true });
      const today = dates[PAST_DAYS];
      if (today && today.iso !== selectedDate) onSelectDate(today.iso);
      return;
    }
    const next = dates[rawIdx];
    if (next && next.iso !== selectedDate) onSelectDate(next.iso);
  }

  return (
    <View style={styles.container}>
      <FlatList
        ref={listRef}
        data={dates}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={item => item.iso}
        contentOffset={{ x: PAST_DAYS * ITEM_WIDTH, y: 0 }}
        getItemLayout={(_, i) => ({ length: ITEM_WIDTH, offset: ITEM_WIDTH * i, index: i })}
        snapToInterval={ITEM_WIDTH}
        decelerationRate="fast"
        bounces={false}
        contentContainerStyle={styles.content}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        renderItem={({ item }) => (
          <DayCell
            item={item}
            isCenter={item.iso === centerIso}
          />
        )}
      />
      <View style={styles.centerAccent} pointerEvents="none">
        <Text style={[shared.typography.sub1, styles.centerAccentNumber]}>
          {centerDay}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.cream,
    paddingTop: CONTAINER_PADDING_TOP,
    paddingBottom: 8,
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
  bubble: {
    width: BUBBLE_SIZE,
    height: BUBBLE_SIZE,
    borderRadius: BUBBLE_SIZE / 2,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubbleHidden: {
    opacity: 0,
  },
  dayNumber: {
    color: colors.text,
  },
  centerAccent: {
    position: 'absolute',
    left: (SCREEN_WIDTH - BUBBLE_SIZE) / 2,
    top: CONTAINER_PADDING_TOP + WEEKDAY_LINE_HEIGHT + WEEKDAY_MARGIN_BOTTOM,
    width: BUBBLE_SIZE,
    height: BUBBLE_SIZE,
    borderRadius: BUBBLE_SIZE / 2,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerAccentNumber: {
    color: colors.white,
  },
  pastText: {
    opacity: 0.3,
  },
  pastBubble: {
    opacity: 0.3,
  },
});
