import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import ActionCenter from '../components/ActionCenter';
import FilterTabs from '../components/FilterTabs';
import TaskCard from '../components/TaskCard';
import CreateTaskModal from '../components/CreateTaskModal';

// ─── Filter pill labels ──────────────────────────────────────
const FILTER_TABS = [
  'All',
  'Due Today',
  'Upcoming',
  'Snoozed',
  'Completed',
  'Crop-related',
  'General',
];

// ─── Dummy task data ─────────────────────────────────────────
const TASKS = [
  {
    id: '1',
    title: 'Apply Urea Fertilizer',
    categoryLabel: 'Wheat',
    categoryIcon: 'eco',
    statusText: 'Due Today • 05:00 PM',
    status: 'dueToday',
  },
  {
    id: '2',
    title: 'Repair Main Gate',
    categoryLabel: 'Infrastructure',
    categoryIcon: 'foundation',
    statusText: 'Tomorrow • 10:00 AM',
    status: 'pending',
  },
  {
    id: '3',
    title: 'Watering Corn Block B',
    categoryLabel: 'Corn',
    categoryIcon: 'eco',
    statusText: 'In Progress • Started 20m ago',
    status: 'inProgress',
  },
  {
    id: '4',
    title: 'Soil pH Testing',
    categoryLabel: 'Wheat',
    categoryIcon: 'eco',
    statusText: 'Snoozed until Nov 22, 09:00 AM',
    status: 'snoozed',
  },
];

export default function TasksScreen({ navigation, route }) {
  const [activeFilter, setActiveFilter] = useState('All');
  const [showCreateTask, setShowCreateTask] = useState(false);

  useEffect(() => {
    if (route.params?.openCreateTask) {
      setShowCreateTask(true);
      navigation.setParams({ openCreateTask: false });
    }
  }, [route.params?.openCreateTask]);

  return (
    <SafeAreaView className="flex-1 bg-background-light" edges={['top']}>
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
            My Tasks
          </Text>
          <Text className="text-xs text-slate-500">Farm & Personal</Text>
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
          <ActionCenter pendingCount={12} reminderCount={5} />
        </View>

        {/* Filter tabs */}
        <FilterTabs
          tabs={FILTER_TABS}
          activeTab={activeFilter}
          onTabChange={setActiveFilter}
        />

        {/* Timeline header */}
        <Text className="text-xs font-bold text-slate-400 uppercase px-5 mb-3">
          Timeline
        </Text>

        {/* Task cards */}
        <View className="px-4 gap-3 mb-4">
          {TASKS.map((task) => (
            <TaskCard
              key={task.id}
              title={task.title}
              categoryLabel={task.categoryLabel}
              categoryIcon={task.categoryIcon}
              statusText={task.statusText}
              status={task.status}
              onMenuPress={() => {}}
            />
          ))}
        </View>
      </ScrollView>

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
            New Task
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-row items-center gap-2 bg-primary py-3 px-5 rounded-full shadow-xl"
          activeOpacity={0.85}
          style={styles.primaryFabShadow}
        >
          <MaterialIcons name="notification-add" size={20} color="#1a2e05" />
          <Text className="text-[10px] font-bold uppercase tracking-widest text-slate-900">
            New Reminder
          </Text>
        </TouchableOpacity>
      </View>

      {/* ─── Create Task Overlay ─────────────────────── */}
      <CreateTaskModal
        visible={showCreateTask}
        onClose={() => setShowCreateTask(false)}
        onSave={(task) => {
          setShowCreateTask(false);
          // TODO: persist the task
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 160,
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
