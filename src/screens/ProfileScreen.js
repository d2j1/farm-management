import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, useColorScheme, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { useTranslation } from 'react-i18next';
import { getDb } from '../database/db';
import useStore from '../store/useStore';

const ProfileScreen = ({ navigation }) => {
    const isDark = useColorScheme() === 'dark';
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
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={[styles.container, isDark && styles.containerDark]}>
                <Text style={[styles.label, isDark && styles.textDark]}>{t('fullName')}</Text>
                <TextInput style={[styles.input, isDark && styles.inputDark]} value={name} onChangeText={setName} placeholderTextColor={isDark ? '#888' : '#999'} placeholder={t('enterYourName')} />

                <Text style={[styles.label, isDark && styles.textDark]}>{t('villageName')}</Text>
                <TextInput style={[styles.input, isDark && styles.inputDark]} value={village} onChangeText={setVillage} placeholderTextColor={isDark ? '#888' : '#999'} placeholder={t('enterVillageName')} />

                <Text style={[styles.label, isDark && styles.textDark]}>{t('totalAcreage')}</Text>
                <TextInput style={[styles.input, isDark && styles.inputDark]} value={acreage} onChangeText={setAcreage} placeholderTextColor={isDark ? '#888' : '#999'} placeholder={t('enterAcreage')} keyboardType="numeric" />

                <Text style={[styles.label, isDark && styles.textDark]}>{t('activeCropsComma')}</Text>
                <TextInput style={[styles.input, isDark && styles.inputDark]} value={crops} onChangeText={setCrops} placeholderTextColor={isDark ? '#888' : '#999'} placeholder={t('enterCrops')} />

                <TouchableOpacity style={[styles.button, isDark && styles.btnDark]} onPress={saveProfile}>
                    <Text style={styles.buttonText}>{t('save')}</Text>
                </TouchableOpacity>
            </View>
        </TouchableWithoutFeedback>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: '#FFF' },
    containerDark: { backgroundColor: '#121212' },
    label: { fontSize: 16, fontWeight: '600', marginBottom: 5, color: '#333' },
    textDark: { color: '#E0E0E0' },
    input: { borderWidth: 1, borderColor: '#CCC', borderRadius: 8, padding: 12, marginBottom: 15, fontSize: 16 },
    inputDark: { borderColor: '#444', backgroundColor: '#1E1E1E', color: '#FFF' },
    button: { backgroundColor: '#2E7D32', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10 },
    btnDark: { backgroundColor: '#388E3C' },
    buttonText: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});

export default ProfileScreen;
