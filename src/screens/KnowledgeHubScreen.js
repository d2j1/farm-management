import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Linking, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { fetchArticles, fetchVideos } from '../services/api';

const KnowledgeHubScreen = () => {
    const { t } = useTranslation();
    const [tab, setTab] = useState('articles'); // 'articles' | 'videos'
    const [articles, setArticles] = useState([]);
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);

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
        <View style={styles.card}>
            <Text style={styles.categoryBadge}>{item.category}</Text>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardContent} numberOfLines={3}>{item.content}</Text>
            <TouchableOpacity style={styles.readMoreBtn}>
                <Text style={styles.readMoreText}>Read Full Article</Text>
            </TouchableOpacity>
        </View>
    );

    const renderVideo = ({ item }) => (
        <View style={styles.card}>
            <Image source={{ uri: item.thumbnail }} style={styles.thumbnail} resizeMode="cover" />
            <View style={styles.videoInfo}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <TouchableOpacity
                    style={styles.playBtn}
                    onPress={() => Linking.openURL(item.url)}
                >
                    <Text style={styles.playText}>▶ Watch on YouTube</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>{t('knowledgeHub')}</Text>
            </View>
            <View style={styles.container}>

                {/* Tabs */}
                <View style={styles.tabContainer}>
                    <TouchableOpacity
                        style={[styles.tab, tab === 'articles' && styles.tabActive]}
                        onPress={() => setTab('articles')}
                    >
                        <Text style={[styles.tabText, tab === 'articles' && styles.tabTextActive]}>Articles</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, tab === 'videos' && styles.tabActive]}
                        onPress={() => setTab('videos')}
                    >
                        <Text style={[styles.tabText, tab === 'videos' && styles.tabTextActive]}>Videos</Text>
                    </TouchableOpacity>
                </View>

                {/* Content */}
                {loading ? (
                    <View style={styles.center}>
                        <ActivityIndicator size="large" color="#2E7D32" />
                    </View>
                ) : tab === 'articles' ? (
                    <FlatList
                        data={articles}
                        keyExtractor={item => item.id}
                        renderItem={renderArticle}
                        contentContainerStyle={styles.listContainer}
                    />
                ) : (
                    <FlatList
                        data={videos}
                        keyExtractor={item => item.id}
                        renderItem={renderVideo}
                        contentContainerStyle={styles.listContainer}
                    />
                )}
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#1B5E20' },
    header: { paddingHorizontal: 20, paddingVertical: 15, backgroundColor: '#1B5E20', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 2 },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: 'white' },
    container: { flex: 1, backgroundColor: '#F9F9F9' },
    tabContainer: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 10 },
    tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: '#E0E0E0' },
    tabActive: { borderBottomColor: '#2E7D32' },
    tabText: { fontSize: 16, color: '#666', fontWeight: '500' },
    tabTextActive: { color: '#2E7D32', fontWeight: 'bold' },
    listContainer: { padding: 20 },
    card: { backgroundColor: '#FFF', borderRadius: 10, padding: 15, marginBottom: 15, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3 },
    categoryBadge: { alignSelf: 'flex-start', backgroundColor: '#E8F5E9', color: '#1B5E20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 15, fontSize: 12, fontWeight: 'bold', marginBottom: 10 },
    cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 8 },
    cardContent: { fontSize: 14, color: '#666', lineHeight: 20, marginBottom: 15 },
    readMoreBtn: { paddingVertical: 8 },
    readMoreText: { color: '#1976D2', fontWeight: 'bold' },
    thumbnail: { width: '100%', height: 180, borderRadius: 8, marginBottom: 12 },
    videoInfo: { paddingHorizontal: 5 },
    playBtn: { backgroundColor: '#FF0000', paddingVertical: 10, borderRadius: 8, alignItems: 'center', marginTop: 10 },
    playText: { color: 'white', fontWeight: 'bold' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});

export default KnowledgeHubScreen;
