import { Platform, PermissionsAndroid } from 'react-native';
import { Camera } from 'react-native-camera';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import * as tf from '@tensorflow/tfjs-react-native';
import '@tensorflow/tfjs-react-native/dist/platform/react-native';
import { 
  BodyScan, 
  ScanData, 
  BodyComposition, 
  BodyMeasurements,
  MeshData,
  CalibrationData,
  ApiResponse 
} from '@/types';
import { SCAN_CONFIG, MESSAGES } from '@/utils/constants';
import { FirebaseService } from '../api/FirebaseService';
import { AnalyticsService } from '../analytics/AnalyticsService';

export interface ScanProgress {
  stage: 'preparation' | 'calibration' | 'capture' | 'processing' | 'analysis' | 'complete';
  progress: number; // 0-1
  message: string;
  rotationAngle: number;
  capturedFrames: number;
  confidence: number;
}

export interface ScanInstructions {
  step: number;
  title: string;
  description: string;
  animation?: string;
  voiceCommand?: string;
  duration?: number;
}

class ScanService {
  private static instance: ScanService;
  private isInitialized = false;
  private currentScan: Partial<BodyScan> | null = null;
  private scanProgressCallback: ((progress: ScanProgress) => void) | null = null;
  private capturedFrames: string[] = [];
  private tensorflowModel: tf.LayersModel | null = null;
  private bodyDetectionModel: tf.LayersModel | null = null;

  private constructor() {}

  public static getInstance(): ScanService {
    if (!ScanService.instance) {
      ScanService.instance = new ScanService();
    }
    return ScanService.instance;
  }

  /**
   * Initialise le service de scan 3D
   */
  public async initialize(): Promise<void> {
    try {
      if (this.isInitialized) return;

      // Initialiser TensorFlow.js
      await tf.ready();
      
      // Charger les modèles de détection corporelle
      await this.loadModels();
      
      this.isInitialized = true;
      console.log('ScanService initialisé avec succès');
    } catch (error) {
      console.error('Erreur lors de l\'initialisation du ScanService:', error);
      throw new Error(MESSAGES.errors.generic);
    }
  }

  /**
   * Charge les modèles TensorFlow pour la détection et l'analyse corporelle
   */
  private async loadModels(): Promise<void> {
    try {
      // Modèle de détection de pose corporelle (PoseNet ou MoveNet)
      this.bodyDetectionModel = await tf.loadLayersModel(
        'https://storage.googleapis.com/fitscan3d-models/posenet/model.json'
      );

      // Modèle d'analyse de composition corporelle
      this.tensorflowModel = await tf.loadLayersModel(
        'https://storage.googleapis.com/fitscan3d-models/body-composition/model.json'
      );

      console.log('Modèles TensorFlow chargés avec succès');
    } catch (error) {
      console.error('Erreur lors du chargement des modèles:', error);
      throw error;
    }
  }

  /**
   * Vérifie et demande les permissions nécessaires
   */
  public async checkPermissions(): Promise<boolean> {
    try {
      const cameraPermission = Platform.OS === 'ios' 
        ? PERMISSIONS.IOS.CAMERA 
        : PERMISSIONS.ANDROID.CAMERA;

      const storagePermission = Platform.OS === 'ios'
        ? PERMISSIONS.IOS.PHOTO_LIBRARY
        : PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE;

      const cameraStatus = await check(cameraPermission);
      const storageStatus = await check(storagePermission);

      if (cameraStatus !== RESULTS.GRANTED) {
        const result = await request(cameraPermission);
        if (result !== RESULTS.GRANTED) {
          throw new Error(MESSAGES.errors.permission);
        }
      }

      if (storageStatus !== RESULTS.GRANTED) {
        const result = await request(storagePermission);
        if (result !== RESULTS.GRANTED) {
          throw new Error(MESSAGES.errors.permission);
        }
      }

      return true;
    } catch (error) {
      console.error('Erreur de permissions:', error);
      return false;
    }
  }

  /**
   * Démarre un nouveau scan 3D
   */
  public async startScan(
    userId: string,
    progressCallback: (progress: ScanProgress) => void
  ): Promise<string> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      // Vérifier les permissions
      const hasPermissions = await this.checkPermissions();
      if (!hasPermissions) {
        throw new Error(MESSAGES.errors.permission);
      }

      // Créer un nouveau scan
      const scanId = this.generateScanId();
      this.currentScan = {
        id: scanId,
        userId,
        timestamp: new Date(),
        processingStatus: 'processing',
      };

      this.scanProgressCallback = progressCallback;
      this.capturedFrames = [];

      // Analytics
      AnalyticsService.trackEvent('scan_started', { userId, scanId });

      // Commencer la phase de préparation
      this.updateProgress({
        stage: 'preparation',
        progress: 0,
        message: 'Préparation du scan...',
        rotationAngle: 0,
        capturedFrames: 0,
        confidence: 0,
      });

      return scanId;
    } catch (error) {
      console.error('Erreur lors du démarrage du scan:', error);
      throw error;
    }
  }

  /**
   * Calibre la caméra et l'environnement
   */
  public async calibrateEnvironment(): Promise<CalibrationData> {
    try {
      this.updateProgress({
        stage: 'calibration',
        progress: 0.1,
        message: 'Calibrage de l\'environnement...',
        rotationAngle: 0,
        capturedFrames: 0,
        confidence: 0,
      });

      // Analyser l'éclairage
      const lightingConditions = await this.analyzeLighting();
      
      // Détecter le type de fond
      const backgroundType = await this.analyzeBackground();
      
      // Obtenir les paramètres intrinsèques de la caméra
      const cameraIntrinsics = await this.getCameraIntrinsics();
      
      // Obtenir l'orientation de l'appareil
      const deviceOrientation = await this.getDeviceOrientation();

      const calibrationData: CalibrationData = {
        cameraIntrinsics,
        deviceOrientation,
        lightingConditions,
        backgroundType,
      };

      this.updateProgress({
        stage: 'calibration',
        progress: 0.2,
        message: 'Calibrage terminé',
        rotationAngle: 0,
        capturedFrames: 0,
        confidence: lightingConditions,
      });

      return calibrationData;
    } catch (error) {
      console.error('Erreur lors du calibrage:', error);
      throw error;
    }
  }

  /**
   * Capture les images pour le scan 3D
   */
  public async captureFrames(
    camera: Camera,
    onInstructionChange: (instruction: ScanInstructions) => void
  ): Promise<string[]> {
    try {
      this.updateProgress({
        stage: 'capture',
        progress: 0.2,
        message: 'Début de la capture...',
        rotationAngle: 0,
        capturedFrames: 0,
        confidence: 0,
      });

      const instructions = this.getScanInstructions();
      const capturedImages: string[] = [];
      let currentInstructionIndex = 0;
      let rotationAngle = 0;
      
      // Commencer les instructions
      onInstructionChange(instructions[currentInstructionIndex]);

      return new Promise((resolve, reject) => {
        const captureInterval = setInterval(async () => {
          try {
            // Capturer une image
            const imageUri = await this.captureImage(camera);
            
            // Analyser la pose corporelle
            const bodyDetected = await this.detectBodyPose(imageUri);
            
            if (bodyDetected.confidence > SCAN_CONFIG.bodyDetectionThreshold) {
              capturedImages.push(imageUri);
              rotationAngle += 360 / SCAN_CONFIG.requiredRotationAngle * 10; // Approximation
              
              // Mettre à jour les instructions si nécessaire
              const instructionIndex = Math.floor(rotationAngle / (360 / instructions.length));
              if (instructionIndex !== currentInstructionIndex && instructionIndex < instructions.length) {
                currentInstructionIndex = instructionIndex;
                onInstructionChange(instructions[currentInstructionIndex]);
              }
              
              this.updateProgress({
                stage: 'capture',
                progress: 0.2 + (rotationAngle / 360) * 0.5,
                message: `Capture en cours... ${Math.round(rotationAngle)}°`,
                rotationAngle,
                capturedFrames: capturedImages.length,
                confidence: bodyDetected.confidence,
              });
            }
            
            // Vérifier si la capture est terminée
            if (rotationAngle >= 360 || capturedImages.length >= SCAN_CONFIG.maxScanImages) {
              clearInterval(captureInterval);
              resolve(capturedImages);
            }
          } catch (error) {
            clearInterval(captureInterval);
            reject(error);
          }
        }, 1000 / SCAN_CONFIG.captureFrameRate);

        // Timeout de sécurité
        setTimeout(() => {
          clearInterval(captureInterval);
          if (capturedImages.length < 10) {
            reject(new Error('Pas assez d\'images capturées'));
          } else {
            resolve(capturedImages);
          }
        }, SCAN_CONFIG.maxCaptureTime * 1000);
      });
    } catch (error) {
      console.error('Erreur lors de la capture:', error);
      throw error;
    }
  }

  /**
   * Traite les images capturées pour créer le modèle 3D
   */
  public async processImages(
    images: string[],
    calibrationData: CalibrationData
  ): Promise<ScanData> {
    try {
      this.updateProgress({
        stage: 'processing',
        progress: 0.7,
        message: 'Traitement des images...',
        rotationAngle: 360,
        capturedFrames: images.length,
        confidence: 0,
      });

      // Générer le nuage de points
      const pointCloud = await this.generatePointCloud(images, calibrationData);
      
      this.updateProgress({
        stage: 'processing',
        progress: 0.8,
        message: 'Génération du maillage 3D...',
        rotationAngle: 360,
        capturedFrames: images.length,
        confidence: 0,
      });

      // Créer le maillage 3D
      const meshData = await this.generateMesh(pointCloud);
      
      const scanData: ScanData = {
        images,
        pointCloud,
        meshData,
        calibrationData,
      };

      return scanData;
    } catch (error) {
      console.error('Erreur lors du traitement:', error);
      throw error;
    }
  }

  /**
   * Analyse la composition corporelle à partir du scan 3D
   */
  public async analyzeBodyComposition(
    scanData: ScanData,
    userProfile: { age: number; gender: string; height: number; weight: number }
  ): Promise<{ composition: BodyComposition; measurements: BodyMeasurements }> {
    try {
      this.updateProgress({
        stage: 'analysis',
        progress: 0.9,
        message: 'Analyse de la composition corporelle...',
        rotationAngle: 360,
        capturedFrames: scanData.images.length,
        confidence: 0,
      });

      if (!this.tensorflowModel) {
        throw new Error('Modèle d\'analyse non chargé');
      }

      // Extraire les caractéristiques du maillage 3D
      const features = this.extractBodyFeatures(scanData.meshData);
      
      // Préparer les données d'entrée pour le modèle
      const inputTensor = tf.tensor2d([features]);
      const userTensor = tf.tensor2d([[
        userProfile.age / 100, // Normalisation
        userProfile.gender === 'male' ? 1 : 0,
        userProfile.height / 200,
        userProfile.weight / 150,
      ]]);

      // Prédiction de la composition corporelle
      const prediction = this.tensorflowModel.predict([inputTensor, userTensor]) as tf.Tensor;
      const results = await prediction.data();

      // Interpréter les résultats
      const composition: BodyComposition = {
        bodyFatPercentage: results[0] * 100,
        muscleMass: results[1] * userProfile.weight,
        boneDensity: results[2],
        waterPercentage: results[3] * 100,
        visceralFat: results[4],
        basalMetabolicRate: this.calculateBMR(userProfile, results[1] * userProfile.weight),
        bmi: userProfile.weight / Math.pow(userProfile.height / 100, 2),
        bodyAge: results[5] + userProfile.age,
        metabolicAge: results[6] + userProfile.age,
      };

      // Calculer les mensurations
      const measurements = this.calculateMeasurements(scanData.meshData);

      // Nettoyer les tenseurs
      inputTensor.dispose();
      userTensor.dispose();
      prediction.dispose();

      return { composition, measurements };
    } catch (error) {
      console.error('Erreur lors de l\'analyse:', error);
      throw error;
    }
  }

  /**
   * Finalise et sauvegarde le scan
   */
  public async finalizeScan(
    scanData: ScanData,
    bodyComposition: BodyComposition,
    measurements: BodyMeasurements
  ): Promise<BodyScan> {
    try {
      if (!this.currentScan) {
        throw new Error('Aucun scan en cours');
      }

      this.updateProgress({
        stage: 'complete',
        progress: 0.95,
        message: 'Finalisation du scan...',
        rotationAngle: 360,
        capturedFrames: scanData.images.length,
        confidence: 1,
      });

      // Uploader le modèle 3D vers Firebase Storage
      const model3DURL = await this.uploadModel3D(scanData);

      // Créer l'objet BodyScan complet
      const completedScan: BodyScan = {
        ...this.currentScan,
        scanData,
        bodyComposition,
        measurements,
        model3D: model3DURL,
        confidence: this.calculateOverallConfidence(scanData),
        processingStatus: 'completed',
      } as BodyScan;

      // Sauvegarder dans Firestore
      await FirebaseService.saveScan(completedScan);

      // Analytics
      AnalyticsService.trackEvent('scan_completed', {
        userId: completedScan.userId,
        scanId: completedScan.id,
        confidence: completedScan.confidence,
        processingTime: Date.now() - completedScan.timestamp.getTime(),
      });

      this.updateProgress({
        stage: 'complete',
        progress: 1,
        message: 'Scan terminé avec succès !',
        rotationAngle: 360,
        capturedFrames: scanData.images.length,
        confidence: completedScan.confidence,
      });

      // Nettoyer
      this.currentScan = null;
      this.scanProgressCallback = null;

      return completedScan;
    } catch (error) {
      console.error('Erreur lors de la finalisation:', error);
      throw error;
    }
  }

  // Méthodes utilitaires privées

  private generateScanId(): string {
    return `scan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private updateProgress(progress: ScanProgress): void {
    if (this.scanProgressCallback) {
      this.scanProgressCallback(progress);
    }
  }

  private getScanInstructions(): ScanInstructions[] {
    return [
      {
        step: 1,
        title: 'Position initiale',
        description: 'Tenez-vous debout, bras le long du corps, face à la caméra',
        voiceCommand: 'Tenez-vous debout face à la caméra',
        duration: 3,
      },
      {
        step: 2,
        title: 'Rotation lente',
        description: 'Tournez lentement sur vous-même vers la droite',
        voiceCommand: 'Tournez lentement vers la droite',
        duration: 15,
      },
      {
        step: 3,
        title: 'Bras levés',
        description: 'Levez les bras à l\'horizontale',
        voiceCommand: 'Levez les bras à l\'horizontale',
        duration: 5,
      },
      {
        step: 4,
        title: 'Continuez la rotation',
        description: 'Continuez à tourner lentement',
        voiceCommand: 'Continuez à tourner',
        duration: 10,
      },
      {
        step: 5,
        title: 'Finalisation',
        description: 'Revenez à la position initiale',
        voiceCommand: 'Revenez face à la caméra',
        duration: 2,
      },
    ];
  }

  private async captureImage(camera: Camera): Promise<string> {
    const options = {
      quality: 0.8,
      base64: false,
      width: SCAN_CONFIG.imageResolution.width,
      height: SCAN_CONFIG.imageResolution.height,
    };
    
    const data = await camera.takePictureAsync(options);
    return data.uri;
  }

  private async detectBodyPose(imageUri: string): Promise<{ confidence: number; keypoints: any[] }> {
    if (!this.bodyDetectionModel) {
      throw new Error('Modèle de détection corporelle non chargé');
    }

    try {
      // Charger et préprocesser l'image
      const response = await fetch(imageUri);
      const imageBlob = await response.blob();
      const imageTensor = await tf.browser.fromPixels(imageBlob as any);
      
      // Redimensionner pour le modèle
      const resized = tf.image.resizeBilinear(imageTensor, [257, 257]);
      const normalized = resized.div(255.0);
      const batched = normalized.expandDims(0);

      // Prédiction
      const prediction = this.bodyDetectionModel.predict(batched) as tf.Tensor;
      const results = await prediction.data();

      // Nettoyer les tenseurs
      imageTensor.dispose();
      resized.dispose();
      normalized.dispose();
      batched.dispose();
      prediction.dispose();

      // Analyser les résultats (simplifié)
      const confidence = Math.max(...Array.from(results).slice(0, 17)); // 17 keypoints principaux
      
      return {
        confidence,
        keypoints: [], // À implémenter selon le modèle utilisé
      };
    } catch (error) {
      console.error('Erreur détection pose:', error);
      return { confidence: 0, keypoints: [] };
    }
  }

  private async analyzeLighting(): Promise<number> {
    // Analyser les conditions d'éclairage (simplifié)
    // Dans une implémentation réelle, analyser l'histogramme de l'image
    return 0.8; // Score de qualité d'éclairage
  }

  private async analyzeBackground(): Promise<'plain' | 'textured'> {
    // Analyser le type de fond (simplifié)
    return 'plain';
  }

  private async getCameraIntrinsics(): Promise<number[][]> {
    // Obtenir les paramètres intrinsèques de la caméra
    // Dans une implémentation réelle, utiliser les APIs natives
    return [
      [800, 0, 320],
      [0, 800, 240],
      [0, 0, 1],
    ];
  }

  private async getDeviceOrientation(): Promise<number[]> {
    // Obtenir l'orientation de l'appareil
    return [0, 0, 0]; // pitch, yaw, roll
  }

  private async generatePointCloud(
    images: string[],
    calibrationData: CalibrationData
  ): Promise<Float32Array> {
    // Générer un nuage de points à partir des images
    // Implémentation simplifiée - dans la réalité, utiliser des algorithmes de photogrammétrie
    const points = new Float32Array(10000 * 3); // 10k points avec x,y,z
    
    // Remplir avec des données simulées
    for (let i = 0; i < points.length; i += 3) {
      points[i] = (Math.random() - 0.5) * 2; // x
      points[i + 1] = Math.random() * 2; // y
      points[i + 2] = (Math.random() - 0.5) * 0.5; // z
    }
    
    return points;
  }

  private async generateMesh(pointCloud: Float32Array): Promise<MeshData> {
    // Générer un maillage 3D à partir du nuage de points
    // Implémentation simplifiée
    const vertexCount = pointCloud.length / 3;
    const faceCount = Math.floor(vertexCount / 3);
    
    const faces = new Uint16Array(faceCount * 3);
    const normals = new Float32Array(pointCloud.length);
    const uvCoordinates = new Float32Array((vertexCount * 2));
    
    // Générer des faces triangulaires
    for (let i = 0; i < faces.length; i += 3) {
      faces[i] = Math.floor(i / 3) * 3;
      faces[i + 1] = Math.floor(i / 3) * 3 + 1;
      faces[i + 2] = Math.floor(i / 3) * 3 + 2;
    }
    
    // Calculer les normales (simplifié)
    for (let i = 0; i < normals.length; i += 3) {
      normals[i] = 0;
      normals[i + 1] = 1;
      normals[i + 2] = 0;
    }
    
    // Générer les coordonnées UV
    for (let i = 0; i < uvCoordinates.length; i += 2) {
      uvCoordinates[i] = Math.random();
      uvCoordinates[i + 1] = Math.random();
    }
    
    return {
      vertices: pointCloud,
      faces,
      normals,
      uvCoordinates,
    };
  }

  private extractBodyFeatures(meshData: MeshData): number[] {
    // Extraire les caractéristiques corporelles du maillage 3D
    // Implémentation simplifiée - dans la réalité, analyser la géométrie du corps
    const features: number[] = [];
    
    // Volume approximatif
    features.push(meshData.vertices.length / 10000);
    
    // Surface approximative
    features.push(meshData.faces.length / 1000);
    
    // Ratios corporels approximatifs
    features.push(0.8); // ratio taille/hanches
    features.push(0.7); // ratio épaules/taille
    features.push(1.6); // ratio hauteur/largeur
    
    return features;
  }

  private calculateBMR(
    userProfile: { age: number; gender: string; height: number; weight: number },
    muscleMass: number
  ): number {
    // Formule de Mifflin-St Jeor modifiée avec masse musculaire
    const baseRate = userProfile.gender === 'male'
      ? 88.362 + (13.397 * userProfile.weight) + (4.799 * userProfile.height) - (5.677 * userProfile.age)
      : 447.593 + (9.247 * userProfile.weight) + (3.098 * userProfile.height) - (4.330 * userProfile.age);
    
    // Ajustement basé sur la masse musculaire
    const muscleBonus = muscleMass * 15; // 15 kcal par kg de muscle
    
    return Math.round(baseRate + muscleBonus);
  }

  private calculateMeasurements(meshData: MeshData): BodyMeasurements {
    // Calculer les mensurations à partir du maillage 3D
    // Implémentation simplifiée
    return {
      chest: 95 + Math.random() * 20,
      waist: 80 + Math.random() * 15,
      hips: 100 + Math.random() * 15,
      bicep: 30 + Math.random() * 10,
      thigh: 55 + Math.random() * 15,
      neck: 35 + Math.random() * 5,
      shoulders: 110 + Math.random() * 20,
      forearm: 25 + Math.random() * 5,
      calf: 35 + Math.random() * 10,
    };
  }

  private async uploadModel3D(scanData: ScanData): Promise<string> {
    // Uploader le modèle 3D vers Firebase Storage
    // Implémentation simplifiée
    const modelData = {
      vertices: Array.from(scanData.meshData.vertices),
      faces: Array.from(scanData.meshData.faces),
      normals: Array.from(scanData.meshData.normals),
      uvCoordinates: Array.from(scanData.meshData.uvCoordinates),
    };
    
    const modelBlob = new Blob([JSON.stringify(modelData)], { type: 'application/json' });
    const modelUrl = await FirebaseService.uploadFile(
      modelBlob,
      `scans/${this.currentScan?.id}/model3d.json`
    );
    
    return modelUrl;
  }

  private calculateOverallConfidence(scanData: ScanData): number {
    // Calculer la confiance globale du scan
    const imageQuality = scanData.images.length / SCAN_CONFIG.maxScanImages;
    const meshQuality = Math.min(scanData.meshData.vertices.length / 30000, 1);
    const lightingQuality = scanData.calibrationData.lightingConditions;
    
    return (imageQuality + meshQuality + lightingQuality) / 3;
  }
}

export default ScanService.getInstance();