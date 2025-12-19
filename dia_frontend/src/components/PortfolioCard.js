/**
 * Portfolio Card Component
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from './Card';
import { colors } from '../theme/colors';
import { typography, spacing } from '../theme/typography';

const PortfolioCard = ({
  title = 'My Investments',
  fundName,
  value,
  change,
  changePercent,
  currency = 'AZN',
  onPress,
  style,
}) => {
  const isPositive = change >= 0;

  return (
    <Card onPress={onPress} style={[styles.container, style]}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Ionicons
          name="chevron-forward"
          size={20}
          color={colors.textSecondary}
        />
      </View>
      {fundName && <Text style={styles.fundName}>{fundName}</Text>}
      <View style={styles.valueContainer}>
        <Text style={styles.currency}>{currency}</Text>
        <Text style={styles.value}>
          {typeof value === 'number' ? value.toLocaleString('en-US', { minimumFractionDigits: 2 }) : value}
        </Text>
      </View>
      {(change !== undefined || changePercent !== undefined) && (
        <View style={styles.changeContainer}>
          <Ionicons
            name={isPositive ? 'trending-up' : 'trending-down'}
            size={16}
            color={isPositive ? colors.success : colors.error}
          />
          <Text
            style={[
              styles.changeText,
              { color: isPositive ? colors.success : colors.error },
            ]}
          >
            {isPositive ? '+' : ''}
            {changePercent !== undefined
              ? `${changePercent.toFixed(2)}%`
              : `${currency} ${change?.toFixed(2)}`}
          </Text>
        </View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.base,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    fontWeight: typography.weights.medium,
  },
  fundName: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: spacing.xs,
  },
  currency: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginRight: spacing.xs,
  },
  value: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  changeText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
});

export default PortfolioCard;
