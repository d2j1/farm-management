import React from 'react';
import { TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

/**
 * Reusable green floating action button.
 *
 * @param {Object} props
 * @param {() => void}  props.onPress  - Callback when pressed.
 * @param {string}      [props.icon]   - MaterialIcons icon name (default: "add").
 */
export default function FloatingActionButton({ onPress, icon = 'add' }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      className="absolute bottom-4 right-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary z-30 shadow-xl"
      style={{
        shadowColor: '#3ce619',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
      }}
    >
      <MaterialIcons name={icon} size={30} color="#1a2e05" />
    </TouchableOpacity>
  );
}
