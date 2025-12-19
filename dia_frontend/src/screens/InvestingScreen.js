/**
 * Investing Screen
 * Live charts and AI-powered recommendations
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { typography, spacing } from '../theme/typography';
import { useAuth } from '../context/AuthContext';

const { width } = Dimensions.get('window');
const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || 'YOUR_API_KEY_HERE';

// Live price simulation
const simulatePriceChange = (currentPrice, volatility = 0.002) => {
  const change = (Math.random() - 0.48) * volatility * currentPrice;
  return Math.max(currentPrice + change, currentPrice * 0.5);
};

// Generate chart data with trend
const generateLiveChartData = (basePrice, points = 50, trend = 0.001) => {
  const data = [];
  let price = basePrice * 0.95;
  for (let i = 0; i < points; i++) {
    const noise = (Math.random() - 0.5) * basePrice * 0.02;
    const trendEffect = trend * i * basePrice * 0.01;
    price = price + noise + trendEffect;
    price = Math.max(price, basePrice * 0.7);
    data.push(price);
  }
  return data;
};

// Base fund data
const BASE_FUNDS = {
  fund_001: {
    id: 'fund_001',
    name: 'Energy Transition Fund',
    ticker: 'XANF-ETF',
    description: 'Conservative renewable energy infrastructure fund.',
    risk_level: 'Conservative',
    annual_return: 6.5,
    basePrice: 124.56,
    sector: 'Green Energy',
    aum: '45.2M AZN',
    color: '#10B981',
    icon: 'leaf',
    volatility: 0.001,
    trend: 0.0005,
  },
  fund_002: {
    id: 'fund_002',
    name: 'Balanced Green Fund',
    ticker: 'XANF-BGF',
    description: 'Diversified green energy and ICT portfolio.',
    risk_level: 'Moderate',
    annual_return: 9.2,
    basePrice: 187.34,
    sector: 'Mixed (Green + ICT)',
    aum: '128.7M AZN',
    color: '#6C5CE7',
    icon: 'analytics',
    volatility: 0.0015,
    trend: 0.001,
  },
  fund_003: {
    id: 'fund_003',
    name: 'ICT Innovation Fund',
    ticker: 'XANF-IIF',
    description: 'Aggressive tech and digital infrastructure growth.',
    risk_level: 'Aggressive',
    annual_return: 14.8,
    basePrice: 256.78,
    sector: 'ICT & Technology',
    aum: '89.4M AZN',
    color: '#FF6B6B',
    icon: 'rocket',
    volatility: 0.003,
    trend: 0.002,
  },
};

// Animated Live Chart Component
const LiveChart = ({ data, color, chartWidth, height, isLive }) => {
  const animatedValues = useRef(data.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    if (data && data.length > 0) {
      const max = Math.max(...data);
      const min = Math.min(...data);
      const range = max - min || 1;

      data.forEach((value, index) => {
        const targetHeight = ((value - min) / range) * height;
        Animated.timing(animatedValues[index], {
          toValue: targetHeight,
          duration: 300,
          useNativeDriver: false,
        }).start();
      });
    }
  }, [data]);

  if (!data || data.length === 0) return null;

  return (
    <View style={{ width: chartWidth, height, flexDirection: 'row', alignItems: 'flex-end' }}>
      {data.map((value, index) => (
        <Animated.View
          key={index}
          style={{
            flex: 1,
            height: animatedValues[index] || 2,
            backgroundColor: color,
            marginHorizontal: 0.3,
            borderRadius: 1,
            opacity: 0.4 + (index / data.length) * 0.6,
          }}
        />
      ))}
      {isLive && (
        <View style={styles.liveDot}>
          <View style={[styles.liveDotInner, { backgroundColor: color }]} />
        </View>
      )}
    </View>
  );
};

// Market indices with live updates
const LiveMarketIndicator = ({ label, baseValue, icon, theme }) => {
  const [value, setValue] = useState(baseValue);
  const [change, setChange] = useState(0);
  const [isUp, setIsUp] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      const newChange = (Math.random() - 0.48) * 0.5;
      setChange(prev => {
        const updated = prev + newChange;
        setIsUp(updated >= 0);
        return updated;
      });
      setValue(prev => prev * (1 + newChange / 100));
    }, 2000 + Math.random() * 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <View style={[styles.marketIndicator, { backgroundColor: theme.backgroundCard, borderColor: theme.border }]}>
      <View style={styles.indicatorHeader}>
        <Ionicons name={icon} size={14} color={theme.primary} />
        <Text style={[styles.indicatorLabel, { color: theme.textSecondary }]}>{label}</Text>
        <View style={[styles.liveTag, { backgroundColor: theme.success + '20' }]}>
          <View style={[styles.livePulse, { backgroundColor: theme.success }]} />
          <Text style={[styles.liveText, { color: theme.success }]}>LIVE</Text>
        </View>
      </View>
      <Text style={[styles.indicatorValue, { color: theme.textPrimary }]}>
        {value.toFixed(2)}
      </Text>
      <Text style={[styles.indicatorChange, { color: isUp ? theme.chartUp : theme.chartDown }]}>
        {isUp ? '+' : ''}{change.toFixed(2)}%
      </Text>
    </View>
  );
};

const InvestingScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [funds, setFunds] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [refreshing, setRefreshing] = useState(false);
  const [aiRecommendation, setAiRecommendation] = useState(null);
  const [aiLoading, setAiLoading] = useState(true);
  const [isLive, setIsLive] = useState(true);

  const categories = ['All', 'Green Energy', 'Mixed', 'Technology'];

  // Initialize funds with live data
  useEffect(() => {
    initializeFunds();
    getAIRecommendation();
  }, []);

  // Live price updates
  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      setFunds(prevFunds =>
        prevFunds.map(fund => {
          const newPrice = simulatePriceChange(fund.price, fund.volatility);
          const dayChange = ((newPrice - fund.basePrice) / fund.basePrice) * 100;
          const newChartData = [...fund.chartData.slice(1), newPrice];

          return {
            ...fund,
            price: newPrice,
            day_change: dayChange,
            chartData: newChartData,
          };
        })
      );
    }, 1500);

    return () => clearInterval(interval);
  }, [isLive]);

  const initializeFunds = () => {
    const initialFunds = Object.values(BASE_FUNDS).map(fund => ({
      ...fund,
      price: fund.basePrice,
      day_change: (Math.random() - 0.3) * 2,
      ytd_return: fund.annual_return * (0.6 + Math.random() * 0.4),
      chartData: generateLiveChartData(fund.basePrice, 40, fund.trend),
    }));
    setFunds(initialFunds);
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

      // Parse JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        const fund = BASE_FUNDS[parsed.fund_id];
        if (fund) {
          setAiRecommendation({
            fund: { ...fund, price: fund.basePrice },
            reason: parsed.reason,
            confidence: parsed.confidence || 85,
          });
        }
      }
    } catch (error) {
      console.log('AI recommendation error:', error);
      // Fallback recommendation
      const fallbackFund = user?.risk_profile === 'Aggressive' ? BASE_FUNDS.fund_003
        : user?.risk_profile === 'Conservative' ? BASE_FUNDS.fund_001
        : BASE_FUNDS.fund_002;
      setAiRecommendation({
        fund: { ...fallbackFund, price: fallbackFund.basePrice },
        reason: `Best match for your ${user?.risk_profile || 'Moderate'} risk profile with strong growth potential.`,
        confidence: 82,
      });
    } finally {
      setAiLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    initializeFunds();
    await getAIRecommendation();
    setRefreshing(false);
  };

  const filteredFunds = funds.filter(fund => {
    if (selectedCategory === 'All') return true;
    if (selectedCategory === 'Green Energy') return fund.sector === 'Green Energy';
    if (selectedCategory === 'Mixed') return fund.sector.includes('Mixed');
    if (selectedCategory === 'Technology') return fund.sector.includes('ICT');
    return true;
  });

  const FundCard = ({ fund }) => {
    const isPositive = fund.day_change >= 0;
    return (
      <TouchableOpacity
        style={[styles.fundCard, { backgroundColor: theme.backgroundCard, borderColor: theme.border }]}
        onPress={() => navigation.navigate('RoundUp', { fund })}
      >
        <View style={styles.fundHeader}>
          <View style={[styles.fundIcon, { backgroundColor: fund.color + '20' }]}>
            <Ionicons name={fund.icon} size={24} color={fund.color} />
          </View>
          <View style={styles.fundInfo}>
            <View style={styles.tickerRow}>
              <Text style={[styles.fundTicker, { color: theme.textSecondary }]}>{fund.ticker}</Text>
              {isLive && (
                <View style={[styles.liveIndicator, { backgroundColor: theme.success }]} />
              )}
            </View>
            <Text style={[styles.fundName, { color: theme.textPrimary }]} numberOfLines={1}>
              {fund.name}
            </Text>
          </View>
          <View style={styles.fundPriceContainer}>
            <Text style={[styles.fundPrice, { color: theme.textPrimary }]}>
              {fund.price.toFixed(2)} <Text style={styles.currency}>AZN</Text>
            </Text>
            <View style={[styles.changeTag, { backgroundColor: isPositive ? theme.chartUp + '20' : theme.chartDown + '20' }]}>
              <Ionicons
                name={isPositive ? 'caret-up' : 'caret-down'}
                size={12}
                color={isPositive ? theme.chartUp : theme.chartDown}
              />
              <Text style={[styles.changeText, { color: isPositive ? theme.chartUp : theme.chartDown }]}>
                {isPositive ? '+' : ''}{fund.day_change.toFixed(2)}%
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.chartContainer}>
          <LiveChart
            data={fund.chartData}
            color={isPositive ? theme.chartUp : theme.chartDown}
            chartWidth={width - 80}
            height={70}
            isLive={isLive}
          />
        </View>

        <View style={[styles.fundDetails, { borderTopColor: theme.border }]}>
          <View style={styles.detailItem}>
            <Text style={[styles.detailLabel, { color: theme.textMuted }]}>YTD</Text>
            <Text style={[styles.detailValue, { color: theme.chartUp }]}>+{fund.ytd_return.toFixed(1)}%</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={[styles.detailLabel, { color: theme.textMuted }]}>AUM</Text>
            <Text style={[styles.detailValue, { color: theme.textPrimary }]}>{fund.aum}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={[styles.detailLabel, { color: theme.textMuted }]}>Risk</Text>
            <Text style={[styles.detailValue, { color: fund.color }]}>{fund.risk_level}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.investButton, { backgroundColor: fund.color }]}
          onPress={() => navigation.navigate('RoundUp', { fund })}
        >
          <Text style={styles.investButtonText}>Invest Now</Text>
          <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Invest</Text>
            <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
              Live Market Data
            </Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={[styles.aiButton, { backgroundColor: theme.secondary + '20' }]}
              onPress={() => navigation.navigate('AIAssistant')}
            >
              <Ionicons name="sparkles" size={18} color={theme.secondary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.liveToggle, { backgroundColor: isLive ? theme.success + '20' : theme.backgroundCard }]}
              onPress={() => setIsLive(!isLive)}
            >
              <View style={[styles.liveToggleDot, { backgroundColor: isLive ? theme.success : theme.textMuted }]} />
              <Text style={[styles.liveToggleText, { color: isLive ? theme.success : theme.textMuted }]}>
                {isLive ? 'LIVE' : 'PAUSED'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Market Overview - Live */}
        <View style={styles.marketOverview}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Market Overview</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.marketIndicators}>
              <LiveMarketIndicator label="XanF Index" baseValue={1245.67} icon="stats-chart" theme={theme} />
              <LiveMarketIndicator label="Green Index" baseValue={892.34} icon="leaf" theme={theme} />
              <LiveMarketIndicator label="Tech Index" baseValue={2156.78} icon="hardware-chip" theme={theme} />
            </View>
          </ScrollView>
        </View>

        {/* AI Recommendation */}
        <View style={styles.aiSection}>
          <View style={styles.aiHeader}>
            <View style={[styles.aiIcon, { backgroundColor: theme.secondary + '20' }]}>
              <Ionicons name="sparkles" size={20} color={theme.secondary} />
            </View>
            <View>
              <Text style={[styles.aiTitle, { color: theme.textPrimary }]}>AI Recommendation</Text>
              <Text style={[styles.aiSubtitle, { color: theme.textSecondary }]}>Powered by Gemini</Text>
            </View>
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
                    <Ionicons name="shield-checkmark" size={14} color={theme.success} />
                    <Text style={[styles.confidenceText, { color: theme.success }]}>
                      {aiRecommendation.confidence}% confidence match
                    </Text>
                  </View>
                </View>
                <View style={styles.aiRecReturn}>
                  <Text style={[styles.aiRecReturnValue, { color: theme.chartUp }]}>
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

        {/* Category Filter */}
        <View style={styles.categoryFilter}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryButton,
                  selectedCategory === cat
                    ? { backgroundColor: theme.primary }
                    : { backgroundColor: theme.backgroundCard, borderColor: theme.border, borderWidth: 1 },
                ]}
                onPress={() => setSelectedCategory(cat)}
              >
                <Text style={[
                  styles.categoryText,
                  { color: selectedCategory === cat ? '#FFFFFF' : theme.textSecondary },
                ]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Funds List */}
        <View style={styles.fundsSection}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            Live Funds ({filteredFunds.length})
          </Text>
          {filteredFunds.map((fund) => (
            <FundCard key={fund.id} fund={fund} />
          ))}
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  headerTitle: { fontSize: 28, fontWeight: typography.weights.bold },
  headerSubtitle: { fontSize: typography.sizes.sm, marginTop: 4 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  aiButton: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  liveToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  liveToggleDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  liveToggleText: { fontSize: 12, fontWeight: typography.weights.semibold },
  marketOverview: { paddingHorizontal: spacing.lg, marginBottom: spacing.lg },
  sectionTitle: { fontSize: typography.sizes.lg, fontWeight: typography.weights.semibold, marginBottom: spacing.md },
  marketIndicators: { flexDirection: 'row', gap: spacing.md },
  marketIndicator: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 12,
    borderWidth: 1,
    minWidth: 130,
    marginRight: spacing.sm,
  },
  indicatorHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  indicatorLabel: { fontSize: 11, marginLeft: 4, flex: 1 },
  liveTag: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  livePulse: { width: 6, height: 6, borderRadius: 3, marginRight: 4 },
  liveText: { fontSize: 9, fontWeight: typography.weights.bold },
  indicatorValue: { fontSize: typography.sizes.md, fontWeight: typography.weights.bold },
  indicatorChange: { fontSize: typography.sizes.sm, fontWeight: typography.weights.medium },
  aiSection: { paddingHorizontal: spacing.lg, marginBottom: spacing.lg },
  aiHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  aiIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm },
  aiTitle: { fontSize: typography.sizes.md, fontWeight: typography.weights.semibold },
  aiSubtitle: { fontSize: typography.sizes.xs },
  aiLoadingCard: {
    padding: spacing.lg,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiLoadingText: { marginLeft: spacing.sm, fontSize: typography.sizes.sm },
  aiCard: { borderRadius: 16, borderWidth: 1.5, overflow: 'hidden' },
  aiCardContent: { flexDirection: 'row', alignItems: 'center', padding: spacing.md },
  aiRecIcon: { width: 56, height: 56, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  aiRecInfo: { flex: 1, marginLeft: spacing.md },
  aiRecName: { fontSize: typography.sizes.md, fontWeight: typography.weights.semibold },
  aiRecReason: { fontSize: typography.sizes.sm, marginTop: 4, lineHeight: 18 },
  confidenceRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  confidenceText: { fontSize: typography.sizes.xs, marginLeft: 4, fontWeight: typography.weights.medium },
  aiRecReturn: { alignItems: 'flex-end' },
  aiRecReturnValue: { fontSize: typography.sizes.xl, fontWeight: typography.weights.bold },
  aiRecReturnLabel: { fontSize: typography.sizes.xs },
  aiInvestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
  },
  aiInvestText: { fontSize: typography.sizes.sm, fontWeight: typography.weights.medium, marginRight: 4 },
  categoryFilter: { paddingHorizontal: spacing.lg, marginBottom: spacing.lg },
  categoryButton: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: 20, marginRight: spacing.sm },
  categoryText: { fontSize: typography.sizes.sm, fontWeight: typography.weights.medium },
  fundsSection: { paddingHorizontal: spacing.lg },
  fundCard: { borderRadius: 16, borderWidth: 1, padding: spacing.md, marginBottom: spacing.md },
  fundHeader: { flexDirection: 'row', alignItems: 'center' },
  fundIcon: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  fundInfo: { flex: 1, marginLeft: spacing.md },
  tickerRow: { flexDirection: 'row', alignItems: 'center' },
  fundTicker: { fontSize: typography.sizes.xs, fontWeight: typography.weights.medium },
  liveIndicator: { width: 6, height: 6, borderRadius: 3, marginLeft: 6 },
  fundName: { fontSize: typography.sizes.md, fontWeight: typography.weights.semibold },
  fundPriceContainer: { alignItems: 'flex-end' },
  fundPrice: { fontSize: typography.sizes.lg, fontWeight: typography.weights.bold },
  currency: { fontSize: typography.sizes.sm, fontWeight: typography.weights.normal },
  changeTag: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginTop: 4 },
  changeText: { fontSize: typography.sizes.xs, fontWeight: typography.weights.semibold, marginLeft: 2 },
  chartContainer: { marginVertical: spacing.md, borderRadius: 8, overflow: 'hidden' },
  liveDot: { position: 'absolute', right: 0, top: 0 },
  liveDotInner: { width: 8, height: 8, borderRadius: 4 },
  fundDetails: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm, borderTopWidth: 1 },
  detailItem: { alignItems: 'center' },
  detailLabel: { fontSize: typography.sizes.xs },
  detailValue: { fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold, marginTop: 2 },
  investButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.sm, borderRadius: 12, marginTop: spacing.sm },
  investButtonText: { color: '#FFFFFF', fontSize: typography.sizes.md, fontWeight: typography.weights.semibold, marginRight: spacing.xs },
  bottomPadding: { height: 100 },
});

export default InvestingScreen;
