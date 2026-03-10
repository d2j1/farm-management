import React, { useRef, useEffect, memo } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useLanguageStore } from '../utils/languageStore';

function SpinningIcon() {
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 2500,
        useNativeDriver: true,
      }),
    );
    animation.start();
    return () => animation.stop();
  }, [spin]);

  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View style={{ transform: [{ rotate }] }}>
      <MaterialIcons name="autorenew" size={22} color="#3b82f6" />
    </Animated.View>
  );
}

function TimelineTaskIcon({ taskState }) {
  if (taskState === 'inProgress') {
    return (
      <View className="h-6 w-6 items-center justify-center">
        <SpinningIcon />
      </View>
    );
  }

  if (taskState === 'snoozed') {
    return (
      <View className="h-6 w-6 items-center justify-center">
        <MaterialIcons name="bedtime" size={20} color="#fb923c" />
      </View>
    );
  }

  if (taskState === 'multi_day') {
    return (
      <View className="h-6 w-6 items-center justify-center">
        <MaterialIcons name="sync" size={24} color="#3b82f6" />
      </View>
    );
  }

  return (
    <View className="h-6 w-6 rounded-md border-2 border-primary/30 items-center justify-center" />
  );
}

function TimelineItemCard({ item, isMenuOpen, onToggleMenu, onDismiss, onMenuAction }) {
  const { t } = useLanguageStore();
  const isReminder = item.kind === 'reminder';
  const isDueToday = item.taskState === 'dueToday';
  const isInProgress = item.taskState === 'inProgress';
  const isSnoozed = item.taskState === 'snoozed';

  const cardClass = isReminder
    ? 'bg-white border border-slate-200'
    : isInProgress
      ? 'bg-blue-50/50 border border-blue-100'
      : isSnoozed
        ? 'bg-white border border-orange-200'
        : isDueToday
          ? 'bg-white border border-primary/10'
          : 'bg-white border border-slate-200';

  const statusClass = isDueToday
    ? 'text-xs font-medium text-red-500 mt-0.5'
    : isInProgress
      ? 'text-xs font-medium text-blue-600 mt-0.5'
      : isSnoozed
        ? 'text-xs font-medium text-orange-600 mt-0.5'
        : 'text-xs text-slate-500 mt-0.5';

  return (
    <View
      className={`relative p-4 rounded-2xl shadow-sm ${cardClass}`}
      style={isMenuOpen ? { zIndex: 50, elevation: 10 } : { zIndex: 1, elevation: 1 }}
    >
      <View className="flex-row justify-between items-start">
        <View className="flex-row items-start gap-3 flex-1">
          {isReminder ? (
            <View className={`mt-1 h-6 w-6 rounded items-center justify-center ${item.iconBgClass}`}>
              <MaterialIcons name={item.icon} size={18} color={item.iconColor} />
            </View>
          ) : (
            <View className="mt-1">
              <TimelineTaskIcon taskState={item.taskState} />
            </View>
          )}

          <View className="flex-1">
            <View className="flex-row items-center gap-2">
              {!isReminder && (
                <MaterialIcons name="list-alt" size={14} color="#94a3b8" />
              )}
              <Text className="text-sm font-bold text-slate-900">{item.title}</Text>
            </View>
            <Text className={statusClass}>{item.statusText}</Text>
          </View>
        </View>

        {isReminder ? (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => onDismiss(item.id)}
            className="p-1 rounded-full"
          >
            <MaterialIcons name="close" size={18} color="#94a3b8" />
          </TouchableOpacity>
        ) : (
          <View className="relative">
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={() => onToggleMenu(item.id)}
              className="p-1 rounded-full"
            >
              <MaterialIcons name="more-vert" size={18} color="#94a3b8" />
            </TouchableOpacity>

            {isMenuOpen ? (
              <View style={styles.dropdownMenu}>
                <TouchableOpacity
                  className="px-4 py-2"
                  activeOpacity={0.7}
                  onPress={() => onMenuAction(item.id, 'done')}
                >
                  <Text className="text-sm font-medium text-slate-700">{t('markAsDone')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="px-4 py-2"
                  activeOpacity={0.7}
                  onPress={() => onMenuAction(item.id, 'skip')}
                >
                  <Text className="text-sm font-medium text-slate-700">{t('skip')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="px-4 py-2"
                  activeOpacity={0.7}
                  onPress={() => onMenuAction(item.id, 'snooze')}
                >
                  <Text className="text-sm font-medium text-slate-700">{t('snooze')}</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        )}
      </View>
    </View>
  );
}

export default memo(TimelineItemCard);

const styles = StyleSheet.create({
  dropdownMenu: {
    position: 'absolute',
    top: 30,
    right: 0,
    width: 150,
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
    zIndex: 40,
    elevation: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
  },
});
