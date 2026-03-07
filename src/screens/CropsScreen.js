import React, { useCallback, useState } from 'react';
import { BackHandler, ScrollView, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import CropsScreenHeader from '../components/CropsScreenHeader';
import FilterTabs from '../components/FilterTabs';
import CropDetailCard from '../components/CropDetailCard';
import FloatingActionButton from '../components/FloatingActionButton';

const FILTER_TABS = ['All', 'Active', 'Harvested'];

const CROPS_DATA = [
  {
    id: '1',
    name: 'Tomato',
    icon: 'restaurant',
    iconColor: '#ef4444',
    iconBgClass: 'bg-red-50',
    blobBgClass: 'bg-red-400',
    ringClass: 'ring-red-100',
    location: 'East Field • 2 Acres',
    status: 'active',
    lastActivity: {
      label: 'FERTILIZED',
      colorClass: 'text-primary',
      dotClass: 'bg-primary',
    },
    upcoming: {
      label: 'WATERING (TOMORROW)',
      colorClass: 'text-blue-400',
    },
    expenses: '₹1,200',
    earnings: '₹4,500',
  },
  {
    id: '2',
    name: 'Corn',
    icon: 'grass',
    iconColor: '#ca8a04',
    iconBgClass: 'bg-yellow-50',
    blobBgClass: 'bg-yellow-400',
    ringClass: 'ring-yellow-100',
    location: 'West Field • 5 Acres',
    status: 'active',
    lastActivity: {
      label: 'IRRIGATED',
      colorClass: 'text-orange-400',
      dotClass: 'bg-orange-400',
    },
    upcoming: {
      label: 'PEST CONTROL (IN 3 DAYS)',
      colorClass: 'text-blue-400',
    },
    expenses: '₹2,500',
    earnings: '₹8,000',
  },
  {
    id: '3',
    name: 'Wheat',
    icon: 'agriculture',
    iconColor: '#ea580c',
    iconBgClass: 'bg-orange-50',
    blobBgClass: 'bg-orange-400',
    ringClass: 'ring-orange-100',
    location: 'North Ridge • 12 Acres',
    status: 'active',
    lastActivity: {
      label: 'WEEDED',
      colorClass: 'text-primary',
      dotClass: 'bg-primary',
    },
    upcoming: {
      label: 'FERTILIZE (NEXT WEEK)',
      colorClass: 'text-blue-400',
    },
    expenses: '₹4,100',
    earnings: '₹15,200',
  },
];

export default function CropsScreen({ navigation }) {
  const [activeFilter, setActiveFilter] = useState('All');

  const handleGoHome = useCallback(() => {
    navigation.navigate('Home', { screen: 'HomeMain' });
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      const onHardwareBackPress = () => {
        handleGoHome();
        return true;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onHardwareBackPress);
      return () => subscription.remove();
    }, [handleGoHome]),
  );

  const filteredCrops = CROPS_DATA.filter((crop) => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Active') return crop.status === 'active';
    if (activeFilter === 'Harvested') return crop.status === 'harvested';
    return true;
  });

  return (
    <SafeAreaView className="flex-1 bg-background-light" edges={['top']}>
      <CropsScreenHeader
        onBackPress={handleGoHome}
        onNotificationPress={() => {}}
      />

      <FilterTabs
        tabs={FILTER_TABS}
        activeTab={activeFilter}
        onTabChange={setActiveFilter}
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-4 gap-5">
          {filteredCrops.map((crop) => (
            <CropDetailCard
              key={crop.id}
              crop={crop}
              onPress={() => navigation.navigate('CropDetails', { crop })}
            />
          ))}
        </View>
      </ScrollView>

      <FloatingActionButton onPress={() => navigation.navigate('CreateCrop')} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingTop: 8,
    paddingBottom: 120,
  },
});
