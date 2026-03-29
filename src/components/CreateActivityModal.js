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
import { useLanguageStore } from '../utils/languageStore';

const formatDate = (date) =>
 date.toLocaleDateString('en-US', {
 month: 'long',
 day: 'numeric',
 year: 'numeric',
 });

export default function CreateActivityModal({ visible, onClose, onSave }) {
 const { t } = useLanguageStore();
 const [activityName, setActivityName] = useState('');
 const [remarks, setRemarks] = useState('');
 const [date, setDate] = useState(new Date());
 const [showDatePicker, setShowDatePicker] = useState(false);
 const [error, setError] = useState('');

 const resetForm = () => {
 setActivityName('');
 setRemarks('');
 setDate(new Date());
 setShowDatePicker(false);
 setError('');
 };

 const handleCancel = () => {
 resetForm();
 onClose?.();
 };

 const handleSave = () => {
 if (!activityName.trim()) {
 setError(t('activityNameRequired'));
 return;
 }
 setError('');

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

 <View className="bg-white rounded-t-[32px] overflow-hidden max-h-[88%]">
 <View className="flex h-6 w-full items-center justify-center py-4">
 <View className="h-1.5 w-12 rounded-full bg-slate-200 " />
 </View>

 <ScrollView
 className="px-6"
 contentContainerStyle={styles.scrollContent}
 bounces={false}
 showsVerticalScrollIndicator={false}
 keyboardShouldPersistTaps="handled"
 >
 <Text className="text-slate-900 text-2xl font-bold tracking-tight pt-2 pb-6">
 {t('addActivityTitle')}
 </Text>

 <View className="flex flex-col gap-2 mb-6">
 <Text className="text-slate-700 text-sm font-bold uppercase tracking-widest">
 {t('activityNameLabel')}
 </Text>
 <TextInput
 className={`w-full h-14 rounded-xl border ${
 error ? 'border-red-500' : 'border-slate-200 '
 } bg-slate-50 text-slate-900 px-4`}
 placeholder={t('activityNamePlaceholder')}
 placeholderTextColor="#94a3b8"
 value={activityName}
 onChangeText={(text) => {
 setActivityName(text);
 if (error) setError('');
 }}
 />
 {error ? (
 <Text className="text-red-500 text-xs font-medium mt-1">{error}</Text>
 ) : null}
 </View>

 <View className="flex flex-col gap-2 mb-6">
 <Text className="text-slate-700 text-sm font-bold uppercase tracking-widest">
 {t('remarksLabel')}
 </Text>
 <TextInput
 className="w-full rounded-xl border border-slate-200 bg-slate-50 text-slate-900 p-4"
 style={styles.remarksInput}
 multiline
 textAlignVertical="top"
 placeholder={t('remarksPlaceholder')}
 placeholderTextColor="#94a3b8"
 value={remarks}
 onChangeText={setRemarks}
 />
 </View>

 <View className="flex flex-col gap-2 mb-8">
 <Text className="text-slate-700 text-sm font-bold uppercase tracking-widest">
 {t('dateLabel')}
 </Text>
 <TouchableOpacity
 className="w-full h-14 rounded-xl border border-slate-200 bg-slate-50 px-4 flex-row items-center"
 activeOpacity={0.75}
 onPress={() => setShowDatePicker(true)}
 >
 <Text className="flex-1 text-sm font-medium text-slate-900 ">
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
 <Text className="text-white font-bold text-base">{t('saveActivity')}</Text>
 </TouchableOpacity>

 <TouchableOpacity
 className="w-full py-3 rounded-xl items-center"
 activeOpacity={0.75}
 onPress={handleCancel}
 >
 <Text className="text-slate-500 font-medium">
 {t('cancel')}
 </Text>
 </TouchableOpacity>
 </View>
 </ScrollView>

 <View className="flex justify-center items-center pb-1">
 <View className="w-32 h-1.5 rounded-full bg-slate-800/10 " />
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



