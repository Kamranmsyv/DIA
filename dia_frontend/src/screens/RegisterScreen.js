/**
 * Register Screen
 * User registration with risk profile selection
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button, Input, Card } from '../components';
import { colors } from '../theme/colors';
import { typography, spacing, borderRadius } from '../theme/typography';
import { register } from '../services/api';

const RISK_PROFILES = [
  {
    id: 'Conservative',
    title: 'Conservative',
    description: 'Low risk, stable returns',
    icon: 'shield-checkmark',
    color: '#3B82F6',
  },
  {
    id: 'Moderate',
    title: 'Moderate',
    description: 'Balanced risk and returns',
    icon: 'analytics',
    color: colors.primary,
  },
  {
    id: 'Aggressive',
    title: 'Aggressive',
    description: 'High risk, high potential returns',
    icon: 'rocket',
    color: '#F59E0B',
  },
];

const RegisterScreen = ({ navigation }) => {
  const [step, setStep] = useState(1); // 1: credentials, 2: risk profile
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedRisk, setSelectedRisk] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validateStep1 = () => {
    const newErrors = {};
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }
    if (!password.trim()) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handleRegister = async () => {
    if (!selectedRisk) {
      Alert.alert('Select Risk Profile', 'Please select your investment risk profile');
      return;
    }

    setLoading(true);
    try {
      const response = await register(email, password, selectedRisk);
      if (response.success) {
        Alert.alert(
          'Success!',
          'Your account has been created. Please log in.',
          [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
        );
      }
    } catch (error) {
      Alert.alert(
        'Registration Error',
        error.response?.data?.error || 'Registration failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <>
      <Text style={styles.title}>Create Account</Text>
      <Text style={styles.subtitle}>Start your investment journey today</Text>

      <View style={styles.form}>
        <Input
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="Enter your email"
          keyboardType="email-address"
          autoCapitalize="none"
          error={errors.email}
        />

        <Input
          label="Password"
          value={password}
          onChangeText={setPassword}
          placeholder="Create a password"
          secureTextEntry
          error={errors.password}
        />

        <Input
          label="Confirm Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Confirm your password"
          secureTextEntry
          error={errors.confirmPassword}
        />

        <Button
          title="Continue"
          variant="primary"
          size="large"
          onPress={handleNext}
          style={styles.button}
        />

        <View style={styles.loginLink}>
          <Text style={styles.loginText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginHighlight}>Log in</Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );

  const renderStep2 = () => (
    <>
      <Text style={styles.title}>Risk Profile</Text>
      <Text style={styles.subtitle}>Select your investment style</Text>

      <View style={styles.riskContainer}>
        {RISK_PROFILES.map((profile) => (
          <TouchableOpacity
            key={profile.id}
            activeOpacity={0.8}
            onPress={() => setSelectedRisk(profile.id)}
          >
            <Card
              style={[
                styles.riskCard,
                selectedRisk === profile.id && styles.riskCardSelected,
                selectedRisk === profile.id && { borderColor: profile.color },
              ]}
            >
              <View style={[styles.riskIcon, { backgroundColor: profile.color + '20' }]}>
                <Ionicons name={profile.icon} size={24} color={profile.color} />
              </View>
              <View style={styles.riskInfo}>
                <Text style={styles.riskTitle}>{profile.title}</Text>
                <Text style={styles.riskDescription}>{profile.description}</Text>
              </View>
              {selectedRisk === profile.id && (
                <Ionicons name="checkmark-circle" size={24} color={profile.color} />
              )}
            </Card>
          </TouchableOpacity>
        ))}
      </View>

      <Button
        title="Create Account"
        variant="primary"
        size="large"
        onPress={handleRegister}
        loading={loading}
        disabled={!selectedRisk}
        style={styles.button}
      />
    </>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => (step === 2 ? setStep(1) : navigation.goBack())}
            >
              <Ionicons
                name="chevron-back"
                size={24}
                color={colors.textPrimary}
              />
            </TouchableOpacity>
            <View style={styles.stepIndicator}>
              <View style={[styles.stepDot, step >= 1 && styles.stepDotActive]} />
              <View style={[styles.stepLine, step >= 2 && styles.stepLineActive]} />
              <View style={[styles.stepDot, step >= 2 && styles.stepDotActive]} />
            </View>
            <View style={styles.placeholder} />
          </View>

          {step === 1 ? renderStep1() : renderStep2()}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing['2xl'],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },
  backButton: {
    padding: spacing.xs,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  stepDotActive: {
    backgroundColor: colors.primary,
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: colors.border,
    marginHorizontal: spacing.xs,
  },
  stepLineActive: {
    backgroundColor: colors.primary,
  },
  placeholder: {
    width: 32,
  },
  title: {
    fontSize: typography.sizes['3xl'],
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginTop: spacing['2xl'],
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.sizes.base,
    color: colors.textSecondary,
    marginBottom: spacing['2xl'],
  },
  form: {
    gap: spacing.sm,
  },
  button: {
    marginTop: spacing.lg,
  },
  loginLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.xl,
  },
  loginText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  loginHighlight: {
    fontSize: typography.sizes.sm,
    color: colors.primary,
    fontWeight: typography.weights.semibold,
  },
  riskContainer: {
    gap: spacing.md,
  },
  riskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.base,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  riskCardSelected: {
    backgroundColor: 'rgba(0, 212, 170, 0.1)',
  },
  riskIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  riskInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  riskTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
  },
  riskDescription: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
});

export default RegisterScreen;
