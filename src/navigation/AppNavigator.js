import React from 'react';
import { useColorScheme } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import HomeScreen from '../screens/HomeScreen';
import CropsScreen from '../screens/CropsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import KnowledgeHubScreen from '../screens/KnowledgeHubScreen';
import SettingsScreen from '../screens/SettingsScreen';
import CreateCropScreen from '../screens/CreateCropScreen';
import CropWorkspaceScreen from '../screens/CropWorkspaceScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function HomeTabs() {
    const scheme = useColorScheme();
    const isDark = scheme === 'dark';
    const { t } = useTranslation();

    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;

                    if (route.name === 'Home') {
                        iconName = 'home';
                    } else if (route.name === 'Crops') {
                        iconName = 'eco';
                    } else if (route.name === 'Learn') {
                        iconName = 'menu-book';
                    } else if (route.name === 'Settings') {
                        iconName = 'person';
                    }

                    // Using MaterialIcons to match the HTML design
                    return <MaterialIcons name={iconName} size={28} color={color} />;
                },
                tabBarActiveTintColor: '#3ce619',
                tabBarInactiveTintColor: isDark ? '#94a3b8' : '#94a3b8',
                tabBarStyle: {
                    backgroundColor: isDark ? '#0f172a' : '#ffffff',
                    borderTopColor: isDark ? '#1e293b' : '#f1f5f9',
                    borderTopWidth: 1,
                    paddingBottom: 12,
                    paddingTop: 12,
                    height: 65,
                    elevation: 0, // Remove android shadow to match flat design
                    shadowOpacity: 0 // Remove ios shadow
                },
                tabBarLabelStyle: {
                    fontSize: 10,
                    fontWeight: 'bold',
                    marginTop: -5
                },
            })}
        >
            <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: 'Home' }} />
            <Tab.Screen name="Crops" component={CropsScreen} options={{ tabBarLabel: 'Crops' }} />
            <Tab.Screen name="Learn" component={KnowledgeHubScreen} options={{ tabBarLabel: 'Information' }} />
            <Tab.Screen name="Settings" component={SettingsScreen} options={{ tabBarLabel: 'Profile' }} />
        </Tab.Navigator>
    );
}

export default function AppNavigator() {
    const scheme = useColorScheme();
    const isDark = scheme === 'dark';
    const { t } = useTranslation();

    return (
        <NavigationContainer theme={isDark ? DarkTheme : DefaultTheme}>
            <Stack.Navigator
                screenOptions={{
                    headerShown: false,
                    headerStyle: { backgroundColor: isDark ? '#121212' : '#1B5E20' },
                    headerTintColor: '#fff',
                    headerTitleStyle: { fontWeight: 'bold' },
                }}
            >
                <Stack.Screen name="MainTabs" component={HomeTabs} />
                <Stack.Screen name="Profile" component={ProfileScreen} options={{ headerShown: false }} />
                <Stack.Screen name="CreateCrop" component={CreateCropScreen} options={{ headerShown: false }} />
                <Stack.Screen name="CropWorkspace" component={CropWorkspaceScreen} options={{ headerShown: false }} />
            </Stack.Navigator>

        </NavigationContainer>
    );
}
