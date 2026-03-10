import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAgriWeather } from '../hooks/useAgriWeather';
import { useLanguageStore } from '../utils/languageStore';

export default function WeatherWidget() {
  const { data, loading, error } = useAgriWeather();
  const t = useLanguageStore((state) => state.t);
  const languageCode = useLanguageStore((state) => state.languageCode);

  if (loading) {
    return (
      <View className="px-4 pt-4">
        <View className="flex-row items-center justify-center gap-4 rounded-2xl bg-white dark:bg-slate-900 p-5 shadow-sm border border-primary/5 w-full min-h-[100px]">
          <ActivityIndicator size="small" color="#3ce619" />
        </View>
      </View>
    );
  }

  if (error || !data) {
    return (
      <View className="px-4 pt-4">
        <View className="flex-row items-center justify-between gap-4 rounded-2xl bg-white dark:bg-slate-900 p-5 shadow-sm border border-primary/5 w-full min-h-[100px]">
          <View className="flex-row items-center gap-4">
            <MaterialIcons name="cloud-off" size={36} color="#94a3b8" />
            <View>
              <Text className="text-2xl font-bold text-slate-900 dark:text-white leading-none">--</Text>
              <View className="mt-1">
                <Text className="text-primary font-black text-base uppercase tracking-tight">{t('unavailable')}</Text>
                <Text className="text-slate-500 dark:text-slate-400 text-[10px] leading-tight mt-0.5">{t('checkNetwork')}</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View className="px-4 pt-4">
      <View className="rounded-2xl bg-white dark:bg-slate-900 p-5 shadow-sm border border-primary/5 w-full">
        <View className="flex-row items-center justify-between gap-4 mb-4">
          <View className="flex-row items-center gap-4">
            <MaterialIcons name={data.isSunny ? (data.isDay ? "wb-sunny" : "nightlight-round") : "cloud"} size={36} color={data.isSunny ? (data.isDay ? "#eab308" : "#94a3b8") : "#94a3b8"} />
            <View>
              <Text className="text-2xl font-bold text-slate-900 dark:text-white leading-none">{data.temperature}°C</Text>
              <View className="mt-1">
                <Text className="text-primary font-black text-base uppercase tracking-tight">{data.condition}</Text>
                <Text className="text-slate-500 dark:text-slate-400 text-[10px] leading-tight mt-0.5">{data.city}</Text>
                <Text className="text-slate-400 dark:text-slate-500 text-[8px] leading-tight mt-0.5 italic">{t('approxLocation')}</Text>
              </View>
            </View>
          </View>
          <View className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
            <MaterialIcons name="water-drop" size={24} color="#3ce619" />
          </View>
        </View>

        <View className="flex-row items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3 mt-1">
          <View className="flex-row items-center gap-1.5">
            <MaterialIcons name="water" size={14} color="#64748b" />
            <Text className="text-slate-500 dark:text-slate-400 text-xs font-semibold">{data.humidity}% {t('hum')}</Text>
          </View>
          <View className="flex-row items-center gap-1.5">
            <MaterialIcons name="air" size={14} color="#64748b" />
            <Text className="text-slate-500 dark:text-slate-400 text-xs font-semibold">{data.windSpeed} km/h {t('wind')}</Text>
          </View>
          <View className="flex-row items-center gap-1.5">
            <MaterialIcons name="grass" size={14} color="#64748b" />
            <Text className="text-slate-500 dark:text-slate-400 text-xs font-semibold">{data.soilMoisture}% {t('soil')}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}
