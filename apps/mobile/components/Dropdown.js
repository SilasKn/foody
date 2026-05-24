import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image as SvgIcon } from 'expo-image';
import shared from '../sharedStyles';
import { colors } from '../theme';

const DROPDOWN_ITEM_HEIGHT = 44;

export default function Dropdown({
  value,
  options,
  onChange,
  isOpen,
  setIsOpen,
  fullWidth = false,
  listAbsolute = false,
  maxVisibleItems,
  accessibilityLabel,
}) {
  const selected = options.find((opt) => opt.value === value);
  const renderedItems = options.map((opt, idx) => {
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
  });

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
          {maxVisibleItems ? (
            <ScrollView
              style={{ maxHeight: maxVisibleItems * DROPDOWN_ITEM_HEIGHT }}
              nestedScrollEnabled
              keyboardShouldPersistTaps="handled"
            >
              {renderedItems}
            </ScrollView>
          ) : (
            renderedItems
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
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
});
