import React, { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

import { useDatabase } from '../database/DatabaseProvider';
import { getCropById, updateCrop } from '../database/cropService';
import CropResultModal from '../components/CropResultModal';

function formatDate(date) {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

const AREA_UNIT_OPTIONS = [
  { label: 'Acre', value: 'Acre' },
  { label: 'Hectare', value: 'Hectare' },
  { label: 'Bigha', value: 'Bigha' },
  { label: 'Guntha', value: 'Guntha' },
  { label: 'Sq Ft', value: 'SqFt' },
];

const SOIL_TYPE_OPTIONS = [
  { label: 'Clay', value: 'clay' },
  { label: 'Sandy', value: 'sandy' },
  { label: 'Loamy', value: 'loamy' },
  { label: 'Black Soil', value: 'black' },
  { label: 'Red Soil', value: 'red' },
];

function SectionLabel({ children, required = false }) {
  return (
    <View className="flex-row items-center justify-between mb-3 px-1">
      <Text className="text-xs font-bold uppercase tracking-wider text-slate-500">
        {children}
      </Text>
      {required ? (
        <Text className="text-[10px] font-bold text-primary uppercase">Required</Text>
      ) : null}
    </View>
  );
}

function FieldLabel({ children, htmlRequired = false }) {
  return (
    <Text className="mb-1.5 ml-0.5 text-xs font-semibold uppercase text-slate-500">
      {children}
      {htmlRequired ? ' *' : ''}
    </Text>
  );
}

function DateInput({
  label,
  value,
  onChange,
  placeholder,
  iconName,
  minimumDate,
  maximumDate,
  inputClassName,
}) {
  const [showPicker, setShowPicker] = useState(false);

  const handleDateChange = (event, selectedDate) => {
    if (Platform.OS === 'android') setShowPicker(false);
    if (event?.type === 'dismissed') return;
    if (selectedDate) {
      onChange(selectedDate);
      if (Platform.OS === 'ios') setShowPicker(false);
    }
  };

  const displayText = value ? formatDate(value) : placeholder;

  return (
    <View>
      <FieldLabel>{label}</FieldLabel>
      <Pressable
        onPress={() => setShowPicker(true)}
        className={`h-14 flex-row items-center rounded-lg border py-3 pl-4 pr-4 ${inputClassName}`}
      >
        <Text
          className={`flex-1 text-base ${value ? 'text-slate-900' : 'text-slate-400'}`}
        >
          {displayText}
        </Text>
        <MaterialIcons
          name={iconName}
          size={20}
          color="#94a3b8"
        />
      </Pressable>

      {showPicker ? (
        <DateTimePicker
          value={value || new Date()}
          mode="date"
          display="default"
          onChange={handleDateChange}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
        />
      ) : null}
    </View>
  );
}

function SelectInput({
  label,
  value,
  onChange,
  options,
  placeholder,
  wrapperClassName,
  modalTitle,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find((option) => option.value === value);
  const displayText = selectedOption ? selectedOption.label : (placeholder || 'Select option');
  const isPlaceholder = !selectedOption;

  const handleSelect = (nextValue) => {
    onChange(nextValue);
    setIsOpen(false);
  };

  return (
    <>
      <View>
      {label ? <FieldLabel>{label}</FieldLabel> : null}
      <Pressable
        onPress={() => setIsOpen(true)}
        className={`relative h-14 flex-row items-center rounded-lg border border-slate-200 bg-slate-50 pl-4 pr-10 ${wrapperClassName || ''}`}
      >
        <Text
          className={`text-base ${isPlaceholder ? 'text-slate-400' : 'text-slate-900'}`}
          numberOfLines={1}
        >
          {displayText}
        </Text>

        <MaterialIcons
          name="keyboard-arrow-down"
          size={20}
          color="#94a3b8"
          style={styles.selectIcon}
          pointerEvents="none"
        />
      </Pressable>
      </View>

      <Modal visible={isOpen} transparent animationType="fade" onRequestClose={() => setIsOpen(false)}>
        <View className="flex-1 justify-end bg-black/40">
          <Pressable style={StyleSheet.absoluteFillObject} onPress={() => setIsOpen(false)} />

          <View className="rounded-t-3xl border border-slate-200 bg-background-light px-4 pb-8 pt-4">
            <View className="mb-4 items-center">
              <View className="h-1.5 w-12 rounded-full bg-slate-300" />
              <Text className="mt-3 text-base font-bold text-slate-900">
                {modalTitle || label || 'Select option'}
              </Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.selectOptionsList}>
              {options.map((option) => {
                const isActive = option.value === value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    activeOpacity={0.8}
                    onPress={() => handleSelect(option.value)}
                    className={`h-14 flex-row items-center justify-between rounded-xl border px-4 ${
                      isActive
                        ? 'border-primary/30 bg-primary/10'
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    <Text
                      className={`text-base ${isActive ? 'font-semibold text-slate-900' : 'text-slate-700'}`}
                    >
                      {option.label}
                    </Text>

                    {isActive ? (
                      <MaterialIcons name="check" size={20} color="#3ce619" />
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity
              className="mt-4 h-12 items-center justify-center rounded-xl border border-slate-200 bg-white"
              activeOpacity={0.8}
              onPress={() => setIsOpen(false)}
            >
              <Text className="text-sm font-semibold text-slate-600">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

/**
 * Parse a date string (ISO or locale) into a Date object.
 */
function parseDate(dateStr) {
  if (!dateStr) return null;
  if (dateStr instanceof Date) return dateStr;
  const d = new Date(dateStr);
  return Number.isNaN(d.getTime()) ? null : d;
}

export default function EditCropScreen({ navigation, route }) {
  const db = useDatabase();
  const cropDbId = route?.params?.cropDbId;

  const [loading, setLoading] = useState(true);
  const [resultModal, setResultModal] = useState({ visible: false, type: 'success' });
  const [fieldErrors, setFieldErrors] = useState({});

  const [landNickname, setLandNickname] = useState('');
  const [totalArea, setTotalArea] = useState('');
  const [areaUnit, setAreaUnit] = useState('Acre');
  const [cropName, setCropName] = useState('');
  const [plantingDate, setPlantingDate] = useState(null);

  const [seedVariety, setSeedVariety] = useState('');
  const [soilType, setSoilType] = useState('');
  const [harvestDate, setHarvestDate] = useState(null);
  const [previousCrop, setPreviousCrop] = useState('');

  // Load existing crop data
  useEffect(() => {
    (async () => {
      if (!cropDbId) return;
      try {
        const row = await getCropById(db, cropDbId);
        if (row) {
          setLandNickname(row.landNickname || '');
          setTotalArea(String(row.totalArea || ''));
          setAreaUnit(row.areaUnit || 'Acre');
          setCropName(row.cropName || '');
          setPlantingDate(parseDate(row.plantationDate));
          setSeedVariety(row.seedVariety || '');
          setSoilType(row.soilType || '');
          setHarvestDate(parseDate(row.expectedHarvestDate));
          setPreviousCrop(row.previousCrop || '');
        }
      } catch (err) {
        console.error('Failed to load crop for editing:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [db, cropDbId]);

  const textInputClassName = useMemo(
    () =>
      'h-14 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-900',
    [],
  );

  const clearError = (field) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleUpdateCrop = async () => {
    const areaValue = Number(totalArea);
    const errors = {};

    if (!landNickname.trim()) errors.landNickname = 'Land nickname is required';
    if (!totalArea.trim()) {
      errors.totalArea = 'Total area is required';
    } else if (Number.isNaN(areaValue) || areaValue <= 0) {
      errors.totalArea = 'Must be a number greater than zero';
    }
    if (!cropName.trim()) errors.cropName = 'Crop name is required';
    if (!plantingDate) errors.plantingDate = 'Planting date is required';

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});

    const cropPayload = {
      landNickname: landNickname.trim(),
      totalArea: areaValue,
      areaUnit,
      cropName: cropName.trim(),
      plantationDate: plantingDate,
      seedVariety: seedVariety.trim() || null,
      soilType: soilType || null,
      expectedHarvestDate: harvestDate,
      previousCrop: previousCrop.trim() || null,
    };

    try {
      await updateCrop(db, cropDbId, cropPayload);
      setResultModal({ visible: true, type: 'success' });
    } catch (err) {
      console.error('Failed to update crop:', err);
      setResultModal({ visible: true, type: 'error' });
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-background-light items-center justify-center" edges={['top']}>
        <Text className="text-slate-400">Loading…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background-light" edges={['top']}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View className="border-b border-slate-200 bg-white px-4 py-4">
          <View className="relative flex-row items-center justify-between">
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              activeOpacity={0.75}
              className="h-8 w-8 items-center justify-center"
            >
              <MaterialIcons name="arrow-back" size={22} color="#64748b" />
            </TouchableOpacity>
            <Text className="text-xl font-bold tracking-tight text-slate-900">
              Edit Crop
            </Text>
            <View className="w-8" />
          </View>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View className="mt-8 px-4">
            <SectionLabel required>Essential Crop Data</SectionLabel>
            <View className="gap-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <View>
                <FieldLabel htmlRequired>Land Nickname</FieldLabel>
                <TextInput
                  value={landNickname}
                  onChangeText={(t) => { setLandNickname(t); clearError('landNickname'); }}
                  placeholder="e.g. North Field, Valley Farm"
                  placeholderTextColor="#94a3b8"
                  className={`${textInputClassName} ${fieldErrors.landNickname ? 'border-red-400' : ''}`}
                />
                {fieldErrors.landNickname ? <Text className="mt-1 ml-1 text-xs text-red-500">{fieldErrors.landNickname}</Text> : null}
              </View>

              <View>
                <FieldLabel htmlRequired>Total Area</FieldLabel>
                <View className="flex-row gap-2">
                  <TextInput
                    value={totalArea}
                    onChangeText={(t) => { setTotalArea(t); clearError('totalArea'); }}
                    placeholder="0.00"
                    placeholderTextColor="#94a3b8"
                    keyboardType="decimal-pad"
                    className={`${textInputClassName} flex-1 ${fieldErrors.totalArea ? 'border-red-400' : ''}`}
                  />

                  <SelectInput
                    value={areaUnit}
                    onChange={setAreaUnit}
                    options={AREA_UNIT_OPTIONS}
                    wrapperClassName="w-32"
                    modalTitle="Select Area Unit"
                  />
                </View>
                {fieldErrors.totalArea ? <Text className="mt-1 ml-1 text-xs text-red-500">{fieldErrors.totalArea}</Text> : null}
              </View>

              <View>
                <FieldLabel htmlRequired>Crop Name</FieldLabel>
                <TextInput
                  value={cropName}
                  onChangeText={(t) => { setCropName(t); clearError('cropName'); }}
                  placeholder="e.g. Wheat, Maize"
                  placeholderTextColor="#94a3b8"
                  className={`${textInputClassName} ${fieldErrors.cropName ? 'border-red-400' : ''}`}
                />
                {fieldErrors.cropName ? <Text className="mt-1 ml-1 text-xs text-red-500">{fieldErrors.cropName}</Text> : null}
              </View>

              <View>
                <DateInput
                  label="Plantation or Sowing Date"
                  value={plantingDate}
                  onChange={(d) => { setPlantingDate(d); clearError('plantingDate'); }}
                  placeholder="Select date"
                  iconName="calendar-month"
                  maximumDate={new Date()}
                  inputClassName={`border-slate-200 bg-slate-50 ${fieldErrors.plantingDate ? 'border-red-400' : ''}`}
                />
                {fieldErrors.plantingDate ? <Text className="mt-1 ml-1 text-xs text-red-500">{fieldErrors.plantingDate}</Text> : null}
              </View>
            </View>
          </View>

          <View className="mt-8 px-4">
            <SectionLabel>Optional Details</SectionLabel>
            <View className="gap-5 rounded-xl border border-slate-200 bg-white/70 p-5 shadow-sm">
              <View>
                <FieldLabel>Seed Variety</FieldLabel>
                <TextInput
                  value={seedVariety}
                  onChangeText={setSeedVariety}
                  placeholder="e.g. Durum, Hybrid 702"
                  placeholderTextColor="#94a3b8"
                  className={textInputClassName}
                />
              </View>

              <SelectInput
                label="Soil Type"
                value={soilType}
                onChange={setSoilType}
                options={SOIL_TYPE_OPTIONS}
                placeholder="Select Soil Type"
                modalTitle="Select Soil Type"
              />

              <DateInput
                label="Expected Harvest Date"
                value={harvestDate}
                onChange={setHarvestDate}
                placeholder="Select date"
                iconName="event-available"
                minimumDate={plantingDate || undefined}
                inputClassName="border-slate-200 bg-slate-50"
              />

              <View>
                <FieldLabel>Previous Crop (Rotation)</FieldLabel>
                <TextInput
                  value={previousCrop}
                  onChangeText={setPreviousCrop}
                  placeholder="What was planted here before?"
                  placeholderTextColor="#94a3b8"
                  className={textInputClassName}
                />
              </View>
            </View>
          </View>

          <View className="mt-8 px-4 pb-12">
            <TouchableOpacity
              onPress={handleUpdateCrop}
              activeOpacity={0.9}
              className="h-14 w-full flex-row items-center justify-center gap-2 rounded-xl bg-primary shadow-lg"
              style={styles.saveButton}
            >
              <MaterialIcons name="save" size={22} color="#0f172a" />
              <Text className="text-base font-bold text-slate-900">Save Changes</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <CropResultModal
        visible={resultModal.visible}
        type={resultModal.type}
        title={resultModal.type === 'success' ? 'Crop Updated' : 'Update Failed'}
        message={resultModal.type === 'success'
          ? 'Your crop details have been updated successfully.'
          : 'We encountered an issue while updating your crop. Please try again.'}
        onDismiss={() => {
          setResultModal({ visible: false, type: resultModal.type });
          if (resultModal.type === 'success') {
            navigation.goBack();
          }
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 8,
  },
  selectOptionsList: {
    gap: 10,
  },
  selectIcon: {
    position: 'absolute',
    right: 10,
    top: '50%',
    marginTop: -10,
  },
  saveButton: {
    shadowColor: '#3ce619',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 5,
  },
});
