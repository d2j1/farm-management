import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useLanguageStore } from '../utils/languageStore';

// ─── Language options ─────────────────────────────────────────
const LANGUAGES = [
  { id: 'en', label: 'English' },
  { id: 'hi', label: 'Hindi' },
  { id: 'mr', label: 'Marathi' },
];

export default function ProfileScreen({ navigation }) {
  const { languageCode, setLanguage } = useLanguageStore();

  return (
    <SafeAreaView className="flex-1 bg-background-light" edges={['top']}>
      {/* ─── Header ─────────────────────────────────── */}
      <View className="bg-white items-center justify-center py-5 border-b border-slate-100">
        <Text className="text-xl font-bold tracking-tight text-black">
          Profile
        </Text>
      </View>

      {/* ─── Scrollable content ─────────────────────── */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Account section ──────────────────────── */}
        <View className="mt-6">
          <Text className="px-4 text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">
            Account
          </Text>
          <View className="bg-white border border-slate-200 rounded-xl mx-4 overflow-hidden shadow-sm">
            <TouchableOpacity
              className="w-full flex-row items-center justify-between px-4 py-4"
              activeOpacity={0.7}
              onPress={() => navigation.navigate('UpdateProfile')}
            >
              <View className="flex-row items-center gap-4">
                <View className="h-10 w-10 items-center justify-center rounded-full bg-primary/20">
                  <MaterialIcons name="person" size={22} color="#3ce619" />
                </View>
                <Text className="text-base font-medium text-slate-900">
                  Manage user profile
                </Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color="#94a3b8" />
            </TouchableOpacity>
          </View>
        </View>

        {/* ─── Language section ─────────────────────── */}
        <View className="mt-8">
          <Text className="px-4 text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">
            Language
          </Text>
          <View className="bg-white border border-slate-200 rounded-xl mx-4 overflow-hidden shadow-sm">
            {LANGUAGES.map((lang, index) => {
              const isSelected = languageCode === lang.id;
              return (
                <TouchableOpacity
                  key={lang.id}
                  className={`w-full flex-row items-center justify-between px-4 py-4 ${
                    index !== 0 ? 'border-t border-slate-100' : ''
                  }`}
                  activeOpacity={0.7}
                  onPress={() => setLanguage(lang.id)}
                >
                  <View className="flex-row items-center gap-4">
                    <View className="h-10 w-10 items-center justify-center rounded-full bg-slate-100">
                      <MaterialIcons name="language" size={22} color="#475569" />
                    </View>
                    <Text className="text-base font-medium text-slate-900">
                      {lang.label}
                    </Text>
                  </View>

                  {/* Radio indicator */}
                  <View
                    className={`h-5 w-5 rounded-full border-2 items-center justify-center ${
                      isSelected ? 'border-primary' : 'border-slate-300'
                    }`}
                  >
                    {isSelected && (
                      <View className="h-2.5 w-2.5 rounded-full bg-primary" />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ─── Data & Privacy section ──────────────── */}
        <View className="mt-8 px-4 mb-6">
          <Text className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">
            Data & Privacy
          </Text>

          {/* Privacy notice card */}
          <View className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-4">
            <View className="flex-row gap-3">
              <MaterialIcons name="shield" size={22} color="#3ce619" />
              <Text className="text-sm leading-relaxed text-slate-700 flex-1">
                Your data is 100% private. All your profile data, crop logs, and
                financial expenses are stored locally on this device. No data is
                sent to external servers.
              </Text>
            </View>
          </View>

          {/* Action buttons */}
          <View className="gap-3">
            <TouchableOpacity
              className="w-full flex-row items-center justify-center gap-2 bg-white border border-slate-200 py-3.5 rounded-xl shadow-sm"
              activeOpacity={0.7}
            >
              <MaterialIcons name="file-upload" size={22} color="#3ce619" />
              <Text className="text-base font-semibold text-slate-900">
                Export Crop data as csv
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="w-full flex-row items-center justify-center gap-2 bg-white border border-slate-200 py-3.5 rounded-xl shadow-sm"
              activeOpacity={0.7}
            >
              <MaterialIcons name="upload-file" size={22} color="#3ce619" />
              <Text className="text-base font-semibold text-slate-900">
                Import crop data
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 120,
  },
});
