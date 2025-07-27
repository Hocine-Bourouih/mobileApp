import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Alert,
  Animated,
  Platform,
} from 'react-native';
import { Camera } from 'react-native-camera';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Svg, { Circle, Path } from 'react-native-svg';
import { useNavigation, useRoute } from '@react-navigation/native';

import ScanService, { ScanProgress, ScanInstructions } from '@/services/scan/ScanService';
import { COLORS, FONTS, SPACING, SHADOWS } from '@/utils/constants';
import { ScanStackParamList } from '@/types';
import { StackNavigationProp } from '@react-navigation/stack';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type ScanCaptureNavigationProp = StackNavigationProp<ScanStackParamList, 'ScanCapture'>;

interface Props {}

const ScanCaptureScreen: React.FC<Props> = () => {
  const navigation = useNavigation<ScanCaptureNavigationProp>();
  const route = useRoute();
  
  // Refs
  const cameraRef = useRef<Camera>(null);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotationAnim = useRef(new Animated.Value(0)).current;

  // State
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState<ScanProgress | null>(null);
  const [currentInstruction, setCurrentInstruction] = useState<ScanInstructions | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [flashMode, setFlashMode] = useState<'off' | 'on' | 'auto'>('off');

  useEffect(() => {
    // Initialiser le service de scan
    ScanService.initialize().catch(error => {
      console.error('Erreur initialisation scan:', error);
      Alert.alert('Erreur', 'Impossible d\'initialiser le service de scan');
    });

    // Animation de pulsation continue
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnimation.start();

    return () => {
      pulseAnimation.stop();
    };
  }, []);

  useEffect(() => {
    // Animer la barre de progression
    if (scanProgress) {
      Animated.timing(progressAnim, {
        toValue: scanProgress.progress,
        duration: 300,
        useNativeDriver: false,
      }).start();

      // Animation de rotation pour l'indicateur
      if (scanProgress.stage === 'capture') {
        const rotationAnimation = Animated.timing(rotationAnim, {
          toValue: scanProgress.rotationAngle / 360,
          duration: 300,
          useNativeDriver: true,
        });
        rotationAnimation.start();
      }
    }
  }, [scanProgress]);

  const startScan = async () => {
    try {
      setIsScanning(true);
      
      // Vérifier que la caméra est prête
      if (!cameraReady || !cameraRef.current) {
        Alert.alert('Erreur', 'La caméra n\'est pas prête');
        setIsScanning(false);
        return;
      }

      // Démarrer le scan
      const scanId = await ScanService.startScan('user_id', setScanProgress);
      
      // Calibrer l'environnement
      const calibrationData = await ScanService.calibrateEnvironment();
      
      // Capturer les images
      const images = await ScanService.captureFrames(
        cameraRef.current,
        setCurrentInstruction
      );

      // Traiter les images
      const scanData = await ScanService.processImages(images, calibrationData);
      
      // Analyser la composition corporelle (données utilisateur simulées)
      const userProfile = {
        age: 30,
        gender: 'male',
        height: 175,
        weight: 70,
      };
      
      const { composition, measurements } = await ScanService.analyzeBodyComposition(
        scanData,
        userProfile
      );

      // Finaliser le scan
      const completedScan = await ScanService.finalizeScan(
        scanData,
        composition,
        measurements
      );

      // Naviguer vers les résultats
      navigation.navigate('ScanResults', { scanId: completedScan.id });
      
    } catch (error) {
      console.error('Erreur lors du scan:', error);
      Alert.alert('Erreur', 'Une erreur est survenue pendant le scan');
      setIsScanning(false);
    }
  };

  const stopScan = () => {
    setIsScanning(false);
    setScanProgress(null);
    setCurrentInstruction(null);
    Alert.alert(
      'Scan arrêté',
      'Le scan a été interrompu. Voulez-vous recommencer ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Recommencer', onPress: startScan },
      ]
    );
  };

  const toggleFlash = () => {
    const modes: ('off' | 'on' | 'auto')[] = ['off', 'on', 'auto'];
    const currentIndex = modes.indexOf(flashMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setFlashMode(modes[nextIndex]);
  };

  const renderProgressBar = () => (
    <View style={styles.progressContainer}>
      <View style={styles.progressBar}>
        <Animated.View
          style={[
            styles.progressFill,
            {
              width: progressAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>
      <Text style={styles.progressText}>
        {scanProgress ? `${Math.round(scanProgress.progress * 100)}%` : '0%'}
      </Text>
    </View>
  );

  const renderInstructions = () => {
    if (!currentInstruction) return null;

    return (
      <View style={styles.instructionsContainer}>
        <View style={styles.instructionCard}>
          <Text style={styles.instructionStep}>
            Étape {currentInstruction.step}
          </Text>
          <Text style={styles.instructionTitle}>
            {currentInstruction.title}
          </Text>
          <Text style={styles.instructionDescription}>
            {currentInstruction.description}
          </Text>
        </View>
      </View>
    );
  };

  const renderScanOverlay = () => (
    <View style={styles.overlayContainer}>
      {/* Cadre de scan */}
      <View style={styles.scanFrame}>
        <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
          {/* Coins du cadre */}
          <Path
            d="M20,20 L20,60 M20,20 L60,20"
            stroke={COLORS.primary}
            strokeWidth="4"
            strokeLinecap="round"
          />
          <Path
            d="M260,20 L300,20 M300,20 L300,60"
            stroke={COLORS.primary}
            strokeWidth="4"
            strokeLinecap="round"
          />
          <Path
            d="M20,440 L20,400 M20,440 L60,440"
            stroke={COLORS.primary}
            strokeWidth="4"
            strokeLinecap="round"
          />
          <Path
            d="M300,440 L260,440 M300,440 L300,400"
            stroke={COLORS.primary}
            strokeWidth="4"
            strokeLinecap="round"
          />
          
          {/* Cercle de progression de rotation */}
          {scanProgress && scanProgress.stage === 'capture' && (
            <Circle
              cx="160"
              cy="230"
              r="80"
              fill="none"
              stroke={COLORS.primary}
              strokeWidth="3"
              strokeDasharray="10,5"
              transform={`rotate(${scanProgress.rotationAngle} 160 230)`}
            />
          )}
        </Svg>
        
        {/* Silhouette guide */}
        <View style={styles.silhouetteGuide}>
          <Icon
            name="person"
            size={120}
            color={COLORS.primary + '40'}
          />
        </View>
      </View>

      {/* Indicateur de confiance */}
      {scanProgress && (
        <View style={styles.confidenceIndicator}>
          <Text style={styles.confidenceText}>
            Qualité: {Math.round(scanProgress.confidence * 100)}%
          </Text>
          <View style={[
            styles.confidenceBar,
            { 
              backgroundColor: scanProgress.confidence > 0.8 
                ? COLORS.success 
                : scanProgress.confidence > 0.5 
                  ? COLORS.warning 
                  : COLORS.error 
            }
          ]} />
        </View>
      )}
    </View>
  );

  const renderControls = () => (
    <View style={styles.controlsContainer}>
      {!isScanning ? (
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <TouchableOpacity
            style={styles.scanButton}
            onPress={startScan}
            disabled={!cameraReady}
          >
            <LinearGradient
              colors={COLORS.gradient.primary}
              style={styles.scanButtonGradient}
            >
              <Icon name="3d-rotation" size={32} color={COLORS.white} />
              <Text style={styles.scanButtonText}>Démarrer le scan</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      ) : (
        <TouchableOpacity
          style={styles.stopButton}
          onPress={stopScan}
        >
          <Icon name="stop" size={32} color={COLORS.white} />
          <Text style={styles.stopButtonText}>Arrêter</Text>
        </TouchableOpacity>
      )}

      {/* Contrôles secondaires */}
      <View style={styles.secondaryControls}>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={toggleFlash}
        >
          <Icon
            name={flashMode === 'off' ? 'flash-off' : flashMode === 'on' ? 'flash-on' : 'flash-auto'}
            size={24}
            color={COLORS.white}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="close" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Caméra */}
      <Camera
        ref={cameraRef}
        style={styles.camera}
        type={Camera.Constants.Type.back}
        flashMode={Camera.Constants.FlashMode[flashMode]}
        onCameraReady={() => setCameraReady(true)}
        captureAudio={false}
        autoFocus={Camera.Constants.AutoFocus.on}
        whiteBalance={Camera.Constants.WhiteBalance.auto}
      >
        {/* Overlay de scan */}
        {renderScanOverlay()}
        
        {/* Instructions */}
        {renderInstructions()}
        
        {/* Barre de progression */}
        {scanProgress && renderProgressBar()}
        
        {/* Contrôles */}
        {renderControls()}
      </Camera>

      {/* Message d'état */}
      {scanProgress && (
        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>
            {scanProgress.message}
          </Text>
          {scanProgress.stage === 'capture' && (
            <Text style={styles.captureInfo}>
              Images capturées: {scanProgress.capturedFrames}
            </Text>
          )}
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.black,
  },
  camera: {
    flex: 1,
  },
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: 320,
    height: 460,
    justifyContent: 'center',
    alignItems: 'center',
  },
  silhouetteGuide: {
    position: 'absolute',
    bottom: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  instructionsContainer: {
    position: 'absolute',
    top: 60,
    left: SPACING.md,
    right: SPACING.md,
  },
  instructionCard: {
    backgroundColor: COLORS.black + 'CC',
    borderRadius: 12,
    padding: SPACING.md,
    ...SHADOWS.md,
  },
  instructionStep: {
    ...FONTS.sizes.sm,
    color: COLORS.primary,
    fontWeight: FONTS.weights.medium,
    marginBottom: SPACING.xs,
  },
  instructionTitle: {
    ...FONTS.sizes.lg,
    color: COLORS.white,
    fontWeight: FONTS.weights.bold,
    marginBottom: SPACING.xs,
  },
  instructionDescription: {
    ...FONTS.sizes.md,
    color: COLORS.gray[300],
    lineHeight: 20,
  },
  progressContainer: {
    position: 'absolute',
    bottom: 140,
    left: SPACING.md,
    right: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: COLORS.gray[700],
    borderRadius: 3,
    marginRight: SPACING.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  progressText: {
    ...FONTS.sizes.sm,
    color: COLORS.white,
    fontWeight: FONTS.weights.medium,
    minWidth: 40,
  },
  confidenceIndicator: {
    position: 'absolute',
    top: -60,
    alignItems: 'center',
  },
  confidenceText: {
    ...FONTS.sizes.sm,
    color: COLORS.white,
    fontWeight: FONTS.weights.medium,
    marginBottom: SPACING.xs,
  },
  confidenceBar: {
    width: 60,
    height: 4,
    borderRadius: 2,
  },
  controlsContainer: {
    position: 'absolute',
    bottom: SPACING.lg,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  scanButton: {
    marginBottom: SPACING.md,
  },
  scanButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: 25,
    ...SHADOWS.lg,
  },
  scanButtonText: {
    ...FONTS.sizes.lg,
    color: COLORS.white,
    fontWeight: FONTS.weights.bold,
    marginLeft: SPACING.sm,
  },
  stopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.error,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: 25,
    marginBottom: SPACING.md,
    ...SHADOWS.lg,
  },
  stopButtonText: {
    ...FONTS.sizes.lg,
    color: COLORS.white,
    fontWeight: FONTS.weights.bold,
    marginLeft: SPACING.sm,
  },
  secondaryControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: SCREEN_WIDTH - SPACING.xl * 2,
  },
  controlButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.black + 'CC',
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.md,
  },
  statusContainer: {
    position: 'absolute',
    bottom: 200,
    left: SPACING.md,
    right: SPACING.md,
    backgroundColor: COLORS.black + 'CC',
    borderRadius: 8,
    padding: SPACING.sm,
    alignItems: 'center',
  },
  statusText: {
    ...FONTS.sizes.md,
    color: COLORS.white,
    textAlign: 'center',
    fontWeight: FONTS.weights.medium,
  },
  captureInfo: {
    ...FONTS.sizes.sm,
    color: COLORS.gray[300],
    marginTop: SPACING.xs,
  },
});

export default ScanCaptureScreen;