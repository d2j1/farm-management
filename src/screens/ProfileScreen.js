import React, { useState, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useLanguageStore } from '../utils/languageStore';
import { useDatabase } from '../database/DatabaseProvider';
import * as DocumentPicker from 'expo-document-picker';
import { generateCropDataCSV } from '../database/exportService';
import { importFromCSV } from '../database/importService';
import ExportModal from '../components/ExportModal';
import ImportModal from '../components/ImportModal';

// ─── Language options with native labels ──────────────────────
const LANGUAGES = [
  { id: 'en', label: 'English' },
  { id: 'hi', label: 'हिंदी' },
  { id: 'mr', label: 'मराठी' },
];

export default function ProfileScreen({ navigation }) {
  const { languageCode, setLanguage, t } = useLanguageStore();
  const db = useDatabase();
  const [exportModal, setExportModal] = useState({
    visible: false,
    status: 'exporting',
    progress: 0,
    fileUri: null
  });
  const [importModal, setImportModal] = useState({
    visible: false,
    status: 'importing',
    progress: 0
  });

  const isCancelledRef = useRef(false);
  const isImportCancelledRef = useRef(false);
  const isSharingRef = useRef(false);
  const intervalRef = useRef(null);
  const exportIdRef = useRef(0);
  const importIdRef = useRef(0);

  const handleExport = async () => {
    const currentExportId = ++exportIdRef.current;
    try {
      isCancelledRef.current = false;
      setExportModal({ visible: true, status: 'exporting', progress: 10, fileUri: null });

      if (intervalRef.current) clearInterval(intervalRef.current);
      // Simulate progress for better UX
      intervalRef.current = setInterval(() => {
        if (exportIdRef.current !== currentExportId) {
          clearInterval(intervalRef.current);
          return;
        }
        setExportModal(prev => ({
          ...prev,
          progress: prev.progress < 90 ? prev.progress + 10 : prev.progress
        }));
      }, 200);

      // 1. Generate CSV
      const csvData = await generateCropDataCSV(db, {
        isCancelled: () => isCancelledRef.current || exportIdRef.current !== currentExportId
      });
      
      if (isCancelledRef.current || exportIdRef.current !== currentExportId) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        return;
      }

      if (intervalRef.current) clearInterval(intervalRef.current);
      setExportModal(prev => ({ ...prev, progress: 100 }));

      // 2. Prepare file path
      const fileName = `farm_data_${new Date().toISOString().split('T')[0]}.csv`;
      const fileUri = `${FileSystem.cacheDirectory}${fileName}`;

      // 3. Write to file
      await FileSystem.writeAsStringAsync(fileUri, csvData, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      if (isCancelledRef.current || exportIdRef.current !== currentExportId) return;

      // 4. Update modal to success
      setExportModal({ 
        visible: true, 
        status: 'success', 
        progress: 100, 
        fileUri 
      });

    } catch (error) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      
      if (error.message === 'EXPORT_CANCELLED' || exportIdRef.current !== currentExportId) {
        console.log('Export operation aborted or replaced.');
        return;
      }

      console.error('Export failed:', error);
      setExportModal({ visible: true, status: 'error', progress: 0, fileUri: null });
    }
  };

  const cancelExport = () => {
    isCancelledRef.current = true;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setExportModal(prev => ({ ...prev, visible: false }));
  };

  const handleDownload = async () => {
    if (isSharingRef.current) return;
    
    try {
      isSharingRef.current = true;
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(exportModal.fileUri, {
          mimeType: 'text/csv',
          dialogTitle: t('exportCsv'),
          UTI: 'public.comma-separated-values-text',
        });
      } else {
        Alert.alert(t('error'), 'Sharing is not available on this device');
      }
    } catch (error) {
      console.error('Sharing failed:', error);
    } finally {
      isSharingRef.current = false;
      setExportModal(prev => ({ ...prev, visible: false }));
    }
  };

  const handleImport = async () => {
    // Guard against multiple concurrent imports
    if (importModal.visible) {
      console.log('Import already in progress, ignoring request.');
      return;
    }

    const currentImportId = ++importIdRef.current;
    console.log(`Starting import flow (ID: ${currentImportId})...`);
    
    try {
      // 1. Pick File
      const result = await DocumentPicker.getDocumentAsync({
        type: 'text/comma-separated-values',
        copyToCacheDirectory: true
      });

      if (result.canceled) {
        console.log('File picking canceled.');
        return;
      }

      console.log('File picked, reading content...');
      isImportCancelledRef.current = false;
      setImportModal({ visible: true, status: 'importing', progress: 0 });

      // 2. Read file content
      const fileUri = result.assets[0].uri;
      const csvString = await FileSystem.readAsStringAsync(fileUri);
      console.log(`CSV read successful (${csvString.length} chars). Starting database import...`);

      // 3. Import data
      await importFromCSV(db, csvString, {
        isCancelled: () => {
          const cancelled = isImportCancelledRef.current || importIdRef.current !== currentImportId;
          if (cancelled) {
            console.log(`[ProfileScreen] isCancelled callback returning TRUE (Reason: ${isImportCancelledRef.current ? 'Manual' : 'Superseded'})`);
          }
          return cancelled;
        },
        onProgress: (progress) => {
          if (importIdRef.current === currentImportId) {
            setImportModal(prev => ({ ...prev, progress }));
          }
        }
      });

      if (importIdRef.current !== currentImportId) {
        console.log(`Import ID ${currentImportId} superseded by ${importIdRef.current}. skipping success.`);
        return;
      }

      if (isImportCancelledRef.current) {
        console.log(`Import ID ${currentImportId} was cancelled. Skipping success.`);
        return;
      }

      console.log(`Import ID ${currentImportId} successful!`);
      setImportModal({ visible: true, status: 'success', progress: 100 });
    } catch (error) {
      if (error.message === 'IMPORT_CANCELLED' || importIdRef.current !== currentImportId) {
        console.log(`Import operation ${currentImportId} aborted or replaced.`);
        return;
      }
      console.error(`Import ${currentImportId} failed:`, error);
      setImportModal({ visible: true, status: 'error', progress: 0 });
    }
  };

  const cancelImport = () => {
    console.log('Cancelling import...');
    isImportCancelledRef.current = true;
    setImportModal(prev => ({ ...prev, visible: false }));
  };

  return (
    <SafeAreaView className="flex-1 bg-background-light" edges={['top']}>
      {/* ─── Header ─────────────────────────────────── */}
      <View className="bg-white items-center justify-center py-5 border-b border-slate-100">
        <Text className="text-lg font-bold tracking-tight text-black">
          {t('profile')}
        </Text>
      </View>

      {/* ─── Scrollable content ─────────────────────── */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Account section ──────────────────────── */}
        <View className="mt-6">
          <Text className="px-4 text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">
            {t('account')}
          </Text>
          <View className="bg-white border border-slate-200 rounded-xl mx-4 overflow-hidden shadow-sm">
            <TouchableOpacity
              className="w-full flex-row items-center justify-between px-4 py-4"
              activeOpacity={0.7}
              onPress={() => navigation.navigate('UpdateProfile')}
            >
              <View className="flex-row items-center gap-4">
                <View className="h-10 w-10 items-center justify-center rounded-full bg-primary/20">
                  <MaterialIcons name="person" size={24} color="#166534" />
                </View>
                <Text className="text-base font-medium text-slate-900">
                  {t('manageProfile')}
                </Text>
              </View>
              <MaterialIcons name="chevron-right" size={26} color="#94a3b8" />
            </TouchableOpacity>
          </View>
        </View>

        {/* ─── Language section ─────────────────────── */}
        <View className="mt-8">
          <Text className="px-4 text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">
            {t('language')}
          </Text>
          <View className="bg-white border border-slate-200 rounded-xl mx-4 overflow-hidden shadow-sm">
            {LANGUAGES.map((lang, index) => {
              const isSelected = languageCode === lang.id;
              const label = lang.label;
              return (
                <TouchableOpacity
                  key={lang.id}
                  className={`w-full flex-row items-center justify-between px-4 py-4 ${
                    index !== 0 ? 'border-t border-slate-100' : ''
                  }`}
                  activeOpacity={0.7}
                  onPress={() => setLanguage(lang.id)}
                >
                  <View className="flex-row items-center gap-4">
                    <View className="h-10 w-10 items-center justify-center rounded-full bg-slate-100">
                      <MaterialIcons name="language" size={24} color="#475569" />
                    </View>
                    <Text className="text-base font-medium text-slate-900">
                      {label}
                    </Text>
                  </View>

                  {/* Radio indicator */}
                  <View
                    className={`h-5 w-5 rounded-full border-2 items-center justify-center ${
                      isSelected ? 'border-primary' : 'border-slate-300'
                    }`}
                  >
                    {isSelected && (
                      <View className="h-2.5 w-2.5 rounded-full bg-primary" />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ─── Data & Privacy section ──────────────── */}
        <View className="mt-8 px-4 mb-6">
          <Text className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">
            {t('dataPrivacy')}
          </Text>

          {/* Privacy notice card */}
          <View className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-4">
            <View className="flex-row gap-3">
              <MaterialIcons name="shield" size={24} color="#166534" />
              <Text className="text-sm leading-relaxed text-slate-700 flex-1">
                {t('privacyNotice')}
              </Text>
            </View>
          </View>

          {/* Action buttons */}
          <View className="gap-3">
            <TouchableOpacity
              className="w-full flex-row items-center justify-center gap-2 bg-white border border-slate-200 py-3.5 rounded-xl shadow-sm"
              activeOpacity={0.7}
              onPress={handleExport}
            >
              <MaterialIcons name="file-upload" size={24} color="#166534" />
              <Text className="text-base font-semibold text-slate-900">
                {t('exportCsv')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="w-full flex-row items-center justify-center gap-2 bg-white border border-slate-200 py-3.5 rounded-xl shadow-sm"
              activeOpacity={0.7}
              onPress={handleImport}
            >
              <MaterialIcons name="upload-file" size={24} color="#166534" />
              <Text className="text-base font-semibold text-slate-900">
                {t('importData')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <ExportModal
        visible={exportModal.visible}
        status={exportModal.status}
        progress={exportModal.progress}
        onCancel={cancelExport}
        onDownload={handleDownload}
        onRetry={handleExport}
        onClose={() => setExportModal(prev => ({ ...prev, visible: false }))}
      />

      <ImportModal
        visible={importModal.visible}
        status={importModal.status}
        progress={importModal.progress}
        onCancel={cancelImport}
        onRetry={handleImport}
        onClose={() => setImportModal(prev => ({ ...prev, visible: false }))}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 120,
  },
});




