import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

/**
 * Offline / no-internet placeholder shown when network is unavailable.
 *
 * @param {Object}  props
 * @param {() => void} props.onRetry - Callback when "Try Again" is pressed.
 */
export default function NoInternetView({ onRetry }) {
  return (
    <View className="flex-1 px-6 py-12 items-center justify-center">
      {/* Icon circle */}
      <View className="w-24 h-24 mb-6 rounded-full bg-primary/10 items-center justify-center">
        <MaterialIcons name="cloud-off" size={48} color="#166534" />
      </View>

      {/* Heading */}
      <Text className="text-2xl font-bold text-slate-900 mb-3">
        No Internet Connection
      </Text>

      {/* Description */}
      <Text className="text-slate-500 text-base leading-relaxed text-center max-w-[280px] mb-8">
        It looks like you're offline. Please check your network settings and try
        again to fetch quick insights.
      </Text>

      {/* Retry button */}
      <TouchableOpacity
        className="w-full max-w-[280px] py-4 bg-primary rounded-xl shadow-lg items-center justify-center"
        activeOpacity={0.85}
        onPress={onRetry}
      >
        <Text className="text-black font-bold text-base">Try Again</Text>
      </TouchableOpacity>
    </View>
  );
}


