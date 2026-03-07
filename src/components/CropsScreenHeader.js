import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export default function CropsScreenHeader({ onMenuPress, onNotificationPress }) {
  return (
    <View className="flex-row items-center bg-white px-4 py-4 border-b border-slate-100">
      {/* Left — Menu */}
      <View className="w-10">
        <TouchableOpacity
          className="p-2 -ml-2 rounded-full"
          onPress={onMenuPress}
          activeOpacity={0.7}
        >
          <MaterialIcons name="menu" size={24} color="#94a3b8" />
        </TouchableOpacity>
      </View>

      {/* Center — Title */}
      <View className="flex-1 items-center">
        <Text className="text-slate-900 text-lg font-extrabold tracking-tight">
          Your Crops
        </Text>
      </View>

      {/* Right — Notification Bell */}
      <View className="w-10 items-end">
        <TouchableOpacity
          className="flex items-center justify-center rounded-full h-10 w-10 bg-[#e8f5e9]"
          onPress={onNotificationPress}
          activeOpacity={0.7}
        >
          <MaterialIcons name="notifications" size={20} color="#3ce619" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
