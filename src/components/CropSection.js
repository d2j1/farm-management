import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export default function CropSection() {
  return (
    <View className="py-2">
      <View className="flex-row items-center justify-between px-4 mb-4">
        <Text className="text-slate-900 dark:text-white text-lg font-bold tracking-tight">Your Crops</Text>
      </View>
      <View className="px-4">
        <TouchableOpacity className="w-full bg-white dark:bg-slate-900 border-2 border-dashed border-primary/30 rounded-2xl p-8 flex-col items-center justify-center">
          <View className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <MaterialIcons name="eco" size={36} color="#3ce619" />
          </View>
          <Text className="text-base font-bold text-slate-900 dark:text-white mb-1">Add Your First Crop</Text>
          <Text className="text-xs text-slate-500 dark:text-slate-400">Track activities, expenses and earnings of your crop</Text>
          <View className="mt-4 flex-row items-center gap-1.5">
            <MaterialIcons name="add-circle" size={18} color="#3ce619" />
            <Text className="text-primary text-sm font-bold">Create Crop</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}
