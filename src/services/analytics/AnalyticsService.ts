import analytics from '@react-native-firebase/analytics';
import crashlytics from '@react-native-firebase/crashlytics';
import { ANALYTICS_EVENTS } from '@/utils/constants';

interface EventProperties {
  [key: string]: string | number | boolean | undefined;
}

interface UserProperties {
  userId?: string;
  isPremium?: boolean;
  fitnessLevel?: string;
  age?: number;
  gender?: string;
  goals?: string[];
}

class AnalyticsService {
  private static instance: AnalyticsService;
  private isInitialized = false;
  private userId: string | null = null;

  private constructor() {}

  public static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  /**
   * Initialise le service d'analytics
   */
  public async initialize(): Promise<void> {
    try {
      if (this.isInitialized) return;

      // Activer la collecte d'analytics
      await analytics().setAnalyticsCollectionEnabled(true);
      
      // Activer Crashlytics
      await crashlytics().setCrashlyticsCollectionEnabled(true);

      this.isInitialized = true;
      console.log('AnalyticsService initialisé avec succès');
    } catch (error) {
      console.error('Erreur initialisation AnalyticsService:', error);
      throw error;
    }
  }

  /**
   * Définir l'ID utilisateur
   */
  public async setUserId(userId: string): Promise<void> {
    try {
      this.userId = userId;
      await analytics().setUserId(userId);
      await crashlytics().setUserId(userId);
    } catch (error) {
      console.error('Erreur définition userId:', error);
    }
  }

  /**
   * Définir les propriétés utilisateur
   */
  public async setUserProperties(properties: UserProperties): Promise<void> {
    try {
      // Firebase Analytics user properties
      if (properties.isPremium !== undefined) {
        await analytics().setUserProperty('is_premium', properties.isPremium.toString());
      }
      
      if (properties.fitnessLevel) {
        await analytics().setUserProperty('fitness_level', properties.fitnessLevel);
      }
      
      if (properties.age !== undefined) {
        await analytics().setUserProperty('age_group', this.getAgeGroup(properties.age));
      }
      
      if (properties.gender) {
        await analytics().setUserProperty('gender', properties.gender);
      }
      
      if (properties.goals && properties.goals.length > 0) {
        await analytics().setUserProperty('primary_goal', properties.goals[0]);
      }

      // Crashlytics user attributes
      await crashlytics().setAttributes({
        userId: this.userId || 'anonymous',
        isPremium: properties.isPremium?.toString() || 'false',
        fitnessLevel: properties.fitnessLevel || 'unknown',
      });
    } catch (error) {
      console.error('Erreur définition propriétés utilisateur:', error);
    }
  }

  /**
   * Tracker un événement
   */
  public async trackEvent(
    eventName: string,
    properties?: EventProperties
  ): Promise<void> {
    try {
      if (!this.isInitialized) {
        console.warn('AnalyticsService non initialisé');
        return;
      }

      // Filtrer les propriétés undefined
      const filteredProperties = properties ? 
        Object.fromEntries(
          Object.entries(properties).filter(([_, value]) => value !== undefined)
        ) : {};

      await analytics().logEvent(eventName, filteredProperties);
      
      console.log(`📊 Event tracked: ${eventName}`, filteredProperties);
    } catch (error) {
      console.error('Erreur tracking événement:', error);
    }
  }

  /**
   * Tracker une vue d'écran
   */
  public async trackScreenView(screenName: string): Promise<void> {
    try {
      await analytics().logScreenView({
        screen_name: screenName,
        screen_class: screenName,
      });
      
      console.log(`📱 Screen viewed: ${screenName}`);
    } catch (error) {
      console.error('Erreur tracking vue écran:', error);
    }
  }

  /**
   * Tracker les événements d'authentification
   */
  public async trackAuth(action: 'login' | 'register' | 'logout', method?: string): Promise<void> {
    try {
      const eventName = action === 'login' ? ANALYTICS_EVENTS.login :
                       action === 'register' ? ANALYTICS_EVENTS.register :
                       ANALYTICS_EVENTS.logout;

      const properties: EventProperties = {};
      if (method) {
        properties.method = method;
      }

      await this.trackEvent(eventName, properties);
    } catch (error) {
      console.error('Erreur tracking auth:', error);
    }
  }

  /**
   * Tracker les événements d'onboarding
   */
  public async trackOnboarding(
    action: 'started' | 'completed' | 'abandoned',
    step?: string
  ): Promise<void> {
    try {
      const eventName = action === 'started' ? ANALYTICS_EVENTS.onboardingStarted :
                       action === 'completed' ? ANALYTICS_EVENTS.onboardingCompleted :
                       ANALYTICS_EVENTS.onboardingAbandoned;

      const properties: EventProperties = {};
      if (step) {
        properties.step = step;
      }

      await this.trackEvent(eventName, properties);
    } catch (error) {
      console.error('Erreur tracking onboarding:', error);
    }
  }

  /**
   * Tracker les événements de scan 3D
   */
  public async trackScan(
    action: 'started' | 'completed' | 'failed' | 'viewed',
    properties?: {
      scanId?: string;
      confidence?: number;
      processingTime?: number;
      errorReason?: string;
    }
  ): Promise<void> {
    try {
      const eventName = action === 'started' ? ANALYTICS_EVENTS.scanStarted :
                       action === 'completed' ? ANALYTICS_EVENTS.scanCompleted :
                       action === 'failed' ? ANALYTICS_EVENTS.scanFailed :
                       ANALYTICS_EVENTS.scanViewed;

      await this.trackEvent(eventName, properties);
    } catch (error) {
      console.error('Erreur tracking scan:', error);
    }
  }

  /**
   * Tracker les événements d'entraînement
   */
  public async trackWorkout(
    action: 'started' | 'completed' | 'abandoned',
    properties?: {
      workoutId?: string;
      sessionId?: string;
      workoutType?: string;
      duration?: number;
      exerciseCount?: number;
      caloriesBurned?: number;
    }
  ): Promise<void> {
    try {
      const eventName = action === 'started' ? ANALYTICS_EVENTS.workoutStarted :
                       action === 'completed' ? ANALYTICS_EVENTS.workoutCompleted :
                       ANALYTICS_EVENTS.workoutAbandoned;

      await this.trackEvent(eventName, properties);
    } catch (error) {
      console.error('Erreur tracking workout:', error);
    }
  }

  /**
   * Tracker la complétion d'un exercice
   */
  public async trackExerciseCompleted(
    exerciseId: string,
    properties?: {
      exerciseName?: string;
      sets?: number;
      reps?: number;
      weight?: number;
      duration?: number;
    }
  ): Promise<void> {
    try {
      await this.trackEvent(ANALYTICS_EVENTS.exerciseCompleted, {
        exerciseId,
        ...properties,
      });
    } catch (error) {
      console.error('Erreur tracking exercice:', error);
    }
  }

  /**
   * Tracker les événements sociaux
   */
  public async trackSocial(
    action: 'post_created' | 'post_liked' | 'comment_added' | 'user_followed',
    properties?: {
      postId?: string;
      targetUserId?: string;
      contentType?: string;
    }
  ): Promise<void> {
    try {
      const eventName = action === 'post_created' ? ANALYTICS_EVENTS.postCreated :
                       action === 'post_liked' ? ANALYTICS_EVENTS.postLiked :
                       action === 'comment_added' ? ANALYTICS_EVENTS.commentAdded :
                       ANALYTICS_EVENTS.userFollowed;

      await this.trackEvent(eventName, properties);
    } catch (error) {
      console.error('Erreur tracking social:', error);
    }
  }

  /**
   * Tracker les événements de gamification
   */
  public async trackGamification(
    action: 'achievement_unlocked' | 'level_up' | 'challenge_joined' | 'challenge_completed',
    properties?: {
      achievementId?: string;
      challengeId?: string;
      level?: number;
      points?: number;
    }
  ): Promise<void> {
    try {
      const eventName = action === 'achievement_unlocked' ? ANALYTICS_EVENTS.achievementUnlocked :
                       action === 'level_up' ? ANALYTICS_EVENTS.levelUp :
                       action === 'challenge_joined' ? ANALYTICS_EVENTS.challengeJoined :
                       ANALYTICS_EVENTS.challengeCompleted;

      await this.trackEvent(eventName, properties);
    } catch (error) {
      console.error('Erreur tracking gamification:', error);
    }
  }

  /**
   * Tracker les événements de monétisation
   */
  public async trackMonetization(
    action: 'premium_viewed' | 'premium_purchased' | 'ad_viewed' | 'ad_clicked',
    properties?: {
      productId?: string;
      price?: number;
      currency?: string;
      adType?: string;
      adPlacement?: string;
    }
  ): Promise<void> {
    try {
      const eventName = action === 'premium_viewed' ? ANALYTICS_EVENTS.premiumViewed :
                       action === 'premium_purchased' ? ANALYTICS_EVENTS.premiumPurchased :
                       action === 'ad_viewed' ? ANALYTICS_EVENTS.adViewed :
                       ANALYTICS_EVENTS.adClicked;

      await this.trackEvent(eventName, properties);

      // Événement spécial pour les achats
      if (action === 'premium_purchased' && properties?.price && properties?.currency) {
        await analytics().logPurchase({
          currency: properties.currency,
          value: properties.price,
          items: [{
            item_id: properties.productId || 'premium_subscription',
            item_name: 'Premium Subscription',
            item_category: 'subscription',
            quantity: 1,
            price: properties.price,
          }],
        });
      }
    } catch (error) {
      console.error('Erreur tracking monétisation:', error);
    }
  }

  /**
   * Tracker les erreurs personnalisées
   */
  public async trackError(
    error: Error,
    context?: string,
    additionalData?: Record<string, any>
  ): Promise<void> {
    try {
      // Envoyer à Crashlytics
      if (context) {
        await crashlytics().log(context);
      }
      
      if (additionalData) {
        await crashlytics().setAttributes(additionalData);
      }
      
      await crashlytics().recordError(error);

      // Tracker comme événement aussi
      await this.trackEvent('error_occurred', {
        error_message: error.message,
        error_stack: error.stack?.substring(0, 500), // Limiter la taille
        context,
        ...additionalData,
      });
    } catch (err) {
      console.error('Erreur tracking error:', err);
    }
  }

  /**
   * Tracker les performances
   */
  public async trackPerformance(
    metricName: string,
    value: number,
    attributes?: Record<string, string>
  ): Promise<void> {
    try {
      await this.trackEvent('performance_metric', {
        metric_name: metricName,
        metric_value: value,
        ...attributes,
      });
    } catch (error) {
      console.error('Erreur tracking performance:', error);
    }
  }

  /**
   * Définir un attribut global
   */
  public async setGlobalAttribute(key: string, value: string): Promise<void> {
    try {
      await crashlytics().setAttribute(key, value);
    } catch (error) {
      console.error('Erreur définition attribut global:', error);
    }
  }

  /**
   * Nettoyer les données utilisateur (RGPD)
   */
  public async clearUserData(): Promise<void> {
    try {
      this.userId = null;
      await analytics().resetAnalyticsData();
      await crashlytics().setUserId('');
      console.log('Données analytics nettoyées');
    } catch (error) {
      console.error('Erreur nettoyage données:', error);
    }
  }

  // Méthodes utilitaires privées

  private getAgeGroup(age: number): string {
    if (age < 18) return 'under_18';
    if (age < 25) return '18_24';
    if (age < 35) return '25_34';
    if (age < 45) return '35_44';
    if (age < 55) return '45_54';
    if (age < 65) return '55_64';
    return '65_plus';
  }

  /**
   * Créer un timer de performance
   */
  public createPerformanceTimer(name: string) {
    const startTime = Date.now();
    
    return {
      end: async (attributes?: Record<string, string>) => {
        const duration = Date.now() - startTime;
        await this.trackPerformance(name, duration, attributes);
        return duration;
      }
    };
  }

  /**
   * Tracker l'utilisation d'une fonctionnalité
   */
  public async trackFeatureUsage(
    featureName: string,
    action: 'used' | 'completed' | 'abandoned',
    properties?: EventProperties
  ): Promise<void> {
    try {
      await this.trackEvent('feature_usage', {
        feature_name: featureName,
        action,
        ...properties,
      });
    } catch (error) {
      console.error('Erreur tracking feature usage:', error);
    }
  }

  /**
   * Tracker la rétention utilisateur
   */
  public async trackRetention(
    daysSinceInstall: number,
    daysSinceLastUse: number
  ): Promise<void> {
    try {
      await this.trackEvent('user_retention', {
        days_since_install: daysSinceInstall,
        days_since_last_use: daysSinceLastUse,
        retention_bucket: this.getRetentionBucket(daysSinceInstall),
      });
    } catch (error) {
      console.error('Erreur tracking rétention:', error);
    }
  }

  private getRetentionBucket(days: number): string {
    if (days === 1) return 'day_1';
    if (days === 7) return 'day_7';
    if (days === 30) return 'day_30';
    if (days <= 7) return 'week_1';
    if (days <= 30) return 'month_1';
    if (days <= 90) return 'month_3';
    return 'long_term';
  }
}

export default AnalyticsService.getInstance();