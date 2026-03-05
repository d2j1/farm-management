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
        { id: '1', title: 'Top 5 Most Profitable Crops for Indian Farmers 2024!', url: 'https://www.youtube.com/watch?v=_f7xDWZzn4c', thumbnail: 'https://img.youtube.com/vi/_f7xDWZzn4c/maxresdefault.jpg', category: 'Crops' },
        { id: '2', title: 'Start Farming Step by Step for Beginners', url: 'https://www.youtube.com/watch?v=hzvT0vy5cjE', thumbnail: 'https://img.youtube.com/vi/hzvT0vy5cjE/maxresdefault.jpg', category: 'General' },
    ];
};
