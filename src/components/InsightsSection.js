import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export default function InsightsSection() {
  return (
    <View className="py-4">
      <View className="flex-row items-center justify-between px-4 mb-3">
        <Text className="text-slate-900 dark:text-white text-lg font-bold tracking-tight">Quick Insights</Text>
        <TouchableOpacity disabled>
          <Text className="text-slate-400 text-sm font-semibold">See All</Text>
        </TouchableOpacity>
      </View>
      <View className="px-4">
        <View className="w-full bg-white dark:bg-slate-900 rounded-2xl p-6 flex-col items-center justify-center border border-slate-100 dark:border-slate-800 shadow-sm">
          <View className="h-12 w-12 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-3">
            <MaterialIcons name="cloud-off" size={28} color="#94a3b8" />
          </View>
          <Text className="text-slate-900 dark:text-white font-bold text-sm">No Internet Connection</Text>
          <Text className="text-slate-500 dark:text-slate-400 text-xs mt-1 text-center">Unable to fetch insights. Check your connection.</Text>
          <TouchableOpacity className="mt-4 flex-row items-center gap-1">
            <MaterialIcons name="refresh" size={14} color="#3ce619" />
            <Text className="text-primary text-xs font-bold">Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
