#!/bin/bash

echo "🚀 Démarrage de FitScan3D..."
echo "================================"

# Vérifier si Node.js est installé
if ! command -v node &> /dev/null; then
    echo "❌ Node.js n'est pas installé. Veuillez l'installer d'abord."
    exit 1
fi

# Vérifier si les dépendances sont installées
if [ ! -d "node_modules" ]; then
    echo "📦 Installation des dépendances..."
    npm install
fi

echo "🔧 Nettoyage du cache Metro..."
npx react-native start --reset-cache &

METRO_PID=$!

echo "⏳ Attente du démarrage de Metro (30 secondes)..."
sleep 30

echo "🌐 Vérification du serveur Metro..."
if curl -s http://localhost:8081/status > /dev/null; then
    echo "✅ Metro bundler est prêt sur http://localhost:8081"
    echo ""
    echo "📱 Pour lancer l'application :"
    echo "   - Android: npx react-native run-android"
    echo "   - iOS: npx react-native run-ios"
    echo ""
    echo "🔗 Ou ouvrez votre navigateur sur :"
    echo "   http://localhost:8081/debugger-ui/"
    echo ""
    echo "🛑 Pour arrêter le serveur, utilisez Ctrl+C"
    
    # Garder le script en vie
    wait $METRO_PID
else
    echo "❌ Le serveur Metro n'a pas pu démarrer"
    kill $METRO_PID 2>/dev/null
    exit 1
fi