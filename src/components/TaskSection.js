import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export default function TaskSection({ navigation }) {
  return (
    <View className="p-4">
      <View className="bg-white dark:bg-slate-900 rounded-2xl shadow-md border border-slate-100 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <View className="flex-row items-center justify-between p-4 border-b border-slate-50 dark:border-slate-800">
          <Text className="text-slate-900 dark:text-white text-lg font-bold tracking-tight">Upcoming Tasks</Text>
          <View className="bg-primary/20 px-2 py-0.5 rounded-full">
            <Text className="text-primary text-[10px] font-bold uppercase">Next 24h</Text>
          </View>
        </View>

        {/* Task List */}
        <View className="p-4 gap-4">
          {/* Task 1 — Water Corn Section B */}
          <View className="flex-row items-center gap-4 border-l-4 border-primary pl-3">
            <View className="flex-1">
              <Text className="text-[10px] font-bold text-primary uppercase">Today • 2:00 PM</Text>
              <Text className="text-sm font-bold text-slate-900 dark:text-white">Water Corn Section B</Text>
              <Text className="text-xs text-slate-500">Based on soil moisture sensor #04</Text>
            </View>
            <TouchableOpacity className="h-8 w-8 rounded-full border border-slate-200 flex items-center justify-center">
              <MaterialIcons name="radio-button-unchecked" size={18} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          {/* Task 2 — Fertilizing Wheat Field (Ongoing) */}
          <View className="flex-row items-center gap-4 border-l-4 border-amber-500 pl-3">
            <View className="flex-1">
              <Text className="text-[10px] font-bold text-amber-500 uppercase">Ongoing</Text>
              <Text className="text-sm font-bold text-slate-900 dark:text-white">Fertilizing Wheat Field</Text>
              <Text className="text-xs text-slate-500">65% complete • Estimated 1hr left</Text>
            </View>
            <View className="h-8 w-8 rounded-full border-2 border-amber-500 flex items-center justify-center">
              <Text className="text-[9px] font-bold text-slate-900 dark:text-white">65%</Text>
            </View>
          </View>

          {/* Task 3 — Pest Inspection */}
          <View className="flex-row items-center gap-4 border-l-4 border-slate-300 pl-3">
            <View className="flex-1">
              <Text className="text-[10px] font-bold text-slate-400 uppercase">Tomorrow • 8:00 AM</Text>
              <Text className="text-sm font-bold text-slate-700 dark:text-slate-300">Pest Inspection</Text>
              <Text className="text-xs text-slate-400">Regular weekly maintenance</Text>
            </View>
            <TouchableOpacity className="h-8 w-8 rounded-full border border-slate-200 flex items-center justify-center">
              <MaterialIcons name="calendar-today" size={16} color="#cbd5e1" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer */}
        <View className="px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 gap-2">
          <View className="flex-row items-center justify-between">
            <TouchableOpacity
              onPress={() => navigation.navigate('Tasks', { openCreateTask: true })}
              className="flex-row items-center gap-1.5"
            >
              <MaterialIcons name="add-circle" size={18} color="#3ce619" />
              <Text className="text-primary text-sm font-bold">Create Task</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('Tasks')}>
              <Text className="text-primary text-sm font-bold">View All Tasks</Text>
            </TouchableOpacity>
          </View>

          <View className="items-center">
            <TouchableOpacity
              onPress={() => navigation.navigate('Tasks', { openCreateReminder: true })}
              className="flex-row items-center gap-1.5"
            >
              <MaterialIcons name="notifications-active" size={17} color="#3ce619" />
              <Text className="text-primary text-sm font-bold">Create Reminder</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}
