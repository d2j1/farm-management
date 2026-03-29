import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useLanguageStore } from '../utils/languageStore';
import ComingSoonModal from './ComingSoonModal';

const TABS = [
 { name: 'Home', icon: 'home', labelKey: 'home' },
 { name: 'Crops', icon: 'eco', labelKey: 'crops' },
 { name: 'Insights', icon: 'insights', labelKey: 'insights' },
 { name: 'Profile', icon: 'person', labelKey: 'profile' },
];

/**
 * Bottom navigation bar — designed to be used as `tabBar` in a Tab.Navigator.
 *
 * @param {Object} props
 * @param {Object} props.state - Navigation state from Tab.Navigator
 * @param {Object} props.navigation - Navigation object from Tab.Navigator
 */
// Screen names where the bottom tab bar should be hidden.
const HIDDEN_SCREENS = ['UpdateProfile', 'Tasks', 'CropDetails', 'CreateCrop', 'EditCrop'];

/**
 * Resolve the deepest focused route name from a tab route.
 * Handles both mounted nested state and yet-to-mount `params.screen` payloads.
 */
function getFocusedNestedRouteName(route) {
 if (!route) return undefined;

 // If nested navigator state exists, recurse into the focused child.
 const nestedState = route.state;
 if (nestedState?.routes?.length) {
 const childRoute = nestedState.routes[nestedState.index ?? 0];
 const deepName = getFocusedNestedRouteName(childRoute);
 return deepName || childRoute?.name;
 }

 // Deep navigate payload: navigation.navigate('Tab', { screen: 'Child' })
 if (typeof route.params?.screen === 'string') {
 return route.params.screen;
 }

 return route.name;
}

/**
 * Check if the focused screen inside a nested stack navigator should hide the tab bar.
 */
function shouldHideTabBar(tabState) {
 const activeRoute = tabState?.routes?.[tabState.index];
 const focusedRouteName = getFocusedNestedRouteName(activeRoute);
 return Boolean(
 focusedRouteName && HIDDEN_SCREENS.includes(focusedRouteName),
 );
}

export default function BottomNav({ state, navigation }) {
 const { t } = useLanguageStore();
 const [showComingSoon, setShowComingSoon] = useState(false);
 const currentRoute = state?.routes?.[state.index]?.name;

 // Hide tab bar on specific nested screens (e.g. UpdateProfile)
 if (shouldHideTabBar(state)) return null;

 return (
 <View className="flex-row justify-between items-center bg-white/95 border-t border-slate-100 px-6 py-3 pb-6">
 {TABS.map((tab) => {
 const isActive = currentRoute === tab.name;

 return (
 <TouchableOpacity
 key={tab.name}
 className="flex-col items-center gap-1"
 activeOpacity={0.7}
 onPress={() => {
 if (!navigation) return;

 if (tab.name === 'Insights') {
 setShowComingSoon(true);
 return;
 }

 if (tab.name === 'Crops') {
 navigation.navigate('Crops', { screen: 'CropsMain' });
 return;
 }

 if (!isActive) {
 navigation.navigate(tab.name);
 }
 }}
 >
 <MaterialIcons
 name={tab.icon}
 size={22}
 color={isActive ? '#166534' : '#94a3b8'}
 />
 <Text
 className={`text-xs ${isActive ? 'font-bold text-primary' : 'font-medium text-slate-400'
 }`}
 >
 {t(tab.labelKey)}
 </Text>
 </TouchableOpacity>
 );
 })}

 <ComingSoonModal
 visible={showComingSoon}
 onClose={() => setShowComingSoon(false)}
 />
 </View>
 );
}



