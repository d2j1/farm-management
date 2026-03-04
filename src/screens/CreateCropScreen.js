import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, Platform, useColorScheme, Modal, Pressable } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker'; // We need to install this or use built in approach. For now we use standard Picker if installed, or build a simple mock.
import { getDb } from '../database/db';
import { useTranslation } from 'react-i18next';

// Simple custom picker to avoid adding new dependencies right now
const CustomPicker = ({ label, selectedValue, onValueChange, items, isDark }) => (
    <View style={styles.pickerContainer}>
        <Text style={[styles.label, isDark && styles.textDark]}>{label}</Text>
        <View style={styles.pickerInner}>
            {items.map(item => (
                <TouchableOpacity
                    key={item}
                    style={[styles.pickerOpt, isDark && styles.pickerOptDark, selectedValue === item && styles.pickerOptSel]}
                    onPress={() => onValueChange(item)}
                >
                    <Text style={[styles.pickerText, isDark && styles.textDark, selectedValue === item && styles.pickerTextSel]}>{item}</Text>
                </TouchableOpacity>
            ))}
        </View>
    </View>
);

const CreateCropScreen = ({ route, navigation }) => {
    const isDark = useColorScheme() === 'dark';
    const { t } = useTranslation();
    const existingCrop = route.params?.crop;

    // Primary
    const [landId, setLandId] = useState(existingCrop?.land_identifier || '');
    const [area, setArea] = useState(existingCrop?.total_area ? existingCrop.total_area.toString() : '');
    const [unit, setUnit] = useState(existingCrop?.area_unit || 'Acres');
    const [cropName, setCropName] = useState(existingCrop?.crop_name || '');
    const [sowDate, setSowDate] = useState(existingCrop?.sowing_date || new Date().toISOString().split('T')[0]);
    const [showSowDate, setShowSowDate] = useState(false);
    const [errors, setErrors] = useState({});

    // Secondary
    const [variety, setVariety] = useState(existingCrop?.variety || '');
    const [soilType, setSoilType] = useState(existingCrop?.soil_type || 'Black');
    const [expectedHarvest, setExpectedHarvest] = useState(existingCrop?.expected_harvest_date || '');
    const [showExpectedHarvest, setShowExpectedHarvest] = useState(false);
    const [prevCrop, setPrevCrop] = useState(existingCrop?.previous_crop || '');

    // Custom Alert Modal State
    const [alertVisible, setAlertVisible] = useState(false);
    const [alertTitle, setAlertTitle] = useState('');
    const [alertMessage, setAlertMessage] = useState('');
    const [onAlertOk, setOnAlertOk] = useState(null);

    const showAlert = (title, message, onOk = null) => {
        setAlertTitle(title);
        setAlertMessage(message);
        setOnAlertOk(() => onOk);
        setAlertVisible(true);
    };

    const saveCrop = async () => {
        const newErrors = {};

        if (!landId.trim()) newErrors.landId = true;
        if (!area.trim()) newErrors.area = true;
        if (!cropName.trim()) newErrors.cropName = true;

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setErrors({});

        try {
            const db = await getDb();
            const areaNum = parseFloat(area);

            if (existingCrop) {
                const result = await db.runAsync(
                    `UPDATE crops SET 
                    land_identifier = ?, total_area = ?, area_unit = ?, crop_name = ?, sowing_date = ?, 
                    variety = ?, soil_type = ?, expected_harvest_date = ?, previous_crop = ?
                    WHERE id = ?`,
                    [landId, areaNum, unit, cropName, sowDate, variety, soilType, expectedHarvest, prevCrop, existingCrop.id]
                );

                if (result.changes > 0) {
                    showAlert(t('success') || 'Success', t('cropUpdatedMsg') || 'Crop details updated!', () => navigation.goBack());
                }
            } else {
                const result = await db.runAsync(
                    `INSERT INTO crops 
            (land_identifier, total_area, area_unit, crop_name, sowing_date, variety, soil_type, expected_harvest_date, previous_crop) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [landId, areaNum, unit, cropName, sowDate, variety, soilType, expectedHarvest, prevCrop]
                );

                if (result.changes > 0) {
                    showAlert(t('success') || 'Success', t('cropCreatedMsg') || 'Crop cycle created!', () => navigation.goBack());
                }
            }
        } catch (error) {
            console.error('Save Crop Error:', error);
            showAlert(t('error') || 'Error', t('cropSaveErrorMsg') || 'Failed to save crop instance.');
        }
    };

    return (
        <ScrollView style={[styles.container, isDark && styles.containerDark]}>
            <Text style={[styles.label, isDark && styles.textDark]}>{t('landNickname')} *</Text>
            <TextInput
                style={[styles.input, isDark && styles.inputDark, errors.landId && styles.inputError]}
                placeholder="e.g., Gat No. 102"
                placeholderTextColor={isDark ? '#888' : '#999'}
                value={landId}
                onChangeText={(text) => { setLandId(text); setErrors({ ...errors, landId: false }); }}
            />
            {errors.landId && <Text style={styles.errorText}>{t('fieldRequired')}</Text>}

            <Text style={[styles.label, isDark && styles.textDark]}>{t('totalArea')} *</Text>
            <TextInput
                style={[styles.input, isDark && styles.inputDark, errors.area && styles.inputError]}
                placeholder="e.g., 5.5"
                placeholderTextColor={isDark ? '#888' : '#999'}
                keyboardType="numeric"
                value={area}
                onChangeText={(text) => { setArea(text); setErrors({ ...errors, area: false }); }}
            />
            {errors.area && <Text style={styles.errorText}>{t('fieldRequired')}</Text>}

            <CustomPicker
                label={t('areaUnit')}
                selectedValue={unit}
                onValueChange={setUnit}
                items={['Acres', 'Guntha', 'Hectares', 'Bigha']}
                isDark={isDark}
            />

            <Text style={[styles.label, isDark && styles.textDark]}>{t('cropName')} *</Text>
            <TextInput
                style={[styles.input, isDark && styles.inputDark, errors.cropName && styles.inputError]}
                placeholder="e.g., Sugarcane"
                placeholderTextColor={isDark ? '#888' : '#999'}
                value={cropName}
                onChangeText={(text) => { setCropName(text); setErrors({ ...errors, cropName: false }); }}
            />
            {errors.cropName && <Text style={styles.errorText}>{t('fieldRequired')}</Text>}

            <Text style={[styles.label, isDark && styles.textDark]}>{t('sowingDate')}</Text>
            <TouchableOpacity onPress={() => setShowSowDate(true)}>
                <View style={[styles.input, isDark && styles.inputDark]}>
                    <Text style={{ fontSize: 16, color: isDark ? '#E0E0E0' : '#000' }}>{sowDate}</Text>
                </View>
            </TouchableOpacity>
            {showSowDate && (
                <DateTimePicker
                    value={new Date(sowDate)}
                    mode="date"
                    display="default"
                    onChange={(event, selectedDate) => {
                        setShowSowDate(Platform.OS === 'ios');
                        if (selectedDate && event.type !== 'dismissed') {
                            setSowDate(selectedDate.toISOString().split('T')[0]);
                        }
                    }}
                />
            )}

            <Text style={[styles.label, isDark && styles.textDark]}>{t('seedVariety')}</Text>
            <TextInput
                style={[styles.input, isDark && styles.inputDark]}
                placeholder="e.g., Co 86032"
                placeholderTextColor={isDark ? '#888' : '#999'}
                value={variety}
                onChangeText={setVariety}
            />

            <CustomPicker
                label={t('soilType')}
                selectedValue={soilType}
                onValueChange={setSoilType}
                items={['Black', 'Red', 'Sandy', 'Loamy']}
                isDark={isDark}
            />

            <Text style={[styles.label, isDark && styles.textDark]}>{t('expectedHarvestDate')}</Text>
            <TouchableOpacity onPress={() => setShowExpectedHarvest(true)}>
                <View style={[styles.input, isDark && styles.inputDark]}>
                    <Text style={{ fontSize: 16, color: expectedHarvest ? (isDark ? '#E0E0E0' : '#000') : (isDark ? '#888' : '#888') }}>
                        {expectedHarvest || 'Select Date'}
                    </Text>
                </View>
            </TouchableOpacity>
            {showExpectedHarvest && (
                <DateTimePicker
                    value={expectedHarvest ? new Date(expectedHarvest) : new Date()}
                    mode="date"
                    display="default"
                    minimumDate={new Date()}
                    onChange={(event, selectedDate) => {
                        setShowExpectedHarvest(Platform.OS === 'ios');
                        if (selectedDate && event.type !== 'dismissed') {
                            setExpectedHarvest(selectedDate.toISOString().split('T')[0]);
                        }
                    }}
                />
            )}

            <Text style={[styles.label, isDark && styles.textDark]}>{t('previousCrop')}</Text>
            <TextInput
                style={[styles.input, isDark && styles.inputDark]}
                placeholder="e.g., Soyabean"
                placeholderTextColor={isDark ? '#888' : '#999'}
                value={prevCrop}
                onChangeText={setPrevCrop}
            />

            <TouchableOpacity style={[styles.saveBtn, isDark && styles.saveBtnDark]} onPress={saveCrop}>
                <Text style={styles.saveBtnText}>{existingCrop ? t('updateCropDetails') : t('createCropWorkspace')}</Text>
            </TouchableOpacity>

            <View style={{ height: 40 }} />

            <Modal
                animationType="fade"
                transparent={true}
                visible={alertVisible}
                onRequestClose={() => {
                    setAlertVisible(false);
                    if (onAlertOk) onAlertOk();
                }}
            >
                <View style={styles.centeredView}>
                    <View style={[styles.modalView, isDark && styles.modalViewDark]}>
                        <Text style={[styles.modalTitle, isDark && styles.textDark]}>{alertTitle}</Text>
                        <Text style={[styles.modalText, isDark && styles.textDark]}>{alertMessage}</Text>
                        <Pressable
                            style={[styles.modalButton]}
                            onPress={() => {
                                setAlertVisible(false);
                                if (onAlertOk) onAlertOk();
                            }}
                        >
                            <Text style={styles.modalButtonText}>{t('ok') || 'OK'}</Text>
                        </Pressable>
                    </View>
                </View>
            </Modal>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: '#FFF' },
    containerDark: { backgroundColor: '#1E1E1E' },
    sectionHeader: { fontSize: 18, fontWeight: 'bold', color: '#2E7D32', marginTop: 10, marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#E0E0E0', paddingBottom: 5 },
    sectionHeaderDark: { color: '#81C784', borderBottomColor: '#333' },
    label: { fontSize: 14, fontWeight: '600', color: '#555', marginBottom: 5 },
    textDark: { color: '#E0E0E0' },
    input: { borderWidth: 1, borderColor: '#CCC', borderRadius: 8, padding: 12, marginBottom: 15, fontSize: 16, color: '#000' },
    inputDark: { borderColor: '#444', backgroundColor: '#2C2C2C', color: '#FFF' },
    inputError: { borderColor: '#D32F2F', marginBottom: 5 },
    errorText: { color: '#D32F2F', fontSize: 12, marginBottom: 15, marginTop: -2 },

    pickerContainer: { marginBottom: 15 },
    pickerInner: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    pickerOpt: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, backgroundColor: '#F0F0F0', borderWidth: 1, borderColor: '#DDD' },
    pickerOptDark: { backgroundColor: '#333', borderColor: '#444' },
    pickerOptSel: { backgroundColor: '#FF8F00', borderColor: '#FF8F00' },
    pickerText: { color: '#555', fontSize: 14 },
    pickerTextSel: { color: '#FFF', fontWeight: 'bold' },

    saveBtn: { backgroundColor: '#2E7D32', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10 },
    saveBtnDark: { backgroundColor: '#388E3C' },
    saveBtnText: { color: 'white', fontWeight: 'bold', fontSize: 18 },

    centeredView: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)' },
    modalView: { margin: 20, backgroundColor: 'white', borderRadius: 15, padding: 25, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5, width: '80%' },
    modalViewDark: { backgroundColor: '#2C2C2C' },
    modalTitle: { marginBottom: 15, textAlign: 'center', fontSize: 20, fontWeight: 'bold', color: '#333' },
    modalText: { marginBottom: 25, textAlign: 'center', fontSize: 16, color: '#666', lineHeight: 22 },
    modalButton: { backgroundColor: '#1B5E20', borderRadius: 8, padding: 12, paddingHorizontal: 30, elevation: 2 },
    modalButtonText: { color: 'white', fontWeight: 'bold', textAlign: 'center', fontSize: 16 }
});

export default CreateCropScreen;
