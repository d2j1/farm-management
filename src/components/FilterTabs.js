import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

/**
 * Reusable horizontal filter pill tabs.
 *
 * @param {Object} props
 * @param {string[]} props.tabs       - Array of tab labels.
 * @param {string}   props.activeTab  - Currently active tab label.
 * @param {(tab: string) => void} props.onTabChange - Callback when a tab is pressed.
 */
export default function FilterTabs({ tabs, activeTab, onTabChange }) {
  return (
    <View className="py-2">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 12, paddingVertical: 4 }}
        style={{ flexGrow: 0 }}
      >
        {tabs.map((tab) => {
          const isActive = tab === activeTab;

          return (
            <TouchableOpacity
              key={tab}
              onPress={() => onTabChange(tab)}
              activeOpacity={0.8}
              className={`h-10 rounded-full items-center justify-center border shadow-sm ${
                isActive
                  ? 'bg-white border-slate-100 px-1'
                  : 'bg-white border-slate-100 px-6'
              }`}
            >
              {isActive ? (
                <View className="bg-primary px-8 h-8 rounded-full items-center justify-center shadow-md">
                  <Text className="text-sm font-bold text-slate-900">{tab}</Text>
                </View>
              ) : (
                <Text className="text-sm font-bold text-slate-900">{tab}</Text>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}
