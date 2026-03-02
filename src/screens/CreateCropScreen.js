import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker'; // We need to install this or use built in approach. For now we use standard Picker if installed, or build a simple mock.
import { getDb } from '../database/db';

// Simple custom picker to avoid adding new dependencies right now
const CustomPicker = ({ label, selectedValue, onValueChange, items }) => (
    <View style={styles.pickerContainer}>
        <Text style={styles.label}>{label}</Text>
        <View style={styles.pickerInner}>
            {items.map(item => (
                <TouchableOpacity
                    key={item}
                    style={[styles.pickerOpt, selectedValue === item && styles.pickerOptSel]}
                    onPress={() => onValueChange(item)}
                >
                    <Text style={[styles.pickerText, selectedValue === item && styles.pickerTextSel]}>{item}</Text>
                </TouchableOpacity>
            ))}
        </View>
    </View>
);

const CreateCropScreen = ({ navigation }) => {
    // Primary
    const [landId, setLandId] = useState('');
    const [area, setArea] = useState('');
    const [unit, setUnit] = useState('Acres');
    const [cropName, setCropName] = useState('');
    const [sowDate, setSowDate] = useState(new Date().toISOString().split('T')[0]);
    const [showSowDate, setShowSowDate] = useState(false);

    // Secondary
    const [variety, setVariety] = useState('');
    const [soilType, setSoilType] = useState('Black');
    const [expectedHarvest, setExpectedHarvest] = useState('');
    const [showExpectedHarvest, setShowExpectedHarvest] = useState(false);
    const [prevCrop, setPrevCrop] = useState('');

    const saveCrop = async () => {
        if (!landId.trim() || !area.trim() || !cropName.trim()) {
            Alert.alert('Error', 'Land Nickname, Area, and Crop Name are mandatory.');
            return;
        }

        try {
            const db = await getDb();
            const result = await db.runAsync(
                `INSERT INTO crops 
        (land_identifier, total_area, area_unit, crop_name, sowing_date, variety, soil_type, expected_harvest_date, previous_crop) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [landId, parseFloat(area), unit, cropName, sowDate, variety, soilType, expectedHarvest, prevCrop]
            );

            if (result.changes > 0) {
                Alert.alert('Success', 'Crop cycle created!');
                navigation.goBack(); // Return to dashboard
            }
        } catch (error) {
            console.error('Save Crop Error:', error);
            Alert.alert('Error', 'Failed to create crop instance.');
        }
    };

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.sectionHeader}>Primary Details (Required)</Text>

            <Text style={styles.label}>Land Nickname</Text>
            <TextInput style={styles.input} placeholder="e.g., Gat No. 102" value={landId} onChangeText={setLandId} />

            <Text style={styles.label}>Total Area</Text>
            <TextInput style={styles.input} placeholder="e.g., 5.5" keyboardType="numeric" value={area} onChangeText={setArea} />

            <CustomPicker
                label="Area Unit"
                selectedValue={unit}
                onValueChange={setUnit}
                items={['Acres', 'Guntha', 'Hectares', 'Bigha']}
            />

            <Text style={styles.label}>Crop Name</Text>
            <TextInput style={styles.input} placeholder="e.g., Sugarcane" value={cropName} onChangeText={setCropName} />

            <Text style={styles.label}>Sowing / Planting Date</Text>
            <TouchableOpacity onPress={() => setShowSowDate(true)}>
                <View style={styles.input}>
                    <Text style={{ fontSize: 16 }}>{sowDate}</Text>
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

            <Text style={styles.sectionHeader}>Secondary Details (Optional)</Text>

            <Text style={styles.label}>Seed Variety</Text>
            <TextInput style={styles.input} placeholder="e.g., Co 86032" value={variety} onChangeText={setVariety} />

            <CustomPicker
                label="Soil Type"
                selectedValue={soilType}
                onValueChange={setSoilType}
                items={['Black', 'Red', 'Sandy', 'Loamy']}
            />

            <Text style={styles.label}>Expected Harvest Date</Text>
            <TouchableOpacity onPress={() => setShowExpectedHarvest(true)}>
                <View style={styles.input}>
                    <Text style={{ fontSize: 16, color: expectedHarvest ? '#000' : '#888' }}>
                        {expectedHarvest || 'Select Date'}
                    </Text>
                </View>
            </TouchableOpacity>
            {showExpectedHarvest && (
                <DateTimePicker
                    value={expectedHarvest ? new Date(expectedHarvest) : new Date()}
                    mode="date"
                    display="default"
                    onChange={(event, selectedDate) => {
                        setShowExpectedHarvest(Platform.OS === 'ios');
                        if (selectedDate && event.type !== 'dismissed') {
                            setExpectedHarvest(selectedDate.toISOString().split('T')[0]);
                        }
                    }}
                />
            )}

            <Text style={styles.label}>Previous Crop (Rotation Tracking)</Text>
            <TextInput style={styles.input} placeholder="e.g., Soyabean" value={prevCrop} onChangeText={setPrevCrop} />

            <TouchableOpacity style={styles.saveBtn} onPress={saveCrop}>
                <Text style={styles.saveBtnText}>Create Crop Workspace</Text>
            </TouchableOpacity>

            <View style={{ height: 40 }} />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: '#FFF' },
    sectionHeader: { fontSize: 18, fontWeight: 'bold', color: '#2E7D32', marginTop: 10, marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#E0E0E0', paddingBottom: 5 },
    label: { fontSize: 14, fontWeight: '600', color: '#555', marginBottom: 5 },
    input: { borderWidth: 1, borderColor: '#CCC', borderRadius: 8, padding: 12, marginBottom: 15, fontSize: 16 },

    pickerContainer: { marginBottom: 15 },
    pickerInner: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    pickerOpt: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, backgroundColor: '#F0F0F0', borderWidth: 1, borderColor: '#DDD' },
    pickerOptSel: { backgroundColor: '#FF8F00', borderColor: '#FF8F00' },
    pickerText: { color: '#555', fontSize: 14 },
    pickerTextSel: { color: '#FFF', fontWeight: 'bold' },

    saveBtn: { backgroundColor: '#2E7D32', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10 },
    saveBtnText: { color: 'white', fontWeight: 'bold', fontSize: 18 }
});

export default CreateCropScreen;
