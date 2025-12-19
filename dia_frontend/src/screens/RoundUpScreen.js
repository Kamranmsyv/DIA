/**
 * Deposit & Withdraw Screen
 * Full investment management with charts
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Button, Card } from '../components';
import { colors } from '../theme/colors';
import { typography, spacing, borderRadius } from '../theme/typography';
import { getFunds, processDeposit, processWithdraw, getPortfolio } from '../services/api';
import { useAuth } from '../context/AuthContext';

const { width } = Dimensions.get('window');

// Generate mock chart data
const generateChartData = () => {
  const data = [];
  let value = 1000;
  for (let i = 0; i < 30; i++) {
    value = value + (Math.random() - 0.45) * 50;
    data.push(Math.max(800, value));
  }
  return data;
};

const CHART_DATA = generateChartData();
const TIME_PERIODS = ['1D', '1W', '1M', '3M', '1Y', 'ALL'];

const RoundUpScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('deposit');
  const [amount, setAmount] = useState('');
  const [selectedFund, setSelectedFund] = useState(null);
  const [funds, setFunds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [portfolio, setPortfolio] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('1M');
  const [chartData, setChartData] = useState(CHART_DATA);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const fetchData = async () => {
    try {
      const [fundsRes, portfolioRes] = await Promise.all([
        getFunds(),
        getPortfolio(user?.userId),
      ]);

      if (fundsRes.success) {
        setFunds(fundsRes.data.funds);
        setSelectedFund(fundsRes.data.funds[1]);
      }
      if (portfolioRes.success) {
        setPortfolio(portfolioRes.data.portfolio);
      }
    } catch (error) {
      console.log('Fetch error:', error);
    }
  };

  const handleDeposit = async () => {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }
    if (!selectedFund) {
      Alert.alert('Error', 'Please select a fund');
      return;
    }

    setLoading(true);
    try {
      const response = await processDeposit(numAmount, selectedFund.id);
      if (response.success) {
        Alert.alert(
          'Success!',
          `${numAmount.toFixed(2)} AZN deposited successfully!\n\nNew balance: ${response.data.portfolio.new_total_value.toFixed(2)} AZN`,
          [{ text: 'Great!', onPress: () => { setAmount(''); fetchData(); }}]
        );
      }
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'Deposit failed');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    const currentBalance = portfolio?.total_value || 0;
    if (numAmount > currentBalance) {
      Alert.alert('Error', `Insufficient balance. Available: ${currentBalance.toFixed(2)} AZN`);
      return;
    }

    setLoading(true);
    try {
      const response = await processWithdraw(numAmount);
      if (response.success) {
        Alert.alert(
          'Success!',
          `${numAmount.toFixed(2)} AZN withdrawn successfully!\n\nNew balance: ${response.data.portfolio.new_total_value.toFixed(2)} AZN`,
          [{ text: 'OK', onPress: () => { setAmount(''); fetchData(); }}]
        );
      }
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'Withdrawal failed');
    } finally {
      setLoading(false);
    }
  };

  const quickAmounts = [50, 100, 250, 500];
  const maxValue = Math.max(...chartData);
  const minValue = Math.min(...chartData);
  const chartHeight = 180;
  const currentValue = portfolio?.total_value || 0;
  const changePercent = portfolio?.last_24hr_change_percent || 2.34;

  // Simple line chart renderer
  const renderChart = () => {
    const points = chartData.map((value, index) => {
      const x = (index / (chartData.length - 1)) * (width - 64);
      const y = chartHeight - ((value - minValue) / (maxValue - minValue)) * chartHeight;
      return { x, y, value };
    });

    return (
      <View style={styles.chartContainer}>
        {/* Y-axis labels */}
        <View style={styles.yAxisLabels}>
          <Text style={styles.axisLabel}>{maxValue.toFixed(0)}</Text>
          <Text style={styles.axisLabel}>{((maxValue + minValue) / 2).toFixed(0)}</Text>
          <Text style={styles.axisLabel}>{minValue.toFixed(0)}</Text>
        </View>

        {/* Chart area */}
        <View style={styles.chartArea}>
          {/* Grid lines */}
          <View style={[styles.gridLine, { top: 0 }]} />
          <View style={[styles.gridLine, { top: chartHeight / 2 }]} />
          <View style={[styles.gridLine, { top: chartHeight }]} />

          {/* Line chart using View elements */}
          <View style={styles.lineContainer}>
            {points.map((point, index) => {
              if (index === 0) return null;
              const prevPoint = points[index - 1];
              const dx = point.x - prevPoint.x;
              const dy = point.y - prevPoint.y;
              const length = Math.sqrt(dx * dx + dy * dy);
              const angle = Math.atan2(dy, dx) * (180 / Math.PI);

              return (
                <View
                  key={index}
                  style={[
                    styles.lineSegment,
                    {
                      left: prevPoint.x,
                      top: prevPoint.y,
                      width: length,
                      transform: [{ rotate: `${angle}deg` }],
                    },
                  ]}
                />
              );
            })}
            {/* End point dot */}
            <View
              style={[
                styles.chartDot,
                { left: points[points.length - 1].x - 4, top: points[points.length - 1].y - 4 },
              ]}
            />
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.title}>Portfolio</Text>
            <TouchableOpacity>
              <Ionicons name="notifications-outline" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Portfolio Value Card */}
          <Card style={styles.portfolioCard}>
            <Text style={styles.portfolioLabel}>Total Portfolio Value</Text>
            <Text style={styles.portfolioValue}>{currentValue.toFixed(2)} AZN</Text>
            <View style={styles.changeRow}>
              <Ionicons
                name={changePercent >= 0 ? "trending-up" : "trending-down"}
                size={16}
                color={changePercent >= 0 ? colors.success : colors.error}
              />
              <Text style={[styles.changeText, changePercent >= 0 ? styles.changePositive : styles.changeNegative]}>
                {changePercent >= 0 ? '+' : ''}{changePercent.toFixed(2)}% today
              </Text>
            </View>

            {/* Chart */}
            {renderChart()}

            {/* Time Period Selector */}
            <View style={styles.periodSelector}>
              {TIME_PERIODS.map((period) => (
                <TouchableOpacity
                  key={period}
                  style={[styles.periodBtn, selectedPeriod === period && styles.periodBtnActive]}
                  onPress={() => {
                    setSelectedPeriod(period);
                    setChartData(generateChartData());
                  }}
                >
                  <Text style={[styles.periodText, selectedPeriod === period && styles.periodTextActive]}>
                    {period}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Card>

          {/* Deposit/Withdraw Tabs */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'deposit' && styles.tabActive]}
              onPress={() => setActiveTab('deposit')}
            >
              <Ionicons
                name="arrow-down-circle"
                size={20}
                color={activeTab === 'deposit' ? colors.primary : colors.textMuted}
              />
              <Text style={[styles.tabText, activeTab === 'deposit' && styles.tabTextActive]}>
                Deposit
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'withdraw' && styles.tabActive]}
              onPress={() => setActiveTab('withdraw')}
            >
              <Ionicons
                name="arrow-up-circle"
                size={20}
                color={activeTab === 'withdraw' ? colors.primary : colors.textMuted}
              />
              <Text style={[styles.tabText, activeTab === 'withdraw' && styles.tabTextActive]}>
                Withdraw
              </Text>
            </TouchableOpacity>
          </View>

          {/* Amount Input */}
          <View style={styles.amountSection}>
            <Text style={styles.label}>
              {activeTab === 'deposit' ? 'Deposit Amount' : 'Withdraw Amount'}
            </Text>
            <Card style={styles.amountCard}>
              <Text style={styles.currencyPrefix}>₼</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="0.00"
                placeholderTextColor={colors.textMuted}
                keyboardType="decimal-pad"
                value={amount}
                onChangeText={setAmount}
              />
              <Text style={styles.currency}>AZN</Text>
            </Card>

            {/* Quick Amount Buttons */}
            <View style={styles.quickAmounts}>
              {quickAmounts.map((qa) => (
                <TouchableOpacity
                  key={qa}
                  style={styles.quickAmountBtn}
                  onPress={() => setAmount(qa.toString())}
                >
                  <Text style={styles.quickAmountText}>{qa} ₼</Text>
                </TouchableOpacity>
              ))}
            </View>

            {activeTab === 'withdraw' && (
              <TouchableOpacity
                style={styles.maxButton}
                onPress={() => setAmount(currentValue.toFixed(2))}
              >
                <Text style={styles.maxButtonText}>Withdraw All ({currentValue.toFixed(2)} AZN)</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Fund Selection (only for deposit) */}
          {activeTab === 'deposit' && (
            <View style={styles.fundSection}>
              <Text style={styles.label}>Select Investment Fund</Text>
              {funds.map((fund) => (
                <TouchableOpacity
                  key={fund.id}
                  activeOpacity={0.8}
                  onPress={() => setSelectedFund(fund)}
                >
                  <Card
                    style={[
                      styles.fundCard,
                      selectedFund?.id === fund.id && styles.fundCardSelected,
                    ]}
                  >
                    <View style={[styles.fundIcon, {
                      backgroundColor: fund.risk_level === 'Conservative' ? '#3b82f620' :
                                       fund.risk_level === 'Moderate' ? colors.primary + '20' : '#f59e0b20'
                    }]}>
                      <Ionicons
                        name={
                          fund.risk_level === 'Conservative' ? 'shield-checkmark' :
                          fund.risk_level === 'Moderate' ? 'analytics' : 'rocket'
                        }
                        size={24}
                        color={
                          fund.risk_level === 'Conservative' ? '#3b82f6' :
                          fund.risk_level === 'Moderate' ? colors.primary : '#f59e0b'
                        }
                      />
                    </View>
                    <View style={styles.fundInfo}>
                      <Text style={styles.fundName}>{fund.name}</Text>
                      <Text style={styles.fundRisk}>{fund.risk_level} • {fund.sector}</Text>
                    </View>
                    <View style={styles.fundReturn}>
                      <Text style={styles.fundReturnValue}>+{fund.annual_return_mock}%</Text>
                      <Text style={styles.fundReturnLabel}>yearly</Text>
                    </View>
                    {selectedFund?.id === fund.id && (
                      <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                    )}
                  </Card>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Submit Button */}
          <Button
            title={activeTab === 'deposit'
              ? `Deposit ${amount ? parseFloat(amount).toFixed(2) : '0.00'} AZN`
              : `Withdraw ${amount ? parseFloat(amount).toFixed(2) : '0.00'} AZN`
            }
            variant="primary"
            size="large"
            onPress={activeTab === 'deposit' ? handleDeposit : handleWithdraw}
            loading={loading}
            disabled={!amount || parseFloat(amount) <= 0}
            style={styles.submitButton}
          />

          {/* Info Cards */}
          <View style={styles.infoSection}>
            <Card style={styles.infoCard}>
              <Ionicons name="shield-checkmark" size={20} color={colors.success} />
              <Text style={styles.infoText}>
                {activeTab === 'deposit'
                  ? 'Your investments are protected and managed by professionals'
                  : 'Withdrawals are processed within 1-2 business days'}
              </Text>
            </Card>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
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
  portfolioCard: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.lg,
    padding: spacing.lg,
  },
  portfolioLabel: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  portfolioValue: {
    fontSize: typography.sizes['3xl'],
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  changeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  changeText: {
    fontSize: typography.sizes.sm,
    marginLeft: spacing.xs,
  },
  changePositive: {
    color: colors.success,
  },
  changeNegative: {
    color: colors.error,
  },
  chartContainer: {
    flexDirection: 'row',
    height: 200,
    marginBottom: spacing.md,
  },
  yAxisLabels: {
    width: 40,
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  axisLabel: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
  },
  chartArea: {
    flex: 1,
    height: 180,
    position: 'relative',
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: colors.border,
  },
  lineContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  lineSegment: {
    position: 'absolute',
    height: 2,
    backgroundColor: colors.primary,
    transformOrigin: 'left center',
  },
  chartDot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.white,
  },
  periodSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.backgroundLighter,
    borderRadius: borderRadius.lg,
    padding: spacing.xs,
  },
  periodBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
  },
  periodBtnActive: {
    backgroundColor: colors.primary,
  },
  periodText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
    color: colors.textMuted,
  },
  periodTextActive: {
    color: colors.white,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: spacing.xl,
    marginBottom: spacing.lg,
    backgroundColor: colors.backgroundLight,
    borderRadius: borderRadius.lg,
    padding: spacing.xs,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  tabActive: {
    backgroundColor: colors.card,
  },
  tabText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.textMuted,
  },
  tabTextActive: {
    color: colors.primary,
  },
  amountSection: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },
  label: {
    color: colors.textPrimary,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing.md,
  },
  amountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  currencyPrefix: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
    color: colors.primary,
    marginRight: spacing.sm,
  },
  amountInput: {
    flex: 1,
    fontSize: typography.sizes['3xl'],
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  currency: {
    fontSize: typography.sizes.lg,
    color: colors.textMuted,
    fontWeight: typography.weights.semibold,
  },
  quickAmounts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  quickAmountBtn: {
    backgroundColor: colors.backgroundLighter,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickAmountText: {
    color: colors.primary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  maxButton: {
    alignSelf: 'center',
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
  },
  maxButtonText: {
    color: colors.primary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    textDecorationLine: 'underline',
  },
  fundSection: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },
  fundCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.base,
    marginBottom: spacing.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  fundCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  fundIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fundInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  fundName: {
    color: colors.textPrimary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  fundRisk: {
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
    marginTop: spacing.xs,
  },
  fundReturn: {
    alignItems: 'flex-end',
    marginRight: spacing.md,
  },
  fundReturnValue: {
    color: colors.success,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  fundReturnLabel: {
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
  },
  submitButton: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },
  infoSection: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing['3xl'],
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.base,
  },
  infoText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
    marginLeft: spacing.md,
    lineHeight: 18,
  },
});

export default RoundUpScreen;
