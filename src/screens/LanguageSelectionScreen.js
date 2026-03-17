import React, { useState } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';
import { useLanguageStore } from '../utils/languageStore';
const languages = [
  { id: 'mr', label: 'मराठी', subLabel: 'Marathi' },
  { id: 'hi', label: 'हिन्दी', subLabel: 'Hindi' },
  { id: 'en', label: 'English', subLabel: 'English' },
];

const LanguageSelectionScreen = ({ navigation }) => {
  const { languageCode, setLanguage } = useLanguageStore();
  const [selectedLanguage, setSelectedLanguage] = useState(languageCode);

  const handleContinue = () => {
    setLanguage(selectedLanguage);
    navigation.navigate('Welcome');
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingVertical: 48 }}>
        {/* Header Section */}
        <View className="items-center mb-12">
          <Text className="text-[42px] font-bold tracking-tight text-black leading-none mb-1">
            Apar
          </Text>
          <Text className="text-apar-dark-green text-[11px] font-bold tracking-[0.25em] uppercase">
            {t('precisionFarming')}
          </Text>
        </View>

        {/* Welcome Section */}
        <View className="items-center mb-10">
          <Text className="text-3xl font-bold text-slate-900 mb-3 text-center">
            {t('welcomeToApar')}!
          </Text>
          <Text className="text-slate-500 text-base font-medium text-center">
            Please select your preferred language:
          </Text>
        </View>

        {/* Language Options */}
        <View className="flex-1 flex-col gap-4">
          {languages.map((lang) => {
            const isSelected = selectedLanguage === lang.id;
            return (
              <TouchableOpacity
                key={lang.id}
                onPress={() => setSelectedLanguage(lang.id)}
                activeOpacity={0.7}
                className={`w-full flex-row items-center justify-between p-5 rounded-2xl border-2 transition-all ${
                  isSelected 
                    ? 'border-apar-dark-green bg-apar-dark-green/5' 
                    : 'border-slate-100 bg-slate-50'
                }`}
              >
                <View className="flex-col items-start">
                  <Text className={`text-xl font-bold ${isSelected ? 'text-slate-900' : 'text-slate-800'}`}>
                    {lang.label}
                  </Text>
                  <Text className="text-sm text-slate-500 uppercase tracking-wide">
                    {lang.subLabel}
                  </Text>
                </View>
                
                <View className={`size-6 rounded-full border-2 items-center justify-center ${
                  isSelected ? 'border-apar-dark-green' : 'border-slate-300'
                }`}>
                  {isSelected && (
                    <View className="size-3 rounded-full bg-apar-dark-green" />
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Footer Section */}
        <View className="mt-8">
          <TouchableOpacity
            onPress={handleContinue}
            activeOpacity={0.8}
            className="w-full bg-apar-dark-green py-4 rounded-2xl flex-row items-center justify-center gap-2"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 12,
              elevation: 4,
            }}
          >
            <Text className="text-white font-bold text-lg">
              Continue
            </Text>
            <MaterialIcons name="arrow-forward" size={24} color="white" />
          </TouchableOpacity>
          
          <Text className="text-center text-[10px] text-slate-400 mt-6 uppercase tracking-[0.2em]">
            By continuing you agree to our Terms
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default LanguageSelectionScreen;
