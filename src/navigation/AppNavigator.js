import React from 'react';
import { useColorScheme } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import HomeScreen from '../screens/HomeScreen';
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

    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;

                    if (route.name === 'Home') {
                        iconName = focused ? 'home' : 'home-outline';
                    } else if (route.name === 'Learn') {
                        iconName = focused ? 'book' : 'book-outline';
                    } else if (route.name === 'Settings') {
                        iconName = focused ? 'settings' : 'settings-outline';
                    }

                    return <Ionicons name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: isDark ? '#81C784' : '#2E7D32',
                tabBarInactiveTintColor: isDark ? '#aaa' : 'gray',
                tabBarStyle: {
                    backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
                    borderTopColor: isDark ? '#333' : '#EEE',
                    paddingBottom: 10,
                    paddingTop: 10,
                    height: 70,
                },
                tabBarLabelStyle: {
                    fontSize: 12,
                    fontWeight: '500',
                },
            })}
        >
            <Tab.Screen name="Home" component={HomeScreen} />
            <Tab.Screen name="Learn" component={KnowledgeHubScreen} />
            <Tab.Screen name="Settings" component={SettingsScreen} />
        </Tab.Navigator>
    );
}

export default function AppNavigator() {
    const scheme = useColorScheme();
    const isDark = scheme === 'dark';

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
                <Stack.Screen name="Profile" component={ProfileScreen} options={{ headerShown: true }} />
                <Stack.Screen name="CreateCrop" component={CreateCropScreen} options={{ headerShown: true, title: 'New Crop Instance' }} />
                <Stack.Screen name="CropWorkspace" component={CropWorkspaceScreen} options={{ headerShown: true, title: 'Workspace' }} />
            </Stack.Navigator>

        </NavigationContainer>
    );
}
