import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, TextInput, ScrollView, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useLanguageStore } from '../utils/languageStore';
import SegmentedControl from './SegmentedControl';
import DateField from './DateField';

const DURATION_OPTIONS = ['One-time', 'Multi-day', 'Recurring'];
const FREQUENCY_OPTIONS = ['Daily'];

const getFrequencyUnitKey = () => 'days';

const formatEndLabel = (date) =>
  date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });

// ── Repeat-interval stepper ─────────────────────────────────
function RepeatStepper({ value, onDecrement, onIncrement, unit, t }) {
  return (
    <View className="flex-row items-center justify-between bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 mt-4">
      <Text className="text-slate-700 dark:text-slate-300 text-sm font-medium ml-1">
        {t('repeatEvery').replace('X', value.toString())} {t(unit)}
      </Text>
      <View className="flex-row items-center gap-1">
        <Pressable
          onPress={onDecrement}
          className="w-10 h-10 items-center justify-center rounded-lg bg-white dark:bg-slate-700 shadow-sm border border-slate-200 dark:border-slate-600"
        >
          <MaterialIcons name="remove" size={24} color="#475569" />
        </Pressable>
        <View className="w-12 items-center">
          <Text className="text-slate-900 dark:text-slate-100 font-bold text-lg">{value}</Text>
        </View>
        <Pressable
          onPress={onIncrement}
          className="w-10 h-10 items-center justify-center rounded-lg bg-white dark:bg-slate-700 shadow-sm border border-slate-200 dark:border-slate-600"
        >
          <MaterialIcons name="add" size={24} color="#475569" />
        </Pressable>
      </View>
    </View>
  );
}

// ── Info banner for recurring tasks ─────────────────────────
function RecurringInfoBanner({ interval, unit, endDate, t }) {
  return (
    <View className="bg-primary/10 border border-primary/20 rounded-2xl p-4 mb-8">
      <View className="flex-row items-start gap-3">
        <MaterialIcons name="info" size={24} color="#166534" style={{ marginTop: 2 }} />
        <Text className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed font-medium flex-1">
          {t('repeatInfo')
            .replace('{interval}', interval)
            .replace('{unit}', t(unit))
            .replace('{endDate}', formatEndLabel(endDate))}
        </Text>
      </View>
    </View>
  );
}

// ── Date-range row (shared by Multi-day & Recurring) ────────
function DateRangeRow({ startDate, endDate, onStartChange, onEndChange, startLabel, endLabel }) {
  return (
    <View className="flex-row gap-4">
      <View className="flex-1">
        <DateField label={startLabel} value={startDate} onChange={onStartChange} />
      </View>
      <View className="flex-1">
        <DateField label={endLabel} value={endDate} onChange={onEndChange} minimumDate={startDate} />
      </View>
    </View>
  );
}

// ── Main modal ──────────────────────────────────────────────
export default function UpdateTaskModal({ visible, onClose, onSave, taskData }) {
  const { t } = useLanguageStore();
  const [taskName, setTaskName] = useState('');
  const [duration, setDuration] = useState('One-time');
  const [frequency, setFrequency] = useState('Daily');
  const [repeatInterval, setRepeatInterval] = useState(1);
  const [date, setDate] = useState(new Date());
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [error, setError] = useState('');

  useEffect(() => {
    if (visible && taskData) {
      setTaskName(taskData.taskName || '');
      
      const typeMap = {
        'one_time': 'One-time',
        'multi_day': 'Multi-day',
        'recurring': 'Recurring'
      };
      const uiDuration = typeMap[taskData.type] || 'One-time';
      setDuration(uiDuration);
      
      if (uiDuration === 'One-time') {
        const d = taskData.startDate ? new Date(taskData.startDate) : new Date();
        setDate(d);
      } else if (uiDuration === 'Multi-day') {
        setStartDate(taskData.startDate ? new Date(taskData.startDate) : new Date());
        setEndDate(taskData.endDate ? new Date(taskData.endDate) : new Date());
      } else {
        // Recurring
        setStartDate(taskData.startDate ? new Date(taskData.startDate) : new Date());
        setEndDate(taskData.endDate ? new Date(taskData.endDate) : new Date());
        setRepeatInterval(taskData.repeatIntervalDays || 1);
        // Frequency is not explicitly in DB but we can default it or map it if it was stored
        setFrequency('Daily'); 
      }
    }
  }, [visible, taskData]);

  const handleSave = () => {
    if (!taskName.trim()) {
      setError(t('taskNameRequired'));
      return;
    }
    setError('');

    const task = { taskName, duration };
    if (duration === 'One-time') {
      task.date = date;
    } else if (duration === 'Multi-day') {
      task.startDate = startDate;
      task.endDate = endDate;
    } else {
      // Recurring logic (Daily only)
      let intervalDays = repeatInterval;

      task.frequency = 'Daily';
      task.repeatInterval = intervalDays;
      task.startDate = startDate;
      task.endDate = endDate;
    }
    onSave?.(task);
  };

  const handleCancel = () => {
    onClose();
  };

  const unit = getFrequencyUnitKey(frequency);

  if (!visible) return null;

  return (
    <View style={[StyleSheet.absoluteFill, styles.overlay]} className="justify-end bg-black/50" pointerEvents="box-none">
      <Pressable onPress={handleCancel} style={StyleSheet.absoluteFill} />
      <View className="bg-white dark:bg-slate-900 rounded-t-[32px] overflow-hidden max-h-[88%]">
          <View className="items-center py-4">
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
              {t('updateTask')}
            </Text>

            <View className="gap-2 mb-6">
              <Text className="text-slate-700 dark:text-slate-300 text-sm font-bold uppercase tracking-[0.1em]">
               {t('taskNameLabel')}
              </Text>
              <TextInput
                className={`rounded-xl border ${
                  error ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'
                } bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 h-14 px-4 placeholder:text-slate-400`}
                placeholder={t('taskNamePlaceholder')}
                placeholderTextColor="#94a3b8"
                value={taskName}
                onChangeText={(text) => {
                  setTaskName(text);
                  if (error) setError('');
                }}
              />
              {error ? (
                <Text className="text-red-500 text-xs font-medium mt-1">{error}</Text>
              ) : null}
            </View>

            <View className="mb-6">
              <Text className="text-slate-700 dark:text-slate-300 text-sm font-bold uppercase tracking-[0.1em] mb-3 block">
                {t('duration')}
              </Text>
              <SegmentedControl
                options={DURATION_OPTIONS.map(opt => {
                  const map = { 'One-time': 'oneTime', 'Multi-day': 'multiDay', 'Recurring': 'recurring' };
                  return t(map[opt]);
                })}
                selected={t({ 'One-time': 'oneTime', 'Multi-day': 'multiDay', 'Recurring': 'recurring' }[duration])}
                onSelect={(val) => {
                  const reverseMap = { [t('oneTime')]: 'One-time', [t('multiDay')]: 'Multi-day', [t('recurring')]: 'Recurring' };
                  setDuration(reverseMap[val]);
                }}
              />
            </View>

            {duration === 'One-time' && (
              <View className="mb-8">
                <DateField label={t('date')} value={date} onChange={setDate} />
              </View>
            )}

            {duration === 'Multi-day' && (
              <View className="mb-8">
                <DateRangeRow
                  startDate={startDate}
                  endDate={endDate}
                  onStartChange={setStartDate}
                  onEndChange={setEndDate}
                  startLabel={t('startDate')}
                  endLabel={t('endDate')}
                />
              </View>
            )}

            {duration === 'Recurring' && (
              <>
                <View className="mb-6">
                  <Text className="text-slate-700 dark:text-slate-300 text-sm font-bold uppercase tracking-[0.1em] mb-3 block">
                    {t('frequency')}
                  </Text>
                  <RepeatStepper
                    value={repeatInterval}
                    unit={unit}
                    t={t}
                    onDecrement={() => setRepeatInterval(Math.max(1, repeatInterval - 1))}
                    onIncrement={() => setRepeatInterval(repeatInterval + 1)}
                  />
                </View>

                <View className="mb-6">
                  <DateRangeRow
                    startDate={startDate}
                    endDate={endDate}
                    onStartChange={setStartDate}
                    onEndChange={setEndDate}
                    startLabel={t('startsOn')}
                    endLabel={t('endsOn')}
                  />
                </View>

                <RecurringInfoBanner
                  interval={repeatInterval}
                  unit={unit}
                  endDate={endDate}
                  t={t}
                />
              </>
            )}

            <View className="gap-3 pb-8">
              <Pressable
                onPress={handleSave}
                className="w-full bg-primary font-bold py-4 rounded-xl shadow-lg items-center"
              >
                <Text className="text-white font-bold text-base">{t('updateTaskBtn')}</Text>
              </Pressable>
              <Pressable
                onPress={handleCancel}
                className="w-full py-3 rounded-xl items-center"
              >
                <Text className="text-slate-500 dark:text-slate-400 font-medium text-base">
                  {t('cancel')}
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
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
});



