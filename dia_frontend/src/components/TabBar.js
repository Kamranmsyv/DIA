/**
 * Custom Tab Bar Component
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { typography, spacing } from '../theme/typography';

const TabBar = ({ state, descriptors, navigation }) => {
  const getIconName = (routeName, isFocused) => {
    const icons = {
      Home: isFocused ? 'home' : 'home-outline',
      Invest: isFocused ? 'trending-up' : 'trending-up-outline',
      Transfer: isFocused ? 'swap-vertical' : 'swap-vertical-outline',
      Plan: isFocused ? 'calendar' : 'calendar-outline',
      More: isFocused ? 'ellipsis-horizontal' : 'ellipsis-horizontal-outline',
    };
    return icons[routeName] || 'ellipse-outline';
  };

  return (
    <View style={styles.container}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label = options.tabBarLabel ?? options.title ?? route.name;
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            onPress={onPress}
            style={styles.tabItem}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.iconContainer,
                isFocused && styles.iconContainerActive,
              ]}
            >
              <Ionicons
                name={getIconName(route.name, isFocused)}
                size={24}
                color={isFocused ? colors.primary : colors.textSecondary}
              />
            </View>
            <Text
              style={[styles.label, isFocused && styles.labelActive]}
            >
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundLight,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingBottom: spacing.lg,
    paddingTop: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 48,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    marginBottom: spacing.xs,
  },
  iconContainerActive: {
    backgroundColor: 'rgba(0, 212, 170, 0.1)',
  },
  label: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    fontWeight: typography.weights.medium,
  },
  labelActive: {
    color: colors.primary,
  },
});

export default TabBar;
