import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import HomeScreen from './src/screens/HomeScreen';
import './global.css';

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <HomeScreen />
    </SafeAreaProvider>
  );
}
