/**
 * Reusable Card Component
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../theme/colors';
import { spacing, borderRadius } from '../theme/typography';

const Card = ({
  children,
  onPress,
  variant = 'default', // 'default', 'elevated', 'outlined'
  style,
  ...props
}) => {
  const getCardStyle = () => {
    const baseStyle = [styles.card];

    switch (variant) {
      case 'elevated':
        baseStyle.push(styles.cardElevated);
        break;
      case 'outlined':
        baseStyle.push(styles.cardOutlined);
        break;
      default:
        baseStyle.push(styles.cardDefault);
    }

    return baseStyle;
  };

  if (onPress) {
    return (
      <TouchableOpacity
        style={[...getCardStyle(), style]}
        onPress={onPress}
        activeOpacity={0.8}
        {...props}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[...getCardStyle(), style]} {...props}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.xl,
    padding: spacing.base,
  },
  cardDefault: {
    backgroundColor: colors.backgroundLight,
  },
  cardElevated: {
    backgroundColor: colors.backgroundLighter,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  cardOutlined: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
  },
});

export default Card;
