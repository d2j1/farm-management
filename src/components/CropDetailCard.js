import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

/**
 * Large crop detail card for the Crops screen.
 *
 * @param {Object} props
 * @param {Object} props.crop
 * @param {string} props.crop.name
 * @param {string} props.crop.icon          - MaterialIcons icon name
 * @param {string} props.crop.iconColor     - Icon tint color
 * @param {string} props.crop.iconBgClass   - NativeWind bg class for the icon circle
 * @param {string} props.crop.blobBgClass   - NativeWind bg class for the decorative blob
 * @param {string} props.crop.ringClass     - Ring/border accent class
 * @param {string} props.crop.location      - e.g. "East Field • 2 Acres"
 * @param {Object} props.crop.lastActivity  - { label, colorClass }
 * @param {Object} props.crop.upcoming      - { label, colorClass }
 * @param {string} props.crop.expenses
 * @param {string} props.crop.earnings
 */
export default function CropDetailCard({ crop, onPress }) {
  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={onPress}
      className="relative overflow-hidden rounded-2xl bg-white shadow-md border border-slate-100"
    >
      <View className="p-4">
        {/* Top row — icon + info */}
        <View className="flex-row gap-4 items-center mb-5">
          {/* Crop icon circle */}
          <View
            className={`h-20 w-20 rounded-full ${crop.iconBgClass} border-4 border-white items-center justify-center shadow-lg`}
          >
            <MaterialIcons name={crop.icon} size={36} color={crop.iconColor} />
          </View>

          {/* Text info */}
          <View className="flex-1">
            <View className="flex-row justify-between items-start">
              <Text className="text-xl font-black text-slate-900" numberOfLines={1}>
                {crop.name}
              </Text>
              <TouchableOpacity activeOpacity={0.6}>
                <MaterialIcons name="more-vert" size={20} color="#cbd5e1" />
              </TouchableOpacity>
            </View>

            {/* Location */}
            <View className="flex-row items-center gap-1 mt-0.5">
              <MaterialIcons name="location-on" size={12} color="#94a3b8" />
              <Text className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                {crop.location}
              </Text>
            </View>

            {/* Activity statuses */}
            <View className="mt-2 gap-1">
              <View className="flex-row items-center gap-1">
                <View className={`w-2 h-2 rounded-full ${crop.lastActivity.dotClass}`} />
                <Text
                  className={`text-[10px] font-bold uppercase tracking-widest ${crop.lastActivity.colorClass}`}
                >
                  LAST ACTIVITY: {crop.lastActivity.label}
                </Text>
              </View>
              <View className="flex-row items-center gap-1">
                <View className="w-2 h-2 rounded-full bg-blue-400" />
                <Text className="text-[10px] font-bold uppercase tracking-widest text-blue-400">
                  UPCOMING: {crop.upcoming.label}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Bottom row — expenses / earnings */}
        <View className="flex-row gap-2">
          {/* Expenses */}
          <View className="flex-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
            <View className="flex-row items-center gap-1.5 mb-1">
              <MaterialIcons name="arrow-downward" size={12} color="#ef4444" />
              <Text className="text-[9px] text-slate-400 uppercase font-black tracking-widest">
                Expenses
              </Text>
            </View>
            <Text className="text-lg font-black text-slate-800">{crop.expenses}</Text>
          </View>

          {/* Earnings */}
          <View className="flex-1 bg-primary/5 p-3 rounded-xl border border-primary/10">
            <View className="flex-row items-center gap-1.5 mb-1">
              <MaterialIcons name="arrow-upward" size={12} color="#3ce619" />
              <Text className="text-[9px] text-primary/70 uppercase font-black tracking-widest">
                Earnings
              </Text>
            </View>
            <Text className="text-lg font-black text-primary">{crop.earnings}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}
