import React, { useEffect, useState } from 'react';
import { View, Text, Animated, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const SplashScreen = () => {
  const [progress] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: 2000,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const progressBarWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 96], // 24 * 4 (w-24 in tailwind is 96px)
  });

  return (
    <SafeAreaView className="flex-1 bg-white items-center justify-center relative">
      <View className="flex-grow items-center justify-center w-full">
        <View className="items-center">
          <Text className="text-[64px] font-bold tracking-tight mb-2 text-black leading-none">
            Apar
          </Text>
          <Text className="text-black text-[13px] font-medium tracking-[0.25em] uppercase opacity-80">
            Precision Farming
          </Text>
        </View>
      </View>

      <View className="absolute bottom-16 w-full flex-col items-center gap-6">
        <View className="w-24 h-1 bg-gray-100 rounded-full overflow-hidden">
          <Animated.View 
            style={{ 
              width: progressBarWidth,
              height: '100%',
              backgroundColor: '#166534', // apar-dark-green
              borderRadius: 9999 
            }} 
          />
        </View>
        <Text className="text-black text-[11px] font-bold uppercase tracking-[0.3em]">
          Loading Insights
        </Text>
      </View>
    </SafeAreaView>
  );
};

export default SplashScreen;
