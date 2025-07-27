# ⚡ Démarrage Rapide - FitScan3D

## 🚀 **Lancement en 3 étapes**

### **1. Démarrer le serveur**
```bash
./start.sh
```
*Ou manuellement :*
```bash
npm start
```

### **2. Attendre le message de confirmation**
```
✅ Metro bundler est prêt sur http://localhost:8081
```

### **3. Lancer sur votre plateforme**

#### **📱 Android**
```bash
# Dans un nouveau terminal
npx react-native run-android
```

#### **🍎 iOS (macOS uniquement)**
```bash
# Dans un nouveau terminal
cd ios && pod install && cd ..
npx react-native run-ios
```

#### **🌐 Web (Expo)**
```bash
# Alternative pour test rapide
npx create-expo-app --template blank-typescript FitScan3DDemo
# Copier le code de src/App.tsx vers App.tsx
npx expo start
```

---

## 🎯 **Ce que vous verrez**

### **Interface FitScan3D**
- ✅ **Écran de bienvenue** avec thème sombre
- ✅ **4 cartes interactives** (Scan 3D, Programmes IA, Suivi, Défis)
- ✅ **Technologies listées** (ARKit, TensorFlow, Firebase, React Native)
- ✅ **Statut de développement** en temps réel

### **Fonctionnalités de démonstration**
- 🔘 **Boutons cliquables** avec alertes informatives
- 🎨 **Design moderne** et responsive
- ⚡ **Animations fluides**
- 📱 **Interface mobile optimisée**

---

## 🛠️ **Commandes utiles**

```bash
# Démarrer Metro bundler
npm start

# Nettoyer le cache
npx react-native start --reset-cache

# Lancer Android
npm run android

# Lancer iOS
npm run ios

# Tests
npm test

# Vérifier le serveur Metro
curl http://localhost:8081/status
```

---

## ⚠️ **Résolution de problèmes**

### **Metro ne démarre pas**
```bash
# Tuer les processus existants
pkill -f "react-native\|metro"

# Nettoyer et redémarrer
rm -rf node_modules package-lock.json
npm install
npm start
```

### **Erreur de build Android**
```bash
cd android
./gradlew clean
cd ..
npx react-native run-android
```

### **Erreur de build iOS**
```bash
cd ios
rm -rf Pods Podfile.lock
pod install
cd ..
npx react-native run-ios
```

---

## 📚 **Documentation complète**

- 📖 **Guide détaillé** : [LAUNCH_GUIDE.md](./LAUNCH_GUIDE.md)
- 🏗️ **Architecture** : [README.md](./README.md)
- 🗺️ **Roadmap MVP** : [MVP_ROADMAP.md](./MVP_ROADMAP.md)
- 💻 **Code source** : [src/](./src/)

---

## 🎉 **Prêt à développer !**

**Votre environnement FitScan3D est maintenant configuré et fonctionnel.**

**Prochaines étapes :**
1. ✅ **Tester l'interface** sur simulateur/émulateur
2. 🔧 **Configurer Firebase** pour le backend
3. 📱 **Ajouter la navigation** complète
4. 🏋️ **Implémenter les fonctionnalités** MVP
5. 🚀 **Déployer** sur les stores

**Happy coding ! 🚀**