import React, { useMemo, useState } from 'react';
import {
  Alert,
  Image,
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
import * as ImagePicker from 'expo-image-picker';

function formatDate(date) {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

const AREA_UNIT_OPTIONS = [
  { label: 'Acres', value: 'acres' },
  { label: 'Hectare', value: 'hectare' },
  { label: 'Bigha', value: 'bigha' },
  { label: 'Guntha', value: 'guntha' },
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
      <Text className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
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
    <Text className="mb-1.5 ml-0.5 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
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
          className={`flex-1 text-base ${value ? 'text-slate-900 dark:text-slate-100' : 'text-slate-400 dark:text-slate-500'}`}
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
        className={`relative h-14 flex-row items-center rounded-lg border border-slate-200 bg-slate-50 pl-4 pr-10 dark:border-slate-700 dark:bg-slate-800 ${wrapperClassName || ''}`}
      >
        <Text
          className={`text-base ${isPlaceholder ? 'text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-slate-100'}`}
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

          <View className="rounded-t-3xl border border-slate-200 bg-background-light px-4 pb-8 pt-4 dark:border-slate-800 dark:bg-slate-900">
            <View className="mb-4 items-center">
              <View className="h-1.5 w-12 rounded-full bg-slate-300 dark:bg-slate-700" />
              <Text className="mt-3 text-base font-bold text-slate-900 dark:text-slate-100">
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
                        : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800'
                    }`}
                  >
                    <Text
                      className={`text-base ${isActive ? 'font-semibold text-slate-900 dark:text-slate-100' : 'text-slate-700 dark:text-slate-200'}`}
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
              className="mt-4 h-12 items-center justify-center rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800"
              activeOpacity={0.8}
              onPress={() => setIsOpen(false)}
            >
              <Text className="text-sm font-semibold text-slate-600 dark:text-slate-300">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

export default function CreateCropScreen({ navigation, route }) {
  const [photoUri, setPhotoUri] = useState('');

  const [landNickname, setLandNickname] = useState('');
  const [totalArea, setTotalArea] = useState('');
  const [areaUnit, setAreaUnit] = useState('acres');
  const [cropName, setCropName] = useState('');
  const [plantingDate, setPlantingDate] = useState(null);

  const [seedVariety, setSeedVariety] = useState('');
  const [soilType, setSoilType] = useState('');
  const [harvestDate, setHarvestDate] = useState(null);
  const [previousCrop, setPreviousCrop] = useState('');

  const textInputClassName = useMemo(
    () =>
      'h-14 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100',
    [],
  );

  const optionalInputClassName = useMemo(
    () =>
      'h-14 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100',
    [],
  );

  const pickCropPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('Permission required', 'Please allow photo library access to upload a crop image.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.85,
    });

    if (!result.canceled && result.assets?.length) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const handleCreateCrop = () => {
    const areaValue = Number(totalArea);

    if (!landNickname.trim() || !cropName.trim() || !plantingDate || !totalArea.trim()) {
      Alert.alert('Missing details', 'Please fill all required crop fields before creating the record.');
      return;
    }

    if (Number.isNaN(areaValue) || areaValue <= 0) {
      Alert.alert('Invalid area', 'Total area must be a valid number greater than zero.');
      return;
    }

    const cropPayload = {
      photoUri,
      landNickname: landNickname.trim(),
      totalArea: areaValue,
      areaUnit,
      cropName: cropName.trim(),
      plantingDate,
      seedVariety: seedVariety.trim(),
      soilType,
      harvestDate,
      previousCrop: previousCrop.trim(),
    };

    route.params?.onCreate?.(cropPayload);

    Alert.alert('Crop created', 'Your crop record has been created successfully.', [
      {
        text: 'OK',
        onPress: () => navigation.goBack(),
      },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark" edges={['top']}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View className="border-b border-slate-200 bg-white px-4 py-4 dark:border-slate-800 dark:bg-slate-900">
          <View className="relative flex-row items-center justify-between">
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              activeOpacity={0.75}
              className="h-8 w-8 items-center justify-center"
            >
              <MaterialIcons name="arrow-back" size={22} color="#64748b" />
            </TouchableOpacity>
            <Text className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Create Crop
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
          <View className="mt-6 px-4">
            <TouchableOpacity
              onPress={pickCropPhoto}
              activeOpacity={0.9}
              className="relative w-full items-center justify-center gap-2 overflow-hidden rounded-2xl border-2 border-dashed border-slate-300 bg-white px-4 py-6 dark:border-slate-700 dark:bg-slate-900"
              style={styles.photoUploadArea}
            >
              {photoUri ? (
                <>
                  <Image source={{ uri: photoUri }} style={styles.photoPreview} resizeMode="cover" />
                  <View className="absolute inset-0 items-center justify-center bg-black/30">
                    <MaterialIcons name="add-a-photo" size={30} color="#f8fafc" />
                    <Text className="mt-2 text-sm font-bold text-white">Change Crop Photo</Text>
                  </View>
                </>
              ) : (
                <>
                  <View className="h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                    <MaterialIcons name="add-a-photo" size={34} color="#94a3b8" />
                  </View>
                  <View className="items-center">
                    <Text className="text-sm font-bold text-slate-700 dark:text-slate-200">
                      Upload Crop Photo
                    </Text>
                    <Text className="text-xs text-slate-500">JPG, PNG up to 10MB</Text>
                  </View>
                </>
              )}
            </TouchableOpacity>
          </View>

          <View className="mt-8 px-4">
            <SectionLabel required>Essential Crop Data</SectionLabel>
            <View className="gap-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <View>
                <FieldLabel htmlRequired>Land Nickname</FieldLabel>
                <TextInput
                  value={landNickname}
                  onChangeText={setLandNickname}
                  placeholder="e.g. North Field, Valley Farm"
                  placeholderTextColor="#94a3b8"
                  className={textInputClassName}
                />
              </View>

              <View>
                <FieldLabel htmlRequired>Total Area</FieldLabel>
                <View className="flex-row gap-2">
                  <TextInput
                    value={totalArea}
                    onChangeText={setTotalArea}
                    placeholder="0.00"
                    placeholderTextColor="#94a3b8"
                    keyboardType="decimal-pad"
                    className={`${textInputClassName} flex-1`}
                  />

                  <SelectInput
                    value={areaUnit}
                    onChange={setAreaUnit}
                    options={AREA_UNIT_OPTIONS}
                    wrapperClassName="w-32"
                    modalTitle="Select Area Unit"
                  />
                </View>
              </View>

              <View>
                <FieldLabel htmlRequired>Crop Name</FieldLabel>
                <TextInput
                  value={cropName}
                  onChangeText={setCropName}
                  placeholder="e.g. Wheat, Maize"
                  placeholderTextColor="#94a3b8"
                  className={textInputClassName}
                />
              </View>

              <DateInput
                label="Plantation or Sowing Date"
                value={plantingDate}
                onChange={setPlantingDate}
                placeholder="Select date"
                iconName="calendar-month"
                maximumDate={new Date()}
                inputClassName="border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800"
              />
            </View>
          </View>

          <View className="mt-8 px-4">
            <SectionLabel>Optional Details</SectionLabel>
            <View className="gap-5 rounded-xl border border-slate-200 bg-white/70 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
              <View>
                <FieldLabel>Seed Variety</FieldLabel>
                <TextInput
                  value={seedVariety}
                  onChangeText={setSeedVariety}
                  placeholder="e.g. Durum, Hybrid 702"
                  placeholderTextColor="#94a3b8"
                  className={optionalInputClassName}
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
                inputClassName="border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800"
              />

              <View>
                <FieldLabel>Previous Crop (Rotation)</FieldLabel>
                <TextInput
                  value={previousCrop}
                  onChangeText={setPreviousCrop}
                  placeholder="What was planted here before?"
                  placeholderTextColor="#94a3b8"
                  className={optionalInputClassName}
                />
              </View>
            </View>
          </View>

          <View className="mt-8 px-4 pb-12">
            <TouchableOpacity
              onPress={handleCreateCrop}
              activeOpacity={0.9}
              className="h-14 w-full flex-row items-center justify-center gap-2 rounded-xl bg-primary shadow-lg"
              style={styles.createButton}
            >
              <MaterialIcons name="task-alt" size={22} color="#0f172a" />
              <Text className="text-base font-bold text-slate-900">Create Crop Record</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 8,
  },
  photoUploadArea: {
    aspectRatio: 16 / 9,
  },
  photoPreview: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
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
  createButton: {
    shadowColor: '#3ce619',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 5,
  },
});
