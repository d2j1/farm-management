import React from 'react';
import { View, Text } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

/**
 * Action Center — green-tinted stats panel showing Pending tasks and Reminders counts.
 *
 * @param {Object} props
 * @param {number} props.pendingCount   - Number of pending tasks.
 * @param {number} props.reminderCount  - Number of active reminders.
 */
export default function ActionCenter({ pendingCount = 12, reminderCount = 5 }) {
  const pad = (n) => String(n).padStart(2, '0');

  return (
    <View className="bg-primary/10 border border-primary/20 rounded-2xl p-5">
      {/* Header row */}
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
          Action Center
        </Text>
        <View className="bg-primary/20 px-2 py-0.5 rounded">
          <Text className="text-[10px] font-bold uppercase text-primary">
            Global Stats
          </Text>
        </View>
      </View>

      {/* Stats grid */}
      <View className="flex-row gap-3">
        {/* Pending */}
        <View className="flex-1 bg-white/40 p-3 rounded-xl border border-white/50">
          <View className="flex-row items-center gap-2 mb-1">
            <MaterialIcons name="assignment-turned-in" size={14} color="#3ce619" />
            <Text className="text-[10px] text-slate-500 font-bold uppercase">
              Pending
            </Text>
          </View>
          <Text className="text-2xl font-bold text-slate-900">{pad(pendingCount)}</Text>
        </View>

        {/* Reminders */}
        <View className="flex-1 bg-white/40 p-3 rounded-xl border border-white/50">
          <View className="flex-row items-center gap-2 mb-1">
            <MaterialIcons name="notifications-active" size={14} color="#f97316" />
            <Text className="text-[10px] text-slate-500 font-bold uppercase">
              Reminders
            </Text>
          </View>
          <Text className="text-2xl font-bold text-slate-900">{pad(reminderCount)}</Text>
        </View>
      </View>
    </View>
  );
}
