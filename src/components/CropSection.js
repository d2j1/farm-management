import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const CROPS_ROW_1 = [
  {
    name: 'Wheat',
    icon: 'grass',
    iconColor: '#d97706',
    bgClass: 'bg-amber-100',
    status: 'Fertilized 2d ago',
    statusClass: 'text-slate-500',
  },
  {
    name: 'Corn',
    icon: 'agriculture',
    iconColor: '#ca8a04',
    bgClass: 'bg-yellow-100',
    status: 'Critical',
    statusClass: 'text-red-500 font-medium uppercase',
    hasBadge: true,
  },
  {
    name: 'Lettuce',
    icon: 'eco',
    iconColor: '#059669',
    bgClass: 'bg-emerald-100',
    status: 'Harvested 1w ago',
    statusClass: 'text-slate-500',
  },
];

const CROPS_ROW_2 = [
  {
    name: 'Soybean',
    icon: 'spa',
    iconColor: '#2563eb',
    bgClass: 'bg-blue-100',
    status: 'Sown 5d ago',
    statusClass: 'text-slate-500',
  },
  {
    name: 'Carrot',
    icon: 'restaurant',
    iconColor: '#ea580c',
    bgClass: 'bg-orange-100',
    status: 'Needs Watering',
    statusClass: 'text-slate-500',
  },
  {
    name: 'Poultry',
    icon: 'egg',
    iconColor: '#9333ea',
    bgClass: 'bg-purple-100',
    status: 'Healthy',
    statusClass: 'text-slate-500',
  },
];

function CropCard({ crop }) {
  return (
    <View className="w-[140px] bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex-col items-center">
      <View className="relative">
        <View className={`h-16 w-16 rounded-full ${crop.bgClass} flex items-center justify-center mb-3`}>
          <MaterialIcons name={crop.icon} size={30} color={crop.iconColor} />
        </View>
        {crop.hasBadge && (
          <View className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full border-2 border-white dark:border-slate-900" />
        )}
      </View>
      <Text className="text-slate-900 dark:text-white font-bold text-base text-center">{crop.name}</Text>
      <Text className={`text-[11px] mt-1 leading-tight text-center ${crop.statusClass}`}>{crop.status}</Text>
    </View>
  );
}

export default function CropSection() {
  return (
    <View className="py-2">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 mb-4">
        <Text className="text-slate-900 dark:text-white text-lg font-bold tracking-tight">Your Crops</Text>
        <TouchableOpacity>
          <Text className="text-primary text-sm font-semibold">View All</Text>
        </TouchableOpacity>
      </View>

      {/* Row 1 */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 16, paddingBottom: 16 }}
      >
        {CROPS_ROW_1.map((crop) => (
          <CropCard key={crop.name} crop={crop} />
        ))}
      </ScrollView>

      {/* Row 2 */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 16, paddingBottom: 16 }}
      >
        {CROPS_ROW_2.map((crop) => (
          <CropCard key={crop.name} crop={crop} />
        ))}
      </ScrollView>

      {/* Add Button */}
      <View className="px-4 mt-2">
        <TouchableOpacity className="flex-row items-center gap-2">
          <MaterialIcons name="add-circle" size={18} color="#3ce619" />
          <Text className="text-primary text-sm font-semibold opacity-80">Add New Crop or Field</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
