import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useIsFocused } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { getDb } from '../database/db';

const CropsScreen = ({ navigation }) => {
    const { t } = useTranslation();
    const isDark = useColorScheme() === 'dark';
    const isFocused = useIsFocused();

    const [crops, setCrops] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('All'); // 'All', 'Active', 'Harvested'

    useEffect(() => {
        if (isFocused) {
            loadCrops();
        }
    }, [isFocused]);

    const loadCrops = async () => {
        setLoading(true);
        try {
            const db = await getDb();
            const cropRows = await db.getAllAsync(`
                SELECT 
                    c.*,
                    COALESCE((SELECT SUM(amount) FROM expenses WHERE crop_id = c.id), 0) as totalExpense,
                    COALESCE((SELECT SUM(amount) FROM earnings WHERE crop_id = c.id), 0) as totalEarning,
                    (SELECT activity_type FROM activities WHERE crop_id = c.id ORDER BY date DESC, id DESC LIMIT 1) as lastActivity,
                    (SELECT date FROM activities WHERE crop_id = c.id ORDER BY date DESC, id DESC LIMIT 1) as lastActivityDate
                FROM crops c
                ORDER BY CASE WHEN c.status = 'Active' THEN 1 ELSE 2 END, c.id DESC
            `);
            setCrops(cropRows);
        } catch (error) {
            console.error('Error loading crops:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredCrops = crops.filter(crop => {
        if (filter === 'All') return true;
        if (filter === 'Active') return crop.status === 'Active';
        if (filter === 'Harvested') return crop.status !== 'Active'; // Assuming not active is harvested/inactive
        return true;
    });

    const getCropIconInfo = (name) => {
        const lower = name?.toLowerCase() || '';
        if (lower.includes('wheat') || lower.includes('paddy') || lower.includes('rice'))
            return { icon: 'grass', bg: 'bg-emerald-100 dark:bg-emerald-900/40', color: isDark ? '#34d399' : '#059669' };
        if (lower.includes('corn') || lower.includes('maize'))
            return { icon: 'agriculture', bg: 'bg-amber-100 dark:bg-amber-900/40', color: isDark ? '#fbbf24' : '#d97706' };
        if (lower.includes('tomato') || lower.includes('apple') || lower.includes('fruit'))
            return { icon: 'local-florist', bg: 'bg-rose-100 dark:bg-rose-900/40', color: isDark ? '#fb7185' : '#e11d48' };
        return { icon: 'eco', bg: 'bg-green-100 dark:bg-green-900/40', color: isDark ? '#4ade80' : '#16a34a' };
    };

    const formatCurrency = (amount) => {
        return `₹${amount.toLocaleString()}`;
    };

    const formatDateDiff = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const now = new Date();
        const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
        if (diffInDays === 0) return 'Today';
        if (diffInDays === 1) return '1 day ago';
        return `${diffInDays} days ago`;
    };

    return (
        <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark" edges={['top']}>
            {/* Header */}
            <View className="flex-row items-center bg-white dark:bg-slate-900 p-4 justify-between shadow-sm z-10 relative">
                <TouchableOpacity onPress={() => navigation.openDrawer && navigation.openDrawer()} className="z-10">
                    <MaterialIcons name="menu" size={28} color={isDark ? '#94a3b8' : '#475569'} />
                </TouchableOpacity>
                <View className="absolute left-0 right-0 items-center justify-center" pointerEvents="none">
                    <Text className="text-slate-900 dark:text-white text-lg font-bold tracking-tight">Your Crops</Text>
                </View>
                <View className="flex-row items-center gap-2 z-10">
                    <TouchableOpacity className="p-2 rounded-full">
                        <MaterialIcons name="search" size={24} color={isDark ? '#cbd5e1' : '#64748b'} />
                    </TouchableOpacity>
                    <TouchableOpacity className="items-center justify-center rounded-full h-10 w-10 bg-primary/10">
                        <MaterialIcons name="notifications" size={24} color="#3ce619" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Filters */}
            <View className="flex-row gap-3 px-4 py-3 bg-background-light dark:bg-background-dark">
                {['All', 'Active', 'Harvested'].map((f) => (
                    <TouchableOpacity
                        key={f}
                        onPress={() => setFilter(f)}
                        className={`flex h-9 shrink-0 items-center justify-center rounded-full px-5 ${filter === f ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-800'}`}
                    >
                        <Text className={`text-sm ${filter === f ? 'font-semibold text-slate-900' : 'font-medium text-slate-600 dark:text-slate-300'}`}>
                            {f}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* List */}
            {loading ? (
                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="large" color="#3ce619" />
                </View>
            ) : (
                <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 100, gap: 16 }} showsVerticalScrollIndicator={false}>
                    {filteredCrops.length > 0 ? filteredCrops.map(crop => {
                        const iconInfo = getCropIconInfo(crop.crop_name);
                        return (
                            <TouchableOpacity
                                key={crop.id}
                                className="flex-col overflow-hidden rounded-xl bg-white dark:bg-slate-900 shadow-sm border border-primary/10"
                                onPress={() => navigation.navigate('CropWorkspace', { crop })}
                            >
                                <View className="p-4 flex-col gap-3">
                                    <View className="flex-row justify-between items-start">
                                        <View className="flex-row gap-3 items-center flex-1">
                                            <View className={`h-12 w-12 rounded-lg items-center justify-center ${iconInfo.bg}`}>
                                                <MaterialIcons name={iconInfo.icon} size={28} color={iconInfo.color} />
                                            </View>
                                            <View className="flex-1 justify-center">
                                                <Text className="text-lg font-bold text-slate-900 dark:text-white" numberOfLines={1}>{crop.crop_name}</Text>
                                                <Text className="text-sm text-slate-500 dark:text-slate-400 mt-0.5" numberOfLines={1}>
                                                    {crop.land_identifier} • {crop.total_area} {crop.area_unit}
                                                </Text>
                                                {crop.lastActivity ? (
                                                    <Text className="text-xs text-slate-400 mt-1" numberOfLines={1}>
                                                        Last Activity: {crop.lastActivity} • {formatDateDiff(crop.lastActivityDate)}
                                                    </Text>
                                                ) : (
                                                    <Text className="text-xs text-slate-400 mt-1" numberOfLines={1}>
                                                        No recent activity
                                                    </Text>
                                                )}
                                            </View>
                                        </View>
                                        <View className={`px-3 py-1 rounded-full ${crop.status === 'Active' ? 'bg-emerald-100 dark:bg-emerald-900/40' : 'bg-slate-100 dark:bg-slate-800'}`}>
                                            <Text className={`text-xs font-semibold ${crop.status === 'Active' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`}>
                                                {crop.status === 'Active' ? 'Active' : 'Inactive'}
                                            </Text>
                                        </View>
                                    </View>
                                    <View className="flex-row pt-3 pb-1 border-t border-slate-50 dark:border-slate-800 mt-1">
                                        <View className="flex-1 items-center">
                                            <Text className="text-[10px] text-slate-400 uppercase font-semibold mb-0.5">Expenses</Text>
                                            <Text className="font-bold text-red-500 text-base">{formatCurrency(crop.totalExpense)}</Text>
                                        </View>
                                        <View className="flex-1 items-center">
                                            <Text className="text-[10px] text-slate-400 uppercase font-semibold mb-0.5">Earnings</Text>
                                            <Text className="font-bold text-primary text-base">{formatCurrency(crop.totalEarning)}</Text>
                                        </View>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        );
                    }) : (
                        <View className="flex-1 items-center justify-center p-6 bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 mt-10">
                            <MaterialIcons name="eco" size={64} color={isDark ? '#4ade80' : '#22c55e'} className="mb-4 opacity-50" />
                            <Text className="text-slate-500 dark:text-slate-400 text-center text-lg mb-6">
                                {filter === 'All' ? "You don't have any crops yet." : `No ${filter.toLowerCase()} crops found.`}
                            </Text>
                        </View>
                    )}
                </ScrollView>
            )}

            {/* FAB */}
            <TouchableOpacity
                className="absolute bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-primary shadow-lg shadow-primary/40 z-50"
                onPress={() => navigation.navigate('CreateCrop')}
            >
                <MaterialIcons name="add" size={32} color="#0f172a" />
            </TouchableOpacity>
        </SafeAreaView>
    );
};

export default CropsScreen;
