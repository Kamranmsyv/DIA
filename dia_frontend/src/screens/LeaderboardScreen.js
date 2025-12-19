/**
 * Leaderboard Screen
 * Gamification feature - display top investors
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../components';
import { colors } from '../theme/colors';
import { typography, spacing, borderRadius } from '../theme/typography';
import { getLeaderboard } from '../services/api';
import { useAuth } from '../context/AuthContext';

const LeaderboardScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const response = await getLeaderboard();
      if (response.success) {
        setLeaderboard(response.data.leaderboard);
      }
    } catch (error) {
      console.log('Leaderboard fetch error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchLeaderboard();
  };

  const getMedalColor = (rank) => {
    switch (rank) {
      case 1:
        return '#ffd700'; // Gold
      case 2:
        return '#c0c0c0'; // Silver
      case 3:
        return '#cd7f32'; // Bronze
      default:
        return colors.textMuted;
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
          <Text style={styles.title}>Leaderboard</Text>
          <View style={styles.placeholder} />
        </View>

        <Text style={styles.subtitle}>Top Investors</Text>

        {/* Top 3 Podium */}
        <View style={styles.podium}>
          {/* 2nd Place */}
          {leaderboard[1] && (
            <View style={styles.podiumItem}>
              <View style={[styles.podiumAvatar, { backgroundColor: '#c0c0c020' }]}>
                <Text style={styles.podiumInitial}>
                  {leaderboard[1]?.username?.charAt(0).toUpperCase()}
                </Text>
              </View>
              <Text style={styles.podiumName} numberOfLines={1}>
                {leaderboard[1]?.username}
              </Text>
              <Text style={styles.podiumAmount}>
                {leaderboard[1]?.total_invested.toFixed(0)} AZN
              </Text>
              <View style={[styles.podiumBar, styles.podiumBar2]}>
                <Ionicons name="trophy" size={20} color="#c0c0c0" />
                <Text style={styles.podiumRank}>2</Text>
              </View>
            </View>
          )}

          {/* 1st Place */}
          {leaderboard[0] && (
            <View style={styles.podiumItem}>
              <Ionicons name="crown" size={24} color="#ffd700" style={styles.crown} />
              <View style={[styles.podiumAvatar, styles.podiumAvatarFirst]}>
                <Text style={styles.podiumInitial}>
                  {leaderboard[0]?.username?.charAt(0).toUpperCase()}
                </Text>
              </View>
              <Text style={styles.podiumName} numberOfLines={1}>
                {leaderboard[0]?.username}
              </Text>
              <Text style={[styles.podiumAmount, { color: '#ffd700' }]}>
                {leaderboard[0]?.total_invested.toFixed(0)} AZN
              </Text>
              <View style={[styles.podiumBar, styles.podiumBar1]}>
                <Ionicons name="trophy" size={24} color="#ffd700" />
                <Text style={[styles.podiumRank, { color: '#ffd700' }]}>1</Text>
              </View>
            </View>
          )}

          {/* 3rd Place */}
          {leaderboard[2] && (
            <View style={styles.podiumItem}>
              <View style={[styles.podiumAvatar, { backgroundColor: '#cd7f3220' }]}>
                <Text style={styles.podiumInitial}>
                  {leaderboard[2]?.username?.charAt(0).toUpperCase()}
                </Text>
              </View>
              <Text style={styles.podiumName} numberOfLines={1}>
                {leaderboard[2]?.username}
              </Text>
              <Text style={styles.podiumAmount}>
                {leaderboard[2]?.total_invested.toFixed(0)} AZN
              </Text>
              <View style={[styles.podiumBar, styles.podiumBar3]}>
                <Ionicons name="trophy" size={18} color="#cd7f32" />
                <Text style={styles.podiumRank}>3</Text>
              </View>
            </View>
          )}
        </View>

        {/* Full List */}
        <View style={styles.listContainer}>
          <Text style={styles.listTitle}>All Investors</Text>
          {leaderboard.map((item, index) => (
            <Card
              key={index}
              style={[
                styles.listItem,
                item.username === user?.email?.split('@')[0] && styles.listItemHighlight,
              ]}
            >
              <View style={styles.rankContainer}>
                <Ionicons
                  name={item.rank <= 3 ? 'trophy' : 'medal-outline'}
                  size={20}
                  color={getMedalColor(item.rank)}
                />
                <Text style={[styles.rankText, { color: getMedalColor(item.rank) }]}>
                  {item.rank}
                </Text>
              </View>

              <View style={styles.userInfo}>
                <View style={styles.userAvatar}>
                  <Text style={styles.userInitial}>
                    {item.username.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.userName}>{item.username}</Text>
              </View>

              <View style={styles.amountContainer}>
                <Text style={styles.amountValue}>{item.total_invested.toFixed(2)}</Text>
                <Text style={styles.amountCurrency}>AZN</Text>
              </View>
            </Card>
          ))}
        </View>

        {/* Your Position */}
        <Card style={styles.yourPositionCard}>
          <View style={styles.yourPositionIcon}>
            <Ionicons name="person" size={24} color={colors.primary} />
          </View>
          <View style={styles.yourPositionInfo}>
            <Text style={styles.yourPositionLabel}>Your Position</Text>
            <Text style={styles.yourPositionName}>
              {user?.email?.split('@')[0] || 'User'}
            </Text>
          </View>
          <View style={styles.yourPositionRank}>
            <Text style={styles.yourPositionRankText}>-</Text>
            <Text style={styles.yourPositionRankLabel}>rank</Text>
          </View>
        </Card>
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
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  podium: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    marginBottom: spacing['2xl'],
    paddingHorizontal: spacing.sm,
  },
  podiumItem: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: spacing.xs,
  },
  crown: {
    marginBottom: spacing.xs,
  },
  podiumAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.backgroundLighter,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  podiumAvatarFirst: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderWidth: 2,
    borderColor: '#ffd700',
  },
  podiumInitial: {
    color: colors.textPrimary,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  podiumName: {
    color: colors.textPrimary,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  podiumAmount: {
    color: colors.primary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.sm,
  },
  podiumBar: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderTopLeftRadius: borderRadius.md,
    borderTopRightRadius: borderRadius.md,
    paddingVertical: spacing.sm,
  },
  podiumBar1: {
    height: 80,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
  },
  podiumBar2: {
    height: 60,
    backgroundColor: 'rgba(192, 192, 192, 0.2)',
  },
  podiumBar3: {
    height: 45,
    backgroundColor: 'rgba(205, 127, 50, 0.2)',
  },
  podiumRank: {
    color: colors.textPrimary,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    marginTop: spacing.xs,
  },
  listContainer: {
    marginBottom: spacing.xl,
  },
  listTitle: {
    color: colors.textPrimary,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing.md,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  listItemHighlight: {
    borderWidth: 1,
    borderColor: colors.primary + '50',
  },
  rankContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 50,
  },
  rankText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    marginLeft: spacing.xs,
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  userInitial: {
    color: colors.primary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  userName: {
    color: colors.textPrimary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amountValue: {
    color: colors.primary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  amountCurrency: {
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
  },
  yourPositionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.base,
    marginBottom: spacing['3xl'],
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  yourPositionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  yourPositionInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  yourPositionLabel: {
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
  },
  yourPositionName: {
    color: colors.textPrimary,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
  },
  yourPositionRank: {
    alignItems: 'center',
  },
  yourPositionRankText: {
    color: colors.primary,
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
  },
  yourPositionRankLabel: {
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
  },
});

export default LeaderboardScreen;
