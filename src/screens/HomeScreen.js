import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '../components/Header';
import WeatherWidget from '../components/WeatherWidget';
import TaskSection from '../components/TaskSection';
import CropSection from '../components/CropSection';
import InsightsSection from '../components/InsightsSection';

export default function HomeScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background-light" edges={['top']}>
      <Header />
      <ScrollView className="flex-1" contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <WeatherWidget />
        <TaskSection />
        <CropSection />
        <InsightsSection />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 100,
  },
});
