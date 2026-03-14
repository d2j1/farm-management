import React from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

/**
 * Reusable "Coming Soon" popup modal.
 *
 * @param {Object}   props
 * @param {boolean}  props.visible    – Whether the modal is visible
 * @param {Function} props.onClose    – Called when the user taps "Got it"
 * @param {string}   [props.title]    – Optional custom title  (default: "Feature Coming Soon!")
 * @param {string}   [props.message]  – Optional custom message
 */
export default function ComingSoonModal({
  visible,
  onClose,
  title = 'Feature Coming Soon!',
  message = "We're constantly improving our app! This feature is under development and will be available soon. Stay tuned for updates!",
}) {
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
            {title}
          </Text>

          {/* Description */}
          <Text className="text-base leading-relaxed text-slate-600 mb-8 px-2 text-center">
            {message}
          </Text>

          {/* CTA */}
          <TouchableOpacity
            className="w-full bg-primary py-3.5 px-6 rounded-xl shadow-lg items-center"
            activeOpacity={0.85}
            onPress={onClose}
          >
            <Text className="text-white font-bold text-base">Got it</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}


