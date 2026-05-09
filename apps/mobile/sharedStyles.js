import { StyleSheet } from 'react-native';
import { colors } from './theme';

export default StyleSheet.create({

  pageTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },

  outerContainer: {
    flex: 1,
    alignSelf: 'stretch',
  },

  scroll: {
    flex: 1,
  },

  // Complete style for the main FAB button (bottom-right, accent colored)
  fabMainButton: {
    width: 54,
    height: 54,
    borderRadius: 27,
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

  // Complete style for sub-buttons in expandable FAB menus (cream colored)
  fabSubButton: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.cream,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
    marginBottom: 10,
  },

  // Absolute positioning for FAB area — apply to outermost FAB element
  fabArea: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    alignItems: 'center',
    zIndex: 20,
  },

  // Partial base for circular navigation buttons (back buttons) — compose with local size/bg
  circleButton: {
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

  // Base for pill-shaped action buttons — compose with local backgroundColor, padding
  pillButton: {
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  pressed: {
    opacity: 0.85,
  },

});
