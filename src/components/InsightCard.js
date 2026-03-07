import React from 'react';
import { View, Text } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

/**
 * Insight article card.
 *
 * @param {Object}  props
 * @param {string}  props.category    - Category label (e.g. "Soil", "Pests").
 * @param {string}  props.readTime    - Read duration text (e.g. "5 min read").
 * @param {string}  props.title       - Article title.
 * @param {string}  props.description - Short description (2-line clamp).
 * @param {string}  props.icon        - MaterialIcons icon name.
 */
export default function InsightCard({ category, readTime, title, description, icon }) {
  return (
    <View className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm flex-col gap-3">
      {/* Top row — category badge + read time */}
      <View className="flex-row items-center justify-between">
        <View className="px-2 py-0.5 bg-primary/10 rounded">
          <Text className="text-primary text-[10px] font-bold uppercase tracking-widest">
            {category}
          </Text>
        </View>

        <View className="flex-row items-center gap-1">
          <MaterialIcons name="schedule" size={14} color="#94a3b8" />
          <Text className="text-slate-400 text-xs">{readTime}</Text>
        </View>
      </View>

      {/* Bottom row — text + icon thumbnail */}
      <View className="flex-row gap-4">
        <View className="flex-1">
          <Text className="text-slate-900 font-bold text-base mb-1">{title}</Text>
          <Text
            className="text-slate-500 text-sm leading-relaxed"
            numberOfLines={2}
          >
            {description}
          </Text>
        </View>

        <View className="w-20 h-20 rounded-lg bg-primary/5 items-center justify-center shrink-0 border border-primary/10">
          <MaterialIcons name={icon} size={30} color="#3ce619" style={{ opacity: 0.5 }} />
        </View>
      </View>
    </View>
  );
}
