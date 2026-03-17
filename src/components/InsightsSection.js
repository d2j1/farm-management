import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useNetInfo } from '@react-native-community/netinfo';
import { useLanguageStore } from '../utils/languageStore';

export default function InsightsSection() {
  const navigation = useNavigation();
  const { t } = useLanguageStore();
  const netInfo = useNetInfo();
  const isOffline = netInfo.isConnected === false;

  const INSIGHTS = [
    {
      title: 'Organic',
      description: 'Boost nitrogen with clover.',
      icon: 'eco',
      iconColor: '#166534',
      bgClass: 'bg-green-100',
    },
    {
      title: 'Weather Alert',
      description: 'High humidity Friday.',
      icon: 'thunderstorm',
      iconColor: '#2563eb',
      bgClass: 'bg-blue-100',
    },
    {
      title: 'Economy',
      description: 'Wheat prices up 5%.',
      icon: 'trending-up',
      iconColor: '#d97706',
      bgClass: 'bg-amber-100',
    },
  ];

  return (
    <View className="py-4">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 mb-3">
        <Text className="text-xs font-semibold uppercase tracking-widest text-slate-500">
          {t('quickInsights')}
        </Text>
        <TouchableOpacity
          activeOpacity={0.75}
          onPress={() => navigation?.navigate('Insights')}
        >
          <Text className="text-primary text-xs font-bold uppercase tracking-wider">
            {t('seeAll')}
          </Text>
        </TouchableOpacity>
      </View>

      {isOffline ? (
        /* No Internet / No Data State */
        <View className="px-4">
          <View className="w-full bg-white dark:bg-slate-900 rounded-2xl p-6 items-center justify-center border border-slate-100 dark:border-slate-800 shadow-sm">
            <View className="h-12 w-12 rounded-full bg-slate-50 dark:bg-slate-800 items-center justify-center mb-3">
              <MaterialIcons name="cloud-off" size={30} color="#94a3b8" />
            </View>
            <Text className="text-slate-900 dark:text-white font-bold text-sm">
              {t('noInternet')}
            </Text>
            <Text className="text-slate-500 dark:text-slate-400 text-xs mt-1 text-center">
              {t('unableFetchInsights')}
            </Text>
            <TouchableOpacity 
              className="mt-4 flex-row items-center gap-1"
              onPress={() => netInfo.refresh?.()}
            >
              <MaterialIcons name="refresh" size={14} color="#166534" />
              <Text className="text-primary text-xs font-bold">{t('retry')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        /* Insight Cards */
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 16, paddingBottom: 16 }}
        >
          {INSIGHTS.map((insight) => (
            <View
              key={insight.title}
              className="w-[220px] bg-white dark:bg-slate-900 p-3 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 flex-row gap-3"
            >
              <View className={`h-7 w-7 rounded-lg ${insight.bgClass} flex items-center justify-center`}>
                <MaterialIcons name={insight.icon} size={18} color={insight.iconColor} />
              </View>
              <View className="flex-1">
                <Text className="text-base font-bold text-slate-900 dark:text-white leading-tight">{insight.title}</Text>
                <Text className="text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed" numberOfLines={2}>
                  {insight.description}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}



