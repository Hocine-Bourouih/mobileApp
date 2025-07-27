import {
  WorkoutPlan,
  WorkoutSession,
  Exercise,
  UserProfile,
  BodyScan,
  FitnessGoal,
  Equipment,
  WorkoutType,
  MuscleGroup,
  ExerciseVariation,
} from '@/types';
import { WORKOUT_CONFIG, GAMIFICATION_CONFIG } from '@/utils/constants';
import { FirebaseService } from '../api/FirebaseService';
import { AnalyticsService } from '../analytics/AnalyticsService';

interface WorkoutGenerationParams {
  userProfile: UserProfile;
  latestScan?: BodyScan;
  preferences: {
    focusAreas?: MuscleGroup[];
    avoidedExercises?: string[];
    preferredDuration?: number;
    intensityPreference?: 'low' | 'moderate' | 'high';
  };
}

interface ExerciseDatabase {
  [key: string]: Exercise[];
}

class WorkoutGeneratorService {
  private static instance: WorkoutGeneratorService;
  private exerciseDatabase: ExerciseDatabase = {};
  private isInitialized = false;

  private constructor() {}

  public static getInstance(): WorkoutGeneratorService {
    if (!WorkoutGeneratorService.instance) {
      WorkoutGeneratorService.instance = new WorkoutGeneratorService();
    }
    return WorkoutGeneratorService.instance;
  }

  /**
   * Initialise le service avec la base de données d'exercices
   */
  public async initialize(): Promise<void> {
    try {
      if (this.isInitialized) return;

      // Charger la base de données d'exercices depuis Firebase
      this.exerciseDatabase = await this.loadExerciseDatabase();
      this.isInitialized = true;
      
      console.log('WorkoutGeneratorService initialisé avec succès');
    } catch (error) {
      console.error('Erreur lors de l\'initialisation du WorkoutGeneratorService:', error);
      throw error;
    }
  }

  /**
   * Génère un programme d'entraînement personnalisé
   */
  public async generateWorkoutPlan(
    params: WorkoutGenerationParams
  ): Promise<WorkoutPlan> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const { userProfile, latestScan, preferences } = params;

      // Analyser les objectifs et le niveau de l'utilisateur
      const planStructure = this.analyzePlanStructure(userProfile);
      
      // Générer les sessions d'entraînement
      const sessions = await this.generateSessions(
        userProfile,
        planStructure,
        preferences,
        latestScan
      );

      // Créer le plan d'entraînement
      const workoutPlan: WorkoutPlan = {
        id: this.generatePlanId(),
        userId: userProfile.userId,
        name: this.generatePlanName(userProfile.goals),
        description: this.generatePlanDescription(userProfile),
        duration: this.calculatePlanDuration(userProfile),
        difficulty: userProfile.fitnessLevel,
        goals: userProfile.goals,
        sessions,
        createdAt: new Date(),
        isActive: true,
      };

      // Sauvegarder le plan
      await FirebaseService.saveWorkoutPlan(workoutPlan);

      // Analytics
      AnalyticsService.trackEvent('workout_plan_generated', {
        userId: userProfile.userId,
        planId: workoutPlan.id,
        goals: userProfile.goals,
        fitnessLevel: userProfile.fitnessLevel,
        sessionCount: sessions.length,
      });

      return workoutPlan;
    } catch (error) {
      console.error('Erreur lors de la génération du plan:', error);
      throw error;
    }
  }

  /**
   * Adapte un programme existant en fonction des progrès
   */
  public async adaptWorkoutPlan(
    currentPlan: WorkoutPlan,
    progressData: {
      completedSessions: number;
      averageRating: number;
      strengthGains: { [exerciseId: string]: number };
      latestScan?: BodyScan;
    }
  ): Promise<WorkoutPlan> {
    try {
      const adaptedSessions = await Promise.all(
        currentPlan.sessions.map(async (session) => {
          return this.adaptSession(session, progressData);
        })
      );

      const adaptedPlan: WorkoutPlan = {
        ...currentPlan,
        sessions: adaptedSessions,
        name: `${currentPlan.name} (Adapté)`,
        description: `${currentPlan.description}\n\nPlan adapté en fonction de vos progrès.`,
      };

      await FirebaseService.updateWorkoutPlan(adaptedPlan);

      return adaptedPlan;
    } catch (error) {
      console.error('Erreur lors de l\'adaptation du plan:', error);
      throw error;
    }
  }

  /**
   * Génère une session d'entraînement personnalisée à la volée
   */
  public async generateQuickWorkout(
    userProfile: UserProfile,
    constraints: {
      duration: number; // minutes
      equipment: Equipment[];
      targetMuscles?: MuscleGroup[];
      workoutType?: WorkoutType;
    }
  ): Promise<WorkoutSession> {
    try {
      const { duration, equipment, targetMuscles, workoutType } = constraints;

      // Sélectionner les exercices appropriés
      const availableExercises = this.filterExercisesByConstraints(
        equipment,
        targetMuscles,
        workoutType,
        userProfile.fitnessLevel
      );

      // Créer la session
      const exercises = this.selectExercisesForDuration(
        availableExercises,
        duration,
        userProfile.fitnessLevel
      );

      const session: WorkoutSession = {
        id: this.generateSessionId(),
        planId: 'quick_workout',
        name: this.generateSessionName(workoutType, targetMuscles),
        description: `Entraînement rapide de ${duration} minutes`,
        type: workoutType || 'strength',
        estimatedDuration: duration,
        exercises,
        restBetweenSets: this.calculateRestTime(userProfile.fitnessLevel),
        targetMuscleGroups: targetMuscles || this.extractMuscleGroups(exercises),
      };

      return session;
    } catch (error) {
      console.error('Erreur lors de la génération de l\'entraînement rapide:', error);
      throw error;
    }
  }

  // Méthodes privées

  private async loadExerciseDatabase(): Promise<ExerciseDatabase> {
    try {
      // Dans une implémentation réelle, charger depuis Firebase
      // Ici, nous utilisons une base de données simulée
      return {
        strength: await this.getStrengthExercises(),
        cardio: await this.getCardioExercises(),
        flexibility: await this.getFlexibilityExercises(),
        hiit: await this.getHIITExercises(),
      };
    } catch (error) {
      console.error('Erreur lors du chargement de la base d\'exercices:', error);
      throw error;
    }
  }

  private analyzePlanStructure(userProfile: UserProfile): {
    sessionsPerWeek: number;
    sessionTypes: WorkoutType[];
    splitType: 'full_body' | 'upper_lower' | 'push_pull_legs' | 'body_part';
  } {
    const { fitnessLevel, workoutFrequency, goals } = userProfile;

    let sessionsPerWeek = workoutFrequency;
    let sessionTypes: WorkoutType[] = [];
    let splitType: 'full_body' | 'upper_lower' | 'push_pull_legs' | 'body_part' = 'full_body';

    // Déterminer le type de split en fonction du niveau et de la fréquence
    if (sessionsPerWeek <= 2) {
      splitType = 'full_body';
      sessionTypes = ['strength', 'cardio'];
    } else if (sessionsPerWeek <= 4) {
      splitType = 'upper_lower';
      sessionTypes = ['strength', 'strength', 'cardio', 'flexibility'];
    } else if (sessionsPerWeek <= 6) {
      splitType = 'push_pull_legs';
      sessionTypes = ['strength', 'strength', 'strength', 'cardio', 'hiit', 'flexibility'];
    } else {
      splitType = 'body_part';
      sessionTypes = ['strength', 'strength', 'strength', 'strength', 'cardio', 'hiit', 'flexibility'];
    }

    // Adapter selon les objectifs
    if (goals.includes('weight_loss')) {
      sessionTypes = sessionTypes.map(type => 
        type === 'strength' && Math.random() > 0.5 ? 'hiit' : type
      );
    }

    if (goals.includes('flexibility')) {
      sessionTypes.push('yoga');
    }

    return { sessionsPerWeek, sessionTypes: sessionTypes.slice(0, sessionsPerWeek), splitType };
  }

  private async generateSessions(
    userProfile: UserProfile,
    planStructure: {
      sessionsPerWeek: number;
      sessionTypes: WorkoutType[];
      splitType: string;
    },
    preferences: WorkoutGenerationParams['preferences'],
    latestScan?: BodyScan
  ): Promise<WorkoutSession[]> {
    const sessions: WorkoutSession[] = [];

    for (let i = 0; i < planStructure.sessionTypes.length; i++) {
      const sessionType = planStructure.sessionTypes[i];
      const targetMuscles = this.getTargetMusclesForSession(
        i,
        planStructure.splitType,
        preferences.focusAreas
      );

      const session = await this.generateSingleSession(
        userProfile,
        sessionType,
        targetMuscles,
        preferences,
        i + 1
      );

      sessions.push(session);
    }

    return sessions;
  }

  private async generateSingleSession(
    userProfile: UserProfile,
    sessionType: WorkoutType,
    targetMuscles: MuscleGroup[],
    preferences: WorkoutGenerationParams['preferences'],
    sessionNumber: number
  ): Promise<WorkoutSession> {
    // Filtrer les exercices disponibles
    const availableExercises = this.filterExercisesByConstraints(
      userProfile.availableEquipment,
      targetMuscles,
      sessionType,
      userProfile.fitnessLevel
    );

    // Sélectionner les exercices pour la session
    const exercises = this.selectExercisesForSession(
      availableExercises,
      sessionType,
      userProfile.fitnessLevel,
      preferences.preferredDuration || userProfile.sessionDuration
    );

    // Générer échauffement et récupération
    const warmup = this.generateWarmup(targetMuscles);
    const cooldown = this.generateCooldown(targetMuscles);

    return {
      id: this.generateSessionId(),
      planId: '', // Sera défini lors de la création du plan
      name: this.generateSessionName(sessionType, targetMuscles, sessionNumber),
      description: this.generateSessionDescription(sessionType, targetMuscles),
      type: sessionType,
      estimatedDuration: preferences.preferredDuration || userProfile.sessionDuration,
      exercises,
      restBetweenSets: this.calculateRestTime(userProfile.fitnessLevel),
      warmup,
      cooldown,
      targetMuscleGroups: targetMuscles,
    };
  }

  private filterExercisesByConstraints(
    equipment: Equipment[],
    targetMuscles?: MuscleGroup[],
    workoutType?: WorkoutType,
    fitnessLevel?: string
  ): Exercise[] {
    let exercises: Exercise[] = [];

    // Récupérer les exercices par type
    if (workoutType && this.exerciseDatabase[workoutType]) {
      exercises = [...this.exerciseDatabase[workoutType]];
    } else {
      // Combiner tous les exercices si pas de type spécifique
      exercises = Object.values(this.exerciseDatabase).flat();
    }

    // Filtrer par équipement disponible
    exercises = exercises.filter(exercise =>
      exercise.equipment.some(eq => equipment.includes(eq)) ||
      exercise.equipment.includes('none')
    );

    // Filtrer par groupes musculaires cibles
    if (targetMuscles && targetMuscles.length > 0) {
      exercises = exercises.filter(exercise =>
        exercise.muscleGroups.some(mg => targetMuscles.includes(mg))
      );
    }

    // Filtrer par niveau de difficulté
    if (fitnessLevel) {
      const allowedDifficulties = this.getAllowedDifficulties(fitnessLevel);
      exercises = exercises.filter(exercise =>
        allowedDifficulties.includes(exercise.difficulty)
      );
    }

    return exercises;
  }

  private selectExercisesForSession(
    availableExercises: Exercise[],
    sessionType: WorkoutType,
    fitnessLevel: string,
    duration: number
  ): Exercise[] {
    const selectedExercises: Exercise[] = [];
    const exerciseCount = this.calculateExerciseCount(sessionType, duration, fitnessLevel);

    // Grouper les exercices par groupe musculaire
    const exercisesByMuscle = this.groupExercisesByMuscle(availableExercises);

    // Sélectionner les exercices de manière équilibrée
    const muscleGroups = Object.keys(exercisesByMuscle);
    let currentMuscleIndex = 0;

    for (let i = 0; i < exerciseCount && selectedExercises.length < exerciseCount; i++) {
      const currentMuscle = muscleGroups[currentMuscleIndex % muscleGroups.length];
      const muscleExercises = exercisesByMuscle[currentMuscle];

      if (muscleExercises && muscleExercises.length > 0) {
        // Sélectionner un exercice aléatoire pour ce groupe musculaire
        const randomIndex = Math.floor(Math.random() * muscleExercises.length);
        const selectedExercise = muscleExercises[randomIndex];

        // Éviter les doublons
        if (!selectedExercises.find(ex => ex.id === selectedExercise.id)) {
          // Adapter l'exercice au niveau de l'utilisateur
          const adaptedExercise = this.adaptExerciseToLevel(selectedExercise, fitnessLevel);
          selectedExercises.push(adaptedExercise);
        }
      }

      currentMuscleIndex++;
    }

    return selectedExercises;
  }

  private adaptExerciseToLevel(exercise: Exercise, fitnessLevel: string): Exercise {
    const multiplier = WORKOUT_CONFIG.difficultyMultipliers[fitnessLevel as keyof typeof WORKOUT_CONFIG.difficultyMultipliers];

    return {
      ...exercise,
      sets: Math.round(exercise.sets * multiplier),
      reps: exercise.reps ? Math.round(exercise.reps * multiplier) : undefined,
      duration: exercise.duration ? Math.round(exercise.duration * multiplier) : undefined,
      restTime: Math.round(exercise.restTime * (2 - multiplier)), // Plus de repos pour débutants
    };
  }

  private adaptSession(
    session: WorkoutSession,
    progressData: {
      completedSessions: number;
      averageRating: number;
      strengthGains: { [exerciseId: string]: number };
    }
  ): WorkoutSession {
    const adaptedExercises = session.exercises.map(exercise => {
      const strengthGain = progressData.strengthGains[exercise.id] || 0;
      
      // Augmenter la difficulté si l'utilisateur progresse bien
      if (strengthGain > 0.1) { // 10% d'amélioration
        return {
          ...exercise,
          sets: Math.min(exercise.sets + 1, 5),
          reps: exercise.reps ? Math.min(exercise.reps + 2, 20) : undefined,
          weight: exercise.weight ? Math.round(exercise.weight * 1.05) : undefined,
        };
      }

      // Réduire la difficulté si l'utilisateur a des difficultés
      if (progressData.averageRating < 2.5) {
        return {
          ...exercise,
          sets: Math.max(exercise.sets - 1, 1),
          reps: exercise.reps ? Math.max(exercise.reps - 1, 5) : undefined,
          restTime: exercise.restTime + 15,
        };
      }

      return exercise;
    });

    return {
      ...session,
      exercises: adaptedExercises,
    };
  }

  // Méthodes utilitaires

  private generatePlanId(): string {
    return `plan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generatePlanName(goals: FitnessGoal[]): string {
    const goalNames = {
      weight_loss: 'Perte de poids',
      muscle_gain: 'Prise de masse',
      strength: 'Force',
      endurance: 'Endurance',
      flexibility: 'Souplesse',
      general_fitness: 'Forme générale',
      rehabilitation: 'Rééducation',
    };

    const primaryGoal = goals[0];
    return `Programme ${goalNames[primaryGoal] || 'Personnalisé'}`;
  }

  private generatePlanDescription(userProfile: UserProfile): string {
    const level = userProfile.fitnessLevel === 'beginner' ? 'débutant' :
                  userProfile.fitnessLevel === 'intermediate' ? 'intermédiaire' : 'avancé';
    
    return `Programme personnalisé niveau ${level} avec ${userProfile.workoutFrequency} séances par semaine de ${userProfile.sessionDuration} minutes.`;
  }

  private calculatePlanDuration(userProfile: UserProfile): number {
    // Durée en semaines basée sur les objectifs
    const baseDuration = 8; // 8 semaines par défaut
    
    if (userProfile.goals.includes('weight_loss')) return 12;
    if (userProfile.goals.includes('muscle_gain')) return 16;
    if (userProfile.goals.includes('strength')) return 12;
    
    return baseDuration;
  }

  private getTargetMusclesForSession(
    sessionIndex: number,
    splitType: string,
    focusAreas?: MuscleGroup[]
  ): MuscleGroup[] {
    const splits = {
      full_body: [
        ['chest', 'back', 'shoulders', 'quadriceps', 'hamstrings', 'abs'],
        ['chest', 'back', 'shoulders', 'quadriceps', 'hamstrings', 'abs'],
      ],
      upper_lower: [
        ['chest', 'back', 'shoulders', 'biceps', 'triceps'],
        ['quadriceps', 'hamstrings', 'glutes', 'calves', 'abs'],
        ['chest', 'back', 'shoulders', 'biceps', 'triceps'],
        ['quadriceps', 'hamstrings', 'glutes', 'calves', 'abs'],
      ],
      push_pull_legs: [
        ['chest', 'shoulders', 'triceps'],
        ['back', 'biceps'],
        ['quadriceps', 'hamstrings', 'glutes', 'calves'],
        ['chest', 'shoulders', 'triceps'],
        ['back', 'biceps'],
        ['quadriceps', 'hamstrings', 'glutes', 'calves'],
      ],
      body_part: [
        ['chest'],
        ['back'],
        ['shoulders'],
        ['quadriceps', 'hamstrings'],
        ['biceps', 'triceps'],
        ['abs'],
        ['full_body'],
      ],
    };

    const splitMuscles = splits[splitType as keyof typeof splits] || splits.full_body;
    const sessionMuscles = splitMuscles[sessionIndex % splitMuscles.length];

    // Ajouter les zones de focus si spécifiées
    if (focusAreas && focusAreas.length > 0) {
      return [...new Set([...sessionMuscles, ...focusAreas])] as MuscleGroup[];
    }

    return sessionMuscles as MuscleGroup[];
  }

  private generateSessionName(
    sessionType: WorkoutType,
    targetMuscles?: MuscleGroup[],
    sessionNumber?: number
  ): string {
    const typeNames = {
      strength: 'Musculation',
      cardio: 'Cardio',
      hiit: 'HIIT',
      yoga: 'Yoga',
      stretching: 'Étirements',
      pilates: 'Pilates',
      crosstraining: 'Cross Training',
      sports_specific: 'Sport Spécifique',
    };

    let name = typeNames[sessionType] || 'Entraînement';
    
    if (sessionNumber) {
      name = `Séance ${sessionNumber} - ${name}`;
    }

    if (targetMuscles && targetMuscles.length > 0) {
      const muscleNames = {
        chest: 'Pectoraux',
        back: 'Dos',
        shoulders: 'Épaules',
        biceps: 'Biceps',
        triceps: 'Triceps',
        quadriceps: 'Quadriceps',
        hamstrings: 'Ischio-jambiers',
        glutes: 'Fessiers',
        abs: 'Abdominaux',
        calves: 'Mollets',
      };

      const mainMuscle = targetMuscles[0];
      if (muscleNames[mainMuscle as keyof typeof muscleNames]) {
        name += ` - ${muscleNames[mainMuscle as keyof typeof muscleNames]}`;
      }
    }

    return name;
  }

  private generateSessionDescription(sessionType: WorkoutType, targetMuscles: MuscleGroup[]): string {
    const descriptions = {
      strength: 'Séance de musculation pour développer la force et la masse musculaire.',
      cardio: 'Entraînement cardiovasculaire pour améliorer l\'endurance.',
      hiit: 'Entraînement par intervalles haute intensité pour brûler les calories.',
      yoga: 'Séance de yoga pour la souplesse et la relaxation.',
      stretching: 'Étirements pour améliorer la flexibilité et récupérer.',
      pilates: 'Méthode Pilates pour renforcer le centre du corps.',
      crosstraining: 'Entraînement fonctionnel varié et complet.',
      sports_specific: 'Entraînement spécifique à votre sport.',
    };

    return descriptions[sessionType] || 'Séance d\'entraînement personnalisée.';
  }

  private calculateExerciseCount(sessionType: WorkoutType, duration: number, fitnessLevel: string): number {
    const baseCount = Math.floor(duration / 8); // ~8 minutes par exercice en moyenne
    
    const typeMultipliers = {
      strength: 1.0,
      cardio: 0.7,
      hiit: 0.8,
      yoga: 0.6,
      stretching: 0.5,
      pilates: 0.8,
      crosstraining: 1.2,
      sports_specific: 1.0,
    };

    const levelMultipliers = {
      beginner: 0.8,
      intermediate: 1.0,
      advanced: 1.2,
    };

    const count = Math.round(
      baseCount * 
      typeMultipliers[sessionType] * 
      levelMultipliers[fitnessLevel as keyof typeof levelMultipliers]
    );

    return Math.max(3, Math.min(count, 12)); // Entre 3 et 12 exercices
  }

  private calculateRestTime(fitnessLevel: string): number {
    const restTimes = {
      beginner: 90,
      intermediate: 60,
      advanced: 45,
    };

    return restTimes[fitnessLevel as keyof typeof restTimes] || 60;
  }

  private getAllowedDifficulties(fitnessLevel: string): string[] {
    const difficulties = {
      beginner: ['beginner'],
      intermediate: ['beginner', 'intermediate'],
      advanced: ['beginner', 'intermediate', 'advanced'],
    };

    return difficulties[fitnessLevel as keyof typeof difficulties] || ['beginner'];
  }

  private groupExercisesByMuscle(exercises: Exercise[]): { [key: string]: Exercise[] } {
    const grouped: { [key: string]: Exercise[] } = {};

    exercises.forEach(exercise => {
      exercise.muscleGroups.forEach(muscle => {
        if (!grouped[muscle]) {
          grouped[muscle] = [];
        }
        grouped[muscle].push(exercise);
      });
    });

    return grouped;
  }

  private extractMuscleGroups(exercises: Exercise[]): MuscleGroup[] {
    const muscles = new Set<MuscleGroup>();
    exercises.forEach(exercise => {
      exercise.muscleGroups.forEach(muscle => muscles.add(muscle));
    });
    return Array.from(muscles);
  }

  private selectExercisesForDuration(
    exercises: Exercise[],
    duration: number,
    fitnessLevel: string
  ): Exercise[] {
    const exerciseCount = this.calculateExerciseCount('strength', duration, fitnessLevel);
    const shuffled = [...exercises].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, exerciseCount);
  }

  private generateWarmup(targetMuscles: MuscleGroup[]): Exercise[] {
    // Exercices d'échauffement génériques
    const warmupExercises: Exercise[] = [
      {
        id: 'warmup_1',
        name: 'Marche sur place',
        description: 'Échauffement cardiovasculaire léger',
        instructions: ['Marchez sur place en levant les genoux'],
        muscleGroups: ['full_body'],
        equipment: ['none'],
        difficulty: 'beginner',
        sets: 1,
        duration: 120,
        restTime: 0,
        tips: ['Gardez un rythme modéré'],
        variations: [],
        safetyNotes: [],
      },
      {
        id: 'warmup_2',
        name: 'Rotations des bras',
        description: 'Échauffement des épaules',
        instructions: ['Effectuez des rotations lentes des bras'],
        muscleGroups: ['shoulders'],
        equipment: ['none'],
        difficulty: 'beginner',
        sets: 1,
        reps: 10,
        restTime: 0,
        tips: ['Mouvements lents et contrôlés'],
        variations: [],
        safetyNotes: [],
      },
    ];

    return warmupExercises;
  }

  private generateCooldown(targetMuscles: MuscleGroup[]): Exercise[] {
    // Exercices de récupération génériques
    const cooldownExercises: Exercise[] = [
      {
        id: 'cooldown_1',
        name: 'Étirement des quadriceps',
        description: 'Étirement pour les cuisses',
        instructions: ['Tenez votre cheville derrière vous'],
        muscleGroups: ['quadriceps'],
        equipment: ['none'],
        difficulty: 'beginner',
        sets: 1,
        duration: 30,
        restTime: 0,
        tips: ['Maintenez l\'étirement sans forcer'],
        variations: [],
        safetyNotes: [],
      },
    ];

    return cooldownExercises;
  }

  // Base de données d'exercices simulée
  private async getStrengthExercises(): Promise<Exercise[]> {
    return [
      {
        id: 'push_up',
        name: 'Pompes',
        description: 'Exercice de base pour les pectoraux',
        instructions: [
          'Placez-vous en position de planche',
          'Descendez jusqu\'à ce que votre poitrine touche le sol',
          'Remontez en poussant avec les bras'
        ],
        muscleGroups: ['chest', 'triceps', 'shoulders'],
        equipment: ['none'],
        difficulty: 'beginner',
        sets: 3,
        reps: 12,
        restTime: 60,
        videoUrl: 'https://example.com/push-up-video',
        tips: ['Gardez le corps aligné', 'Respirez régulièrement'],
        variations: [
          {
            name: 'Pompes sur les genoux',
            description: 'Version plus facile',
            difficulty: 'easier',
            modifications: ['Appuyez-vous sur les genoux']
          }
        ],
        safetyNotes: ['Évitez si vous avez des douleurs aux poignets']
      },
      {
        id: 'squat',
        name: 'Squats',
        description: 'Exercice fondamental pour les jambes',
        instructions: [
          'Pieds écartés largeur d\'épaules',
          'Descendez comme si vous vous assiez',
          'Remontez en poussant sur les talons'
        ],
        muscleGroups: ['quadriceps', 'glutes', 'hamstrings'],
        equipment: ['none'],
        difficulty: 'beginner',
        sets: 3,
        reps: 15,
        restTime: 60,
        tips: ['Gardez le dos droit', 'Genoux dans l\'axe des pieds'],
        variations: [],
        safetyNotes: []
      },
      // Ajouter plus d'exercices...
    ];
  }

  private async getCardioExercises(): Promise<Exercise[]> {
    return [
      {
        id: 'jumping_jacks',
        name: 'Jumping Jacks',
        description: 'Exercice cardio complet',
        instructions: [
          'Sautez en écartant pieds et bras',
          'Revenez à la position initiale',
          'Répétez le mouvement'
        ],
        muscleGroups: ['full_body'],
        equipment: ['none'],
        difficulty: 'beginner',
        sets: 3,
        duration: 60,
        restTime: 30,
        tips: ['Gardez un rythme soutenu'],
        variations: [],
        safetyNotes: []
      }
    ];
  }

  private async getFlexibilityExercises(): Promise<Exercise[]> {
    return [
      {
        id: 'forward_fold',
        name: 'Flexion avant',
        description: 'Étirement des ischio-jambiers',
        instructions: [
          'Debout, penchez-vous vers l\'avant',
          'Laissez les bras pendre',
          'Maintenez la position'
        ],
        muscleGroups: ['hamstrings', 'back'],
        equipment: ['none'],
        difficulty: 'beginner',
        sets: 1,
        duration: 30,
        restTime: 0,
        tips: ['Ne forcez pas l\'étirement'],
        variations: [],
        safetyNotes: []
      }
    ];
  }

  private async getHIITExercises(): Promise<Exercise[]> {
    return [
      {
        id: 'burpees',
        name: 'Burpees',
        description: 'Exercice HIIT complet',
        instructions: [
          'Accroupissez-vous et placez les mains au sol',
          'Sautez en arrière en position planche',
          'Revenez en position accroupie',
          'Sautez vers le haut'
        ],
        muscleGroups: ['full_body'],
        equipment: ['none'],
        difficulty: 'intermediate',
        sets: 4,
        reps: 8,
        restTime: 45,
        tips: ['Mouvement explosif', 'Récupération complète entre séries'],
        variations: [],
        safetyNotes: []
      }
    ];
  }
}

export default WorkoutGeneratorService.getInstance();