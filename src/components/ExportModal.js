import React from 'react';
import { Modal, View, Text, TouchableOpacity, ViewProps } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useLanguageStore } from '../utils/languageStore';

/** @typedef {'exporting' | 'success' | 'error'} ExportStatus */

/**
 * @typedef {Object} ExportModalProps
 * @property {boolean} visible
 * @property {ExportStatus} status
 * @property {number} [progress] - 0 to 100
 * @property {() => void} onCancel
 * @property {() => void} onDownload
 * @property {() => void} onRetry
 * @property {() => void} onClose
 */

/**
 * A modular export modal component designed with NativeWind.
 * @param {ExportModalProps} props
 */
export default function ExportModal({
  visible,
  status,
  progress = 0,
  onCancel,
  onDownload,
  onRetry,
  onClose
}) {
  const { t } = useLanguageStore();

  const renderContent = () => {
    switch (status) {
      case 'exporting':
        return (
          <View className="items-center p-8">
            <View className="mb-6 h-20 w-20 items-center justify-center rounded-full bg-primary/20">
              <MaterialIcons name="cloud-upload" size={48} color="#3ce619" />
            </View>
            <Text className="text-2xl font-bold text-slate-900 mb-3">
              {t('exportingData')}
            </Text>
            <Text className="text-slate-600 text-sm text-center leading-relaxed mb-8 px-2">
              {t('exportingDescription')}
            </Text>
            
            {/* Progress Bar */}
            <View className="w-full space-y-2 mb-8">
              <View className="flex-row justify-between px-1 mb-1">
                <Text className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {t('processing')}
                </Text>
                <Text className="text-xs font-semibold text-slate-500">
                  {Math.round(progress)}%
                </Text>
              </View>
              <View className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <View 
                  className="h-full bg-primary rounded-full shadow-sm" 
                  style={{ width: `${progress}%` }} 
                />
              </View>
            </View>

            <TouchableOpacity 
              onPress={onCancel}
              activeOpacity={0.7}
              className="w-full py-2 px-6"
            >
              <Text className="text-center text-slate-500 font-semibold">
                {t('cancel')}
              </Text>
            </TouchableOpacity>
          </View>
        );

      case 'success':
        return (
          <View className="items-center p-8">
            <View className="mb-6 h-20 w-20 items-center justify-center rounded-full bg-primary/20">
              <MaterialIcons name="check-circle" size={48} color="#3ce619" />
            </View>
            <Text className="text-2xl font-bold text-slate-900 mb-3 text-center px-4 leading-tight">
              {t('exportSuccessTitle')}
            </Text>
            <Text className="text-slate-600 text-sm text-center leading-relaxed mb-10 px-2">
              {t('exportSuccessDescription')}
            </Text>
            
            <TouchableOpacity 
              onPress={onDownload}
              activeOpacity={0.8}
              className="w-full bg-primary py-4 px-6 rounded-xl shadow-lg mb-4"
              style={{ shadowColor: '#3ce619', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 5 }}
            >
              <Text className="text-center text-slate-900 font-bold text-base">
                {t('downloadData')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={onClose}
              className="w-full py-2 px-6"
            >
              <Text className="text-center text-slate-500 font-semibold">
                {t('cancel')}
              </Text>
            </TouchableOpacity>
          </View>
        );

      case 'error':
        return (
          <View className="items-center p-8">
            <View className="mb-6 h-24 w-24 items-center justify-center rounded-full bg-red-100">
              <MaterialIcons name="error" size={60} color="#ef4444" />
            </View>
            <Text className="text-2xl font-bold text-slate-900 mb-3 tracking-tight">
              {t('exportFailedTitle')}
            </Text>
            <Text className="text-slate-600 text-base text-center leading-relaxed mb-10 px-2">
              {t('exportFailedDescription')}
            </Text>
            
            <TouchableOpacity 
              onPress={onRetry}
              activeOpacity={0.8}
              className="w-full bg-red-500 py-4 px-6 rounded-2xl shadow-lg mb-4"
              style={{ shadowColor: '#ef4444', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 5 }}
            >
              <Text className="text-center text-white font-bold text-lg h-[28px]">
                {t('tryAgain')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={onClose}
              className="w-full py-2 px-6"
            >
              <Text className="text-center text-slate-500 font-semibold">
                {t('cancel')}
              </Text>
            </TouchableOpacity>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 items-center justify-center bg-black/60 px-6">
        <View className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden border border-white/20">
          {renderContent()}
        </View>
      </View>
    </Modal>
  );
}
