import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions, Animated, Easing } from 'react-native';
import { COLORS } from '../utils/constants';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const PIECES = 60;
const COLORS_LIST = [
  COLORS.primary,
  COLORS.secondary,
  COLORS.accent,
  COLORS.success,
  '#FFD700',
  '#FF9F1C',
];

const Confetti = ({ active, duration = 2200, onDone }) => {
  const pieces = useRef(
    Array.from({ length: PIECES }).map(() => {
      const size = 6 + Math.random() * 8;
      return {
        size,
        color: COLORS_LIST[Math.floor(Math.random() * COLORS_LIST.length)],
        startX: Math.random() * SCREEN_WIDTH,
        startY: -30 - Math.random() * 120,
        delay: Math.random() * 300,
        horizontal: Math.random() * 300 - 150,
      };
    })
  ).current;

  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (active) {
      progress.setValue(0);
      Animated.timing(progress, {
        toValue: 1,
        duration,
        easing: Easing.linear,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished && onDone) onDone();
      });
    }
  }, [active]);

  if (!active) return null;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {pieces.map((piece, index) => {
        const translateY = progress.interpolate({
          inputRange: [0, 1],
          outputRange: [piece.startY, SCREEN_HEIGHT + 60],
        });
        const translateX = progress.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0, piece.horizontal, piece.horizontal],
        });
        const rotate = progress.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', `${Math.random() > 0.5 ? '' : '-'}720deg`],
        });
        const opacity = progress.interpolate({
          inputRange: [0, 0.75, 1],
          outputRange: [1, 1, 0],
        });

        return (
          <Animated.View
            key={index}
            style={{
              position: 'absolute',
              left: piece.startX,
              top: 0,
              width: piece.size,
              height: piece.size * 1.4,
              backgroundColor: piece.color,
              borderRadius: 2,
              opacity,
              transform: [{ translateX }, { translateY }, { rotate }],
              shadowColor: piece.color,
              shadowOpacity: 0.9,
              shadowRadius: 6,
              elevation: 6,
            }}
          />
        );
      })}
    </View>
  );
};

export default Confetti;
