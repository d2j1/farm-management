import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const DETAIL_TABS = ['Actions', 'Activity Logs', 'Expenses', 'Earnings'];

export default function CropDetailsHeader({
  cropName,
  cropLocation,
  cropStatus,
  activeTab,
  showHeaderMenu,
  onBack,
  onCropNamePress,
  onCalendarPress,
  onMenuToggle,
  onMenuAction,
  onTabPress,
}) {
  return (
    <View className="bg-background-light border-b border-primary/10 relative z-30">
      <View className="flex-row items-center justify-between px-4 py-3">
        <View className="flex-row items-center gap-3 flex-1">
          <TouchableOpacity
            className="h-10 w-10 rounded-full items-center justify-center"
            activeOpacity={0.75}
            onPress={onBack}
          >
            <MaterialIcons name="arrow-back" size={22} color="#0f172a" />
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-1"
            activeOpacity={0.7}
            onPress={onCropNamePress}
          >
            <Text className="text-lg font-bold text-slate-900" numberOfLines={1}>
              {cropName}
            </Text>
            <Text className="text-xs text-slate-500" numberOfLines={1}>
              {cropLocation}
            </Text>
          </TouchableOpacity>
        </View>

        <View className="flex-row items-center">
          <TouchableOpacity
            className="h-10 w-10 rounded-full items-center justify-center"
            activeOpacity={0.75}
            onPress={onCalendarPress}
          >
            <MaterialIcons name="calendar-today" size={18} color="#475569" />
          </TouchableOpacity>
          <TouchableOpacity
            className="h-10 w-10 rounded-full items-center justify-center"
            activeOpacity={0.75}
            onPress={onMenuToggle}
          >
            <MaterialIcons name="more-vert" size={20} color="#475569" />
          </TouchableOpacity>
        </View>
      </View>

      {showHeaderMenu ? (
        <View style={styles.headerMenu}>
          <TouchableOpacity
            className="w-full flex-row items-center px-4 py-3 border-b border-slate-100"
            activeOpacity={0.7}
            onPress={() => onMenuAction('edit')}
          >
            <MaterialIcons name="edit" size={18} color="#475569" />
            <Text className="ml-3 text-sm text-slate-700">Edit crop details</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="w-full flex-row items-center px-4 py-3 border-b border-slate-100"
            activeOpacity={0.7}
            onPress={() => onMenuAction('deactivate')}
          >
            <MaterialIcons
              name={cropStatus === 'active' ? 'pause-circle' : 'play-circle'}
              size={18}
              color="#475569"
            />
            <Text className="ml-3 text-sm text-slate-700">
              {cropStatus === 'active' ? 'Deactivate crop' : 'Activate crop'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="w-full flex-row items-center px-4 py-3"
            activeOpacity={0.7}
            onPress={() => onMenuAction('delete')}
          >
            <MaterialIcons name="delete" size={18} color="#dc2626" />
            <Text className="ml-3 text-sm text-red-600">Delete crop</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabRow}
      >
        {DETAIL_TABS.map((tab) => {
          const isActive = tab === activeTab;
          return (
            <TouchableOpacity
              key={tab}
              className="px-4 py-3 border-b-2"
              style={{ borderBottomColor: isActive ? '#3ce619' : 'transparent' }}
              onPress={() => onTabPress(tab)}
              activeOpacity={0.75}
            >
              <Text
                className={`text-sm font-bold ${
                  isActive ? 'text-slate-900' : 'text-slate-500'
                }`}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  tabRow: {
    paddingHorizontal: 8,
  },
  headerMenu: {
    position: 'absolute',
    right: 16,
    top: 56,
    width: 192,
    backgroundColor: '#ffffff',
    borderColor: 'rgba(60, 230, 25, 0.2)',
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
    zIndex: 60,
    elevation: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
});
