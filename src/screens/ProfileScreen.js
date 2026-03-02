import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { getDb } from '../database/db';
import useStore from '../store/useStore';

const ProfileScreen = ({ navigation }) => {
    const { t } = useTranslation();
    const setFarmProfile = useStore(state => state.setFarmProfile);

    const [name, setName] = useState('');
    const [village, setVillage] = useState('');
    const [acreage, setAcreage] = useState('');
    const [crops, setCrops] = useState('');

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const db = await getDb();
            const allRows = await db.getAllAsync('SELECT * FROM profile LIMIT 1');
            if (allRows.length > 0) {
                const p = allRows[0];
                setName(p.name);
                setVillage(p.village || '');
                setAcreage(p.acreage ? p.acreage.toString() : '');
                setCrops(p.crops || '');
            }
        } catch (error) {
            console.error('Error loading profile:', error);
        }
    };

    const saveProfile = async () => {
        if (!name.trim()) {
            Alert.alert('Error', 'Name is required');
            return;
        }

        try {
            const db = await getDb();
            // Clear old profile - assuming 1 local profile per app install
            await db.runAsync('DELETE FROM profile');

            const result = await db.runAsync(
                'INSERT INTO profile (name, village, acreage, crops) VALUES (?, ?, ?, ?)',
                [name, village, acreage ? parseFloat(acreage) : 0, crops]
            );

            if (result.changes > 0) {
                const newProfile = { name, village, acreage, crops };
                setFarmProfile(newProfile);
                Alert.alert('Success', 'Profile saved successfully!');
                navigation.goBack();
            }
        } catch (error) {
            console.error('Error saving profile:', error);
            Alert.alert('Error', 'Failed to save profile');
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Enter your name" />

            <Text style={styles.label}>Village Name</Text>
            <TextInput style={styles.input} value={village} onChangeText={setVillage} placeholder="e.g. Shirpur" />

            <Text style={styles.label}>Total Acreage</Text>
            <TextInput style={styles.input} value={acreage} onChangeText={setAcreage} placeholder="e.g. 5.5" keyboardType="numeric" />

            <Text style={styles.label}>Active Crops (Comma Separated)</Text>
            <TextInput style={styles.input} value={crops} onChangeText={setCrops} placeholder="e.g. Sugarcane, Onion" />

            <TouchableOpacity style={styles.button} onPress={saveProfile}>
                <Text style={styles.buttonText}>{t('save')}</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: '#FFF' },
    label: { fontSize: 16, fontWeight: '600', marginBottom: 5, color: '#333' },
    input: { borderWidth: 1, borderColor: '#CCC', borderRadius: 8, padding: 12, marginBottom: 15, fontSize: 16 },
    button: { backgroundColor: '#2E7D32', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10 },
    buttonText: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});

export default ProfileScreen;
