import React, { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import {
  Animated,
  PanResponder,
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
import CreateExpenseModal from '../components/CreateExpenseModal';
import CreateEarningsModal from '../components/CreateEarningsModal';
import { useDatabase } from '../database/DatabaseProvider';
import { updateCropStatus } from '../database/cropService';
import { insertTask, getTasksByCrop, deleteTask } from '../database/taskService';
import { insertReminder, getRemindersByCrop, deleteReminder } from '../database/reminderService';
import { insertActivity, getActivitiesByCrop, deleteActivity } from '../database/activityService';
import { insertExpense, getExpensesByCrop, deleteExpense } from '../database/expenseService';
import { insertEarning, getEarningsByCrop, deleteEarning } from '../database/earningService';
import CropResultModal from '../components/CropResultModal';

const DETAIL_TABS = ['Actions', 'Activity Logs', 'Expenses', 'Earnings'];
const SWIPE_DISTANCE_THRESHOLD = 56;
const SWIPE_VELOCITY_THRESHOLD = 0.42;

// No more hardcoded data — everything is loaded from the database

function formatCount(value) {
  return String(value).padStart(2, '0');
}

function formatCurrency(amount) {
  return `₹${Number(amount || 0).toLocaleString('en-IN')}`;
}

function formatActivityDate(date) {
  return `${date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })} • just now`;
}

function formatEntryDate(date) {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function getActivityIcon(activityName) {
  const normalized = (activityName || '').toLowerCase();

  if (normalized.includes('water') || normalized.includes('irrig')) {
    return 'water-drop';
  }

  if (normalized.includes('soil') || normalized.includes('ph') || normalized.includes('nutrient')) {
    return 'science';
  }

  if (normalized.includes('pest') || normalized.includes('spray')) {
    return 'bug-report';
  }

  return 'agriculture';
}

function getExpenseIcon(expenseName) {
  const normalized = (expenseName || '').toLowerCase();

  if (normalized.includes('water') || normalized.includes('irrig') || normalized.includes('diesel')) {
    return 'water-drop';
  }

  if (normalized.includes('labor') || normalized.includes('wage') || normalized.includes('worker')) {
    return 'group';
  }

  if (normalized.includes('fert') || normalized.includes('seed') || normalized.includes('pesticide')) {
    return 'shopping-basket';
  }

  return 'payments';
}

function getEarningIcon(earningName) {
  const normalized = (earningName || '').toLowerCase();

  if (normalized.includes('subsidy') || normalized.includes('grant')) {
    return 'paid';
  }

  if (normalized.includes('straw') || normalized.includes('transport') || normalized.includes('shipping')) {
    return 'local-shipping';
  }

  if (normalized.includes('sale') || normalized.includes('crop') || normalized.includes('mandi')) {
    return 'payments';
  }

  return 'payments';
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

  return (
    <View className="h-6 w-6 rounded-md border-2 border-primary/30 items-center justify-center" />
  );
}

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

function TimelineItemCard({
  item,
  isMenuOpen,
  onToggleMenu,
  onDismiss,
  onMenuAction,
}) {
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
    <View className={`relative p-4 rounded-2xl shadow-sm ${cardClass}`}>
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
                  <Text className="text-sm font-medium text-slate-700">Mark as Done</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="px-4 py-2"
                  activeOpacity={0.7}
                  onPress={() => onMenuAction(item.id, 'skip')}
                >
                  <Text className="text-sm font-medium text-slate-700">Skip</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="px-4 py-2"
                  activeOpacity={0.7}
                  onPress={() => onMenuAction(item.id, 'snooze')}
                >
                  <Text className="text-sm font-medium text-slate-700">Snooze</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        )}
      </View>
    </View>
  );
}

function ActivityLogCard({
  log,
  isMenuOpen,
  onToggleMenu,
  onMenuAction,
}) {
  return (
    <View className="bg-white border border-primary/10 p-4 relative shadow-sm rounded-2xl">
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

function ExpenseCard({
  expense,
  isMenuOpen,
  onToggleMenu,
  onMenuAction,
}) {
  return (
    <View className={`bg-white border border-primary/10 p-4 relative shadow-sm rounded-2xl ${expense.isMuted ? 'opacity-80' : ''}`}>
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
            <Text className="text-sm font-medium text-slate-700">Edit Expense</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="px-4 py-2"
            activeOpacity={0.7}
            onPress={() => onMenuAction(expense.id, 'delete')}
          >
            <Text className="text-sm font-medium text-red-600">Delete Expense</Text>
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
          <Text className="font-semibold text-slate-700">Remarks: </Text>
          <Text className="italic">{expense.remarks}</Text>
        </Text>
      </View>
    </View>
  );
}

function EarningCard({
  earning,
  isMenuOpen,
  onToggleMenu,
  onMenuAction,
}) {
  return (
    <View className="bg-white border border-primary/10 p-4 relative shadow-sm rounded-2xl">
      <View className="flex-row items-start justify-between">
        <View className="flex-row items-center gap-3 flex-1">
          <View className="bg-primary/20 p-2 rounded-lg">
            <MaterialIcons name={earning.icon} size={20} color="#3ce619" />
          </View>

          <View className="flex-1">
            <Text className="font-bold text-slate-900">{earning.title}</Text>
            <Text className="text-xs text-slate-500">{earning.dateText}</Text>
          </View>
        </View>

        <View className="flex-row items-center gap-2">
          <Text className="text-xl font-bold text-green-700">{formatCurrency(earning.amount)}</Text>

          <View className="relative">
            <TouchableOpacity
              className="p-1 rounded-full"
              activeOpacity={0.75}
              onPress={() => onToggleMenu(earning.id)}
            >
              <MaterialIcons name="more-vert" size={20} color="#94a3b8" />
            </TouchableOpacity>

            {isMenuOpen ? (
              <View style={styles.dropdownMenuCompact}>
                <TouchableOpacity
                  className="px-4 py-3 flex-row items-center"
                  activeOpacity={0.7}
                  onPress={() => onMenuAction(earning.id, 'edit')}
                >
                  <MaterialIcons name="edit" size={16} color="#334155" />
                  <Text className="ml-2 text-sm font-medium text-slate-700">Edit</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className="px-4 py-3 flex-row items-center border-t border-slate-100"
                  activeOpacity={0.7}
                  onPress={() => onMenuAction(earning.id, 'delete')}
                >
                  <MaterialIcons name="delete" size={16} color="#dc2626" />
                  <Text className="ml-2 text-sm font-medium text-red-600">Delete</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        </View>
      </View>

      <View className="mt-4 bg-background-light p-3 rounded-lg border border-primary/5">
        <Text className="text-sm text-slate-600 leading-relaxed">
          <Text className="font-semibold text-slate-700">Remarks: </Text>
          <Text className="italic">{earning.remarks}</Text>
        </Text>
      </View>
    </View>
  );
}

export default function CropDetailsActionsScreen({ navigation, route }) {
  const db = useDatabase();
  const cropId = route?.params?.crop?.dbId || null;

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
  const [deletedEarning, setDeletedEarning] = useState(null);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [showCreateReminder, setShowCreateReminder] = useState(false);
  const [showCreateActivity, setShowCreateActivity] = useState(false);
  const [showCreateExpense, setShowCreateExpense] = useState(false);
  const [showCreateEarnings, setShowCreateEarnings] = useState(false);
  const undoDeleteTimerRef = useRef(null);

  const toastY = useRef(new Animated.Value(24)).current;
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

  const cropName = route?.params?.crop?.name || 'Wheat';
  const cropLocation = route?.params?.crop?.location || 'North Field • 2 Acres';

  // ── Load all data for this crop from the database ───────────
  const loadAllData = useCallback(async () => {
    if (!cropId) return;

    try {
      // Load tasks → timeline items
      const taskRows = await getTasksByCrop(db, cropId);
      const taskItems = taskRows.map((t) => ({
        id: `t-${t.id}`,
        dbId: t.id,
        kind: 'task',
        taskState: 'dueToday',
        title: t.taskName,
        statusText: t.startDate || 'No date set',
      }));

      // Load reminders → timeline items
      const reminderRows = await getRemindersByCrop(db, cropId);
      const reminderItems = reminderRows.map((r) => ({
        id: `r-${r.id}`,
        dbId: r.id,
        kind: 'reminder',
        title: r.details,
        statusText: `${r.reminderDate}${r.reminderTime ? ' • ' + r.reminderTime : ''}`,
        icon: 'notifications',
        iconBgClass: 'bg-orange-100',
        iconColor: '#ea580c',
      }));

      setTimelineItems([...reminderItems, ...taskItems]);

      // Load activity logs
      const activityRows = await getActivitiesByCrop(db, cropId);
      setActivityLogs(
        activityRows.map((a) => ({
          id: `a-${a.id}`,
          dbId: a.id,
          title: a.title,
          icon: getActivityIcon(a.title),
          dateText: a.date,
          remarks: a.remark || 'No remarks',
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
          remarks: e.remark || 'No remarks',
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
          remarks: n.remark || 'No remarks',
        })),
      );
    } catch (err) {
      console.error('Failed to load crop data:', err);
    }
  }, [db, cropId]);

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

  const queueDeletedEarning = (item, index) => {
    clearUndoDeleteTimer();
    setDeletedEarning({ item, index });

    undoDeleteTimerRef.current = setTimeout(() => {
      setDeletedEarning(null);
      undoDeleteTimerRef.current = null;
    }, 4000);
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
    showToast('Reminder dismissed.');
  };

  const handleTaskMenuAction = async (id, action) => {
    setOpenTaskMenuId(null);

    if (action === 'snooze') {
      setTimelineItems((prev) =>
        prev.map((item) => {
          if (item.id !== id) return item;

          return {
            ...item,
            taskState: 'snoozed',
            statusText: 'Snoozed until Nov 22, 09:00 AM',
          };
        }),
      );
      showToast('Task snoozed.');
      return;
    }

    // done or skip — delete from DB
    const item = timelineItems.find((i) => i.id === id);
    if (item?.dbId) {
      try {
        await deleteTask(db, item.dbId);
      } catch (err) {
        console.error('Failed to delete task:', err);
      }
    }
    setTimelineItems((prev) => prev.filter((i) => i.id !== id));
    showToast(action === 'done' ? 'Task marked as done.' : 'Task skipped.');
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
      showToast('Activity log deleted.');
      return;
    }

    showToast('Edit activity coming soon.');
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
      showToast('Expense deleted.');
      return;
    }

    showToast('Edit expense coming soon.');
  };

  const handleEarningMenuAction = async (id, action) => {
    setOpenEarningMenuId(null);

    if (action === 'delete') {
      const deleteIndex = earnings.findIndex((item) => item.id === id);
      if (deleteIndex === -1) return;

      const itemToDelete = earnings[deleteIndex];
      if (itemToDelete?.dbId) {
        try {
          await deleteEarning(db, itemToDelete.dbId);
        } catch (err) {
          console.error('Failed to delete earning:', err);
        }
      }
      setEarnings((prev) => prev.filter((item) => item.id !== id));
      queueDeletedEarning(itemToDelete, deleteIndex);
      return;
    }

    showToast('Edit earning coming soon.');
  };

  const handleUndoDeleteEarning = () => {
    if (!deletedEarning) return;

    clearUndoDeleteTimer();
    setEarnings((prev) => {
      const next = [...prev];
      const insertAt = Math.min(deletedEarning.index, next.length);
      next.splice(insertAt, 0, deletedEarning.item);
      return next;
    });
    setDeletedEarning(null);
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
      showToast('Delete crop flow coming soon.');
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
        showToast('Failed to update crop status.');
      }
      return;
    }

    navigation.navigate('EditCrop', { cropDbId: cropId });
  };

  const handleTabPress = (tab) => {
    closeMenus();

    if (tab !== 'Earnings') {
      clearUndoDeleteTimer();
      setDeletedEarning(null);
    }

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
      <View className="bg-background-light border-b border-primary/10 relative z-30">
        <View className="flex-row items-center justify-between px-4 py-3">
          <View className="flex-row items-center gap-3 flex-1">
            <TouchableOpacity
              className="h-10 w-10 rounded-full items-center justify-center"
              activeOpacity={0.75}
              onPress={() => navigation.goBack()}
            >
              <MaterialIcons name="arrow-back" size={22} color="#0f172a" />
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1"
              activeOpacity={0.7}
              onPress={() => navigation.navigate('EditCrop', { cropDbId: cropId })}
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
              onPress={() => {
                closeMenus();
                setShowCreateReminder(true);
              }}
            >
              <MaterialIcons name="calendar-today" size={18} color="#475569" />
            </TouchableOpacity>
            <TouchableOpacity
              className="h-10 w-10 rounded-full items-center justify-center"
              activeOpacity={0.75}
              onPress={() => {
                setOpenTaskMenuId(null);
                setOpenLogMenuId(null);
                setOpenExpenseMenuId(null);
                setOpenEarningMenuId(null);
                setShowHeaderMenu((prev) => !prev);
              }}
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
              onPress={() => handleHeaderMenuAction('edit')}
            >
              <MaterialIcons name="edit" size={18} color="#475569" />
              <Text className="ml-3 text-sm text-slate-700">Edit crop details</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="w-full flex-row items-center px-4 py-3 border-b border-slate-100"
              activeOpacity={0.7}
              onPress={() => handleHeaderMenuAction('deactivate')}
            >
              <MaterialIcons name={cropStatus === 'active' ? 'pause-circle' : 'play-circle'} size={18} color="#475569" />
              <Text className="ml-3 text-sm text-slate-700">{cropStatus === 'active' ? 'Deactivate crop' : 'Activate crop'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="w-full flex-row items-center px-4 py-3"
              activeOpacity={0.7}
              onPress={() => handleHeaderMenuAction('delete')}
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
                onPress={() => handleTabPress(tab)}
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

      {menuIsOpen ? (
        <TouchableWithoutFeedback onPress={closeMenus}>
          <View style={styles.menuBackdrop} />
        </TouchableWithoutFeedback>
      ) : null}

      <View className="flex-1" {...panResponder.panHandlers}>
        <ScrollView
          className="flex-1"
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {activeTab === 'Actions' ? (
            <View className="px-4 pt-4 gap-4">
              <View className="bg-primary/10 border border-primary/20 rounded-2xl p-5">
                <View className="flex-row items-center justify-between mb-4">
                  <Text className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    Action Center
                  </Text>
                  <View className="bg-primary/20 px-2 py-0.5 rounded">
                    <Text className="text-[10px] font-bold uppercase text-primary">Updates today</Text>
                  </View>
                </View>

                <View className="flex-row gap-3">
                  <View className="flex-1 bg-white/40 p-3 rounded-xl border border-white/50">
                    <View className="flex-row items-center gap-2 mb-1">
                      <MaterialIcons name="task-alt" size={14} color="#3ce619" />
                      <Text className="text-[10px] text-slate-500 font-bold uppercase">Pending Tasks</Text>
                    </View>
                    <Text className="text-2xl font-bold text-slate-900">
                      {formatCount(pendingTaskCount)}
                    </Text>
                  </View>

                  <View className="flex-1 bg-white/40 p-3 rounded-xl border border-white/50">
                    <View className="flex-row items-center gap-2 mb-1">
                      <MaterialIcons name="notifications-active" size={14} color="#f97316" />
                      <Text className="text-[10px] text-slate-500 font-bold uppercase">Reminders</Text>
                    </View>
                    <Text className="text-2xl font-bold text-slate-900">{formatCount(reminderCount)}</Text>
                  </View>
                </View>
              </View>

              <View className="gap-3">
                <Text className="text-xs font-bold uppercase text-slate-400 px-1">Timeline</Text>
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
                <MaterialIcons name="history" size={30} color="#64748b" />
                <Text className="text-[10px] mt-1 font-medium uppercase tracking-widest text-slate-500">
                  End of recent activities
                </Text>
              </View>
            </View>
          ) : activeTab === 'Expenses' ? (
            <View className="px-4 pt-4 gap-4">
              <View className="bg-primary/10 border border-primary/20 rounded-2xl p-6 mb-2">
                <Text className="text-sm font-medium text-slate-600 mb-1">Total Investment</Text>
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
                <Text className="text-sm font-medium text-slate-600 mb-1">Total Earnings</Text>
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
            <MaterialIcons name="check-circle" size={14} color="#3ce619" />
          </View>
          <Text className="text-white text-xs font-medium">{toastMessage}</Text>
        </Animated.View>
      ) : null}

      {activeTab === 'Earnings' && deletedEarning ? (
        <View
          className="absolute left-4 right-4"
          style={{ bottom: (insets.bottom || 0) + 122 }}
        >
          <View
            className="bg-[#111827] px-4 py-3 rounded-xl flex-row items-center border border-white/10"
            style={styles.deleteSnackShadow}
          >
            <View className="bg-red-400/10 p-1 rounded-md">
              <MaterialIcons name="delete" size={16} color="#f87171" />
            </View>
            <Text className="text-white text-sm font-medium ml-3">Earning deleted</Text>
            <TouchableOpacity
              className="ml-auto px-2 py-1 rounded-md"
              activeOpacity={0.75}
              onPress={handleUndoDeleteEarning}
            >
              <Text className="text-primary text-xs font-bold uppercase tracking-widest">Undo</Text>
            </TouchableOpacity>
          </View>
        </View>
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
            <MaterialIcons name="add-task" size={20} color="#3ce619" />
            <Text className="text-[10px] font-bold uppercase tracking-widest text-slate-900">
              Add Task
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-row items-center gap-2 bg-primary py-2.5 px-4 rounded-full"
            style={styles.primaryFabShadow}
            activeOpacity={0.85}
            onPress={() => setShowCreateReminder(true)}
          >
            <MaterialIcons name="notification-add" size={20} color="#1a2e05" />
            <Text className="text-[10px] font-bold uppercase tracking-widest text-slate-900">
              Create Reminder
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
            <MaterialIcons name="add" size={20} color="#1a2e05" />
            <Text className="font-bold text-slate-900">Add Activity</Text>
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
            <MaterialIcons name="add" size={20} color="#1a2e05" />
            <Text className="font-bold text-slate-900">Add Expense</Text>
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
            <MaterialIcons name="add" size={20} color="#1a2e05" />
            <Text className="font-bold text-slate-900">Add Earnings</Text>
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
            showToast('Task created.');
          } catch (err) {
            console.error('Failed to insert task:', err);
            showToast('Failed to save task.');
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
            showToast('Reminder created.');
          } catch (err) {
            console.error('Failed to insert reminder:', err);
            showToast('Failed to save reminder.');
          }
        }}
      />

      <CreateActivityModal
        visible={showCreateActivity}
        onClose={() => setShowCreateActivity(false)}
        onSave={async ({ activityName, remarks, date }) => {
          const title = activityName || 'Untitled Activity';
          const remark = remarks || null;

          try {
            await insertActivity(db, { cropId, title, remark, date: date || new Date() });
            setShowCreateActivity(false);
            await loadAllData();
            showToast('Activity added.');
          } catch (err) {
            console.error('Failed to insert activity:', err);
            showToast('Failed to save activity.');
          }
        }}
      />

      <CreateExpenseModal
        visible={showCreateExpense}
        onClose={() => setShowCreateExpense(false)}
        onSave={async ({ expenseName, remarks, amount, date }) => {
          const title = expenseName || 'Untitled Expense';
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
            showToast('Expense added.');
          } catch (err) {
            console.error('Failed to insert expense:', err);
            showToast('Failed to save expense.');
          }
        }}
      />

      <CreateEarningsModal
        visible={showCreateEarnings}
        onClose={() => setShowCreateEarnings(false)}
        onSave={async ({ earningName, remarks, amount, date }) => {
          const title = earningName || 'Untitled Earning';
          const remark = remarks || null;

          clearUndoDeleteTimer();
          setDeletedEarning(null);

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
            showToast('Earning added.');
          } catch (err) {
            console.error('Failed to insert earning:', err);
            showToast('Failed to save earning.');
          }
        }}
      />

      <CropResultModal
        visible={statusModal.visible}
        type="success"
        variant={statusModal.newStatus === 'active' ? 'bottom' : 'center'}
        title={statusModal.newStatus === 'active' ? 'Crop Reactivated' : 'Crop Deactivated'}
        message={
          statusModal.newStatus === 'active'
            ? 'The crop has been successfully reactivated and is now visible in your active list.'
            : 'The crop has been successfully deactivated and moved to your archive.'
        }
        buttonText={statusModal.newStatus === 'active' ? 'Great' : 'Got it'}
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
  tabRow: {
    paddingHorizontal: 8,
  },
  menuBackdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20,
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
  dropdownMenuCompact: {
    position: 'absolute',
    top: 34,
    right: 0,
    width: 132,
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
    zIndex: 40,
    elevation: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  deleteSnackShadow: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 12,
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
    shadowColor: '#3ce619',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 9,
    elevation: 8,
  },
});
