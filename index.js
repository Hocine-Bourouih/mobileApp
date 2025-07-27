/**
 * FitScan3D - Application de fitness avec scan 3D du corps
 * 
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './src/App';
import { name as appName } from './app.json';

// Enregistrer l'application
AppRegistry.registerComponent(appName, () => App);