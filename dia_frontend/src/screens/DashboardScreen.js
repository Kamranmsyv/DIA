/**
 * Dashboard Screen
 * Main home screen with portfolio overview and quick actions
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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { getPortfolio, getRecommendedFund } from '../services/api';
import { useFocusEffect } from '@react-navigation/native';

const DashboardScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [portfolio, setPortfolio] = useState(null);
  const [recommendation, setRecommendation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  if (loading) {
    return (
      <LinearGradient colors={['#0a1628', '#1a2d4a', '#0d3b2d']} style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00d4aa" />
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#0a1628', '#1a2d4a', '#0d3b2d']} style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00d4aa" />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Salam,</Text>
            <Text style={styles.username}>{user?.username || 'İstifadəçi'}</Text>
          </View>
          <TouchableOpacity style={styles.notificationBtn}>
            <Ionicons name="notifications-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Portfolio Card */}
        <LinearGradient
          colors={['#00d4aa', '#00a86b', '#008060']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.portfolioCard}
        >
          <View style={styles.portfolioHeader}>
            <Text style={styles.portfolioLabel}>Ümumi Balans</Text>
            <View style={styles.changeContainer}>
              <Ionicons
                name={portfolio?.last_24hr_change_percent >= 0 ? 'trending-up' : 'trending-down'}
                size={16}
                color="#fff"
              />
              <Text style={styles.changeText}>
                {portfolio?.last_24hr_change_percent >= 0 ? '+' : ''}
                {portfolio?.last_24hr_change_percent?.toFixed(2) || '0.00'}%
              </Text>
            </View>
          </View>
          <Text style={styles.portfolioValue}>
            {portfolio?.total_value?.toFixed(2) || '0.00'} AZN
          </Text>
          <Text style={styles.investedLabel}>
            İnvestisiya edilib: {portfolio?.invested_amount?.toFixed(2) || '0.00'} AZN
          </Text>

          {portfolio?.invested_fund && (
            <View style={styles.fundBadge}>
              <Ionicons name="leaf" size={14} color="#fff" />
              <Text style={styles.fundBadgeText}>{portfolio.invested_fund.name}</Text>
            </View>
          )}
        </LinearGradient>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('RoundUp')}
          >
            <LinearGradient
              colors={['rgba(0, 212, 170, 0.2)', 'rgba(0, 168, 107, 0.1)']}
              style={styles.actionGradient}
            >
              <View style={styles.actionIcon}>
                <Ionicons name="arrow-up-circle" size={28} color="#00d4aa" />
              </View>
              <Text style={styles.actionText}>Round-Up</Text>
              <Text style={styles.actionSubtext}>İnvestisiya et</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('Funds')}
          >
            <LinearGradient
              colors={['rgba(59, 130, 246, 0.2)', 'rgba(37, 99, 235, 0.1)']}
              style={styles.actionGradient}
            >
              <View style={styles.actionIcon}>
                <Ionicons name="pie-chart" size={28} color="#3b82f6" />
              </View>
              <Text style={styles.actionText}>Fondlar</Text>
              <Text style={styles.actionSubtext}>XanF Portfolioları</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Recommended Fund */}
        {recommendation && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sizin üçün Tövsiyə</Text>
            <TouchableOpacity
              style={styles.recommendCard}
              onPress={() => navigation.navigate('Funds')}
            >
              <View style={styles.recommendHeader}>
                <View style={styles.recommendIcon}>
                  <Ionicons name="star" size={24} color="#f59e0b" />
                </View>
                <View style={styles.recommendInfo}>
                  <Text style={styles.recommendTitle}>
                    {recommendation.recommendation.fund_name}
                  </Text>
                  <Text style={styles.recommendRisk}>
                    {recommendation.user_risk_profile} Profil
                  </Text>
                </View>
                <View style={styles.returnBadge}>
                  <Text style={styles.returnText}>
                    +{recommendation.recommendation.annual_return_mock}%
                  </Text>
                  <Text style={styles.returnLabel}>illik</Text>
                </View>
              </View>
              <Text style={styles.recommendDescription} numberOfLines={2}>
                {recommendation.recommendation.description}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Ionicons name="flash" size={24} color="#f59e0b" />
            <Text style={styles.statValue}>
              {portfolio?.invested_amount > 0
                ? Math.floor(portfolio.invested_amount / 0.5)
                : 0}
            </Text>
            <Text style={styles.statLabel}>Round-up</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="trending-up" size={24} color="#00d4aa" />
            <Text style={styles.statValue}>
              {recommendation?.recommendation?.annual_return_mock || 0}%
            </Text>
            <Text style={styles.statLabel}>Gəlir</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="leaf" size={24} color="#22c55e" />
            <Text style={styles.statValue}>3</Text>
            <Text style={styles.statLabel}>Fond</Text>
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    marginBottom: 24,
  },
  greeting: {
    fontSize: 14,
    color: '#6b7280',
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  notificationBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  portfolioCard: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
  },
  portfolioHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  portfolioLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  changeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  portfolioValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  investedLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  fundBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 12,
  },
  fundBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 6,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  actionCard: {
    flex: 1,
    marginHorizontal: 6,
    borderRadius: 16,
    overflow: 'hidden',
  },
  actionGradient: {
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
  },
  actionIcon: {
    marginBottom: 8,
  },
  actionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  actionSubtext: {
    color: '#6b7280',
    fontSize: 12,
    marginTop: 2,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  recommendCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  recommendHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  recommendIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recommendInfo: {
    flex: 1,
    marginLeft: 12,
  },
  recommendTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  recommendRisk: {
    color: '#6b7280',
    fontSize: 12,
    marginTop: 2,
  },
  returnBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 212, 170, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  returnText: {
    color: '#00d4aa',
    fontSize: 16,
    fontWeight: 'bold',
  },
  returnLabel: {
    color: '#6b7280',
    fontSize: 10,
  },
  recommendDescription: {
    color: '#9ca3af',
    fontSize: 13,
    lineHeight: 18,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 100,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statValue: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 8,
  },
  statLabel: {
    color: '#6b7280',
    fontSize: 11,
    marginTop: 2,
  },
});

export default DashboardScreen;
