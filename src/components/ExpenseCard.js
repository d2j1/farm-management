import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { formatCurrency } from '../utils/cropDetailsUtils';
import { useLanguageStore } from '../utils/languageStore';

export default function ExpenseCard({ expense, isMenuOpen, onToggleMenu, onMenuAction }) {
  const { t } = useLanguageStore();

  return (
    <View 
      className={`bg-white border border-primary/10 p-4 relative shadow-sm rounded-2xl ${expense.isMuted ? 'opacity-80' : ''}`}
      style={isMenuOpen ? { zIndex: 50, elevation: 10 } : { zIndex: 1, elevation: 1 }}
    >
      <TouchableOpacity
        className="absolute top-4 right-4 p-1 rounded-full z-10"
        activeOpacity={0.75}
        onPress={() => onToggleMenu(expense.id)}
      >
        <MaterialIcons name="more-vert" size={20} color="#94a3b8" />
      </TouchableOpacity>

      {isMenuOpen ? (
        <View style={styles.dropdownMenu}>
          <TouchableOpacity
            className="px-4 py-2"
            activeOpacity={0.7}
            onPress={() => onMenuAction(expense.id, 'edit')}
          >
            <Text className="text-sm font-medium text-slate-700">{t('editExpense')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="px-4 py-2"
            activeOpacity={0.7}
            onPress={() => onMenuAction(expense.id, 'delete')}
          >
            <Text className="text-sm font-medium text-red-600">{t('deleteExpense')}</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-3 flex-1">
          <View className="bg-primary/20 p-2 rounded-lg">
            <MaterialIcons name={expense.icon} size={20} color="#3ce619" />
          </View>

          <View className="flex-1">
            <Text className="font-bold text-slate-900">{expense.title}</Text>
            <Text className="text-xs text-slate-500">{expense.dateText}</Text>
          </View>
        </View>

        <View className="pr-8">
          <Text className="text-xl font-bold text-green-700">{formatCurrency(expense.amount)}</Text>
        </View>
      </View>

      <View className="mt-4 bg-background-light p-3 rounded-lg border border-primary/5">
        <Text className="text-sm text-slate-600 leading-relaxed">
          <Text className="font-semibold text-slate-700">{t('remarksColon')}</Text>
          <Text className="italic">{expense.remarks}</Text>
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
