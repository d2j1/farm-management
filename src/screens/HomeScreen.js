import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useIsFocused } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import useStore from '../store/useStore';
import { getDb } from '../database/db';

const HomeScreen = ({ navigation }) => {
    const { t } = useTranslation();
    const { farmProfile, setFarmProfile } = useStore();
    const [crops, setCrops] = useState([]);
    const [loading, setLoading] = useState(true);
    const isFocused = useIsFocused();
    const isDark = useColorScheme() === 'dark';

    useEffect(() => {
        if (isFocused) {
            loadProfileAndCrops();
        }
    }, [isFocused]);

    const loadProfileAndCrops = async () => {
        setLoading(true);
        try {
            const db = await getDb();

            // Load Profile
            const profileRows = await db.getAllAsync('SELECT * FROM profile LIMIT 1');
            if (profileRows.length > 0) {
                setFarmProfile(profileRows[0]);
            }

            // Load active crops with totals and latest activity
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
            console.error('Error loading home data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getCropIcon = (name) => {
        const lower = name?.toLowerCase() || '';
        if (lower.includes('wheat') || lower.includes('paddy') || lower.includes('rice')) return 'grass';
        if (lower.includes('corn') || lower.includes('maize')) return 'agriculture';
        if (lower.includes('tomato') || lower.includes('apple') || lower.includes('fruit')) return 'local-florist';
        return 'eco';
    };

    const getCropColorStyle = (index) => {
        const styles = [
            { bg: 'bg-amber-100 dark:bg-amber-900/30', hex: '#d97706' },
            { bg: 'bg-yellow-100 dark:bg-yellow-900/30', hex: '#ca8a04' },
            { bg: 'bg-emerald-100 dark:bg-emerald-900/30', hex: '#059669' },
            { bg: 'bg-blue-100 dark:bg-blue-900/30', hex: '#2563eb' },
            { bg: 'bg-purple-100 dark:bg-purple-900/30', hex: '#9333ea' },
        ];
        return styles[index % styles.length];
    };

    if (loading) {
        return (
            <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark justify-center items-center">
                <ActivityIndicator size="large" color="#3ce619" />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark" edges={['top']}>
            {/* Header */}
            <View className="flex-row items-center bg-white dark:bg-slate-900 p-4 justify-between shadow-sm z-10">
                <View className="flex-row items-center gap-3">
                    <View className="h-10 w-10 rounded-full border-2 border-primary/20 bg-primary/10 items-center justify-center overflow-hidden">
                        <MaterialIcons name="person" size={24} color="#3ce619" />
                    </View>
                    <Text className="text-slate-900 dark:text-white text-lg font-bold tracking-tight">
                        {t('hello')} {farmProfile?.name || 'Farmer'}!
                    </Text>
                </View>
                <View className="flex-row items-center gap-2">
                    <TouchableOpacity className="items-center justify-center rounded-full h-10 w-10 bg-primary/10">
                        <MaterialIcons name="notifications" size={24} color="#3ce619" />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
                {/* Weather Section */}
                <View className="p-4">
                    <View className="flex-row items-center justify-between gap-4 rounded-xl bg-white dark:bg-slate-900 p-5 shadow-sm border border-primary/10">
                        <View className="flex-col gap-1">
                            <View className="flex-row items-center gap-2">
                                <MaterialIcons name="light-mode" size={36} color="#eab308" />
                                <Text className="text-3xl font-bold text-slate-900 dark:text-white">28°C</Text>
                            </View>
                            <Text className="text-primary font-semibold text-sm">Sunny</Text>
                            <Text className="text-slate-500 dark:text-slate-400 text-sm">Perfect for irrigation today</Text>
                        </View>
                        <View className="h-16 w-16 bg-primary/5 rounded-full items-center justify-center">
                            <MaterialIcons name="water-drop" size={32} color="#3ce619" />
                        </View>
                    </View>
                </View>

                {/* Action Button */}
                <View className="px-4 pb-2">
                    <TouchableOpacity
                        className="w-full bg-primary active:bg-primary/90 rounded-xl flex-row items-center justify-center gap-3 py-4 px-6 shadow-lg shadow-primary/20"
                        onPress={() => navigation.navigate('CreateCrop')}
                    >
                        <MaterialIcons name="agriculture" size={24} color="#0f172a" />
                        <Text className="text-slate-900 font-bold text-base">Add New Crops</Text>
                    </TouchableOpacity>
                </View>

                {/* Your Crops Section */}
                <View className="py-4">
                    <View className="flex-row items-center justify-between px-4 mb-3">
                        <Text className="text-slate-900 dark:text-white text-lg font-bold tracking-tight">Your Crops</Text>
                        <TouchableOpacity>
                            <Text className="text-primary text-sm font-semibold">View All</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 16 }}>
                        {crops.length > 0 ? crops.map((crop, index) => {
                            const colorStyle = getCropColorStyle(index);
                            return (
                                <TouchableOpacity
                                    key={crop.id}
                                    className="w-48 bg-white dark:bg-slate-900 rounded-xl overflow-hidden shadow-sm border border-slate-100 dark:border-slate-800"
                                    onPress={() => navigation.navigate('CropWorkspace', { crop })}
                                >
                                    <View className={`h-32 w-full items-center justify-center relative ${colorStyle.bg}`}>
                                        <MaterialIcons name={getCropIcon(crop.crop_name)} size={40} color={colorStyle.hex} />
                                        {crop.status === 'Inactive' && (
                                            <View className="absolute top-2 right-2 bg-slate-500 px-2 py-0.5 rounded-full">
                                                <Text className="text-white text-[10px] font-bold">Inactive</Text>
                                            </View>
                                        )}
                                    </View>
                                    <View className="p-3">
                                        <Text className="text-slate-900 dark:text-white text-base font-bold" numberOfLines={1}>{crop.crop_name}</Text>
                                        <View className="flex-row items-center gap-1 mt-1">
                                            <MaterialIcons name="calendar-today" size={12} color={isDark ? '#94a3b8' : '#64748b'} />
                                            <Text className="text-slate-500 dark:text-slate-400 text-xs" numberOfLines={1}>
                                                {crop.land_identifier} • {crop.total_area} {crop.area_unit}
                                            </Text>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            )
                        }) : (
                            <View className="w-72 bg-white dark:bg-slate-900 rounded-xl p-5 items-center justify-center border border-slate-100 dark:border-slate-800">
                                <Text className="text-slate-500 dark:text-slate-400 italic mb-2">{t('noCropsManaged')}</Text>
                                <TouchableOpacity onPress={() => navigation.navigate('CreateCrop')}>
                                    <Text className="text-primary font-bold">Add First Crop</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </ScrollView>
                </View>

                {/* Recent Blog Posts Section */}
                <View className="py-4">
                    <View className="flex-row items-center justify-between px-4 mb-3">
                        <Text className="text-slate-900 dark:text-white text-lg font-bold tracking-tight">Information</Text>
                        <TouchableOpacity>
                            <Text className="text-primary text-sm font-semibold">Read More</Text>
                        </TouchableOpacity>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 16 }}>
                        {/* Blog Card 1 */}
                        <View className="w-72 bg-white dark:bg-slate-900 rounded-xl overflow-hidden shadow-sm border border-slate-100 dark:border-slate-800">
                            <View className="h-40 w-full bg-green-100 dark:bg-green-900/30 items-center justify-center">
                                <MaterialIcons name="menu-book" size={48} color="#16a34a" />
                            </View>
                            <View className="p-4">
                                <Text className="text-slate-900 dark:text-white text-base font-bold leading-snug" numberOfLines={2}>
                                    5 Ways to improve soil health for next season
                                </Text>
                                <View className="flex-row items-center justify-between mt-3">
                                    <View className="bg-primary/10 px-2 py-1 rounded">
                                        <Text className="text-primary text-[10px] font-bold">AGRICULTURE</Text>
                                    </View>
                                    <View className="flex-row items-center gap-1">
                                        <MaterialIcons name="schedule" size={12} color={isDark ? '#94a3b8' : '#64748b'} />
                                        <Text className="text-slate-400 text-xs">6 min read</Text>
                                    </View>
                                </View>
                            </View>
                        </View>

                        {/* Blog Card 2 */}
                        <View className="w-72 bg-white dark:bg-slate-900 rounded-xl overflow-hidden shadow-sm border border-slate-100 dark:border-slate-800">
                            <View className="h-40 w-full bg-blue-100 dark:bg-blue-900/30 items-center justify-center">
                                <MaterialIcons name="sensors" size={48} color="#2563eb" />
                            </View>
                            <View className="p-4">
                                <Text className="text-slate-900 dark:text-white text-base font-bold leading-snug" numberOfLines={2}>
                                    Smart Farming: Using IoT to monitor moisture
                                </Text>
                                <View className="flex-row items-center justify-between mt-3">
                                    <View className="bg-primary/10 px-2 py-1 rounded">
                                        <Text className="text-primary text-[10px] font-bold">TECH</Text>
                                    </View>
                                    <View className="flex-row items-center gap-1">
                                        <MaterialIcons name="schedule" size={12} color={isDark ? '#94a3b8' : '#64748b'} />
                                        <Text className="text-slate-400 text-xs">4 min read</Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    </ScrollView>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default HomeScreen;
