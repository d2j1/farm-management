import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, TextInput, ScrollView,
  TouchableOpacity, StyleSheet, useWindowDimensions,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useNetInfo } from '@react-native-community/netinfo';
import InsightCard from '../components/InsightCard';
import VideoCard from '../components/VideoCard';
import NoInternetView from '../components/NoInternetView';
import FilterButton from '../components/FilterButton';
import axios from 'axios';
import { API_CONFIG } from '../utils/api.config';
import { useLanguageStore } from '../utils/languageStore';

// ─── Content-type tabs ────────────────────────────────────────
const CONTENT_TYPES = ['Articles', 'Videos'];

// ─── Category filter pills ───────────────────────────────────
const CATEGORIES = ['All', 'Organic', 'Fertilizer', 'Economy'];

const ARTICLES_DUMMY = [
  {
    id: 'a1',
    category: 'Organic',
    readTime: '5 min read',
    title: 'Natural Pest Control Methods',
    description: 'Learn how to protect your crops using organic solutions and beneficial insects.',
    icon: 'bug-report',
  },
  {
    id: 'a2',
    category: 'Fertilizer',
    readTime: '8 min read',
    title: 'Optimizing Soil Nutrition',
    description: 'A comprehensive guide to understanding NPK ratios and soil testing for better yields.',
    icon: 'science',
  },
  {
    id: 'a3',
    category: 'Economy',
    readTime: '6 min read',
    title: 'Market Price Trends 2026',
    description: 'Stay ahead of the curve with our latest analysis of crop market prices and demand forecasts.',
    icon: 'trending-up',
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
  
  const { languageLabel } = useLanguageStore();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPosts = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      // Temporarily disabled fetching from localhost
      /*
      const response = await axios.get(`${API_CONFIG.BASE_URL}/posts`, {
        params: {
          page: 1,
          limit: 20,
          language: languageLabel,
        },
        headers: API_CONFIG.HEADERS,
        timeout: 10000,
      });

      const posts = Array.isArray(response.data) ? response.data : (response.data.data || []);
      
      const mappedPosts = posts.map(post => ({
        id: post.id || post._id,
        category: post.category || 'General',
        readTime: post.readTime || '5 min read',
        title: post.title,
        description: post.description,
        icon: post.icon || 'article',
      }));

      setArticles(mappedPosts);
      */

      // Using dummy data for now
      setArticles(ARTICLES_DUMMY);
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Failed to load insights. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [languageLabel]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

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
          {CATEGORIES.map((cat) => (
            <FilterButton
              key={cat}
              label={cat}
              isActive={cat === activeCategory}
              onPress={() => setActiveCategory(cat)}
            />
          ))}
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
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={() => fetchPosts(true)} />
            }
          >
            <View className="px-4 gap-4">
              {loading && !refreshing ? (
                <View className="py-20 items-center justify-center">
                  <ActivityIndicator size="large" color="#3ce619" />
                  <Text className="mt-4 text-slate-500 font-medium">Fetching insights...</Text>
                </View>
              ) : error ? (
                <View className="py-10 items-center justify-center">
                  <MaterialIcons name="error-outline" size={48} color="#ef4444" />
                  <Text className="mt-4 text-slate-600 text-center font-medium px-10">{error}</Text>
                  <TouchableOpacity 
                    onPress={() => fetchPosts()}
                    className="mt-6 bg-primary px-8 py-3 rounded-full shadow-sm"
                  >
                    <Text className="text-black font-bold">Retry</Text>
                  </TouchableOpacity>
                </View>
              ) : articles.length === 0 ? (
                <View className="py-20 items-center justify-center">
                  <MaterialIcons name="article" size={48} color="#94a3b8" />
                  <Text className="mt-4 text-slate-500 font-medium">No insights found for {languageLabel}</Text>
                </View>
              ) : (
                articles.map((article) => (
                  <InsightCard
                    key={article.id}
                    category={article.category}
                    readTime={article.readTime}
                    title={article.title}
                    description={article.description}
                    icon={article.icon}
                  />
                ))
              )}
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
