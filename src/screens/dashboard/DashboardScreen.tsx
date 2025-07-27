import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { LineChart, ProgressChart, BarChart } from 'react-native-chart-kit';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { COLORS, FONTS, SPACING, SHADOWS } from '@/utils/constants';
import { 
  User, 
  UserStats, 
  WorkoutPlan, 
  BodyScan, 
  Achievement,
  MainTabParamList 
} from '@/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - SPACING.lg * 2;

type DashboardNavigationProp = StackNavigationProp<MainTabParamList, 'Dashboard'>;

interface DashboardData {
  user: User;
  stats: UserStats;
  currentPlan?: WorkoutPlan;
  latestScan?: BodyScan;
  recentAchievements: Achievement[];
  weeklyProgress: number[];
  bodyCompositionHistory: {
    dates: string[];
    bodyFat: number[];
    muscleMass: number[];
  };
}

const DashboardScreen: React.FC = () => {
  const navigation = useNavigation<DashboardNavigationProp>();
  
  // State
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Simuler le chargement des données
      // Dans une vraie app, ces données viendraient de Firebase/API
      const mockData: DashboardData = {
        user: {
          id: 'user_1',
          email: 'user@example.com',
          displayName: 'John Doe',
          photoURL: 'https://example.com/avatar.jpg',
          createdAt: new Date(),
          lastLoginAt: new Date(),
          isPremium: false,
        },
        stats: {
          userId: 'user_1',
          level: 12,
          totalPoints: 2450,
          workoutsCompleted: 87,
          currentStreak: 5,
          longestStreak: 14,
          totalCaloriesBurned: 12500,
          totalWeightLifted: 8750,
          totalWorkoutTime: 2640,
          achievements: [],
          lastUpdated: new Date(),
        },
        currentPlan: {
          id: 'plan_1',
          userId: 'user_1',
          name: 'Programme Perte de poids',
          description: 'Programme personnalisé niveau intermédiaire',
          duration: 12,
          difficulty: 'intermediate',
          goals: ['weight_loss', 'general_fitness'],
          sessions: [],
          createdAt: new Date(),
          isActive: true,
        },
        latestScan: {
          id: 'scan_1',
          userId: 'user_1',
          timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 jours
          scanData: {} as any,
          bodyComposition: {
            bodyFatPercentage: 18.5,
            muscleMass: 32.4,
            boneDensity: 1.2,
            waterPercentage: 58.3,
            visceralFat: 7.2,
            basalMetabolicRate: 1650,
            bmi: 23.1,
            bodyAge: 28,
            metabolicAge: 26,
          },
          measurements: {
            chest: 98,
            waist: 82,
            hips: 95,
            bicep: 34,
            thigh: 58,
            neck: 38,
            shoulders: 112,
            forearm: 28,
            calf: 37,
          },
          model3D: 'https://example.com/model.json',
          confidence: 0.92,
          processingStatus: 'completed',
        },
        recentAchievements: [
          {
            id: 'ach_1',
            name: 'Série de 5',
            description: '5 jours consécutifs d\'entraînement',
            icon: 'emoji_events',
            category: 'consistency',
            requirement: { type: 'streak_days', value: 5 },
            points: 50,
            rarity: 'common',
            unlockedAt: new Date(),
          },
        ],
        weeklyProgress: [70, 85, 90, 75, 95, 88, 92],
        bodyCompositionHistory: {
          dates: ['Jan', 'Feb', 'Mar', 'Apr', 'Mai', 'Jun'],
          bodyFat: [22.1, 21.3, 20.8, 19.9, 19.2, 18.5],
          muscleMass: [29.8, 30.5, 31.2, 31.8, 32.1, 32.4],
        },
      };

      setDashboardData(mockData);
    } catch (error) {
      console.error('Erreur chargement dashboard:', error);
      Alert.alert('Erreur', 'Impossible de charger les données');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const navigateToScan = () => {
    navigation.navigate('Scan' as any);
  };

  const navigateToWorkouts = () => {
    navigation.navigate('Workouts' as any);
  };

  const navigateToStats = () => {
    navigation.navigate('Stats' as any);
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerContent}>
        <View>
          <Text style={styles.greeting}>Bonjour,</Text>
          <Text style={styles.userName}>
            {dashboardData?.user.displayName || 'Utilisateur'}
          </Text>
        </View>
        
        <View style={styles.headerRight}>
          <View style={styles.levelBadge}>
            <Icon name="star" size={16} color={COLORS.accent} />
            <Text style={styles.levelText}>
              Niv. {dashboardData?.stats.level}
            </Text>
          </View>
          
          <TouchableOpacity style={styles.profileButton}>
            <Icon name="person" size={24} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderQuickStats = () => (
    <View style={styles.quickStatsContainer}>
      <LinearGradient
        colors={COLORS.gradient.primary}
        style={styles.quickStatsCard}
      >
        <View style={styles.quickStatsRow}>
          <View style={styles.quickStat}>
            <Text style={styles.quickStatValue}>
              {dashboardData?.stats.currentStreak}
            </Text>
            <Text style={styles.quickStatLabel}>Jours de suite</Text>
          </View>
          
          <View style={styles.quickStatDivider} />
          
          <View style={styles.quickStat}>
            <Text style={styles.quickStatValue}>
              {dashboardData?.stats.workoutsCompleted}
            </Text>
            <Text style={styles.quickStatLabel}>Séances</Text>
          </View>
          
          <View style={styles.quickStatDivider} />
          
          <View style={styles.quickStat}>
            <Text style={styles.quickStatValue}>
              {Math.round((dashboardData?.stats.totalCaloriesBurned || 0) / 1000)}k
            </Text>
            <Text style={styles.quickStatLabel}>Calories</Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );

  const renderProgressChart = () => {
    if (!dashboardData) return null;

    const progressData = {
      labels: ['L', 'M', 'M', 'J', 'V', 'S', 'D'],
      data: dashboardData.weeklyProgress.map(p => p / 100),
    };

    return (
      <View style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle}>Progrès cette semaine</Text>
          <Text style={styles.chartSubtitle}>Objectifs atteints</Text>
        </View>
        
        <ProgressChart
          data={progressData}
          width={CHART_WIDTH}
          height={180}
          strokeWidth={8}
          radius={25}
          chartConfig={{
            backgroundGradientFrom: COLORS.white,
            backgroundGradientTo: COLORS.white,
            color: (opacity = 1) => `rgba(108, 92, 231, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(45, 52, 54, ${opacity})`,
          }}
          hideLegend={false}
        />
      </View>
    );
  };

  const renderBodyCompositionChart = () => {
    if (!dashboardData) return null;

    const chartData = {
      labels: dashboardData.bodyCompositionHistory.dates,
      datasets: [
        {
          data: dashboardData.bodyCompositionHistory.bodyFat,
          color: (opacity = 1) => `rgba(225, 112, 85, ${opacity})`,
          strokeWidth: 3,
        },
        {
          data: dashboardData.bodyCompositionHistory.muscleMass,
          color: (opacity = 1) => `rgba(0, 184, 148, ${opacity})`,
          strokeWidth: 3,
        },
      ],
      legend: ['Masse grasse (%)', 'Masse musculaire (kg)'],
    };

    return (
      <View style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle}>Évolution corporelle</Text>
          <TouchableOpacity onPress={navigateToScan}>
            <Text style={styles.chartAction}>Nouveau scan</Text>
          </TouchableOpacity>
        </View>
        
        <LineChart
          data={chartData}
          width={CHART_WIDTH}
          height={200}
          yAxisSuffix=""
          chartConfig={{
            backgroundGradientFrom: COLORS.white,
            backgroundGradientTo: COLORS.white,
            decimalPlaces: 1,
            color: (opacity = 1) => `rgba(108, 92, 231, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(45, 52, 54, ${opacity})`,
            style: {
              borderRadius: 16,
            },
            propsForDots: {
              r: '4',
              strokeWidth: '2',
            },
          }}
          bezier
          style={styles.chart}
        />
      </View>
    );
  };

  const renderCurrentPlan = () => {
    if (!dashboardData?.currentPlan) return null;

    return (
      <View style={styles.planCard}>
        <View style={styles.planHeader}>
          <View style={styles.planInfo}>
            <Text style={styles.planTitle}>
              {dashboardData.currentPlan.name}
            </Text>
            <Text style={styles.planDescription}>
              {dashboardData.currentPlan.description}
            </Text>
          </View>
          
          <View style={styles.planProgress}>
            <Text style={styles.planProgressText}>Semaine 3/12</Text>
            <View style={styles.planProgressBar}>
              <View style={[styles.planProgressFill, { width: '25%' }]} />
            </View>
          </View>
        </View>
        
        <TouchableOpacity
          style={styles.nextWorkoutButton}
          onPress={navigateToWorkouts}
        >
          <LinearGradient
            colors={COLORS.gradient.secondary}
            style={styles.nextWorkoutGradient}
          >
            <Icon name="fitness-center" size={20} color={COLORS.white} />
            <Text style={styles.nextWorkoutText}>
              Prochaine séance: Musculation - Haut du corps
            </Text>
            <Icon name="arrow-forward" size={20} color={COLORS.white} />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  };

  const renderLatestScan = () => {
    if (!dashboardData?.latestScan) return null;

    const { bodyComposition } = dashboardData.latestScan;
    const daysSinceScan = Math.floor(
      (Date.now() - dashboardData.latestScan.timestamp.getTime()) / (1000 * 60 * 60 * 24)
    );

    return (
      <View style={styles.scanCard}>
        <View style={styles.scanHeader}>
          <Text style={styles.scanTitle}>Dernier scan 3D</Text>
          <Text style={styles.scanDate}>Il y a {daysSinceScan} jours</Text>
        </View>
        
        <View style={styles.scanMetrics}>
          <View style={styles.scanMetric}>
            <Text style={styles.scanMetricValue}>
              {bodyComposition.bodyFatPercentage.toFixed(1)}%
            </Text>
            <Text style={styles.scanMetricLabel}>Masse grasse</Text>
          </View>
          
          <View style={styles.scanMetric}>
            <Text style={styles.scanMetricValue}>
              {bodyComposition.muscleMass.toFixed(1)}kg
            </Text>
            <Text style={styles.scanMetricLabel}>Masse musculaire</Text>
          </View>
          
          <View style={styles.scanMetric}>
            <Text style={styles.scanMetricValue}>
              {bodyComposition.bmi.toFixed(1)}
            </Text>
            <Text style={styles.scanMetricLabel}>IMC</Text>
          </View>
        </View>
        
        <TouchableOpacity
          style={styles.scanButton}
          onPress={navigateToScan}
        >
          <Icon name="3d-rotation" size={20} color={COLORS.primary} />
          <Text style={styles.scanButtonText}>Nouveau scan</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderRecentAchievements = () => {
    if (!dashboardData?.recentAchievements.length) return null;

    return (
      <View style={styles.achievementsCard}>
        <View style={styles.achievementsHeader}>
          <Text style={styles.achievementsTitle}>Succès récents</Text>
          <TouchableOpacity onPress={navigateToStats}>
            <Text style={styles.achievementsAction}>Voir tout</Text>
          </TouchableOpacity>
        </View>
        
        {dashboardData.recentAchievements.map((achievement) => (
          <View key={achievement.id} style={styles.achievementItem}>
            <View style={styles.achievementIcon}>
              <Icon name={achievement.icon} size={24} color={COLORS.accent} />
            </View>
            
            <View style={styles.achievementInfo}>
              <Text style={styles.achievementName}>
                {achievement.name}
              </Text>
              <Text style={styles.achievementDescription}>
                {achievement.description}
              </Text>
            </View>
            
            <View style={styles.achievementPoints}>
              <Text style={styles.achievementPointsText}>
                +{achievement.points}
              </Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderQuickActions = () => (
    <View style={styles.quickActionsContainer}>
      <TouchableOpacity
        style={styles.quickActionButton}
        onPress={navigateToWorkouts}
      >
        <LinearGradient
          colors={COLORS.gradient.primary}
          style={styles.quickActionGradient}
        >
          <Icon name="fitness-center" size={24} color={COLORS.white} />
          <Text style={styles.quickActionText}>Commencer</Text>
        </LinearGradient>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={styles.quickActionButton}
        onPress={navigateToScan}
      >
        <LinearGradient
          colors={COLORS.gradient.secondary}
          style={styles.quickActionGradient}
        >
          <Icon name="3d-rotation" size={24} color={COLORS.white} />
          <Text style={styles.quickActionText}>Scanner</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {renderQuickStats()}
        {renderCurrentPlan()}
        {renderQuickActions()}
        {renderProgressChart()}
        {renderBodyCompositionChart()}
        {renderLatestScan()}
        {renderRecentAchievements()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.light,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: FONTS.sizes.md,
    color: COLORS.white + 'CC',
    fontWeight: FONTS.weights.regular,
  },
  userName: {
    fontSize: FONTS.sizes.xl,
    color: COLORS.white,
    fontWeight: FONTS.weights.bold,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white + '20',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 12,
    gap: SPACING.xs,
  },
  levelText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.white,
    fontWeight: FONTS.weights.medium,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SPACING.xl,
  },
  quickStatsContainer: {
    paddingHorizontal: SPACING.lg,
    marginTop: -SPACING.lg,
  },
  quickStatsCard: {
    borderRadius: 16,
    padding: SPACING.lg,
    ...SHADOWS.lg,
  },
  quickStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quickStat: {
    flex: 1,
    alignItems: 'center',
  },
  quickStatValue: {
    fontSize: FONTS.sizes.xxl,
    color: COLORS.white,
    fontWeight: FONTS.weights.bold,
    marginBottom: SPACING.xs,
  },
  quickStatLabel: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.white + 'CC',
    fontWeight: FONTS.weights.medium,
  },
  quickStatDivider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.white + '30',
    marginHorizontal: SPACING.md,
  },
  planCard: {
    margin: SPACING.lg,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: SPACING.lg,
    ...SHADOWS.md,
  },
  planHeader: {
    marginBottom: SPACING.md,
  },
  planInfo: {
    marginBottom: SPACING.md,
  },
  planTitle: {
    fontSize: FONTS.sizes.lg,
    color: COLORS.text.primary,
    fontWeight: FONTS.weights.bold,
    marginBottom: SPACING.xs,
  },
  planDescription: {
    fontSize: FONTS.sizes.md,
    color: COLORS.text.secondary,
  },
  planProgress: {
    alignItems: 'flex-end',
  },
  planProgressText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.text.secondary,
    marginBottom: SPACING.xs,
  },
  planProgressBar: {
    width: 100,
    height: 4,
    backgroundColor: COLORS.gray[200],
    borderRadius: 2,
  },
  planProgressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
  nextWorkoutButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  nextWorkoutGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  nextWorkoutText: {
    flex: 1,
    fontSize: FONTS.sizes.md,
    color: COLORS.white,
    fontWeight: FONTS.weights.medium,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  quickActionButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  quickActionGradient: {
    alignItems: 'center',
    padding: SPACING.lg,
    gap: SPACING.sm,
  },
  quickActionText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.white,
    fontWeight: FONTS.weights.bold,
  },
  chartCard: {
    margin: SPACING.lg,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: SPACING.lg,
    ...SHADOWS.md,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  chartTitle: {
    fontSize: FONTS.sizes.lg,
    color: COLORS.text.primary,
    fontWeight: FONTS.weights.bold,
  },
  chartSubtitle: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.text.secondary,
  },
  chartAction: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.primary,
    fontWeight: FONTS.weights.medium,
  },
  chart: {
    marginVertical: SPACING.sm,
    borderRadius: 16,
  },
  scanCard: {
    margin: SPACING.lg,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: SPACING.lg,
    ...SHADOWS.md,
  },
  scanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  scanTitle: {
    fontSize: FONTS.sizes.lg,
    color: COLORS.text.primary,
    fontWeight: FONTS.weights.bold,
  },
  scanDate: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.text.secondary,
  },
  scanMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  scanMetric: {
    alignItems: 'center',
  },
  scanMetricValue: {
    fontSize: FONTS.sizes.lg,
    color: COLORS.text.primary,
    fontWeight: FONTS.weights.bold,
    marginBottom: SPACING.xs,
  },
  scanMetricLabel: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary + '10',
    borderRadius: 12,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  scanButtonText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.primary,
    fontWeight: FONTS.weights.medium,
  },
  achievementsCard: {
    margin: SPACING.lg,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: SPACING.lg,
    ...SHADOWS.md,
  },
  achievementsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  achievementsTitle: {
    fontSize: FONTS.sizes.lg,
    color: COLORS.text.primary,
    fontWeight: FONTS.weights.bold,
  },
  achievementsAction: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.primary,
    fontWeight: FONTS.weights.medium,
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    gap: SPACING.md,
  },
  achievementIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.accent + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  achievementInfo: {
    flex: 1,
  },
  achievementName: {
    fontSize: FONTS.sizes.md,
    color: COLORS.text.primary,
    fontWeight: FONTS.weights.medium,
    marginBottom: SPACING.xs,
  },
  achievementDescription: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.text.secondary,
  },
  achievementPoints: {
    backgroundColor: COLORS.success + '20',
    borderRadius: 12,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  achievementPointsText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.success,
    fontWeight: FONTS.weights.bold,
  },
});

export default DashboardScreen;