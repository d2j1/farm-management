import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

/**
 * Extract YouTube video ID from a standard or short URL.
 */
function getYouTubeVideoId(url) {
  if (!url) return null;
  const match = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

/**
 * Video card for the Quick Insights screen.
 *
 * @param {Object}  props
 * @param {string}  props.category   - Category label (e.g. "Soil", "Pests").
 * @param {string}  props.duration   - Video duration (e.g. "3:45 min").
 * @param {string}  props.title      - Video title.
 * @param {string}  props.icon       - MaterialIcons icon name (fallback if no thumbnail).
 * @param {string}  [props.url]      - YouTube video URL (used to fetch thumbnail).
 * @param {() => void} [props.onWatch] - Callback when "Watch Video" is pressed.
 */
export default function VideoCard({ category, duration, title, icon, url, onWatch }) {
  const videoId = getYouTubeVideoId(url);
  const thumbnailUri = videoId
    ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
    : null;

  return (
    <View className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
      {/* ─── Thumbnail area ──────────────────────── */}
      <TouchableOpacity
        className="w-full aspect-video bg-slate-200 items-center justify-center"
        activeOpacity={0.85}
        onPress={onWatch}
      >
        {thumbnailUri ? (
          <Image
            source={{ uri: thumbnailUri }}
            className="absolute inset-0 w-full h-full"
            resizeMode="cover"
          />
        ) : (
          <MaterialIcons name={icon} size={64} color="#cbd5e1" />
        )}

        {/* Overlay with play button */}
        <View className="absolute inset-0 bg-black/10 items-center justify-center">
          <View className="w-14 h-14 bg-primary rounded-full items-center justify-center shadow-lg">
            <MaterialIcons name="play-arrow" size={30} color="#000" />
          </View>
        </View>
      </TouchableOpacity>

      {/* ─── Info section ────────────────────────── */}
      <View className="p-4 gap-3">
        {/* Category + duration */}
        <View className="flex-row items-center justify-between">
          <View className="px-2 py-0.5 bg-primary/10 rounded">
            <Text className="text-primary text-[10px] font-bold uppercase tracking-widest">
              {category}
            </Text>
          </View>

          <View className="flex-row items-center gap-1">
            <MaterialIcons name="play-circle-outline" size={14} color="#64748b" />
            <Text className="text-slate-500 text-xs font-medium">{duration}</Text>
          </View>
        </View>

        {/* Title */}
        <Text className="text-slate-900 font-bold text-lg leading-snug">{title}</Text>

        {/* Watch button */}
        <TouchableOpacity
          className="w-full py-3 bg-primary rounded-lg flex-row items-center justify-center gap-2"
          activeOpacity={0.85}
          onPress={onWatch}
        >
          <MaterialIcons name="play-arrow" size={20} color="#000" />
          <Text className="text-black font-bold text-sm">Watch Video</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

