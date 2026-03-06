import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Alert, Modal, KeyboardAvoidingView, ScrollView, Platform, Dimensions, TouchableWithoutFeedback, Keyboard, useColorScheme, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Notifications from 'expo-notifications';

const { width: screenWidth } = Dimensions.get('window');
import { getDb } from '../database/db';
import { useTranslation } from 'react-i18next';

const activityTypes = ['Ploughing', 'Sowing', 'Irrigation', 'Weeding', 'Fertilizing', 'Spraying', 'Harvesting', 'Other'];
const expenseCategories = ['Seeds', 'Fertilizer', 'Pesticide', 'Labor', 'Fuel', 'Machinery Rent', 'Electricity', 'Other'];
const earningCategories = ['Crop Sale', 'Byproduct Sale', 'Subsidy', 'Other'];
const presetDaysLists = [5, 10, 15, 20, 25, 30];

const getTimeAgo = (dateString, t) => {
    if (!dateString) return '';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const pastDate = new Date(dateString);
    pastDate.setHours(0, 0, 0, 0);

    const diffTime = today - pastDate;
    if (diffTime === 0) return t('today') || 'Today';
    if (diffTime < 0) return t('inTheFuture') || 'In the future';

    let years = today.getFullYear() - pastDate.getFullYear();
    let months = today.getMonth() - pastDate.getMonth();
    let days = today.getDate() - pastDate.getDate();

    if (days < 0) {
        months--;
        const prevMonth = new Date(today.getFullYear(), today.getMonth(), 0);
        days += prevMonth.getDate();
    }

    if (months < 0) {
        years--;
        months += 12;
    }

    const parts = [];
    if (years > 0) parts.push(`${years} ${years > 1 ? (t('years') || 'years') : (t('year') || 'year')}`);
    if (months > 0) parts.push(`${months} ${months > 1 ? (t('months') || 'months') : (t('month') || 'month')}`);
    if (days > 0) parts.push(`${days} ${days > 1 ? (t('days') || 'days') : (t('day') || 'day')}`);

    return parts.length > 0 ? `${parts.join(' ')} ${t('ago') || 'ago'}` : (t('today') || 'Today');
};
const CropWorkspaceScreen = ({ route, navigation }) => {
    const isDark = useColorScheme() === 'dark';
    const { t } = useTranslation();
    const { crop } = route.params; // Passed from HomeScreen
    const [tab, setTab] = useState('Activities'); // 'Activities' | 'Expenses'
    const scrollViewRef = useRef(null);
    const [clickOutsideCatcher, setClickOutsideCatcher] = useState(false);

    // Main Crop Menu State
    const [cropMenuVisible, setCropMenuVisible] = useState(false);

    // Custom Confirmation Modal State (Double Button)
    const [confirmAlertVisible, setConfirmAlertVisible] = useState(false);
    const [confirmAlertTitle, setConfirmAlertTitle] = useState('');
    const [confirmAlertMessage, setConfirmAlertMessage] = useState('');
    const [confirmAlertConfirmText, setConfirmAlertConfirmText] = useState('');
    const [confirmAlertCancelText, setConfirmAlertCancelText] = useState('');
    const [confirmAlertAction, setConfirmAlertAction] = useState(null);
    const [confirmAlertIsDestructive, setConfirmAlertIsDestructive] = useState(false);

    const showConfirmAlert = (title, message, confirmText, cancelText, isDestructive, onConfirm) => {
        setConfirmAlertTitle(title);
        setConfirmAlertMessage(message);
        setConfirmAlertConfirmText(confirmText);
        setConfirmAlertCancelText(cancelText);
        setConfirmAlertIsDestructive(isDestructive);
        setConfirmAlertAction(() => onConfirm);
        setConfirmAlertVisible(true);
    };

    // Custom Alert Modal State (Single Button)
    const [alertVisible, setAlertVisible] = useState(false);
    const [alertTitle, setAlertTitle] = useState('');
    const [alertMessage, setAlertMessage] = useState('');

    const showAlert = (title, message) => {
        setAlertTitle(title);
        setAlertMessage(message);
        setAlertVisible(true);
    };

    // Activities State
    const [activities, setActivities] = useState([]);
    const [actType, setActType] = useState('Sowing');
    const [actNotes, setActNotes] = useState('');
    const [actDate, setActDate] = useState(new Date().toISOString().split('T')[0]);
    const [showActDate, setShowActDate] = useState(false);
    const [isActivityModalVisible, setActivityModalVisible] = useState(false);
    const [editActivityId, setEditActivityId] = useState(null);
    const [customActType, setCustomActType] = useState('');

    // Expenses State
    const [expenses, setExpenses] = useState([]);
    const [expCategory, setExpCategory] = useState('Seeds');
    const [expAmount, setExpAmount] = useState('');
    const [expRemarks, setExpRemarks] = useState('');
    const [expDate, setExpDate] = useState(new Date().toISOString().split('T')[0]);
    const [showExpDate, setShowExpDate] = useState(false);
    const [totalExpense, setTotalExpense] = useState(0);
    const [isExpenseModalVisible, setExpenseModalVisible] = useState(false);
    const [editExpenseId, setEditExpenseId] = useState(null);
    const [customExpCategory, setCustomExpCategory] = useState('');
    const [expAmountError, setExpAmountError] = useState(false);

    // Earnings State
    const [earnings, setEarnings] = useState([]);
    const [earnCategory, setEarnCategory] = useState('Crop Sale');
    const [earnAmount, setEarnAmount] = useState('');
    const [earnRemarks, setEarnRemarks] = useState('');
    const [earnDate, setEarnDate] = useState(new Date().toISOString().split('T')[0]);
    const [showEarnDate, setShowEarnDate] = useState(false);
    const [totalEarning, setTotalEarning] = useState(0);
    const [isEarningModalVisible, setEarningModalVisible] = useState(false);
    const [editEarningId, setEditEarningId] = useState(null);
    const [customEarnCategory, setCustomEarnCategory] = useState('');
    const [earnAmountError, setEarnAmountError] = useState(false);

    // Context Menu State
    const [menuVisibleId, setMenuVisibleId] = useState(null);
    const [menuType, setMenuType] = useState(null); // 'activity' | 'expense'
    const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });

    // Success Modal State (for deactivate/activate feedback)
    const [successModalVisible, setSuccessModalVisible] = useState(false);
    const [successModalTitle, setSuccessModalTitle] = useState('');
    const [successModalMessage, setSuccessModalMessage] = useState('');
    const [successModalButtonText, setSuccessModalButtonText] = useState('Got it');

    // Reminder State
    const [isReminderModalVisible, setReminderModalVisible] = useState(false);
    const [reminderTitle, setReminderTitle] = useState('');
    const [reminderTitleError, setReminderTitleError] = useState(false);
    const [reminderDate, setReminderDate] = useState(new Date());
    const [showReminderDatePicker, setShowReminderDatePicker] = useState(false);
    const [showReminderTimePicker, setShowReminderTimePicker] = useState(false);
    const [selectedPresetDay, setSelectedPresetDay] = useState(null);

    useLayoutEffect(() => {
        navigation.setOptions({ headerShown: false });
    }, [navigation]);

    const handleEditCrop = () => {
        setCropMenuVisible(false);
        navigation.navigate('CreateCrop', { crop });
    };

    const handleDeactivateCrop = () => {
        setCropMenuVisible(false);
        showConfirmAlert(
            t('deactivateCrop') || 'Deactivate Crop',
            (t('deactivateCropConfirmText') || `Are you sure you want to deactivate {cropName}?`).replace('{cropName}', crop.crop_name),
            t('deactivate') || "Deactivate",
            t('cancel') || "Cancel",
            true, // isDestructive
            async () => {
                try {
                    const db = await getDb();
                    await db.runAsync("UPDATE crops SET status = 'Inactive' WHERE id = ?", [crop.id]);
                    setSuccessModalTitle('Crop Deactivated');
                    setSuccessModalMessage('The crop has been successfully deactivated and moved to your archive.');
                    setSuccessModalVisible(true);
                } catch (error) {
                    console.error('Error deactivating:', error);
                }
            }
        );
    };

    const handleActivateCrop = () => {
        setCropMenuVisible(false);
        showConfirmAlert(
            t('activateCrop') || 'Activate Crop',
            (t('activateCropConfirmText') || `Are you sure you want to activate {cropName}?`).replace('{cropName}', crop.crop_name),
            t('activate') || "Activate",
            t('cancel') || "Cancel",
            false, // isDestructive
            async () => {
                try {
                    const db = await getDb();
                    await db.runAsync("UPDATE crops SET status = 'Active' WHERE id = ?", [crop.id]);
                    setSuccessModalTitle('Crop Reactivated');
                    setSuccessModalMessage('The crop has been successfully reactivated and is now visible in your active list.');
                    setSuccessModalButtonText('Great');
                    setSuccessModalVisible(true);
                } catch (error) {
                    console.error('Error activating:', error);
                }
            }
        );
    };

    const handleDeleteCrop = () => {
        setCropMenuVisible(false);
        showConfirmAlert(
            t('deleteCrop') || 'Delete Crop',
            (t('deleteCropConfirmText') || `Are you sure you want to permanently delete {cropName}? This cannot be undone.`).replace('{cropName}', crop.crop_name),
            t('delete') || "Delete",
            t('cancel') || "Cancel",
            true, // isDestructive
            async () => {
                try {
                    const db = await getDb();
                    await db.runAsync("DELETE FROM crops WHERE id = ?", [crop.id]);
                    setSuccessModalTitle('Crop Deleted');
                    setSuccessModalMessage('The crop has been successfully deleted from your farm records and cannot be recovered.');
                    setSuccessModalButtonText('Got it');
                    setSuccessModalVisible(true);
                } catch (error) {
                    console.error('Error deleting:', error);
                }
            }
        );
    };

    useEffect(() => {
        loadData();
    }, []);

    const scheduleReminder = async () => {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== 'granted') {
            showAlert(t('error') || 'Permission Denied', 'Please allow notifications in settings to set a reminder.');
            return;
        }

        if (!reminderTitle.trim()) {
            setReminderTitleError(true);
            return;
        }

        if (reminderDate <= new Date()) {
            showAlert(t('error') || 'Error', 'Please choose a future date and time for the reminder.');
            return;
        }

        try {
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: 'Crop Reminder: ' + crop.crop_name,
                    body: reminderTitle,
                    categoryIdentifier: 'reminder',
                },
                trigger: reminderDate,
            });

            showAlert(t('success') || 'Success', 'Reminder scheduled successfully!');
            setReminderTitle('');
            setReminderTitleError(false);
            setReminderDate(new Date());
            setSelectedPresetDay(null);
            setReminderModalVisible(false);
        } catch (error) {
            console.error('Failed to schedule reminder', error);
            showAlert(t('error') || 'Error', 'Could not schedule reminder.');
        }
    };

    const setReminderFromPresetDays = (days) => {
        const d = new Date();
        d.setDate(d.getDate() + days);
        setReminderDate(d);
        setSelectedPresetDay(days);
    };

    const loadData = async () => {
        try {
            const db = await getDb();
            // Load Activities
            const acts = await db.getAllAsync('SELECT * FROM activities WHERE crop_id = ? ORDER BY id DESC', [crop.id]);
            setActivities(acts);

            // Load Expenses
            const exps = await db.getAllAsync('SELECT * FROM expenses WHERE crop_id = ? ORDER BY id DESC', [crop.id]);
            setExpenses(exps);

            const total = exps.reduce((sum, item) => sum + item.amount, 0);
            setTotalExpense(total);

            // Load Earnings
            const earns = await db.getAllAsync('SELECT * FROM earnings WHERE crop_id = ? ORDER BY id DESC', [crop.id]);
            setEarnings(earns);

            const totalEarn = earns.reduce((sum, item) => sum + item.amount, 0);
            setTotalEarning(totalEarn);
        } catch (error) {
            console.error('Error loading workspace data:', error);
        }
    };

    const addActivity = async () => {
        const finalActType = actType === 'Other' ? customActType.trim() : actType;
        if (!finalActType) {
            Alert.alert('Error', 'Activity name is required');
            return;
        }
        try {
            const db = await getDb();
            if (editActivityId) {
                await db.runAsync(
                    'UPDATE activities SET activity_type = ?, notes = ?, date = ? WHERE id = ?',
                    [finalActType, actNotes, actDate, editActivityId]
                );
            } else {
                await db.runAsync(
                    'INSERT INTO activities (crop_id, activity_type, date, notes) VALUES (?, ?, ?, ?)',
                    [crop.id, finalActType, actDate, actNotes]
                );
            }
            setActNotes('');
            setCustomActType('');
            setEditActivityId(null);
            setActivityModalVisible(false); // Close Modal
            loadData();
        } catch (error) {
            console.error('Activity Save Error', error);
            Alert.alert('Error', 'Failed to log activity.');
        }
    };

    const deleteActivity = (id) => {
        Alert.alert(t('delete'), t('deleteCropConfirmText').replace('{cropName}', ''), [
            { text: t('cancel') || 'Cancel', style: 'cancel' },
            {
                text: t('delete') || 'Delete',
                style: 'destructive',
                onPress: async () => {
                    const db = await getDb();
                    await db.runAsync('DELETE FROM activities WHERE id = ?', [id]);
                    loadData();
                }
            }
        ]);
    };

    const openEditActivity = (item) => {
        setMenuVisibleId(null);
        setEditActivityId(item.id);
        if (activityTypes.includes(item.activity_type) && item.activity_type !== 'Other') {
            setActType(item.activity_type);
            setCustomActType('');
        } else {
            setActType('Other');
            setCustomActType(item.activity_type);
        }
        setActNotes(item.notes || '');
        setActDate(item.date);
        setActivityModalVisible(true);
    };

    const handleAddActivityPress = () => {
        setEditActivityId(null);
        setActType('Sowing');
        setCustomActType('');
        setActNotes('');
        setActDate(new Date().toISOString().split('T')[0]);
        setActivityModalVisible(true);
    };

    const addExpense = async () => {
        if (!expAmount) {
            setExpAmountError(true);
            return;
        }
        const finalExpCategory = expCategory === 'Other' ? customExpCategory.trim() : expCategory;
        if (!finalExpCategory) {
            Alert.alert('Error', 'Expense name is required');
            return;
        }
        try {
            const db = await getDb();
            if (editExpenseId) {
                await db.runAsync(
                    'UPDATE expenses SET category = ?, amount = ?, remarks = ?, date = ? WHERE id = ?',
                    [finalExpCategory, parseFloat(expAmount), expRemarks, expDate, editExpenseId]
                );
            } else {
                await db.runAsync(
                    'INSERT INTO expenses (crop_id, category, amount, payment_mode, date, remarks) VALUES (?, ?, ?, ?, ?, ?)',
                    [crop.id, finalExpCategory, parseFloat(expAmount), 'Cash', expDate, expRemarks]
                );
            }
            setExpAmount('');
            setExpRemarks('');
            setCustomExpCategory('');
            setEditExpenseId(null);
            setExpenseModalVisible(false); // Close Modal
            loadData();
        } catch (error) {
            console.error('Expense Save Error', error);
            Alert.alert('Error', 'Failed to log expense.');
        }
    };

    const deleteExpense = (id) => {
        Alert.alert(t('deleteExpense') || 'Delete Expense', t('deleteCropConfirmText').replace('{cropName}', ''), [
            { text: t('cancel') || 'Cancel', style: 'cancel' },
            {
                text: t('delete') || 'Delete',
                style: 'destructive',
                onPress: async () => {
                    const db = await getDb();
                    await db.runAsync('DELETE FROM expenses WHERE id = ?', [id]);
                    loadData();
                }
            }
        ]);
    };

    const openEditExpense = (item) => {
        setMenuVisibleId(null);
        setEditExpenseId(item.id);
        if (expenseCategories.includes(item.category) && item.category !== 'Other') {
            setExpCategory(item.category);
            setCustomExpCategory('');
        } else {
            setExpCategory('Other');
            setCustomExpCategory(item.category);
        }
        setExpAmount(item.amount.toString());
        setExpRemarks(item.remarks || '');
        setExpDate(item.date);
        setExpenseModalVisible(true);
    };

    const handleAddExpensePress = () => {
        setEditExpenseId(null);
        setExpCategory('Seeds');
        setCustomExpCategory('');
        setExpAmountError(false);
        setExpAmount('');
        setExpRemarks('');
        setExpDate(new Date().toISOString().split('T')[0]);
        setExpenseModalVisible(true);
    };

    const addEarning = async () => {
        if (!earnAmount) {
            setEarnAmountError(true);
            return;
        }
        const finalEarnCategory = earnCategory === 'Other' ? customEarnCategory.trim() : earnCategory;
        if (!finalEarnCategory) {
            Alert.alert('Error', 'Earning name is required');
            return;
        }
        try {
            const db = await getDb();
            if (editEarningId) {
                await db.runAsync(
                    'UPDATE earnings SET category = ?, amount = ?, remarks = ?, date = ? WHERE id = ?',
                    [finalEarnCategory, parseFloat(earnAmount), earnRemarks, earnDate, editEarningId]
                );
            } else {
                await db.runAsync(
                    'INSERT INTO earnings (crop_id, category, amount, payment_mode, date, remarks) VALUES (?, ?, ?, ?, ?, ?)',
                    [crop.id, finalEarnCategory, parseFloat(earnAmount), 'Cash', earnDate, earnRemarks]
                );
            }
            setEarnAmount('');
            setEarnRemarks('');
            setCustomEarnCategory('');
            setEditEarningId(null);
            setEarningModalVisible(false);
            loadData();
        } catch (error) {
            console.error('Earning Save Error', error);
            Alert.alert('Error', 'Failed to log earning.');
        }
    };

    const deleteEarning = (id) => {
        Alert.alert(t('deleteEarning') || 'Delete Earning', t('deleteCropConfirmText').replace('{cropName}', ''), [
            { text: t('cancel') || 'Cancel', style: 'cancel' },
            {
                text: t('delete') || 'Delete',
                style: 'destructive',
                onPress: async () => {
                    const db = await getDb();
                    await db.runAsync('DELETE FROM earnings WHERE id = ?', [id]);
                    loadData();
                }
            }
        ]);
    };

    const openEditEarning = (item) => {
        setMenuVisibleId(null);
        setEditEarningId(item.id);
        if (earningCategories.includes(item.category) && item.category !== 'Other') {
            setEarnCategory(item.category);
            setCustomEarnCategory('');
        } else {
            setEarnCategory('Other');
            setCustomEarnCategory(item.category);
        }
        setEarnAmount(item.amount.toString());
        setEarnRemarks(item.remarks || '');
        setEarnDate(item.date);
        setEarningModalVisible(true);
    };

    const handleAddEarningPress = () => {
        setEditEarningId(null);
        setEarnCategory('Crop Sale');
        setCustomEarnCategory('');
        setEarnAmountError(false);
        setEarnAmount('');
        setEarnRemarks('');
        setEarnDate(new Date().toISOString().split('T')[0]);
        setEarningModalVisible(true);
    };

    const handleMenuPress = (event, item, type) => {
        const { pageX, pageY } = event.nativeEvent;
        // Position menu slightly below the touch point, and aligned to the right edge (using screenWidth)
        setMenuPos({ top: pageY + 15, right: screenWidth - pageX - 20 });
        setMenuVisibleId(item.id);
        setMenuType(type);
    };

    const closeMenu = () => {
        setMenuVisibleId(null);
        setMenuType(null);
    };



    const getActivityIcon = (type) => {
        const lower = type?.toLowerCase() || '';
        if (lower.includes('plow') || lower.includes('plough')) return 'agriculture';
        if (lower.includes('irrig') || lower.includes('water')) return 'water-drop';
        if (lower.includes('sow') || lower.includes('seed')) return 'grass';
        if (lower.includes('harvest')) return 'content-cut';
        if (lower.includes('spray') || lower.includes('pest')) return 'pest-control';
        if (lower.includes('fertil')) return 'science';
        if (lower.includes('weed')) return 'yard';
        if (lower.includes('soil') || lower.includes('test')) return 'science';
        return 'eco';
    };

    const renderActivity = ({ item }) => {
        return (
            <View className="bg-white dark:bg-slate-900 border border-primary/10 p-4 relative shadow-sm rounded-2xl mb-3">
                <TouchableOpacity
                    className="absolute top-4 right-4 p-1 rounded-full z-10"
                    onPress={(e) => handleMenuPress(e, item, 'activity')}
                >
                    <MaterialIcons name="more-vert" size={20} color={isDark ? '#94a3b8' : '#9ca3af'} />
                </TouchableOpacity>
                <View className="flex-row items-center gap-3">
                    <View className="bg-primary/20 p-2 rounded-lg">
                        <MaterialIcons name={getActivityIcon(item.activity_type)} size={24} color="#3ce619" />
                    </View>
                    <View className="flex-1">
                        <Text className="font-bold text-slate-900 dark:text-white text-base">{t(item.activity_type)}</Text>
                        <Text className="text-xs text-slate-500 dark:text-slate-400">
                            {item.date} • {getTimeAgo(item.date, t)}
                        </Text>
                    </View>
                </View>
                {item.notes ? (
                    <View className="mt-4 bg-background-light dark:bg-background-dark/50 p-3 rounded-lg border border-primary/5">
                        <Text className="text-sm text-slate-600 dark:text-slate-300 italic">
                            <Text className="font-semibold not-italic">Remarks: </Text>
                            {item.notes}
                        </Text>
                    </View>
                ) : null}
            </View>
        );
    };



    const renderExpense = ({ item }) => {
        return (
            <View className="bg-white dark:bg-slate-900 border border-primary/10 p-4 relative shadow-sm rounded-2xl mb-3">
                <TouchableOpacity
                    className="absolute top-4 right-4 p-1 rounded-full z-10"
                    onPress={(e) => handleMenuPress(e, item, 'expense')}
                >
                    <MaterialIcons name="more-vert" size={20} color={isDark ? '#94a3b8' : '#9ca3af'} />
                </TouchableOpacity>
                <View className="flex-row justify-between items-center">
                    <View className="flex-row items-center gap-3">
                        <View className="bg-primary/20 p-2 rounded-lg">
                            <MaterialIcons name="shopping-basket" size={24} color="#3ce619" />
                        </View>
                        <View>
                            <Text className="font-bold text-slate-900 dark:text-white text-base">{t(item.category)}</Text>
                            <Text className="text-xs text-slate-500 dark:text-slate-400">
                                {item.date} • {getTimeAgo(item.date, t)}
                            </Text>
                        </View>
                    </View>
                    <View className="mr-8">
                        <Text className="text-xl font-bold text-green-700 dark:text-green-400">₹{item.amount.toFixed(2)}</Text>
                    </View>
                </View>
                {item.remarks ? (
                    <View className="mt-4 bg-background-light dark:bg-background-dark/50 p-3 rounded-lg border border-primary/5">
                        <Text className="text-sm text-slate-600 dark:text-slate-300 italic">
                            <Text className="font-semibold not-italic">Remarks: </Text>
                            {item.remarks}
                        </Text>
                    </View>
                ) : null}
            </View>
        );
    };

    const renderEarning = ({ item }) => {
        return (
            <View className="bg-white dark:bg-slate-900 border border-primary/10 p-4 relative shadow-sm rounded-2xl mb-3">
                <TouchableOpacity
                    className="absolute top-4 right-4 p-1 rounded-full z-10"
                    onPress={(e) => handleMenuPress(e, item, 'earning')}
                >
                    <MaterialIcons name="more-vert" size={20} color={isDark ? '#94a3b8' : '#9ca3af'} />
                </TouchableOpacity>
                <View className="flex-row justify-between items-center">
                    <View className="flex-row items-center gap-3">
                        <View className="bg-primary/20 p-2 rounded-lg">
                            <MaterialIcons name="payment" size={24} color="#3ce619" />
                        </View>
                        <View>
                            <Text className="font-bold text-slate-900 dark:text-white text-base">{t(item.category)}</Text>
                            <Text className="text-xs text-slate-500 dark:text-slate-400">
                                {item.date} • {getTimeAgo(item.date, t)}
                            </Text>
                        </View>
                    </View>
                    <View className="mr-8">
                        <Text className="text-xl font-bold text-green-700 dark:text-green-400">₹{item.amount.toFixed(2)}</Text>
                    </View>
                </View>
                {item.remarks ? (
                    <View className="mt-4 bg-background-light dark:bg-background-dark/50 p-3 rounded-lg border border-primary/5">
                        <Text className="text-sm text-slate-600 dark:text-slate-300 italic">
                            <Text className="font-semibold not-italic">Remarks: </Text>
                            {item.remarks}
                        </Text>
                    </View>
                ) : null}
            </View>
        );
    };

    const switchTab = (newTab) => {
        setTab(newTab);
        if (scrollViewRef.current) {
            let offset = 0;
            if (newTab === 'Expenses') offset = screenWidth;
            if (newTab === 'Earnings') offset = screenWidth * 2;

            scrollViewRef.current.scrollTo({
                x: offset,
                y: 0,
                animated: true
            });
        }
    };

    const handleScroll = (e) => {
        const page = Math.round(e.nativeEvent.contentOffset.x / screenWidth);
        const newTab = page === 0 ? 'Activities' : page === 1 ? 'Expenses' : 'Earnings';
        if (tab !== newTab) {
            setTab(newTab);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark" edges={['top']}>
            {/* Custom Header */}
            <View className="bg-background-light/80 dark:bg-background-dark/80 border-b border-primary/10">
                <View className="flex-row items-center p-4 justify-between">
                    <View className="flex-row items-center gap-3">
                        <TouchableOpacity
                            className="h-10 w-10 items-center justify-center rounded-full"
                            onPress={() => navigation.goBack()}
                        >
                            <MaterialIcons name="arrow-back" size={24} color={isDark ? '#e2e8f0' : '#1e293b'} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => navigation.navigate('CreateCrop', { crop })}>
                            <Text className="text-lg font-bold tracking-tight leading-tight text-slate-900 dark:text-white">{crop.crop_name}</Text>
                            <Text className="text-xs text-slate-500 dark:text-slate-400">{crop.land_identifier} • {crop.total_area} {crop.area_unit}</Text>
                        </TouchableOpacity>
                    </View>
                    <View className="flex-row items-center gap-1">
                        <TouchableOpacity
                            className="h-10 w-10 items-center justify-center rounded-full"
                            onPress={() => setReminderModalVisible(true)}
                        >
                            <MaterialIcons name="event" size={24} color={isDark ? '#cbd5e1' : '#475569'} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            className="h-10 w-10 items-center justify-center rounded-full"
                            onPress={() => setCropMenuVisible(true)}
                        >
                            <MaterialIcons name="more-vert" size={24} color={isDark ? '#cbd5e1' : '#475569'} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Tabs */}
                <View className="flex-row px-4 border-b border-primary/5">
                    <TouchableOpacity className="flex-1 items-center py-3" onPress={() => switchTab('Activities')}>
                        <Text className={`text-sm font-bold ${tab === 'Activities' ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>{t('activityLogs')}</Text>
                        <View className={`absolute bottom-0 left-0 right-0 h-0.5 ${tab === 'Activities' ? 'bg-primary' : 'bg-transparent'}`} />
                    </TouchableOpacity>
                    <TouchableOpacity className="flex-1 items-center py-3" onPress={() => switchTab('Expenses')}>
                        <Text className={`text-sm font-bold ${tab === 'Expenses' ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>{t('expenses')}</Text>
                        <View className={`absolute bottom-0 left-0 right-0 h-0.5 ${tab === 'Expenses' ? 'bg-primary' : 'bg-transparent'}`} />
                    </TouchableOpacity>
                    <TouchableOpacity className="flex-1 items-center py-3" onPress={() => switchTab('Earnings')}>
                        <Text className={`text-sm font-bold ${tab === 'Earnings' ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>{t('earnings')}</Text>
                        <View className={`absolute bottom-0 left-0 right-0 h-0.5 ${tab === 'Earnings' ? 'bg-primary' : 'bg-transparent'}`} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Top Right Crop context Menu modal */}
            <Modal visible={cropMenuVisible} transparent={true} animationType="fade" onRequestClose={() => setCropMenuVisible(false)}>
                <TouchableWithoutFeedback onPress={() => setCropMenuVisible(false)}>
                    <View className="flex-1">
                        <View className="absolute right-4 top-14 w-48 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-primary/10 z-50 overflow-hidden">
                            <TouchableOpacity className="flex-row items-center px-4 py-3 border-b border-slate-100 dark:border-slate-800" onPress={handleEditCrop}>
                                <MaterialIcons name="edit" size={18} color={isDark ? '#e2e8f0' : '#475569'} style={{ marginRight: 12 }} />
                                <Text className="text-sm text-slate-700 dark:text-slate-200">{t('editCropDetails')}</Text>
                            </TouchableOpacity>
                            {crop.status !== 'Inactive' ? (
                                <TouchableOpacity className="flex-row items-center px-4 py-3 border-b border-slate-100 dark:border-slate-800" onPress={handleDeactivateCrop}>
                                    <MaterialIcons name="pause-circle-outline" size={18} color={isDark ? '#e2e8f0' : '#475569'} style={{ marginRight: 12 }} />
                                    <Text className="text-sm text-slate-700 dark:text-slate-200">{t('deactivateCrop')}</Text>
                                </TouchableOpacity>
                            ) : (
                                <TouchableOpacity className="flex-row items-center px-4 py-3 border-b border-slate-100 dark:border-slate-800" onPress={handleActivateCrop}>
                                    <MaterialIcons name="play-circle-outline" size={18} color={isDark ? '#e2e8f0' : '#475569'} style={{ marginRight: 12 }} />
                                    <Text className="text-sm text-slate-700 dark:text-slate-200">{t('activateCrop')}</Text>
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity className="flex-row items-center px-4 py-3" onPress={handleDeleteCrop}>
                                <MaterialIcons name="delete" size={18} color="#ef4444" style={{ marginRight: 12 }} />
                                <Text className="text-sm text-red-500">{t('deleteCrop')}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>

            {/* Swipable Content */}
            <ScrollView
                ref={scrollViewRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={handleScroll}
                scrollEventThrottle={16}
                style={{ flex: 1 }}
            >
                {/* Activities Page */}
                <View style={{ width: screenWidth }}>
                    <FlatList
                        data={activities}
                        keyExtractor={item => item.id.toString()}
                        renderItem={renderActivity}
                        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100, paddingTop: 16 }}
                        ListEmptyComponent={<Text className="text-center text-slate-400 italic mt-6 text-base">{t('noActivitiesLogged')}</Text>}
                    />
                </View>

                {/* Expenses Page */}
                <View style={{ width: screenWidth }}>
                    <FlatList
                        data={expenses}
                        keyExtractor={item => item.id.toString()}
                        ListHeaderComponent={() => (
                            <View className="bg-primary/10 dark:bg-primary/5 border border-primary/20 rounded-2xl p-6 mb-6">
                                <Text className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">{t('totalInvestment')}</Text>
                                <Text className="text-3xl font-bold text-slate-900 dark:text-white">₹{totalExpense.toFixed(2)}</Text>
                            </View>
                        )}
                        renderItem={renderExpense}
                        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100, paddingTop: 16 }}
                        ListEmptyComponent={<Text className="text-center text-slate-400 italic mt-6 text-base">{t('noExpensesLogged')}</Text>}
                    />
                </View>

                {/* Earnings Page */}
                <View style={{ width: screenWidth }}>
                    <FlatList
                        data={earnings}
                        keyExtractor={item => item.id.toString()}
                        ListHeaderComponent={() => (
                            <View className="bg-primary/10 dark:bg-primary/5 border border-primary/20 rounded-2xl p-6 mb-6">
                                <Text className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">{t('totalEarnings')}</Text>
                                <Text className="text-3xl font-bold text-slate-900 dark:text-white">₹{totalEarning.toFixed(2)}</Text>
                            </View>
                        )}
                        renderItem={renderEarning}
                        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100, paddingTop: 16 }}
                        ListEmptyComponent={<Text className="text-center text-slate-400 italic mt-6 text-base">{t('noEarningsLogged')}</Text>}
                    />
                </View>
            </ScrollView>

            {/* Floating Action Button */}
            <View style={{ position: 'absolute', bottom: 24, left: 0, right: 0, alignItems: 'center', zIndex: 20 }}>
                <TouchableOpacity
                    className="flex-row items-center gap-2 bg-primary py-4 px-10 rounded-full shadow-lg"
                    style={{ shadowColor: '#3ce619', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 }}
                    onPress={tab === 'Activities' ? handleAddActivityPress : tab === 'Expenses' ? handleAddExpensePress : handleAddEarningPress}
                >
                    <MaterialIcons name="add" size={22} color="#0f172a" />
                    <Text className="font-bold text-slate-900 text-base">
                        {tab === 'Activities' ? t('logActivity') : tab === 'Expenses' ? t('addExpense') : t('addEarning')}
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Activity Modal */}
            <Modal visible={isActivityModalVisible} animationType="slide" transparent={true} onRequestClose={() => { Keyboard.dismiss(); setActivityModalVisible(false); }}>
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
                        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                            <View className="bg-white dark:bg-slate-900 p-5 rounded-t-2xl" style={{ maxHeight: '80%' }}>
                                <View className="flex-row justify-between items-center mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
                                    <Text className="text-lg font-bold text-slate-900 dark:text-white">{editActivityId ? t('editActivity') : t('logNewActivity')}</Text>
                                    <TouchableOpacity onPress={() => setActivityModalVisible(false)}>
                                        <Text className="text-xl text-slate-400 font-bold p-1">✕</Text>
                                    </TouchableOpacity>
                                </View>
                                <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                                    <View className="flex-row flex-wrap gap-1.5 mb-3">
                                        {activityTypes.map(type => (
                                            <TouchableOpacity key={type} onPress={() => setActType(type)} className={`px-3 py-2 rounded-full ${actType === type ? 'bg-amber-500' : 'bg-slate-100 dark:bg-slate-800'}`}>
                                                <Text className={`text-base ${actType === type ? 'text-white font-bold' : 'text-slate-600 dark:text-slate-300'}`}>{t(type)}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                    {actType === 'Other' && (
                                        <TextInput className="border border-slate-200 dark:border-slate-700 rounded-lg p-3 mb-4 text-base text-slate-900 dark:text-white bg-white dark:bg-slate-800" placeholderTextColor={isDark ? '#888' : '#999'} placeholder={t('activityName')} value={customActType} onChangeText={setCustomActType} />
                                    )}
                                    <TextInput className="border border-slate-200 dark:border-slate-700 rounded-lg p-3 mb-4 text-base text-slate-900 dark:text-white bg-white dark:bg-slate-800" placeholderTextColor={isDark ? '#888' : '#999'} placeholder={t('observationsNotes')} value={actNotes} onChangeText={setActNotes} onSubmitEditing={Keyboard.dismiss} />

                                    <Text className="text-sm font-semibold text-slate-500 dark:text-slate-300 mb-1">{t('date')}</Text>
                                    <TouchableOpacity onPress={() => setShowActDate(true)}>
                                        <View className="border border-slate-200 dark:border-slate-700 rounded-lg p-3 mb-4 bg-white dark:bg-slate-800">
                                            <Text className="text-base text-slate-900 dark:text-white">{actDate}</Text>
                                        </View>
                                    </TouchableOpacity>
                                    {showActDate && (
                                        <DateTimePicker
                                            value={new Date(actDate)}
                                            mode="date"
                                            display="default"
                                            onChange={(event, selectedDate) => {
                                                setShowActDate(Platform.OS === 'ios');
                                                if (selectedDate && event.type !== 'dismissed') {
                                                    setActDate(selectedDate.toISOString().split('T')[0]);
                                                }
                                            }}
                                        />
                                    )}

                                    <TouchableOpacity className="bg-primary p-4 rounded-xl items-center mt-2" onPress={() => { Keyboard.dismiss(); addActivity(); }}>
                                        <Text className="text-white font-bold text-lg">{t('addLog')}</Text>
                                    </TouchableOpacity>
                                </ScrollView>
                            </View>
                        </TouchableWithoutFeedback>
                    </KeyboardAvoidingView>
                </TouchableWithoutFeedback>
            </Modal>

            {/* Expense Modal */}
            <Modal visible={isExpenseModalVisible} animationType="slide" transparent={true} onRequestClose={() => { Keyboard.dismiss(); setExpenseModalVisible(false); }}>
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
                        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                            <View className="bg-white dark:bg-slate-900 p-5 rounded-t-2xl" style={{ maxHeight: '80%' }}>
                                <View className="flex-row justify-between items-center mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
                                    <Text className="text-lg font-bold text-slate-900 dark:text-white">{editExpenseId ? t('editExpense') : t('addExpense')}</Text>
                                    <TouchableOpacity onPress={() => setExpenseModalVisible(false)}>
                                        <Text className="text-xl text-slate-400 font-bold p-1">✕</Text>
                                    </TouchableOpacity>
                                </View>
                                <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                                    <TextInput className={`border rounded-lg p-3 mb-1 text-base text-slate-900 dark:text-white bg-white dark:bg-slate-800 ${expAmountError ? 'border-red-500 mb-0' : 'border-slate-200 dark:border-slate-700 mb-4'}`} placeholderTextColor={isDark ? '#888' : '#999'} placeholder={t('amountRupee')} keyboardType="numeric" value={expAmount} onChangeText={(text) => { setExpAmount(text); setExpAmountError(false); }} onSubmitEditing={Keyboard.dismiss} />
                                    {expAmountError && <Text className="text-red-500 text-xs mb-4 mt-1">{t('fieldRequired')}</Text>}
                                    <View className="flex-row flex-wrap gap-1.5 mb-3">
                                        {expenseCategories.map(cat => (
                                            <TouchableOpacity key={cat} onPress={() => setExpCategory(cat)} className={`px-3 py-2 rounded-full ${expCategory === cat ? 'bg-amber-500' : 'bg-slate-100 dark:bg-slate-800'}`}>
                                                <Text className={`text-base ${expCategory === cat ? 'text-white font-bold' : 'text-slate-600 dark:text-slate-300'}`}>{t(cat)}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                    {expCategory === 'Other' && (
                                        <TextInput className="border border-slate-200 dark:border-slate-700 rounded-lg p-3 mb-4 text-base text-slate-900 dark:text-white bg-white dark:bg-slate-800" placeholderTextColor={isDark ? '#888' : '#999'} placeholder={t('expenseName')} value={customExpCategory} onChangeText={setCustomExpCategory} />
                                    )}
                                    <TextInput className="border border-slate-200 dark:border-slate-700 rounded-lg p-3 mb-4 text-base text-slate-900 dark:text-white bg-white dark:bg-slate-800" placeholderTextColor={isDark ? '#888' : '#999'} placeholder={t('remarksDetails')} value={expRemarks} onChangeText={setExpRemarks} onSubmitEditing={Keyboard.dismiss} />

                                    <Text className="text-sm font-semibold text-slate-500 dark:text-slate-300 mb-1">{t('date')}</Text>
                                    <TouchableOpacity onPress={() => setShowExpDate(true)}>
                                        <View className="border border-slate-200 dark:border-slate-700 rounded-lg p-3 mb-4 bg-white dark:bg-slate-800">
                                            <Text className="text-base text-slate-900 dark:text-white">{expDate}</Text>
                                        </View>
                                    </TouchableOpacity>
                                    {showExpDate && (
                                        <DateTimePicker
                                            value={new Date(expDate)}
                                            mode="date"
                                            display="default"
                                            onChange={(event, selectedDate) => {
                                                setShowExpDate(Platform.OS === 'ios');
                                                if (selectedDate && event.type !== 'dismissed') {
                                                    setExpDate(selectedDate.toISOString().split('T')[0]);
                                                }
                                            }}
                                        />
                                    )}

                                    <TouchableOpacity className="bg-primary p-4 rounded-xl items-center mt-2" onPress={() => { Keyboard.dismiss(); addExpense(); }}>
                                        <Text className="text-white font-bold text-lg">{t('addExpense')}</Text>
                                    </TouchableOpacity>
                                </ScrollView>
                            </View>
                        </TouchableWithoutFeedback>
                    </KeyboardAvoidingView>
                </TouchableWithoutFeedback>
            </Modal>

            {/* Earning Modal */}
            <Modal visible={isEarningModalVisible} animationType="slide" transparent={true} onRequestClose={() => { Keyboard.dismiss(); setEarningModalVisible(false); }}>
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
                        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                            <View className="bg-white dark:bg-slate-900 p-5 rounded-t-2xl" style={{ maxHeight: '80%' }}>
                                <View className="flex-row justify-between items-center mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
                                    <Text className="text-lg font-bold text-slate-900 dark:text-white">{editEarningId ? t('editEarning') : t('addEarning')}</Text>
                                    <TouchableOpacity onPress={() => setEarningModalVisible(false)}>
                                        <Text className="text-xl text-slate-400 font-bold p-1">✕</Text>
                                    </TouchableOpacity>
                                </View>
                                <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                                    <TextInput className={`border rounded-lg p-3 mb-1 text-base text-slate-900 dark:text-white bg-white dark:bg-slate-800 ${earnAmountError ? 'border-red-500 mb-0' : 'border-slate-200 dark:border-slate-700 mb-4'}`} placeholderTextColor={isDark ? '#888' : '#999'} placeholder={t('amountRupee')} keyboardType="numeric" value={earnAmount} onChangeText={(text) => { setEarnAmount(text); setEarnAmountError(false); }} onSubmitEditing={Keyboard.dismiss} />
                                    {earnAmountError && <Text className="text-red-500 text-xs mb-4 mt-1">{t('fieldRequired')}</Text>}
                                    <View className="flex-row flex-wrap gap-1.5 mb-3">
                                        {earningCategories.map(cat => (
                                            <TouchableOpacity key={cat} onPress={() => setEarnCategory(cat)} className={`px-3 py-2 rounded-full ${earnCategory === cat ? 'bg-amber-500' : 'bg-slate-100 dark:bg-slate-800'}`}>
                                                <Text className={`text-base ${earnCategory === cat ? 'text-white font-bold' : 'text-slate-600 dark:text-slate-300'}`}>{t(cat)}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                    {earnCategory === 'Other' && (
                                        <TextInput className="border border-slate-200 dark:border-slate-700 rounded-lg p-3 mb-4 text-base text-slate-900 dark:text-white bg-white dark:bg-slate-800" placeholderTextColor={isDark ? '#888' : '#999'} placeholder={t('earningName')} value={customEarnCategory} onChangeText={setCustomEarnCategory} />
                                    )}
                                    <TextInput className="border border-slate-200 dark:border-slate-700 rounded-lg p-3 mb-4 text-base text-slate-900 dark:text-white bg-white dark:bg-slate-800" placeholderTextColor={isDark ? '#888' : '#999'} placeholder={t('remarksDetails')} value={earnRemarks} onChangeText={setEarnRemarks} onSubmitEditing={Keyboard.dismiss} />

                                    <Text className="text-sm font-semibold text-slate-500 dark:text-slate-300 mb-1">{t('date')}</Text>
                                    <TouchableOpacity onPress={() => setShowEarnDate(true)}>
                                        <View className="border border-slate-200 dark:border-slate-700 rounded-lg p-3 mb-4 bg-white dark:bg-slate-800">
                                            <Text className="text-base text-slate-900 dark:text-white">{earnDate}</Text>
                                        </View>
                                    </TouchableOpacity>
                                    {showEarnDate && (
                                        <DateTimePicker
                                            value={new Date(earnDate)}
                                            mode="date"
                                            display="default"
                                            onChange={(event, selectedDate) => {
                                                setShowEarnDate(Platform.OS === 'ios');
                                                if (selectedDate && event.type !== 'dismissed') {
                                                    setEarnDate(selectedDate.toISOString().split('T')[0]);
                                                }
                                            }}
                                        />
                                    )}

                                    <TouchableOpacity className="bg-blue-600 dark:bg-blue-500 p-4 rounded-xl items-center mt-2" onPress={() => { Keyboard.dismiss(); addEarning(); }}>
                                        <Text className="text-white font-bold text-lg">{t('addEarning')}</Text>
                                    </TouchableOpacity>
                                </ScrollView>
                            </View>
                        </TouchableWithoutFeedback>
                    </KeyboardAvoidingView>
                </TouchableWithoutFeedback>
            </Modal>

            {/* Reminder Modal */}
            <Modal visible={isReminderModalVisible} animationType="slide" transparent={true} onRequestClose={() => { Keyboard.dismiss(); setReminderModalVisible(false); }}>
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
                        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                            <View className="bg-white dark:bg-slate-900 p-5 rounded-t-2xl" style={{ maxHeight: '80%' }}>
                                <View className="flex-row justify-between items-center mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
                                    <Text className="text-lg font-bold text-slate-900 dark:text-white">{t('setReminder')}</Text>
                                    <TouchableOpacity onPress={() => setReminderModalVisible(false)}>
                                        <Text className="text-xl text-slate-400 font-bold p-1">✕</Text>
                                    </TouchableOpacity>
                                </View>
                                <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                                    <TextInput className={`border rounded-lg p-3 mb-1 text-base text-slate-900 dark:text-white bg-white dark:bg-slate-800 ${reminderTitleError ? 'border-red-500 mb-0' : 'border-slate-200 dark:border-slate-700 mb-4'}`} placeholderTextColor={isDark ? '#888' : '#999'} placeholder={t('reminderTitle')} value={reminderTitle} onChangeText={(text) => { setReminderTitle(text); setReminderTitleError(false); }} onSubmitEditing={Keyboard.dismiss} />
                                    {reminderTitleError && <Text className="text-red-500 text-xs mb-4 mt-1">{t('fieldRequired')}</Text>}

                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15, gap: 10 }}>
                                        <TouchableOpacity style={{ flex: 1 }} onPress={() => setShowReminderDatePicker(true)}>
                                            <Text className="text-sm font-semibold text-slate-500 dark:text-slate-300 mb-1">{t('date')}</Text>
                                            <View className="border border-slate-200 dark:border-slate-700 rounded-lg p-3 bg-white dark:bg-slate-800">
                                                <Text className="text-base text-slate-900 dark:text-white">{reminderDate.toLocaleDateString()}</Text>
                                            </View>
                                        </TouchableOpacity>

                                        <TouchableOpacity style={{ flex: 1 }} onPress={() => setShowReminderTimePicker(true)}>
                                            <Text className="text-sm font-semibold text-slate-500 dark:text-slate-300 mb-1">{t('time')}</Text>
                                            <View className="border border-slate-200 dark:border-slate-700 rounded-lg p-3 bg-white dark:bg-slate-800">
                                                <Text className="text-base text-slate-900 dark:text-white">{reminderDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                                            </View>
                                        </TouchableOpacity>
                                    </View>

                                    {showReminderDatePicker && (
                                        <DateTimePicker
                                            value={reminderDate}
                                            mode="date"
                                            display="default"
                                            minimumDate={new Date()}
                                            onChange={(event, selectedDate) => {
                                                setShowReminderDatePicker(Platform.OS === 'ios');
                                                if (selectedDate && event.type !== 'dismissed') {
                                                    const curDate = new Date(reminderDate);
                                                    curDate.setFullYear(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
                                                    setReminderDate(curDate);
                                                }
                                            }}
                                        />
                                    )}

                                    {showReminderTimePicker && (
                                        <DateTimePicker
                                            value={reminderDate}
                                            mode="time"
                                            display="default"
                                            onChange={(event, selectedDate) => {
                                                setShowReminderTimePicker(Platform.OS === 'ios');
                                                if (selectedDate && event.type !== 'dismissed') {
                                                    const curDate = new Date(reminderDate);
                                                    curDate.setHours(selectedDate.getHours(), selectedDate.getMinutes(), 0, 0);
                                                    setReminderDate(curDate);
                                                }
                                            }}
                                        />
                                    )}

                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 10, flexWrap: 'wrap' }}>
                                        <Text className="text-base font-medium text-slate-500 dark:text-slate-300">{t('setTo')}</Text>
                                        <View style={{ borderWidth: 1, borderColor: isDark ? '#444' : '#DDD', borderRadius: 8, marginHorizontal: 8, backgroundColor: isDark ? '#333' : '#f9f9f9', overflow: 'hidden' }}>
                                            <Picker
                                                selectedValue={selectedPresetDay || 0}
                                                style={{ height: 40, width: 120, margin: -8, color: isDark ? '#FFF' : '#000' }}
                                                onValueChange={(itemValue) => {
                                                    if (itemValue !== 0) {
                                                        setReminderFromPresetDays(itemValue);
                                                    }
                                                }}
                                            >
                                                <Picker.Item label="..." value={0} color={isDark ? "#AAA" : "#999"} />
                                                {presetDaysLists.map(days => (
                                                    <Picker.Item key={days} label={`${days}`} value={days} color={isDark ? "#FFF" : "#333"} />
                                                ))}
                                            </Picker>
                                        </View>
                                        <Text className="text-base font-medium text-slate-500 dark:text-slate-300">{t('daysFromToday')}</Text>
                                    </View>

                                    <TouchableOpacity className="bg-purple-600 dark:bg-purple-500 p-4 rounded-xl items-center mt-2" onPress={() => { Keyboard.dismiss(); scheduleReminder(); }}>
                                        <Text className="text-white font-bold text-lg">{t('scheduleReminder')}</Text>
                                    </TouchableOpacity>
                                </ScrollView>
                            </View>
                        </TouchableWithoutFeedback>
                    </KeyboardAvoidingView>
                </TouchableWithoutFeedback>
            </Modal>

            {/* Global Context Menu Modal */}
            <Modal visible={menuVisibleId !== null} transparent={true} animationType="none" onRequestClose={closeMenu}>
                <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPressOut={closeMenu}>
                    <View className="absolute bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-primary/10 overflow-hidden" style={{ top: menuPos.top, right: menuPos.right, minWidth: 120, zIndex: 9999 }}>
                        <TouchableOpacity className="px-4 py-3 border-b border-slate-100 dark:border-slate-800" onPress={() => {
                            const itemId = menuVisibleId;
                            const tString = menuType;
                            closeMenu();
                            if (tString === 'activity') {
                                const item = activities.find(a => a.id === itemId);
                                if (item) openEditActivity(item);
                            } else if (tString === 'expense') {
                                const item = expenses.find(e => e.id === itemId);
                                if (item) openEditExpense(item);
                            } else if (tString === 'earning') {
                                const item = earnings.find(e => e.id === itemId);
                                if (item) openEditEarning(item);
                            }
                        }}>
                            <Text className="text-blue-500 text-base font-medium">{t('edit') || 'Edit'}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity className="px-4 py-3" onPress={() => {
                            const itemId = menuVisibleId;
                            const tString = menuType;
                            closeMenu();
                            if (tString === 'activity') deleteActivity(itemId);
                            else if (tString === 'expense') deleteExpense(itemId);
                            else deleteEarning(itemId);
                        }}>
                            <Text className="text-red-500 text-base font-medium">{t('delete') || 'Delete'}</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* Custom Confirmation Alert Modal */}
            <Modal animationType="fade" transparent={true} visible={confirmAlertVisible} onRequestClose={() => setConfirmAlertVisible(false)}>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
                    <View className="bg-white dark:bg-slate-900 rounded-2xl p-6 items-center shadow-xl" style={{ width: '80%' }}>
                        <Text className="text-xl font-bold text-slate-900 dark:text-white text-center mb-4">{confirmAlertTitle}</Text>
                        <Text className="text-base text-slate-500 dark:text-slate-400 text-center mb-6 leading-6">{confirmAlertMessage}</Text>
                        <View style={{ flexDirection: 'row', gap: 10, width: '100%', marginTop: 10 }}>
                            <Pressable className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-lg p-3 items-center" onPress={() => setConfirmAlertVisible(false)}>
                                <Text className="font-bold text-slate-700 dark:text-slate-200 text-base">{confirmAlertCancelText}</Text>
                            </Pressable>
                            <Pressable
                                className="flex-1 rounded-lg p-3 items-center"
                                style={{ backgroundColor: confirmAlertIsDestructive ? '#ef4444' : '#3b82f6' }}
                                onPress={() => { setConfirmAlertVisible(false); if (confirmAlertAction) confirmAlertAction(); }}
                            >
                                <Text className="text-white font-bold text-base">{confirmAlertConfirmText}</Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Custom Alert Modal (Single Button - OK) */}
            <Modal animationType="fade" transparent={true} visible={alertVisible} onRequestClose={() => setAlertVisible(false)}>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
                    <View className="bg-white dark:bg-slate-900 rounded-2xl p-6 items-center shadow-xl" style={{ width: '80%' }}>
                        <Text className="text-xl font-bold text-slate-900 dark:text-white text-center mb-4">{alertTitle}</Text>
                        <Text className="text-base text-slate-500 dark:text-slate-400 text-center mb-6 leading-6">{alertMessage}</Text>
                        <Pressable className="w-full bg-primary rounded-lg p-3 items-center" onPress={() => setAlertVisible(false)}>
                            <Text className="text-white font-bold text-base">{t('ok') || 'OK'}</Text>
                        </Pressable>
                    </View>
                </View>
            </Modal>

            {/* Success Modal (Deactivate/Activate) */}
            <Modal animationType="fade" transparent={true} visible={successModalVisible} onRequestClose={() => { setSuccessModalVisible(false); navigation.goBack(); }}>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(20, 33, 17, 0.6)' }}>
                    <View className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl overflow-hidden items-center p-8 border border-primary/10" style={{ width: '85%' }}>
                        {/* Icon */}
                        <View className="mb-6 h-20 w-20 items-center justify-center rounded-full bg-primary/20">
                            <MaterialIcons name="check-circle" size={48} color="#3ce619" />
                        </View>
                        {/* Content */}
                        <Text className="text-2xl font-bold text-slate-900 dark:text-white text-center mb-2">{successModalTitle}</Text>
                        <Text className="text-base text-slate-500 dark:text-slate-400 text-center leading-6 mb-8">{successModalMessage}</Text>
                        {/* Button */}
                        <TouchableOpacity
                            className="w-full bg-primary py-3.5 px-6 rounded-xl items-center shadow-lg"
                            style={{ shadowColor: '#3ce619', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 6 }}
                            onPress={() => { setSuccessModalVisible(false); navigation.goBack(); }}
                        >
                            <Text className="text-black font-bold text-base">{successModalButtonText}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

export default CropWorkspaceScreen;

