/**
 * OTP Input Component with Keypad
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { typography, spacing, borderRadius } from '../theme/typography';

const OTPInput = ({
  length = 6,
  value = '',
  onChangeValue,
  showKeypad = true,
}) => {
  const handleKeyPress = (key) => {
    if (value.length < length) {
      onChangeValue(value + key);
    }
  };

  const handleDelete = () => {
    if (value.length > 0) {
      onChangeValue(value.slice(0, -1));
    }
  };

  const renderOTPBoxes = () => {
    const boxes = [];
    for (let i = 0; i < length; i++) {
      const isFilled = i < value.length;
      const isActive = i === value.length;
      boxes.push(
        <View
          key={i}
          style={[
            styles.otpBox,
            isFilled && styles.otpBoxFilled,
            isActive && styles.otpBoxActive,
          ]}
        >
          <Text style={styles.otpText}>{value[i] || ''}</Text>
        </View>
      );
    }
    return boxes;
  };

  const renderKeypad = () => {
    const keys = [
      ['1', '2', '3'],
      ['4', '5', '6'],
      ['7', '8', '9'],
      ['', '0', 'delete'],
    ];

    return (
      <View style={styles.keypad}>
        {keys.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.keypadRow}>
            {row.map((key, keyIndex) => {
              if (key === '') {
                return <View key={keyIndex} style={styles.keypadButton} />;
              }
              if (key === 'delete') {
                return (
                  <TouchableOpacity
                    key={keyIndex}
                    style={styles.keypadButton}
                    onPress={handleDelete}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name="backspace-outline"
                      size={24}
                      color={colors.textPrimary}
                    />
                  </TouchableOpacity>
                );
              }
              return (
                <TouchableOpacity
                  key={keyIndex}
                  style={styles.keypadButton}
                  onPress={() => handleKeyPress(key)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.keypadText}>{key}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.otpContainer}>{renderOTPBoxes()}</View>
      {showKeypad && renderKeypad()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing['2xl'],
  },
  otpBox: {
    width: 48,
    height: 52,
    backgroundColor: colors.inputBackground,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpBoxFilled: {
    borderColor: colors.primary,
    backgroundColor: colors.backgroundLighter,
  },
  otpBoxActive: {
    borderColor: colors.primary,
  },
  otpText: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  keypad: {
    paddingHorizontal: spacing.xl,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  keypadButton: {
    width: 72,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.lg,
  },
  keypadText: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.medium,
    color: colors.textPrimary,
  },
});

export default OTPInput;
