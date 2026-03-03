import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Modal, TouchableWithoutFeedback, Alert, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useIsFocused } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import useStore from '../store/useStore';
import { getDb } from '../database/db';

const HomeScreen = ({ navigation }) => {
    const { t } = useTranslation();
    const { farmProfile, setFarmProfile } = useStore();
    const [crops, setCrops] = useState([]);
    const [loading, setLoading] = useState(true);
    const isFocused = useIsFocused(); // Refresh when tab is focused

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

    const isDark = useColorScheme() === 'dark';

    const cropColors = ['#FF9800', '#4CAF50', '#2196F3', '#f44336', '#9C27B0', '#00BCD4', '#FFEB3B', '#795548'];

    const renderCropCard = ({ item, index }) => {
        const borderLeftColor = cropColors[index % cropColors.length];

        return (
            <TouchableOpacity
                style={[styles.cropCard, isDark && styles.cropCardDark, { borderLeftColor }]}
                onPress={() => navigation.navigate('CropWorkspace', { crop: item })}
            >
                <View style={styles.cropHeader}>
                    <Text style={[styles.cropName, isDark && styles.textDark]}>🌾 {item.crop_name}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View style={[styles.statusBadge, isDark && styles.statusBadgeDark, item.status === 'Inactive' && (isDark ? styles.statusBadgeInactiveDark : styles.statusBadgeInactive)]}>
                            <Text style={[styles.statusText, isDark && styles.statusTextDark, item.status === 'Inactive' && (isDark ? styles.statusTextInactiveDark : styles.statusTextInactive)]}>{item.status || 'Active'}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.cropInfoRow}>
                    <Text style={[styles.cropLand, isDark && styles.textMutedDark]}>📍 {item.land_identifier}</Text>
                    <Text style={[styles.cropArea, isDark && styles.textMutedDark]}>📏 {item.total_area} {item.area_unit}</Text>
                </View>

                {/* Financial Summary */}
                <View style={[styles.financialRow, isDark && styles.financialRowDark]}>
                    <View style={styles.financialCol}>
                        <Text style={[styles.financialLabel, isDark && styles.textMutedDark]}>{t('expensesOnly')}</Text>
                        <Text style={[styles.financialValue, { color: isDark ? '#EF5350' : '#D32F2F' }]}>₹{item.totalExpense ? item.totalExpense.toFixed(2) : '0.00'}</Text>
                    </View>
                    <View style={[styles.financialDivider, isDark && styles.financialDividerDark]} />
                    <View style={styles.financialCol}>
                        <Text style={[styles.financialLabel, isDark && styles.textMutedDark]}>{t('earnings')}</Text>
                        <Text style={[styles.financialValue, { color: isDark ? '#81C784' : '#2E7D32' }]}>₹{item.totalEarning ? item.totalEarning.toFixed(2) : '0.00'}</Text>
                    </View>
                </View>

                {/* Activity Summary */}
                {item.lastActivity ? (
                    <View style={[styles.activityRow, isDark && styles.activityRowDark]}>
                        <Text style={[styles.activityLabel, isDark && styles.textMutedDark]}>{t('latestActivity')}</Text>
                        <Text style={[styles.activityText, isDark && styles.textDark]} numberOfLines={1}>{item.lastActivity} ({item.lastActivityDate})</Text>
                    </View>
                ) : null}
            </TouchableOpacity>
        );
    };

    const ListHeader = () => (
        <>
            {farmProfile ? (
                <View style={[styles.profileCard, isDark && styles.profileCardDark]}>
                    <Text style={[styles.greeting, isDark && styles.textDark]}>{t('hello')} {farmProfile.name} 👋</Text>
                    <Text style={[styles.detail, isDark && styles.textMutedDark]}>📍 {farmProfile.village}  •  🌾 {farmProfile.acreage} {t('acres')}</Text>
                </View>
            ) : (
                <View style={styles.emptyState}>
                    <Text style={[styles.emptyText, isDark && styles.textMutedDark]}>{t('noProfileFound')}</Text>
                    <TouchableOpacity style={[styles.button, isDark && styles.buttonDark]} onPress={() => navigation.navigate('Profile')}>
                        <Text style={styles.buttonText}>{t('createProfile')}</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Active Crops List */}
            <Text style={[styles.sectionTitle, isDark && styles.textDark]}>{t('activeCropInstances')}</Text>
        </>
    );

    return (
        <SafeAreaView style={[styles.safeArea, isDark && styles.safeAreaDark]}>
            <View style={[styles.header, isDark && styles.headerDark]}>
                <Text style={styles.headerTitle}>{t('dashboard')}</Text>
            </View>
            <View style={[styles.container, isDark && styles.containerDark]}>
                {loading ? (
                    <>
                        <ListHeader />
                        <ActivityIndicator size="small" color={isDark ? '#81C784' : '#2E7D32'} style={{ marginTop: 20 }} />
                    </>
                ) : (
                    <FlatList
                        ListHeaderComponent={ListHeader}
                        data={crops}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={renderCropCard}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 80 }}
                        ListEmptyComponent={() => (
                            <Text style={[styles.emptyCropsText, isDark && styles.textMutedDark]}>{t('noCropsManaged')}</Text>
                        )}
                    />
                )}

                {/* Floating Action Button */}
                <TouchableOpacity
                    style={[styles.fab, isDark && styles.fabDark]}
                    onPress={() => navigation.navigate('CreateCrop')}
                >
                    <Text style={styles.fabIcon}>+</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#1B5E20' },
    safeAreaDark: { backgroundColor: '#121212' },
    header: { paddingHorizontal: 20, paddingVertical: 15, backgroundColor: '#1B5E20', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 2 },
    headerDark: { backgroundColor: '#121212' },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: 'white' },
    container: { flex: 1, padding: 20, backgroundColor: '#F5F5F5' },
    containerDark: { backgroundColor: '#1E1E1E' },
    profileCard: { backgroundColor: 'white', padding: 15, borderRadius: 12, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, marginBottom: 20 },
    profileCardDark: { backgroundColor: '#2C2C2C' },
    greeting: { fontSize: 20, fontWeight: 'bold', marginBottom: 5, color: '#333' },
    detail: { fontSize: 14, color: '#666' },
    emptyState: { alignItems: 'center', marginVertical: 20 },
    emptyText: { fontSize: 16, color: '#777', marginBottom: 15 },
    button: { backgroundColor: '#2E7D32', padding: 10, borderRadius: 8 },
    buttonDark: { backgroundColor: '#388E3C' },
    buttonText: { color: 'white', fontWeight: 'bold' },

    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#444', marginBottom: 10 },
    emptyCropsText: { color: '#888', fontStyle: 'italic', marginTop: 10 },

    cropCard: { backgroundColor: '#FFF', padding: 16, borderRadius: 12, marginBottom: 16, borderLeftWidth: 5, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
    cropCardDark: { backgroundColor: '#2C2C2C' },
    cropHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    cropName: { fontSize: 20, fontWeight: 'bold', color: '#222' },
    statusBadge: { backgroundColor: '#E8F5E9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    statusBadgeDark: { backgroundColor: '#1B5E20' },
    statusText: { fontSize: 12, color: '#2E7D32', fontWeight: 'bold' },
    statusTextDark: { color: '#81C784' },
    statusBadgeInactive: { backgroundColor: '#F0F0F0' },
    statusBadgeInactiveDark: { backgroundColor: '#444' },
    statusTextInactive: { color: '#777' },
    statusTextInactiveDark: { color: '#AAA' },

    cropInfoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 15 },
    cropLand: { fontSize: 14, color: '#555', fontWeight: '500' },
    cropArea: { fontSize: 14, color: '#555', fontWeight: '500' },

    financialRow: { flexDirection: 'row', backgroundColor: '#F9FAFB', borderRadius: 8, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#F0F0F0' },
    financialRowDark: { backgroundColor: '#1E1E1E', borderColor: '#333' },
    financialCol: { flex: 1, alignItems: 'center' },
    financialDivider: { width: 1, backgroundColor: '#E0E0E0', marginHorizontal: 10 },
    financialDividerDark: { backgroundColor: '#444' },
    financialLabel: { fontSize: 12, color: '#666', textTransform: 'uppercase', marginBottom: 4, fontWeight: '600' },
    financialValue: { fontSize: 18, fontWeight: 'bold' },

    activityRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', padding: 10, borderRadius: 6 },
    activityRowDark: { backgroundColor: '#1E1E1E' },
    activityLabel: { fontSize: 13, color: '#555', fontWeight: '600', marginRight: 6 },
    activityText: { fontSize: 13, color: '#333', flex: 1, fontWeight: '500' },
    activityTextNone: { fontSize: 13, color: '#999', fontStyle: 'italic', flex: 1 },

    fab: { position: 'absolute', bottom: 30, right: 30, backgroundColor: '#2E7D32', width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4 },
    fabDark: { backgroundColor: '#388E3C' },
    fabIcon: { fontSize: 32, color: 'white', fontWeight: 'bold', marginTop: -2 },

    // Dark Mode Text Utility Styles
    textDark: { color: '#E0E0E0' },
    textMutedDark: { color: '#AAAAAA' }
});

export default HomeScreen;
