import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, Alert, Modal, KeyboardAvoidingView, ScrollView, Platform, Dimensions, TouchableWithoutFeedback, Keyboard } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

const { width: screenWidth } = Dimensions.get('window');
import { getDb } from '../database/db';

const activityTypes = ['Ploughing', 'Sowing', 'Irrigation', 'Weeding', 'Fertilizing', 'Spraying', 'Harvesting', 'Other'];
const expenseCategories = ['Seeds', 'Fertilizer', 'Pesticide', 'Labor', 'Fuel', 'Machinery Rent', 'Electricity', 'Other'];
const earningCategories = ['Crop Sale', 'Byproduct Sale', 'Subsidy', 'Other'];

const CropWorkspaceScreen = ({ route, navigation }) => {
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

    useLayoutEffect(() => {
        navigation.setOptions({
            headerTitle: () => (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{ fontSize: 24, marginRight: 8 }}>🌾</Text>
                    <View>
                        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#000' }}>
                            {crop.crop_name}
                        </Text>
                        <Text style={{ fontSize: 13, color: '#666' }}>
                            {crop.land_identifier} ({crop.total_area} {crop.area_unit})
                        </Text>
                    </View>
                </View>
            ),
            headerRight: () => (
                <TouchableOpacity onPress={() => setCropMenuVisible(true)} style={{ padding: 10 }}>
                    <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#555' }}>⋮</Text>
                </TouchableOpacity>
            ),
        });
    }, [navigation, crop]);

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
                <View style={styles.timelineCard}>
                    <View style={styles.cardHeaderRow}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.cardHeader}>{item.activity_type}</Text>
                            <Text style={styles.dateText}>{item.date}</Text>
                        </View>
                        <TouchableOpacity onPress={(e) => handleMenuPress(e, item, 'activity')} style={styles.menuDotsBtn}>
                            <Text style={styles.menuDotsText}>⋮</Text>
                        </TouchableOpacity>
                    </View>
                    {item.notes ? <Text style={styles.cardNotes}>{item.notes}</Text> : null}
                </View>
            </View>
        );
    };



    const renderExpense = ({ item }) => {
        return (
            <View style={styles.cardContainer}>
                <View style={styles.cardRow}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.cardHeader}>{item.category} • {item.date}</Text>
                        {item.remarks ? <Text style={styles.cardNotes}>{item.remarks}</Text> : null}
                    </View>
                    <Text style={styles.amountText}>₹{item.amount.toFixed(2)}</Text>
                    <TouchableOpacity onPress={(e) => handleMenuPress(e, item, 'expense')} style={styles.menuDotsBtn}>
                        <Text style={styles.menuDotsText}>⋮</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    const renderEarning = ({ item }) => {
        return (
            <View style={styles.cardContainer}>
                <View style={styles.cardRow}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.cardHeader}>{item.category} • {item.date}</Text>
                        {item.remarks ? <Text style={styles.cardNotes}>{item.remarks}</Text> : null}
                    </View>
                    <Text style={[styles.amountText, { color: '#2E7D32' }]}>₹{item.amount.toFixed(2)}</Text>
                    <TouchableOpacity onPress={(e) => handleMenuPress(e, item, 'earning')} style={styles.menuDotsBtn}>
                        <Text style={styles.menuDotsText}>⋮</Text>
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
        <View style={styles.container}>
            {/* Tabs */}

            <View style={styles.tabContainer}>
                <TouchableOpacity style={[styles.tabBtn, tab === 'Activities' && styles.tabBtnActive]} onPress={() => switchTab('Activities')}>
                    <Text style={[styles.tabText, tab === 'Activities' && styles.tabTextActive]}>Activity Logs</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.tabBtn, tab === 'Expenses' && styles.tabBtnActive]} onPress={() => switchTab('Expenses')}>
                    <Text style={[styles.tabText, tab === 'Expenses' && styles.tabTextActive]}>Expenses</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.tabBtn, tab === 'Earnings' && styles.tabBtnActive]} onPress={() => switchTab('Earnings')}>
                    <Text style={[styles.tabText, tab === 'Earnings' && styles.tabTextActive]}>Earnings</Text>
                </TouchableOpacity>
            </View>

            {/* Top Right Crop context Menu modal */}
            <Modal visible={cropMenuVisible} transparent={true} animationType="fade" onRequestClose={() => setCropMenuVisible(false)}>
                <TouchableWithoutFeedback onPress={() => setCropMenuVisible(false)}>
                    <View style={styles.cropMenuOverlay}>
                        <View style={styles.cropMenuContainer}>
                            <TouchableOpacity style={styles.cropMenuItem} onPress={handleEditCrop}>
                                <Text style={styles.cropMenuItemText}>Edit crop details</Text>
                            </TouchableOpacity>
                            {crop.status !== 'Inactive' ? (
                                <TouchableOpacity style={styles.cropMenuItem} onPress={handleDeactivateCrop}>
                                    <Text style={styles.cropMenuItemText}>Deactivate crop</Text>
                                </TouchableOpacity>
                            ) : (
                                <TouchableOpacity style={styles.cropMenuItem} onPress={handleActivateCrop}>
                                    <Text style={styles.cropMenuItemText}>Activate crop</Text>
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity style={styles.cropMenuItem} onPress={handleDeleteCrop}>
                                <Text style={[styles.cropMenuItemText, { color: '#D32F2F' }]}>Delete crop</Text>
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
                        ListEmptyComponent={<Text style={styles.emptyText}>No activities logged yet.</Text>}
                    />
                </View>

                {/* Expenses Page */}
                <View style={{ width: screenWidth }}>
                    <FlatList
                        data={expenses}
                        keyExtractor={item => item.id.toString()}
                        ListHeaderComponent={() => (
                            <View style={styles.summaryCard}>
                                <Text style={styles.summaryLabel}>Total Investment in this Crop</Text>
                                <Text style={styles.summaryAmount}>₹{totalExpense.toFixed(2)}</Text>
                            </View>
                        )}
                        renderItem={renderExpense}
                        contentContainerStyle={styles.listContainer}
                        ListEmptyComponent={<Text style={styles.emptyText}>No expenses logged yet.</Text>}
                    />
                </View>

                {/* Earnings Page */}
                <View style={{ width: screenWidth }}>
                    <FlatList
                        data={earnings}
                        keyExtractor={item => item.id.toString()}
                        ListHeaderComponent={() => (
                            <View style={[styles.summaryCard, { backgroundColor: '#E3F2FD', borderColor: '#BBDEFB' }]}>
                                <Text style={[styles.summaryLabel, { color: '#1565C0' }]}>Total Earnings from this Crop</Text>
                                <Text style={[styles.summaryAmount, { color: '#1976D2' }]}>₹{totalEarning.toFixed(2)}</Text>
                            </View>
                        )}
                        renderItem={renderEarning}
                        contentContainerStyle={styles.listContainer}
                        ListEmptyComponent={<Text style={styles.emptyText}>No earnings logged yet.</Text>}
                    />
                </View>
            </ScrollView>

            {/* Floating Action Buttons */}
            <View style={styles.fabContainer}>
                {tab === 'Activities' && (
                    <TouchableOpacity style={[styles.fabButton, styles.fabActivity]} onPress={handleAddActivityPress}>
                        <Text style={styles.fabButtonText}>+ Log Activity</Text>
                    </TouchableOpacity>
                )}
                {tab === 'Expenses' && (
                    <TouchableOpacity style={[styles.fabButton, styles.fabExpense]} onPress={handleAddExpensePress}>
                        <Text style={styles.fabButtonText}>+ Add Expense</Text>
                    </TouchableOpacity>
                )}
                {tab === 'Earnings' && (
                    <TouchableOpacity style={[styles.fabButton, styles.fabEarning]} onPress={handleAddEarningPress}>
                        <Text style={styles.fabButtonText}>+ Add Earning</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Activity Modal */}
            <Modal visible={isActivityModalVisible} animationType="slide" transparent={true} onRequestClose={() => { Keyboard.dismiss(); setActivityModalVisible(false); }}>
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === "ios" ? "padding" : "height"}>
                        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                            <View style={styles.modalContent}>
                                <View style={styles.modalHeader}>
                                    <Text style={styles.modalTitle}>{editActivityId ? 'Edit Activity' : 'Log New Activity'}</Text>
                                    <TouchableOpacity onPress={() => setActivityModalVisible(false)}>
                                        <Text style={styles.closeText}>✕</Text>
                                    </TouchableOpacity>
                                </View>
                                <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                                    <View style={styles.pillContainer}>
                                        {activityTypes.map(type => (
                                            <TouchableOpacity key={type} onPress={() => setActType(type)} style={[styles.pill, actType === type && styles.pillActive]}>
                                                <Text style={[styles.pillText, actType === type && styles.pillTextActive]}>{type}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                    {actType === 'Other' && (
                                        <TextInput style={styles.input} placeholder="Activity Name" value={customActType} onChangeText={setCustomActType} />
                                    )}
                                    <TextInput style={styles.input} placeholder="Observations / Notes" value={actNotes} onChangeText={setActNotes} onSubmitEditing={Keyboard.dismiss} />

                                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#555', marginBottom: 5 }}>Date</Text>
                                    <TouchableOpacity onPress={() => setShowActDate(true)}>
                                        <View style={styles.input}>
                                            <Text style={{ fontSize: 16 }}>{actDate}</Text>
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

                                    <TouchableOpacity style={styles.submitBtn} onPress={() => { Keyboard.dismiss(); addActivity(); }}><Text style={styles.submitBtnText}>Add Log</Text></TouchableOpacity>
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
                            <View style={styles.modalContent}>
                                <View style={styles.modalHeader}>
                                    <Text style={styles.modalTitle}>{editExpenseId ? 'Edit Expense' : 'Add Expense'}</Text>
                                    <TouchableOpacity onPress={() => setExpenseModalVisible(false)}>
                                        <Text style={styles.closeText}>✕</Text>
                                    </TouchableOpacity>
                                </View>
                                <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                                    <TextInput style={styles.input} placeholder="Amount (₹)" keyboardType="numeric" value={expAmount} onChangeText={setExpAmount} onSubmitEditing={Keyboard.dismiss} />
                                    <View style={styles.pillContainer}>
                                        {expenseCategories.map(cat => (
                                            <TouchableOpacity key={cat} onPress={() => setExpCategory(cat)} style={[styles.pill, expCategory === cat && styles.pillActive]}>
                                                <Text style={[styles.pillText, expCategory === cat && styles.pillTextActive]}>{cat}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                    {expCategory === 'Other' && (
                                        <TextInput style={styles.input} placeholder="Expense Name" value={customExpCategory} onChangeText={setCustomExpCategory} />
                                    )}
                                    <TextInput style={styles.input} placeholder="Remarks / Details" value={expRemarks} onChangeText={setExpRemarks} onSubmitEditing={Keyboard.dismiss} />

                                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#555', marginBottom: 5 }}>Date</Text>
                                    <TouchableOpacity onPress={() => setShowExpDate(true)}>
                                        <View style={styles.input}>
                                            <Text style={{ fontSize: 16 }}>{expDate}</Text>
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

                                    <TouchableOpacity style={styles.submitBtn} onPress={() => { Keyboard.dismiss(); addExpense(); }}><Text style={styles.submitBtnText}>Add Expense</Text></TouchableOpacity>
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
                            <View style={styles.modalContent}>
                                <View style={styles.modalHeader}>
                                    <Text style={styles.modalTitle}>{editEarningId ? 'Edit Earning' : 'Add Earning'}</Text>
                                    <TouchableOpacity onPress={() => setEarningModalVisible(false)}>
                                        <Text style={styles.closeText}>✕</Text>
                                    </TouchableOpacity>
                                </View>
                                <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                                    <TextInput style={styles.input} placeholder="Amount (₹)" keyboardType="numeric" value={earnAmount} onChangeText={setEarnAmount} onSubmitEditing={Keyboard.dismiss} />
                                    <View style={styles.pillContainer}>
                                        {earningCategories.map(cat => (
                                            <TouchableOpacity key={cat} onPress={() => setEarnCategory(cat)} style={[styles.pill, earnCategory === cat && styles.pillActive]}>
                                                <Text style={[styles.pillText, earnCategory === cat && styles.pillTextActive]}>{cat}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                    {earnCategory === 'Other' && (
                                        <TextInput style={styles.input} placeholder="Earning Name" value={customEarnCategory} onChangeText={setCustomEarnCategory} />
                                    )}
                                    <TextInput style={styles.input} placeholder="Remarks / Details" value={earnRemarks} onChangeText={setEarnRemarks} onSubmitEditing={Keyboard.dismiss} />

                                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#555', marginBottom: 5 }}>Date</Text>
                                    <TouchableOpacity onPress={() => setShowEarnDate(true)}>
                                        <View style={styles.input}>
                                            <Text style={{ fontSize: 16 }}>{earnDate}</Text>
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

                                    <TouchableOpacity style={[styles.submitBtn, { backgroundColor: '#1976D2' }]} onPress={() => { Keyboard.dismiss(); addEarning(); }}><Text style={styles.submitBtnText}>Add Earning</Text></TouchableOpacity>
                                </ScrollView>
                            </View>
                        </TouchableWithoutFeedback>
                    </KeyboardAvoidingView>
                </TouchableWithoutFeedback>
            </Modal>

            {/* Global Context Menu Modal positioned exactly where tapped */}
            <Modal visible={menuVisibleId !== null} transparent={true} animationType="none" onRequestClose={closeMenu}>
                <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPressOut={closeMenu}>
                    <View style={[styles.contextMenu, { top: menuPos.top, right: menuPos.right }]}>
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
                            <Text style={styles.menuItemTextEdit}>Edit</Text>
                        </TouchableOpacity>
                        <View style={styles.menuDivider} />
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

    tabContainer: { flexDirection: 'row', margin: 15, backgroundColor: 'white', borderRadius: 10, padding: 5, elevation: 2 },
    tabBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 8 },
    tabBtnActive: { backgroundColor: '#E8F5E9' },
    tabText: { fontSize: 16, color: '#666', fontWeight: 'bold' },
    tabTextActive: { color: '#2E7D32' },



    pillContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
    pill: { backgroundColor: '#F0F0F0', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },
    pillActive: { backgroundColor: '#FF8F00' },
    pillText: { fontSize: 16, color: '#555' },
    pillTextActive: { color: 'white', fontWeight: 'bold' },

    submitBtn: { backgroundColor: '#2E7D32', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 10 },
    submitBtnText: { color: 'white', fontWeight: 'bold', fontSize: 18 },

    summaryCard: { backgroundColor: '#E8F5E9', padding: 20, marginHorizontal: 15, marginBottom: 15, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: '#C8E6C9' },
    summaryLabel: { fontSize: 16, color: '#1B5E20', fontWeight: '600' },
    summaryAmount: { fontSize: 32, color: '#2E7D32', fontWeight: 'bold', marginTop: 8 },

    listContainer: { paddingHorizontal: 15, paddingBottom: 90 },

    // Timeline UI
    timelineContainer: { flexDirection: 'row', marginBottom: 20, paddingHorizontal: 15 },
    timelineLeft: { width: 30, alignItems: 'center', justifyContent: 'center' },
    dot: { width: 14, height: 14, borderRadius: 7, backgroundColor: '#2E7D32', zIndex: 2 },
    line: { width: 2, backgroundColor: '#A5D6A7', position: 'absolute', zIndex: 1 },
    timelineCard: { flex: 1, backgroundColor: 'white', padding: 18, borderRadius: 10, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, marginLeft: 5 },
    cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    dateText: { fontSize: 15, color: '#E65100', fontWeight: 'bold' }, // Darker orange for contrast

    cardContainer: { backgroundColor: 'white', marginHorizontal: 15, borderRadius: 10, marginBottom: 15, elevation: 1 },
    cardRow: { flexDirection: 'row', padding: 18, alignItems: 'center' },
    cardHeader: { fontSize: 18, fontWeight: 'bold', color: '#222' },
    cardNotes: { fontSize: 16, color: '#555', marginTop: 6 },
    amountText: { fontSize: 22, fontWeight: 'bold', color: '#D32F2F', marginRight: 10 },
    emptyText: { textAlign: 'center', color: '#666', fontStyle: 'italic', marginTop: 25, fontSize: 16 },

    menuDotsBtn: { padding: 8, paddingHorizontal: 12 },
    menuDotsText: { fontSize: 24, color: '#666', fontWeight: 'bold' },

    contextMenu: { position: 'absolute', backgroundColor: 'white', borderRadius: 8, elevation: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, zIndex: 9999, minWidth: 120 },
    menuItem: { paddingVertical: 10, paddingHorizontal: 15 },
    menuDivider: { height: 1, backgroundColor: '#EEE' },
    menuItemTextEdit: { color: '#007BFF', fontSize: 16, fontWeight: '500' },
    menuItemTextDelete: { color: '#D32F2F', fontSize: 16, fontWeight: '500' },

    cropMenuOverlay: { flex: 1 },
    cropMenuContainer: { position: 'absolute', top: 50, right: 10, backgroundColor: 'white', borderRadius: 8, paddingVertical: 5, minWidth: 160, elevation: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84 },
    cropMenuItem: { paddingVertical: 12, paddingHorizontal: 16 },
    cropMenuItemText: { fontSize: 16, color: '#333' },

    input: { borderWidth: 1, borderColor: '#DDD', borderRadius: 8, padding: 12, marginBottom: 15, fontSize: 16 },

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
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#EEE', paddingBottom: 10 },
    modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    closeText: { fontSize: 20, color: '#888', fontWeight: 'bold', padding: 5 }
});

export default CropWorkspaceScreen;
