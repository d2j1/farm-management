import React, { useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Modal,
    Pressable,
    ActivityIndicator,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { MaterialIcons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { getDb } from '../database/db';

const SettingsScreen = ({ navigation }) => {
    const { t, i18n } = useTranslation();

    const [alertVisible, setAlertVisible] = useState(false);
    const [alertTitle, setAlertTitle] = useState('');
    const [alertMessage, setAlertMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');

    const currentLang = i18n.language;

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
        await new Promise(resolve => setTimeout(resolve, 100));

        try {
            const db = await getDb();

            const cropQuery = `
        SELECT id as crop_id, land_identifier, total_area, area_unit, crop_name, sowing_date, variety, soil_type, expected_harvest_date, previous_crop, status
        FROM crops ORDER BY id DESC`;
            const actQuery = `
        SELECT c.id as crop_id, c.crop_name, c.land_identifier, a.date, a.activity_type, a.notes
        FROM activities a JOIN crops c ON a.crop_id = c.id ORDER BY a.id DESC`;
            const expQuery = `
        SELECT c.id as crop_id, c.crop_name, c.land_identifier, e.date, e.category, e.amount, e.payment_mode, e.remarks
        FROM expenses e JOIN crops c ON e.crop_id = c.id ORDER BY e.id DESC`;
            const earnQuery = `
        SELECT c.id as crop_id, c.crop_name, c.land_identifier, r.date, r.category, r.amount, r.payment_mode, r.remarks
        FROM earnings r JOIN crops c ON r.crop_id = c.id ORDER BY r.id DESC`;

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
                            permissions.directoryUri, fileName, 'text/csv'
                        );
                        await FileSystem.writeAsStringAsync(newFileUri, csvString, { encoding: FileSystem.EncodingType.UTF8 });
                        showAlert(t('exportSuccess') || 'Success', t('exportSuccessMsg') || 'File saved successfully to the selected folder');
                    } catch (e) {
                        showAlert('Error', 'Failed to save file');
                    }
                } else {
                    showAlert('Permission Denied', 'Storage permission must be granted to save the file');
                }
            } else {
                if (await Sharing.isAvailableAsync()) {
                    await Sharing.shareAsync(tempFileUri, { mimeType: 'text/csv', dialogTitle: 'Export Farm Data' });
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

            if (result.canceled || !result.assets || result.assets.length === 0) return;

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

            const getOrCreateCropId = async (originalCropId, cropName, landId, cropDetails = null) => {
                const key = originalCropId ? `orig_${originalCropId}` : `${cropName}_${landId}`;
                if (insertedCropsMap[key]) return insertedCropsMap[key];

                const totalArea = cropDetails ? cropDetails.totalArea : 0;
                const areaUnit = cropDetails ? cropDetails.areaUnit : 'Acres';
                const sowingDate = cropDetails ? cropDetails.sowingDate : new Date().toISOString().split('T')[0];
                const variety = cropDetails ? cropDetails.variety : null;
                const soilType = cropDetails ? cropDetails.soilType : null;
                const expectedHarvest = cropDetails ? cropDetails.expectedHarvest : null;
                const prevCrop = cropDetails ? cropDetails.prevCrop : null;
                const status = cropDetails ? cropDetails.status : 'Active';

                const insertResult = await db.runAsync(
                    `INSERT INTO crops (land_identifier, total_area, area_unit, crop_name, sowing_date, variety, soil_type, expected_harvest_date, previous_crop, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [landId, totalArea, areaUnit, cropName, sowingDate, variety, soilType, expectedHarvest, prevCrop, status]
                );
                insertedCropsMap[key] = insertResult.lastInsertRowId;
                return insertedCropsMap[key];
            };

            for (let i = 0; i < rows.length; i++) {
                const row = rows[i].trim();
                if (!row) continue;

                if (row.includes('--- CROP DETAILS ---')) { currentSection = 'crops'; continue; }
                if (row.includes('--- CROP ACTIVITY LOGS ---')) { currentSection = 'activities'; continue; }
                if (row.includes('--- CROP EXPENSES ---')) { currentSection = 'expenses'; continue; }
                if (row.includes('--- CROP EARNINGS ---')) { currentSection = 'earnings'; continue; }

                if (row.startsWith('Crop ID,Crop,Land,Date,') || row.startsWith('Crop,Land,Date,') || row.startsWith('Crop ID,Crop,Land,Area,')) continue;
                if (!currentSection) continue;

                const columnsMatch = row.match(/(?:(?:^|,)(\"([^\"]*)\"|[^,]*))/g);
                if (!columnsMatch) continue;

                const cols = columnsMatch.map(col => {
                    let val = col.startsWith(',') ? col.substring(1) : col;
                    if (val.startsWith('"') && val.endsWith('"')) val = val.substring(1, val.length - 1);
                    return val.trim();
                });

                const hasCropId = cols.length === 6 || cols.length === 8;
                const offset = hasCropId ? 1 : 0;
                const originalCropId = hasCropId ? cols[0] : null;

                if (currentSection === 'crops' && cols.length >= 11) {
                    const origId = cols[0];
                    if (origId && cols[1] && cols[2]) {
                        await getOrCreateCropId(origId, cols[1], cols[2], {
                            totalArea: parseFloat(cols[3]) || 0, areaUnit: cols[4], sowingDate: cols[5],
                            variety: cols[6], soilType: cols[7], expectedHarvest: cols[8], prevCrop: cols[9], status: cols[10]
                        });
                        importedCount++;
                    }
                } else if (currentSection === 'activities' && cols.length >= (hasCropId ? 6 : 5)) {
                    const cropName = cols[0 + offset], landId = cols[1 + offset];
                    if (cropName && landId && cols[3 + offset]) {
                        const cropId = await getOrCreateCropId(originalCropId, cropName, landId);
                        await db.runAsync('INSERT INTO activities (crop_id, activity_type, date, notes) VALUES (?, ?, ?, ?)',
                            [cropId, cols[3 + offset], cols[2 + offset], cols[4 + offset]]);
                        importedCount++;
                    }
                } else if (currentSection === 'expenses' && cols.length >= (hasCropId ? 8 : 7)) {
                    const cropName = cols[0 + offset], landId = cols[1 + offset];
                    const amount = parseFloat(cols[4 + offset]);
                    if (cropName && landId && cols[3 + offset] && !isNaN(amount)) {
                        const cropId = await getOrCreateCropId(originalCropId, cropName, landId);
                        await db.runAsync('INSERT INTO expenses (crop_id, category, amount, payment_mode, date, remarks) VALUES (?, ?, ?, ?, ?, ?)',
                            [cropId, cols[3 + offset], amount, cols[5 + offset] || 'Cash', cols[2 + offset], cols[6 + offset]]);
                        importedCount++;
                    }
                } else if (currentSection === 'earnings' && cols.length >= (hasCropId ? 8 : 7)) {
                    const cropName = cols[0 + offset], landId = cols[1 + offset];
                    const amount = parseFloat(cols[4 + offset]);
                    if (cropName && landId && cols[3 + offset] && !isNaN(amount)) {
                        const cropId = await getOrCreateCropId(originalCropId, cropName, landId);
                        await db.runAsync('INSERT INTO earnings (crop_id, category, amount, payment_mode, date, remarks) VALUES (?, ?, ?, ?, ?, ?)',
                            [cropId, cols[3 + offset], amount, cols[5 + offset] || 'Cash', cols[2 + offset], cols[6 + offset]]);
                        importedCount++;
                    }
                }
            }

            showAlert(
                importedCount > 0 ? (t('importSuccess') || 'Success') : (t('importError') || 'Import Error'),
                importedCount > 0 ? (t('importSuccessMsg') || 'Data imported successfully') : (t('importErrorMsg') || 'No valid data found to import')
            );
        } catch (error) {
            console.error('Import Error:', error);
            showAlert(t('importError') || 'Import Error', t('importErrorMsg') || 'An unexpected error occurred during import');
        } finally {
            setIsLoading(false);
        }
    };

    const languages = [
        { code: 'en', label: t('english') || 'English' },
        { code: 'hi', label: t('hindi') || 'Hindi' },
        { code: 'mr', label: t('marathi') || 'Marathi' },
    ];

    return (
        <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark" edges={['top']}>

            {/* Header */}
            <View className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-4">
                <Text className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 text-center">
                    {t('profile') || 'Profile'}
                </Text>
            </View>

            <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>

                {/* Account Section */}
                <View className="mt-6">
                    <Text className="px-4 text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                        {t('account') || 'Account'}
                    </Text>
                    <View className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl mx-4 overflow-hidden shadow-sm">
                        <TouchableOpacity
                            className="w-full flex-row items-center justify-between px-4 py-4 active:bg-slate-50 dark:active:bg-slate-800"
                            onPress={() => navigation.navigate('Profile')}
                        >
                            <View className="flex-row items-center gap-4">
                                <View className="h-10 w-10 items-center justify-center rounded-full bg-primary/20">
                                    <MaterialIcons name="person" size={22} color="#3ce619" />
                                </View>
                                <Text className="text-base font-medium text-slate-900 dark:text-slate-100">
                                    {t('manageUserProfile') || 'Manage user profile'}
                                </Text>
                            </View>
                            <MaterialIcons name="chevron-right" size={24} color="#94a3b8" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Language Section */}
                <View className="mt-8">
                    <Text className="px-4 text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                        {t('language') || 'Language'}
                    </Text>
                    <View className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl mx-4 overflow-hidden shadow-sm divide-y divide-slate-100 dark:divide-slate-800">
                        {languages.map((lang) => {
                            const isSelected = currentLang === lang.code;
                            return (
                                <TouchableOpacity
                                    key={lang.code}
                                    className="w-full flex-row items-center justify-between px-4 py-4 active:bg-slate-50 dark:active:bg-slate-800"
                                    onPress={() => changeLanguage(lang.code)}
                                >
                                    <View className="flex-row items-center gap-4">
                                        <View className="h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                                            <MaterialIcons name="language" size={22} color="#64748b" />
                                        </View>
                                        <Text className="text-base font-medium text-slate-900 dark:text-slate-100">
                                            {lang.label}
                                        </Text>
                                    </View>
                                    {/* Radio Button */}
                                    <View className={`h-5 w-5 rounded-full border-2 items-center justify-center ${isSelected ? 'border-primary' : 'border-slate-300 dark:border-slate-600'}`}>
                                        {isSelected && (
                                            <View className="h-2.5 w-2.5 rounded-full bg-primary" />
                                        )}
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                {/* Data & Privacy Section */}
                <View className="mt-8 px-4">
                    <Text className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                        {t('dataAndPrivacy') || 'Data & Privacy'}
                    </Text>

                    {/* Privacy Info Card */}
                    <View className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-4 flex-row gap-3">
                        <MaterialIcons name="security" size={22} color="#3ce619" style={{ marginTop: 1 }} />
                        <Text className="text-sm leading-relaxed text-slate-700 dark:text-slate-300 flex-1">
                            {t('dataPrivacyMsg') || 'Your data is 100% private. All your profile data, crop logs, and financial expenses are stored locally on this device. No data is sent to external servers.'}
                        </Text>
                    </View>

                    {/* Export & Import Buttons */}
                    <View className="gap-3">
                        <TouchableOpacity
                            className="w-full flex-row items-center justify-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 py-3.5 rounded-xl shadow-sm active:bg-slate-50 dark:active:bg-slate-800"
                            onPress={exportData}
                        >
                            <MaterialIcons name="file-download" size={22} color="#3ce619" />
                            <Text className="font-semibold text-base text-slate-900 dark:text-slate-100">
                                {t('exportCropData') || 'Export Crop data as CSV'}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            className="w-full flex-row items-center justify-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 py-3.5 rounded-xl shadow-sm active:bg-slate-50 dark:active:bg-slate-800"
                            onPress={importData}
                        >
                            <MaterialIcons name="file-upload" size={22} color="#3ce619" />
                            <Text className="font-semibold text-base text-slate-900 dark:text-slate-100">
                                {t('importCropData') || 'Import crop data'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

            </ScrollView>

            {/* Loading Overlay */}
            {isLoading && (
                <View className="absolute inset-0 bg-black/60 justify-center items-center z-50">
                    <View className="bg-white dark:bg-slate-800 p-6 rounded-2xl items-center w-72 shadow-xl">
                        <ActivityIndicator size="large" color="#3ce619" />
                        <Text className="mt-4 text-base font-semibold text-slate-900 dark:text-slate-100 text-center">
                            {loadingMessage}
                        </Text>
                    </View>
                </View>
            )}

            {/* Alert Modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={alertVisible}
                onRequestClose={() => setAlertVisible(false)}
            >
                <View className="flex-1 justify-center items-center bg-black/50">
                    <View className="bg-white dark:bg-slate-800 rounded-2xl p-6 items-center shadow-xl w-4/5">
                        <Text className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-3 text-center">
                            {alertTitle}
                        </Text>
                        <Text className="text-base text-slate-600 dark:text-slate-400 mb-6 text-center leading-relaxed">
                            {alertMessage}
                        </Text>
                        <Pressable
                            className="bg-primary rounded-xl py-3 px-8"
                            onPress={() => setAlertVisible(false)}
                        >
                            <Text className="text-slate-900 font-bold text-base">
                                {t('ok') || 'OK'}
                            </Text>
                        </Pressable>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

export default SettingsScreen;
