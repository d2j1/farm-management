import { View, Text, StyleSheet, TouchableOpacity, ScrollView, useColorScheme, Platform, Modal, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { getDb } from '../database/db';
import { Buffer } from 'buffer';

const SettingsScreen = ({ navigation }) => {
    const isDark = useColorScheme() === 'dark';
    const { t, i18n } = useTranslation();

    const [alertVisible, setAlertVisible] = useState(false);
    const [alertTitle, setAlertTitle] = useState('');
    const [alertMessage, setAlertMessage] = useState('');

    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');

    const showAlert = (title, message) => {
        setAlertTitle(title);
        setAlertMessage(message);
        setAlertVisible(true);
    };

    const changeLanguage = (lng) => {
        i18n.changeLanguage(lng);
    };

    const exportData = async () => {
        setLoadingMessage(t('preparingExportData') || 'Preparing Export Data...');
        setIsLoading(true);
        // Small delay to allow UI to render loading state
        await new Promise(resolve => setTimeout(resolve, 100));

        try {
            const db = await getDb();

            const cropQuery = `
        SELECT id as crop_id, land_identifier, total_area, area_unit, crop_name, sowing_date, variety, soil_type, expected_harvest_date, previous_crop, status
        FROM crops
        ORDER BY id DESC
      `;
            const actQuery = `
        SELECT c.id as crop_id, c.crop_name, c.land_identifier, a.date, a.activity_type, a.notes 
        FROM activities a 
        JOIN crops c ON a.crop_id = c.id
        ORDER BY a.id DESC
      `;
            const expQuery = `
        SELECT c.id as crop_id, c.crop_name, c.land_identifier, e.date, e.category, e.amount, e.payment_mode, e.remarks
        FROM expenses e 
        JOIN crops c ON e.crop_id = c.id
        ORDER BY e.id DESC
      `;
            const earnQuery = `
        SELECT c.id as crop_id, c.crop_name, c.land_identifier, r.date, r.category, r.amount, r.payment_mode, r.remarks
        FROM earnings r 
        JOIN crops c ON r.crop_id = c.id
        ORDER BY r.id DESC
      `;

            const cropsRows = await db.getAllAsync(cropQuery);
            const diaryRows = await db.getAllAsync(actQuery);
            const expenseRows = await db.getAllAsync(expQuery);
            const earnRows = await db.getAllAsync(earnQuery);

            let csvString = '--- CROP DETAILS ---\nCrop ID,Crop,Land,Area,Area Unit,Sowing Date,Variety,Soil Type,Expected Harvest,Previous Crop,Status\n';
            cropsRows.forEach(row => {
                csvString += `"${row.crop_id}","${row.crop_name}","${row.land_identifier}","${row.total_area}","${row.area_unit}","${row.sowing_date}","${row.variety || ''}","${row.soil_type || ''}","${row.expected_harvest_date || ''}","${row.previous_crop || ''}","${row.status}"\n`;
            });

            csvString += '\n--- CROP ACTIVITY LOGS ---\nCrop ID,Crop,Land,Date,Activity Type,Notes\n';
            diaryRows.forEach(row => {
                csvString += `"${row.crop_id}","${row.crop_name}","${row.land_identifier}",${row.date},${row.activity_type},"${row.notes || ''}"\n`;
            });

            csvString += '\n--- CROP EXPENSES ---\nCrop ID,Crop,Land,Date,Category,Amount,Payment Mode,Remarks\n';
            expenseRows.forEach(row => {
                csvString += `"${row.crop_id}","${row.crop_name}","${row.land_identifier}",${row.date},${row.category},${row.amount},${row.payment_mode || ''},"${row.remarks || ''}"\n`;
            });

            csvString += '\n--- CROP EARNINGS ---\nCrop ID,Crop,Land,Date,Category,Amount,Payment Mode,Remarks\n';
            earnRows.forEach(row => {
                csvString += `"${row.crop_id}","${row.crop_name}","${row.land_identifier}",${row.date},${row.category},${row.amount},${row.payment_mode || ''},"${row.remarks || ''}"\n`;
            });

            const fileName = 'FarmerApp_CropData_Export.csv';
            const tempFileUri = FileSystem.documentDirectory + fileName;
            await FileSystem.writeAsStringAsync(tempFileUri, csvString, { encoding: FileSystem.EncodingType.UTF8 });

            if (Platform.OS === 'android') {
                const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();

                if (permissions.granted) {
                    try {
                        const newFileUri = await FileSystem.StorageAccessFramework.createFileAsync(
                            permissions.directoryUri,
                            fileName,
                            'text/csv'
                        );

                        await FileSystem.writeAsStringAsync(newFileUri, csvString, {
                            encoding: FileSystem.EncodingType.UTF8,
                        });

                        showAlert(t('exportSuccess') || 'Success', t('exportSuccessMsg') || 'File saved successfully to the selected folder');
                    } catch (e) {
                        console.error('File creation error', e);
                        showAlert('Error', 'Failed to save file');
                    }
                } else {
                    showAlert('Permission Denied', 'Storage permission must be granted to save the file');
                }
            } else {
                // iOS Flow
                if (await Sharing.isAvailableAsync()) {
                    await Sharing.shareAsync(tempFileUri, {
                        mimeType: 'text/csv',
                        dialogTitle: 'Export Farm Data'
                    });
                } else {
                    showAlert('Error', 'Sharing is not available on this device');
                }
            }

        } catch (error) {
            console.error('Export Error:', error);
            showAlert('Error', 'Failed to export data');
        } finally {
            setIsLoading(false);
        }
    };

    const importData = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['text/csv', 'application/vnd.ms-excel', 'text/*'],
                copyToCacheDirectory: true,
            });

            if (result.canceled || !result.assets || result.assets.length === 0) {
                return;
            }

            setLoadingMessage(t('importingDataWait') || 'Importing Data...\nPlease do not close the app.');
            setIsLoading(true);
            await new Promise(resolve => setTimeout(resolve, 100));

            const fileUri = result.assets[0].uri;
            const fileContent = await FileSystem.readAsStringAsync(fileUri, { encoding: FileSystem.EncodingType.UTF8 });
            const rows = fileContent.split(/\r?\n/);

            if (rows.length < 2) {
                setIsLoading(false);
                showAlert(t('importError') || 'Import Error', t('importErrorMsg') || 'Invalid or empty file format');
                return;
            }

            const db = await getDb();
            let importedCount = 0;
            let currentSection = null;
            let insertedCropsMap = {};

            // Helper to get or create a crop based on name and land ID
            const getOrCreateCropId = async (originalCropId, cropName, landId, cropDetails = null) => {
                const key = originalCropId ? `orig_${originalCropId}` : `${cropName}_${landId}`;
                if (insertedCropsMap[key]) {
                    return insertedCropsMap[key];
                }

                // If explicit crop details were parsed, use them. Otherwise, provide defaults.
                const totalArea = cropDetails ? cropDetails.totalArea : 0;
                const areaUnit = cropDetails ? cropDetails.areaUnit : 'Acres';
                const sowingDate = cropDetails ? cropDetails.sowingDate : new Date().toISOString().split('T')[0];
                const variety = cropDetails ? cropDetails.variety : null;
                const soilType = cropDetails ? cropDetails.soilType : null;
                const expectedHarvest = cropDetails ? cropDetails.expectedHarvest : null;
                const prevCrop = cropDetails ? cropDetails.prevCrop : null;
                const status = cropDetails ? cropDetails.status : 'Active';

                const insertResult = await db.runAsync(
                    `INSERT INTO crops 
                    (land_identifier, total_area, area_unit, crop_name, sowing_date, variety, soil_type, expected_harvest_date, previous_crop, status) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [landId, totalArea, areaUnit, cropName, sowingDate, variety, soilType, expectedHarvest, prevCrop, status]
                );
                insertedCropsMap[key] = insertResult.lastInsertRowId;
                return insertedCropsMap[key];
            };

            for (let i = 0; i < rows.length; i++) {
                const row = rows[i].trim();
                if (!row) continue;

                if (row.includes('--- CROP DETAILS ---')) {
                    currentSection = 'crops';
                    continue;
                }
                if (row.includes('--- CROP ACTIVITY LOGS ---')) {
                    currentSection = 'activities';
                    continue;
                }
                if (row.includes('--- CROP EXPENSES ---')) {
                    currentSection = 'expenses';
                    continue;
                }
                if (row.includes('--- CROP EARNINGS ---')) {
                    currentSection = 'earnings';
                    continue;
                }

                // Skip headers
                if (row.startsWith('Crop ID,Crop,Land,Date,') || row.startsWith('Crop,Land,Date,') || row.startsWith('Crop ID,Crop,Land,Area,')) continue;

                if (!currentSection) continue;

                // Parse columns (handles quotes)
                const columnsMatch = row.match(/(?:(?:^|,)("([^"]*)"|[^,]*))/g);
                if (!columnsMatch) continue;

                const cols = columnsMatch.map(col => {
                    let val = col.startsWith(',') ? col.substring(1) : col;
                    if (val.startsWith('"') && val.endsWith('"')) {
                        val = val.substring(1, val.length - 1);
                    }
                    return val.trim();
                });

                const hasCropId = cols.length === 6 || cols.length === 8;
                const offset = hasCropId ? 1 : 0;
                const originalCropId = hasCropId ? cols[0] : null;

                if (currentSection === 'crops' && cols.length >= 11) {
                    const originalCropId = cols[0];
                    const cropName = cols[1];
                    const landId = cols[2];
                    const totalArea = parseFloat(cols[3]) || 0;
                    const areaUnit = cols[4];
                    const sowingDate = cols[5];
                    const variety = cols[6];
                    const soilType = cols[7];
                    const expectedHarvest = cols[8];
                    const prevCrop = cols[9];
                    const status = cols[10];

                    if (originalCropId && cropName && landId) {
                        await getOrCreateCropId(originalCropId, cropName, landId, {
                            totalArea, areaUnit, sowingDate, variety, soilType, expectedHarvest, prevCrop, status
                        });
                        importedCount++;
                    }
                }
                else if (currentSection === 'activities' && cols.length >= (hasCropId ? 6 : 5)) {
                    const cropName = cols[0 + offset];
                    const landId = cols[1 + offset];
                    const actDate = cols[2 + offset];
                    const actType = cols[3 + offset];
                    const notes = cols[4 + offset];

                    if (cropName && landId && actType) {
                        const cropId = await getOrCreateCropId(originalCropId, cropName, landId);
                        await db.runAsync(
                            'INSERT INTO activities (crop_id, activity_type, date, notes) VALUES (?, ?, ?, ?)',
                            [cropId, actType, actDate, notes]
                        );
                        importedCount++;
                    }
                }
                else if (currentSection === 'expenses' && cols.length >= (hasCropId ? 8 : 7)) {
                    const cropName = cols[0 + offset];
                    const landId = cols[1 + offset];
                    const expDate = cols[2 + offset];
                    const category = cols[3 + offset];
                    const amount = parseFloat(cols[4 + offset]);
                    const payMode = cols[5 + offset];
                    const remarks = cols[6 + offset];

                    if (cropName && landId && category && !isNaN(amount)) {
                        const cropId = await getOrCreateCropId(originalCropId, cropName, landId);
                        await db.runAsync(
                            'INSERT INTO expenses (crop_id, category, amount, payment_mode, date, remarks) VALUES (?, ?, ?, ?, ?, ?)',
                            [cropId, category, amount, payMode || 'Cash', expDate, remarks]
                        );
                        importedCount++;
                    }
                }
                else if (currentSection === 'earnings' && cols.length >= (hasCropId ? 8 : 7)) {
                    const cropName = cols[0 + offset];
                    const landId = cols[1 + offset];
                    const earnDate = cols[2 + offset];
                    const category = cols[3 + offset];
                    const amount = parseFloat(cols[4 + offset]);
                    const payMode = cols[5 + offset];
                    const remarks = cols[6 + offset];

                    if (cropName && landId && category && !isNaN(amount)) {
                        const cropId = await getOrCreateCropId(originalCropId, cropName, landId);
                        await db.runAsync(
                            'INSERT INTO earnings (crop_id, category, amount, payment_mode, date, remarks) VALUES (?, ?, ?, ?, ?, ?)',
                            [cropId, category, amount, payMode || 'Cash', earnDate, remarks]
                        );
                        importedCount++;
                    }
                }
            }

            if (importedCount > 0) {
                showAlert(t('importSuccess') || 'Success', t('importSuccessMsg') || 'Data imported successfully');
            } else {
                showAlert(t('importError') || 'Import Error', t('importErrorMsg') || 'No valid data found to import');
            }

        } catch (error) {
            console.error('Import Error:', error);
            showAlert(t('importError') || 'Import Error', t('importErrorMsg') || 'An unexpected error occurred during import');
        } finally {
            setIsLoading(false);
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
                    <TouchableOpacity style={[styles.importBtn, isDark && styles.importBtnDark]} onPress={importData}>
                        <Text style={styles.importBtnText}>{t('importCropData')}</Text>
                    </TouchableOpacity>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>

            {/* Loading Overlay */}
            {isLoading && (
                <View style={styles.loadingOverlay}>
                    <View style={[styles.loadingBox, isDark && styles.loadingBoxDark]}>
                        <ActivityIndicator size="large" color="#FF8F00" />
                        <Text style={[styles.loadingText, isDark && styles.textDark]}>{loadingMessage}</Text>
                    </View>
                </View>
            )}

            <Modal
                animationType="fade"
                transparent={true}
                visible={alertVisible}
                onRequestClose={() => setAlertVisible(false)}
            >
                <View style={styles.centeredView}>
                    <View style={[styles.modalView, isDark && styles.modalViewDark]}>
                        <Text style={[styles.modalTitle, isDark && styles.textDark]}>{alertTitle}</Text>
                        <Text style={[styles.modalText, isDark && styles.textDark]}>{alertMessage}</Text>
                        <Pressable
                            style={[styles.modalButton]}
                            onPress={() => setAlertVisible(false)}
                        >
                            <Text style={styles.modalButtonText}>{t('ok') || 'OK'}</Text>
                        </Pressable>
                    </View>
                </View>
            </Modal>
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
    exportBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
    importBtn: { backgroundColor: '#FF9800', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10 },
    importBtnDark: { backgroundColor: '#F57C00' },
    importBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },

    centeredView: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)' },
    modalView: { margin: 20, backgroundColor: 'white', borderRadius: 15, padding: 25, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5, width: '80%' },
    modalViewDark: { backgroundColor: '#2C2C2C' },
    modalTitle: { marginBottom: 15, textAlign: 'center', fontSize: 20, fontWeight: 'bold', color: '#333' },
    modalText: { marginBottom: 25, textAlign: 'center', fontSize: 16, color: '#666', lineHeight: 22 },
    modalButton: { backgroundColor: '#1B5E20', borderRadius: 8, padding: 12, paddingHorizontal: 30, elevation: 2 },
    modalButtonText: { color: 'white', fontWeight: 'bold', textAlign: 'center', fontSize: 16 },

    loadingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.6)', justifyContent: 'center', alignItems: 'center', zIndex: 999 },
    loadingBox: { backgroundColor: 'white', padding: 25, borderRadius: 15, alignItems: 'center', elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, width: '70%' },
    loadingBoxDark: { backgroundColor: '#2C2C2C' },
    loadingText: { marginTop: 15, fontSize: 16, fontWeight: 'bold', color: '#333', textAlign: 'center' }
});

export default SettingsScreen;
