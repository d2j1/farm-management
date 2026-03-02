import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
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

            // Load active crops
            const cropRows = await db.getAllAsync('SELECT * FROM crops ORDER BY id DESC');
            setCrops(cropRows);
        } catch (error) {
            console.error('Error loading home data:', error);
        } finally {
            setLoading(false);
        }
    };

    const renderCropCard = ({ item }) => (
        <TouchableOpacity
            style={styles.cropCard}
            onPress={() => navigation.navigate('CropWorkspace', { crop: item })}
        >
            <View style={styles.cropHeader}>
                <Text style={styles.cropName}>🌾 {item.crop_name}</Text>
                <Text style={styles.cropDate}>Sown: {item.sowing_date}</Text>
            </View>
            <Text style={styles.cropLand}>{item.land_identifier}</Text>
            <Text style={styles.cropArea}>{item.total_area} {item.area_unit}</Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>{t('dashboard')}</Text>
            </View>
            <View style={styles.container}>

                {farmProfile ? (
                    <View style={styles.profileCard}>
                        <Text style={styles.greeting}>Hello, {farmProfile.name} 👋</Text>
                        <Text style={styles.detail}>📍 {farmProfile.village}  •  🌾 {farmProfile.acreage} Acres</Text>
                    </View>
                ) : (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>No profile found.</Text>
                        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Profile')}>
                            <Text style={styles.buttonText}>Create Profile</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Active Crops List */}
                <Text style={styles.sectionTitle}>Active Crop Instances</Text>
                {loading ? (
                    <ActivityIndicator size="small" color="#2E7D32" />
                ) : crops.length > 0 ? (
                    <FlatList
                        data={crops}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={renderCropCard}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 80 }}
                    />
                ) : (
                    <Text style={styles.emptyCropsText}>No crops managed yet. Tap the + to start a new farming cycle.</Text>
                )}

                {/* Floating Action Button */}
                <TouchableOpacity
                    style={styles.fab}
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
    header: { paddingHorizontal: 20, paddingVertical: 15, backgroundColor: '#1B5E20', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 2 },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: 'white' },
    container: { flex: 1, padding: 20, backgroundColor: '#F5F5F5' },
    profileCard: { backgroundColor: 'white', padding: 15, borderRadius: 12, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, marginBottom: 20 },
    greeting: { fontSize: 20, fontWeight: 'bold', marginBottom: 5, color: '#333' },
    detail: { fontSize: 14, color: '#666' },
    emptyState: { alignItems: 'center', marginVertical: 20 },
    emptyText: { fontSize: 16, color: '#777', marginBottom: 15 },
    button: { backgroundColor: '#2E7D32', padding: 10, borderRadius: 8 },
    buttonText: { color: 'white', fontWeight: 'bold' },

    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#444', marginBottom: 10 },
    emptyCropsText: { color: '#888', fontStyle: 'italic', marginTop: 10 },

    cropCard: { backgroundColor: '#FFF', padding: 15, borderRadius: 10, marginBottom: 12, borderLeftWidth: 4, borderLeftColor: '#FF8F00', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
    cropHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
    cropName: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    cropDate: { fontSize: 12, color: '#888' },
    cropLand: { fontSize: 15, color: '#555', marginBottom: 3 },
    cropArea: { fontSize: 14, color: '#777', fontWeight: '500' },

    fab: { position: 'absolute', bottom: 30, right: 30, backgroundColor: '#2E7D32', width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4 },
    fabIcon: { fontSize: 32, color: 'white', fontWeight: 'bold', marginTop: -2 }
});

export default HomeScreen;
