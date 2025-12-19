/**
 * Funds Screen
 * Display all XanF investment funds with details
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, Button } from '../components';
import { colors } from '../theme/colors';
import { typography, spacing, borderRadius } from '../theme/typography';
import { getFunds, getRecommendedFund } from '../services/api';

const FundsScreen = ({ navigation }) => {
  const [funds, setFunds] = useState([]);
  const [recommendation, setRecommendation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [fundsRes, recommendRes] = await Promise.all([
        getFunds(),
        getRecommendedFund(),
      ]);

      if (fundsRes.success) {
        setFunds(fundsRes.data.funds);
      }
      if (recommendRes.success) {
        setRecommendation(recommendRes.data.recommendation);
      }
    } catch (error) {
      console.log('Funds fetch error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const getFundIcon = (riskLevel) => {
    switch (riskLevel) {
      case 'Conservative':
        return { icon: 'shield-checkmark', color: '#3b82f6' };
      case 'Moderate':
        return { icon: 'analytics', color: colors.primary };
      case 'Aggressive':
        return { icon: 'rocket', color: '#f59e0b' };
      default:
        return { icon: 'leaf', color: colors.primary };
    }
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
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>XanF Funds</Text>
          <View style={styles.placeholder} />
        </View>

        <Text style={styles.subtitle}>Caspian Green Funds</Text>

        {/* Fund Cards */}
        {funds.map((fund) => {
          const { icon, color } = getFundIcon(fund.risk_level);
          const isRecommended = recommendation?.fund_id === fund.id;

          return (
            <Card
              key={fund.id}
              style={[styles.fundCard, isRecommended && styles.fundCardRecommended]}
            >
              {isRecommended && (
                <View style={styles.recommendedBadge}>
                  <Ionicons name="star" size={12} color={colors.white} />
                  <Text style={styles.recommendedText}>Recommended for you</Text>
                </View>
              )}

              <View style={styles.fundHeader}>
                <View style={[styles.fundIcon, { backgroundColor: color + '20' }]}>
                  <Ionicons name={icon} size={32} color={color} />
                </View>
                <View style={styles.fundTitleContainer}>
                  <Text style={styles.fundName}>{fund.name}</Text>
                  <View style={styles.riskBadge}>
                    <Text style={[styles.riskText, { color }]}>{fund.risk_level}</Text>
                  </View>
                </View>
              </View>

              <Text style={styles.fundDescription}>{fund.description}</Text>

              <View style={styles.fundStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Annual Return</Text>
                  <Text style={[styles.statValue, { color: colors.success }]}>
                    +{fund.annual_return_mock}%
                  </Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Sector</Text>
                  <Text style={styles.statValue}>{fund.sector}</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Min. Inv.</Text>
                  <Text style={styles.statValue}>{fund.min_investment} AZN</Text>
                </View>
              </View>

              <Button
                title="Invest Now"
                variant="outline"
                size="medium"
                onPress={() => navigation.navigate('RoundUp')}
                style={[styles.investButton, { borderColor: color }]}
                textStyle={{ color }}
              />
            </Card>
          );
        })}

        {/* Info Section */}
        <View style={styles.infoSection}>
          <Card style={styles.infoCard}>
            <Ionicons name="leaf" size={24} color={colors.success} />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Green Investment</Text>
              <Text style={styles.infoDescription}>
                All funds invest in Azerbaijan's green economy and ICT sectors.
              </Text>
            </View>
          </Card>

          <Card style={styles.infoCard}>
            <Ionicons name="shield-checkmark" size={24} color={colors.chartBlue} />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Secure</Text>
              <Text style={styles.infoDescription}>
                Fund portfolios are managed by professional finance experts.
              </Text>
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
    paddingVertical: spacing.md,
  },
  backButton: {
    padding: spacing.xs,
  },
  title: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
  },
  placeholder: {
    width: 32,
  },
  subtitle: {
    fontSize: typography.sizes.sm,
    color: colors.primary,
    marginBottom: spacing.xl,
  },
  fundCard: {
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  fundCardRecommended: {
    borderWidth: 1,
    borderColor: '#f59e0b50',
  },
  recommendedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f59e0b',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginBottom: spacing.md,
  },
  recommendedText: {
    color: colors.white,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    marginLeft: spacing.xs,
  },
  fundHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  fundIcon: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fundTitleContainer: {
    flex: 1,
    marginLeft: spacing.md,
  },
  fundName: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  riskBadge: {
    marginTop: spacing.xs,
  },
  riskText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  fundDescription: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  fundStats: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundLighter,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border,
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
    marginBottom: spacing.xs,
  },
  statValue: {
    color: colors.textPrimary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  investButton: {
    marginTop: spacing.xs,
  },
  infoSection: {
    marginTop: spacing.md,
    marginBottom: spacing['3xl'],
  },
  infoCard: {
    flexDirection: 'row',
    padding: spacing.base,
    marginBottom: spacing.md,
  },
  infoContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  infoTitle: {
    color: colors.textPrimary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing.xs,
  },
  infoDescription: {
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
    lineHeight: 16,
  },
});

export default FundsScreen;
