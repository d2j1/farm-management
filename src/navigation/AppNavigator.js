import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import KnowledgeHubScreen from '../screens/KnowledgeHubScreen';
import SettingsScreen from '../screens/SettingsScreen';
import CreateCropScreen from '../screens/CreateCropScreen';
import CropWorkspaceScreen from '../screens/CropWorkspaceScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function HomeTabs() {
    return (
        <Tab.Navigator screenOptions={{ headerShown: false }}>
            <Tab.Screen name="Home" component={HomeScreen} />
            <Tab.Screen name="Learn" component={KnowledgeHubScreen} />
            <Tab.Screen name="Settings" component={SettingsScreen} />
        </Tab.Navigator>
    );
}

export default function AppNavigator() {
    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                <Stack.Screen name="MainTabs" component={HomeTabs} />
                <Stack.Screen name="Profile" component={ProfileScreen} options={{ headerShown: true }} />
                <Stack.Screen name="CreateCrop" component={CreateCropScreen} options={{ headerShown: true, title: 'New Crop Instance' }} />
                <Stack.Screen name="CropWorkspace" component={CropWorkspaceScreen} options={{ headerShown: true, title: 'Workspace' }} />
            </Stack.Navigator>
        </NavigationContainer>
    );
}
