/**
 * Home Screen
 * Main dashboard with portfolio overview and investments
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Card, Button, PortfolioCard } from '../components';
import { colors } from '../theme/colors';
import { typography, spacing, borderRadius } from '../theme/typography';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { getPortfolio, getRecommendedFund } from '../services/api';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || 'YOUR_API_KEY_HERE';

// Base fund data for AI recommendations
const BASE_FUNDS = {
  fund_001: {
    id: 'fund_001',
    name: 'Energy Transition Fund',
    ticker: 'XANF-ETF',
    risk_level: 'Conservative',
    annual_return: 6.5,
    price: 124.56,
    sector: 'Green Energy',
    color: '#10B981',
    icon: 'leaf',
  },
  fund_002: {
    id: 'fund_002',
    name: 'Balanced Green Fund',
    ticker: 'XANF-BGF',
    risk_level: 'Moderate',
    annual_return: 9.2,
    price: 187.34,
    sector: 'Mixed (Green + ICT)',
    color: '#6C5CE7',
    icon: 'analytics',
  },
  fund_003: {
    id: 'fund_003',
    name: 'ICT Innovation Fund',
    ticker: 'XANF-IIF',
    risk_level: 'Aggressive',
    annual_return: 14.8,
    price: 256.78,
    sector: 'ICT & Technology',
    color: '#FF6B6B',
    icon: 'rocket',
  },
};

const HomeScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { theme, isDarkMode } = useTheme();
  const [portfolio, setPortfolio] = useState(null);
  const [recommendation, setRecommendation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [aiRecommendation, setAiRecommendation] = useState(null);
  const [aiLoading, setAiLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [portfolioRes, recommendRes] = await Promise.all([
        getPortfolio(user?.userId),
        getRecommendedFund(),
      ]);

      if (portfolioRes.success) {
        setPortfolio(portfolioRes.data.portfolio);
      }
      if (recommendRes.success) {
        setRecommendation(recommendRes.data);
      }
    } catch (error) {
      console.log('Dashboard fetch error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getAIRecommendation = async () => {
    setAiLoading(true);
    try {
      const riskProfile = user?.risk_profile || 'Moderate';
      const prompt = `You are a financial AI advisor. Based on a ${riskProfile} risk profile investor, recommend ONE of these funds:
      1. Energy Transition Fund (XANF-ETF) - Conservative, 6.5% annual return, green energy focus
      2. Balanced Green Fund (XANF-BGF) - Moderate, 9.2% annual return, mixed green+ICT
      3. ICT Innovation Fund (XANF-IIF) - Aggressive, 14.8% annual return, tech focus

      Respond in this exact JSON format only, no other text:
      {"fund_id": "fund_001 or fund_002 or fund_003", "reason": "Brief 15-word reason", "confidence": 85}`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.3, maxOutputTokens: 150 },
          }),
        }
      );

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        const fund = BASE_FUNDS[parsed.fund_id];
        if (fund) {
          setAiRecommendation({
            fund: fund,
            reason: parsed.reason,
            confidence: parsed.confidence || 85,
          });
        }
      }
    } catch (error) {
      console.log('AI recommendation error:', error);
      const fallbackFund = user?.risk_profile === 'Aggressive' ? BASE_FUNDS.fund_003
        : user?.risk_profile === 'Conservative' ? BASE_FUNDS.fund_001
        : BASE_FUNDS.fund_002;
      setAiRecommendation({
        fund: fallbackFund,
        reason: `Best match for your ${user?.risk_profile || 'Moderate'} risk profile with strong growth potential.`,
        confidence: 82,
      });
    } finally {
      setAiLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
      getAIRecommendation();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
    getAIRecommendation();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const totalValue = portfolio?.total_value || 0;
  const changePercent = portfolio?.last_24hr_change_percent || 0;
  const isPositive = changePercent >= 0;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hey, {user?.email?.split('@')[0] || 'Investor'}!</Text>
          </View>
          <TouchableOpacity style={styles.notificationBtn}>
            <Ionicons name="notifications-outline" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Total Value Card */}
        <Card style={styles.totalValueCard}>
          <View style={styles.totalValueHeader}>
            <Text style={styles.totalValueLabel}>Total value (AZN)</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </View>
          <View style={styles.totalValueRow}>
            <Text style={styles.totalValue}>
              ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </Text>
          </View>
          <View style={styles.changeRow}>
            <View style={[styles.changeBadge, !isPositive && styles.changeBadgeNegative]}>
              <Ionicons
                name={isPositive ? 'trending-up' : 'trending-down'}
                size={14}
                color={isPositive ? colors.success : colors.error}
              />
              <Text style={[styles.changeText, !isPositive && styles.changeTextNegative]}>
                {isPositive ? '+' : ''}{changePercent.toFixed(2)}%
              </Text>
            </View>
            <Text style={styles.sinceLabel}>Since last 24h</Text>
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.quickActionBtn}
              onPress={() => navigation.navigate('RoundUp')}
            >
              <View style={styles.quickActionIcon}>
                <Ionicons name="add" size={20} color={colors.primary} />
              </View>
              <Text style={styles.quickActionText}>Deposit</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickActionBtn}>
              <View style={styles.quickActionIcon}>
                <Ionicons name="remove" size={20} color={colors.primary} />
              </View>
              <Text style={styles.quickActionText}>Withdraw</Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Returns Section */}
        <View style={styles.returnsSection}>
          <View style={styles.returnItem}>
            <Text style={styles.returnLabel}>1D</Text>
            <Text style={[styles.returnValue, isPositive && styles.returnPositive]}>
              +{(changePercent * 0.1).toFixed(2)}%
            </Text>
          </View>
          <View style={styles.returnItem}>
            <Text style={styles.returnLabel}>1W</Text>
            <Text style={[styles.returnValue, isPositive && styles.returnPositive]}>
              +{(changePercent * 0.5).toFixed(2)}%
            </Text>
          </View>
          <View style={styles.returnItem}>
            <Text style={styles.returnLabel}>1M</Text>
            <Text style={[styles.returnValue, isPositive && styles.returnPositive]}>
              +{changePercent.toFixed(2)}%
            </Text>
          </View>
          <View style={styles.returnItem}>
            <Text style={styles.returnLabel}>1Y</Text>
            <Text style={[styles.returnValue, isPositive && styles.returnPositive]}>
              +{(changePercent * 12).toFixed(2)}%
            </Text>
          </View>
        </View>

        {/* Description */}
        <Text style={[styles.description, { color: theme.textMuted }]}>
          Contratulations, you've outperform S&P 500
        </Text>

        {/* AI Recommendation Section */}
        <View style={styles.aiSection}>
          <View style={styles.aiHeader}>
            <View style={[styles.aiIconContainer, { backgroundColor: theme.secondary + '20' }]}>
              <Ionicons name="sparkles" size={20} color={theme.secondary} />
            </View>
            <View style={styles.aiHeaderText}>
              <Text style={[styles.aiTitle, { color: theme.textPrimary }]}>AI Recommendation</Text>
              <Text style={[styles.aiSubtitle, { color: theme.textSecondary }]}>Powered by Gemini</Text>
            </View>
            <TouchableOpacity
              style={[styles.aiChatBtn, { backgroundColor: theme.primary + '20' }]}
              onPress={() => navigation.navigate('AIAssistant')}
            >
              <Ionicons name="chatbubble-ellipses" size={16} color={theme.primary} />
            </TouchableOpacity>
          </View>

          {aiLoading ? (
            <View style={[styles.aiLoadingCard, { backgroundColor: theme.backgroundCard, borderColor: theme.border }]}>
              <ActivityIndicator color={theme.primary} />
              <Text style={[styles.aiLoadingText, { color: theme.textSecondary }]}>
                AI is analyzing your profile...
              </Text>
            </View>
          ) : aiRecommendation && (
            <TouchableOpacity
              style={[styles.aiCard, { backgroundColor: theme.secondary + '10', borderColor: theme.secondary }]}
              onPress={() => navigation.navigate('RoundUp', { fund: aiRecommendation.fund })}
            >
              <View style={styles.aiCardContent}>
                <View style={[styles.aiRecIcon, { backgroundColor: aiRecommendation.fund.color }]}>
                  <Ionicons name={aiRecommendation.fund.icon} size={28} color="#FFFFFF" />
                </View>
                <View style={styles.aiRecInfo}>
                  <Text style={[styles.aiRecName, { color: theme.textPrimary }]}>
                    {aiRecommendation.fund.name}
                  </Text>
                  <Text style={[styles.aiRecReason, { color: theme.textSecondary }]} numberOfLines={2}>
                    {aiRecommendation.reason}
                  </Text>
                  <View style={styles.confidenceRow}>
                    <Ionicons name="shield-checkmark" size={14} color={theme.success || colors.success} />
                    <Text style={[styles.confidenceText, { color: theme.success || colors.success }]}>
                      {aiRecommendation.confidence}% confidence match
                    </Text>
                  </View>
                </View>
                <View style={styles.aiRecReturn}>
                  <Text style={[styles.aiRecReturnValue, { color: theme.chartUp || colors.success }]}>
                    +{aiRecommendation.fund.annual_return}%
                  </Text>
                  <Text style={[styles.aiRecReturnLabel, { color: theme.textMuted }]}>Annual</Text>
                </View>
              </View>
              <View style={[styles.aiInvestRow, { borderTopColor: theme.border }]}>
                <Text style={[styles.aiInvestText, { color: theme.secondary }]}>
                  Tap to invest in this AI-picked fund
                </Text>
                <Ionicons name="chevron-forward" size={18} color={theme.secondary} />
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* Investments Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My investments (AZN)</Text>
            <TouchableOpacity>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Investment Card */}
          <Card style={styles.investmentCard} onPress={() => navigation.navigate('Invest')}>
            <View style={styles.investmentRow}>
              <View style={styles.investmentIcon}>
                <Ionicons name="leaf" size={24} color={colors.primary} />
              </View>
              <View style={styles.investmentInfo}>
                <Text style={styles.investmentName}>
                  {portfolio?.invested_fund?.name || 'General Investing'}
                </Text>
                <Text style={styles.investmentSubtext}>
                  {portfolio?.invested_fund?.sector || 'Mixed Portfolio'}
                </Text>
              </View>
              <View style={styles.investmentValue}>
                <Text style={styles.investmentAmount}>
                  AZN {(portfolio?.invested_amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </Text>
                <Text style={[styles.investmentChange, isPositive && styles.changePositive]}>
                  +{changePercent.toFixed(2)}%
                </Text>
              </View>
            </View>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.xl,
    marginBottom: spacing.xl,
  },
  greeting: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
  },
  notificationBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  totalValueCard: {
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  totalValueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  totalValueLabel: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  totalValueRow: {
    marginBottom: spacing.sm,
  },
  totalValue: {
    fontSize: typography.sizes['4xl'],
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  changeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  changeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(52, 199, 89, 0.15)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    marginRight: spacing.sm,
  },
  changeBadgeNegative: {
    backgroundColor: 'rgba(255, 59, 48, 0.15)',
  },
  changeText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.success,
    marginLeft: spacing.xs,
  },
  changeTextNegative: {
    color: colors.error,
  },
  sinceLabel: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
  },
  quickActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  quickActionBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  quickActionIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.background,
  },
  returnsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  returnItem: {
    alignItems: 'center',
  },
  returnLabel: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  returnValue: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.textSecondary,
  },
  returnPositive: {
    color: colors.success,
  },
  description: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  section: {
    marginBottom: spacing['3xl'],
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
  },
  investmentCard: {
    padding: spacing.base,
  },
  investmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  investmentIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    backgroundColor: 'rgba(0, 212, 170, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  investmentInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  investmentName: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
  },
  investmentSubtext: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  investmentValue: {
    alignItems: 'flex-end',
  },
  investmentAmount: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
  },
  investmentChange: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  changePositive: {
    color: colors.success,
  },
  // AI Section Styles
  aiSection: {
    marginBottom: spacing.xl,
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  aiIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiHeaderText: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  aiTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
  aiSubtitle: {
    fontSize: typography.sizes.xs,
  },
  aiChatBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiLoadingCard: {
    padding: spacing.lg,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiLoadingText: {
    marginLeft: spacing.sm,
    fontSize: typography.sizes.sm,
  },
  aiCard: {
    borderRadius: 16,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  aiCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  aiRecIcon: {
    width: 56,
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiRecInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  aiRecName: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
  aiRecReason: {
    fontSize: typography.sizes.sm,
    marginTop: 4,
    lineHeight: 18,
  },
  confidenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  confidenceText: {
    fontSize: typography.sizes.xs,
    marginLeft: 4,
    fontWeight: typography.weights.medium,
  },
  aiRecReturn: {
    alignItems: 'flex-end',
  },
  aiRecReturnValue: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
  },
  aiRecReturnLabel: {
    fontSize: typography.sizes.xs,
  },
  aiInvestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
  },
  aiInvestText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    marginRight: 4,
  },
});

export default HomeScreen;
