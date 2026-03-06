import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export default function TaskSection() {
  return (
    <View className="p-4">
      <View className="bg-white dark:bg-slate-900 rounded-2xl shadow-md border border-slate-100 dark:border-slate-800 overflow-hidden">
        <View className="flex-row items-center justify-between p-4 border-b border-slate-50 dark:border-slate-800">
          <Text className="text-slate-900 dark:text-white text-lg font-bold tracking-tight">Upcoming Tasks</Text>
          <View className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
            <Text className="text-slate-500 text-[10px] font-bold uppercase">0 Pending</Text>
          </View>
        </View>
        <View className="p-8 flex-col items-center text-center">
          <View className="h-16 w-16 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-4">
            <MaterialIcons name="assignment-late" size={36} color="#cbd5e1" />
          </View>
          <Text className="text-base font-bold text-slate-900 dark:text-white mb-2 text-center">No tasks scheduled yet</Text>
          <Text className="text-xs text-slate-500 dark:text-slate-400 mb-6 max-w-[200px] text-center">Stay organized by creating your first farm maintenance task.</Text>
          <TouchableOpacity className="w-full max-w-xs bg-primary py-3 rounded-xl flex-row items-center justify-center gap-2 shadow-lg shadow-primary/20">
            <MaterialIcons name="add-circle" size={20} color="#0f172a" />
            <Text className="text-slate-900 font-bold">Create Your First Task</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
