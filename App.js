import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import './src/locales/i18n'; // Import i18n configuration
import { initDB } from './src/database/db';

export default function App() {
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    async function setup() {
      await initDB();
      setDbReady(true);
    }
    setup();
  }, []);

  if (!dbReady) {
    return null; // Or a loading spinner
  }

  return (
    <SafeAreaProvider>
      <AppNavigator />
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}
