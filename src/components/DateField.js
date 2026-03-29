import React, { useState } from 'react';
import { View, Text, Pressable, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

const formatDate = (date) =>
 date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export default function DateField({ label, value, onChange, minimumDate, maximumDate }) {
 const [showPicker, setShowPicker] = useState(false);

 const handleChange = (event, selectedDate) => {
 if (Platform.OS === 'android') setShowPicker(false);
 if (selectedDate) onChange(selectedDate);
 };

 return (
 <View className="gap-2">
 <Text className="text-slate-700 text-xs font-bold uppercase tracking-widest">
 {label}
 </Text>
 <Pressable
 onPress={() => setShowPicker(true)}
 className="flex-row items-center rounded-xl border border-slate-200 bg-slate-50 h-14 px-4"
 >
 <Text className="flex-1 text-slate-900 text-sm font-medium">
 {formatDate(value)}
 </Text>
 <MaterialIcons name="calendar-today" size={24} color="#94a3b8" />
 </Pressable>

 {showPicker && (
 <DateTimePicker
 value={value}
 mode="date"
 display="default"
 onChange={handleChange}
 minimumDate={minimumDate}
 maximumDate={maximumDate}
 />
 )}
 </View>
 );
}



