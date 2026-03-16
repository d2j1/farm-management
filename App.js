import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './src/screens/HomeScreen';
import TasksScreen from './src/screens/TasksScreen';
import CropsScreen from './src/screens/CropsScreen';
import CropDetailsActionsScreen from './src/screens/CropDetailsActionsScreen';
import CreateCropScreen from './src/screens/CreateCropScreen';
import EditCropScreen from './src/screens/EditCropScreen';
import InsightsScreen from './src/screens/InsightsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import UpdateProfileScreen from './src/screens/UpdateProfileScreen';
import SplashScreen from './src/screens/SplashScreen';
import LanguageSelectionScreen from './src/screens/LanguageSelectionScreen';
import BottomNav from './src/components/BottomNav';
import { DatabaseProvider } from './src/database/DatabaseProvider';
import './global.css';

const Tab = createBottomTabNavigator();
const ProfileStack = createNativeStackNavigator();
const HomeStack = createNativeStackNavigator();
const CropsStack = createNativeStackNavigator();
const OnboardingStack = createNativeStackNavigator();

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

/**
 * Stack navigator for the Home tab.
 * Tasks is pushed on top and hides the bottom tab bar.
 */
function HomeStackScreen() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="HomeMain" component={HomeScreen} />
      <HomeStack.Screen name="Tasks" component={TasksScreen} />
    </HomeStack.Navigator>
  );
}

/**
 * Stack navigator for the Crops tab.
 * Crop details is pushed on top and hides the bottom tab bar.
 */
function CropsStackScreen() {
  return (
    <CropsStack.Navigator screenOptions={{ headerShown: false }}>
      <CropsStack.Screen name="CropsMain" component={CropsScreen} />
      <CropsStack.Screen name="CropDetails" component={CropDetailsActionsScreen} />
      <CropsStack.Screen name="CreateCrop" component={CreateCropScreen} />
      <CropsStack.Screen name="EditCrop" component={EditCropScreen} />
    </CropsStack.Navigator>
  );
}

export default function App() {
  const [isLoading, setIsLoading] = React.useState(true);
  const [isOnboarding, setIsOnboarding] = React.useState(true);

  React.useEffect(() => {
    // Simulate a loading time for the splash screen
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <SafeAreaProvider>
        <SplashScreen />
      </SafeAreaProvider>
    );
  }

  if (isOnboarding) {
    return (
      <SafeAreaProvider>
        <DatabaseProvider>
          <StatusBar style="dark" />
          <NavigationContainer>
            <OnboardingStack.Navigator screenOptions={{ headerShown: false }}>
              <OnboardingStack.Screen name="LanguageSelection">
                {(props) => <LanguageSelectionScreen {...props} onContinue={() => setIsOnboarding(false)} />}
              </OnboardingStack.Screen>
            </OnboardingStack.Navigator>
          </NavigationContainer>
        </DatabaseProvider>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <DatabaseProvider>
        <StatusBar style="auto" />
        <NavigationContainer>
          <Tab.Navigator
            tabBar={(props) => <BottomNav {...props} />}
            screenOptions={{ headerShown: false }}
          >
            <Tab.Screen name="Home" component={HomeStackScreen} />
            <Tab.Screen name="Crops" component={CropsStackScreen} />
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
      </DatabaseProvider>
    </SafeAreaProvider>
  );
}
