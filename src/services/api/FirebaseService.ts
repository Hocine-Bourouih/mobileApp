import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import analytics from '@react-native-firebase/analytics';
import messaging from '@react-native-firebase/messaging';

import {
  User,
  UserProfile,
  BodyScan,
  WorkoutPlan,
  WorkoutLog,
  Achievement,
  SocialPost,
  Challenge,
  ApiResponse,
} from '@/types';
import { FIREBASE_CONFIG } from '@/utils/constants';

class FirebaseService {
  private static instance: FirebaseService;
  private isInitialized = false;

  private constructor() {}

  public static getInstance(): FirebaseService {
    if (!FirebaseService.instance) {
      FirebaseService.instance = new FirebaseService();
    }
    return FirebaseService.instance;
  }

  /**
   * Initialise Firebase
   */
  public async initialize(): Promise<void> {
    try {
      if (this.isInitialized) return;

      // Initialiser Firebase Analytics
      await analytics().setAnalyticsCollectionEnabled(true);
      
      // Initialiser Firebase Messaging
      await messaging().requestPermission();
      
      // Obtenir le token FCM
      const fcmToken = await messaging().getToken();
      console.log('FCM Token:', fcmToken);

      this.isInitialized = true;
      console.log('Firebase initialisé avec succès');
    } catch (error) {
      console.error('Erreur initialisation Firebase:', error);
      throw error;
    }
  }

  // ==================== AUTHENTIFICATION ====================

  /**
   * Connexion avec email/mot de passe
   */
  public async signInWithEmail(
    email: string,
    password: string
  ): Promise<User> {
    try {
      const userCredential = await auth().signInWithEmailAndPassword(email, password);
      const firebaseUser = userCredential.user;
      
      // Mettre à jour la dernière connexion
      await this.updateUserLastLogin(firebaseUser.uid);
      
      return this.mapFirebaseUserToUser(firebaseUser);
    } catch (error) {
      console.error('Erreur connexion email:', error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Inscription avec email/mot de passe
   */
  public async signUpWithEmail(
    email: string,
    password: string,
    displayName: string
  ): Promise<User> {
    try {
      const userCredential = await auth().createUserWithEmailAndPassword(email, password);
      const firebaseUser = userCredential.user;
      
      // Mettre à jour le profil
      await firebaseUser.updateProfile({ displayName });
      
      // Créer le document utilisateur
      await this.createUserDocument(firebaseUser.uid, {
        email,
        displayName,
        createdAt: new Date(),
        lastLoginAt: new Date(),
        isPremium: false,
      });
      
      return this.mapFirebaseUserToUser(firebaseUser);
    } catch (error) {
      console.error('Erreur inscription email:', error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Déconnexion
   */
  public async signOut(): Promise<void> {
    try {
      await auth().signOut();
    } catch (error) {
      console.error('Erreur déconnexion:', error);
      throw error;
    }
  }

  /**
   * Obtenir l'utilisateur actuel
   */
  public async getCurrentUser(): Promise<User | null> {
    try {
      const firebaseUser = auth().currentUser;
      if (!firebaseUser) return null;
      
      return this.mapFirebaseUserToUser(firebaseUser);
    } catch (error) {
      console.error('Erreur obtention utilisateur actuel:', error);
      return null;
    }
  }

  /**
   * Réinitialiser le mot de passe
   */
  public async resetPassword(email: string): Promise<void> {
    try {
      await auth().sendPasswordResetEmail(email);
    } catch (error) {
      console.error('Erreur réinitialisation mot de passe:', error);
      throw this.handleAuthError(error);
    }
  }

  // ==================== PROFILS UTILISATEUR ====================

  /**
   * Créer un profil utilisateur
   */
  public async createUserProfile(
    userId: string,
    profile: Omit<UserProfile, 'userId'>
  ): Promise<void> {
    try {
      const userProfile: UserProfile = {
        userId,
        ...profile,
      };

      await firestore()
        .collection(FIREBASE_CONFIG.collections.profiles)
        .doc(userId)
        .set(userProfile);
    } catch (error) {
      console.error('Erreur création profil:', error);
      throw error;
    }
  }

  /**
   * Obtenir un profil utilisateur
   */
  public async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const doc = await firestore()
        .collection(FIREBASE_CONFIG.collections.profiles)
        .doc(userId)
        .get();

      if (!doc.exists) return null;
      
      return doc.data() as UserProfile;
    } catch (error) {
      console.error('Erreur obtention profil:', error);
      return null;
    }
  }

  /**
   * Mettre à jour un profil utilisateur
   */
  public async updateUserProfile(
    userId: string,
    updates: Partial<UserProfile>
  ): Promise<void> {
    try {
      await firestore()
        .collection(FIREBASE_CONFIG.collections.profiles)
        .doc(userId)
        .update(updates);
    } catch (error) {
      console.error('Erreur mise à jour profil:', error);
      throw error;
    }
  }

  // ==================== SCANS 3D ====================

  /**
   * Sauvegarder un scan 3D
   */
  public async saveScan(scan: BodyScan): Promise<void> {
    try {
      await firestore()
        .collection(FIREBASE_CONFIG.collections.scans)
        .doc(scan.id)
        .set({
          ...scan,
          timestamp: firestore.Timestamp.fromDate(scan.timestamp),
        });
    } catch (error) {
      console.error('Erreur sauvegarde scan:', error);
      throw error;
    }
  }

  /**
   * Obtenir les scans d'un utilisateur
   */
  public async getUserScans(
    userId: string,
    limit: number = 10
  ): Promise<BodyScan[]> {
    try {
      const snapshot = await firestore()
        .collection(FIREBASE_CONFIG.collections.scans)
        .where('userId', '==', userId)
        .orderBy('timestamp', 'desc')
        .limit(limit)
        .get();

      return snapshot.docs.map(doc => ({
        ...doc.data(),
        timestamp: doc.data().timestamp.toDate(),
      })) as BodyScan[];
    } catch (error) {
      console.error('Erreur obtention scans:', error);
      return [];
    }
  }

  /**
   * Obtenir un scan spécifique
   */
  public async getScan(scanId: string): Promise<BodyScan | null> {
    try {
      const doc = await firestore()
        .collection(FIREBASE_CONFIG.collections.scans)
        .doc(scanId)
        .get();

      if (!doc.exists) return null;

      const data = doc.data();
      return {
        ...data,
        timestamp: data?.timestamp.toDate(),
      } as BodyScan;
    } catch (error) {
      console.error('Erreur obtention scan:', error);
      return null;
    }
  }

  // ==================== PROGRAMMES D'ENTRAÎNEMENT ====================

  /**
   * Sauvegarder un programme d'entraînement
   */
  public async saveWorkoutPlan(plan: WorkoutPlan): Promise<void> {
    try {
      await firestore()
        .collection(FIREBASE_CONFIG.collections.workouts)
        .doc(plan.id)
        .set({
          ...plan,
          createdAt: firestore.Timestamp.fromDate(plan.createdAt),
        });
    } catch (error) {
      console.error('Erreur sauvegarde programme:', error);
      throw error;
    }
  }

  /**
   * Mettre à jour un programme d'entraînement
   */
  public async updateWorkoutPlan(plan: WorkoutPlan): Promise<void> {
    try {
      await firestore()
        .collection(FIREBASE_CONFIG.collections.workouts)
        .doc(plan.id)
        .update({
          ...plan,
          createdAt: firestore.Timestamp.fromDate(plan.createdAt),
        });
    } catch (error) {
      console.error('Erreur mise à jour programme:', error);
      throw error;
    }
  }

  /**
   * Obtenir les programmes d'un utilisateur
   */
  public async getUserWorkoutPlans(userId: string): Promise<WorkoutPlan[]> {
    try {
      const snapshot = await firestore()
        .collection(FIREBASE_CONFIG.collections.workouts)
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .get();

      return snapshot.docs.map(doc => ({
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
      })) as WorkoutPlan[];
    } catch (error) {
      console.error('Erreur obtention programmes:', error);
      return [];
    }
  }

  // ==================== LOGS D'ENTRAÎNEMENT ====================

  /**
   * Sauvegarder un log d'entraînement
   */
  public async saveWorkoutLog(log: WorkoutLog): Promise<void> {
    try {
      await firestore()
        .collection('workout_logs')
        .doc(log.id)
        .set({
          ...log,
          date: firestore.Timestamp.fromDate(log.date),
        });
    } catch (error) {
      console.error('Erreur sauvegarde log:', error);
      throw error;
    }
  }

  /**
   * Obtenir les logs d'entraînement d'un utilisateur
   */
  public async getUserWorkoutLogs(
    userId: string,
    limit: number = 20
  ): Promise<WorkoutLog[]> {
    try {
      const snapshot = await firestore()
        .collection('workout_logs')
        .where('userId', '==', userId)
        .orderBy('date', 'desc')
        .limit(limit)
        .get();

      return snapshot.docs.map(doc => ({
        ...doc.data(),
        date: doc.data().date.toDate(),
      })) as WorkoutLog[];
    } catch (error) {
      console.error('Erreur obtention logs:', error);
      return [];
    }
  }

  // ==================== ACHIEVEMENTS ====================

  /**
   * Débloquer un achievement
   */
  public async unlockAchievement(
    userId: string,
    achievementId: string
  ): Promise<void> {
    try {
      await firestore()
        .collection('user_achievements')
        .doc(`${userId}_${achievementId}`)
        .set({
          userId,
          achievementId,
          unlockedAt: firestore.Timestamp.now(),
        });
    } catch (error) {
      console.error('Erreur déblocage achievement:', error);
      throw error;
    }
  }

  // ==================== STORAGE ====================

  /**
   * Uploader un fichier
   */
  public async uploadFile(
    file: Blob,
    path: string
  ): Promise<string> {
    try {
      const reference = storage().ref(path);
      await reference.put(file);
      const downloadURL = await reference.getDownloadURL();
      return downloadURL;
    } catch (error) {
      console.error('Erreur upload fichier:', error);
      throw error;
    }
  }

  /**
   * Supprimer un fichier
   */
  public async deleteFile(path: string): Promise<void> {
    try {
      const reference = storage().ref(path);
      await reference.delete();
    } catch (error) {
      console.error('Erreur suppression fichier:', error);
      throw error;
    }
  }

  // ==================== MÉTHODES PRIVÉES ====================

  private async createUserDocument(
    uid: string,
    userData: Partial<User>
  ): Promise<void> {
    try {
      await firestore()
        .collection(FIREBASE_CONFIG.collections.users)
        .doc(uid)
        .set({
          id: uid,
          ...userData,
          createdAt: firestore.Timestamp.now(),
          lastLoginAt: firestore.Timestamp.now(),
        });
    } catch (error) {
      console.error('Erreur création document utilisateur:', error);
      throw error;
    }
  }

  private async updateUserLastLogin(uid: string): Promise<void> {
    try {
      await firestore()
        .collection(FIREBASE_CONFIG.collections.users)
        .doc(uid)
        .update({
          lastLoginAt: firestore.Timestamp.now(),
        });
    } catch (error) {
      console.error('Erreur mise à jour dernière connexion:', error);
    }
  }

  private mapFirebaseUserToUser(firebaseUser: FirebaseAuthTypes.User): User {
    return {
      id: firebaseUser.uid,
      email: firebaseUser.email || '',
      displayName: firebaseUser.displayName || '',
      photoURL: firebaseUser.photoURL || undefined,
      createdAt: firebaseUser.metadata.creationTime 
        ? new Date(firebaseUser.metadata.creationTime) 
        : new Date(),
      lastLoginAt: firebaseUser.metadata.lastSignInTime 
        ? new Date(firebaseUser.metadata.lastSignInTime) 
        : new Date(),
      isPremium: false, // À déterminer depuis Firestore
    };
  }

  private handleAuthError(error: any): Error {
    let message = 'Une erreur est survenue';
    
    switch (error.code) {
      case 'auth/user-not-found':
        message = 'Aucun utilisateur trouvé avec cet email';
        break;
      case 'auth/wrong-password':
        message = 'Mot de passe incorrect';
        break;
      case 'auth/email-already-in-use':
        message = 'Cet email est déjà utilisé';
        break;
      case 'auth/weak-password':
        message = 'Le mot de passe est trop faible';
        break;
      case 'auth/invalid-email':
        message = 'Adresse email invalide';
        break;
      case 'auth/user-disabled':
        message = 'Ce compte a été désactivé';
        break;
      case 'auth/too-many-requests':
        message = 'Trop de tentatives. Réessayez plus tard';
        break;
      default:
        message = error.message || 'Erreur d\'authentification';
    }
    
    return new Error(message);
  }
}

export default FirebaseService.getInstance();