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

const formatDate = (date) =>
  date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

export default function CreateActivityModal({ visible, onClose, onSave }) {
  const [activityName, setActivityName] = useState('');
  const [remarks, setRemarks] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const resetForm = () => {
    setActivityName('');
    setRemarks('');
    setDate(new Date());
    setShowDatePicker(false);
  };

  const handleCancel = () => {
    resetForm();
    onClose?.();
  };

  const handleSave = () => {
    onSave?.({
      activityName: activityName.trim(),
      remarks: remarks.trim(),
      date,
    });

    resetForm();
  };

  const handleDateChange = (_event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }

    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  if (!visible) return null;

  return (
    <View style={[StyleSheet.absoluteFill, styles.overlay]} className="justify-end bg-black/50">
      <TouchableOpacity
        activeOpacity={1}
        onPress={handleCancel}
        style={StyleSheet.absoluteFill}
      />

      <View className="bg-white dark:bg-slate-900 rounded-t-[32px] overflow-hidden max-h-[88%]">
        <View className="flex h-6 w-full items-center justify-center py-4">
          <View className="h-1.5 w-12 rounded-full bg-slate-200 dark:bg-slate-700" />
        </View>

        <ScrollView
          className="px-6"
          contentContainerStyle={styles.scrollContent}
          bounces={false}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text className="text-slate-900 dark:text-slate-100 text-2xl font-bold tracking-tight pt-2 pb-6">
            Add Activity
          </Text>

          <View className="flex flex-col gap-2 mb-6">
            <Text className="text-slate-700 dark:text-slate-300 text-[11px] font-bold uppercase tracking-widest">
              Activity Name
            </Text>
            <TextInput
              className="w-full h-14 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-4"
              placeholder="e.g. Daily Irrigation Check"
              placeholderTextColor="#94a3b8"
              value={activityName}
              onChangeText={setActivityName}
            />
          </View>

          <View className="flex flex-col gap-2 mb-6">
            <Text className="text-slate-700 dark:text-slate-300 text-[11px] font-bold uppercase tracking-widest">
              Remarks
            </Text>
            <TextInput
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 p-4"
              style={styles.remarksInput}
              multiline
              textAlignVertical="top"
              placeholder="Add detailed notes here..."
              placeholderTextColor="#94a3b8"
              value={remarks}
              onChangeText={setRemarks}
            />
          </View>

          <View className="flex flex-col gap-2 mb-8">
            <Text className="text-slate-700 dark:text-slate-300 text-[11px] font-bold uppercase tracking-widest">
              Date
            </Text>
            <TouchableOpacity
              className="w-full h-14 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 flex-row items-center"
              activeOpacity={0.75}
              onPress={() => setShowDatePicker(true)}
            >
              <Text className="flex-1 text-sm font-medium text-slate-900 dark:text-slate-100">
                {formatDate(date)}
              </Text>
              <MaterialIcons name="calendar-today" size={20} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          <View className="flex flex-col gap-3 pb-4">
            <TouchableOpacity
              className="w-full bg-primary py-4 rounded-xl shadow-lg items-center"
              activeOpacity={0.85}
              onPress={handleSave}
            >
              <Text className="text-slate-900 font-bold">Add Activity</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="w-full py-3 rounded-xl items-center"
              activeOpacity={0.75}
              onPress={handleCancel}
            >
              <Text className="text-slate-500 dark:text-slate-400 font-medium">
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        <View className="flex justify-center items-center pb-1">
          <View className="w-32 h-1.5 rounded-full bg-slate-800/10 dark:bg-white/10" />
        </View>
      </View>

      {showDatePicker ? (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    zIndex: 120,
    elevation: 120,
  },
  scrollContent: {
    paddingBottom: 8,
  },
  remarksInput: {
    minHeight: 100,
  },
});
