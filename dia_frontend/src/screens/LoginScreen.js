/**
 * Login Screen
 * Email/password authentication with social login options
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
import { Button, Input } from '../components';
import { colors } from '../theme/colors';
import { typography, spacing } from '../theme/typography';
import { useAuth } from '../context/AuthContext';
import { login } from '../services/api';

const LoginScreen = ({ navigation }) => {
  const { signIn, setIsLoading, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    }
    if (!password.trim()) {
      newErrors.password = 'Password is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const response = await login(email, password);
      if (response.success) {
        // Just call signIn - RootNavigator will handle navigation automatically
        signIn(
          { userId: response.data.user_id, username: email },
          response.data.token
        );
        // Navigation handled by RootNavigator based on isAuthenticated
      } else {
        Alert.alert('Login Error', response.error || 'Login failed');
      }
    } catch (error) {
      console.log('Login error:', error);
      let errorMessage = 'Login failed. Please try again.';
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message === 'Network Error') {
        errorMessage = 'Cannot connect to server. Please check your connection.';
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = 'Connection timeout. Server may be unavailable.';
      }
      Alert.alert('Login Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = (provider) => {
    Alert.alert(
      'Coming Soon',
      `${provider} login will be available soon!`
    );
  };

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
              onPress={() => navigation.goBack()}
            >
              <Ionicons
                name="chevron-back"
                size={24}
                color={colors.textPrimary}
              />
            </TouchableOpacity>
          </View>

          {/* Title */}
          <Text style={styles.title}>Login</Text>

          {/* Form */}
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
              placeholder="Enter your password"
              secureTextEntry
              error={errors.password}
            />

            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>
                Forgot your password?{' '}
                <Text style={styles.clickHere}>Click here</Text>
              </Text>
            </TouchableOpacity>

            <Button
              title="Log in"
              variant="primary"
              size="large"
              onPress={handleLogin}
              loading={isLoading}
              style={styles.loginButton}
            />
          </View>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>or continue with</Text>
            <View style={styles.divider} />
          </View>

          {/* Social Login */}
          <View style={styles.socialButtons}>
            <Button
              title="Continue with Apple"
              variant="social"
              size="large"
              onPress={() => handleSocialLogin('Apple')}
              icon={
                <Ionicons
                  name="logo-apple"
                  size={20}
                  color={colors.textPrimary}
                />
              }
              style={styles.socialButton}
            />
            <Button
              title="Continue with Google"
              variant="social"
              size="large"
              onPress={() => handleSocialLogin('Google')}
              icon={
                <Ionicons
                  name="logo-google"
                  size={20}
                  color={colors.textPrimary}
                />
              }
              style={styles.socialButton}
            />
          </View>
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
    paddingVertical: spacing.md,
  },
  backButton: {
    padding: spacing.xs,
    marginLeft: -spacing.xs,
  },
  title: {
    fontSize: typography.sizes['3xl'],
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginTop: spacing.lg,
    marginBottom: spacing['2xl'],
  },
  form: {
    gap: spacing.sm,
  },
  forgotPassword: {
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  forgotPasswordText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  clickHere: {
    color: colors.primary,
    fontWeight: typography.weights.medium,
  },
  loginButton: {
    marginTop: spacing.md,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing['2xl'],
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    paddingHorizontal: spacing.base,
  },
  socialButtons: {
    gap: spacing.md,
  },
  socialButton: {
    width: '100%',
  },
});

export default LoginScreen;
