import { useMemo, useRef, useState } from 'react';
import { Animated, Dimensions, FlatList, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import shared from '../sharedStyles';
import { colors } from '../theme';

const ITEM_WIDTH = 56;
const BUBBLE_SIZE = 40;
const PAST_DAYS = 7;
const FUTURE_DAYS = 365;
const TOTAL_DAYS = FUTURE_DAYS + 1;

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
    d.setDate(anchor.getDate() + i);
    out[i] = {
      iso: toIso(d),
      weekday: d.toLocaleDateString('en-US', { weekday: 'short' }),
      day: d.getDate(),
    };
  }
  return out;
}

function buildPastDates() {
  const now = new Date();
  const anchor = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const out = new Array(PAST_DAYS);
  for (let i = 0; i < PAST_DAYS; i++) {
    const d = new Date(anchor);
    d.setDate(anchor.getDate() - (PAST_DAYS - i));
    out[i] = {
      weekday: d.toLocaleDateString('en-US', { weekday: 'short' }),
      day: d.getDate(),
    };
  }
  return out;
}

function DayCell({ item, isCenter }) {
  return (
    <View style={styles.cell}>
      <Text style={[shared.typography.sub2, styles.weekday]}>
        {item.weekday}
      </Text>
      <View style={[styles.bubble, isCenter && styles.bubbleHidden]}>
        {!isCenter && (
          <Text style={[shared.typography.sub1, styles.dayNumber]}>
            {item.day}
          </Text>
        )}
      </View>
    </View>
  );
}

export default function DateCarousel({ selectedDate, onSelectDate }) {
  const listRef = useRef(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const dates = useMemo(() => buildDates(), []);
  const pastDates = useMemo(() => buildPastDates(), []);
  const [centerIso, setCenterIso] = useState(dates[0].iso);

  const pastTranslateX = scrollX.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -1],
  });

  const centerDay = useMemo(() => {
    const found = dates.find(d => d.iso === centerIso);
    return found ? found.day : '';
  }, [dates, centerIso]);

  function handleScroll(e) {
    const x = e.nativeEvent.contentOffset.x;
    const idx = Math.max(0, Math.min(dates.length - 1, Math.round(x / ITEM_WIDTH)));
    const iso = dates[idx].iso;
    if (iso !== centerIso) {
      setCenterIso(iso);
      Haptics.selectionAsync();
    }
  }

  function handleMomentumScrollEnd(e) {
    const idx = Math.round(e.nativeEvent.contentOffset.x / ITEM_WIDTH);
    const next = dates[idx];
    if (next && next.iso !== selectedDate) onSelectDate(next.iso);
  }

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.pastDaysRow, { transform: [{ translateX: pastTranslateX }] }]} pointerEvents="none">
        {pastDates.map((item, i) => (
          <View
            key={i}
            style={[styles.cell, { position: 'absolute', left: SIDE_PAD - (PAST_DAYS - i) * ITEM_WIDTH }]}
          >
            <Text style={[shared.typography.sub2, styles.weekday, styles.pastText]}>
              {item.weekday}
            </Text>
            <View style={[styles.bubble, styles.pastBubble]}>
              <Text style={[shared.typography.sub1, styles.dayNumber, styles.pastText]}>
                {item.day}
              </Text>
            </View>
          </View>
        ))}
      </Animated.View>
      <Animated.FlatList
        ref={listRef}
        data={dates}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={item => item.iso}
        contentOffset={{ x: 0, y: 0 }}
        getItemLayout={(_, i) => ({ length: ITEM_WIDTH, offset: ITEM_WIDTH * i, index: i })}
        snapToInterval={ITEM_WIDTH}
        decelerationRate="fast"
        bounces={false}
        contentContainerStyle={styles.content}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: true, listener: handleScroll }
        )}
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
    overflow: 'hidden',
  },
  pastDaysRow: {
    position: 'absolute',
    top: CONTAINER_PADDING_TOP,
    left: 0,
    right: 0,
    height: WEEKDAY_LINE_HEIGHT + WEEKDAY_MARGIN_BOTTOM + BUBBLE_SIZE,
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
