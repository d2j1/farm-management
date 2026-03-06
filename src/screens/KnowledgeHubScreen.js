import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    Image,
    FlatList,
    TouchableOpacity,
    TextInput,
    ScrollView,
    Dimensions,
    Linking,
    ActivityIndicator,
    useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { fetchArticles, fetchVideos } from '../services/api';

const { width: screenWidth } = Dimensions.get('window');

// Icon component using text characters as fallback (no extra deps needed)
const Icon = ({ name, size = 20, className = '' }) => {
    const icons = {
        search: '🔍',
        schedule: '🕐',
        potted_plant: '🌱',
        bug_report: '🐛',
        trending_up: '📈',
        recycling: '♻️',
        play_circle: '▶️',
        close: '✕',
    };
    return (
        <Text style={{ fontSize: size }} className={className}>
            {icons[name] || '•'}
        </Text>
    );
};

// Static fallback articles shown when API has no data yet
const FALLBACK_ARTICLES = [
    {
        id: 'fa1',
        category: 'Soil',
        readTime: '5 min read',
        title: 'Optimizing Soil pH for Leafy Greens',
        content:
            'Learn how to maintain the perfect balance for your spinach and kale crops using natural amendments.',
        icon: 'potted_plant',
    },
    {
        id: 'fa2',
        category: 'Pests',
        readTime: '8 min read',
        title: 'Natural Pest Control Strategies',
        content:
            'Combat aphids and mites without harsh chemicals using these proven organic farming techniques.',
        icon: 'bug_report',
    },
    {
        id: 'fa3',
        category: 'Economy',
        readTime: '12 min read',
        title: 'Market Trends for Organic Produce',
        content:
            'Analyzing the rising demand for organic heritage vegetables in urban local markets.',
        icon: 'trending_up',
    },
    {
        id: 'fa4',
        category: 'Fertilizer',
        readTime: '4 min read',
        title: 'Composting for Small Gardens',
        content:
            'Turn kitchen waste into black gold with our step-by-step guide to backyard composting.',
        icon: 'recycling',
    },
];

const STATIC_FILTERS = ['All', 'Organic', 'Fertilizer', 'Economy'];

// Static fallback videos shown when API has no data yet
const FALLBACK_VIDEOS = [
    {
        id: 'fv1',
        category: 'Crops',
        duration: '12:45',
        title: 'Maximizing Crop Yield: Seasonal Guide',
        thumbnail: 'https://img.youtube.com/vi/_f7xDWZzn4c/maxresdefault.jpg',
        url: 'https://www.youtube.com/watch?v=_f7xDWZzn4c',
    },
    {
        id: 'fv2',
        category: 'Organic',
        duration: '08:12',
        title: 'Organic Pest Control Methods',
        thumbnail: 'https://img.youtube.com/vi/hzvT0vy5cjE/maxresdefault.jpg',
        url: 'https://www.youtube.com/watch?v=hzvT0vy5cjE',
    },
    {
        id: 'fv3',
        category: 'Economy',
        duration: '15:30',
        title: 'Agricultural Economy: 2024 Market Trends',
        thumbnail: 'https://img.youtube.com/vi/GhzVRVbpNXw/maxresdefault.jpg',
        url: 'https://www.youtube.com/watch?v=GhzVRVbpNXw',
    },
];

const KnowledgeHubScreen = () => {
    const isDark = useColorScheme() === 'dark';
    const { t } = useTranslation();
    const [tab, setTab] = useState('articles');
    const [articles, setArticles] = useState([]);
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFilter, setSelectedFilter] = useState('All');
    const scrollRef = useRef(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const fetchedArticles = await fetchArticles();
            const fetchedVideos = await fetchVideos();
            setArticles(fetchedArticles?.length ? fetchedArticles : FALLBACK_ARTICLES);
            setVideos(fetchedVideos?.length ? fetchedVideos : FALLBACK_VIDEOS);
        } catch {
            setArticles(FALLBACK_ARTICLES);
            setVideos(FALLBACK_VIDEOS);
        } finally {
            setLoading(false);
        }
    };

    const filterData = (data) =>
        data.filter((item) => {
            const matchesSearch =
                item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.content?.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory =
                selectedFilter === 'All' || item.category === selectedFilter;
            return matchesSearch && matchesCategory;
        });

    const filteredArticles = filterData(articles);
    const filteredVideos = filterData(videos);

    // Dynamic filter chips: merge static + api categories
    const allCategories = [
        'All',
        ...new Set([
            ...STATIC_FILTERS.slice(1),
            ...articles.map((a) => a.category),
            ...videos.map((v) => v?.category),
        ].filter(Boolean)),
    ];

    const renderArticleCard = ({ item }) => (
        <View
            className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 mb-4"
            style={{ shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 2 }}
        >
            {/* Badge + read time */}
            <View className="flex-row items-center justify-between mb-3">
                <View className="px-2 rounded bg-primary/10">
                    <Text
                        className="text-primary text-[10px] font-bold uppercase tracking-widest py-0.5"
                    >
                        {item.category}
                    </Text>
                </View>
                <View className="flex-row items-center gap-1">
                    <Icon name="schedule" size={13} />
                    <Text className="text-slate-400 dark:text-slate-500 text-xs ml-1">
                        {item.readTime || '5 min read'}
                    </Text>
                </View>
            </View>

            {/* Content row */}
            <View className="flex-row gap-4">
                <View className="flex-1">
                    <Text
                        className="text-slate-900 dark:text-slate-100 font-bold text-base mb-1"
                        numberOfLines={2}
                    >
                        {item.title}
                    </Text>
                    <Text
                        className="text-slate-500 dark:text-slate-400 text-sm leading-5"
                        numberOfLines={2}
                    >
                        {item.content}
                    </Text>
                </View>
                {/* Thumbnail placeholder */}
                <View
                    className="w-20 h-20 rounded-xl items-center justify-center shrink-0 border border-primary/10"
                    style={{ backgroundColor: 'rgba(60,230,25,0.05)' }}
                >
                    <Icon name={item.icon || 'potted_plant'} size={30} />
                </View>
            </View>
        </View>
    );

    const renderVideoCard = ({ item }) => (
        <View
            className="flex-col gap-3 rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-800/50 p-3 mb-4"
            style={{ shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 1 }}
        >
            {/* Thumbnail with play overlay */}
            <View
                className="w-full rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-800"
                style={{ aspectRatio: 16 / 9 }}
            >
                {item.thumbnail ? (
                    <Image
                        source={{ uri: item.thumbnail }}
                        className="w-full h-full"
                        resizeMode="cover"
                    />
                ) : (
                    <View className="flex-1 bg-slate-200 dark:bg-slate-700" />
                )}

                {/* Play button overlay */}
                <View
                    className="absolute inset-0 items-center justify-center"
                    style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}
                    pointerEvents="none"
                >
                    <View
                        className="items-center justify-center rounded-full"
                        style={{
                            width: 52,
                            height: 52,
                            backgroundColor: 'rgba(255,255,255,0.92)',
                            shadowColor: '#000',
                            shadowOpacity: 0.25,
                            shadowRadius: 8,
                            elevation: 6,
                        }}
                    >
                        <Text style={{ fontSize: 26, lineHeight: 30, marginLeft: 3 }}>▶</Text>
                    </View>
                </View>

                {/* Duration badge */}
                {item.duration && (
                    <View
                        className="absolute bottom-2 right-2 rounded px-2 py-0.5"
                        style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
                        pointerEvents="none"
                    >
                        <Text className="text-white text-xs font-medium">{item.duration}</Text>
                    </View>
                )}
            </View>

            {/* Title + Watch button row */}
            <View className="flex-row items-start gap-4">
                <Text
                    className="flex-1 text-slate-900 dark:text-slate-100 font-bold text-base leading-snug"
                    numberOfLines={2}
                >
                    {item.title}
                </Text>
                {item.url && (
                    <TouchableOpacity
                        className="bg-primary rounded-lg px-4 py-2 flex-row items-center gap-1 shrink-0"
                        style={{ shadowColor: '#3ce619', shadowOpacity: 0.3, shadowRadius: 4, elevation: 2 }}
                        onPress={() => Linking.openURL(item.url)}
                        activeOpacity={0.85}
                    >
                        <Text className="text-black font-bold text-sm">Watch</Text>
                        <Text style={{ fontSize: 14 }}>↗</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );

    return (
        <SafeAreaView className="flex-1 bg-[#f6f8f6] dark:bg-[#142111]" edges={['top']}>

            {/* ── HEADER ── */}
            <View className="bg-[#f6f8f6] dark:bg-[#142111] border-b border-slate-200 dark:border-slate-800 px-4 py-4">
                <Text className="text-lg font-bold text-slate-900 dark:text-slate-100 text-center leading-tight tracking-tight">
                    Information
                </Text>
            </View>

            {/* ── TABS ── */}
            <View className="bg-[#f6f8f6] dark:bg-[#142111] flex-row border-b border-slate-200 dark:border-slate-800 px-4 gap-8 justify-center">
                <TouchableOpacity
                    className={`flex-col items-center justify-center pb-3 pt-4 border-b-2 ${tab === 'articles'
                        ? 'border-primary'
                        : 'border-transparent'
                        }`}
                    onPress={() => {
                        setTab('articles');
                        scrollRef.current?.scrollTo({ x: 0, animated: true });
                    }}
                >
                    <Text
                        className={`text-sm font-bold leading-normal tracking-wide ${tab === 'articles'
                            ? 'text-primary'
                            : 'text-slate-500 dark:text-slate-400'
                            }`}
                    >
                        {t('articles') || 'Articles'}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    className={`flex-col items-center justify-center pb-3 pt-4 border-b-2 ${tab === 'videos'
                        ? 'border-primary'
                        : 'border-transparent'
                        }`}
                    onPress={() => {
                        setTab('videos');
                        scrollRef.current?.scrollTo({ x: screenWidth, animated: true });
                    }}
                >
                    <Text
                        className={`text-sm font-bold leading-normal tracking-wide ${tab === 'videos'
                            ? 'text-primary'
                            : 'text-slate-500 dark:text-slate-400'
                            }`}
                    >
                        {t('videos') || 'Videos'}
                    </Text>
                </TouchableOpacity>
            </View>

            {/* ── SEARCH BAR ── */}
            <View className="bg-[#f6f8f6] dark:bg-[#142111] px-4 py-4">
                <View className="flex-row items-center h-12 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-200/50 dark:bg-slate-800/50">
                    <View className="pl-4 justify-center">
                        <Icon name="search" size={18} />
                    </View>
                    <TextInput
                        className="flex-1 px-3 text-base text-slate-900 dark:text-slate-100"
                        placeholder={t('search') || 'Search articles'}
                        placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity
                            className="pr-4 justify-center"
                            onPress={() => setSearchQuery('')}
                        >
                            <Text className="text-slate-400 font-bold text-base">✕</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* ── FILTER CHIPS ── */}
            <View className="bg-[#f6f8f6] dark:bg-[#142111]">
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16, gap: 12 }}
                >
                    {allCategories.map((cat) => {
                        const isSelected = selectedFilter === cat;
                        return (
                            <TouchableOpacity
                                key={cat}
                                onPress={() => setSelectedFilter(cat)}
                                className={`h-9 shrink-0 items-center justify-center rounded-full px-5 ${isSelected
                                    ? 'bg-primary'
                                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700'
                                    }`}
                                style={isSelected ? { shadowColor: '#3ce619', shadowOpacity: 0.3, shadowRadius: 4, elevation: 2 } : {}}
                            >
                                <Text
                                    className={`text-sm font-semibold ${isSelected
                                        ? 'text-black'
                                        : 'text-slate-700 dark:text-slate-300'
                                        }`}
                                >
                                    {cat}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>

            {/* ── CONTENT ── */}
            {loading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#3ce619" />
                </View>
            ) : (
                <ScrollView
                    ref={scrollRef}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    scrollEnabled={false}
                    onMomentumScrollEnd={(e) => {
                        const pageIndex = Math.round(
                            e.nativeEvent.contentOffset.x / screenWidth
                        );
                        setTab(pageIndex === 0 ? 'articles' : 'videos');
                    }}
                >
                    {/* Articles page */}
                    <View style={{ width: screenWidth }}>
                        <FlatList
                            data={filteredArticles}
                            keyExtractor={(item) => String(item.id)}
                            renderItem={renderArticleCard}
                            contentContainerStyle={{ padding: 16, paddingTop: 8 }}
                            showsVerticalScrollIndicator={false}
                            ListEmptyComponent={
                                <View className="flex-1 items-center justify-center py-20">
                                    <Text className="text-slate-400 text-base text-center">
                                        No articles found.
                                    </Text>
                                </View>
                            }
                        />
                    </View>

                    {/* Videos page */}
                    <View style={{ width: screenWidth }}>
                        <FlatList
                            data={filteredVideos}
                            keyExtractor={(item) => String(item.id)}
                            renderItem={renderVideoCard}
                            contentContainerStyle={{ padding: 16, paddingTop: 8 }}
                            showsVerticalScrollIndicator={false}
                            ListEmptyComponent={
                                <View className="flex-1 items-center justify-center py-20">
                                    <Text className="text-slate-400 text-base text-center">
                                        No videos found.
                                    </Text>
                                </View>
                            }
                        />
                    </View>
                </ScrollView>
            )}
        </SafeAreaView>
    );
};

export default KnowledgeHubScreen;
