import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export default function Header() {
  return (
    <View className="flex-row items-center bg-white dark:bg-slate-900 p-4 sticky top-0 z-20 shadow-sm justify-between">
      <View className="flex-row items-center gap-3">
        <View className="h-10 w-10 overflow-hidden rounded-full border-2 border-primary/20">
          <View className="w-full h-full bg-primary/10 flex items-center justify-center">
            <MaterialIcons name="person" size={24} color="#3ce619" />
          </View>
        </View>
        <View>
          <Text className="text-slate-900 dark:text-white text-lg font-bold leading-tight">Hello, Farmer!</Text>
          <Text className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Proactive Mode</Text>
        </View>
      </View>
      <View className="flex-row items-center gap-2">
        <TouchableOpacity className="flex items-center justify-center rounded-full h-10 w-10 bg-primary/10">
          <MaterialIcons name="notifications" size={20} color="#3ce619" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
