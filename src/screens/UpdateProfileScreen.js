import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
 View, Text, ScrollView, TextInput,
 TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform,
 Animated,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useLanguageStore } from '../utils/languageStore';
import { getUserProfile, saveUserProfile } from '../database/userService';

export default function UpdateProfileScreen({ navigation }) {
 const { t } = useLanguageStore();
 const insets = useSafeAreaInsets();
 const [fullName, setFullName] = useState('');
 const [villageName, setVillageName] = useState('');
 const [totalAcreage, setTotalAcreage] = useState('');
 const [activeCrops, setActiveCrops] = useState('');
 const [isSaving, setIsSaving] = useState(false);

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

 const loadProfileData = useCallback(async () => {
 try {
 const profile = await getUserProfile();
 if (profile) {
 setFullName(profile.fullName || '');
 setVillageName(profile.villageName || '');
 setTotalAcreage(profile.totalAcreage ? String(profile.totalAcreage) : '');
 setActiveCrops(profile.activeCrops || '');
 }
 } catch (error) {
 console.error('Failed to load profile:', error);
 }
 }, []);

 useEffect(() => {
 loadProfileData();
 }, [loadProfileData]);

 const handleSave = async () => {
 if (isSaving) return;
 setIsSaving(true);
 
 try {
 const profileData = {
 fullName,
 villageName,
 totalAcreage: parseFloat(totalAcreage) || 0,
 activeCrops,
 };

 const success = await saveUserProfile(profileData);
 if (success) {
 showToast(t('profileSaveSuccess'));
 setTimeout(() => {
 navigation.goBack();
 }, 1200);
 } else {
 showToast(t('profileSaveFailed'));
 }
 } catch (error) {
 console.error('Save profile error:', error);
 showToast(t('profileSaveFailed'));
 } finally {
 setIsSaving(false);
 }
 };

 return (
 <SafeAreaView className="flex-1 bg-background-light " edges={['top']}>
 {/* ─── Header ─────────────────────────────────── */}
 <View className="bg-white flex-row items-center justify-center py-5 border-b border-slate-100 relative">
 <TouchableOpacity
 className="absolute left-4"
 activeOpacity={0.7}
 onPress={() => navigation.goBack()}
 >
 <MaterialIcons name="arrow-back" size={26} color="#0f172a" />
 </TouchableOpacity>
 <Text className="text-lg font-bold tracking-tight text-black ">
 {t('updateProfile')}
 </Text>
 </View>

 {/* ─── Content ────────────────────────────────── */}
 <KeyboardAvoidingView
 className="flex-1"
 behavior={Platform.OS === 'ios' ? 'padding' : undefined}
 >
 <ScrollView
 className="flex-1"
 contentContainerStyle={styles.scrollContent}
 showsVerticalScrollIndicator={false}
 keyboardShouldPersistTaps="handled"
 >

 {/* ─── Account form ───────────────────────── */}
 <View className="mt-6 px-4">
 <Text className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-3">
 {t('account')}
 </Text>

 <View className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm p-5 gap-4">
 {/* Full Name */}
 <View>
 <Text className="text-xs font-semibold text-slate-500 uppercase mb-1.5 ml-0.5">
 {t('fullName')}
 </Text>
 <TextInput
 className="w-full bg-slate-50 border border-slate-200 rounded-lg py-3 px-4 text-base text-slate-900 "
 placeholder={t('fullNamePlaceholder')}
 placeholderTextColor="#94a3b8"
 value={fullName}
 onChangeText={setFullName}
 />
 </View>

 {/* Village Name */}
 <View>
 <Text className="text-xs font-semibold text-slate-500 uppercase mb-1.5 ml-0.5">
 {t('villageName')}
 </Text>
 <TextInput
 className="w-full bg-slate-50 border border-slate-200 rounded-lg py-3 px-4 text-base text-slate-900 "
 placeholder={t('villageNamePlaceholder')}
 placeholderTextColor="#94a3b8"
 value={villageName}
 onChangeText={setVillageName}
 />
 </View>

 {/* Total Acreage */}
 <View>
 <Text className="text-xs font-semibold text-slate-500 uppercase mb-1.5 ml-0.5">
 {t('totalAcreage')}
 </Text>
 <TextInput
 className="w-full bg-slate-50 border border-slate-200 rounded-lg py-3 px-4 text-base text-slate-900 "
 placeholder={t('acreagePlaceholder')}
 placeholderTextColor="#94a3b8"
 keyboardType="decimal-pad"
 value={totalAcreage}
 onChangeText={setTotalAcreage}
 />
 <Text className="mt-1.5 text-sm text-slate-400 italic px-1">
 {t('acreageHint')}
 </Text>
 </View>

 {/* Active Crops */}
 <View>
 <Text className="text-xs font-semibold text-slate-500 uppercase mb-1.5 ml-0.5">
 {t('activeCropsLabel')}
 </Text>
 <TextInput
 className="w-full bg-slate-50 border border-slate-200 rounded-lg py-3 px-4 text-base text-slate-900 "
 placeholder={t('activeCropsPlaceholder')}
 placeholderTextColor="#94a3b8"
 value={activeCrops}
 onChangeText={setActiveCrops}
 />
 <Text className="mt-1.5 text-sm text-slate-400 italic px-1">
 {t('activeCropsHint')}
 </Text>
 </View>

 {/* Save button */}
 <View className="pt-2">
 <TouchableOpacity
 className={`w-full ${isSaving ? 'bg-slate-300' : 'bg-primary'} py-4 rounded-xl shadow-md flex-row items-center justify-center gap-2`}
 activeOpacity={0.85}
 onPress={handleSave}
 disabled={isSaving}
 >
 <MaterialIcons name="save" size={24} color={isSaving ? "#64748b" : "#ffffff"} />
 <Text className={`font-bold text-base ${isSaving ? 'text-slate-500' : 'text-white'}`}>
 {isSaving ? t('loading') : t('saveChanges')}
 </Text>
 </TouchableOpacity>
 </View>
 </View>
 </View>
 </ScrollView>
 </KeyboardAvoidingView>

 {/* Standardized Toast UI */}
 {toastMessage ? (
 <Animated.View
 style={[
 styles.toast,
 {
 bottom: (insets.bottom || 0) + 24,
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

 <View />
 </SafeAreaView>
 );
}

const styles = StyleSheet.create({
 scrollContent: {
 paddingBottom: 40,
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
});




