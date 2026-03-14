import React, { useState, useEffect } from 'react';
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
import { useLanguageStore } from '../utils/languageStore';

const formatDate = (date) =>
  date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

function parseDate(value) {
  if (!value) return new Date();
  if (value instanceof Date) return value;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function parseAmount(value) {
  const normalized = (value || '').replace(/[^0-9.]/g, '');
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * EditExpenseModal — pre-filled bottom sheet for editing an existing expense.
 *
 * Props:
 *   visible   {boolean}
 *   expense   {{ id, title, remarks, amount, date }} — record to edit
 *   onClose   {() => void}
 *   onSave    {(data: { id, expenseName, remarks, amount, date }) => void}
 */
export default function EditExpenseModal({ visible, expense, onClose, onSave }) {
  const { t } = useLanguageStore();
  const [expenseName, setExpenseName] = useState('');
  const [remarks, setRemarks] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Populate fields whenever the `expense` prop changes
  useEffect(() => {
    if (expense) {
      setExpenseName(expense.title || '');
      setRemarks(expense.remarks || '');
      setAmount(expense.amount != null ? String(expense.amount) : '');
      setDate(parseDate(expense.dateText || expense.date));
    }
  }, [expense]);

  const resetForm = () => {
    setExpenseName('');
    setRemarks('');
    setAmount('');
    setDate(new Date());
    setShowDatePicker(false);
  };

  const handleCancel = () => {
    resetForm();
    onClose?.();
  };

  const handleSave = () => {
    onSave?.({
      id: expense?.id,
      expenseName: expenseName.trim(),
      remarks: remarks.trim(),
      amount: parseAmount(amount),
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
            {t('updateExpense')}
          </Text>

          <View className="flex flex-col gap-2 mb-6">
            <Text className="text-slate-700 dark:text-slate-300 text-sm font-bold uppercase tracking-widest">
              {t('expenseNameLabel')}
            </Text>
            <TextInput
              className="w-full h-14 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-4"
              placeholder={t('expenseNamePlaceholder')}
              placeholderTextColor="#94a3b8"
              value={expenseName}
              onChangeText={setExpenseName}
            />
          </View>

          <View className="flex flex-col gap-2 mb-6">
            <Text className="text-slate-700 dark:text-slate-300 text-sm font-bold uppercase tracking-widest">
              {t('remarksLabel')}
            </Text>
            <TextInput
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 p-4"
              style={styles.remarksInput}
              multiline
              textAlignVertical="top"
              placeholder={t('remarksPlaceholderExpenses')}
              placeholderTextColor="#94a3b8"
              value={remarks}
              onChangeText={setRemarks}
            />
          </View>

          <View className="flex flex-col gap-2 mb-6">
            <Text className="text-slate-700 dark:text-slate-300 text-sm font-bold uppercase tracking-widest">
              {t('amountLabel')}
            </Text>
            <View className="relative flex-row items-center">
              <Text className="absolute left-4 text-slate-500 dark:text-slate-400 font-medium">₹</Text>
              <TextInput
                className="w-full h-14 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 pl-8 pr-4"
                placeholder="45.00"
                placeholderTextColor="#94a3b8"
                keyboardType="decimal-pad"
                value={amount}
                onChangeText={setAmount}
              />
            </View>
          </View>

          <View className="flex flex-col gap-2 mb-8">
            <Text className="text-slate-700 dark:text-slate-300 text-sm font-bold uppercase tracking-widest">
              {t('dateLabel')}
            </Text>
            <TouchableOpacity
              className="w-full h-14 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 flex-row items-center"
              activeOpacity={0.75}
              onPress={() => setShowDatePicker(true)}
            >
              <Text className="flex-1 text-sm font-medium text-slate-900 dark:text-slate-100">
                {formatDate(date)}
              </Text>
              <MaterialIcons name="calendar-today" size={24} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          <View className="flex flex-col gap-3 pb-4">
            <TouchableOpacity
              className="w-full bg-primary py-4 rounded-xl shadow-lg items-center"
              activeOpacity={0.85}
              onPress={handleSave}
            >
              <Text className="text-white font-bold text-base">{t('updateExpense')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="w-full py-3 rounded-xl items-center"
              activeOpacity={0.75}
              onPress={handleCancel}
            >
              <Text className="text-slate-500 dark:text-slate-400 font-medium">
                {t('cancel')}
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



