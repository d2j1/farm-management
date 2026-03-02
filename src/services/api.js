import axios from 'axios';

// Mock configuration - replace with actual Spring Boot IP/Domain
// E.g. http://192.168.1.5:8080/api/v1
const API_BASE_URL = 'http://localhost:8080/api';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 5000,
});

export const fetchArticles = async () => {
    // try {
    //     const response = await apiClient.get('/articles');
    //     return response.data;
    // } catch (error) { ... }

    // Mocking the response for the UI
    return [
        { id: '1', title: 'Organic Pesticides: A Guide', category: 'Organic Farming', content: 'Neem oil is one of the most effective organic pesticides...' },
        { id: '2', title: 'New Government Subsidies 2024', category: 'Government Schemes', content: 'Farmers can now claim up to 50% subsidy on solar water pumps.' },
        { id: '3', title: 'Soil Health Management', category: 'Soil Health', content: 'Testing your soil pH before sowing is crucial for high yields.' },
    ];
};

export const fetchVideos = async () => {
    // Mocking the response for the UI
    return [
        { id: '1', title: 'Modern Drip Irrigation Setup', url: 'https://youtube.com/watch?v=mock1', thumbnail: 'https://via.placeholder.com/300x150.png?text=Drip+Irrigation' },
        { id: '2', title: 'Sugarcane Harvesting Tech', url: 'https://youtube.com/watch?v=mock2', thumbnail: 'https://via.placeholder.com/300x150.png?text=Sugarcane+Tech' },
    ];
};
