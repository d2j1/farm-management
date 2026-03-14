import React from 'react';
import { Modal, View, Text, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useLanguageStore } from '../utils/languageStore';

/** @typedef {'importing' | 'success' | 'error'} ImportStatus */

/**
 * @typedef {Object} ImportModalProps
 * @property {boolean} visible
 * @property {ImportStatus} status
 * @property {number} [progress] - 0 to 100
 * @property {() => void} onCancel
 * @property {() => void} onRetry
 * @property {() => void} onClose
 */

/**
 * A modular import modal component designed with NativeWind.
 * @param {ImportModalProps} props
 */
export default function ImportModal({
  visible,
  status,
  progress = 0,
  onCancel,
  onRetry,
  onClose
}) {
  const { t } = useLanguageStore();

  const renderContent = () => {
    switch (status) {
      case 'importing':
        return (
          <View className="items-center p-8">
            <View className="mb-6 h-20 w-20 items-center justify-center rounded-full bg-primary/20">
              <MaterialIcons name="cloud-download" size={48} color="#166534" />
            </View>
            <Text className="text-2xl font-bold text-slate-900 dark:text-white mb-3 text-center">
              {t('importingData')}
            </Text>
            <Text className="text-slate-600 dark:text-slate-400 text-sm text-center leading-relaxed mb-8 px-2">
              {t('importingDescription')}
            </Text>
            
            {/* Progress Bar */}
            <View className="w-full space-y-2 mb-8">
              <View className="flex-row justify-between px-1 mb-1">
                <Text className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Uploading
                </Text>
                <Text className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {Math.round(progress)}%
                </Text>
              </View>
              <View className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <View 
                  className="h-full bg-primary rounded-full" 
                  style={{ 
                    width: `${progress}%`,
                    shadowColor: '#166534',
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.4,
                    shadowRadius: 12,
                    elevation: 5
                  }} 
                />
              </View>
            </View>

            <TouchableOpacity 
              onPress={onCancel}
              activeOpacity={0.7}
              className="w-full py-2 px-6"
            >
              <Text className="text-center text-slate-500 dark:text-slate-400 font-semibold">
                {t('cancel')}
              </Text>
            </TouchableOpacity>
          </View>
        );

      case 'success':
        return (
          <View className="items-center p-8">
            <View className="mb-6 h-20 w-20 items-center justify-center rounded-full bg-primary/20">
              <MaterialIcons name="check-circle" size={48} color="#166534" />
            </View>
            <Text className="text-2xl font-bold text-slate-900 dark:text-white mb-3 text-center leading-tight">
              {t('importSuccessTitle')}
            </Text>
            <Text className="text-slate-600 dark:text-slate-400 text-sm text-center leading-relaxed mb-8 px-2">
              {t('importSuccessDescription')}
            </Text>
            
            <TouchableOpacity 
              onPress={onClose}
              activeOpacity={0.98}
              className="w-full bg-primary py-4 px-6 rounded-xl shadow-lg"
              style={{ shadowColor: '#166534', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 5 }}
            >
              <Text className="text-center text-slate-900 font-bold text-base uppercase tracking-wide">
                {t('done')}
              </Text>
            </TouchableOpacity>
          </View>
        );

      case 'error':
        return (
          <View className="items-center p-8 text-center">
            <View className="mb-6 h-20 w-20 items-center justify-center rounded-full bg-red-100 text-red-500">
              <MaterialIcons name="error" size={48} color="#ef4444" />
            </View>
            <Text className="text-2xl font-bold text-slate-900 dark:text-white mb-3 tracking-tight">
              {t('importFailedTitle')}
            </Text>
            <Text className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-8 px-2">
              {t('importFailedDescription')}
            </Text>
            
            <TouchableOpacity 
              onPress={onRetry}
              activeOpacity={0.98}
              className="w-full bg-red-500 py-4 px-6 rounded-xl shadow-lg mb-4"
              style={{ shadowColor: '#ef4444', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 5 }}
            >
              <Text className="text-center text-white font-bold text-base">
                {t('tryAgain')}
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
        <View className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-white/20 dark:border-slate-800">
          {renderContent()}
        </View>
      </View>
    </Modal>
  );
}


