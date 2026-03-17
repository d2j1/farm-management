import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';
import { useLanguageStore } from '../utils/languageStore';

const WelcomeScreen = ({ onGetStarted }) => {
  const { t } = useLanguageStore();

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />
      <ScrollView 
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingTop: 48, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View className="items-center mb-4">
          <Text className="text-[44px] font-bold tracking-tight text-black leading-none mb-1">
            Apar
          </Text>
          <Text className="text-apar-dark-green text-[11px] font-bold tracking-[0.3em] uppercase mb-6">
            {t('precisionFarming')}
          </Text>
          <Text className="text-2xl font-bold text-slate-900">
            {t('welcomeToApar')}
          </Text>
        </View>

        {/* Info Card */}
        <View className="flex-1 justify-center w-full max-w-sm mx-auto">
          <View className="bg-slate-50/60 p-6 rounded-[40px] border border-slate-100/80">
            <View className="mb-4 flex flex-row justify-center">
              <View className="bg-[#166534]/10 p-5 rounded-full">
                <MaterialIcons name="verified-user" size={36} color="#166534" />
              </View>
            </View>
            
            <View className="space-y-3">
              <Text className="text-slate-700 text-[17px] leading-snug text-center font-medium">
                {t('welcomeDesc1')}
              </Text>
              
              <View className="h-px bg-slate-200 w-12 mx-auto my-3" />
              
              <Text className="text-slate-600 text-[15px] leading-relaxed text-center">
                {t('welcomeDesc2')}
              </Text>
              
              <Text className="text-slate-500 text-[14px] leading-relaxed text-center mt-2">
                {t('welcomeDesc3')}
              </Text>
            </View>
          </View>
        </View>

        {/* Footer Section */}
        <View className="w-full max-w-sm mx-auto mt-4">
          <TouchableOpacity 
            onPress={onGetStarted}
            activeOpacity={0.8}
            className="w-full bg-apar-dark-green py-5 rounded-2xl flex-row items-center justify-center gap-2"
            style={styles.iosShadow}
          >
            <Text className="text-white font-bold text-lg">
              {t('getStartedBtn')}
            </Text>
            <MaterialIcons name="arrow-forward" size={24} color="white" />
          </TouchableOpacity>
          
          <Text className="text-center text-[10px] text-slate-400 mt-4 uppercase tracking-[0.15em] leading-relaxed">
            {t('termsNotice')}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  iosShadow: {
    shadowColor: '#166534',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 8,
  },
});

export default WelcomeScreen;
