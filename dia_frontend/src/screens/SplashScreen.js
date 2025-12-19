/**
 * Splash Screen
 * Initial landing page with branding and auth options
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Button } from '../components';
import { colors } from '../theme/colors';
import { typography, spacing } from '../theme/typography';

const SplashScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      <View style={styles.content}>
        {/* Logo/Branding Section */}
        <View style={styles.brandingSection}>
          <Text style={styles.logo}>DÍA</Text>
          <View style={styles.taglineContainer}>
            <Text style={styles.tagline}>A new way of</Text>
            <Text style={styles.tagline}>effortless investing.</Text>
            <Text style={styles.taglineHighlight}>Start today!</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonSection}>
          <Button
            title="Sign up"
            variant="primary"
            size="large"
            onPress={() => navigation.navigate('Register')}
            style={styles.signUpButton}
          />
          <Button
            title="Log in"
            variant="outline"
            size="large"
            onPress={() => navigation.navigate('Login')}
            style={styles.loginButton}
          />
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
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    justifyContent: 'space-between',
    paddingTop: spacing['5xl'],
    paddingBottom: spacing['3xl'],
  },
  brandingSection: {
    flex: 1,
    justifyContent: 'center',
  },
  logo: {
    fontSize: 56,
    fontWeight: typography.weights.bold,
    color: colors.primary,
    letterSpacing: 2,
    marginBottom: spacing['2xl'],
  },
  taglineContainer: {
    marginTop: spacing.lg,
  },
  tagline: {
    fontSize: typography.sizes['2xl'],
    color: colors.textSecondary,
    fontWeight: typography.weights.regular,
    lineHeight: 32,
  },
  taglineHighlight: {
    fontSize: typography.sizes['2xl'],
    color: colors.textPrimary,
    fontWeight: typography.weights.semibold,
    marginTop: spacing.xs,
  },
  buttonSection: {
    gap: spacing.md,
  },
  signUpButton: {
    width: '100%',
  },
  loginButton: {
    width: '100%',
  },
});

export default SplashScreen;
