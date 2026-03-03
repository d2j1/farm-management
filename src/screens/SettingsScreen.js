import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { getDb } from '../database/db';

const SettingsScreen = ({ navigation }) => {
    const isDark = useColorScheme() === 'dark';
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
        <SafeAreaView style={[styles.safeArea, isDark && styles.safeAreaDark]}>
            <View style={[styles.header, isDark && styles.headerDark]}>
                <Text style={styles.headerTitle}>{t('settings')}</Text>
            </View>
            <ScrollView style={[styles.container, isDark && styles.containerDark]}>

                {/* User Profile Navigation */}
                <Text style={[styles.sectionTitle, isDark && styles.textDark]}>{t('account')}</Text>
                <TouchableOpacity
                    style={[styles.navButton, isDark && styles.navBtnDark]}
                    onPress={() => navigation.navigate('Profile')}
                >
                    <Text style={styles.navButtonText}>{t('manageUserProfile')}</Text>
                </TouchableOpacity>

                {/* Language Section */}
                <Text style={[styles.sectionTitle, isDark && styles.textDark]}>{t('language')}</Text>
                <View style={styles.buttonContainer}>
                    <TouchableOpacity style={[styles.button, isDark && styles.buttonDark]} onPress={() => changeLanguage('en')}>
                        <Text style={[styles.buttonText, isDark && styles.textDark]}>{t('english')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.button, isDark && styles.buttonDark]} onPress={() => changeLanguage('hi')}>
                        <Text style={[styles.buttonText, isDark && styles.textDark]}>{t('hindi')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.button, isDark && styles.buttonDark]} onPress={() => changeLanguage('mr')}>
                        <Text style={[styles.buttonText, isDark && styles.textDark]}>{t('marathi')}</Text>
                    </TouchableOpacity>
                </View>

                {/* Data Export & Privacy Section */}
                <Text style={[styles.sectionTitle, isDark && styles.textDark]}>{t('dataAndPrivacy')}</Text>
                <View style={[styles.privacyCard, isDark && styles.privacyCardDark]}>
                    <Text style={[styles.privacyText, isDark && styles.privacyTextDark]}>
                        {t('dataPrivacyMsg')}
                    </Text>
                    <TouchableOpacity style={[styles.exportBtn, isDark && styles.exportBtnDark]} onPress={exportData}>
                        <Text style={styles.exportBtnText}>{t('exportCropData')}</Text>
                    </TouchableOpacity>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#1B5E20' },
    safeAreaDark: { backgroundColor: '#121212' },
    header: { paddingHorizontal: 20, paddingVertical: 15, backgroundColor: '#1B5E20', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 2 },
    headerDark: { backgroundColor: '#1F1F1F' },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: 'white' },
    container: { flex: 1, padding: 20, backgroundColor: '#FFF' },
    containerDark: { backgroundColor: '#121212' },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', marginTop: 10, marginBottom: 15, color: '#333' },
    textDark: { color: '#E0E0E0' },

    navButton: { backgroundColor: '#FF8F00', paddingVertical: 14, borderRadius: 8, alignItems: 'center', marginBottom: 10 },
    navBtnDark: { backgroundColor: '#F57C00' },
    navButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },

    buttonContainer: { flexDirection: 'row', gap: 10, marginBottom: 15 },
    button: { backgroundColor: '#E0E0E0', padding: 12, borderRadius: 8, flex: 1, alignItems: 'center' },
    buttonDark: { backgroundColor: '#333' },
    buttonText: { color: '#333', fontWeight: 'bold' },

    privacyCard: { backgroundColor: '#F0F4F8', padding: 15, borderRadius: 10, borderWidth: 1, borderColor: '#D9E2EC' },
    privacyCardDark: { backgroundColor: '#1E1E1E', borderColor: '#333' },
    privacyText: { fontSize: 14, color: '#486581', lineHeight: 22, marginVertical: 10 },
    privacyTextDark: { color: '#B0BEC5' },
    exportBtn: { backgroundColor: '#1976D2', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10 },
    exportBtnDark: { backgroundColor: '#1565C0' },
    exportBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});

export default SettingsScreen;
