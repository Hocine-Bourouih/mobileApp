// Types utilisateur et authentification
export interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: Date;
  lastLoginAt: Date;
  isPremium: boolean;
  subscriptionExpiry?: Date;
}

export interface UserProfile {
  userId: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  height: number; // en cm
  weight: number; // en kg
  fitnessLevel: 'beginner' | 'intermediate' | 'advanced';
  goals: FitnessGoal[];
  availableEquipment: Equipment[];
  workoutFrequency: number; // séances par semaine
  sessionDuration: number; // minutes par séance
  medicalConditions?: string[];
  preferences: UserPreferences;
}

export interface UserPreferences {
  units: 'metric' | 'imperial';
  language: string;
  notifications: NotificationSettings;
  privacy: PrivacySettings;
  theme: 'light' | 'dark' | 'auto';
}

export interface NotificationSettings {
  workoutReminders: boolean;
  progressUpdates: boolean;
  socialUpdates: boolean;
  marketing: boolean;
  pushTime: string; // format HH:MM
}

export interface PrivacySettings {
  profileVisibility: 'public' | 'friends' | 'private';
  shareProgress: boolean;
  shareWorkouts: boolean;
}

// Types scan 3D et composition corporelle
export interface BodyScan {
  id: string;
  userId: string;
  timestamp: Date;
  scanData: ScanData;
  bodyComposition: BodyComposition;
  measurements: BodyMeasurements;
  model3D: string; // URL du modèle 3D
  confidence: number; // 0-1
  processingStatus: 'processing' | 'completed' | 'failed';
}

export interface ScanData {
  images: string[]; // URLs des images capturées
  pointCloud: Float32Array;
  meshData: MeshData;
  calibrationData: CalibrationData;
}

export interface MeshData {
  vertices: Float32Array;
  faces: Uint16Array;
  normals: Float32Array;
  uvCoordinates: Float32Array;
}

export interface CalibrationData {
  cameraIntrinsics: number[][];
  deviceOrientation: number[];
  lightingConditions: number;
  backgroundType: 'plain' | 'textured';
}

export interface BodyComposition {
  bodyFatPercentage: number;
  muscleMass: number; // kg
  boneDensity: number;
  waterPercentage: number;
  visceralFat: number;
  basalMetabolicRate: number; // kcal/jour
  bmi: number;
  bodyAge: number;
  metabolicAge: number;
}

export interface BodyMeasurements {
  chest: number; // cm
  waist: number;
  hips: number;
  bicep: number;
  thigh: number;
  neck: number;
  shoulders: number;
  forearm: number;
  calf: number;
}

// Types entraînement et exercices
export interface WorkoutPlan {
  id: string;
  userId: string;
  name: string;
  description: string;
  duration: number; // semaines
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  goals: FitnessGoal[];
  sessions: WorkoutSession[];
  createdAt: Date;
  isActive: boolean;
}

export interface WorkoutSession {
  id: string;
  planId: string;
  name: string;
  description: string;
  type: WorkoutType;
  estimatedDuration: number; // minutes
  exercises: Exercise[];
  restBetweenSets: number; // secondes
  warmup?: Exercise[];
  cooldown?: Exercise[];
  targetMuscleGroups: MuscleGroup[];
}

export interface Exercise {
  id: string;
  name: string;
  description: string;
  instructions: string[];
  muscleGroups: MuscleGroup[];
  equipment: Equipment[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  sets: number;
  reps?: number;
  duration?: number; // secondes pour exercices de temps
  weight?: number; // kg
  restTime: number; // secondes
  videoUrl?: string;
  animationUrl?: string;
  tips: string[];
  variations: ExerciseVariation[];
  safetyNotes: string[];
}

export interface ExerciseVariation {
  name: string;
  description: string;
  difficulty: 'easier' | 'harder';
  modifications: string[];
}

export interface WorkoutLog {
  id: string;
  userId: string;
  sessionId: string;
  date: Date;
  duration: number; // minutes réelles
  exercises: ExerciseLog[];
  notes?: string;
  rating: number; // 1-5
  caloriesBurned?: number;
  heartRateData?: HeartRateData[];
}

export interface ExerciseLog {
  exerciseId: string;
  sets: SetLog[];
  notes?: string;
  formRating?: number; // 1-5
}

export interface SetLog {
  reps?: number;
  weight?: number;
  duration?: number;
  restTime: number;
  completed: boolean;
}

export interface HeartRateData {
  timestamp: Date;
  bpm: number;
}

// Types gamification et social
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  requirement: AchievementRequirement;
  points: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlockedAt?: Date;
}

export interface AchievementRequirement {
  type: 'workout_count' | 'streak_days' | 'weight_lifted' | 'calories_burned' | 'scan_count' | 'social_interaction';
  value: number;
  timeframe?: 'daily' | 'weekly' | 'monthly' | 'all_time';
}

export interface UserStats {
  userId: string;
  level: number;
  totalPoints: number;
  workoutsCompleted: number;
  currentStreak: number;
  longestStreak: number;
  totalCaloriesBurned: number;
  totalWeightLifted: number; // kg
  totalWorkoutTime: number; // minutes
  achievements: Achievement[];
  lastUpdated: Date;
}

export interface SocialPost {
  id: string;
  userId: string;
  type: 'workout' | 'achievement' | 'progress' | 'scan_result';
  content: string;
  media?: string[]; // URLs
  workoutId?: string;
  achievementId?: string;
  scanId?: string;
  likes: string[]; // userIds
  comments: Comment[];
  createdAt: Date;
  visibility: 'public' | 'friends' | 'private';
}

export interface Comment {
  id: string;
  userId: string;
  content: string;
  createdAt: Date;
  likes: string[];
}

export interface Challenge {
  id: string;
  name: string;
  description: string;
  type: 'individual' | 'group';
  category: 'workout' | 'streak' | 'progress';
  startDate: Date;
  endDate: Date;
  participants: string[]; // userIds
  leaderboard: LeaderboardEntry[];
  rewards: ChallengeReward[];
  isActive: boolean;
}

export interface LeaderboardEntry {
  userId: string;
  score: number;
  rank: number;
  progress: number; // 0-1
}

export interface ChallengeReward {
  rank: number;
  points: number;
  badge?: string;
  premiumDays?: number;
}

// Enums et types utilitaires
export type FitnessGoal = 
  | 'weight_loss'
  | 'muscle_gain'
  | 'strength'
  | 'endurance'
  | 'flexibility'
  | 'general_fitness'
  | 'rehabilitation';

export type WorkoutType = 
  | 'strength'
  | 'cardio'
  | 'hiit'
  | 'yoga'
  | 'stretching'
  | 'pilates'
  | 'crosstraining'
  | 'sports_specific';

export type MuscleGroup = 
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'forearms'
  | 'abs'
  | 'obliques'
  | 'lower_back'
  | 'glutes'
  | 'quadriceps'
  | 'hamstrings'
  | 'calves'
  | 'full_body';

export type Equipment = 
  | 'none'
  | 'dumbbells'
  | 'barbell'
  | 'resistance_bands'
  | 'kettlebells'
  | 'pull_up_bar'
  | 'bench'
  | 'cable_machine'
  | 'smith_machine'
  | 'treadmill'
  | 'stationary_bike'
  | 'rowing_machine'
  | 'yoga_mat'
  | 'foam_roller'
  | 'medicine_ball'
  | 'bosu_ball'
  | 'suspension_trainer';

export type AchievementCategory = 
  | 'workout'
  | 'consistency'
  | 'strength'
  | 'endurance'
  | 'social'
  | 'progress'
  | 'special';

// Types d'erreur
export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
}

// Types de navigation
export type RootStackParamList = {
  Auth: undefined;
  Onboarding: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  SocialLogin: undefined;
};

export type OnboardingStackParamList = {
  Welcome: undefined;
  Goals: undefined;
  Profile: undefined;
  Equipment: undefined;
  Schedule: undefined;
  Permissions: undefined;
  Complete: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  Workouts: undefined;
  Scan: undefined;
  Stats: undefined;
  Profile: undefined;
};

export type WorkoutStackParamList = {
  WorkoutList: undefined;
  WorkoutDetail: { workoutId: string };
  ExerciseDetail: { exerciseId: string };
  ActiveWorkout: { sessionId: string };
  WorkoutHistory: undefined;
};

export type ScanStackParamList = {
  ScanHome: undefined;
  ScanGuide: undefined;
  ScanCapture: undefined;
  ScanProcessing: undefined;
  ScanResults: { scanId: string };
  ScanHistory: undefined;
  BodyComposition: { scanId: string };
};

// Types API
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: AppError;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface FilterParams {
  dateFrom?: Date;
  dateTo?: Date;
  category?: string;
  difficulty?: string;
  equipment?: Equipment[];
}