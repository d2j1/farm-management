import React, { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import {
  Animated,
  PanResponder,
  Pressable,   // ← add this
  ScrollView,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import CreateTaskModal from '../components/CreateTaskModal';
import CreateReminderModal from '../components/CreateReminderModal';
import CreateActivityModal from '../components/CreateActivityModal';
import UpdateTaskModal from '../components/UpdateTaskModal';
import CreateExpenseModal from '../components/CreateExpenseModal';
import CreateEarningsModal from '../components/CreateEarningsModal';
import EditEarningModal from '../components/EditEarningModal';
import EditExpenseModal from '../components/EditExpenseModal';
import EditActivityLogModal from '../components/EditActivityLogModal';
import CropResultModal from '../components/CropResultModal';
import CropDetailsHeader from '../components/CropDetailsHeader';
import TimelineItemCard from '../components/TimelineItemCard';
import ActivityLogCard from '../components/ActivityLogCard';
import ExpenseCard from '../components/ExpenseCard';
import EarningCard from '../components/EarningCard';
import { DeleteCropConfirmModal, DeleteCropSuccessModal } from '../components/DeleteCropModal';
import { useDatabase } from '../database/DatabaseProvider';
import { deleteCrop, updateCropStatus, getCropById } from '../database/cropService';
import { insertTask, getTasksByCrop, deleteTask, updateTask } from '../database/taskService';
import { insertReminder, getRemindersByCrop, deleteReminder } from '../database/reminderService';
import { insertActivity, getActivitiesByCrop, deleteActivity, updateActivity } from '../database/activityService';
import { insertExpense, getExpensesByCrop, deleteExpense, updateExpense } from '../database/expenseService';
import { insertEarning, getEarningsByCrop, deleteEarning, updateEarning } from '../database/earningService';
import {
  formatCount,
  formatCurrency,
  getActivityIcon,
  getExpenseIcon,
  getEarningIcon,
} from '../utils/cropDetailsUtils';
import { useLanguageStore } from '../utils/languageStore';

const DETAIL_TABS = ['Actions', 'Activity Logs', 'Expenses', 'Earnings'];
const SWIPE_DISTANCE_THRESHOLD = 56;
const SWIPE_VELOCITY_THRESHOLD = 0.42;


export default function CropDetailsActionsScreen({ navigation, route }) {
  const { t } = useLanguageStore();
  const db = useDatabase();
  const cropId = route?.params?.crop?.dbId || null;

  const [crop, setCrop] = useState(null);
  const [activeTab, setActiveTab] = useState('Actions');
  const [timelineItems, setTimelineItems] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [earnings, setEarnings] = useState([]);
  const [openTaskMenuId, setOpenTaskMenuId] = useState(null);
  const [openLogMenuId, setOpenLogMenuId] = useState(null);
  const [openExpenseMenuId, setOpenExpenseMenuId] = useState(null);
  const [openEarningMenuId, setOpenEarningMenuId] = useState(null);
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [cropStatus, setCropStatus] = useState(route?.params?.crop?.status || 'active');
  const [statusModal, setStatusModal] = useState({ visible: false, newStatus: '' });
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [showCreateReminder, setShowCreateReminder] = useState(false);
  const [showCreateActivity, setShowCreateActivity] = useState(false);
  const [showCreateExpense, setShowCreateExpense] = useState(false);
  const [showCreateEarnings, setShowCreateEarnings] = useState(false);
  const [showEditExpense, setShowEditExpense] = useState(false);
  const [showEditEarning, setShowEditEarning] = useState(false);
  const [showUpdateTask, setShowUpdateTask] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [editingEarning, setEditingEarning] = useState(null);
  const [editingExpense, setEditingExpense] = useState(null);
  const [showEditActivity, setShowEditActivity] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);
  const [isDeletingCrop, setIsDeletingCrop] = useState(false);
  const undoDeleteTimerRef = useRef(null);

  const toastY = useRef(new Animated.Value(24)).current;
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

  const cropName = crop?.cropName || route?.params?.crop?.name || t('general');
  const cropLocation = crop?.landNickname || route?.params?.crop?.location || '';

  // ── Load all data for this crop from the database ───────────
  const loadAllData = useCallback(async () => {
    if (!cropId) return;

    try {
      // Load crop details
      const cropRow = await getCropById(db, cropId);
      if (cropRow) {
        setCrop(cropRow);
        setCropStatus(cropRow.status);
      }

      // Load tasks → timeline items
      const taskRows = await getTasksByCrop(db, cropId);
      const today = new Date().toISOString().split('T')[0];

      const taskItems = taskRows.map((t) => {
        let statusText = t.startDate || 'No date set';
        let taskState = t.startDate === today ? 'dueToday' : 'pending';

        if (t.type === 'multi_day' && t.endDate) {
          statusText = `${t.startDate} - ${t.endDate}`;
          taskState = 'multi_day';
        }

        return {
          ...t,
          id: `t-${t.id}`,
          dbId: t.id,
          kind: 'task',
          taskState,
          title: t.taskName,
          statusText,
          sortDate: t.startDate || '',
        };
      });

      // Load reminders → timeline items
      const reminderRows = await getRemindersByCrop(db, cropId);
      const reminderItems = reminderRows.map((r) => ({
        ...r,
        id: `r-${r.id}`,
        dbId: r.id,
        kind: 'reminder',
        title: r.details,
        statusText: `${r.reminderDate}${r.reminderTime ? ' • ' + r.reminderTime : ''}`,
        icon: 'notifications',
        iconBgClass: 'bg-orange-100',
        iconColor: '#ea580c',
        sortDate: r.reminderDate || '',
      }));

      const combined = [...reminderItems, ...taskItems].sort((a, b) => {
        if (a.sortDate !== b.sortDate) {
          return a.sortDate.localeCompare(b.sortDate);
        }
        // Secondary sort by time for reminders
        const timeA = a.reminderTime || '';
        const timeB = b.reminderTime || '';
        return timeA.localeCompare(timeB);
      });

      setTimelineItems(combined);

      // Load activity logs
      const activityRows = await getActivitiesByCrop(db, cropId);
      setActivityLogs(
        activityRows.map((a) => ({
          id: `a-${a.id}`,
          dbId: a.id,
          title: a.title,
          icon: getActivityIcon(a.title),
          dateText: a.date,
          remarks: a.remark || t('noRemarks'),
        })),
      );

      // Load expenses
      const expenseRows = await getExpensesByCrop(db, cropId);
      setExpenses(
        expenseRows.map((e) => ({
          id: `e-${e.id}`,
          dbId: e.id,
          title: e.title,
          icon: getExpenseIcon(e.title),
          dateText: e.date,
          amount: e.amount,
          remarks: e.remark || t('noRemarks'),
        })),
      );

      // Load earnings
      const earningRows = await getEarningsByCrop(db, cropId);
      setEarnings(
        earningRows.map((n) => ({
          id: `n-${n.id}`,
          dbId: n.id,
          title: n.title,
          icon: getEarningIcon(n.title),
          dateText: n.date,
          amount: n.amount,
          remarks: n.remark || t('noRemarks'),
        })),
      );
    } catch (err) {
      console.error('Failed to load crop data:', err);
    }
  }, [db, cropId, t]);

  // Reload data whenever the screen is focused
  useFocusEffect(
    useCallback(() => {
      loadAllData();
    }, [loadAllData]),
  );

  const pendingTaskCount = useMemo(
    () => timelineItems.filter((item) => item.kind === 'task').length,
    [timelineItems],
  );

  const reminderCount = useMemo(
    () => timelineItems.filter((item) => item.kind === 'reminder').length,
    [timelineItems],
  );

  const totalInvestment = useMemo(
    () => expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0),
    [expenses],
  );

  const totalEarnings = useMemo(
    () => earnings.reduce((sum, item) => sum + Number(item.amount || 0), 0),
    [earnings],
  );

  const menuIsOpen =
    showHeaderMenu ||
    Boolean(openTaskMenuId) ||
    Boolean(openLogMenuId) ||
    Boolean(openExpenseMenuId) ||
    Boolean(openEarningMenuId);

  useEffect(() => {
    return () => {
      if (undoDeleteTimerRef.current) {
        clearTimeout(undoDeleteTimerRef.current);
      }
    };
  }, []);

  const clearUndoDeleteTimer = () => {
    if (undoDeleteTimerRef.current) {
      clearTimeout(undoDeleteTimerRef.current);
      undoDeleteTimerRef.current = null;
    }
  };

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

  const handleDismissReminder = async (id) => {
    const item = timelineItems.find((i) => i.id === id);
    if (item?.dbId) {
      try {
        await deleteReminder(db, item.dbId);
      } catch (err) {
        console.error('Failed to delete reminder:', err);
      }
    }
    setTimelineItems((prev) => prev.filter((i) => i.id !== id));
    setOpenTaskMenuId(null);
    showToast(t('reminderDismissed'));
  };

  const handleTaskMenuAction = async (id, action) => {
    setOpenTaskMenuId(null);

    if (action === 'snooze') {
      const item = timelineItems.find((i) => i.id === id);
      if (item && item.kind === 'task') {
        setEditingTask(item);
        setShowUpdateTask(true);
      }
      return;
    }

    // done or skip — delete from DB
    const item = timelineItems.find((i) => i.id === id);
    if (item?.dbId) {
      try {
        if (action === 'done') {
          await insertActivity(db, {
            cropId,
            title: item.title,
            remark: t('taskMarkedDone'),
            date: new Date(),
          });
        }
        await deleteTask(db, item.dbId);
        loadAllData();
      } catch (err) {
        console.error('Failed to process task:', err);
      }
    }
    showToast(action === 'done' ? t('taskMarkedDone') : t('taskSkipped'));
  };

  const handleActivityMenuAction = async (id, action) => {
    setOpenLogMenuId(null);

    if (action === 'delete') {
      const item = activityLogs.find((a) => a.id === id);
      if (item?.dbId) {
        try {
          await deleteActivity(db, item.dbId);
        } catch (err) {
          console.error('Failed to delete activity:', err);
        }
      }
      setActivityLogs((prev) => prev.filter((a) => a.id !== id));
      showToast(t('activityLogDeleted'));
      return;
    }
    if (action === 'edit') {
      const item = activityLogs.find((a) => a.id === id);
      if (!item) return;
      setEditingActivity(item);
      setShowEditActivity(true);
    }
  };

  const handleExpenseMenuAction = async (id, action) => {
    setOpenExpenseMenuId(null);

    if (action === 'delete') {
      const item = expenses.find((e) => e.id === id);
      if (item?.dbId) {
        try {
          await deleteExpense(db, item.dbId);
        } catch (err) {
          console.error('Failed to delete expense:', err);
        }
      }
      setExpenses((prev) => prev.filter((e) => e.id !== id));
      showToast(t('expenseDeleted'));
      return;
    }

      const item = expenses.find((e) => e.id === id);
    if (!item) return;
    setEditingExpense(item);
    setShowEditExpense(true);
  };

  const handleEarningMenuAction = async (id, action) => {
    setOpenEarningMenuId(null);

    if (action === 'delete') {
      const item = earnings.find((e) => e.id === id);
      if (item?.dbId) {
        try {
          await deleteEarning(db, item.dbId);
        } catch (err) {
          console.error('Failed to delete earning:', err);
        }
      }
      setEarnings((prev) => prev.filter((e) => e.id !== id));
      showToast(t('earningDeleted'));
      return;
    }

    const item = earnings.find((e) => e.id === id);
    if (!item) return;
    setEditingEarning(item);
    setShowEditEarning(true);
  };

  const handleDeleteCropConfirm = async () => {
    if (!cropId || isDeletingCrop) {
      if (!cropId) {
        setShowDeleteConfirm(false);
        showToast(t('unableToDeleteCrop'));
      }
      return;
    }

    setIsDeletingCrop(true);

    try {
      await deleteCrop(db, cropId);

      clearUndoDeleteTimer();
      
      setTimelineItems([]);
      setActivityLogs([]);
      setExpenses([]);
      setEarnings([]);

      setShowDeleteConfirm(false);
      setShowDeleteSuccess(true);
    } catch (err) {
      console.error('Failed to delete crop:', err);
      setShowDeleteConfirm(false);
      showToast(t('failedDeleteCrop'));
    } finally {
      setIsDeletingCrop(false);
    }
  };

  const handleDeleteSuccessDismiss = () => {
    setShowDeleteSuccess(false);
    if (typeof navigation.popToTop === 'function') {
      navigation.popToTop();
      return;
    }

    navigation.navigate('Crops', { screen: 'CropsMain' });
  };

  const closeMenus = () => {
    setShowHeaderMenu(false);
    setOpenTaskMenuId(null);
    setOpenLogMenuId(null);
    setOpenExpenseMenuId(null);
    setOpenEarningMenuId(null);
  };

  const handleHeaderMenuAction = async (action) => {
    setShowHeaderMenu(false);

    if (action === 'delete') {
      setShowDeleteConfirm(true);
      return;
    }

    if (action === 'deactivate') {
      if (!cropId) return;
      try {
        const newStatus = cropStatus === 'active' ? 'inactive' : 'active';
        await updateCropStatus(db, cropId, newStatus);
        setCropStatus(newStatus);
        setStatusModal({ visible: true, newStatus });
      } catch (err) {
        console.error('Failed to update crop status:', err);
        showToast(t('actionFailedToast'));
      }
      return;
    }

    navigation.navigate('EditCrop', { cropDbId: cropId });
  };

  const handleTabPress = (tab) => {
    closeMenus();
    setActiveTab(tab);
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) => {
          const { dx, dy } = gestureState;
          return Math.abs(dx) > 14 && Math.abs(dx) > Math.abs(dy) * 1.25;
        },
        onMoveShouldSetPanResponderCapture: (_, gestureState) => {
          const { dx, dy } = gestureState;
          return Math.abs(dx) > 14 && Math.abs(dx) > Math.abs(dy) * 1.25;
        },
        onPanResponderRelease: (_, gestureState) => {
          if (menuIsOpen) return;

          const { dx, dy, vx } = gestureState;
          const horizontalIntent = Math.abs(dx) > Math.abs(dy);
          const crossedDistance = Math.abs(dx) >= SWIPE_DISTANCE_THRESHOLD;
          const crossedVelocity = Math.abs(vx) >= SWIPE_VELOCITY_THRESHOLD && Math.abs(dx) >= 18;

          if (!horizontalIntent || (!crossedDistance && !crossedVelocity)) {
            return;
          }

          const currentIndex = DETAIL_TABS.indexOf(activeTab);
          if (currentIndex < 0) return;

          const nextIndex = dx < 0
            ? Math.min(currentIndex + 1, DETAIL_TABS.length - 1)
            : Math.max(currentIndex - 1, 0);

          if (nextIndex !== currentIndex) {
            handleTabPress(DETAIL_TABS[nextIndex]);
          }
        },
      }),
    [activeTab, menuIsOpen],
  );

  return (
    <SafeAreaView className="flex-1 bg-background-light" edges={['top']}>
      <CropDetailsHeader
        cropName={cropName}
        cropLocation={cropLocation}
        totalArea={crop?.totalArea}
        areaUnit={crop?.areaUnit}
        cropStatus={cropStatus}
        activeTab={activeTab}
        showHeaderMenu={showHeaderMenu}
        onBack={() => navigation.goBack()}
        onCropNamePress={() => navigation.navigate('EditCrop', { cropDbId: cropId })}
        onCalendarPress={() => {
          closeMenus();
          setShowCreateReminder(true);
        }}
        onMenuToggle={() => {
          setOpenTaskMenuId(null);
          setOpenLogMenuId(null);
          setOpenExpenseMenuId(null);
          setOpenEarningMenuId(null);
          setShowHeaderMenu((prev) => !prev);
        }}
        onMenuAction={handleHeaderMenuAction}
        onTabPress={handleTabPress}
      />

      <View className="flex-1" {...panResponder.panHandlers}>
        <ScrollView
          className="flex-1"
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onScrollBeginDrag={closeMenus}
        >
          <Pressable onPress={() => menuIsOpen && closeMenus()}>
            {activeTab === 'Actions' ? (
              <View className="px-4 pt-4 gap-4">
                <View className="bg-primary/10 border border-primary/20 rounded-2xl p-5">
                  <View className="flex-row items-center justify-between mb-4">
                    <Text className="text-xs font-bold uppercase tracking-widest text-slate-500">
                      {t('actionCenter')}
                    </Text>
                    <View className="bg-primary/20 px-2 py-0.5 rounded">
                      <Text className="text-[10px] font-bold uppercase text-primary">{t('updatesToday')}</Text>
                    </View>
                  </View>

                  <View className="flex-row gap-3">
                    <View className="flex-1 bg-white/40 p-3 rounded-xl border border-white/50">
                      <View className="flex-row items-center gap-2 mb-1">
                        <MaterialIcons name="task-alt" size={14} color="#166534" />
                        <Text className="text-xs text-slate-500 font-bold uppercase">{t('pendingTasks')}</Text>
                      </View>
                      <Text className="text-xl font-bold text-slate-900">
                        {formatCount(pendingTaskCount)}
                      </Text>
                    </View>

                    <View className="flex-1 bg-white/40 p-3 rounded-xl border border-white/50">
                      <View className="flex-row items-center gap-2 mb-1">
                        <MaterialIcons name="notifications-active" size={14} color="#f97316" />
                        <Text className="text-xs text-slate-500 font-bold uppercase">{t('reminders')}</Text>
                      </View>
                      <Text className="text-xl font-bold text-slate-900">{formatCount(reminderCount)}</Text>
                    </View>
                  </View>
                </View>

                <View className="gap-3">
                  <Text className="text-xs font-bold uppercase text-slate-400 px-1">{t('timeline')}</Text>
                  {timelineItems.map((item) => (
                    <TimelineItemCard
                      key={item.id}
                      item={item}
                      isMenuOpen={openTaskMenuId === item.id}
                      onToggleMenu={(id) => {
                        setShowHeaderMenu(false);
                        setOpenLogMenuId(null);
                        setOpenExpenseMenuId(null);
                        setOpenEarningMenuId(null);
                        setOpenTaskMenuId((prev) => (prev === id ? null : id));
                      }}
                      onDismiss={handleDismissReminder}
                      onMenuAction={handleTaskMenuAction}
                    />
                  ))}
                </View>
              </View>
            ) : activeTab === 'Activity Logs' ? (
              <View className="px-4 pt-4 gap-3">
                {activityLogs.map((log) => (
                  <ActivityLogCard
                    key={log.id}
                    log={log}
                    isMenuOpen={openLogMenuId === log.id}
                    onToggleMenu={(id) => {
                      setShowHeaderMenu(false);
                      setOpenTaskMenuId(null);
                      setOpenExpenseMenuId(null);
                      setOpenEarningMenuId(null);
                      setOpenLogMenuId((prev) => (prev === id ? null : id));
                    }}
                    onMenuAction={handleActivityMenuAction}
                  />
                ))}

                <View className="flex-col items-center justify-center py-8 opacity-40">
                  <MaterialIcons name="history" size={26} color="#64748b" />
                  <Text className="text-sm mt-1 font-medium uppercase tracking-widest text-slate-500">
                    {t('endOfRecentActivities')}
                  </Text>
                </View>
              </View>
            ) : activeTab === 'Expenses' ? (
              <View className="px-4 pt-4 gap-4">
                <View className="bg-primary/10 border border-primary/20 rounded-2xl p-6 mb-2">
                  <Text className="text-sm font-medium text-slate-600 mb-1">{t('totalInvestment')}</Text>
                  <Text className="text-3xl font-bold text-slate-900">{formatCurrency(totalInvestment)}</Text>
                </View>

                <View className="gap-3">
                  {expenses.map((expense) => (
                    <ExpenseCard
                      key={expense.id}
                      expense={expense}
                      isMenuOpen={openExpenseMenuId === expense.id}
                      onToggleMenu={(id) => {
                        setShowHeaderMenu(false);
                        setOpenTaskMenuId(null);
                        setOpenLogMenuId(null);
                        setOpenEarningMenuId(null);
                        setOpenExpenseMenuId((prev) => (prev === id ? null : id));
                      }}
                      onMenuAction={handleExpenseMenuAction}
                    />
                  ))}
                </View>
              </View>
            ) : (
              <View className="px-4 pt-4 gap-4">
                <View className="bg-primary/10 border border-primary/20 rounded-2xl p-6 mb-2">
                  <Text className="text-sm font-medium text-slate-600 mb-1">{t('totalEarnings')}</Text>
                  <Text className="text-3xl font-bold text-slate-900">{formatCurrency(totalEarnings)}</Text>
                </View>

                <View className="gap-3">
                  {earnings.map((earning) => (
                    <EarningCard
                      key={earning.id}
                      earning={earning}
                      isMenuOpen={openEarningMenuId === earning.id}
                      onToggleMenu={(id) => {
                        setShowHeaderMenu(false);
                        setOpenTaskMenuId(null);
                        setOpenLogMenuId(null);
                        setOpenExpenseMenuId(null);
                        setOpenEarningMenuId((prev) => (prev === id ? null : id));
                      }}
                      onMenuAction={handleEarningMenuAction}
                    />
                  ))}
                </View>
              </View>
            )}
          </Pressable>
        </ScrollView>
      </View>

      {toastMessage ? (
        <Animated.View
          style={[
            styles.toast,
            {
              bottom: activeTab === 'Actions' ? (insets.bottom || 0) + 106 : (insets.bottom || 0) + 96,
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

      {activeTab === 'Actions' ? (
        <View
          className="absolute right-6 items-end gap-3"
          style={{ bottom: (insets.bottom || 0) + 26 }}
        >
          <TouchableOpacity
            className="flex-row items-center gap-2 bg-white border border-primary/20 py-2 px-4 rounded-full"
            style={styles.secondaryFabShadow}
            activeOpacity={0.85}
            onPress={() => setShowCreateTask(true)}
          >
            <MaterialIcons name="add-task" size={24} color="#166534" />
            <Text className="text-sm font-bold uppercase tracking-widest text-slate-900">
              {t('addTask')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-row items-center gap-2 bg-primary py-2.5 px-4 rounded-full"
            style={styles.primaryFabShadow}
            activeOpacity={0.85}
            onPress={() => setShowCreateReminder(true)}
          >
            <MaterialIcons name="notification-add" size={24} color="#ffffff" />
            <Text className="text-sm font-bold uppercase tracking-widest text-white">
              {t('createReminder')}
            </Text>
          </TouchableOpacity>
        </View>
      ) : activeTab === 'Activity Logs' ? (
        <View
          className="absolute left-0 right-0 items-center"
          style={{ bottom: (insets.bottom || 0) + 24 }}
        >
          <TouchableOpacity
            className="flex-row items-center gap-2 bg-primary py-4 px-10 rounded-full"
            style={styles.primaryFabShadow}
            activeOpacity={0.85}
            onPress={() => {
              closeMenus();
              setShowCreateActivity(true);
            }}
          >
            <MaterialIcons name="add" size={24} color="#ffffff" />
            <Text className="font-bold text-white">{t('addActivity')}</Text>
          </TouchableOpacity>
        </View>
      ) : activeTab === 'Expenses' ? (
        <View
          className="absolute left-0 right-0 items-center"
          style={{ bottom: (insets.bottom || 0) + 24 }}
        >
          <TouchableOpacity
            className="flex-row items-center gap-2 bg-primary py-4 px-10 rounded-full"
            style={styles.primaryFabShadow}
            activeOpacity={0.85}
            onPress={() => {
              closeMenus();
              setShowCreateExpense(true);
            }}
          >
            <MaterialIcons name="add" size={24} color="#ffffff" />
            <Text className="font-bold text-white">{t('addExpense')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View
          className="absolute left-0 right-0 items-center"
          style={{ bottom: (insets.bottom || 0) + 24 }}
        >
          <TouchableOpacity
            className="flex-row items-center gap-2 bg-primary py-4 px-10 rounded-full"
            style={styles.primaryFabShadow}
            activeOpacity={0.85}
            onPress={() => {
              closeMenus();
              setShowCreateEarnings(true);
            }}
          >
            <MaterialIcons name="add" size={24} color="#ffffff" />
            <Text className="font-bold text-white">{t('addEarnings')}</Text>
          </TouchableOpacity>
        </View>
      )}

      <CreateTaskModal
        visible={showCreateTask}
        onClose={() => setShowCreateTask(false)}
        onSave={async (taskData) => {
          try {
            await insertTask(db, { ...taskData, cropId });
            setShowCreateTask(false);
            await loadAllData();
            showToast(t('taskCreatedToast'));
          } catch (err) {
            console.error('Failed to insert task:', err);
            showToast(t('taskCreateFailedToast'));
          }
        }}
      />

      <CreateReminderModal
        visible={showCreateReminder}
        onClose={() => setShowCreateReminder(false)}
        onSave={async (reminderData) => {
          try {
            await insertReminder(db, { ...reminderData, cropId });
            setShowCreateReminder(false);
            await loadAllData();
            showToast(t('reminderCreatedToast'));
          } catch (err) {
            console.error('Failed to insert reminder:', err);
            showToast(t('reminderCreateFailedToast'));
          }
        }}
      />

      <CreateActivityModal
        visible={showCreateActivity}
        onClose={() => setShowCreateActivity(false)}
        onSave={async ({ activityName, remarks, date }) => {
          const title = activityName || t('untitledActivity');
          const remark = remarks || null;

          try {
            await insertActivity(db, { cropId, title, remark, date: date || new Date() });
            setShowCreateActivity(false);
            await loadAllData();
            showToast(t('activityAdded'));
          } catch (err) {
            console.error('Failed to insert activity:', err);
            showToast(t('activitySaveFailed'));
          }
        }}
      />

      <CreateExpenseModal
        visible={showCreateExpense}
        onClose={() => setShowCreateExpense(false)}
        onSave={async ({ expenseName, remarks, amount, date }) => {
          const title = expenseName || t('untitledExpense');
          const remark = remarks || null;

          try {
            await insertExpense(db, {
              cropId,
              title,
              remark,
              amount: Number.isFinite(amount) ? amount : 0,
              date: date || new Date(),
            });
            setShowCreateExpense(false);
            await loadAllData();
            showToast(t('expenseAdded'));
          } catch (err) {
            console.error('Failed to insert expense:', err);
            showToast(t('expenseSaveFailed'));
          }
        }}
      />

      <CreateEarningsModal
        visible={showCreateEarnings}
        onClose={() => setShowCreateEarnings(false)}
        onSave={async ({ earningName, remarks, amount, date }) => {
          const title = earningName || t('untitledEarning');
          const remark = remarks || null;

          clearUndoDeleteTimer();
          

          try {
            await insertEarning(db, {
              cropId,
              title,
              remark,
              amount: Number.isFinite(amount) ? amount : 0,
              date: date || new Date(),
            });
            setShowCreateEarnings(false);
            await loadAllData();
            showToast(t('earningAdded'));
          } catch (err) {
            console.error('Failed to insert earning:', err);
            showToast(t('earningSaveFailed'));
          }
        }}
      />

        <EditActivityLogModal
        visible={showEditActivity}
        activity={editingActivity}
        onClose={() => {
          setShowEditActivity(false);
          setEditingActivity(null);
        }}
        onSave={async ({ id, activityName, remarks, date }) => {
          const item = activityLogs.find((e) => e.id === id);
          if (!item?.dbId) return;

          const title = activityName || t('untitledActivity');
          const remark = remarks || null;

          try {
            await updateActivity(db, item.dbId, {
              title,
              remark,
              date: date || new Date(),
            });
            setShowEditActivity(false);
            setEditingActivity(null);
            await loadAllData();
            showToast(t('activityUpdated'));
          } catch (err) {
            console.error('Failed to update activity:', err);
            showToast(t('activityUpdateFailed'));
          }
        }}
      />


      <EditEarningModal
        visible={showEditEarning}
        earning={editingEarning}
        onClose={() => {
          setShowEditEarning(false);
          setEditingEarning(null);
        }}
        onSave={async ({ id, earningName, remarks, amount, date }) => {
          const item = earnings.find((e) => e.id === id);
          if (!item?.dbId) return;

          const title = earningName || t('untitledEarning');
          const remark = remarks || null;

          try {
            await updateEarning(db, item.dbId, {
              title,
              remark,
              amount: Number.isFinite(amount) ? amount : 0,
              date: date || new Date(),
            });
            setShowEditEarning(false);
            setEditingEarning(null);
            await loadAllData();
            showToast(t('earningUpdated'));
          } catch (err) {
            console.error('Failed to update earning:', err);
            showToast(t('earningUpdateFailed'));
          }
        }}
      />

       <EditExpenseModal
        visible={showEditExpense}
        expense={editingExpense}
        onClose={() => {
          setShowEditExpense(false);
          setEditingExpense(null);
        }}
        onSave={async ({ id, expenseName, remarks, amount, date }) => {
          const item = expenses.find((e) => e.id === id);
          if (!item?.dbId) return;

          const title = expenseName || t('untitledExpense');
          const remark = remarks || null;

          try {
            await updateExpense(db, item.dbId, {
              title,
              remark,
              amount: Number.isFinite(amount) ? amount : 0,
              date: date || new Date(),
            });
            setShowEditExpense(false);
            setEditingExpense(null);
            await loadAllData();
            showToast(t('expenseUpdated'));
          } catch (err) {
            console.error('Failed to update expense:', err);
            showToast(t('expenseUpdateFailed'));
          }
        }}
      />

      <DeleteCropConfirmModal
        visible={showDeleteConfirm}
        isDeletingCrop={isDeletingCrop}
        onConfirm={handleDeleteCropConfirm}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      <DeleteCropSuccessModal
        visible={showDeleteSuccess}
        onDismiss={handleDeleteSuccessDismiss}
      />

      <UpdateTaskModal
        visible={showUpdateTask}
        taskData={editingTask}
        onClose={() => {
          setShowUpdateTask(false);
          setEditingTask(null);
        }}
        onSave={async (taskData) => {
          if (!editingTask?.dbId) return;
          try {
            await updateTask(db, editingTask.dbId, taskData);
            setShowUpdateTask(false);
            setEditingTask(null);
            await loadAllData();
            showToast(t('taskUpdatedToast'));
          } catch (err) {
            console.error('Failed to update task:', err);
            showToast(t('taskUpdateFailedToast'));
          }
        }}
      />

      <CropResultModal
        visible={statusModal.visible}
        type="success"
        variant={statusModal.newStatus === 'active' ? 'bottom' : 'center'}
        title={statusModal.newStatus === 'active' ? t('cropReactivated') : t('cropDeactivated')}
        message={
          statusModal.newStatus === 'active'
            ? t('cropReactivateSuccess')
            : t('cropDeactivateSuccess')
        }
        buttonText={statusModal.newStatus === 'active' ? t('great') : t('gotIt')}
        onDismiss={() => {
          setStatusModal({ visible: false, newStatus: '' });
          navigation.goBack();
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 180,
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
  secondaryFabShadow: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 7,
    elevation: 5,
  },
  primaryFabShadow: {
    shadowColor: '#166534',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 9,
    elevation: 8,
  },
});




