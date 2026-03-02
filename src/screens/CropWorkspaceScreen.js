import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, Alert, Modal, KeyboardAvoidingView, ScrollView, Platform, Dimensions } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');
import { getDb } from '../database/db';

const activityTypes = ['Ploughing', 'Sowing', 'Irrigation', 'Weeding', 'Fertilizing', 'Spraying', 'Harvesting'];
const expenseCategories = ['Seeds', 'Fertilizer', 'Pesticide', 'Labor', 'Fuel', 'Machinery Rent', 'Electricity'];

const CropWorkspaceScreen = ({ route }) => {
    const { crop } = route.params; // Passed from HomeScreen
    const [tab, setTab] = useState('Activities'); // 'Activities' | 'Expenses'
    const scrollViewRef = useRef(null);
    const [clickOutsideCatcher, setClickOutsideCatcher] = useState(false);

    // Activities State
    const [activities, setActivities] = useState([]);
    const [actType, setActType] = useState('Sowing');
    const [actNotes, setActNotes] = useState('');
    const [isActivityModalVisible, setActivityModalVisible] = useState(false);
    const [editActivityId, setEditActivityId] = useState(null);

    // Expenses State
    const [expenses, setExpenses] = useState([]);
    const [expCategory, setExpCategory] = useState('Seeds');
    const [expAmount, setExpAmount] = useState('');
    const [expRemarks, setExpRemarks] = useState('');
    const [totalExpense, setTotalExpense] = useState(0);
    const [isExpenseModalVisible, setExpenseModalVisible] = useState(false);
    const [editExpenseId, setEditExpenseId] = useState(null);

    // Context Menu State
    const [menuVisibleId, setMenuVisibleId] = useState(null);
    const [menuType, setMenuType] = useState(null); // 'activity' | 'expense'
    const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });

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
        } catch (error) {
            console.error('Error loading workspace data:', error);
        }
    };

    const addActivity = async () => {
        const date = new Date().toISOString().split('T')[0];
        try {
            const db = await getDb();
            if (editActivityId) {
                await db.runAsync(
                    'UPDATE activities SET activity_type = ?, notes = ? WHERE id = ?',
                    [actType, actNotes, editActivityId]
                );
            } else {
                await db.runAsync(
                    'INSERT INTO activities (crop_id, activity_type, date, notes) VALUES (?, ?, ?, ?)',
                    [crop.id, actType, date, actNotes]
                );
            }
            setActNotes('');
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
        setActType(item.activity_type);
        setActNotes(item.notes || '');
        setActivityModalVisible(true);
    };

    const handleAddActivityPress = () => {
        setEditActivityId(null);
        setActType('Sowing');
        setActNotes('');
        setActivityModalVisible(true);
    };

    const addExpense = async () => {
        if (!expAmount) {
            Alert.alert('Error', 'Amount is required');
            return;
        }
        const date = new Date().toISOString().split('T')[0];
        try {
            const db = await getDb();
            if (editExpenseId) {
                await db.runAsync(
                    'UPDATE expenses SET category = ?, amount = ?, remarks = ? WHERE id = ?',
                    [expCategory, parseFloat(expAmount), expRemarks, editExpenseId]
                );
            } else {
                await db.runAsync(
                    'INSERT INTO expenses (crop_id, category, amount, payment_mode, date, remarks) VALUES (?, ?, ?, ?, ?, ?)',
                    [crop.id, expCategory, parseFloat(expAmount), 'Cash', date, expRemarks]
                );
            }
            setExpAmount('');
            setExpRemarks('');
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
        setExpCategory(item.category);
        setExpAmount(item.amount.toString());
        setExpRemarks(item.remarks || '');
        setExpenseModalVisible(true);
    };

    const handleAddExpensePress = () => {
        setEditExpenseId(null);
        setExpCategory('Seeds');
        setExpAmount('');
        setExpRemarks('');
        setExpenseModalVisible(true);
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

    const switchTab = (newTab) => {
        setTab(newTab);
        if (scrollViewRef.current) {
            scrollViewRef.current.scrollTo({
                x: newTab === 'Activities' ? 0 : screenWidth,
                y: 0,
                animated: true
            });
        }
    };

    const handleMomentumScrollEnd = (e) => {
        const page = Math.round(e.nativeEvent.contentOffset.x / screenWidth);
        setTab(page === 0 ? 'Activities' : 'Expenses');
    };

    return (
        <View style={styles.container}>
            {/* Fixed Header & Tabs */}
            <View style={styles.headerPanel}>
                <Text style={styles.cropTitle}>🌾 {crop.crop_name}</Text>
                <Text style={styles.cropSubtitle}>{crop.land_identifier} ({crop.total_area} {crop.area_unit})</Text>
            </View>

            <View style={styles.tabContainer}>
                <TouchableOpacity style={[styles.tabBtn, tab === 'Activities' && styles.tabBtnActive]} onPress={() => switchTab('Activities')}>
                    <Text style={[styles.tabText, tab === 'Activities' && styles.tabTextActive]}>Activity Logs</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.tabBtn, tab === 'Expenses' && styles.tabBtnActive]} onPress={() => switchTab('Expenses')}>
                    <Text style={[styles.tabText, tab === 'Expenses' && styles.tabTextActive]}>Expenses</Text>
                </TouchableOpacity>
            </View>

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
            </ScrollView>

            {/* Floating Action Buttons */}
            <View style={styles.fabContainer}>
                <TouchableOpacity style={[styles.fabButton, styles.fabActivity]} onPress={handleAddActivityPress}>
                    <Text style={styles.fabButtonText}>+ Log Activity</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.fabButton, styles.fabExpense]} onPress={handleAddExpensePress}>
                    <Text style={styles.fabButtonText}>+ Add Expense</Text>
                </TouchableOpacity>
            </View>

            {/* Activity Modal */}
            <Modal visible={isActivityModalVisible} animationType="slide" transparent={true}>
                <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === "ios" ? "padding" : "height"}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{editActivityId ? 'Edit Activity' : 'Log New Activity'}</Text>
                            <TouchableOpacity onPress={() => setActivityModalVisible(false)}>
                                <Text style={styles.closeText}>✕</Text>
                            </TouchableOpacity>
                        </View>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            <View style={styles.pillContainer}>
                                {activityTypes.map(type => (
                                    <TouchableOpacity key={type} onPress={() => setActType(type)} style={[styles.pill, actType === type && styles.pillActive]}>
                                        <Text style={[styles.pillText, actType === type && styles.pillTextActive]}>{type}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                            <TextInput style={styles.input} placeholder="Observations / Notes" value={actNotes} onChangeText={setActNotes} />
                            <TouchableOpacity style={styles.submitBtn} onPress={addActivity}><Text style={styles.submitBtnText}>Add Log</Text></TouchableOpacity>
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            {/* Expense Modal */}
            <Modal visible={isExpenseModalVisible} animationType="slide" transparent={true}>
                <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === "ios" ? "padding" : "height"}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{editExpenseId ? 'Edit Expense' : 'Add Expense'}</Text>
                            <TouchableOpacity onPress={() => setExpenseModalVisible(false)}>
                                <Text style={styles.closeText}>✕</Text>
                            </TouchableOpacity>
                        </View>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            <TextInput style={styles.input} placeholder="Amount (₹)" keyboardType="numeric" value={expAmount} onChangeText={setExpAmount} />
                            <View style={styles.pillContainer}>
                                {expenseCategories.map(cat => (
                                    <TouchableOpacity key={cat} onPress={() => setExpCategory(cat)} style={[styles.pill, expCategory === cat && styles.pillActive]}>
                                        <Text style={[styles.pillText, expCategory === cat && styles.pillTextActive]}>{cat}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                            <TextInput style={styles.input} placeholder="Remarks / Details" value={expRemarks} onChangeText={setExpRemarks} />
                            <TouchableOpacity style={styles.submitBtn} onPress={addExpense}><Text style={styles.submitBtnText}>Add Expense</Text></TouchableOpacity>
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
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
                            } else {
                                const item = expenses.find(e => e.id === itemId);
                                if (item) openEditExpense(item);
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
                            else deleteExpense(itemId);
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
    headerPanel: { backgroundColor: '#1B5E20', padding: 20, borderBottomLeftRadius: 15, borderBottomRightRadius: 15, elevation: 5 },
    cropTitle: { fontSize: 24, fontWeight: 'bold', color: 'white' },
    cropSubtitle: { fontSize: 16, color: '#A5D6A7', marginTop: 5 },

    tabContainer: { flexDirection: 'row', margin: 15, backgroundColor: 'white', borderRadius: 10, padding: 5, elevation: 2 },
    tabBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 8 },
    tabBtnActive: { backgroundColor: '#E8F5E9' },
    tabText: { fontSize: 16, color: '#666', fontWeight: 'bold' },
    tabTextActive: { color: '#2E7D32' },



    pillContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
    pill: { backgroundColor: '#F0F0F0', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
    pillActive: { backgroundColor: '#FF8F00' },
    pillText: { fontSize: 13, color: '#555' },
    pillTextActive: { color: 'white', fontWeight: 'bold' },

    submitBtn: { backgroundColor: '#2E7D32', padding: 14, borderRadius: 8, alignItems: 'center' },
    submitBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },

    summaryCard: { backgroundColor: '#E8F5E9', padding: 15, marginHorizontal: 15, marginBottom: 15, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: '#C8E6C9' },
    summaryLabel: { fontSize: 14, color: '#1B5E20', fontWeight: '600' },
    summaryAmount: { fontSize: 28, color: '#2E7D32', fontWeight: 'bold', marginTop: 5 },

    listContainer: { paddingHorizontal: 15, paddingBottom: 90 },

    // Timeline UI
    timelineContainer: { flexDirection: 'row', marginBottom: 15, paddingHorizontal: 15 },
    timelineLeft: { width: 30, alignItems: 'center', justifyContent: 'center' },
    dot: { width: 14, height: 14, borderRadius: 7, backgroundColor: '#2E7D32', zIndex: 2 },
    line: { width: 2, backgroundColor: '#A5D6A7', position: 'absolute', zIndex: 1 },
    timelineCard: { flex: 1, backgroundColor: 'white', padding: 15, borderRadius: 10, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, marginLeft: 5 },
    cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    dateText: { fontSize: 13, color: '#FF8F00', fontWeight: 'bold' },

    cardContainer: { backgroundColor: 'white', marginHorizontal: 15, borderRadius: 10, marginBottom: 10, elevation: 1 },
    cardRow: { flexDirection: 'row', padding: 15, alignItems: 'center' },
    cardHeader: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    cardNotes: { fontSize: 14, color: '#666', marginTop: 4 },
    amountText: { fontSize: 18, fontWeight: 'bold', color: '#D32F2F', marginRight: 10 },
    emptyText: { textAlign: 'center', color: '#888', fontStyle: 'italic', marginTop: 20 },

    menuDotsBtn: { padding: 5, paddingHorizontal: 10 },
    menuDotsText: { fontSize: 22, color: '#888', fontWeight: 'bold' },

    contextMenu: { position: 'absolute', backgroundColor: 'white', borderRadius: 8, elevation: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, zIndex: 9999, minWidth: 120 },
    menuItem: { paddingVertical: 10, paddingHorizontal: 15 },
    menuDivider: { height: 1, backgroundColor: '#EEE' },
    menuItemTextEdit: { color: '#007BFF', fontSize: 16, fontWeight: '500' },
    menuItemTextDelete: { color: '#D32F2F', fontSize: 16, fontWeight: '500' },

    input: { borderWidth: 1, borderColor: '#DDD', borderRadius: 8, padding: 12, marginBottom: 15, fontSize: 16 },

    // FAB
    fabContainer: { position: 'absolute', bottom: 20, left: 15, right: 15, flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
    fabButton: { flex: 1, paddingVertical: 14, borderRadius: 25, justifyContent: 'center', alignItems: 'center', elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 4 },
    fabActivity: { backgroundColor: '#2E7D32' },
    fabExpense: { backgroundColor: '#D32F2F' },
    fabButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },

    // Modals
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: 'white', padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '80%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#EEE', paddingBottom: 10 },
    modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    closeText: { fontSize: 20, color: '#888', fontWeight: 'bold', padding: 5 }
});

export default CropWorkspaceScreen;
