import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
} from 'react-native';

const App: React.FC = () => {
  const handleScanPress = () => {
    Alert.alert(
      'Scan 3D',
      'Fonctionnalité de scan 3D en cours de développement.\nProchainement disponible !',
      [{ text: 'OK' }]
    );
  };

  const handleWorkoutPress = () => {
    Alert.alert(
      'Programmes d\'Entraînement',
      'Génération automatique de programmes personnalisés.\nBientôt disponible !',
      [{ text: 'OK' }]
    );
  };

  const handleStatsPress = () => {
    Alert.alert(
      'Statistiques',
      'Dashboard avec graphiques de progression.\nEn cours de développement !',
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>FitScan3D</Text>
        <Text style={styles.subtitle}>Votre Coach Fitness IA avec Scan 3D</Text>
      </View>

      <ScrollView contentInsetAdjustmentBehavior="automatic" style={styles.scrollView}>
        
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>🚀 Bienvenue dans le futur du fitness !</Text>
          <Text style={styles.welcomeText}>
            FitScan3D combine la technologie de scan 3D avec l'intelligence artificielle 
            pour créer des programmes d'entraînement parfaitement adaptés à votre corps.
          </Text>
        </View>

        {/* Features Grid */}
        <View style={styles.featuresGrid}>
          
          {/* Scan 3D Feature */}
          <TouchableOpacity style={styles.featureCard} onPress={handleScanPress}>
            <View style={styles.featureIcon}>
              <Text style={styles.featureEmoji}>📱</Text>
            </View>
            <Text style={styles.featureTitle}>Scan 3D du Corps</Text>
            <Text style={styles.featureDescription}>
              Analyse complète de votre composition corporelle en 30 secondes
            </Text>
          </TouchableOpacity>

          {/* Workout Feature */}
          <TouchableOpacity style={styles.featureCard} onPress={handleWorkoutPress}>
            <View style={styles.featureIcon}>
              <Text style={styles.featureEmoji}>🏋️</Text>
            </View>
            <Text style={styles.featureTitle}>Programmes IA</Text>
            <Text style={styles.featureDescription}>
              Entraînements personnalisés générés automatiquement
            </Text>
          </TouchableOpacity>

          {/* Stats Feature */}
          <TouchableOpacity style={styles.featureCard} onPress={handleStatsPress}>
            <View style={styles.featureIcon}>
              <Text style={styles.featureEmoji}>📊</Text>
            </View>
            <Text style={styles.featureTitle}>Suivi Avancé</Text>
            <Text style={styles.featureDescription}>
              Dashboard intelligent avec analyses détaillées
            </Text>
          </TouchableOpacity>

          {/* Social Feature */}
          <TouchableOpacity style={styles.featureCard}>
            <View style={styles.featureIcon}>
              <Text style={styles.featureEmoji}>🏆</Text>
            </View>
            <Text style={styles.featureTitle}>Défis & Badges</Text>
            <Text style={styles.featureDescription}>
              Gamification avec récompenses et communauté
            </Text>
          </TouchableOpacity>

        </View>

        {/* Tech Stack Info */}
        <View style={styles.techSection}>
          <Text style={styles.techTitle}>🛠️ Technologies Intégrées</Text>
          <View style={styles.techList}>
            <Text style={styles.techItem}>• ARKit & ARCore pour le scan 3D</Text>
            <Text style={styles.techItem}>• TensorFlow Lite pour l'IA</Text>
            <Text style={styles.techItem}>• Firebase pour le backend</Text>
            <Text style={styles.techItem}>• React Native pour le cross-platform</Text>
          </View>
        </View>

        {/* Status */}
        <View style={styles.statusSection}>
          <Text style={styles.statusTitle}>📈 Statut du Développement</Text>
          <Text style={styles.statusText}>
            ✅ Architecture complète{'\n'}
            ✅ Services principaux{'\n'}
            ✅ Design system{'\n'}
            🔄 Intégration native en cours{'\n'}
            🔄 Tests et optimisations
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    backgroundColor: '#2d2d2d',
    paddingVertical: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#00d4ff',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  welcomeSection: {
    padding: 20,
    backgroundColor: '#2d2d2d',
    margin: 15,
    borderRadius: 15,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  welcomeText: {
    fontSize: 16,
    color: '#ccc',
    lineHeight: 24,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
    justifyContent: 'space-between',
  },
  featureCard: {
    width: '47%',
    backgroundColor: '#2d2d2d',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    alignItems: 'center',
  },
  featureIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#00d4ff20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  featureEmoji: {
    fontSize: 24,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  featureDescription: {
    fontSize: 12,
    color: '#aaa',
    textAlign: 'center',
    lineHeight: 18,
  },
  techSection: {
    padding: 20,
    backgroundColor: '#2d2d2d',
    margin: 15,
    borderRadius: 15,
  },
  techTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  techList: {
    paddingLeft: 10,
  },
  techItem: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 8,
    lineHeight: 20,
  },
  statusSection: {
    padding: 20,
    backgroundColor: '#2d2d2d',
    margin: 15,
    borderRadius: 15,
    marginBottom: 30,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  statusText: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 22,
  },
});

export default App;