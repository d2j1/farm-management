import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Pressable, Animated, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import { useLanguageStore } from '../utils/languageStore';
import ActionCenter from '../components/ActionCenter';
import FilterTabs from '../components/FilterTabs';
import TaskCard from '../components/TaskCard';
import TimelineItemCard from '../components/TimelineItemCard';
import CreateTaskModal from '../components/CreateTaskModal';
import CreateReminderModal from '../components/CreateReminderModal';
import UpdateTaskModal from '../components/UpdateTaskModal';
import { useDatabase } from '../database/DatabaseProvider';
import { deleteTask, updateTask, insertTask, getPaginatedTasksAndReminders, getAllTasks } from '../database/taskService';
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

const PAGE_SIZE = 15;

export default function TasksScreen({ navigation, route }) {
  const { t } = useLanguageStore();
  const db = useDatabase();
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();

  const [activeFilter, setActiveFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);

  const [showCreateTask, setShowCreateTask] = useState(false);
  const [showCreateReminder, setShowCreateReminder] = useState(false);
  const [showUpdateTask, setShowUpdateTask] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  const [timelineItems, setTimelineItems] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [reminderCount, setReminderCount] = useState(0);

  const [openMenuId, setOpenMenuId] = useState(null);

  // Guard ref to prevent concurrent fetches
  const isFetchingRef = useRef(false);

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

  const loadActionCenterStats = useCallback(async () => {
    try {
      const [allTasks, allReminders] = await Promise.all([
        getAllTasks(db),
        getAllReminders(db),
      ]);
      setPendingCount(allTasks.length);
      setReminderCount(allReminders.length);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  }, [db]);

  const transformRow = useCallback((item) => {
    const today = new Date().toISOString().split('T')[0];

    if (item.kind === 'task') {
      let statusText = item.rawDate || 'No date set';
      let taskState = item.rawDate === today ? 'dueToday' : 'pending';

      if (item.type === 'multi_day' && item.endDate) {
        statusText = `${item.rawDate} - ${item.endDate}`;
        taskState = 'multi_day';
      }

      return {
        ...item,
        id: item.id,
        title: item.title,
        categoryLabel: item.cropName || t('general'),
        categoryIcon: 'eco',
        statusText,
        status: taskState,
      };
    } else {
      // reminder
      return {
        id: `r-${item.id}`,
        dbId: item.id,
        kind: 'reminder',
        rawDate: item.rawDate,
        title: item.title,
        statusText: `${item.rawDate}${item.reminderTime ? ' • ' + item.reminderTime : ''}`,
        icon: 'notifications',
        iconBgClass: 'bg-orange-100',
        iconColor: '#ea580c',
        categoryLabel: item.cropName || null,
        categoryIcon: 'eco',
      };
    }
  }, [t]);

  const loadData = useCallback(async (isInitial = true) => {
    if (isFetchingRef.current) return;

    if (isInitial) {
      setLoading(true);
      setOffset(0);
      setHasMore(true);
      loadActionCenterStats();
    } else {
      if (!hasMore) return;
      setLoadingMore(true);
    }

    isFetchingRef.current = true;

    try {
      const currentOffset = isInitial ? 0 : offset;
      const rows = await getPaginatedTasksAndReminders(db, {
        limit: PAGE_SIZE,
        offset: currentOffset,
        filter: activeFilter,
      });

      const transformed = rows.map(transformRow);

      if (isInitial) {
        setTimelineItems(transformed);
      } else {
        setTimelineItems(prev => {
          // Prevent duplicates
          const existingIds = new Set(prev.map(i => i.id));
          const uniqueNew = transformed.filter(i => !existingIds.has(i.id));
          return [...prev, ...uniqueNew];
        });
      }

      const nextOffset = currentOffset + rows.length;
      setOffset(nextOffset);
      setHasMore(rows.length === PAGE_SIZE);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      isFetchingRef.current = false;
    }
  }, [db, activeFilter, offset, transformRow, loadActionCenterStats, hasMore]);

  useEffect(() => {
    if (isFocused) {
      loadData(true);
    }
  }, [isFocused, activeFilter]); // Re-load when focus or filter changes

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

  const handleMenuAction = useCallback(async (id, action) => {
    setOpenMenuId(null);
    const task = timelineItems.find(item => item.id === id);
    if (!task) return;

    try {
      if (action === 'done') {
        if (task.cropId) {
          await insertActivity(db, {
            cropId: task.cropId || null,
            title: task.title,
            remark: t('taskCompletedFromMyTasks'),
            date: new Date(),
          });
        }
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
      loadData(true);
    } catch (err) {
      console.error('Failed to process task action:', err);
      showToast(t('actionFailedToast'));
    }
  }, [timelineItems, db, t, loadData]);

  const handleDismissReminder = useCallback(async (id) => {
    const reminder = timelineItems.find(r => r.id === id);
    if (reminder?.dbId) {
      try {
        await deleteReminder(db, reminder.dbId);
        loadData(true);
        showToast(t('reminderDismissedToast'));
      } catch (err) {
        console.error('Failed to delete reminder:', err);
        showToast(t('reminderDismissFailedToast'));
      }
    }
  }, [timelineItems, db, t, loadData]);

  const renderHeader = () => (
    <View style={{ zIndex: 0, elevation: 0 }}>
      {/* Action Center */}
      <View className="px-4 pt-4">
        <ActionCenter pendingCount={pendingCount} reminderCount={reminderCount} />
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
    </View>
  );

  const renderFooter = () => {
    if (loadingMore) {
      return (
        <View className="py-4 items-center" style={{ zIndex: 0, elevation: 0 }}>
          <ActivityIndicator size="small" color="#166534" />
        </View>
      );
    }
    if (!hasMore && timelineItems.length > 0) {
      return (
        <View className="py-10 items-center justify-center" style={{ zIndex: 0, elevation: 0 }}>
          <MaterialIcons name="done-all" size={26} color="#166534" />
          <Text className="text-slate-400 text-sm font-bold uppercase tracking-widest mt-2">
            {t('allCaughtUp') || 'End of records'}
          </Text>
          <View style={{ height: 160 }} />
        </View>
      );
    }
    return <View style={{ height: 160, zIndex: 0, elevation: 0 }} />;
  };

  const renderEmpty = () => {
    if (loading) {
      return (
        <View className="py-20 items-center justify-center">
          <ActivityIndicator size="large" color="#166534" />
          <Text className="text-slate-400 text-xs mt-2">{t('loading') || 'Loading...'}</Text>
        </View>
      );
    }
    return (
      <View className="mx-4 py-10 items-center justify-center bg-white rounded-2xl border border-slate-100">
        <MaterialIcons name="assignment-late" size={48} color="#cbd5e1" />
        <Text className="text-slate-500 font-medium mt-2">{t('noTasksFound') || 'No tasks found'}</Text>
      </View>
    );
  };

  const renderItem = useCallback(({ item }) => {
    if (item.kind === 'reminder') {
      return (
        <View 
          className="px-4 mb-3"
          collapsable={false}
          style={{ zIndex: 1, elevation: 1 }}
        >
          <TimelineItemCard
            item={item}
            onDismiss={handleDismissReminder}
          />
        </View>
      );
    }
    return (
      <View className="px-4 mb-3">
        <TaskCard
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
      </View>
    );
  }, [openMenuId, handleDismissReminder, handleMenuAction]);

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
            <MaterialIcons name="arrow-back" size={26} color="#0f172a" />
          </TouchableOpacity>
 
          <View className="items-center">
            <Text className="text-lg font-bold tracking-tight text-primary">
              {t('myTasks')}
            </Text>
            <Text className="text-xs text-slate-500">{t('farmPersonal')}</Text>
          </View>
        </View>
 
        {/* ─── FlatList content ──────────────────────── */}
        <FlatList
          data={timelineItems}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          ListHeaderComponent={renderHeader}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={{ overflow: 'visible' }}
          onEndReached={() => {
            if (hasMore && !loadingMore && !loading) {
              loadData(false);
            }
          }}
          onEndReachedThreshold={0.5}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={false}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={10}
        />
      </Pressable>

      {/* ─── Floating action buttons ─────────────────── */}
      <View className="absolute bottom-6 right-6 items-end gap-3">
        <TouchableOpacity
          className="flex-row items-center gap-2 bg-white border border-primary/20 py-2.5 px-5 rounded-full shadow-lg"
          activeOpacity={0.85}
          style={styles.fabShadow}
          onPress={() => setShowCreateTask(true)}
        >
          <MaterialIcons name="add-task" size={24} color="#166534" />
          <Text className="text-xs font-bold uppercase tracking-widest text-slate-900">
            {t('newTask')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-row items-center gap-2 bg-primary py-3 px-5 rounded-full shadow-xl"
          activeOpacity={0.85}
          style={styles.primaryFabShadow}
          onPress={() => setShowCreateReminder(true)}
        >
          <MaterialIcons name="notification-add" size={24} color="#ffffff" />
          <Text className="text-xs font-bold uppercase tracking-widest text-white">
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
            loadData(true);
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
            loadData(true);
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
            loadData(true);
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
            <MaterialIcons name="check-circle" size={14} color="#ffffff" />
          </View>
          <Text className="text-white text-xs font-medium">{toastMessage}</Text>
        </Animated.View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
    shadowColor: '#166534',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});




