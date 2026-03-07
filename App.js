import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View } from 'react-native';
import HomeScreen from './src/screens/HomeScreen';
import CropsScreen from './src/screens/CropsScreen';
import InsightsScreen from './src/screens/InsightsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import UpdateProfileScreen from './src/screens/UpdateProfileScreen';
import BottomNav from './src/components/BottomNav';
import './global.css';

const Tab = createBottomTabNavigator();
const ProfileStack = createNativeStackNavigator();

/**
 * Stack navigator for the Profile tab.
 * UpdateProfile is pushed on top and hides the bottom tab bar.
 */
function ProfileStackScreen() {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="ProfileMain" component={ProfileScreen} />
      <ProfileStack.Screen name="UpdateProfile" component={UpdateProfileScreen} />
    </ProfileStack.Navigator>
  );
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
          <Tab.Screen
            name="Profile"
            component={ProfileStackScreen}
            options={{
              // Hide tab bar when navigated to UpdateProfile
              tabBarStyle: { display: 'none' },
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
