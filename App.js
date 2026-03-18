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
import WelcomeScreen from './src/screens/WelcomeScreen';
import BottomNav from './src/components/BottomNav';
import { DatabaseProvider } from './src/database/DatabaseProvider';
import { initDatabase } from './src/database/initDb';
import { getSetting, saveSetting } from './src/database/settingsService';
import { useLanguageStore } from './src/utils/languageStore';
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
  const [progress, setProgress] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isOnboarding, setIsOnboarding] = React.useState(true);
  const [db, setDb] = React.useState(null);
  const { setLanguage } = useLanguageStore();

  React.useEffect(() => {
    let dbReady = false;

    // Phase 1: Initialize Database
    initDatabase()
      .then(async (instance) => {
        setDb(instance);
        
        // Load initial settings
        try {
          const onboardingDone = await getSetting('onboarding_completed');
          if (onboardingDone === 'true') {
            setIsOnboarding(false);
          }
          
          const savedLang = await getSetting('preferred_language');
          if (savedLang) {
            setLanguage(savedLang);
          }
        } catch (err) {
          console.error('App: Failed to load settings', err);
        }

        dbReady = true;
      })
      .catch((err) => {
        console.error('App: DB init failed', err);
        // We still mark as ready to avoid blocking splash forever, 
        // DatabaseProvider will show its own error state.
        dbReady = true;
      });

    // Phase 2: Progress Animation (Smooth 0 to 0.9, then jump to 1.0 when DB ready)
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev < 0.9) {
          return prev + 0.05; // Quick initial progress
        }
        
        if (dbReady) {
          if (prev >= 1) {
            clearInterval(timer);
            setTimeout(() => setIsLoading(false), 200); // Small pause at 100%
            return 1;
          }
          return prev + 0.1; // Fast finish
        }

        return 0.9; // Wait for DB at 90%
      });
    }, 100);

    return () => clearInterval(timer);
  }, []);

  if (isLoading) {
    return (
      <SafeAreaProvider>
        <SplashScreen progress={progress} />
      </SafeAreaProvider>
    );
  }

  if (isOnboarding) {
    return (
      <SafeAreaProvider>
        <DatabaseProvider initialDb={db}>
          <StatusBar style="dark" />
          <NavigationContainer>
            <OnboardingStack.Navigator screenOptions={{ headerShown: false }}>
              <OnboardingStack.Screen name="LanguageSelection" component={LanguageSelectionScreen} />
              <OnboardingStack.Screen name="Welcome">
                {(props) => (
                  <WelcomeScreen 
                    {...props} 
                    onGetStarted={() => {
                      setIsOnboarding(false);
                      saveSetting('onboarding_completed', 'true');
                    }} 
                  />
                )}
              </OnboardingStack.Screen>
            </OnboardingStack.Navigator>
          </NavigationContainer>
        </DatabaseProvider>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <DatabaseProvider initialDb={db}>
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
