import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const TABS = [
  { name: 'Home', icon: 'home', label: 'Home' },
  { name: 'Crops', icon: 'eco', label: 'Crops' },
  { name: 'Insights', icon: 'insights', label: 'Insights' },
  { name: 'Profile', icon: 'person', label: 'Profile' },
];

/**
 * Bottom navigation bar — designed to be used as `tabBar` in a Tab.Navigator.
 *
 * @param {Object} props
 * @param {Object} props.state       - Navigation state from Tab.Navigator
 * @param {Object} props.navigation  - Navigation object from Tab.Navigator
 */
export default function BottomNav({ state, navigation }) {
  const currentRoute = state?.routes?.[state.index]?.name;

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
              if (navigation && !isActive) {
                navigation.navigate(tab.name);
              }
            }}
          >
            <MaterialIcons
              name={tab.icon}
              size={24}
              color={isActive ? '#3ce619' : '#94a3b8'}
            />
            <Text
              className={`text-[10px] ${
                isActive ? 'font-bold text-primary' : 'font-medium text-slate-400'
              }`}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
