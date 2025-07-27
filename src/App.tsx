import React, { useEffect, useState } from 'react';
import { StatusBar, Platform, AppState, AppStateStatus, LogBox } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { enableScreens } from 'react-native-screens';
import SplashScreen from 'react-native-splash-screen';

// Services
import { FirebaseService } from '@/services/api/FirebaseService';
import { AnalyticsService } from '@/services/analytics/AnalyticsService';
import { NotificationService } from '@/services/notifications/NotificationService';

// Screens
import DashboardScreen from '@/screens/dashboard/DashboardScreen';
import ScanCaptureScreen from '@/screens/scan/ScanCaptureScreen';

// Auth Screens
import LoginScreen from '@/screens/auth/LoginScreen';
import RegisterScreen from '@/screens/auth/RegisterScreen';

// Onboarding Screens
import OnboardingWelcomeScreen from '@/screens/onboarding/OnboardingWelcomeScreen';
import OnboardingGoalsScreen from '@/screens/onboarding/OnboardingGoalsScreen';
import OnboardingProfileScreen from '@/screens/onboarding/OnboardingProfileScreen';

// Workout Screens
import WorkoutListScreen from '@/screens/workout/WorkoutListScreen';
import ActiveWorkoutScreen from '@/screens/workout/ActiveWorkoutScreen';

// Stats Screens
import StatsScreen from '@/screens/stats/StatsScreen';

// Profile Screens
import ProfileScreen from '@/screens/profile/ProfileScreen';

// Types
import {
  RootStackParamList,
  AuthStackParamList,
  OnboardingStackParamList,
  MainTabParamList,
  WorkoutStackParamList,
  ScanStackParamList,
} from '@/types';

// Constants
import { COLORS, FONTS } from '@/utils/constants';

// Ignorer certains warnings en développement
LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
  'Remote debugger',
  'Setting a timer',
]);

// Activer les écrans natifs pour de meilleures performances
enableScreens();

// Navigation Stacks
const RootStack = createStackNavigator<RootStackParamList>();
const AuthStack = createStackNavigator<AuthStackParamList>();
const OnboardingStack = createStackNavigator<OnboardingStackParamList>();
const MainTab = createBottomTabNavigator<MainTabParamList>();
const WorkoutStack = createStackNavigator<WorkoutStackParamList>();
const ScanStack = createStackNavigator<ScanStackParamList>();

// Auth Navigator
const AuthNavigator: React.FC = () => (
  <AuthStack.Navigator
    screenOptions={{
      headerShown: false,
      cardStyle: { backgroundColor: COLORS.background.light },
    }}
  >
    <AuthStack.Screen name="Login" component={LoginScreen} />
    <AuthStack.Screen name="Register" component={RegisterScreen} />
  </AuthStack.Navigator>
);

// Onboarding Navigator
const OnboardingNavigator: React.FC = () => (
  <OnboardingStack.Navigator
    screenOptions={{
      headerShown: false,
      cardStyle: { backgroundColor: COLORS.background.light },
    }}
  >
    <OnboardingStack.Screen name="Welcome" component={OnboardingWelcomeScreen} />
    <OnboardingStack.Screen name="Goals" component={OnboardingGoalsScreen} />
    <OnboardingStack.Screen name="Profile" component={OnboardingProfileScreen} />
  </OnboardingStack.Navigator>
);

// Workout Navigator
const WorkoutNavigator: React.FC = () => (
  <WorkoutStack.Navigator
    screenOptions={{
      headerStyle: {
        backgroundColor: COLORS.primary,
        elevation: 0,
        shadowOpacity: 0,
      },
      headerTintColor: COLORS.white,
      headerTitleStyle: {
        fontWeight: FONTS.weights.bold,
        fontSize: FONTS.sizes.lg,
      },
    }}
  >
    <WorkoutStack.Screen 
      name="WorkoutList" 
      component={WorkoutListScreen}
      options={{ title: 'Entraînements' }}
    />
    <WorkoutStack.Screen 
      name="ActiveWorkout" 
      component={ActiveWorkoutScreen}
      options={{ 
        title: 'Entraînement en cours',
        headerLeft: () => null, // Empêcher le retour pendant l'entraînement
      }}
    />
  </WorkoutStack.Navigator>
);

// Scan Navigator
const ScanNavigator: React.FC = () => (
  <ScanStack.Navigator
    screenOptions={{
      headerShown: false,
    }}
  >
    <ScanStack.Screen name="ScanCapture" component={ScanCaptureScreen} />
  </ScanStack.Navigator>
);

// Main Tab Navigator
const MainNavigator: React.FC = () => (
  <MainTab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName: string;

        switch (route.name) {
          case 'Dashboard':
            iconName = 'dashboard';
            break;
          case 'Workouts':
            iconName = 'fitness-center';
            break;
          case 'Scan':
            iconName = '3d-rotation';
            break;
          case 'Stats':
            iconName = 'analytics';
            break;
          case 'Profile':
            iconName = 'person';
            break;
          default:
            iconName = 'help';
        }

        return <Icon name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: COLORS.primary,
      tabBarInactiveTintColor: COLORS.gray[500],
      tabBarStyle: {
        backgroundColor: COLORS.white,
        borderTopColor: COLORS.border.light,
        borderTopWidth: 1,
        paddingBottom: Platform.OS === 'ios' ? 20 : 5,
        paddingTop: 5,
        height: Platform.OS === 'ios' ? 85 : 65,
      },
      tabBarLabelStyle: {
        fontSize: FONTS.sizes.xs,
        fontWeight: FONTS.weights.medium,
      },
      headerShown: false,
    })}
  >
    <MainTab.Screen 
      name="Dashboard" 
      component={DashboardScreen}
      options={{ tabBarLabel: 'Accueil' }}
    />
    <MainTab.Screen 
      name="Workouts" 
      component={WorkoutNavigator}
      options={{ tabBarLabel: 'Entraînements' }}
    />
    <MainTab.Screen 
      name="Scan" 
      component={ScanNavigator}
      options={{ 
        tabBarLabel: 'Scan 3D',
        tabBarButton: (props) => (
          <Icon
            {...props}
            name="3d-rotation"
            size={32}
            color={COLORS.primary}
            style={{
              backgroundColor: COLORS.primary + '20',
              borderRadius: 25,
              padding: 8,
              marginTop: -10,
            }}
          />
        ),
      }}
    />
    <MainTab.Screen 
      name="Stats" 
      component={StatsScreen}
      options={{ tabBarLabel: 'Statistiques' }}
    />
    <MainTab.Screen 
      name="Profile" 
      component={ProfileScreen}
      options={{ tabBarLabel: 'Profil' }}
    />
  </MainTab.Navigator>
);

// Hook pour gérer l'état de l'application
const useAppState = () => {
  const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      setAppState(nextAppState);
      
      // Analytics pour les sessions
      if (nextAppState === 'active') {
        AnalyticsService.trackEvent('app_foreground');
      } else if (nextAppState === 'background') {
        AnalyticsService.trackEvent('app_background');
      }
    });

    return () => subscription?.remove();
  }, []);

  return appState;
};

// Hook pour gérer l'authentification
const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      // Vérifier l'état d'authentification
      const user = await FirebaseService.getCurrentUser();
      setIsAuthenticated(!!user);

      if (user) {
        // Vérifier si l'onboarding est terminé
        const profile = await FirebaseService.getUserProfile(user.id);
        setHasCompletedOnboarding(!!profile);
      } else {
        setHasCompletedOnboarding(false);
      }
    } catch (error) {
      console.error('Erreur vérification auth:', error);
      setIsAuthenticated(false);
      setHasCompletedOnboarding(false);
    }
  };

  return { isAuthenticated, hasCompletedOnboarding, checkAuthState };
};

// Composant principal de l'application
const App: React.FC = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const { isAuthenticated, hasCompletedOnboarding } = useAuth();
  const appState = useAppState();

  useEffect(() => {
    initializeApp();
  }, []);

  useEffect(() => {
    // Gérer les changements d'état de l'application
    if (appState === 'active' && isInitialized) {
      // App devient active
      handleAppBecomeActive();
    }
  }, [appState, isInitialized]);

  const initializeApp = async () => {
    try {
      // Initialiser Firebase
      await FirebaseService.initialize();
      
      // Initialiser les Analytics
      await AnalyticsService.initialize();
      
      // Initialiser les Notifications
      await NotificationService.initialize();
      
      // Autres initialisations...
      
      setIsInitialized(true);
      
      // Cacher le splash screen
      if (Platform.OS === 'android') {
        SplashScreen.hide();
      }
      
      console.log('Application initialisée avec succès');
    } catch (error) {
      console.error('Erreur lors de l\'initialisation:', error);
      setIsInitialized(true); // Continuer même en cas d'erreur
    }
  };

  const handleAppBecomeActive = async () => {
    try {
      // Vérifier les notifications en attente
      await NotificationService.handleAppBecomeActive();
      
      // Synchroniser les données si nécessaire
      // await DataSyncService.sync();
      
    } catch (error) {
      console.error('Erreur lors de la reprise de l\'app:', error);
    }
  };

  const renderNavigator = () => {
    // Attendre l'initialisation
    if (!isInitialized || isAuthenticated === null || hasCompletedOnboarding === null) {
      return null; // Ou un écran de chargement
    }

    // Navigation basée sur l'état d'authentification et d'onboarding
    if (!isAuthenticated) {
      return <AuthNavigator />;
    }

    if (!hasCompletedOnboarding) {
      return <OnboardingNavigator />;
    }

    return <MainNavigator />;
  };

  return (
    <SafeAreaProvider>
      <StatusBar
        barStyle={Platform.OS === 'ios' ? 'dark-content' : 'light-content'}
        backgroundColor={COLORS.primary}
        translucent={false}
      />
      
      <NavigationContainer
        onStateChange={(state) => {
          // Analytics de navigation
          if (state) {
            const routeName = state.routes[state.index]?.name;
            if (routeName) {
              AnalyticsService.trackScreenView(routeName);
            }
          }
        }}
      >
        <RootStack.Navigator
          screenOptions={{
            headerShown: false,
            cardStyle: { backgroundColor: COLORS.background.light },
          }}
        >
          {!isAuthenticated ? (
            <RootStack.Screen name="Auth" component={AuthNavigator} />
          ) : !hasCompletedOnboarding ? (
            <RootStack.Screen name="Onboarding" component={OnboardingNavigator} />
          ) : (
            <RootStack.Screen name="Main" component={MainNavigator} />
          )}
        </RootStack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

export default App;