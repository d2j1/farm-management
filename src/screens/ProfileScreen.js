import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    Keyboard,
    ScrollView,
    Modal,
    Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { MaterialIcons } from '@expo/vector-icons';
import { getDb } from '../database/db';
import useStore from '../store/useStore';

const ProfileScreen = ({ navigation }) => {
    const { t } = useTranslation();
    const setFarmProfile = useStore(state => state.setFarmProfile);

    const [name, setName] = useState('');
    const [village, setVillage] = useState('');
    const [acreage, setAcreage] = useState('');
    const [crops, setCrops] = useState('');
    const [nameError, setNameError] = useState(false);
    const [comingSoonVisible, setComingSoonVisible] = useState(false);
    const [successVisible, setSuccessVisible] = useState(false);
    const [errorVisible, setErrorVisible] = useState(false);

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const db = await getDb();
            const allRows = await db.getAllAsync('SELECT * FROM profile LIMIT 1');
            if (allRows.length > 0) {
                const p = allRows[0];
                setName(p.name);
                setVillage(p.village || '');
                setAcreage(p.acreage ? p.acreage.toString() : '');
                setCrops(p.crops || '');
            }
        } catch (error) {
            console.error('Error loading profile:', error);
        }
    };

    const saveProfile = async () => {
        if (!name.trim()) {
            setNameError(true);
            return;
        }
        setNameError(false);
        try {
            const db = await getDb();
            await db.runAsync('DELETE FROM profile');
            const result = await db.runAsync(
                'INSERT INTO profile (name, village, acreage, crops) VALUES (?, ?, ?, ?)',
                [name, village, acreage ? parseFloat(acreage) : 0, crops]
            );
            if (result.changes > 0) {
                setFarmProfile({ name, village, acreage, crops });
                setSuccessVisible(true);
            }
        } catch (error) {
            console.error('Error saving profile:', error);
            setErrorVisible(true);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark" edges={['top']}>

            {/* Header */}
            <View className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-4">
                <View className="flex-row items-center justify-center relative">
                    <TouchableOpacity
                        className="absolute left-0 p-1"
                        onPress={() => navigation.goBack()}
                    >
                        <MaterialIcons name="arrow-back" size={24} color="#64748b" />
                    </TouchableOpacity>
                    <Text className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 text-center">
                        Update Profile
                    </Text>
                </View>
            </View>

            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <ScrollView
                    className="flex-1"
                    contentContainerStyle={{ paddingBottom: 40 }}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Avatar Section */}
                    <View className="items-center justify-center pt-8 pb-2">
                        <View className="w-24 h-24 bg-slate-200 dark:bg-slate-800 rounded-full items-center justify-center border-4 border-white dark:border-slate-900 shadow-sm">
                            <MaterialIcons name="person" size={48} color="#94a3b8" />
                        </View>
                        <TouchableOpacity className="mt-3" onPress={() => setComingSoonVisible(true)}>
                            <Text className="text-xs font-semibold text-primary tracking-wider">
                                Change Photo
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Account Form Section */}
                    <View className="mt-6 px-4">
                        <Text className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                            {t('account') || 'Account'}
                        </Text>

                        <View className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm p-5 gap-4">

                            {/* Full Name */}
                            <View>
                                <Text className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1.5 ml-0.5">
                                    {t('fullName') || 'Full Name'}
                                </Text>
                                <TextInput
                                    className={`w-full bg-slate-50 dark:bg-slate-800 border rounded-lg py-3 px-4 text-base text-slate-900 dark:text-slate-100 ${nameError ? 'border-red-500 bg-red-50 dark:bg-slate-800' : 'border-slate-200 dark:border-slate-700'}`}
                                    value={name}
                                    onChangeText={(text) => { setName(text); setNameError(false); }}
                                    placeholder={t('enterYourName') || 'Enter your full name'}
                                    placeholderTextColor="#94a3b8"
                                />
                                {nameError && (
                                    <Text className="text-xs text-red-500 font-medium mt-1 ml-1">
                                        {t('nameRequired') || 'The full name is required'}
                                    </Text>
                                )}
                            </View>

                            {/* Village Name */}
                            <View>
                                <Text className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1.5 ml-0.5">
                                    {t('villageName') || 'Village Name'}
                                </Text>
                                <TextInput
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-3 px-4 text-base text-slate-900 dark:text-slate-100"
                                    value={village}
                                    onChangeText={setVillage}
                                    placeholder={t('enterVillageName') || 'Enter village name'}
                                    placeholderTextColor="#94a3b8"
                                />
                            </View>

                            {/* Total Acreage */}
                            <View>
                                <Text className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1.5 ml-0.5">
                                    {t('totalAcreage') || 'Total Acreage'}
                                </Text>
                                <TextInput
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-3 px-4 text-base text-slate-900 dark:text-slate-100"
                                    value={acreage}
                                    onChangeText={setAcreage}
                                    placeholder={t('enterAcreage') || 'e.g. 5.5'}
                                    placeholderTextColor="#94a3b8"
                                    keyboardType="numeric"
                                />
                            </View>

                            {/* Active Crops */}
                            <View>
                                <Text className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1.5 ml-0.5">
                                    {t('activeCropsComma') || 'Active Crops'}
                                </Text>
                                <TextInput
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-3 px-4 text-base text-slate-900 dark:text-slate-100"
                                    value={crops}
                                    onChangeText={setCrops}
                                    placeholder={t('enterCrops') || 'Wheat, Cotton, Rice...'}
                                    placeholderTextColor="#94a3b8"
                                />
                            </View>

                            {/* Save Button */}
                            <View className="pt-2">
                                <TouchableOpacity
                                    className="w-full bg-primary rounded-xl py-4 items-center justify-center flex-row gap-2 shadow-md active:opacity-90"
                                    onPress={saveProfile}
                                >
                                    <MaterialIcons name="save" size={20} color="#ffffff" />
                                    <Text className="text-white font-bold text-base">
                                        Save Changes
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </ScrollView>
            </TouchableWithoutFeedback>

            {/* Success Modal */}
            <Modal
                animationType="fade"
                transparent
                visible={successVisible}
                onRequestClose={() => {
                    setSuccessVisible(false);
                    navigation.goBack();
                }}
            >
                <View className="flex-1 justify-center items-center bg-black/60 px-4">
                    <View className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-xl p-8 items-center shadow-2xl border border-primary/10">
                        <View className="mb-6 h-20 w-20 items-center justify-center rounded-full bg-primary/20">
                            <MaterialIcons name="check-circle" size={48} color="#3ce619" />
                        </View>
                        <Text className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2 text-center">
                            Profile Saved
                        </Text>
                        <Text className="text-base text-slate-600 dark:text-slate-400 text-center mb-8 leading-relaxed">
                            Your profile has been successfully updated with the latest information.
                        </Text>
                        <Pressable
                            onPress={() => {
                                setSuccessVisible(false);
                                navigation.goBack();
                            }}
                            className="w-full bg-primary py-3.5 px-6 rounded-xl items-center shadow-lg"
                        >
                            <Text className="text-slate-900 font-bold text-base">Got it</Text>
                        </Pressable>
                    </View>
                </View>
            </Modal>

            {/* Error Modal */}
            <Modal
                animationType="fade"
                transparent
                visible={errorVisible}
                onRequestClose={() => setErrorVisible(false)}
            >
                <View className="flex-1 justify-center items-center bg-black/60 px-4">
                    <View className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-xl p-8 items-center shadow-2xl border border-red-200 dark:border-red-900/30">
                        <View className="mb-6 h-20 w-20 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                            <MaterialIcons name="error" size={48} color="#ef4444" />
                        </View>
                        <Text className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2 text-center">
                            Save Failed
                        </Text>
                        <Text className="text-base text-slate-600 dark:text-slate-400 text-center mb-8 leading-relaxed">
                            We encountered an issue while saving your profile. Please try again.
                        </Text>
                        <Pressable
                            onPress={() => setErrorVisible(false)}
                            className="w-full bg-primary py-3.5 px-6 rounded-xl items-center shadow-lg"
                        >
                            <Text className="text-slate-900 font-bold text-base">Got it</Text>
                        </Pressable>
                    </View>
                </View>
            </Modal>
            {/* Coming Soon Modal */}
            <Modal
                animationType="fade"
                transparent
                visible={comingSoonVisible}
                onRequestClose={() => setComingSoonVisible(false)}
            >
                <View className="flex-1 justify-center items-center bg-black/50 px-4">
                    <View className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-2xl p-6 items-center shadow-xl">
                        <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                            <MaterialIcons name="construction" size={32} color="#f59e0b" />
                        </View>
                        <Text className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2 text-center">
                            {t('comingSoon') || 'Coming Soon'}
                        </Text>
                        <Text className="text-sm text-slate-600 dark:text-slate-300 text-center mb-6 leading-5">
                            {t('comingSoonMsg') || 'This feature is not implemented yet. Stay tuned for upcoming updates!'}
                        </Text>
                        <Pressable
                            onPress={() => setComingSoonVisible(false)}
                            className="bg-primary px-8 py-3 rounded-xl"
                        >
                            <Text className="text-slate-900 font-bold text-sm">
                                {t('ok') || 'OK'}
                            </Text>
                        </Pressable>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

export default ProfileScreen;
