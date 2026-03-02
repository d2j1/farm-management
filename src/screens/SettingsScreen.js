import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { getDb } from '../database/db';

const SettingsScreen = ({ navigation }) => {
    const { t, i18n } = useTranslation();



    const changeLanguage = (lng) => {
        i18n.changeLanguage(lng);
    };

    const exportData = async () => {
        try {
            const db = await getDb();

            const actQuery = `
        SELECT c.crop_name, c.land_identifier, a.date, a.activity_type, a.notes 
        FROM activities a 
        JOIN crops c ON a.crop_id = c.id
        ORDER BY a.id DESC
      `;
            const expQuery = `
        SELECT c.crop_name, c.land_identifier, e.date, e.category, e.amount, e.payment_mode, e.remarks
        FROM expenses e 
        JOIN crops c ON e.crop_id = c.id
        ORDER BY e.id DESC
      `;

            const diaryRows = await db.getAllAsync(actQuery);
            const expenseRows = await db.getAllAsync(expQuery);

            let csvString = '--- CROP ACTIVITY LOGS ---\nCrop,Land,Date,Activity Type,Notes\n';
            diaryRows.forEach(row => {
                csvString += `"${row.crop_name}","${row.land_identifier}",${row.date},${row.activity_type},"${row.notes || ''}"\n`;
            });

            csvString += '\n--- CROP EXPENSES ---\nCrop,Land,Date,Category,Amount,Payment Mode,Remarks\n';
            expenseRows.forEach(row => {
                csvString += `"${row.crop_name}","${row.land_identifier}",${row.date},${row.category},${row.amount},${row.payment_mode || ''},"${row.remarks || ''}"\n`;
            });

            const fileUri = FileSystem.documentDirectory + 'FarmerApp_CropData_Export.csv';
            await FileSystem.writeAsStringAsync(fileUri, csvString, { encoding: FileSystem.EncodingType.UTF8 });

            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(fileUri, {
                    mimeType: 'text/csv',
                    dialogTitle: 'Export Farm Data'
                });
            } else {
                Alert.alert('Error', 'Sharing is not available on this device');
            }
        } catch (error) {
            console.error('Export Error:', error);
            Alert.alert('Error', 'Failed to export data');
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>{t('settings')}</Text>
            </View>
            <ScrollView style={styles.container}>

                {/* User Profile Navigation */}
                <Text style={styles.sectionTitle}>Account</Text>
                <TouchableOpacity
                    style={styles.navButton}
                    onPress={() => navigation.navigate('Profile')}
                >
                    <Text style={styles.navButtonText}>Manage User Profile</Text>
                </TouchableOpacity>

                {/* Language Section */}
                <Text style={styles.sectionTitle}>{t('language')}</Text>
                <View style={styles.buttonContainer}>
                    <TouchableOpacity style={styles.button} onPress={() => changeLanguage('en')}>
                        <Text style={styles.buttonText}>{t('english')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.button} onPress={() => changeLanguage('hi')}>
                        <Text style={styles.buttonText}>{t('hindi')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.button} onPress={() => changeLanguage('mr')}>
                        <Text style={styles.buttonText}>{t('marathi')}</Text>
                    </TouchableOpacity>
                </View>

                {/* Data Export & Privacy Section */}
                <Text style={styles.sectionTitle}>Data & Privacy</Text>
                <View style={styles.privacyCard}>
                    <Text style={styles.privacyText}>
                        🔒 Your data is 100% private. All your profile data, crop logs, and financial expenses are stored locally on this device. No data is sent to external servers.
                    </Text>
                    <TouchableOpacity style={styles.exportBtn} onPress={exportData}>
                        <Text style={styles.exportBtnText}>📤 Export Crop Data as CSV</Text>
                    </TouchableOpacity>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#1B5E20' },
    header: { paddingHorizontal: 20, paddingVertical: 15, backgroundColor: '#1B5E20', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 2 },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: 'white' },
    container: { flex: 1, padding: 20, backgroundColor: '#FFF' },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', marginTop: 10, marginBottom: 15, color: '#333' },

    navButton: { backgroundColor: '#FF8F00', paddingVertical: 14, borderRadius: 8, alignItems: 'center', marginBottom: 10 },
    navButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },

    buttonContainer: { flexDirection: 'row', gap: 10, marginBottom: 15 },
    button: { backgroundColor: '#E0E0E0', padding: 12, borderRadius: 8, flex: 1, alignItems: 'center' },
    buttonText: { color: '#333', fontWeight: 'bold' },

    privacyCard: { backgroundColor: '#F0F4F8', padding: 15, borderRadius: 10, borderWidth: 1, borderColor: '#D9E2EC' },
    privacyText: { fontSize: 14, color: '#486581', lineHeight: 22, marginVertical: 10 },
    exportBtn: { backgroundColor: '#1976D2', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10 },
    exportBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});

export default SettingsScreen;
