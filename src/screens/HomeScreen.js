import React from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '../components/Header';
import WeatherWidget from '../components/WeatherWidget';
import TaskSection from '../components/TaskSection';
import CropSection from '../components/CropSection';
import InsightsSection from '../components/InsightsSection';
import BottomNav from '../components/BottomNav';

export default function HomeScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark">
      <Header />
      <ScrollView className="flex-1" contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <WeatherWidget />
        <TaskSection />
        <CropSection />
        <InsightsSection />
      </ScrollView>
      <View className="absolute bottom-0 left-0 right-0 z-30">
        <BottomNav />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 100, // To ensure content isn't covered by absolute BottomNav
  },
});
