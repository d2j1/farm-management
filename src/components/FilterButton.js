import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

/**
 * Reusable filter pill button with premium styling.
 * 
 * @param {Object} props
 * @param {string} props.label - The text to display.
 * @param {boolean} props.isActive - Whether the button is currently active.
 * @param {() => void} props.onPress - Callback when the button is pressed.
 */
export default function FilterButton({ label, isActive, onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      className={`h-10 rounded-full items-center justify-center border shadow-sm ${
        isActive
          ? 'bg-white border-slate-100 px-1'
          : 'bg-white border-slate-100 px-6'
      }`}
    >
      {isActive ? (
        <View className="bg-primary px-8 h-8 rounded-full items-center justify-center shadow-md">
          <Text className="text-sm font-bold text-slate-900">{label}</Text>
        </View>
      ) : (
        <Text className="text-sm font-bold text-slate-900">{label}</Text>
      )}
    </TouchableOpacity>
  );
}
