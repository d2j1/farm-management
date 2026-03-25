import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useDatabase } from '../database/DatabaseProvider';
import { getAllTasks } from '../database/taskService';
import { getAllReminders } from '../database/reminderService';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { useLanguageStore } from '../utils/languageStore';

export default function TaskSection() {
  const navigation = useNavigation();
  const db = useDatabase();
  const isFocused = useIsFocused();
  const { t } = useLanguageStore();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [dbTasks, dbReminders] = await Promise.all([
        getAllTasks(db),
        getAllReminders(db),
      ]);

      const today = new Date().toISOString().split('T')[0];

      const mappedTasks = dbTasks.map(tData => {
        let statusText = tData.startDate || t('noUpcomingTasks');
        let color = '#166534'; // primary
        
        if (tData.startDate === today) {
          statusText = t('today');
        } else if (tData.startDate < today) {
          statusText = t('overdue');
          color = '#ef4444'; // red
        } else {
          color = '#64748b'; // slate
        }

        return {
          id: `t-${tData.id}`,
          rawDate: tData.startDate,
          title: tData.taskName,
          subtitle: tData.cropName ? `${t('cropPrefix')}${tData.cropName}` : t('generalTask'),
          statusLabel: statusText,
          color,
          icon: tData.startDate === today ? 'radio-button-unchecked' : 'calendar-today',
        };
      });

      const mappedReminders = dbReminders.map(r => ({
        id: `r-${r.id}`,
        rawDate: r.reminderDate,
        title: r.details,
        subtitle: t('newReminder'),
        statusLabel: r.reminderDate === today ? t('today') : r.reminderDate,
        color: '#f59e0b', // amber
        icon: 'notifications-none',
      }));

      // Combine and sort by date (descending for now to show latest/upcoming)
      const combined = [...mappedTasks, ...mappedReminders]
        .sort((a, b) => {
          if (a.rawDate < b.rawDate) return -1;
          if (a.rawDate > b.rawDate) return 1;
          return 0;
        })
        .slice(0, 3);

      setItems(combined);
    } catch (err) {
      console.error('Failed to load task section data:', err);
    } finally {
      setLoading(false);
    }
  }, [db, t]);

  useEffect(() => {
    if (isFocused) {
      loadData();
    }
  }, [isFocused, loadData]);

  return (
    <View className="p-4">
      <View className="bg-white dark:bg-slate-900 rounded-2xl shadow-md border border-slate-100 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <View className="flex-row items-center justify-between p-4 border-b border-slate-50 dark:border-slate-800">
          <Text className="text-xs font-semibold uppercase tracking-widest text-slate-500">
            {t('upcomingTasks')}
          </Text>
          <View className="bg-primary/20 px-2 py-0.5 rounded-full">
            <Text className="text-primary text-[0.714rem] font-bold uppercase">
              {t('next24h')}
            </Text>
          </View>
        </View>

        {/* Task List */}
        <View className="p-4">
          {loading ? (
            <ActivityIndicator color="#166534" />
          ) : items.length === 0 ? (
            <View className="p-8 items-center text-center">
              <View className="h-16 w-16 rounded-full bg-slate-50 dark:bg-slate-800 items-center justify-center mb-4">
                <MaterialIcons name="assignment-late" size={36} color="#cbd5e1" />
              </View>
              <Text className="text-base font-bold text-slate-900 dark:text-white mb-2">
                {t('noTasksScheduled')}
              </Text>
              <Text className="text-xs text-slate-500 dark:text-slate-400 mb-6 text-center max-w-[200px]">
                {t('noTasksDesc')}
              </Text>
              <TouchableOpacity 
                className="w-full max-w-xs bg-primary py-3 rounded-xl flex-row items-center justify-center gap-2 shadow-lg shadow-primary/20"
                onPress={() => navigation.navigate('Tasks', { openCreateTask: true })}
              >
                <MaterialIcons name="add-circle" size={20} color="white" />
                <Text className="text-white font-bold">{t('createFirstTask')}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="gap-4">
              {items.map((item) => (
                <View key={item.id} className="flex-row items-center gap-4 border-l-4 pl-3" style={{ borderLeftColor: item.color }}>
                  <View className="flex-1">
                    <Text className="text-xs font-bold uppercase" style={{ color: item.color }}>
                      {item.statusLabel}
                    </Text>
                    <Text className="text-sm font-bold text-slate-900 dark:text-white">{item.title}</Text>
                    <Text className="text-xs text-slate-500">{item.subtitle}</Text>
                  </View>
                  <TouchableOpacity 
                    className="h-8 w-8 rounded-full border border-slate-200 flex items-center justify-center"
                    onPress={() => navigation.navigate('Tasks')}
                  >
                    <MaterialIcons name={item.icon} size={20} color="#94a3b8" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Footer */}
        <View className="px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 gap-2">
          <View className="flex-row items-center justify-between">
            <TouchableOpacity
              onPress={() => navigation.navigate('Tasks', { openCreateTask: true })}
              className="flex-row items-center gap-1.5"
            >
              <MaterialIcons name="add-circle" size={20} color="#166534" />
              <Text className="text-primary text-xs font-bold uppercase tracking-wider">
                {t('createTask')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('Tasks')}>
              <Text className="text-primary text-xs font-bold uppercase tracking-wider">
                {t('viewAllTasks')}
              </Text>
            </TouchableOpacity>
          </View>

          <View className="items-center">
            <TouchableOpacity
              onPress={() => navigation.navigate('Tasks', { openCreateReminder: true })}
              className="flex-row items-center gap-1.5"
            >
              <MaterialIcons name="notifications-active" size={23} color="#166534" />
              <Text className="text-primary text-xs font-bold uppercase tracking-wider">
                {t('createReminder')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}




