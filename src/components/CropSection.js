import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useDatabase } from '../database/DatabaseProvider';
import { getAllCrops } from '../database/cropService';
import { getNextUpcomingTaskPerCrop, getLastTaskPerCrop } from '../database/taskService';
import { useLanguageStore } from '../utils/languageStore';

function getCropVisuals(cropName) {
  const name = (cropName || '').toLowerCase();

  if (name.includes('tomato') || name.includes('chili') || name.includes('pepper')) {
    return { icon: 'restaurant', iconColor: '#ef4444', iconBg: '#fef2f2' };
  }
  if (name.includes('corn') || name.includes('maize')) {
    return { icon: 'grass', iconColor: '#ca8a04', iconBg: '#fefce8' };
  }
  if (name.includes('rice') || name.includes('paddy')) {
    return { icon: 'grass', iconColor: '#16a34a', iconBg: '#f0fdf4' };
  }
  if (name.includes('wheat')) {
    return { icon: 'grass', iconColor: '#d97706', iconBg: '#fffbeb' };
  }
  if (name.includes('soybean') || name.includes('soy')) {
    return { icon: 'spa', iconColor: '#2563eb', iconBg: '#eff6ff' };
  }
  if (name.includes('carrot') || name.includes('lettuce') || name.includes('vegetable')) {
    return { icon: 'eco', iconColor: '#059669', iconBg: '#ecfdf5' };
  }
  return { icon: 'agriculture', iconColor: '#ea580c', iconBg: '#fff7ed' };
}

function CropCard({ crop, upcomingTask, lastTask, onPress, t }) {
  const { icon, iconColor, iconBg } = getCropVisuals(crop.cropName);
  const isActive = (crop.status || 'active') === 'active';

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={styles.card}
    >
      {/* Status badge — absolutely positioned top-right */}
      <View
        style={[
          styles.statusBadge,
          { backgroundColor: isActive ? 'rgba(22,163,74,0.1)' : 'rgba(148,163,184,0.15)' },
        ]}
      >
        <View
          style={[styles.statusDot, { backgroundColor: isActive ? '#16a34a' : '#94a3b8' }]}
        />
        <Text style={[styles.statusText, { color: isActive ? '#16a34a' : '#94a3b8' }]}>
          {isActive ? t('active') : t('inactive')}
        </Text>
      </View>

      {/* Icon circle */}
      <View
        className="h-20 w-20 rounded-full items-center justify-center mb-4"
        style={{ backgroundColor: iconBg, marginTop: 18 }}
      >
        <MaterialIcons name={icon} size={32} color={iconColor} />
      </View>

      {/* Crop name */}
      <Text
        className="text-slate-900 font-bold text-base text-center"
        numberOfLines={1}
      >
        {crop.cropName}
      </Text>

      {/* Land nickname */}
      <Text
        className="text-sm mt-0.5 text-slate-400 text-center"
        numberOfLines={1}
      >
        {crop.landNickname}
      </Text>

      {/* Upcoming / last task strip — hidden when neither exists */}
      <View style={styles.upcomingRow}>
        <MaterialIcons
          name={upcomingTask ? 'event' : lastTask ? 'history' : 'check-circle'}
          size={16}
          color={upcomingTask ? '#3b82f6' : lastTask ? '#94a3b8' : '#16a34a'}
        />
        <Text
          style={[
            styles.upcomingText,
            { color: upcomingTask ? '#3b82f6' : lastTask ? '#94a3b8' : '#16a34a' },
          ]}
          numberOfLines={1}
        >
          {upcomingTask
            ? upcomingTask.taskName
            : lastTask
            ? lastTask.taskName
            : t('allCaughtUp')}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export default function CropSection() {
  const navigation = useNavigation();
  const db = useDatabase();
  const { t } = useLanguageStore();
  const [crops, setCrops] = useState([]);
  const [upcomingTasksMap, setUpcomingTasksMap] = useState({});
  const [lastTasksMap, setLastTasksMap] = useState({});

  const blinkAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(blinkAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(blinkAnim, {
          toValue: 0.3,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [blinkAnim]);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      Promise.all([getAllCrops(db), getNextUpcomingTaskPerCrop(db), getLastTaskPerCrop(db)])
        .then(([cropRows, upcomingMap, lastMap]) => {
          if (!cancelled) {
            setCrops(cropRows);
            setUpcomingTasksMap(upcomingMap);
            setLastTasksMap(lastMap);
          }
        })
        .catch((err) => console.error('CropSection: failed to load crops', err));
      return () => { cancelled = true; };
    }, [db]),
  );

  const openCropDetails = (row) => {
    const crop = {
      id: String(row.id),
      dbId: row.id,
      name: row.cropName,
      location: `${row.landNickname} • ${row.totalArea} ${row.areaUnit}`,
      status: row.status || 'active',
    };
    navigation?.navigate('Crops', {
      screen: 'CropDetails',
      initial: false,
      params: { crop },
    });
  };

  return (
    <View className="py-2">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 mb-4">
        <View className="flex-row items-center gap-2">
          <Text className="text-xs font-semibold uppercase tracking-widest text-slate-500">
            {t('yourCrops')}
          </Text>
          {crops.length > 0 && (
            <Animated.View style={{ opacity: blinkAnim }} className="flex-row items-center bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
              <MaterialIcons name="arrow-forward" size={12} color="#166534" />
              <Text className="text-[9px] font-bold text-primary uppercase ml-1">Swipe</Text>
            </Animated.View>
          )}
        </View>
        <TouchableOpacity
          activeOpacity={0.75}
          onPress={() => navigation?.navigate('Crops', { screen: 'CropsMain' })}
        >
          <Text className="text-primary text-xs font-bold uppercase tracking-wider">
            {t('viewAll')}
          </Text>
        </TouchableOpacity>
      </View>

      {crops.length === 0 ? (
        <View className="px-4 py-6 items-center">
          <Text className="text-slate-400 text-sm">
            {t('noCrops')}
          </Text>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollRow}
        >
          {crops.map((crop) => (
            <CropCard
              key={crop.id}
              crop={crop}
              upcomingTask={upcomingTasksMap[crop.id]}
              lastTask={lastTasksMap[crop.id]}
              onPress={() => openCropDetails(crop)}
              t={t}
            />
          ))}
        </ScrollView>
      )}

      {/* Add Button */}
      <View className="px-4 mt-2">
        <TouchableOpacity
          className="flex-row items-center gap-2"
          activeOpacity={0.75}
          onPress={() => navigation?.navigate('Crops', { screen: 'CreateCrop', initial: false })}
        >
          <MaterialIcons name="add-circle" size={20} color="#166534" />
          <Text className="text-primary text-xs font-bold uppercase tracking-wider opacity-80">
            {t('addNewCropOrField')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 160,
    backgroundColor: '#ffffff',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  scrollRow: {
    paddingHorizontal: 16,
    gap: 12,
    paddingBottom: 8,
  },
  statusBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 20,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  upcomingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    paddingTop: 7,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    width: '100%',
  },
  upcomingText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
});




