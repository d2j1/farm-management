import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useLanguageStore } from '../utils/languageStore';

export default function InsightsSection() {
  const navigation = useNavigation();
  const { t } = useLanguageStore();

  const INSIGHTS = [
    {
      title: 'Organic',
      description: 'Boost nitrogen with clover.',
      icon: 'eco',
      iconColor: '#16a34a',
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

      {/* Insight Cards */}
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
    </View>
  );
}



