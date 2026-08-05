import { StyleSheet, Platform } from 'react-native';
import { COLORS } from './constants';

export const FONTS = {
  arcade: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
};

export const neonShadow = (color, radius = 18, opacity = 0.9) => ({
  shadowColor: color,
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: opacity,
  shadowRadius: radius,
  elevation: 12,
});

export const pixelShadow = (size = 4, color = '#000000', opacity = 0.9) => ({
  shadowColor: color,
  shadowOffset: { width: size, height: size },
  shadowOpacity: opacity,
  shadowRadius: 0,
  elevation: 5,
});

export const pixelTextShadow = {
  textShadowColor: '#000000',
  textShadowOffset: { width: 2, height: 2 },
  textShadowRadius: 0,
};

export const sharedStyles = StyleSheet.create({
  screenTitle: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 2,
    color: COLORS.primary,
    textTransform: 'uppercase',
    fontFamily: FONTS.arcade,
    ...pixelTextShadow,
  },
  neonCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.black,
    borderRadius: 0,
    ...pixelShadow(4),
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 0,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.black,
    ...pixelShadow(4),
  },
  primaryButtonText: {
    color: COLORS.black,
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 2,
    textTransform: 'uppercase',
    fontFamily: FONTS.arcade,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: 0,
    padding: 14,
    fontSize: 15,
    borderWidth: 2,
    borderColor: COLORS.border,
    color: COLORS.text,
  },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 0,
    paddingHorizontal: 6,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.black,
  },
  badgeText: { color: COLORS.black, fontSize: 12, fontWeight: '900' },
});
