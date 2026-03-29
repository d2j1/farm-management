import React, { useState, useCallback } from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { useLanguageStore } from '../utils/languageStore';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import CropsScreenHeader from '../components/CropsScreenHeader';
import FilterTabs from '../components/FilterTabs';
import CropDetailCard from '../components/CropDetailCard';
import FloatingActionButton from '../components/FloatingActionButton';
import { useDatabase } from '../database/DatabaseProvider';
import { getAllCrops } from '../database/cropService';
import { getLatestActivityByCrop } from '../database/activityService';
import { getUpcomingTaskByCrop } from '../database/taskService';
import { getTotalExpensesByCrop } from '../database/expenseService';
import { getTotalEarningsByCrop } from '../database/earningService';

const FILTER_TABS_KEYS = ['all', 'active', 'inactive'];

/**
 * Map icon config based on the crop name for visual variety.
 */
function getCropVisuals(cropName) {
 const name = (cropName || '').toLowerCase();

 if (name.includes('tomato') || name.includes('chili') || name.includes('pepper')) {
 return { icon: 'restaurant', iconColor: '#ef4444', iconBgClass: 'bg-red-50', blobBgClass: 'bg-red-400', ringClass: 'ring-red-100' };
 }
 if (name.includes('corn') || name.includes('maize')) {
 return { icon: 'grass', iconColor: '#ca8a04', iconBgClass: 'bg-yellow-50', blobBgClass: 'bg-yellow-400', ringClass: 'ring-yellow-100' };
 }
 if (name.includes('rice') || name.includes('paddy')) {
 return { icon: 'grass', iconColor: '#166534', iconBgClass: 'bg-green-50', blobBgClass: 'bg-green-400', ringClass: 'ring-green-100' };
 }
 // default
 return { icon: 'agriculture', iconColor: '#ea580c', iconBgClass: 'bg-orange-50', blobBgClass: 'bg-orange-400', ringClass: 'ring-orange-100' };
}

/**
 * Transform a DB row into the shape CropDetailCard expects.
 */
function mapCropRow(row, latestActivity, upcomingTask, totalExpenses, totalEarnings) {
 const visuals = getCropVisuals(row.cropName);

 const formatCurrency = (val) => {
 const num = Number(val) || 0;
 return `₹${num.toLocaleString('en-IN')}`;
 };

 return {
 id: String(row.id),
 dbId: row.id,
 name: row.cropName,
 ...visuals,
 location: `${row.landNickname} • ${row.totalArea} ${useLanguageStore.getState().t(row.areaUnit.toLowerCase())}`,
 status: row.status || 'active',
 lastActivity: latestActivity
 ? {
 label: latestActivity.title.toUpperCase(),
 colorClass: 'text-primary',
 dotClass: 'bg-primary',
 }
 : null,
 upcoming: upcomingTask
 ? {
 label: `${upcomingTask.taskName.toUpperCase()} (${upcomingTask.startDate})`,
 colorClass: 'text-blue-400',
 }
 : null,
 expenses: formatCurrency(totalExpenses),
 earnings: formatCurrency(totalEarnings),
 };
}

export default function CropsScreen({ navigation }) {
 const { t } = useLanguageStore();
 const db = useDatabase();
 const [crops, setCrops] = useState([]);
 const [activeFilter, setActiveFilter] = useState('all');

 // Reload crops every time the screen gains focus (e.g. after creating one)
 useFocusEffect(
 useCallback(() => {
 let cancelled = false;

 (async () => {
 try {
 const rows = await getAllCrops(db);
 const enriched = await Promise.all(
 rows.map(async (row) => {
 const [latest, upcoming, totalExp, totalEarn] = await Promise.all([
 getLatestActivityByCrop(db, row.id),
 getUpcomingTaskByCrop(db, row.id),
 getTotalExpensesByCrop(db, row.id),
 getTotalEarningsByCrop(db, row.id),
 ]);
 return mapCropRow(row, latest, upcoming, totalExp, totalEarn);
 }),
 );
 if (!cancelled) setCrops(enriched);
 } catch (err) {
 console.error('Failed to load crops:', err);
 }
 })();

 return () => {
 cancelled = true;
 };
 }, [db, t]),
 );

 const filteredCrops = crops.filter((crop) => {
 if (activeFilter === 'all') return true;
 if (activeFilter === 'active') return crop.status === 'active';
 if (activeFilter === 'inactive') return crop.status === 'inactive';
 return true;
 });

 return (
 <SafeAreaView className="flex-1 bg-background-light " edges={['top']}>
 <CropsScreenHeader
 onNotificationPress={() => {}}
 />

 <FilterTabs
 tabs={FILTER_TABS_KEYS.map(key => t(key))}
 activeTab={t(activeFilter)}
 onTabChange={(val) => {
 const reverseMap = {
 [t('all')]: 'all',
 [t('active')]: 'active',
 [t('inactive')]: 'inactive',
 };
 setActiveFilter(reverseMap[val]);
 }}
 />

 <ScrollView
 className="flex-1"
 contentContainerStyle={styles.scrollContent}
 showsVerticalScrollIndicator={false}
 >
 <View className="px-4 gap-5">
 {filteredCrops.length === 0 ? (
 <View className="items-center justify-center py-16">
 <Text className="text-slate-400 text-sm">{t('noCropsYet')}</Text>
 </View>
 ) : (
 filteredCrops.map((crop) => (
 <CropDetailCard
 key={crop.id}
 crop={crop}
 onPress={() => navigation.navigate('CropDetails', { crop })}
 />
 ))
 )}
 </View>
 </ScrollView>

 <FloatingActionButton onPress={() => navigation.navigate('CreateCrop')} />
 </SafeAreaView>
 );
}

const styles = StyleSheet.create({
 scrollContent: {
 paddingTop: 8,
 paddingBottom: 120,
 },
});


