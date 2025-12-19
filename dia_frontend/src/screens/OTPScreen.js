/**
 * OTP Verification Screen
 * 6-digit OTP entry with custom keypad
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button, OTPInput } from '../components';
import { colors } from '../theme/colors';
import { typography, spacing } from '../theme/typography';

const OTPScreen = ({ navigation, route }) => {
  const [otp, setOtp] = useState('');
  const [timer, setTimer] = useState(60);
  const [loading, setLoading] = useState(false);

  const email = route?.params?.email || 'user@example.com';

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleVerify = async () => {
    if (otp.length !== 6) {
      Alert.alert('Invalid OTP', 'Please enter a 6-digit code');
      return;
    }

    setLoading(true);
    // Simulate verification
    setTimeout(() => {
      setLoading(false);
      // For demo, accept any 6-digit code
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainTabs' }],
      });
    }, 1500);
  };

  const handleResend = () => {
    if (timer > 0) return;
    setTimer(60);
    Alert.alert('Code Sent', 'A new verification code has been sent to your email.');
  };

  const formatTimer = () => {
    const minutes = Math.floor(timer / 60);
    const seconds = timer % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons
            name="chevron-back"
            size={24}
            color={colors.textPrimary}
          />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title}>Verify</Text>

        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>
            Enter the <Text style={styles.highlight}>6 digit OTP</Text> sent to your email:
          </Text>
          <Text style={styles.email}>{email}</Text>
        </View>

        {/* OTP Input */}
        <OTPInput
          length={6}
          value={otp}
          onChangeValue={setOtp}
          showKeypad={true}
        />

        {/* Timer */}
        <View style={styles.timerContainer}>
          <Text style={styles.timerText}>
            Resending OTP in <Text style={styles.timerValue}>{formatTimer()}</Text>
          </Text>
        </View>

        {/* Continue Button */}
        <Button
          title="Continue"
          variant="primary"
          size="large"
          onPress={handleVerify}
          loading={loading}
          disabled={otp.length !== 6}
          style={styles.continueButton}
        />

        {/* Resend Link */}
        <View style={styles.resendContainer}>
          <Text style={styles.resendText}>Did not receive the code? </Text>
          <TouchableOpacity onPress={handleResend} disabled={timer > 0}>
            <Text
              style={[
                styles.resendLink,
                timer > 0 && styles.resendLinkDisabled,
              ]}
            >
              Send again
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  backButton: {
    padding: spacing.xs,
    marginLeft: -spacing.xs,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
  },
  title: {
    fontSize: typography.sizes['3xl'],
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginTop: spacing.lg,
    marginBottom: spacing['2xl'],
  },
  infoContainer: {
    marginBottom: spacing['2xl'],
  },
  infoText: {
    fontSize: typography.sizes.base,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  highlight: {
    color: colors.primary,
    fontWeight: typography.weights.semibold,
  },
  email: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  timerText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  timerValue: {
    color: colors.primary,
    fontWeight: typography.weights.semibold,
  },
  continueButton: {
    marginBottom: spacing.xl,
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  resendText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  resendLink: {
    fontSize: typography.sizes.sm,
    color: colors.primary,
    fontWeight: typography.weights.semibold,
  },
  resendLinkDisabled: {
    color: colors.textMuted,
  },
});

export default OTPScreen;
