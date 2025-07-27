import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import PushNotification from 'react-native-push-notification';
import { Platform, PermissionsAndroid, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { NOTIFICATION_CONFIG } from '@/utils/constants';
import { AnalyticsService } from '../analytics/AnalyticsService';

interface NotificationData {
  id?: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  scheduled?: boolean;
  scheduleDate?: Date;
  repeatType?: 'daily' | 'weekly';
  channelId?: string;
  priority?: 'high' | 'normal' | 'low';
  sound?: string;
  vibrate?: boolean;
}

interface NotificationSettings {
  workoutReminders: boolean;
  achievements: boolean;
  challenges: boolean;
  social: boolean;
  marketing: boolean;
  pushTime: string; // HH:MM format
}

class NotificationService {
  private static instance: NotificationService;
  private isInitialized = false;
  private fcmToken: string | null = null;
  private notificationSettings: NotificationSettings = NOTIFICATION_CONFIG.defaultSettings;

  private constructor() {}

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Initialise le service de notifications
   */
  public async initialize(): Promise<void> {
    try {
      if (this.isInitialized) return;

      // Configurer les canaux de notification (Android)
      await this.createNotificationChannels();

      // Demander les permissions
      await this.requestPermissions();

      // Obtenir le token FCM
      this.fcmToken = await messaging().getToken();
      console.log('FCM Token:', this.fcmToken);

      // Configurer les listeners
      this.setupMessageListeners();

      // Charger les paramètres utilisateur
      await this.loadUserSettings();

      this.isInitialized = true;
      console.log('NotificationService initialisé avec succès');
    } catch (error) {
      console.error('Erreur initialisation NotificationService:', error);
      throw error;
    }
  }

  /**
   * Demander les permissions de notification
   */
  public async requestPermissions(): Promise<boolean> {
    try {
      if (Platform.OS === 'ios') {
        const authStatus = await messaging().requestPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        if (!enabled) {
          Alert.alert(
            'Notifications désactivées',
            'Activez les notifications dans les paramètres pour recevoir des rappels d\'entraînement.'
          );
        }

        return enabled;
      } else {
        // Android
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      }
    } catch (error) {
      console.error('Erreur demande permissions:', error);
      return false;
    }
  }

  /**
   * Créer les canaux de notification (Android)
   */
  private async createNotificationChannels(): Promise<void> {
    if (Platform.OS !== 'android') return;

    try {
      // Canal pour les rappels d'entraînement
      PushNotification.createChannel(
        {
          channelId: 'workout_reminders',
          channelName: 'Rappels d\'entraînement',
          channelDescription: 'Notifications pour vos séances d\'entraînement',
          importance: 4, // HIGH
          vibrate: true,
          playSound: true,
          soundName: 'default',
        },
        (created) => console.log(`Canal workout_reminders créé: ${created}`)
      );

      // Canal pour les achievements
      PushNotification.createChannel(
        {
          channelId: 'achievements',
          channelName: 'Succès et récompenses',
          channelDescription: 'Notifications pour vos succès et nouveaux niveaux',
          importance: 3, // DEFAULT
          vibrate: true,
          playSound: true,
          soundName: 'achievement_sound',
        },
        (created) => console.log(`Canal achievements créé: ${created}`)
      );

      // Canal pour les défis
      PushNotification.createChannel(
        {
          channelId: 'challenges',
          channelName: 'Défis',
          channelDescription: 'Notifications pour les défis et compétitions',
          importance: 3,
          vibrate: true,
          playSound: true,
        },
        (created) => console.log(`Canal challenges créé: ${created}`)
      );

      // Canal pour les interactions sociales
      PushNotification.createChannel(
        {
          channelId: 'social',
          channelName: 'Social',
          channelDescription: 'Likes, commentaires et nouveaux followers',
          importance: 2, // LOW
          vibrate: false,
          playSound: false,
        },
        (created) => console.log(`Canal social créé: ${created}`)
      );

      // Canal pour le marketing
      PushNotification.createChannel(
        {
          channelId: 'marketing',
          channelName: 'Promotions',
          channelDescription: 'Offres spéciales et nouveautés',
          importance: 2,
          vibrate: false,
          playSound: false,
        },
        (created) => console.log(`Canal marketing créé: ${created}`)
      );
    } catch (error) {
      console.error('Erreur création canaux:', error);
    }
  }

  /**
   * Configurer les listeners de messages
   */
  private setupMessageListeners(): void {
    try {
      // Message reçu en foreground
      messaging().onMessage(async (remoteMessage) => {
        console.log('Message reçu en foreground:', remoteMessage);
        await this.handleForegroundMessage(remoteMessage);
      });

      // Message reçu en background/quit state
      messaging().onNotificationOpenedApp((remoteMessage) => {
        console.log('App ouverte via notification:', remoteMessage);
        this.handleNotificationPress(remoteMessage);
      });

      // Vérifier si l'app a été ouverte via une notification
      messaging()
        .getInitialNotification()
        .then((remoteMessage) => {
          if (remoteMessage) {
            console.log('App ouverte via notification initiale:', remoteMessage);
            this.handleNotificationPress(remoteMessage);
          }
        });

      // Token refresh
      messaging().onTokenRefresh((token) => {
        console.log('FCM Token refreshed:', token);
        this.fcmToken = token;
        // TODO: Envoyer le nouveau token au serveur
      });
    } catch (error) {
      console.error('Erreur configuration listeners:', error);
    }
  }

  /**
   * Gérer les messages reçus en foreground
   */
  private async handleForegroundMessage(
    remoteMessage: FirebaseMessagingTypes.RemoteMessage
  ): Promise<void> {
    try {
      const { notification, data } = remoteMessage;
      
      if (!notification) return;

      // Afficher une notification locale
      await this.showLocalNotification({
        title: notification.title || 'FitScan3D',
        body: notification.body || '',
        data: data || {},
        channelId: this.getChannelIdFromType(data?.type),
      });

      // Analytics
      await AnalyticsService.trackEvent('notification_received_foreground', {
        type: data?.type || 'unknown',
        title: notification.title,
      });
    } catch (error) {
      console.error('Erreur gestion message foreground:', error);
    }
  }

  /**
   * Gérer l'appui sur une notification
   */
  private handleNotificationPress(
    remoteMessage: FirebaseMessagingTypes.RemoteMessage
  ): void {
    try {
      const { data } = remoteMessage;
      
      // Analytics
      AnalyticsService.trackEvent('notification_pressed', {
        type: data?.type || 'unknown',
        action: data?.action || 'open_app',
      });

      // Navigation basée sur le type de notification
      this.handleNotificationNavigation(data);
    } catch (error) {
      console.error('Erreur gestion appui notification:', error);
    }
  }

  /**
   * Gérer la navigation basée sur la notification
   */
  private handleNotificationNavigation(data?: Record<string, any>): void {
    if (!data) return;

    switch (data.type) {
      case NOTIFICATION_CONFIG.types.workoutReminder:
        // Naviguer vers les entraînements
        // NavigationService.navigate('Workouts');
        break;
      
      case NOTIFICATION_CONFIG.types.achievementUnlocked:
        // Naviguer vers les statistiques
        // NavigationService.navigate('Stats');
        break;
      
      case NOTIFICATION_CONFIG.types.challengeUpdate:
        // Naviguer vers les défis
        // NavigationService.navigate('Challenges');
        break;
      
      case NOTIFICATION_CONFIG.types.socialUpdate:
        // Naviguer vers le social
        // NavigationService.navigate('Social');
        break;
      
      case NOTIFICATION_CONFIG.types.scanReady:
        // Naviguer vers les résultats de scan
        if (data.scanId) {
          // NavigationService.navigate('ScanResults', { scanId: data.scanId });
        }
        break;
      
      default:
        // Naviguer vers le dashboard par défaut
        // NavigationService.navigate('Dashboard');
    }
  }

  /**
   * Afficher une notification locale
   */
  public async showLocalNotification(notification: NotificationData): Promise<void> {
    try {
      const notificationId = notification.id || Date.now().toString();
      
      if (notification.scheduled && notification.scheduleDate) {
        // Notification programmée
        PushNotification.localNotificationSchedule({
          id: notificationId,
          title: notification.title,
          message: notification.body,
          date: notification.scheduleDate,
          repeatType: notification.repeatType,
          channelId: notification.channelId || 'default',
          priority: notification.priority || 'normal',
          playSound: true,
          soundName: notification.sound || 'default',
          vibrate: notification.vibrate !== false,
          userInfo: notification.data || {},
        });
      } else {
        // Notification immédiate
        PushNotification.localNotification({
          id: notificationId,
          title: notification.title,
          message: notification.body,
          channelId: notification.channelId || 'default',
          priority: notification.priority || 'normal',
          playSound: true,
          soundName: notification.sound || 'default',
          vibrate: notification.vibrate !== false,
          userInfo: notification.data || {},
        });
      }

      console.log(`Notification locale affichée: ${notification.title}`);
    } catch (error) {
      console.error('Erreur affichage notification locale:', error);
    }
  }

  /**
   * Programmer un rappel d'entraînement
   */
  public async scheduleWorkoutReminder(
    workoutName: string,
    scheduleDate: Date,
    workoutId?: string
  ): Promise<void> {
    try {
      if (!this.notificationSettings.workoutReminders) {
        console.log('Rappels d\'entraînement désactivés');
        return;
      }

      await this.showLocalNotification({
        id: `workout_${workoutId || Date.now()}`,
        title: '🏋️ C\'est l\'heure de s\'entraîner !',
        body: `Votre séance "${workoutName}" vous attend`,
        scheduled: true,
        scheduleDate,
        channelId: 'workout_reminders',
        priority: 'high',
        data: {
          type: NOTIFICATION_CONFIG.types.workoutReminder,
          workoutId,
          action: 'start_workout',
        },
      });

      // Analytics
      await AnalyticsService.trackEvent('workout_reminder_scheduled', {
        workoutId,
        workoutName,
        scheduledFor: scheduleDate.toISOString(),
      });
    } catch (error) {
      console.error('Erreur programmation rappel entraînement:', error);
    }
  }

  /**
   * Notifier un nouvel achievement
   */
  public async notifyAchievement(
    achievementName: string,
    achievementDescription: string,
    points: number,
    achievementId?: string
  ): Promise<void> {
    try {
      if (!this.notificationSettings.achievements) return;

      await this.showLocalNotification({
        title: '🏆 Nouveau succès débloqué !',
        body: `${achievementName}: ${achievementDescription} (+${points} points)`,
        channelId: 'achievements',
        priority: 'high',
        sound: 'achievement_sound',
        data: {
          type: NOTIFICATION_CONFIG.types.achievementUnlocked,
          achievementId,
          points,
        },
      });

      // Analytics
      await AnalyticsService.trackEvent('achievement_notification_sent', {
        achievementId,
        achievementName,
        points,
      });
    } catch (error) {
      console.error('Erreur notification achievement:', error);
    }
  }

  /**
   * Notifier la fin d'un scan 3D
   */
  public async notifyScanReady(scanId: string): Promise<void> {
    try {
      await this.showLocalNotification({
        title: '📊 Votre scan 3D est prêt !',
        body: 'Découvrez votre analyse de composition corporelle',
        channelId: 'achievements',
        priority: 'high',
        data: {
          type: NOTIFICATION_CONFIG.types.scanReady,
          scanId,
          action: 'view_scan_results',
        },
      });

      // Analytics
      await AnalyticsService.trackEvent('scan_ready_notification_sent', {
        scanId,
      });
    } catch (error) {
      console.error('Erreur notification scan prêt:', error);
    }
  }

  /**
   * Programmer des rappels d'entraînement récurrents
   */
  public async scheduleRecurringWorkoutReminders(
    workoutDays: number[], // 0=dimanche, 1=lundi, etc.
    time: string // HH:MM format
  ): Promise<void> {
    try {
      if (!this.notificationSettings.workoutReminders) return;

      // Annuler les anciens rappels
      await this.cancelWorkoutReminders();

      const [hours, minutes] = time.split(':').map(Number);

      workoutDays.forEach((dayOfWeek) => {
        const nextDate = this.getNextDateForDay(dayOfWeek, hours, minutes);
        
        this.showLocalNotification({
          id: `recurring_workout_${dayOfWeek}`,
          title: '💪 Séance d\'entraînement programmée',
          body: 'Il est temps de vous entraîner !',
          scheduled: true,
          scheduleDate: nextDate,
          repeatType: 'weekly',
          channelId: 'workout_reminders',
          priority: 'high',
          data: {
            type: NOTIFICATION_CONFIG.types.workoutReminder,
            recurring: true,
            dayOfWeek,
          },
        });
      });

      // Sauvegarder les paramètres
      await AsyncStorage.setItem('workout_reminder_schedule', JSON.stringify({
        days: workoutDays,
        time,
      }));

      console.log('Rappels récurrents programmés');
    } catch (error) {
      console.error('Erreur programmation rappels récurrents:', error);
    }
  }

  /**
   * Annuler les rappels d'entraînement
   */
  public async cancelWorkoutReminders(): Promise<void> {
    try {
      // Annuler les rappels récurrents
      for (let i = 0; i < 7; i++) {
        PushNotification.cancelLocalNotifications({
          id: `recurring_workout_${i}`,
        });
      }

      console.log('Rappels d\'entraînement annulés');
    } catch (error) {
      console.error('Erreur annulation rappels:', error);
    }
  }

  /**
   * Mettre à jour les paramètres de notification
   */
  public async updateNotificationSettings(
    settings: Partial<NotificationSettings>
  ): Promise<void> {
    try {
      this.notificationSettings = {
        ...this.notificationSettings,
        ...settings,
      };

      // Sauvegarder les paramètres
      await AsyncStorage.setItem(
        'notification_settings',
        JSON.stringify(this.notificationSettings)
      );

      // Reprogrammer les rappels si nécessaire
      if (settings.workoutReminders !== undefined || settings.pushTime) {
        const schedule = await AsyncStorage.getItem('workout_reminder_schedule');
        if (schedule) {
          const { days, time } = JSON.parse(schedule);
          await this.scheduleRecurringWorkoutReminders(
            days,
            settings.pushTime || time
          );
        }
      }

      console.log('Paramètres de notification mis à jour');
    } catch (error) {
      console.error('Erreur mise à jour paramètres:', error);
    }
  }

  /**
   * Obtenir les paramètres de notification actuels
   */
  public getNotificationSettings(): NotificationSettings {
    return { ...this.notificationSettings };
  }

  /**
   * Obtenir le token FCM
   */
  public getFCMToken(): string | null {
    return this.fcmToken;
  }

  /**
   * Gérer l'activation de l'app
   */
  public async handleAppBecomeActive(): Promise<void> {
    try {
      // Vérifier les notifications en attente
      PushNotification.getScheduledLocalNotifications((notifications) => {
        console.log('Notifications programmées:', notifications.length);
      });

      // Marquer les notifications comme lues si nécessaire
      PushNotification.setApplicationIconBadgeNumber(0);
    } catch (error) {
      console.error('Erreur gestion activation app:', error);
    }
  }

  // Méthodes utilitaires privées

  private async loadUserSettings(): Promise<void> {
    try {
      const savedSettings = await AsyncStorage.getItem('notification_settings');
      if (savedSettings) {
        this.notificationSettings = {
          ...this.notificationSettings,
          ...JSON.parse(savedSettings),
        };
      }
    } catch (error) {
      console.error('Erreur chargement paramètres:', error);
    }
  }

  private getChannelIdFromType(type?: string): string {
    switch (type) {
      case NOTIFICATION_CONFIG.types.workoutReminder:
        return 'workout_reminders';
      case NOTIFICATION_CONFIG.types.achievementUnlocked:
        return 'achievements';
      case NOTIFICATION_CONFIG.types.challengeUpdate:
        return 'challenges';
      case NOTIFICATION_CONFIG.types.socialUpdate:
        return 'social';
      case NOTIFICATION_CONFIG.types.scanReady:
        return 'achievements';
      default:
        return 'default';
    }
  }

  private getNextDateForDay(dayOfWeek: number, hours: number, minutes: number): Date {
    const now = new Date();
    const targetDate = new Date();
    
    targetDate.setHours(hours, minutes, 0, 0);
    
    // Calculer les jours jusqu'au prochain jour cible
    const daysUntilTarget = (dayOfWeek + 7 - now.getDay()) % 7;
    
    if (daysUntilTarget === 0 && now > targetDate) {
      // Si c'est aujourd'hui mais l'heure est passée, programmer pour la semaine prochaine
      targetDate.setDate(targetDate.getDate() + 7);
    } else {
      targetDate.setDate(targetDate.getDate() + daysUntilTarget);
    }
    
    return targetDate;
  }
}

export default NotificationService.getInstance();