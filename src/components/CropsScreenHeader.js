import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useLanguageStore } from '../utils/languageStore';

export default function CropsScreenHeader({ onNotificationPress }) {
  const { t } = useLanguageStore();
  return (
    <View className="flex-row items-center bg-white px-4 py-4 border-b border-slate-100">
      {/* Left — Spacer */}
      <View className="w-10" />

      {/* Center — Title */}
      <View className="flex-1 items-center">
        <Text className="text-xl font-bold tracking-tight text-black">
          {t('yourCrops')}
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
