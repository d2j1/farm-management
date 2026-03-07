import React, { useState } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { MaterialIcons } from '@expo/vector-icons';

const QUICK_REMIND_DAYS = [5, 10, 15, 20, 25, 30];

const formatDate = (date) =>
  date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

const formatTime = (date) =>
  date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

function DateTimeField({ label, value, icon, onPress }) {
  return (
    <View className="flex-1 gap-2">
      <Text className="text-slate-700 dark:text-slate-300 text-xs font-bold uppercase tracking-widest">
        {label}
      </Text>
      <TouchableOpacity
        activeOpacity={0.75}
        onPress={onPress}
        className="h-14 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 flex-row items-center"
      >
        <Text className="flex-1 text-sm font-medium text-slate-900 dark:text-slate-100">
          {value}
        </Text>
        <MaterialIcons name={icon} size={20} color="#94a3b8" />
      </TouchableOpacity>
    </View>
  );
}

function QuickRemindChip({ days, active, onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      className={`px-4 py-2.5 rounded-full border ${
        active
          ? 'bg-primary/15 border-primary/60'
          : 'bg-slate-100 dark:bg-slate-800 border-transparent'
      }`}
    >
      <Text
        className={`text-sm font-medium ${
          active
            ? 'text-primary'
            : 'text-slate-600 dark:text-slate-300'
        }`}
      >
        {days} days
      </Text>
    </TouchableOpacity>
  );
}

export default function CreateReminderModal({ visible, onClose, onSave }) {
  const [details, setDetails] = useState('');
  const [reminderDate, setReminderDate] = useState(new Date());
  const [reminderTime, setReminderTime] = useState(new Date());
  const [quickDays, setQuickDays] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const resetForm = () => {
    setDetails('');
    setReminderDate(new Date());
    setReminderTime(new Date());
    setQuickDays(null);
    setShowDatePicker(false);
    setShowTimePicker(false);
  };

  const handleCancel = () => {
    resetForm();
    onClose?.();
  };

  const handleSave = () => {
    const dateTime = new Date(reminderDate);
    dateTime.setHours(reminderTime.getHours(), reminderTime.getMinutes(), 0, 0);

    onSave?.({
      details: details.trim(),
      date: reminderDate,
      time: reminderTime,
      quickDays,
      dateTime,
    });

    resetForm();
  };

  const handleQuickRemindSelect = (days) => {
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + days);
    setQuickDays(days);
    setReminderDate(nextDate);
  };

  const handleDateChange = (_event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setReminderDate(selectedDate);
      setQuickDays(null);
    }
  };

  const handleTimeChange = (_event, selectedTime) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    if (selectedTime) {
      setReminderTime(selectedTime);
    }
  };

  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFill} className="justify-end bg-black/50">
      <TouchableOpacity
        activeOpacity={1}
        onPress={handleCancel}
        style={StyleSheet.absoluteFill}
      />

      <View className="bg-white dark:bg-slate-900 rounded-t-[32px] overflow-hidden max-h-[92%]">
        <View className="items-center py-4">
          <View className="h-1.5 w-12 rounded-full bg-slate-200 dark:bg-slate-700" />
        </View>

        <ScrollView
          className="px-6"
          bounces={false}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text className="text-slate-900 dark:text-slate-100 text-2xl font-bold tracking-tight pt-2 pb-6">
            Create New Reminder
          </Text>

          <View className="gap-2 mb-6">
            <Text className="text-slate-700 dark:text-slate-300 text-xs font-bold uppercase tracking-widest">
              Reminder Details
            </Text>
            <TextInput
              className="h-14 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 text-slate-900 dark:text-slate-100"
              placeholder="e.g. Call the vet for annual checkup"
              placeholderTextColor="#94a3b8"
              value={details}
              onChangeText={setDetails}
            />
          </View>

          <View className="flex-row gap-4 mb-6">
            <DateTimeField
              label="Date"
              value={formatDate(reminderDate)}
              icon="calendar-today"
              onPress={() => setShowDatePicker(true)}
            />
            <DateTimeField
              label="Time"
              value={formatTime(reminderTime)}
              icon="schedule"
              onPress={() => setShowTimePicker(true)}
            />
          </View>

          <View className="mb-8">
            <Text className="text-slate-700 dark:text-slate-300 text-xs font-bold uppercase tracking-widest mb-3">
              Quick Remind
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.quickRemindRow}
            >
              {QUICK_REMIND_DAYS.map((days) => (
                <QuickRemindChip
                  key={days}
                  days={days}
                  active={quickDays === days}
                  onPress={() => handleQuickRemindSelect(days)}
                />
              ))}
            </ScrollView>
            <Text className="text-[11px] text-slate-400 mt-2 italic">
              *Sets reminder relative to today's date
            </Text>
          </View>

          <View className="gap-3 pb-10">
            <TouchableOpacity
              onPress={handleSave}
              activeOpacity={0.85}
              className="w-full bg-primary py-4 rounded-xl shadow-lg items-center"
            >
              <Text className="text-slate-900 font-bold text-base">Save Reminder</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleCancel}
              activeOpacity={0.7}
              className="w-full py-3 rounded-xl items-center"
            >
              <Text className="text-slate-500 dark:text-slate-400 font-medium text-base">
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={reminderDate}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}

      {showTimePicker && (
        <DateTimePicker
          value={reminderTime}
          mode="time"
          display="default"
          onChange={handleTimeChange}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  quickRemindRow: {
    gap: 8,
    paddingBottom: 4,
  },
});
