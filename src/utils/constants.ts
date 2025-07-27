import { Dimensions, Platform } from 'react-native';

// Dimensions de l'écran
export const SCREEN_WIDTH = Dimensions.get('window').width;
export const SCREEN_HEIGHT = Dimensions.get('window').height;

// Couleurs du thème
export const COLORS = {
  // Couleurs principales
  primary: '#6C5CE7',
  primaryDark: '#5A4FCF',
  primaryLight: '#8B7EF7',
  
  // Couleurs secondaires
  secondary: '#00B894',
  secondaryDark: '#00A085',
  secondaryLight: '#26D0CE',
  
  // Couleurs d'accent
  accent: '#FDCB6E',
  accentDark: '#E17055',
  accentLight: '#FD79A8',
  
  // Couleurs système
  success: '#00B894',
  warning: '#FDCB6E',
  error: '#E17055',
  info: '#74B9FF',
  
  // Couleurs neutres
  white: '#FFFFFF',
  black: '#2D3436',
  gray: {
    50: '#F8F9FA',
    100: '#E9ECEF',
    200: '#DEE2E6',
    300: '#CED4DA',
    400: '#ADB5BD',
    500: '#6C757D',
    600: '#495057',
    700: '#343A40',
    800: '#212529',
    900: '#1C1E21',
  },
  
  // Couleurs de fond
  background: {
    light: '#FFFFFF',
    dark: '#1C1E21',
    card: '#F8F9FA',
    cardDark: '#2D3436',
  },
  
  // Couleurs de texte
  text: {
    primary: '#2D3436',
    secondary: '#636E72',
    tertiary: '#ADB5BD',
    inverse: '#FFFFFF',
    light: '#FFFFFF',
    dark: '#2D3436',
  },
  
  // Couleurs de bordure
  border: {
    light: '#E9ECEF',
    medium: '#DEE2E6',
    dark: '#CED4DA',
  },
  
  // Couleurs de dégradé
  gradient: {
    primary: ['#6C5CE7', '#74B9FF'],
    secondary: ['#00B894', '#26D0CE'],
    accent: ['#FDCB6E', '#FD79A8'],
    dark: ['#2D3436', '#636E72'],
  },
};

// Typographie
export const FONTS = {
  // Tailles de police
  sizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    title: 40,
  },
  
  // Poids de police
  weights: {
    light: '300' as const,
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
  },
  
  // Familles de police
  families: {
    regular: Platform.OS === 'ios' ? 'SF Pro Display' : 'Roboto',
    medium: Platform.OS === 'ios' ? 'SF Pro Display Medium' : 'Roboto Medium',
    bold: Platform.OS === 'ios' ? 'SF Pro Display Bold' : 'Roboto Bold',
    light: Platform.OS === 'ios' ? 'SF Pro Display Light' : 'Roboto Light',
  },
};

// Espacements
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

// Rayons de bordure
export const BORDER_RADIUS = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  round: 50,
  circle: 9999,
};

// Ombres
export const SHADOWS = {
  sm: {
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  xl: {
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 16,
  },
};

// Configuration de l'animation
export const ANIMATION = {
  duration: {
    fast: 150,
    normal: 300,
    slow: 500,
  },
  easing: {
    ease: 'ease',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
  },
};

// Configuration du scan 3D
export const SCAN_CONFIG = {
  // Paramètres de capture
  captureFrameRate: 30,
  minCaptureTime: 15, // secondes
  maxCaptureTime: 45,
  requiredRotationAngle: 360, // degrés
  minDistanceFromCamera: 1.5, // mètres
  maxDistanceFromCamera: 3.0,
  
  // Paramètres de qualité
  minConfidenceScore: 0.8,
  imageResolution: {
    width: 1920,
    height: 1080,
  },
  
  // Paramètres de traitement
  meshResolution: 'high', // 'low', 'medium', 'high'
  textureResolution: 2048,
  compressionLevel: 0.8,
  
  // Seuils de détection
  bodyDetectionThreshold: 0.9,
  poseStabilityThreshold: 0.95,
  lightingQualityThreshold: 0.7,
};

// Configuration des entraînements
export const WORKOUT_CONFIG = {
  // Durées par défaut
  defaultRestTime: 60, // secondes
  defaultSetCount: 3,
  defaultRepsRange: { min: 8, max: 12 },
  
  // Niveaux de difficulté
  difficultyMultipliers: {
    beginner: 0.7,
    intermediate: 1.0,
    advanced: 1.3,
  },
  
  // Fréquences d'entraînement recommandées
  recommendedFrequency: {
    beginner: { min: 2, max: 3 },
    intermediate: { min: 3, max: 4 },
    advanced: { min: 4, max: 6 },
  },
  
  // Durées de session recommandées
  recommendedDuration: {
    beginner: { min: 30, max: 45 },
    intermediate: { min: 45, max: 60 },
    advanced: { min: 60, max: 90 },
  },
};

// Configuration de la gamification
export const GAMIFICATION_CONFIG = {
  // Points par action
  points: {
    workoutCompleted: 10,
    perfectWeek: 50,
    streakDay: 5,
    scanCompleted: 20,
    achievementUnlocked: 100,
    socialInteraction: 2,
  },
  
  // Niveaux et expérience
  levelThresholds: [
    0, 100, 250, 500, 1000, 2000, 3500, 5500, 8000, 12000, 17500, 25000
  ],
  
  // Configuration des défis
  challengeDuration: {
    daily: 1,
    weekly: 7,
    monthly: 30,
  },
};

// Messages et textes
export const MESSAGES = {
  // Messages d'erreur
  errors: {
    network: 'Erreur de connexion réseau',
    auth: 'Erreur d\'authentification',
    camera: 'Impossible d\'accéder à la caméra',
    permission: 'Permissions requises non accordées',
    scan: 'Erreur lors du scan 3D',
    generic: 'Une erreur est survenue',
  },
  
  // Messages de succès
  success: {
    login: 'Connexion réussie',
    register: 'Compte créé avec succès',
    scanComplete: 'Scan 3D terminé avec succès',
    workoutComplete: 'Entraînement terminé !',
    profileUpdated: 'Profil mis à jour',
  },
  
  // Messages de validation
  validation: {
    required: 'Ce champ est requis',
    email: 'Adresse email invalide',
    password: 'Mot de passe trop faible',
    passwordMatch: 'Les mots de passe ne correspondent pas',
    age: 'Âge invalide',
    weight: 'Poids invalide',
    height: 'Taille invalide',
  },
};

// Configuration des API
export const API_CONFIG = {
  baseURL: __DEV__ ? 'http://localhost:3000/api' : 'https://api.fitscan3d.com',
  timeout: 30000,
  retryAttempts: 3,
  retryDelay: 1000,
  
  // Endpoints
  endpoints: {
    auth: '/auth',
    users: '/users',
    scans: '/scans',
    workouts: '/workouts',
    exercises: '/exercises',
    achievements: '/achievements',
    social: '/social',
    analytics: '/analytics',
  },
};

// Configuration Firebase
export const FIREBASE_CONFIG = {
  collections: {
    users: 'users',
    profiles: 'profiles',
    scans: 'scans',
    workouts: 'workouts',
    exercises: 'exercises',
    achievements: 'achievements',
    posts: 'posts',
    challenges: 'challenges',
  },
  
  storage: {
    buckets: {
      scans: 'scans',
      avatars: 'avatars',
      media: 'media',
      exercises: 'exercises',
    },
  },
};

// Configuration des notifications
export const NOTIFICATION_CONFIG = {
  types: {
    workoutReminder: 'workout_reminder',
    achievementUnlocked: 'achievement_unlocked',
    challengeUpdate: 'challenge_update',
    socialUpdate: 'social_update',
    scanReady: 'scan_ready',
  },
  
  defaultSettings: {
    workoutReminders: true,
    achievements: true,
    challenges: true,
    social: false,
    marketing: false,
  },
};

// Configuration des permissions
export const PERMISSIONS = {
  camera: 'camera',
  microphone: 'microphone',
  storage: 'storage',
  notifications: 'notifications',
  location: 'location',
  healthkit: 'healthkit', // iOS only
  activity: 'activity', // Android only
};

// Configuration des analytics
export const ANALYTICS_EVENTS = {
  // Authentification
  login: 'login',
  register: 'register',
  logout: 'logout',
  
  // Onboarding
  onboardingStarted: 'onboarding_started',
  onboardingCompleted: 'onboarding_completed',
  onboardingAbandoned: 'onboarding_abandoned',
  
  // Scan 3D
  scanStarted: 'scan_started',
  scanCompleted: 'scan_completed',
  scanFailed: 'scan_failed',
  scanViewed: 'scan_viewed',
  
  // Entraînements
  workoutStarted: 'workout_started',
  workoutCompleted: 'workout_completed',
  workoutAbandoned: 'workout_abandoned',
  exerciseCompleted: 'exercise_completed',
  
  // Social
  postCreated: 'post_created',
  postLiked: 'post_liked',
  commentAdded: 'comment_added',
  userFollowed: 'user_followed',
  
  // Gamification
  achievementUnlocked: 'achievement_unlocked',
  levelUp: 'level_up',
  challengeJoined: 'challenge_joined',
  challengeCompleted: 'challenge_completed',
  
  // Monétisation
  premiumViewed: 'premium_viewed',
  premiumPurchased: 'premium_purchased',
  adViewed: 'ad_viewed',
  adClicked: 'ad_clicked',
};

// Regex de validation
export const VALIDATION_REGEX = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  name: /^[a-zA-ZÀ-ÿ\s'-]{2,50}$/,
  phone: /^\+?[1-9]\d{1,14}$/,
};

// Limites de l'application
export const LIMITS = {
  // Limites freemium
  free: {
    workoutsPerWeek: 5,
    scansPerMonth: 2,
    exercisesPerWorkout: 8,
  },
  
  // Limites premium
  premium: {
    workoutsPerWeek: -1, // illimité
    scansPerMonth: -1,
    exercisesPerWorkout: -1,
  },
  
  // Limites techniques
  maxFileSize: 50 * 1024 * 1024, // 50MB
  maxImageSize: 10 * 1024 * 1024, // 10MB
  maxVideoSize: 100 * 1024 * 1024, // 100MB
  maxScanImages: 50,
  maxWorkoutDuration: 180, // minutes
};