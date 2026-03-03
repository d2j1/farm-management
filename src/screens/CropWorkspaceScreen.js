import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, Alert, Modal, KeyboardAvoidingView, ScrollView, Platform, Dimensions, TouchableWithoutFeedback, Keyboard, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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

const getTimeAgo = (dateString) => {
    if (!dateString) return '';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const pastDate = new Date(dateString);
    pastDate.setHours(0, 0, 0, 0);

    const diffTime = today - pastDate;
    if (diffTime === 0) return 'Today';
    if (diffTime < 0) return 'In the future';

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
    if (years > 0) parts.push(`${years} year${years > 1 ? 's' : ''}`);
    if (months > 0) parts.push(`${months} month${months > 1 ? 's' : ''}`);
    if (days > 0) parts.push(`${days} day${days > 1 ? 's' : ''}`);

    return parts.length > 0 ? parts.join(' ') + ' ago' : 'Today';
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

    // Context Menu State
    const [menuVisibleId, setMenuVisibleId] = useState(null);
    const [menuType, setMenuType] = useState(null); // 'activity' | 'expense'
    const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });

    // Reminder State
    const [isReminderModalVisible, setReminderModalVisible] = useState(false);
    const [reminderTitle, setReminderTitle] = useState('');
    const [reminderDate, setReminderDate] = useState(new Date());
    const [showReminderDatePicker, setShowReminderDatePicker] = useState(false);
    const [showReminderTimePicker, setShowReminderTimePicker] = useState(false);
    const [selectedPresetDay, setSelectedPresetDay] = useState(null);

    useLayoutEffect(() => {
        navigation.setOptions({
            headerTitle: () => (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{ fontSize: 24, marginRight: 8 }}>🌾</Text>
                    <View>
                        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#FFFFFF' }}>
                            {crop.crop_name}
                        </Text>
                        <Text style={{ fontSize: 13, color: 'rgba(255, 255, 255, 0.8)' }}>
                            {crop.land_identifier} ({crop.total_area} {crop.area_unit})
                        </Text>
                    </View>
                </View>
            ),
            headerRight: () => (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TouchableOpacity onPress={() => setReminderModalVisible(true)} style={{ padding: 10 }}>
                        <Ionicons name="timer-outline" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setCropMenuVisible(true)} style={{ padding: 10 }}>
                        <Text style={{ fontSize: 24, fontWeight: 'bold', color: "#FFFFFF" }}>⋮</Text>
                    </TouchableOpacity>
                </View>
            ),
        });
    }, [navigation, crop, isDark]);

    const handleEditCrop = () => {
        setCropMenuVisible(false);
        navigation.navigate('CreateCrop', { crop });
    };

    const handleDeactivateCrop = () => {
        setCropMenuVisible(false);
        Alert.alert(
            "Deactivate Crop",
            `Are you sure you want to deactivate ${crop.crop_name}?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Deactivate", style: "destructive", onPress: async () => {
                        try {
                            const db = await getDb();
                            await db.runAsync("UPDATE crops SET status = 'Inactive' WHERE id = ?", [crop.id]);
                            navigation.goBack();
                        } catch (error) {
                            console.error('Error deactivating:', error);
                        }
                    }
                }
            ]
        );
    };

    const handleActivateCrop = () => {
        setCropMenuVisible(false);
        Alert.alert(
            "Activate Crop",
            `Are you sure you want to activate ${crop.crop_name}?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Activate", style: "default", onPress: async () => {
                        try {
                            const db = await getDb();
                            await db.runAsync("UPDATE crops SET status = 'Active' WHERE id = ?", [crop.id]);
                            navigation.goBack();
                        } catch (error) {
                            console.error('Error activating:', error);
                        }
                    }
                }
            ]
        );
    };

    const handleDeleteCrop = () => {
        setCropMenuVisible(false);
        Alert.alert(
            "Delete Crop",
            `Are you sure you want to permanently delete ${crop.crop_name}? This cannot be undone.`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete", style: "destructive", onPress: async () => {
                        try {
                            const db = await getDb();
                            await db.runAsync("DELETE FROM crops WHERE id = ?", [crop.id]);
                            navigation.goBack();
                        } catch (error) {
                            console.error('Error deleting:', error);
                        }
                    }
                }
            ]
        );
    };

    useEffect(() => {
        loadData();
    }, []);

    const scheduleReminder = async () => {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'Please allow notifications in settings to set a reminder.');
            return;
        }

        if (!reminderTitle.trim()) {
            Alert.alert('Error', 'Please enter a reminder title');
            return;
        }

        if (reminderDate <= new Date()) {
            Alert.alert('Error', 'Please choose a future date and time for the reminder.');
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

            Alert.alert('Success', 'Reminder scheduled successfully!');
            setReminderTitle('');
            setReminderDate(new Date());
            setSelectedPresetDay(null);
            setReminderModalVisible(false);
        } catch (error) {
            console.error('Failed to schedule reminder', error);
            Alert.alert('Error', 'Could not schedule reminder.');
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
        Alert.alert('Delete Log', 'Are you sure you want to delete this activity?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
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
            Alert.alert('Error', 'Amount is required');
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
        Alert.alert('Delete Expense', 'Are you sure you want to delete this expense?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
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
        setExpAmount('');
        setExpRemarks('');
        setExpDate(new Date().toISOString().split('T')[0]);
        setExpenseModalVisible(true);
    };

    const addEarning = async () => {
        if (!earnAmount) {
            Alert.alert('Error', 'Amount is required');
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
        Alert.alert('Delete Earning', 'Are you sure you want to delete this earning?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
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



    const renderActivity = ({ item, index }) => {
        const isLast = index === activities.length - 1;
        const isFirst = index === 0;

        return (
            <View style={styles.timelineContainer}>
                <View style={styles.timelineLeft}>
                    <View style={[styles.line, { top: isFirst ? '50%' : 0, bottom: isLast ? '50%' : -15 }]} />
                    <View style={styles.dot} />
                </View>
                <View style={[styles.timelineCard, isDark && styles.cardDark]}>
                    <View style={styles.cardHeaderRow}>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.cardHeader, isDark && styles.textDark]}>{item.activity_type}</Text>
                            <Text style={[styles.dateText, isDark && styles.dateTextDark]}>
                                {item.date} <Text style={[styles.timeAgoText, isDark && styles.textMutedDark]}>({getTimeAgo(item.date)})</Text>
                            </Text>
                        </View>
                        <TouchableOpacity onPress={(e) => handleMenuPress(e, item, 'activity')} style={styles.menuDotsBtn}>
                            <Text style={[styles.menuDotsText, isDark && styles.textDark]}>⋮</Text>
                        </TouchableOpacity>
                    </View>
                    {item.notes ? <Text style={[styles.cardNotes, isDark && styles.textMutedDark]}>{item.notes}</Text> : null}
                </View>
            </View>
        );
    };



    const renderExpense = ({ item }) => {
        return (
            <View style={[styles.cardContainer, isDark && styles.cardContainerDark]}>
                <View style={styles.cardRow}>
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.cardHeader, isDark && styles.textDark]}>{item.category} • {item.date}</Text>
                        {item.remarks ? <Text style={[styles.cardNotes, isDark && styles.textMutedDark]}>{item.remarks}</Text> : null}
                    </View>
                    <Text style={[styles.amountText, { color: isDark ? '#EF5350' : '#D32F2F' }]}>₹{item.amount.toFixed(2)}</Text>
                    <TouchableOpacity onPress={(e) => handleMenuPress(e, item, 'expense')} style={styles.menuDotsBtn}>
                        <Text style={[styles.menuDotsText, isDark && styles.textDark]}>⋮</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    const renderEarning = ({ item }) => {
        return (
            <View style={[styles.cardContainer, isDark && styles.cardContainerDark]}>
                <View style={styles.cardRow}>
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.cardHeader, isDark && styles.textDark]}>{item.category} • {item.date}</Text>
                        {item.remarks ? <Text style={[styles.cardNotes, isDark && styles.textMutedDark]}>{item.remarks}</Text> : null}
                    </View>
                    <Text style={[styles.amountText, { color: isDark ? '#81C784' : '#2E7D32' }]}>₹{item.amount.toFixed(2)}</Text>
                    <TouchableOpacity onPress={(e) => handleMenuPress(e, item, 'earning')} style={styles.menuDotsBtn}>
                        <Text style={[styles.menuDotsText, isDark && styles.textDark]}>⋮</Text>
                    </TouchableOpacity>
                </View>
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

    const handleMomentumScrollEnd = (e) => {
        const page = Math.round(e.nativeEvent.contentOffset.x / screenWidth);
        if (page === 0) setTab('Activities');
        else if (page === 1) setTab('Expenses');
        else setTab('Earnings');
    };

    return (
        <View style={[styles.container, isDark && styles.containerDark]}>
            {/* Tabs */}
            <View style={[styles.tabContainer, isDark && styles.tabContainerDark]}>
                <TouchableOpacity style={[styles.tabBtn, tab === 'Activities' && styles.tabBtnActive, isDark && tab === 'Activities' && styles.tabBtnActiveDark]} onPress={() => switchTab('Activities')}>
                    <Text style={[styles.tabText, isDark && styles.textMutedDark, tab === 'Activities' && styles.tabTextActive, isDark && tab === 'Activities' && styles.tabTextActiveDark]}>{t('activityLogs')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.tabBtn, tab === 'Expenses' && styles.tabBtnActive, isDark && tab === 'Expenses' && styles.tabBtnActiveDark]} onPress={() => switchTab('Expenses')}>
                    <Text style={[styles.tabText, isDark && styles.textMutedDark, tab === 'Expenses' && styles.tabTextActive, isDark && tab === 'Expenses' && styles.tabTextActiveDark]}>{t('expenses')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.tabBtn, tab === 'Earnings' && styles.tabBtnActive, isDark && tab === 'Earnings' && styles.tabBtnActiveDark]} onPress={() => switchTab('Earnings')}>
                    <Text style={[styles.tabText, isDark && styles.textMutedDark, tab === 'Earnings' && styles.tabTextActive, isDark && tab === 'Earnings' && styles.tabTextActiveDark]}>{t('earnings')}</Text>
                </TouchableOpacity>
            </View>

            {/* Top Right Crop context Menu modal */}
            <Modal visible={cropMenuVisible} transparent={true} animationType="fade" onRequestClose={() => setCropMenuVisible(false)}>
                <TouchableWithoutFeedback onPress={() => setCropMenuVisible(false)}>
                    <View style={styles.cropMenuOverlay}>
                        <View style={[styles.cropMenuContainer, isDark && styles.menuContainerDark]}>
                            <TouchableOpacity style={styles.cropMenuItem} onPress={handleEditCrop}>
                                <Text style={[styles.cropMenuItemText, isDark && styles.textDark]}>{t('editCropDetails')}</Text>
                            </TouchableOpacity>
                            {crop.status !== 'Inactive' ? (
                                <TouchableOpacity style={styles.cropMenuItem} onPress={handleDeactivateCrop}>
                                    <Text style={[styles.cropMenuItemText, isDark && styles.textDark]}>{t('deactivateCrop')}</Text>
                                </TouchableOpacity>
                            ) : (
                                <TouchableOpacity style={styles.cropMenuItem} onPress={handleActivateCrop}>
                                    <Text style={[styles.cropMenuItemText, isDark && styles.textDark]}>{t('activateCrop')}</Text>
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity style={styles.cropMenuItem} onPress={handleDeleteCrop}>
                                <Text style={[styles.cropMenuItemText, { color: isDark ? '#EF5350' : '#D32F2F' }]}>{t('deleteCrop')}</Text>
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
                onMomentumScrollEnd={handleMomentumScrollEnd}
                style={{ flex: 1 }}
            >
                {/* Activities Page */}
                <View style={{ width: screenWidth }}>
                    <FlatList
                        data={activities}
                        keyExtractor={item => item.id.toString()}
                        renderItem={renderActivity}
                        contentContainerStyle={styles.listContainer}
                        ListEmptyComponent={<Text style={[styles.emptyText, isDark && styles.textMutedDark]}>{t('noActivitiesLogged')}</Text>}
                    />
                </View>

                {/* Expenses Page */}
                <View style={{ width: screenWidth }}>
                    <FlatList
                        data={expenses}
                        keyExtractor={item => item.id.toString()}
                        ListHeaderComponent={() => (
                            <View style={[styles.summaryCard, isDark && styles.summaryCardExpenseDark]}>
                                <Text style={[styles.summaryLabel, isDark && styles.summaryLabelExpenseDark]}>{t('totalInvestment')}</Text>
                                <Text style={[styles.summaryAmount, isDark && styles.summaryAmountExpenseDark]}>₹{totalExpense.toFixed(2)}</Text>
                            </View>
                        )}
                        renderItem={renderExpense}
                        contentContainerStyle={styles.listContainer}
                        ListEmptyComponent={<Text style={[styles.emptyText, isDark && styles.textMutedDark]}>{t('noExpensesLogged')}</Text>}
                    />
                </View>

                {/* Earnings Page */}
                <View style={{ width: screenWidth }}>
                    <FlatList
                        data={earnings}
                        keyExtractor={item => item.id.toString()}
                        ListHeaderComponent={() => (
                            <View style={[styles.summaryCard, { backgroundColor: isDark ? '#15243B' : '#E3F2FD', borderColor: isDark ? '#213D6B' : '#BBDEFB' }]}>
                                <Text style={[styles.summaryLabel, { color: isDark ? '#64B5F6' : '#1565C0' }]}>{t('totalEarnings')}</Text>
                                <Text style={[styles.summaryAmount, { color: isDark ? '#90CAF9' : '#1976D2' }]}>₹{totalEarning.toFixed(2)}</Text>
                            </View>
                        )}
                        renderItem={renderEarning}
                        contentContainerStyle={styles.listContainer}
                        ListEmptyComponent={<Text style={[styles.emptyText, isDark && styles.textMutedDark]}>{t('noEarningsLogged')}</Text>}
                    />
                </View>
            </ScrollView>

            {/* Floating Action Buttons */}
            <View style={styles.fabContainer}>
                {tab === 'Activities' && (
                    <TouchableOpacity style={[styles.fabButton, styles.fabActivity]} onPress={handleAddActivityPress}>
                        <Text style={styles.fabButtonText}>+ {t('logActivity')}</Text>
                    </TouchableOpacity>
                )}
                {tab === 'Expenses' && (
                    <TouchableOpacity style={[styles.fabButton, styles.fabExpense]} onPress={handleAddExpensePress}>
                        <Text style={styles.fabButtonText}>+ {t('addExpense')}</Text>
                    </TouchableOpacity>
                )}
                {tab === 'Earnings' && (
                    <TouchableOpacity style={[styles.fabButton, styles.fabEarning]} onPress={handleAddEarningPress}>
                        <Text style={styles.fabButtonText}>+ {t('addEarning')}</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Activity Modal */}
            <Modal visible={isActivityModalVisible} animationType="slide" transparent={true} onRequestClose={() => { Keyboard.dismiss(); setActivityModalVisible(false); }}>
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === "ios" ? "padding" : "height"}>
                        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                            <View style={[styles.modalContent, isDark && styles.modalContentDark]}>
                                <View style={[styles.modalHeader, isDark && styles.modalHeaderDark]}>
                                    <Text style={[styles.modalTitle, isDark && styles.textDark]}>{editActivityId ? t('editActivity') : t('logNewActivity')}</Text>
                                    <TouchableOpacity onPress={() => setActivityModalVisible(false)}>
                                        <Text style={styles.closeText}>✕</Text>
                                    </TouchableOpacity>
                                </View>
                                <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                                    <View style={styles.pillContainer}>
                                        {activityTypes.map(type => (
                                            <TouchableOpacity key={type} onPress={() => setActType(type)} style={[styles.pill, isDark && styles.pillDark, actType === type && styles.pillActive]}>
                                                <Text style={[styles.pillText, isDark && styles.textDark, actType === type && styles.pillTextActive]}>{type}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                    {actType === 'Other' && (
                                        <TextInput style={[styles.input, isDark && styles.inputDark]} placeholderTextColor={isDark ? '#888' : '#999'} placeholder={t('activityName')} value={customActType} onChangeText={setCustomActType} />
                                    )}
                                    <TextInput style={[styles.input, isDark && styles.inputDark]} placeholderTextColor={isDark ? '#888' : '#999'} placeholder={t('observationsNotes')} value={actNotes} onChangeText={setActNotes} onSubmitEditing={Keyboard.dismiss} />

                                    <Text style={[styles.label, isDark && styles.textDark, { marginBottom: 5 }]}>{t('date')}</Text>
                                    <TouchableOpacity onPress={() => setShowActDate(true)}>
                                        <View style={[styles.input, isDark && styles.inputDark]}>
                                            <Text style={{ fontSize: 16, color: isDark ? '#FFF' : '#000' }}>{actDate}</Text>
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

                                    <TouchableOpacity style={[styles.submitBtn, isDark && styles.submitBtnDark]} onPress={() => { Keyboard.dismiss(); addActivity(); }}><Text style={styles.submitBtnText}>{t('addLog')}</Text></TouchableOpacity>
                                </ScrollView>
                            </View>
                        </TouchableWithoutFeedback>
                    </KeyboardAvoidingView>
                </TouchableWithoutFeedback>
            </Modal>

            {/* Expense Modal */}
            <Modal visible={isExpenseModalVisible} animationType="slide" transparent={true} onRequestClose={() => { Keyboard.dismiss(); setExpenseModalVisible(false); }}>
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === "ios" ? "padding" : "height"}>
                        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                            <View style={[styles.modalContent, isDark && styles.modalContentDark]}>
                                <View style={[styles.modalHeader, isDark && styles.modalHeaderDark]}>
                                    <Text style={[styles.modalTitle, isDark && styles.textDark]}>{editExpenseId ? t('editExpense') : t('addExpense')}</Text>
                                    <TouchableOpacity onPress={() => setExpenseModalVisible(false)}>
                                        <Text style={styles.closeText}>✕</Text>
                                    </TouchableOpacity>
                                </View>
                                <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                                    <TextInput style={[styles.input, isDark && styles.inputDark]} placeholderTextColor={isDark ? '#888' : '#999'} placeholder={t('amountRupee')} keyboardType="numeric" value={expAmount} onChangeText={setExpAmount} onSubmitEditing={Keyboard.dismiss} />
                                    <View style={styles.pillContainer}>
                                        {expenseCategories.map(cat => (
                                            <TouchableOpacity key={cat} onPress={() => setExpCategory(cat)} style={[styles.pill, isDark && styles.pillDark, expCategory === cat && styles.pillActive]}>
                                                <Text style={[styles.pillText, isDark && styles.textDark, expCategory === cat && styles.pillTextActive]}>{cat}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                    {expCategory === 'Other' && (
                                        <TextInput style={[styles.input, isDark && styles.inputDark]} placeholderTextColor={isDark ? '#888' : '#999'} placeholder={t('expenseName')} value={customExpCategory} onChangeText={setCustomExpCategory} />
                                    )}
                                    <TextInput style={[styles.input, isDark && styles.inputDark]} placeholderTextColor={isDark ? '#888' : '#999'} placeholder={t('remarksDetails')} value={expRemarks} onChangeText={setExpRemarks} onSubmitEditing={Keyboard.dismiss} />

                                    <Text style={[styles.label, isDark && styles.textDark, { marginBottom: 5 }]}>{t('date')}</Text>
                                    <TouchableOpacity onPress={() => setShowExpDate(true)}>
                                        <View style={[styles.input, isDark && styles.inputDark]}>
                                            <Text style={{ fontSize: 16, color: isDark ? '#FFF' : '#000' }}>{expDate}</Text>
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

                                    <TouchableOpacity style={[styles.submitBtn, isDark && styles.submitBtnDark]} onPress={() => { Keyboard.dismiss(); addExpense(); }}><Text style={styles.submitBtnText}>{t('addExpense')}</Text></TouchableOpacity>
                                </ScrollView>
                            </View>
                        </TouchableWithoutFeedback>
                    </KeyboardAvoidingView>
                </TouchableWithoutFeedback>
            </Modal>

            {/* Earning Modal */}
            <Modal visible={isEarningModalVisible} animationType="slide" transparent={true} onRequestClose={() => { Keyboard.dismiss(); setEarningModalVisible(false); }}>
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === "ios" ? "padding" : "height"}>
                        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                            <View style={[styles.modalContent, isDark && styles.modalContentDark]}>
                                <View style={[styles.modalHeader, isDark && styles.modalHeaderDark]}>
                                    <Text style={[styles.modalTitle, isDark && styles.textDark]}>{editEarningId ? t('editEarning') : t('addEarning')}</Text>
                                    <TouchableOpacity onPress={() => setEarningModalVisible(false)}>
                                        <Text style={styles.closeText}>✕</Text>
                                    </TouchableOpacity>
                                </View>
                                <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                                    <TextInput style={[styles.input, isDark && styles.inputDark]} placeholderTextColor={isDark ? '#888' : '#999'} placeholder={t('amountRupee')} keyboardType="numeric" value={earnAmount} onChangeText={setEarnAmount} onSubmitEditing={Keyboard.dismiss} />
                                    <View style={styles.pillContainer}>
                                        {earningCategories.map(cat => (
                                            <TouchableOpacity key={cat} onPress={() => setEarnCategory(cat)} style={[styles.pill, isDark && styles.pillDark, earnCategory === cat && styles.pillActive]}>
                                                <Text style={[styles.pillText, isDark && styles.textDark, earnCategory === cat && styles.pillTextActive]}>{cat}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                    {earnCategory === 'Other' && (
                                        <TextInput style={[styles.input, isDark && styles.inputDark]} placeholderTextColor={isDark ? '#888' : '#999'} placeholder={t('earningName')} value={customEarnCategory} onChangeText={setCustomEarnCategory} />
                                    )}
                                    <TextInput style={[styles.input, isDark && styles.inputDark]} placeholderTextColor={isDark ? '#888' : '#999'} placeholder={t('remarksDetails')} value={earnRemarks} onChangeText={setEarnRemarks} onSubmitEditing={Keyboard.dismiss} />

                                    <Text style={[styles.label, isDark && styles.textDark, { marginBottom: 5 }]}>{t('date')}</Text>
                                    <TouchableOpacity onPress={() => setShowEarnDate(true)}>
                                        <View style={[styles.input, isDark && styles.inputDark]}>
                                            <Text style={{ fontSize: 16, color: isDark ? '#FFF' : '#000' }}>{earnDate}</Text>
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

                                    <TouchableOpacity style={[styles.submitBtn, { backgroundColor: isDark ? '#42A5F5' : '#1976D2' }]} onPress={() => { Keyboard.dismiss(); addEarning(); }}><Text style={styles.submitBtnText}>{t('addEarning')}</Text></TouchableOpacity>
                                </ScrollView>
                            </View>
                        </TouchableWithoutFeedback>
                    </KeyboardAvoidingView>
                </TouchableWithoutFeedback>
            </Modal>

            {/* Reminder Modal */}
            <Modal visible={isReminderModalVisible} animationType="slide" transparent={true} onRequestClose={() => { Keyboard.dismiss(); setReminderModalVisible(false); }}>
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === "ios" ? "padding" : "height"}>
                        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                            <View style={[styles.modalContent, isDark && styles.modalContentDark]}>
                                <View style={[styles.modalHeader, isDark && styles.modalHeaderDark]}>
                                    <Text style={[styles.modalTitle, isDark && styles.textDark]}>{t('setReminder')}</Text>
                                    <TouchableOpacity onPress={() => setReminderModalVisible(false)}>
                                        <Text style={styles.closeText}>✕</Text>
                                    </TouchableOpacity>
                                </View>
                                <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                                    <TextInput style={[styles.input, isDark && styles.inputDark]} placeholderTextColor={isDark ? '#888' : '#999'} placeholder={t('reminderTitle')} value={reminderTitle} onChangeText={setReminderTitle} onSubmitEditing={Keyboard.dismiss} />

                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15, gap: 10 }}>
                                        <TouchableOpacity style={{ flex: 1 }} onPress={() => setShowReminderDatePicker(true)}>
                                            <Text style={[styles.label, isDark && styles.textDark, { marginBottom: 5 }]}>{t('date')}</Text>
                                            <View style={[styles.input, isDark && styles.inputDark, { marginBottom: 0 }]}>
                                                <Text style={{ fontSize: 16, color: isDark ? '#FFF' : '#000' }}>{reminderDate.toLocaleDateString()}</Text>
                                            </View>
                                        </TouchableOpacity>

                                        <TouchableOpacity style={{ flex: 1 }} onPress={() => setShowReminderTimePicker(true)}>
                                            <Text style={[styles.label, isDark && styles.textDark, { marginBottom: 5 }]}>{t('time')}</Text>
                                            <View style={[styles.input, isDark && styles.inputDark, { marginBottom: 0 }]}>
                                                <Text style={{ fontSize: 16, color: isDark ? '#FFF' : '#000' }}>{reminderDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
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
                                        <Text style={[{ fontSize: 16, color: '#555', fontWeight: '500' }, isDark && styles.textDark]}>{t('setTo')}</Text>
                                        <View style={[{ borderWidth: 1, borderColor: '#DDD', borderRadius: 8, marginHorizontal: 8, backgroundColor: '#f9f9f9', overflow: 'hidden' }, isDark && { borderColor: '#444', backgroundColor: '#333' }]}>
                                            <Picker
                                                selectedValue={selectedPresetDay || 0}
                                                style={[{ height: 40, width: 120, margin: -8 }, isDark && { color: '#FFF' }]}
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
                                        <Text style={[{ fontSize: 16, color: '#555', fontWeight: '500' }, isDark && styles.textDark]}>{t('daysFromToday')}</Text>
                                    </View>

                                    <TouchableOpacity style={[styles.submitBtn, { backgroundColor: isDark ? '#7E57C2' : '#673AB7' }]} onPress={() => { Keyboard.dismiss(); scheduleReminder(); }}><Text style={styles.submitBtnText}>{t('scheduleReminder')}</Text></TouchableOpacity>
                                </ScrollView>
                            </View>
                        </TouchableWithoutFeedback>
                    </KeyboardAvoidingView>
                </TouchableWithoutFeedback>
            </Modal>

            {/* Global Context Menu Modal positioned exactly where tapped */}
            <Modal visible={menuVisibleId !== null} transparent={true} animationType="none" onRequestClose={closeMenu}>
                <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPressOut={closeMenu}>
                    <View style={[styles.contextMenu, isDark && styles.contextMenuDark, { top: menuPos.top, right: menuPos.right }]}>
                        <TouchableOpacity style={styles.menuItem} onPress={() => {
                            const itemId = menuVisibleId;
                            const t = menuType;
                            closeMenu();
                            if (t === 'activity') {
                                const item = activities.find(a => a.id === itemId);
                                if (item) openEditActivity(item);
                            } else if (t === 'expense') {
                                const item = expenses.find(e => e.id === itemId);
                                if (item) openEditExpense(item);
                            } else if (t === 'earning') {
                                const item = earnings.find(e => e.id === itemId);
                                if (item) openEditEarning(item);
                            }
                        }}>
                            <Text style={[styles.menuItemTextEdit, isDark && { color: '#64B5F6' }]}>Edit</Text>
                        </TouchableOpacity>
                        <View style={[styles.menuDivider, isDark && { backgroundColor: '#444' }]} />
                        <TouchableOpacity style={styles.menuItem} onPress={() => {
                            const itemId = menuVisibleId;
                            const t = menuType;
                            closeMenu();
                            if (t === 'activity') deleteActivity(itemId);
                            else if (t === 'expense') deleteExpense(itemId);
                            else deleteEarning(itemId);
                        }}>
                            <Text style={styles.menuItemTextDelete}>Delete</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F0F2F5' },
    containerDark: { backgroundColor: '#121212' },

    tabContainer: { flexDirection: 'row', margin: 15, backgroundColor: 'white', borderRadius: 10, padding: 5, elevation: 2 },
    tabContainerDark: { backgroundColor: '#1E1E1E' },
    tabBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 8 },
    tabBtnActive: { backgroundColor: '#E8F5E9' },
    tabBtnActiveDark: { backgroundColor: '#1B5E20' },
    tabText: { fontSize: 16, color: '#666', fontWeight: 'bold' },
    tabTextActive: { color: '#2E7D32' },
    tabTextActiveDark: { color: '#81C784' },



    pillContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
    pill: { backgroundColor: '#F0F0F0', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },
    pillDark: { backgroundColor: '#333' },
    pillActive: { backgroundColor: '#FF8F00' },
    pillText: { fontSize: 16, color: '#555' },
    pillTextActive: { color: 'white', fontWeight: 'bold' },

    submitBtn: { backgroundColor: '#2E7D32', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 10 },
    submitBtnDark: { backgroundColor: '#388E3C' },
    submitBtnText: { color: 'white', fontWeight: 'bold', fontSize: 18 },

    summaryCard: { backgroundColor: '#E8F5E9', padding: 20, marginHorizontal: 15, marginBottom: 15, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: '#C8E6C9' },
    summaryCardExpenseDark: { backgroundColor: '#3B2424', borderColor: '#6B2121' },
    summaryLabel: { fontSize: 16, color: '#1B5E20', fontWeight: '600' },
    summaryLabelExpenseDark: { color: '#EF5350' },
    summaryAmount: { fontSize: 32, color: '#2E7D32', fontWeight: 'bold', marginTop: 8 },
    summaryAmountExpenseDark: { color: '#E57373' },

    listContainer: { paddingHorizontal: 15, paddingBottom: 90 },

    // Timeline UI
    timelineContainer: { flexDirection: 'row', marginBottom: 20, paddingHorizontal: 15 },
    timelineLeft: { width: 30, alignItems: 'center', justifyContent: 'center' },
    dot: { width: 14, height: 14, borderRadius: 7, backgroundColor: '#2E7D32', zIndex: 2 },
    line: { width: 2, backgroundColor: '#A5D6A7', position: 'absolute', zIndex: 1 },
    timelineCard: { flex: 1, backgroundColor: 'white', padding: 18, borderRadius: 10, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, marginLeft: 5 },
    cardDark: { backgroundColor: '#1E1E1E' },
    cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    dateText: { fontSize: 15, color: '#E65100', fontWeight: 'bold' }, // Darker orange for contrast
    dateTextDark: { color: '#FFB74D' },
    timeAgoText: { fontSize: 13, color: '#666', fontWeight: 'normal' },

    cardContainer: { backgroundColor: 'white', marginHorizontal: 15, borderRadius: 10, marginBottom: 15, elevation: 1 },
    cardContainerDark: { backgroundColor: '#1E1E1E' },
    cardRow: { flexDirection: 'row', padding: 18, alignItems: 'center' },
    cardHeader: { fontSize: 18, fontWeight: 'bold', color: '#222' },
    cardNotes: { fontSize: 16, color: '#555', marginTop: 6 },
    amountText: { fontSize: 22, fontWeight: 'bold', color: '#D32F2F', marginRight: 10 },
    emptyText: { textAlign: 'center', color: '#666', fontStyle: 'italic', marginTop: 25, fontSize: 16 },

    menuDotsBtn: { padding: 8, paddingHorizontal: 12 },
    menuDotsText: { fontSize: 24, color: '#666', fontWeight: 'bold' },

    contextMenu: { position: 'absolute', backgroundColor: 'white', borderRadius: 8, elevation: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, zIndex: 9999, minWidth: 120 },
    contextMenuDark: { backgroundColor: '#2C2C2C' },
    menuItem: { paddingVertical: 10, paddingHorizontal: 15 },
    menuDivider: { height: 1, backgroundColor: '#EEE' },
    menuItemTextEdit: { color: '#007BFF', fontSize: 16, fontWeight: '500' },
    menuItemTextDelete: { color: '#D32F2F', fontSize: 16, fontWeight: '500' },

    cropMenuOverlay: { flex: 1 },
    cropMenuContainer: { position: 'absolute', top: 50, right: 10, backgroundColor: 'white', borderRadius: 8, paddingVertical: 5, minWidth: 160, elevation: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84 },
    menuContainerDark: { backgroundColor: '#2C2C2C' },
    cropMenuItem: { paddingVertical: 12, paddingHorizontal: 16 },
    cropMenuItemText: { fontSize: 16, color: '#333' },

    input: { borderWidth: 1, borderColor: '#DDD', borderRadius: 8, padding: 12, marginBottom: 15, fontSize: 16 },
    inputDark: { borderColor: '#444', backgroundColor: '#333', color: '#FFF' },

    // FAB
    fabContainer: { position: 'absolute', bottom: 20, left: 15, right: 15, flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
    fabButton: { flex: 1, paddingVertical: 14, borderRadius: 25, justifyContent: 'center', alignItems: 'center', elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 4 },
    fabActivity: { backgroundColor: '#2E7D32' },
    fabExpense: { backgroundColor: '#D32F2F' },
    fabEarning: { backgroundColor: '#1976D2' },
    fabButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },

    // Modals
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: 'white', padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '80%' },
    modalContentDark: { backgroundColor: '#1E1E1E' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#EEE', paddingBottom: 10 },
    modalHeaderDark: { borderBottomColor: '#333' },
    modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    closeText: { fontSize: 20, color: '#888', fontWeight: 'bold', padding: 5 },

    // Global
    textDark: { color: '#E0E0E0' },
    textMutedDark: { color: '#AAAAAA' },
    label: { fontSize: 14, fontWeight: '600', color: '#555', marginBottom: 5 }
});

export default CropWorkspaceScreen;
