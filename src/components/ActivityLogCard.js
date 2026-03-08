import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export default function ActivityLogCard({ log, isMenuOpen, onToggleMenu, onMenuAction }) {
  return (
    <View 
      className="bg-white border border-primary/10 p-4 relative shadow-sm rounded-2xl"
      style={isMenuOpen ? { zIndex: 50, elevation: 10 } : { zIndex: 1, elevation: 1 }}
    >
      <TouchableOpacity
        className="absolute top-4 right-4 p-1 rounded-full z-10"
        activeOpacity={0.75}
        onPress={() => onToggleMenu(log.id)}
      >
        <MaterialIcons name="more-vert" size={20} color="#94a3b8" />
      </TouchableOpacity>

      {isMenuOpen ? (
        <View style={styles.dropdownMenu}>
          <TouchableOpacity
            className="px-4 py-2"
            activeOpacity={0.7}
            onPress={() => onMenuAction(log.id, 'edit')}
          >
            <Text className="text-sm font-medium text-slate-700">Edit Log</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="px-4 py-2"
            activeOpacity={0.7}
            onPress={() => onMenuAction(log.id, 'delete')}
          >
            <Text className="text-sm font-medium text-red-600">Delete Log</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <View className="flex-row items-center gap-3 pr-8">
        <View className="bg-primary/20 p-2 rounded-lg">
          <MaterialIcons name={log.icon} size={22} color="#3ce619" />
        </View>

        <View className="flex-1">
          <Text className="font-bold text-slate-900">{log.title}</Text>
          <Text className="text-xs text-slate-500">{log.dateText}</Text>
        </View>
      </View>

      <View className="mt-4 bg-background-light p-3 rounded-lg border border-primary/5">
        <Text className="text-sm text-slate-600 leading-relaxed">
          <Text className="font-semibold text-slate-700">Remarks: </Text>
          <Text className="italic">{log.remarks}</Text>
        </Text>
      </View>
    </View>
  );
}

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
