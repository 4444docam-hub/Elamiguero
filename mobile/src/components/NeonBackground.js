import React from 'react';
import { View, StyleSheet } from 'react-native';
import { COLORS } from '../utils/constants';

const NeonBackground = ({ children, style }) => {
  return (
    <View style={[styles.container, style]}>
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <View style={[styles.pixel, styles.pixelOne]} />
        <View style={[styles.pixel, styles.pixelTwo]} />
        <View style={[styles.pixel, styles.pixelThree]} />
        <View style={[styles.pixel, styles.pixelFour]} />
      </View>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  pixel: { position: 'absolute' },
  pixelOne: {
    width: 128,
    height: 128,
    top: -32,
    right: -32,
    backgroundColor: COLORS.secondary + '30',
  },
  pixelTwo: {
    width: 192,
    height: 192,
    bottom: -64,
    left: -64,
    backgroundColor: COLORS.primary + '24',
  },
  pixelThree: {
    width: 96,
    height: 96,
    top: '42%',
    left: '6%',
    backgroundColor: COLORS.accent + '2e',
  },
  pixelFour: {
    width: 64,
    height: 64,
    top: '12%',
    left: '80%',
    backgroundColor: COLORS.success + '22',
  },
});

export default NeonBackground;
