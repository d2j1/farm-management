/** @jsxRuntime automatic */
/** @jsxImportSource react */
import React from 'react';
import { Pressable, StyleSheet, Text, View, useColorScheme } from 'react-native';

export default function SegmentedControl({ options, selected, onSelect }) {
  const isDark = useColorScheme() === 'dark';

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' },
      ]}
    >
      {options.map((option) => {
        const isActive = selected === option;

        return (
          <Pressable
            key={option}
            onPress={() => onSelect(option)}
            style={[
              styles.option,
              isActive && [
                styles.activeOption,
                { backgroundColor: isDark ? '#334155' : '#ffffff' },
              ],
            ]}
          >
            <Text
              style={[
                styles.optionText,
                {
                  color: isActive ? '#3ce619' : isDark ? '#94a3b8' : '#64748b',
                  fontWeight: isActive ? '700' : '500',
                },
              ]}
            >
              {option}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: 48,
    alignItems: 'center',
    borderRadius: 12,
    padding: 4,
  },
  option: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  activeOption: {
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  optionText: {
    fontSize: 14,
  },
});
