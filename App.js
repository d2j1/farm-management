import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View } from 'react-native';
import HomeScreen from './src/screens/HomeScreen';
import CropsScreen from './src/screens/CropsScreen';
import InsightsScreen from './src/screens/InsightsScreen';
import BottomNav from './src/components/BottomNav';
import './global.css';

const Tab = createBottomTabNavigator();

/**
 * Placeholder screen for tabs not yet implemented.
 */
function PlaceholderScreen() {
  return <View className="flex-1 bg-background-light" />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <NavigationContainer>
        <Tab.Navigator
          tabBar={(props) => <BottomNav {...props} />}
          screenOptions={{ headerShown: false }}
        >
          <Tab.Screen name="Home" component={HomeScreen} />
          <Tab.Screen name="Crops" component={CropsScreen} />
          <Tab.Screen name="Insights" component={InsightsScreen} />
          <Tab.Screen name="Profile" component={PlaceholderScreen} />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
