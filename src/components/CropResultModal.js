import React from 'react';
import { Modal, Pressable, Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useLanguageStore } from '../utils/languageStore';

/**
 * Full-screen overlay modal shown after crop operations.
 *
 * @param {Object}   props
 * @param {boolean}  props.visible       - Whether the modal is shown
 * @param {'success'|'error'} props.type - Controls icon, default title & message
 * @param {'center'|'bottom'} props.variant - Layout variant (bottom sheet or centered card)
 * @param {string}   [props.title]       - Override the default title
 * @param {string}   [props.message]     - Override the default message
 * @param {string}   [props.buttonText]  - Override the default button text
 * @param {() => void} props.onDismiss   - Called when the button is pressed
 */
export default function CropResultModal({
  visible,
  type = 'success',
  variant = 'center',
  title: titleOverride,
  message: messageOverride,
  buttonText,
  onDismiss,
}) {
  const { t } = useLanguageStore();
  const isSuccess = type === 'success';

  const iconName = isSuccess ? 'check-circle' : 'error';
  const iconColor = isSuccess ? '#3ce619' : '#ef4444';
  const iconBg = isSuccess ? (variant === 'bottom' ? 'bg-primary/10' : 'bg-primary/20') : 'bg-red-100';

  const title = titleOverride || (isSuccess ? t('cropCreated') : t('cropCreationFailed'));
  const message = messageOverride || (isSuccess
    ? t('cropCreateSuccess')
    : t('cropCreateError'));

  const btnText = buttonText || t('gotIt');

  if (variant === 'bottom') {
    return (
      <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
        <View className="flex-1 justify-center p-4 bg-black/60 flex items-center">
          <Pressable
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            onPress={onDismiss}
          />
          <View className="w-full max-w-sm bg-white rounded-xl shadow-2xl overflow-hidden pb-4 border border-primary/10">
            <View className="flex h-5 w-full items-center justify-center mt-2">
              <View className="h-1 w-9 rounded-full bg-slate-200" />
            </View>
            <View className="px-8 pb-4 pt-2 flex flex-col items-center text-center">
              <View className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 ${iconBg}`}>
                <MaterialIcons name={iconName} size={48} color={iconColor} />
              </View>
              <Text className="text-slate-900 text-2xl font-bold leading-tight mb-3 text-center">
                {title}
              </Text>
              <Text className="text-slate-600 text-base font-normal leading-relaxed mb-8 text-center">
                {message}
              </Text>
              <TouchableOpacity
                onPress={onDismiss}
                activeOpacity={0.9}
                className="w-full h-14 bg-primary items-center justify-center rounded-xl shadow-lg"
                style={{
                  shadowColor: '#3ce619',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.2,
                  shadowRadius: 8,
                  elevation: 5,
                }}
              >
                <Text className="text-slate-950 text-lg font-bold">{btnText}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View className="flex-1 items-center justify-center bg-black/60 px-4">
        <Pressable
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          onPress={onDismiss}
        />
        <View className="w-full max-w-sm items-center overflow-hidden rounded-xl border border-primary/10 bg-white p-8 shadow-2xl">
          <View className={`mb-6 h-20 w-20 items-center justify-center rounded-full ${iconBg}`}>
            <MaterialIcons name={iconName} size={48} color={iconColor} />
          </View>
          <Text className="mb-2 text-center text-2xl font-bold text-slate-900">
            {title}
          </Text>
          <Text className="mb-8 text-center text-base leading-relaxed text-slate-600">
            {message}
          </Text>
          <TouchableOpacity
            onPress={onDismiss}
            activeOpacity={0.9}
            className="h-14 w-full items-center justify-center rounded-xl bg-primary shadow-lg"
            style={{
              shadowColor: '#3ce619',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 8,
              elevation: 5,
            }}
          >
            <Text className="text-base font-bold text-slate-900">{btnText}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
