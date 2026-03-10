import React from 'react';
import { ScrollView, View } from 'react-native';
import FilterButton from './FilterButton';

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
        {tabs.map((tab) => (
          <FilterButton
            key={tab}
            label={tab}
            isActive={tab === activeTab}
            onPress={() => onTabChange(tab)}
          />
        ))}
      </ScrollView>
    </View>
  );
}
