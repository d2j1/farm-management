import React from 'react';
import { View, Text, TouchableOpacity, Animated, Easing } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

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
  title,
  categoryLabel,
  categoryIcon = 'eco',
  statusText,
  status = 'pending',
  onMenuPress,
}) {
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
    <View className={cardClass}>
      <View className="flex-row justify-between items-start">
        <View className="flex-row items-start gap-3 flex-1">
          {/* Leading icon / checkbox */}
          <View className="mt-1">
            {isInProgress ? (
              <SpinningIcon />
            ) : isSnoozed ? (
              <MaterialIcons name="bedtime" size={24} color="#fb923c" />
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
        <TouchableOpacity
          className="p-1 rounded-full"
          activeOpacity={0.6}
          onPress={onMenuPress}
        >
          <MaterialIcons name="more-vert" size={22} color="#94a3b8" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

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
