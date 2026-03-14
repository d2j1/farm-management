import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import { useLanguageStore } from '../utils/languageStore';
import { getUserProfile } from '../database/userService';

export default function Header() {
  const { t } = useLanguageStore();
  const isFocused = useIsFocused();
  const [userName, setUserName] = useState('');

  const fetchProfile = useCallback(async () => {
    try {
      const profile = await getUserProfile();
      if (profile && profile.fullName) {
        // Extract the first name
        const firstName = profile.fullName.trim().split(' ')[0];
        setUserName(firstName);
      } else {
        setUserName('');
      }
    } catch (error) {
      console.error('Error fetching profile for header:', error);
    }
  }, []);

  useEffect(() => {
    if (isFocused) {
      fetchProfile();
    }
  }, [isFocused, fetchProfile]);

  return (
    <View className="flex-row items-center bg-white dark:bg-slate-900 p-4 sticky top-0 z-20 shadow-sm justify-between">
      <View className="flex-row items-center gap-3">
        <View className="h-10 w-10 overflow-hidden rounded-full border-2 border-primary/20">
          <View className="w-full h-full bg-primary/10 flex items-center justify-center">
            <MaterialIcons name="person" size={24} color="#166534" />
          </View>
        </View>
        <View>
          <Text className="text-slate-900 dark:text-white text-lg font-bold leading-tight">
            {(() => {
              const greeting = t('helloFarmer');
              if (userName && greeting.includes(',')) {
                const greetingWord = greeting.split(',')[0].trim();
                return `${greetingWord} ${userName}!`;
              }
              return greeting;
            })()}
          </Text>
          <Text className="text-xs text-slate-500 font-medium uppercase tracking-wider">
            {t('proactiveMode')}
          </Text>
        </View>
      </View>
      <View className="flex-row items-center gap-2">
        <TouchableOpacity className="flex items-center justify-center rounded-full h-10 w-10 bg-primary/10">
          <MaterialIcons name="notifications" size={20} color="#166534" />
        </TouchableOpacity>
      </View>
    </View>
  );
}




