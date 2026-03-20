import React from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useLanguageStore } from '../utils/languageStore';

/**
 * Reusable "Coming Soon" popup modal.
 *
 * @param {Object}   props
 * @param {boolean}  props.visible    – Whether the modal is visible
 * @param {Function} props.onClose    – Called when the user taps "Got it"
 * @param {string}   [props.title]    – Optional custom title
 * @param {string}   [props.message]  – Optional custom message
 */
export default function ComingSoonModal({
  visible,
  onClose,
  title,
  message,
}) {
  const { t } = useLanguageStore();

  const displayTitle = title || t('comingSoonTitle');
  const displayMessage = message || t('comingSoonMessage');

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      {/* Backdrop */}
      <View className="flex-1 items-center justify-center bg-black/60 px-4">
        {/* Card */}
        <View className="w-full max-w-sm bg-white rounded-xl shadow-2xl overflow-hidden items-center p-8 border border-primary/10">
          {/* Icon */}
          <View className="mb-6 h-20 w-20 items-center justify-center rounded-full bg-primary/20">
            <MaterialIcons name="auto-awesome" size={44} color="#166534" />
          </View>

          {/* Title */}
          <Text className="text-2xl font-bold text-slate-900 mb-4 text-center">
            {displayTitle}
          </Text>

          {/* Description */}
          <Text className="text-base leading-relaxed text-slate-600 mb-8 px-2 text-center">
            {displayMessage}
          </Text>

          {/* CTA */}
          <TouchableOpacity
            className="w-full bg-primary py-3.5 px-6 rounded-xl shadow-lg items-center"
            activeOpacity={0.85}
            onPress={onClose}
          >
            <Text className="text-white font-bold text-base">{t('gotIt')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}


