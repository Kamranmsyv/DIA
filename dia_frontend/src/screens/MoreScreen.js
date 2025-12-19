/**
 * More Screen - Settings & Profile
 * Professional stock app settings
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { typography, spacing } from '../theme/typography';

const MoreScreen = ({ navigation }) => {
  const { theme, isDarkMode, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();

  const [notifications, setNotifications] = useState(true);
  const [priceAlerts, setPriceAlerts] = useState(true);
  const [biometricLogin, setBiometricLogin] = useState(false);
  const [twoFactorAuth, setTwoFactorAuth] = useState(false);
  const [marketNews, setMarketNews] = useState(true);

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log Out', style: 'destructive', onPress: () => signOut() },
      ]
    );
  };

  const SettingSection = ({ title, children }) => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>{title}</Text>
      <View style={[styles.sectionContent, { backgroundColor: theme.backgroundCard, borderColor: theme.border }]}>
        {children}
      </View>
    </View>
  );

  const SettingRow = ({ icon, iconColor, title, subtitle, onPress, rightComponent, showArrow = true }) => (
    <TouchableOpacity
      style={[styles.settingRow, { borderBottomColor: theme.border }]}
      onPress={onPress}
      disabled={!onPress && !rightComponent}
    >
      <View style={[styles.iconContainer, { backgroundColor: iconColor + '20' }]}>
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
      <View style={styles.settingInfo}>
        <Text style={[styles.settingTitle, { color: theme.textPrimary }]}>{title}</Text>
        {subtitle && <Text style={[styles.settingSubtitle, { color: theme.textSecondary }]}>{subtitle}</Text>}
      </View>
      {rightComponent || (showArrow && onPress && (
        <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
      ))}
    </TouchableOpacity>
  );

  const ToggleRow = ({ icon, iconColor, title, subtitle, value, onValueChange }) => (
    <View style={[styles.settingRow, { borderBottomColor: theme.border }]}>
      <View style={[styles.iconContainer, { backgroundColor: iconColor + '20' }]}>
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
      <View style={styles.settingInfo}>
        <Text style={[styles.settingTitle, { color: theme.textPrimary }]}>{title}</Text>
        {subtitle && <Text style={[styles.settingSubtitle, { color: theme.textSecondary }]}>{subtitle}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: theme.border, true: theme.primary + '50' }}
        thumbColor={value ? theme.primary : theme.textMuted}
      />
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Settings</Text>
        </View>

        {/* Profile Card */}
        <TouchableOpacity
          style={[styles.profileCard, { backgroundColor: theme.backgroundCard, borderColor: theme.border }]}
          onPress={() => navigation.navigate('Profile')}
        >
          <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
            <Text style={styles.avatarText}>
              {user?.username?.charAt(0)?.toUpperCase() || 'U'}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: theme.textPrimary }]}>
              {user?.username || 'User'}
            </Text>
            <Text style={[styles.profileEmail, { color: theme.textSecondary }]}>
              Premium Member
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
        </TouchableOpacity>

        {/* Account Section */}
        <SettingSection title="ACCOUNT">
          <SettingRow
            icon="person-outline"
            iconColor={theme.primary}
            title="Personal Information"
            subtitle="Name, email, phone"
            onPress={() => {}}
          />
          <SettingRow
            icon="card-outline"
            iconColor={theme.info}
            title="Payment Methods"
            subtitle="Cards, bank accounts"
            onPress={() => {}}
          />
          <SettingRow
            icon="document-text-outline"
            iconColor={theme.secondary}
            title="Documents & KYC"
            subtitle="Verification status"
            onPress={() => {}}
          />
          <SettingRow
            icon="wallet-outline"
            iconColor={theme.success}
            title="Linked Accounts"
            subtitle="Bank & brokerage accounts"
            onPress={() => {}}
            showArrow={false}
          />
        </SettingSection>

        {/* Appearance Section */}
        <SettingSection title="APPEARANCE">
          <ToggleRow
            icon={isDarkMode ? "moon" : "sunny"}
            iconColor={isDarkMode ? theme.secondary : theme.warning}
            title="Dark Mode"
            subtitle={isDarkMode ? "Currently using dark theme" : "Currently using light theme"}
            value={isDarkMode}
            onValueChange={toggleTheme}
          />
          <SettingRow
            icon="color-palette-outline"
            iconColor={theme.accent}
            title="App Theme"
            subtitle="Customize colors"
            onPress={() => {}}
          />
          <SettingRow
            icon="text-outline"
            iconColor={theme.info}
            title="Font Size"
            subtitle="Medium"
            onPress={() => {}}
            showArrow={false}
          />
        </SettingSection>

        {/* Notifications Section */}
        <SettingSection title="NOTIFICATIONS">
          <ToggleRow
            icon="notifications-outline"
            iconColor={theme.primary}
            title="Push Notifications"
            subtitle="Receive alerts on your device"
            value={notifications}
            onValueChange={setNotifications}
          />
          <ToggleRow
            icon="pulse-outline"
            iconColor={theme.chartUp}
            title="Price Alerts"
            subtitle="Get notified of price changes"
            value={priceAlerts}
            onValueChange={setPriceAlerts}
          />
          <ToggleRow
            icon="newspaper-outline"
            iconColor={theme.info}
            title="Market News"
            subtitle="Breaking news & updates"
            value={marketNews}
            onValueChange={setMarketNews}
          />
        </SettingSection>

        {/* Security Section */}
        <SettingSection title="SECURITY">
          <ToggleRow
            icon="finger-print-outline"
            iconColor={theme.error}
            title="Biometric Login"
            subtitle="Use fingerprint or Face ID"
            value={biometricLogin}
            onValueChange={setBiometricLogin}
          />
          <ToggleRow
            icon="shield-checkmark-outline"
            iconColor={theme.success}
            title="Two-Factor Auth"
            subtitle="Extra layer of security"
            value={twoFactorAuth}
            onValueChange={setTwoFactorAuth}
          />
          <SettingRow
            icon="lock-closed-outline"
            iconColor={theme.secondary}
            title="Change Password"
            onPress={() => {}}
          />
          <SettingRow
            icon="key-outline"
            iconColor={theme.warning}
            title="Change PIN"
            onPress={() => {}}
            showArrow={false}
          />
        </SettingSection>

        {/* Trading Section */}
        <SettingSection title="TRADING PREFERENCES">
          <SettingRow
            icon="speedometer-outline"
            iconColor={theme.primary}
            title="Risk Profile"
            subtitle={user?.risk_profile || "Moderate"}
            onPress={() => {}}
          />
          <SettingRow
            icon="cash-outline"
            iconColor={theme.success}
            title="Default Currency"
            subtitle="AZN"
            onPress={() => {}}
          />
          <SettingRow
            icon="repeat-outline"
            iconColor={theme.info}
            title="Auto-Invest"
            subtitle="Configure automatic investments"
            onPress={() => {}}
          />
          <SettingRow
            icon="analytics-outline"
            iconColor={theme.secondary}
            title="Chart Settings"
            subtitle="Candlestick, intervals"
            onPress={() => {}}
            showArrow={false}
          />
        </SettingSection>

        {/* Support Section */}
        <SettingSection title="SUPPORT">
          <SettingRow
            icon="chatbubbles-outline"
            iconColor={theme.primary}
            title="AI Assistant"
            subtitle="Get help from our AI"
            onPress={() => navigation.navigate('AIAssistant')}
          />
          <SettingRow
            icon="help-circle-outline"
            iconColor={theme.info}
            title="Help Center"
            onPress={() => {}}
          />
          <SettingRow
            icon="mail-outline"
            iconColor={theme.secondary}
            title="Contact Support"
            onPress={() => {}}
          />
          <SettingRow
            icon="chatbox-outline"
            iconColor={theme.success}
            title="Send Feedback"
            onPress={() => {}}
            showArrow={false}
          />
        </SettingSection>

        {/* About Section */}
        <SettingSection title="ABOUT">
          <SettingRow
            icon="information-circle-outline"
            iconColor={theme.info}
            title="About DIA"
            onPress={() => {}}
          />
          <SettingRow
            icon="document-outline"
            iconColor={theme.textSecondary}
            title="Terms of Service"
            onPress={() => {}}
          />
          <SettingRow
            icon="shield-outline"
            iconColor={theme.textSecondary}
            title="Privacy Policy"
            onPress={() => {}}
          />
          <SettingRow
            icon="star-outline"
            iconColor={theme.warning}
            title="Rate Us"
            onPress={() => {}}
          />
          <SettingRow
            icon="code-slash-outline"
            iconColor={theme.textMuted}
            title="Version"
            rightComponent={<Text style={{ color: theme.textMuted }}>1.0.0</Text>}
            showArrow={false}
          />
        </SettingSection>

        {/* Logout Button */}
        <TouchableOpacity
          style={[styles.logoutButton, { backgroundColor: theme.error + '15', borderColor: theme.error }]}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={20} color={theme.error} />
          <Text style={[styles.logoutText, { color: theme.error }]}>Log Out</Text>
        </TouchableOpacity>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: typography.weights.bold,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    padding: spacing.lg,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: spacing.lg,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: typography.weights.bold,
    color: '#FFFFFF',
  },
  profileInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  profileName: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
  },
  profileEmail: {
    fontSize: typography.sizes.sm,
    marginTop: 2,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    marginLeft: spacing.lg,
    marginBottom: spacing.sm,
    letterSpacing: 1,
  },
  sectionContent: {
    marginHorizontal: spacing.lg,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  settingTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
  },
  settingSubtitle: {
    fontSize: typography.sizes.sm,
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: spacing.lg,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: spacing.md,
  },
  logoutText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    marginLeft: spacing.sm,
  },
  bottomPadding: {
    height: 100,
  },
});

export default MoreScreen;
