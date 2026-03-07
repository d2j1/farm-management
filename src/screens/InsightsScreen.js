import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, TextInput, ScrollView,
  TouchableOpacity, StyleSheet, useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useNetInfo } from '@react-native-community/netinfo';
import InsightCard from '../components/InsightCard';
import VideoCard from '../components/VideoCard';
import NoInternetView from '../components/NoInternetView';

// ─── Content-type tabs ────────────────────────────────────────
const CONTENT_TYPES = ['Articles', 'Videos'];

// ─── Category filter pills ───────────────────────────────────
const CATEGORIES = ['All', 'Organic', 'Fertilizer', 'Economy'];

// ─── Dummy article data ──────────────────────────────────────
const ARTICLES = [
  {
    id: '1',
    category: 'Soil',
    readTime: '5 min read',
    title: 'Optimizing Soil PH for Leafy Greens',
    description:
      'Learn how to maintain the perfect balance for your spinach and kale crops using natural amendments.',
    icon: 'local-florist',
  },
  {
    id: '2',
    category: 'Pests',
    readTime: '8 min read',
    title: 'Natural Pest Control Strategies',
    description:
      'Combat aphids and mites without harsh chemicals using these proven organic farming techniques.',
    icon: 'bug-report',
  },
  {
    id: '3',
    category: 'Economy',
    readTime: '12 min read',
    title: 'Market Trends for Organic Produce',
    description:
      'Analyzing the rising demand for organic heritage vegetables in urban local markets.',
    icon: 'trending-up',
  },
  {
    id: '4',
    category: 'Fertilizer',
    readTime: '4 min read',
    title: 'Composting for Small Gardens',
    description:
      'Turn kitchen waste into black gold with our step-by-step guide to backyard composting.',
    icon: 'recycling',
  },
];

// ─── Dummy video data ────────────────────────────────────────
const VIDEOS = [
  {
    id: 'v1',
    category: 'Soil',
    duration: '3:45 min',
    title: 'How to Escape the Cycle of Stress, Anxiety and Misery? - Sadhguru',
    icon: 'movie',
    url: 'https://www.youtube.com/watch?v=8LQ2wZZicUA',
  },
  {
    id: 'v2',
    category: 'Pests',
    duration: '8:12 min',
    title: 'One Thing You Must Do to Overcome Anxiety | Sadhguru',
    icon: 'pest-control',
    url: 'https://www.youtube.com/watch?v=1XCObQjSHIs',
  },
  {
    id: 'v3',
    category: 'Organic',
    duration: '12:05 min',
    title: 'One Important Cause of Anxiety Disorder | Sadhguru',
    icon: 'eco',
    url: 'https://www.youtube.com/watch?v=GGPRFAoCRGQ',
  },
];

export default function InsightsScreen() {
  const { width: screenWidth } = useWindowDimensions();
  const pagerRef = useRef(null);
  const netInfo = useNetInfo();

  const isOffline = netInfo.isConnected === false;

  const [activeContentType, setActiveContentType] = useState('Articles');
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Determine search placeholder based on active content type
  const searchPlaceholder =
    activeContentType === 'Articles' ? 'Search articles' : 'Search videos';

  /** Tap toggle → scroll pager to matching page */
  const handleToggle = useCallback((type) => {
    setActiveContentType(type);
    const pageIndex = CONTENT_TYPES.indexOf(type);
    pagerRef.current?.scrollTo({ x: pageIndex * screenWidth, animated: true });
  }, [screenWidth]);

  /** Swipe pager → sync toggle state */
  const handlePagerScroll = useCallback((e) => {
    const pageIndex = Math.round(e.nativeEvent.contentOffset.x / screenWidth);
    const type = CONTENT_TYPES[pageIndex];
    if (type && type !== activeContentType) {
      setActiveContentType(type);
    }
  }, [screenWidth, activeContentType]);

  return (
    <SafeAreaView className="flex-1 bg-background-light" edges={['top']}>
      {/* ─── Header ─────────────────────────────────── */}
      <View className="bg-white items-center justify-center py-5 border-b border-slate-100">
        <Text className="text-xl font-bold tracking-tight text-black">
          Quick Insights
        </Text>
      </View>

      {/* ─── Sticky controls area ──────────────────── */}
      <View className="pt-4 bg-background-light">
        {/* Articles / Videos toggle */}
        <View className="px-4 mb-4">
          <View className="flex-row p-1 bg-white rounded-full border border-slate-200 shadow-sm">
            {CONTENT_TYPES.map((type) => {
              const isActive = type === activeContentType;
              return (
                <TouchableOpacity
                  key={type}
                  className={`flex-1 py-2 px-4 rounded-full items-center justify-center ${
                    isActive ? 'bg-primary' : 'bg-transparent'
                  }`}
                  activeOpacity={0.8}
                  onPress={() => handleToggle(type)}
                >
                  <Text
                    className={`text-sm font-bold ${
                      isActive ? 'text-black' : 'text-slate-500'
                    }`}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Search bar */}
        <View className="px-4 mb-4">
          <View className="flex-row items-center h-12 bg-white rounded-xl border border-slate-200 shadow-sm px-4 gap-2">
            <MaterialIcons name="search" size={22} color="#94a3b8" />
            <TextInput
              className="flex-1 text-base text-slate-900"
              placeholder={searchPlaceholder}
              placeholderTextColor="#94a3b8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {/* Category filter pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 12, paddingBottom: 16 }}
          style={{ flexGrow: 0 }}
        >
          {CATEGORIES.map((cat) => {
            const isActive = cat === activeCategory;
            return (
              <TouchableOpacity
                key={cat}
                className={`h-9 items-center justify-center rounded-full shadow-sm ${
                  isActive
                    ? 'bg-primary px-6'
                    : 'bg-white border border-slate-200 px-5'
                }`}
                activeOpacity={0.8}
                onPress={() => setActiveCategory(cat)}
              >
                <Text
                  className={`text-sm ${
                    isActive ? 'font-bold text-black' : 'font-medium text-slate-600'
                  }`}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ─── Content area ─────────────────────────────── */}
      {isOffline ? (
        <NoInternetView onRetry={() => netInfo.refresh()} />
      ) : (
        <ScrollView
          ref={pagerRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handlePagerScroll}
          scrollEventThrottle={16}
          className="flex-1"
        >
          {/* Page 1 — Articles */}
          <ScrollView
            style={{ width: screenWidth }}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled
          >
            <View className="px-4 gap-4">
              {ARTICLES.map((article) => (
                <InsightCard
                  key={article.id}
                  category={article.category}
                  readTime={article.readTime}
                  title={article.title}
                  description={article.description}
                  icon={article.icon}
                />
              ))}
            </View>
          </ScrollView>

          {/* Page 2 — Videos */}
          <ScrollView
            style={{ width: screenWidth }}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled
          >
            <View className="px-4 gap-4">
              {VIDEOS.map((video) => (
                <VideoCard
                  key={video.id}
                  category={video.category}
                  duration={video.duration}
                  title={video.title}
                  icon={video.icon}
                  url={video.url}
                  onWatch={() => {}}
                />
              ))}
            </View>
          </ScrollView>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingTop: 8,
    paddingBottom: 120,
  },
});
