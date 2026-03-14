import React from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useLanguageStore } from '../utils/languageStore';

export function DeleteCropConfirmModal({ visible, isDeletingCrop, onConfirm, onCancel }) {
  const { t } = useLanguageStore();

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View
        className="flex-1 items-center justify-center p-4"
        style={styles.deleteOverlay}
      >
        <Pressable
          style={StyleSheet.absoluteFillObject}
          onPress={() => { if (!isDeletingCrop) onCancel(); }}
        />

        <View
          className="w-full items-center border border-slate-100 bg-white p-8"
          style={styles.deleteConfirmCard}
        >
          <View
            className="mb-6 h-20 w-20 items-center justify-center rounded-full"
            style={{ backgroundColor: 'rgba(239,68,68,0.1)' }}
          >
            <MaterialIcons name="delete-forever" size={48} color="#ef4444" />
          </View>

          <Text className="mb-2 text-center text-2xl font-bold text-slate-900">
            {t('deleteCropTitle')}
          </Text>

          <Text
            className="mb-8 px-2 text-center text-base text-slate-600"
            style={{ lineHeight: 26 }}
          >
            {t('deleteCropConfirmMsg')}
          </Text>

          <View className="w-full">
            <TouchableOpacity
              className="mb-3 w-full items-center justify-center px-6 py-4"
              activeOpacity={0.88}
              disabled={isDeletingCrop}
              onPress={onConfirm}
              style={styles.destructiveButtonShadow}
            >
              {isDeletingCrop ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text className="text-base font-bold text-white">{t('deleteBtn')}</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              className="w-full items-center justify-center bg-slate-100 px-6 py-4"
              activeOpacity={0.8}
              disabled={isDeletingCrop}
              onPress={onCancel}
              style={styles.cancelButton}
            >
              <Text className="text-base font-semibold text-slate-600">{t('cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export function DeleteCropSuccessModal({ visible, onDismiss }) {
  const { t } = useLanguageStore();

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View className="flex-1 items-center justify-center bg-background-dark/60 px-4">
        <View className="w-full max-w-sm items-center overflow-hidden rounded-2xl border border-primary/10 bg-white p-8 shadow-2xl">
          <View className="mb-6 h-20 w-20 items-center justify-center rounded-full bg-primary/20">
            <MaterialIcons name="check-circle" size={52} color="#166534" />
          </View>

          <Text className="mb-2 text-center text-2xl font-bold text-slate-900">
            {t('deleteCropSuccessTitle')}
          </Text>
          <Text className="mb-8 px-2 text-center text-base leading-relaxed text-slate-600">
            {t('deleteCropSuccessMsg')}
          </Text>

          <TouchableOpacity
            className="w-full items-center justify-center rounded-xl bg-primary px-6 py-4"
            activeOpacity={0.9}
            onPress={onDismiss}
            style={{
              shadowColor: '#166534',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.2,
              shadowRadius: 14,
              elevation: 8,
            }}
          >
            <Text className="text-base font-bold text-white">{t('gotIt')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  deleteOverlay: {
    backgroundColor: 'rgba(20, 33, 17, 0.6)',
  },
  deleteConfirmCard: {
    maxWidth: 384,
    borderRadius: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.25,
    shadowRadius: 25,
    elevation: 20,
  },
  destructiveButtonShadow: {
    backgroundColor: '#ef4444',
    borderRadius: 16,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 7,
  },
  cancelButton: {
    borderRadius: 16,
  },
});


