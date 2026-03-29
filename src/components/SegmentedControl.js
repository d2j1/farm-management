/** @jsxRuntime automatic */
/** @jsxImportSource react */
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function SegmentedControl({ options, selected, onSelect }) {

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: '#f1f5f9' },
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
                { backgroundColor: '#ffffff' },
              ],
            ]}
          >
            <Text
              style={[
                styles.optionText,
                {
                  color: isActive ? '#166534' : '#64748b',
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
    fontSize: 15,
  },
});




