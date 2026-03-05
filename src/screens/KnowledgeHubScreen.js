import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Linking, ActivityIndicator, useColorScheme, TextInput, ScrollView, Dimensions } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { fetchArticles, fetchVideos } from '../services/api';

const KnowledgeHubScreen = () => {
    const isDark = useColorScheme() === 'dark';
    const { t } = useTranslation();
    const [tab, setTab] = useState('articles'); // 'articles' | 'videos'
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
            setArticles(fetchedArticles);
            setVideos(fetchedVideos);
        } catch (error) {
            console.error('Failed to fetch knowledge base:', error);
        } finally {
            setLoading(false);
        }
    };

    const renderArticle = ({ item }) => (
        <View style={[styles.card, isDark && styles.cardDark]}>
            <Text style={[styles.categoryBadge, isDark && styles.categoryBadgeDark]}>{item.category}</Text>
            <Text style={[styles.cardTitle, isDark && styles.textDark]}>{item.title}</Text>
            <Text style={[styles.cardContent, isDark && styles.textMutedDark]} numberOfLines={3}>{item.content}</Text>
            <TouchableOpacity style={styles.readMoreBtn}>
                <Text style={[styles.readMoreText, isDark && { color: '#64B5F6' }]}>{t('readFullArticle')}</Text>
            </TouchableOpacity>
        </View>
    );

    const renderVideo = ({ item }) => (
        <View style={[styles.card, isDark && styles.cardDark]}>
            <Image source={{ uri: item.thumbnail }} style={styles.thumbnail} resizeMode="cover" />
            <View style={styles.videoInfo}>
                <Text style={[styles.cardTitle, isDark && styles.textDark]}>{item.title}</Text>
                <TouchableOpacity
                    style={styles.playBtn}
                    onPress={() => Linking.openURL(item.url)}
                >
                    <Text style={styles.playText}>{t('watchOnYoutube')}</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const allCategories = ['All', ...new Set([
        ...articles.map(a => a.category),
        ...videos.map(v => v?.category)
    ].filter(Boolean))];

    const filterData = (data) => {
        return data.filter(item => {
            const matchesSearch = item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.content?.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = selectedFilter === 'All' || item.category === selectedFilter;
            return matchesSearch && matchesCategory;
        });
    };

    const filteredArticles = filterData(articles);
    const filteredVideos = filterData(videos);

    return (
        <SafeAreaView style={[styles.safeArea, isDark && styles.safeAreaDark]}>
            <View style={[styles.header, isDark && styles.headerDark]}>
                <Text style={styles.headerTitle}>{t('knowledgeHub')}</Text>
            </View>
            <View style={[styles.container, isDark && styles.containerDark]}>

                {/* Tabs */}
                <View style={[styles.tabContainer, isDark && { borderBottomColor: '#333' }]}>
                    <TouchableOpacity
                        style={[styles.tab, isDark && styles.tabDark, tab === 'articles' && styles.tabActive, isDark && tab === 'articles' && styles.tabActiveDark]}
                        onPress={() => {
                            setTab('articles');
                            scrollRef.current?.scrollTo({ x: 0, animated: true });
                        }}
                    >
                        <Text style={[styles.tabText, isDark && styles.textMutedDark, tab === 'articles' && styles.tabTextActive, isDark && tab === 'articles' && styles.tabTextActiveDark]}>{t('articles')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, isDark && styles.tabDark, tab === 'videos' && styles.tabActive, isDark && tab === 'videos' && styles.tabActiveDark]}
                        onPress={() => {
                            setTab('videos');
                            scrollRef.current?.scrollTo({ x: screenWidth, animated: true });
                        }}
                    >
                        <Text style={[styles.tabText, isDark && styles.textMutedDark, tab === 'videos' && styles.tabTextActive, isDark && tab === 'videos' && styles.tabTextActiveDark]}>{t('videos')}</Text>
                    </TouchableOpacity>
                </View>

                {/* Search */}
                <View style={styles.searchContainer}>
                    <View style={[styles.searchInputWrapper, isDark && styles.searchInputWrapperDark]}>
                        <TextInput
                            style={[styles.searchInput, isDark && styles.searchInputDark]}
                            placeholder={t('search') || 'Search...'}
                            placeholderTextColor={isDark ? '#888' : '#aaa'}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearIconContainer}>
                                <Text style={[styles.clearIconText, isDark && styles.clearIconTextDark]}>✕</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {/* Filters */}
                <View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                        {allCategories.map(cat => (
                            <TouchableOpacity
                                key={cat}
                                style={[styles.filterChip, selectedFilter === cat && styles.filterChipSelected, isDark && styles.filterChipDark, isDark && selectedFilter === cat && styles.filterChipSelectedDark]}
                                onPress={() => setSelectedFilter(cat)}
                            >
                                <Text style={[styles.filterText, selectedFilter === cat && styles.filterTextSelected, isDark && styles.filterTextDark]}>{cat}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Content */}
                {loading ? (
                    <View style={styles.center}>
                        <ActivityIndicator size="large" color="#2E7D32" />
                    </View>
                ) : (
                    <ScrollView
                        ref={scrollRef}
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        onMomentumScrollEnd={(e) => {
                            const pageIndex = Math.round(e.nativeEvent.contentOffset.x / screenWidth);
                            setTab(pageIndex === 0 ? 'articles' : 'videos');
                        }}
                    >
                        <View style={{ width: screenWidth }}>
                            <FlatList
                                data={filteredArticles}
                                keyExtractor={item => item.id}
                                renderItem={renderArticle}
                                contentContainerStyle={styles.listContainer}
                            />
                        </View>
                        <View style={{ width: screenWidth }}>
                            <FlatList
                                data={filteredVideos}
                                keyExtractor={item => item.id}
                                renderItem={renderVideo}
                                contentContainerStyle={styles.listContainer}
                            />
                        </View>
                    </ScrollView>
                )}
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#1B5E20' },
    safeAreaDark: { backgroundColor: '#121212' },
    header: { paddingHorizontal: 20, paddingVertical: 15, backgroundColor: '#1B5E20', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 2 },
    headerDark: { backgroundColor: '#1F1F1F' },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: 'white' },
    container: { flex: 1, backgroundColor: '#F9F9F9' },
    containerDark: { backgroundColor: '#121212' },
    tabContainer: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 10 },
    tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: '#E0E0E0' },
    tabDark: { borderBottomColor: '#444' },
    tabActive: { borderBottomColor: '#2E7D32' },
    tabActiveDark: { borderBottomColor: '#81C784' },
    tabText: { fontSize: 16, color: '#666', fontWeight: '500' },
    tabTextActive: { color: '#2E7D32', fontWeight: 'bold' },
    tabTextActiveDark: { color: '#81C784' },
    listContainer: { padding: 20 },
    card: { backgroundColor: '#FFF', borderRadius: 10, padding: 15, marginBottom: 15, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3 },
    cardDark: { backgroundColor: '#1E1E1E' },
    categoryBadge: { alignSelf: 'flex-start', backgroundColor: '#E8F5E9', color: '#1B5E20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 15, fontSize: 12, fontWeight: 'bold', marginBottom: 10 },
    categoryBadgeDark: { backgroundColor: '#1B5E20', color: '#E8F5E9' },
    cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 8 },
    cardContent: { fontSize: 14, color: '#666', lineHeight: 20, marginBottom: 15 },
    readMoreBtn: { paddingVertical: 8 },
    readMoreText: { color: '#1976D2', fontWeight: 'bold' },
    thumbnail: { width: '100%', height: 180, borderRadius: 8, marginBottom: 12 },
    videoInfo: { paddingHorizontal: 5 },
    playBtn: { backgroundColor: '#FF0000', paddingVertical: 10, borderRadius: 8, alignItems: 'center', marginTop: 10 },
    playText: { color: 'white', fontWeight: 'bold' },
    searchContainer: { paddingHorizontal: 20, marginBottom: 10 },
    searchInputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 8, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
    searchInputWrapperDark: { backgroundColor: '#1E1E1E' },
    searchInput: { flex: 1, paddingHorizontal: 15, paddingVertical: 10, fontSize: 16, color: '#000' },
    searchInputDark: { color: '#FFF' },
    clearIconContainer: { padding: 10, justifyContent: 'center', alignItems: 'center' },
    clearIconText: { fontSize: 16, color: '#888', fontWeight: 'bold' },
    clearIconTextDark: { color: '#AAA' },
    filterScroll: { paddingHorizontal: 20, paddingBottom: 15, gap: 8 },
    filterChip: { backgroundColor: '#FFF', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 1 },
    filterChipDark: { backgroundColor: '#1E1E1E' },
    filterChipSelected: { backgroundColor: '#2E7D32' },
    filterChipSelectedDark: { backgroundColor: '#81C784' },
    filterText: { color: '#666', fontWeight: '500', fontSize: 16 },
    filterTextDark: { color: '#AAAAAA' },
    filterTextSelected: { color: '#FFF', fontWeight: 'bold' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    textDark: { color: '#E0E0E0' },
    textMutedDark: { color: '#AAAAAA' }
});

export default KnowledgeHubScreen;
