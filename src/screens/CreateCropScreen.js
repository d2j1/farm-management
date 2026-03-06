import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Platform,
    Modal,
    Pressable,
    Image,
    TouchableWithoutFeedback,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { MaterialIcons } from '@expo/vector-icons';
import { getDb } from '../database/db';
import { useTranslation } from 'react-i18next';

const UNIT_OPTIONS = ['Acres', 'Guntha', 'Bigha', 'Hectare'];

// ─── Unit Dropdown ────────────────────────────────────────────────────────────
const UnitDropdown = ({ selectedValue, onValueChange }) => {
    const [open, setOpen] = useState(false);
    return (
        <>
            <TouchableOpacity
                onPress={() => setOpen(true)}
                className="h-12 w-28 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg flex-row items-center justify-between px-3"
            >
                <Text className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex-1" numberOfLines={1}>
                    {selectedValue}
                </Text>
                <MaterialIcons name="arrow-drop-down" size={22} color="#64748b" />
            </TouchableOpacity>

            <Modal transparent animationType="fade" visible={open} onRequestClose={() => setOpen(false)}>
                <TouchableWithoutFeedback onPress={() => setOpen(false)}>
                    <View className="flex-1 bg-black/30 justify-center items-center">
                        <TouchableWithoutFeedback onPress={() => { }}>
                            <View className="w-44 bg-white dark:bg-slate-800 rounded-xl overflow-hidden shadow-xl border border-slate-200 dark:border-slate-700">
                                {UNIT_OPTIONS.map((opt, idx) => (
                                    <TouchableOpacity
                                        key={opt}
                                        onPress={() => { onValueChange(opt); setOpen(false); }}
                                        className={`px-4 py-3.5 flex-row items-center justify-between ${idx !== UNIT_OPTIONS.length - 1 ? 'border-b border-slate-100 dark:border-slate-700' : ''
                                            } ${selectedValue === opt ? 'bg-primary/10' : ''}`}
                                    >
                                        <Text className={`text-sm font-medium ${selectedValue === opt ? 'text-primary font-bold' : 'text-slate-700 dark:text-slate-200'
                                            }`}>
                                            {opt}
                                        </Text>
                                        {selectedValue === opt && (
                                            <MaterialIcons name="check" size={16} color="#3ce619" />
                                        )}
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </>
    );
};

// ─── Chip Picker ──────────────────────────────────────────────────────────────
const ChipPicker = ({ selectedValue, onValueChange, items }) => (
    <View className="flex-row flex-wrap gap-2 mt-1">
        {items.map(item => (
            <TouchableOpacity
                key={item}
                onPress={() => onValueChange(item)}
                className={`px-4 py-2 rounded-full border ${selectedValue === item
                    ? 'bg-primary border-primary'
                    : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                    }`}
            >
                <Text
                    className={`text-sm font-medium ${selectedValue === item
                        ? 'text-slate-900 font-bold'
                        : 'text-slate-600 dark:text-slate-300'
                        }`}
                >
                    {item}
                </Text>
            </TouchableOpacity>
        ))}
    </View>
);

// ─── Field Label ──────────────────────────────────────────────────────────────
const FieldLabel = ({ children }) => (
    <Text className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 ml-0.5">
        {children}
    </Text>
);

// ─── Styled Input ─────────────────────────────────────────────────────────────
const StyledInput = ({ error, dim, ...props }) => (
    <TextInput
        className={`w-full rounded-lg py-3 px-4 text-base border ${error
            ? 'border-red-500 bg-red-50 dark:bg-slate-800'
            : dim
                ? 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
            } text-slate-900 dark:text-slate-100`}
        placeholderTextColor="#94a3b8"
        {...props}
    />
);

// ─── Main Screen ──────────────────────────────────────────────────────────────
const CreateCropScreen = ({ route, navigation }) => {
    const { t } = useTranslation();
    const existingCrop = route.params?.crop;

    // Primary fields
    const [landId, setLandId] = useState(existingCrop?.land_identifier || '');
    const [area, setArea] = useState(existingCrop?.total_area ? existingCrop.total_area.toString() : '');
    const [unit, setUnit] = useState(existingCrop?.area_unit || 'Acres');
    const [cropName, setCropName] = useState(existingCrop?.crop_name || '');
    const [sowDate, setSowDate] = useState(existingCrop?.sowing_date || '');
    const [showSowDate, setShowSowDate] = useState(false);
    const [errors, setErrors] = useState({});

    // Secondary fields
    const [variety, setVariety] = useState(existingCrop?.variety || '');
    const [soilType, setSoilType] = useState(existingCrop?.soil_type || '');
    const [expectedHarvest, setExpectedHarvest] = useState(existingCrop?.expected_harvest_date || '');
    const [showExpectedHarvest, setShowExpectedHarvest] = useState(false);
    const [prevCrop, setPrevCrop] = useState(existingCrop?.previous_crop || '');

    // Photo
    const [photoUri, setPhotoUri] = useState(existingCrop?.photo_uri || null);

    // Custom alert modal
    const [alertVisible, setAlertVisible] = useState(false);
    const [alertTitle, setAlertTitle] = useState('');
    const [alertMessage, setAlertMessage] = useState('');
    const [onAlertOk, setOnAlertOk] = useState(null);

    // Success modal (new crop)
    const [successVisible, setSuccessVisible] = useState(false);

    // Coming-soon modal (photo upload)
    const [comingSoonVisible, setComingSoonVisible] = useState(false);

    // Failure modal (crop creation failed)
    const [failVisible, setFailVisible] = useState(false);

    const showAlert = (title, message, onOk = null) => {
        setAlertTitle(title);
        setAlertMessage(message);
        setOnAlertOk(() => onOk);
        setAlertVisible(true);
    };

    const pickPhoto = () => {
        setComingSoonVisible(true);
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
                    setSuccessVisible(true);
                }
            }
        } catch (error) {
            console.error('Save Crop Error:', error);
            setFailVisible(true);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark" edges={['top']}>

            {/* ── Header ── */}
            <View className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-4 flex-row items-center justify-between">
                <TouchableOpacity onPress={() => navigation.goBack()} className="p-1 -ml-1">
                    <MaterialIcons name="arrow-back-ios-new" size={20} color="#64748b" />
                </TouchableOpacity>
                <Text className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                    {existingCrop ? t('editCrop') || 'Edit Crop' : t('createCrop') || 'Create Crop'}
                </Text>
                <View className="w-8" />
            </View>

            <ScrollView
                className="flex-1"
                contentContainerStyle={{ paddingBottom: 48 }}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* ── Photo Upload ── */}
                <View className="mt-6 px-4">
                    <TouchableOpacity
                        onPress={pickPhoto}
                        activeOpacity={0.8}
                        className="w-full bg-white dark:bg-slate-900 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl overflow-hidden shadow-sm"
                        style={{ aspectRatio: 16 / 9 }}
                    >
                        {photoUri ? (
                            <Image source={{ uri: photoUri }} className="w-full h-full" resizeMode="cover" />
                        ) : (
                            <View className="flex-1 items-center justify-center gap-2">
                                <View className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full items-center justify-center">
                                    <MaterialIcons name="add-a-photo" size={30} color="#94a3b8" />
                                </View>
                                <View className="items-center">
                                    <Text className="text-sm font-bold text-slate-700 dark:text-slate-200">Upload Crop Photo</Text>
                                    <Text className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">JPG, PNG up to 10MB</Text>
                                </View>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>

                {/* ── Essential Crop Data ── */}
                <View className="mt-8 px-4">
                    <View className="flex-row items-center justify-between mb-3 px-1">
                        <Text className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Essential Crop Data
                        </Text>
                        <Text className="text-[10px] font-bold text-primary uppercase">Required</Text>
                    </View>

                    <View className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm p-5 gap-5">

                        {/* Land Nickname */}
                        <View>
                            <FieldLabel>Land Nickname</FieldLabel>
                            <StyledInput
                                placeholder="e.g. North Field, Valley Farm"
                                value={landId}
                                onChangeText={text => { setLandId(text); setErrors({ ...errors, landId: false }); }}
                                error={errors.landId}
                            />
                            {errors.landId && (
                                <Text className="text-xs text-red-500 font-medium mt-1 ml-1">Land nickname is required</Text>
                            )}
                        </View>

                        {/* Total Area + Unit */}
                        <View>
                            <FieldLabel>Total Area</FieldLabel>
                            <View className="flex-row gap-2">
                                <View className="flex-1">
                                    <StyledInput
                                        placeholder="0.00"
                                        keyboardType="numeric"
                                        value={area}
                                        onChangeText={text => { setArea(text); setErrors({ ...errors, area: false }); }}
                                        error={errors.area}
                                    />
                                </View>
                                {/* Unit dropdown */}
                                <UnitDropdown selectedValue={unit} onValueChange={setUnit} />
                            </View>
                            {errors.area && (
                                <Text className="text-xs text-red-500 font-medium mt-1 ml-1">Area is required</Text>
                            )}
                        </View>

                        {/* Crop Name */}
                        <View>
                            <FieldLabel>Crop Name</FieldLabel>
                            <StyledInput
                                placeholder="e.g. Wheat, Maize"
                                value={cropName}
                                onChangeText={text => { setCropName(text); setErrors({ ...errors, cropName: false }); }}
                                error={errors.cropName}
                            />
                            {errors.cropName && (
                                <Text className="text-xs text-red-500 font-medium mt-1 ml-1">Crop name is required</Text>
                            )}
                        </View>

                        {/* Plantation / Sowing Date */}
                        <View>
                            <FieldLabel>Plantation or Sowing Date</FieldLabel>
                            <TouchableOpacity
                                onPress={() => setShowSowDate(true)}
                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-3 px-4 flex-row items-center justify-between"
                            >
                                <Text className={sowDate ? 'text-base text-slate-900 dark:text-slate-100' : 'text-base text-slate-400'}>
                                    {sowDate || 'Select date'}
                                </Text>
                                <MaterialIcons name="calendar-month" size={20} color="#94a3b8" />
                            </TouchableOpacity>
                            {showSowDate && (
                                <DateTimePicker
                                    value={sowDate ? new Date(sowDate) : new Date()}
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
                        </View>
                    </View>
                </View>

                {/* ── Optional Details ── */}
                <View className="mt-8 px-4">
                    <Text className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 px-1">
                        Optional Details
                    </Text>

                    <View className="bg-white/60 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm p-5 gap-5">

                        {/* Seed Variety */}
                        <View>
                            <FieldLabel>Seed Variety</FieldLabel>
                            <StyledInput
                                dim
                                placeholder="e.g. Durum, Hybrid 702"
                                value={variety}
                                onChangeText={setVariety}
                            />
                        </View>

                        {/* Soil Type */}
                        <View>
                            <FieldLabel>Soil Type</FieldLabel>
                            <ChipPicker
                                selectedValue={soilType}
                                onValueChange={setSoilType}
                                items={['Clay', 'Sandy', 'Loamy', 'Black Soil', 'Red Soil']}
                            />
                        </View>

                        {/* Expected Harvest Date */}
                        <View>
                            <FieldLabel>Expected Harvest Date</FieldLabel>
                            <TouchableOpacity
                                onPress={() => setShowExpectedHarvest(true)}
                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-3 px-4 flex-row items-center justify-between"
                            >
                                <Text className={expectedHarvest ? 'text-base text-slate-900 dark:text-slate-100' : 'text-base text-slate-400'}>
                                    {expectedHarvest || 'Select date'}
                                </Text>
                                <MaterialIcons name="event-available" size={20} color="#94a3b8" />
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
                        </View>

                        {/* Previous Crop */}
                        <View>
                            <FieldLabel>Previous Crop (Rotation)</FieldLabel>
                            <StyledInput
                                dim
                                placeholder="What was planted here before?"
                                value={prevCrop}
                                onChangeText={setPrevCrop}
                            />
                        </View>
                    </View>
                </View>

                {/* ── Submit Button ── */}
                <View className="mt-8 px-4 pb-4">
                    <TouchableOpacity
                        onPress={saveCrop}
                        activeOpacity={0.85}
                        className="w-full bg-primary rounded-xl py-4 flex-row items-center justify-center gap-2 shadow-lg"
                    >
                        <MaterialIcons name="task-alt" size={22} color="#0f172a" />
                        <Text className="text-slate-900 font-bold text-base">
                            {existingCrop ? t('updateCropDetails') || 'Update Crop' : 'Create Crop'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* ── Generic Alert Modal (errors, updates) ── */}
            <Modal
                animationType="fade"
                transparent
                visible={alertVisible}
                onRequestClose={() => {
                    setAlertVisible(false);
                    if (onAlertOk) onAlertOk();
                }}
            >
                <View className="flex-1 justify-center items-center bg-black/50">
                    <View className="w-4/5 bg-white dark:bg-slate-800 rounded-2xl p-6 items-center shadow-xl">
                        <Text className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-3 text-center">
                            {alertTitle}
                        </Text>
                        <Text className="text-sm text-slate-600 dark:text-slate-300 text-center mb-6 leading-5">
                            {alertMessage}
                        </Text>
                        <Pressable
                            onPress={() => {
                                setAlertVisible(false);
                                if (onAlertOk) onAlertOk();
                            }}
                            className="bg-primary px-8 py-3 rounded-lg"
                        >
                            <Text className="text-slate-900 font-bold text-sm">
                                {t('ok') || 'OK'}
                            </Text>
                        </Pressable>
                    </View>
                </View>
            </Modal>

            {/* ── Success Modal (new crop created) ── */}
            <Modal
                animationType="fade"
                transparent
                visible={successVisible}
                onRequestClose={() => {
                    setSuccessVisible(false);
                    navigation.goBack();
                }}
            >
                <View className="flex-1 justify-center items-center bg-black/60 px-4">
                    <View className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-xl p-8 items-center shadow-2xl border border-primary/10">
                        {/* Green check icon */}
                        <View className="mb-6 h-20 w-20 items-center justify-center rounded-full bg-primary/20">
                            <MaterialIcons name="check-circle" size={48} color="#3ce619" />
                        </View>
                        <Text className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2 text-center">
                            New Crop Added
                        </Text>
                        <Text className="text-base text-slate-600 dark:text-slate-400 text-center mb-8 leading-relaxed">
                            The crop has been successfully created and is now available in your active crops list for management.
                        </Text>
                        <Pressable
                            onPress={() => {
                                setSuccessVisible(false);
                                navigation.goBack();
                            }}
                            className="w-full bg-primary py-3.5 px-6 rounded-xl items-center shadow-lg"
                        >
                            <Text className="text-slate-900 font-bold text-base">Got it</Text>
                        </Pressable>
                    </View>
                </View>
            </Modal>

            {/* ── Coming Soon Modal (photo upload) ── */}
            <Modal
                animationType="fade"
                transparent
                visible={comingSoonVisible}
                onRequestClose={() => setComingSoonVisible(false)}
            >
                <View className="flex-1 justify-center items-center bg-black/50 px-4">
                    <View className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-2xl p-6 items-center shadow-xl">
                        <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                            <MaterialIcons name="construction" size={32} color="#f59e0b" />
                        </View>
                        <Text className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2 text-center">
                            Coming Soon
                        </Text>
                        <Text className="text-sm text-slate-600 dark:text-slate-300 text-center mb-6 leading-5">
                            This feature is not implemented yet. Stay tuned for upcoming updates!
                        </Text>
                        <Pressable
                            onPress={() => setComingSoonVisible(false)}
                            className="bg-primary px-8 py-3 rounded-xl"
                        >
                            <Text className="text-slate-900 font-bold text-sm">OK</Text>
                        </Pressable>
                    </View>
                </View>
            </Modal>

            {/* ── Failure Modal (crop creation failed) ── */}
            <Modal
                animationType="fade"
                transparent
                visible={failVisible}
                onRequestClose={() => setFailVisible(false)}
            >
                <View className="flex-1 justify-center items-center bg-black/60 px-4">
                    <View className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-xl p-8 items-center shadow-2xl border border-red-200 dark:border-red-900/30">
                        {/* Red error icon */}
                        <View className="mb-6 h-20 w-20 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                            <MaterialIcons name="error" size={48} color="#ef4444" />
                        </View>
                        <Text className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2 text-center">
                            Crop Creation Failed
                        </Text>
                        <Text className="text-base text-slate-600 dark:text-slate-400 text-center mb-8 leading-relaxed">
                            We encountered an issue while trying to create your crop. Please try again or contact support if the problem persists.
                        </Text>
                        <Pressable
                            onPress={() => setFailVisible(false)}
                            className="w-full bg-primary py-3.5 px-6 rounded-xl items-center shadow-lg"
                        >
                            <Text className="text-slate-900 font-bold text-base">Got it</Text>
                        </Pressable>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

export default CreateCropScreen;
