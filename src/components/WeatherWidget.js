import React from 'react';
import { View, Text } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export default function WeatherWidget() {
  return (
    <View className="px-4 pt-4">
      <View className="flex-row items-center justify-between gap-4 rounded-2xl bg-white dark:bg-slate-900 p-5 shadow-sm border border-primary/5 w-full">
        <View className="flex-row items-center gap-4">
          <MaterialIcons name="wb-sunny" size={36} color="#eab308" />
          <View>
            <Text className="text-2xl font-bold text-slate-900 dark:text-white leading-none">28°C</Text>
            <View className="mt-1">
              <Text className="text-primary font-black text-base uppercase tracking-tight">Sunny</Text>
              <Text className="text-slate-500 dark:text-slate-400 text-[10px] leading-tight mt-0.5">Ideal for irrigation</Text>
            </View>
          </View>
        </View>
        <View className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
          <MaterialIcons name="water-drop" size={24} color="#3ce619" />
        </View>
      </View>
    </View>
  );
}
