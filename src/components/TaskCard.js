import React from 'react';
import { View, Text, TouchableOpacity, Animated, Easing } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useLanguageStore } from '../utils/languageStore';

/**
 * Visual states a task card can have.
 *  - pending    : default unchecked checkbox
 *  - dueToday   : pending + green-ish border, red due text
 *  - inProgress : blue-tinted card, spinning activity icon
 *  - snoozed    : orange border, bedtime icon
 */

/**
 * Task card that adapts its look based on the task's `status`.
 *
 * @param {Object}  props
 * @param {string}  props.title        - Task title.
 * @param {string}  props.categoryLabel - e.g. "Wheat", "Corn", "Infrastructure".
 * @param {string}  props.categoryIcon  - MaterialIcons name for the category tag.
 * @param {string}  props.statusText   - e.g. "Due Today • 05:00 PM", "Tomorrow • 10:00 AM".
 * @param {'pending'|'dueToday'|'inProgress'|'snoozed'} props.status
 * @param {() => void} [props.onMenuPress]
 */
export default function TaskCard({
  id,
  title,
  categoryLabel,
  categoryIcon = 'eco',
  statusText,
  status = 'pending',
  isMenuOpen,
  onToggleMenu,
  onMenuAction,
}) {
  const { t } = useLanguageStore();
  // ── Derive style tokens from status ───────────────────────
  const isDueToday = status === 'dueToday';
  const isInProgress = status === 'inProgress';
  const isSnoozed = status === 'snoozed';

  // Card container
  const cardClass = isInProgress
    ? 'bg-blue-50 border border-blue-100 p-4 rounded-2xl shadow-sm'
    : isSnoozed
    ? 'bg-white border border-orange-200 p-4 rounded-2xl shadow-sm'
    : isDueToday
    ? 'bg-white border border-primary/10 p-4 rounded-2xl shadow-sm'
    : 'bg-white border border-slate-100 p-4 rounded-2xl shadow-sm';

  // Status text colour
  const statusTextClass = isDueToday
    ? 'text-xs font-medium mt-0.5 text-red-500'
    : isInProgress
    ? 'text-xs font-medium mt-0.5 text-blue-600'
    : isSnoozed
    ? 'text-xs font-medium mt-0.5 text-orange-600'
    : 'text-xs font-medium mt-0.5 text-slate-500';

  // Category tag
  const tagBgClass = isInProgress
    ? 'bg-blue-100 flex-row items-center gap-1 px-1.5 py-0.5 rounded'
    : 'bg-slate-100 flex-row items-center gap-1 px-1.5 py-0.5 rounded';
  const tagTextClass = isInProgress
    ? 'text-[10px] text-blue-700'
    : 'text-[10px] text-slate-500';

  return (
    <View 
      className={cardClass}
      style={isMenuOpen ? { zIndex: 50, elevation: 10 } : { zIndex: 1, elevation: 1 }}
    >
      <View className="flex-row justify-between items-start">
        <View className="flex-row items-start gap-3 flex-1">
          {/* Leading icon / checkbox */}
          <View className="mt-1">
            {isInProgress ? (
              <SpinningIcon />
            ) : isSnoozed ? (
              <MaterialIcons name="bedtime" size={24} color="#fb923c" />
            ) : status === 'multi_day' ? (
              <MaterialIcons name="sync" size={24} color="#3b82f6" />
            ) : (
              <View
                className={`h-6 w-6 rounded-md border-2 items-center justify-center ${
                  isDueToday ? 'border-primary/30' : 'border-slate-200'
                }`}
              />
            )}
          </View>

          {/* Text block */}
          <View className="flex-1">
            <View className="flex-row items-center gap-2 flex-wrap">
              <Text className="font-bold text-slate-900">{title}</Text>
              <View className={tagBgClass}>
                <MaterialIcons
                  name={categoryIcon}
                  size={12}
                  color={isInProgress ? '#1d4ed8' : '#64748b'}
                />
                <Text className={tagTextClass}>{categoryLabel}</Text>
              </View>
            </View>
            <Text className={statusTextClass}>{statusText}</Text>
          </View>
        </View>

        {/* 3-dot menu */}
        <View className="relative">
          <TouchableOpacity
            className="p-1 rounded-full"
            activeOpacity={0.6}
            onPress={() => onToggleMenu?.(id)}
          >
            <MaterialIcons name="more-vert" size={22} color="#94a3b8" />
          </TouchableOpacity>

          {isMenuOpen && (
            <View style={styles.dropdownMenu}>
              <TouchableOpacity
                className="px-4 py-2"
                activeOpacity={0.7}
                onPress={() => onMenuAction?.(id, 'done')}
              >
                <Text className="text-sm font-medium text-slate-700">{t('markAsDone')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="px-4 py-2"
                activeOpacity={0.7}
                onPress={() => onMenuAction?.(id, 'skip')}
              >
                <Text className="text-sm font-medium text-slate-700">{t('skip')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="px-4 py-2"
                activeOpacity={0.7}
                onPress={() => onMenuAction?.(id, 'snooze')}
              >
                <Text className="text-sm font-medium text-slate-700">{t('snooze')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = {
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
    zIndex: 100, // Higher zIndex for better visibility
    elevation: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
  },
};

// ── Spinning progress icon (replaces CSS animate-spin-slow) ──
function SpinningIcon() {
  const spinValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [spinValue]);

  const rotate = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View style={{ transform: [{ rotate }] }}>
      <MaterialIcons name="autorenew" size={24} color="#3b82f6" />
    </Animated.View>
  );
}
