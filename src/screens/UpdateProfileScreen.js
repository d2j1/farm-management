import React, { useState } from 'react';
import {
  View, Text, ScrollView, TextInput,
  TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import ComingSoonModal from '../components/ComingSoonModal';

export default function UpdateProfileScreen({ navigation }) {
  const [fullName, setFullName] = useState('');
  const [villageName, setVillageName] = useState('');
  const [totalAcreage, setTotalAcreage] = useState('');
  const [activeCrops, setActiveCrops] = useState('');
  const [showComingSoon, setShowComingSoon] = useState(false);

  const handleSave = () => {
    // TODO: persist profile data
  };

  return (
    <SafeAreaView className="flex-1 bg-background-light" edges={['top']}>
      {/* ─── Header ─────────────────────────────────── */}
      <View className="bg-white flex-row items-center justify-center py-5 border-b border-slate-100 relative">
        <TouchableOpacity
          className="absolute left-4"
          activeOpacity={0.7}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text className="text-xl font-bold tracking-tight text-black">
          Update Profile
        </Text>
      </View>

      {/* ─── Content ────────────────────────────────── */}
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ─── Avatar ─────────────────────────────── */}
          <View className="items-center justify-center pt-8 pb-2">
            <View className="w-24 h-24 bg-slate-200 rounded-full items-center justify-center border-4 border-white shadow-sm">
              <MaterialIcons name="person" size={48} color="#94a3b8" />
            </View>
            <TouchableOpacity
              activeOpacity={0.7}
              className="mt-3"
              onPress={() => setShowComingSoon(true)}
            >
              <Text className="text-xs font-semibold text-primary uppercase tracking-widest">
                Change Photo
              </Text>
            </TouchableOpacity>
          </View>

          {/* ─── Account form ───────────────────────── */}
          <View className="mt-6 px-4">
            <Text className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-3">
              Account
            </Text>

            <View className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm p-5 gap-4">
              {/* Full Name */}
              <View>
                <Text className="text-xs font-semibold text-slate-500 uppercase mb-1.5 ml-0.5">
                  Full Name
                </Text>
                <TextInput
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-3 px-4 text-base text-slate-900"
                  placeholder="Enter your full name"
                  placeholderTextColor="#94a3b8"
                  value={fullName}
                  onChangeText={setFullName}
                />
              </View>

              {/* Village Name */}
              <View>
                <Text className="text-xs font-semibold text-slate-500 uppercase mb-1.5 ml-0.5">
                  Village Name
                </Text>
                <TextInput
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-3 px-4 text-base text-slate-900"
                  placeholder="Enter village name"
                  placeholderTextColor="#94a3b8"
                  value={villageName}
                  onChangeText={setVillageName}
                />
              </View>

              {/* Total Acreage */}
              <View>
                <Text className="text-xs font-semibold text-slate-500 uppercase mb-1.5 ml-0.5">
                  Total Acreage
                </Text>
                <TextInput
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-3 px-4 text-base text-slate-900"
                  placeholder="e.g. 5.5"
                  placeholderTextColor="#94a3b8"
                  keyboardType="decimal-pad"
                  value={totalAcreage}
                  onChangeText={setTotalAcreage}
                />
                <Text className="mt-1.5 text-[10px] text-slate-400 italic px-1">
                  Hint: Enter numerical value in acres
                </Text>
              </View>

              {/* Active Crops */}
              <View>
                <Text className="text-xs font-semibold text-slate-500 uppercase mb-1.5 ml-0.5">
                  Active Crops
                </Text>
                <TextInput
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-3 px-4 text-base text-slate-900"
                  placeholder="Wheat, Cotton, Rice..."
                  placeholderTextColor="#94a3b8"
                  value={activeCrops}
                  onChangeText={setActiveCrops}
                />
                <Text className="mt-1.5 text-[10px] text-slate-400 italic px-1">
                  Separate crops with a comma (e.g., Wheat, Soy)
                </Text>
              </View>

              {/* Save button */}
              <View className="pt-2">
                <TouchableOpacity
                  className="w-full bg-primary py-4 rounded-xl shadow-md flex-row items-center justify-center gap-2"
                  activeOpacity={0.85}
                  onPress={handleSave}
                >
                  <MaterialIcons name="save" size={20} color="#000000" />
                  <Text className="text-black font-bold text-base">
                    Save Changes
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <ComingSoonModal
        visible={showComingSoon}
        onClose={() => setShowComingSoon(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 40,
  },
});
