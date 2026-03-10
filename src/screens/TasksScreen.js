import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Pressable, Animated } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useLanguageStore } from '../utils/languageStore';
import ActionCenter from '../components/ActionCenter';
import FilterTabs from '../components/FilterTabs';
import TaskCard from '../components/TaskCard';
import TimelineItemCard from '../components/TimelineItemCard';
import CreateTaskModal from '../components/CreateTaskModal';
import CreateReminderModal from '../components/CreateReminderModal';
import UpdateTaskModal from '../components/UpdateTaskModal';
import { useDatabase } from '../database/DatabaseProvider';
import { getAllTasks, deleteTask, updateTask, insertTask } from '../database/taskService';
import { insertActivity } from '../database/activityService';
import { getAllReminders, deleteReminder, insertReminder } from '../database/reminderService';

// ─── Filter pill labels ──────────────────────────────────────
const FILTER_TABS_KEYS = [
  'all',
  'dueToday',
  'upcoming',
  'general',
  'cropRelated',
];

export default function TasksScreen({ navigation, route }) {
  const { t } = useLanguageStore();
  const db = useDatabase();
  const insets = useSafeAreaInsets();
  const [activeFilter, setActiveFilter] = useState('all');
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [showCreateReminder, setShowCreateReminder] = useState(false);
  const [showUpdateTask, setShowUpdateTask] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [openMenuId, setOpenMenuId] = useState(null);

  // Toast state
  const [toastMessage, setToastMessage] = useState('');
  const toastY = useRef(new Animated.Value(24)).current;
  const toastOpacity = useRef(new Animated.Value(0)).current;

  const showToast = (message) => {
    setToastMessage(message);
    toastY.setValue(24);
    toastOpacity.setValue(0);

    Animated.parallel([
      Animated.timing(toastY, {
        toValue: 0,
        duration: 260,
        useNativeDriver: true,
      }),
      Animated.timing(toastOpacity, {
        toValue: 1,
        duration: 260,
        useNativeDriver: true,
      }),
    ]).start();

    setTimeout(() => {
      Animated.parallel([
        Animated.timing(toastY, {
          toValue: 18,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(toastOpacity, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setToastMessage('');
      });
    }, 2100);
  };

  const loadData = useCallback(async () => {
    try {
      const [dbTasks, dbReminders] = await Promise.all([
        getAllTasks(db),
        getAllReminders(db),
      ]);

      const today = new Date().toISOString().split('T')[0];

      setTasks(dbTasks.map(taskItem => {
        let statusText = taskItem.startDate || 'No date set';
        let taskState = taskItem.startDate === today ? 'dueToday' : 'pending';

        if (taskItem.type === 'multi_day' && taskItem.endDate) {
          statusText = `${taskItem.startDate} - ${taskItem.endDate}`;
          taskState = 'multi_day';
        }

        return {
          ...taskItem,
          id: taskItem.id,
          rawDate: taskItem.startDate,
          title: taskItem.taskName,
          categoryLabel: taskItem.cropName || t('general'),
          categoryIcon: 'eco',
          statusText,
          status: taskState,
        };
      }));

      setReminders(dbReminders.map(r => ({
        id: `r-${r.id}`,
        dbId: r.id,
        kind: 'reminder',
        rawDate: r.reminderDate,
        title: r.details,
        statusText: `${r.reminderDate}${r.reminderTime ? ' • ' + r.reminderTime : ''}`,
        icon: 'notifications',
        iconBgClass: 'bg-orange-100',
        iconColor: '#ea580c',
      })));
    } catch (err) {
      console.error('Failed to load data:', err);
    }
  }, [db, t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const shouldOpenTask = Boolean(route.params?.openCreateTask);
    const shouldOpenReminder = Boolean(route.params?.openCreateReminder);

    if (!shouldOpenTask && !shouldOpenReminder) return;

    if (shouldOpenTask) setShowCreateTask(true);
    if (shouldOpenReminder) setShowCreateReminder(true);

    navigation.setParams({
      openCreateTask: false,
      openCreateReminder: false,
    });
  }, [navigation, route.params?.openCreateTask, route.params?.openCreateReminder]);

  const handleMenuAction = async (id, action) => {
    setOpenMenuId(null);
    const task = tasks.find(item => item.id === id);
    if (!task) return;

    try {
      if (action === 'done') {
        await insertActivity(db, {
          cropId: task.cropId || null,
          title: task.title,
          remark: t('taskCompletedFromMyTasks'),
          date: new Date(),
        });
        await deleteTask(db, id);
        showToast(t('taskDoneToast'));
      } else if (action === 'skip') {
        await deleteTask(db, id);
        showToast(t('taskSkippedToast'));
      } else if (action === 'snooze') {
        setEditingTask(task);
        setShowUpdateTask(true);
        return;
      }
      loadData();
    } catch (err) {
      console.error('Failed to process task action:', err);
      showToast(t('actionFailedToast'));
    }
  };

  const handleDismissReminder = async (id) => {
    const reminder = reminders.find(r => r.id === id);
    if (reminder?.dbId) {
      try {
        await deleteReminder(db, reminder.dbId);
        loadData();
        showToast(t('reminderDismissedToast'));
      } catch (err) {
        console.error('Failed to delete reminder:', err);
        showToast(t('reminderDismissFailedToast'));
      }
    }
  };

  // Combine tasks and reminders for the timeline and sort by date descending
  const timelineItems = [...tasks, ...reminders]
    .filter(item => {
      if (activeFilter === 'all') return true;

      const today = new Date().toISOString().split('T')[0];

      if (activeFilter === 'dueToday') {
        return item.rawDate === today;
      }
      if (activeFilter === 'upcoming') {
        return item.rawDate > today;
      }
      if (activeFilter === 'general') {
        return !item.cropId;
      }
      if (activeFilter === 'cropRelated') {
        return Boolean(item.cropId);
      }
      return true;
    })
    .sort((a, b) => {
      if (a.rawDate < b.rawDate) return 1;
      if (a.rawDate > b.rawDate) return -1;
      return 0;
    });

  return (
    <SafeAreaView className="flex-1 bg-background-light" edges={['top']}>
      <Pressable className="flex-1" onPress={() => setOpenMenuId(null)}>
        {/* ─── Header ──────────────────────────────────── */}
        <View className="bg-white flex-row items-center justify-center py-4 border-b border-slate-100 relative">
          <TouchableOpacity
            className="absolute left-4"
            activeOpacity={0.7}
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="arrow-back" size={24} color="#0f172a" />
          </TouchableOpacity>

          <View className="items-center">
            <Text className="text-xl font-bold tracking-tight text-black">
              {t('myTasks')}
            </Text>
            <Text className="text-xs text-slate-500">{t('farmPersonal')}</Text>
          </View>
        </View>

        {/* ─── Scrollable content ──────────────────────── */}
        <ScrollView
          className="flex-1"
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Action Center */}
          <View className="px-4 pt-4">
            <ActionCenter pendingCount={tasks.length} reminderCount={reminders.length} />
          </View>

          {/* Filter tabs */}
          <FilterTabs
            tabs={FILTER_TABS_KEYS.map(key => t(key))}
            activeTab={t(activeFilter)}
            onTabChange={(val) => {
              const reverseMap = {
                [t('all')]: 'all',
                [t('dueToday')]: 'dueToday',
                [t('upcoming')]: 'upcoming',
                [t('general')]: 'general',
                [t('cropRelated')]: 'cropRelated',
              };
              setActiveFilter(reverseMap[val]);
            }}
          />

          {/* Timeline header */}
          <Text className="text-xs font-bold text-slate-400 uppercase px-5 mb-3">
            {t('timeline')}
          </Text>

          {/* Timeline cards */}
          <View className="px-4 gap-3 mb-4">
            {timelineItems.map((item) => {
              if (item.kind === 'reminder') {
                return (
                  <TimelineItemCard
                    key={item.id}
                    item={item}
                    onDismiss={() => handleDismissReminder(item.id)}
                  />
                );
              }
              return (
                <TaskCard
                  key={item.id}
                  id={item.id}
                  title={item.title}
                  categoryLabel={item.categoryLabel}
                  categoryIcon={item.categoryIcon}
                  statusText={item.statusText}
                  status={item.status}
                  isMenuOpen={openMenuId === item.id}
                  onToggleMenu={setOpenMenuId}
                  onMenuAction={handleMenuAction}
                />
              );
            })}
          </View>
        </ScrollView>
      </Pressable>

      {/* ─── Floating action buttons ─────────────────── */}
      <View className="absolute bottom-6 right-6 items-end gap-3">
        <TouchableOpacity
          className="flex-row items-center gap-2 bg-white border border-primary/20 py-2.5 px-5 rounded-full shadow-lg"
          activeOpacity={0.85}
          style={styles.fabShadow}
          onPress={() => setShowCreateTask(true)}
        >
          <MaterialIcons name="add-task" size={20} color="#3ce619" />
          <Text className="text-[10px] font-bold uppercase tracking-widest text-slate-900">
            {t('newTask')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-row items-center gap-2 bg-primary py-3 px-5 rounded-full shadow-xl"
          activeOpacity={0.85}
          style={styles.primaryFabShadow}
          onPress={() => setShowCreateReminder(true)}
        >
          <MaterialIcons name="notification-add" size={20} color="#1a2e05" />
          <Text className="text-[10px] font-bold uppercase tracking-widest text-slate-900">
            {t('newReminder')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ─── Create Task Overlay ─────────────────────── */}
      <CreateTaskModal
        visible={showCreateTask}
        onClose={() => setShowCreateTask(false)}
        onSave={async (task) => {
          try {
            await insertTask(db, task);
            setShowCreateTask(false);
            loadData();
            showToast(t('taskCreatedToast'));
          } catch (err) {
            console.error('Failed to create task:', err);
            showToast(t('taskCreateFailedToast'));
          }
        }}
      />

      {/* ─── Create Reminder Overlay ─────────────────── */}
      <CreateReminderModal
        visible={showCreateReminder}
        onClose={() => setShowCreateReminder(false)}
        onSave={async (reminder) => {
          try {
            await insertReminder(db, reminder);
            setShowCreateReminder(false);
            loadData();
            showToast(t('reminderCreatedToast'));
          } catch (err) {
            console.error('Failed to create reminder:', err);
            showToast(t('reminderCreateFailedToast'));
          }
        }}
      />

      {/* ─── Update Task Overlay ─────────────────────── */}
      <UpdateTaskModal
        visible={showUpdateTask}
        taskData={editingTask}
        onClose={() => {
          setShowUpdateTask(false);
          setEditingTask(null);
        }}
        onSave={async (taskData) => {
          try {
            await updateTask(db, editingTask.id, taskData);
            setShowUpdateTask(false);
            setEditingTask(null);
            loadData();
            showToast(t('taskUpdatedToast'));
          } catch (err) {
            console.error('Failed to update task:', err);
            showToast(t('taskUpdateFailedToast'));
          }
        }}
      />

      {/* Standardized Toast UI */}
      {toastMessage ? (
        <Animated.View
          style={[
            styles.toast,
            {
              bottom: (insets.bottom || 0) + 106,
              opacity: toastOpacity,
              transform: [{ translateY: toastY }],
            },
          ]}
          pointerEvents="none"
        >
          <View className="mr-2">
            <MaterialIcons name="check-circle" size={14} color="#3ce619" />
          </View>
          <Text className="text-white text-xs font-medium">{toastMessage}</Text>
        </Animated.View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 160,
  },
  toast: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    zIndex: 50,
  },
  fabShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  primaryFabShadow: {
    shadowColor: '#3ce619',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
