import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export default function BottomNav() {
  return (
    <View className="flex-row justify-between items-center bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 px-6 py-3 pb-6">
      <TouchableOpacity className="flex-col items-center gap-1">
        <MaterialIcons name="home" size={24} color="#3ce619" />
        <Text className="text-[10px] font-bold text-primary">Home</Text>
      </TouchableOpacity>
      <TouchableOpacity className="flex-col items-center gap-1">
        <MaterialIcons name="eco" size={24} color="#94a3b8" />
        <Text className="text-[10px] font-medium text-slate-400">Crops</Text>
      </TouchableOpacity>
      <TouchableOpacity className="flex-col items-center gap-1">
        <MaterialIcons name="insights" size={24} color="#94a3b8" />
        <Text className="text-[10px] font-medium text-slate-400">Insights</Text>
      </TouchableOpacity>
      <TouchableOpacity className="flex-col items-center gap-1">
        <MaterialIcons name="person" size={24} color="#94a3b8" />
        <Text className="text-[10px] font-medium text-slate-400">Profile</Text>
      </TouchableOpacity>
    </View>
  );
}
