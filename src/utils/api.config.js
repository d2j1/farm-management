import { Platform } from 'react-native';

/**
 * API Configuration
 * 
 * For local development:
 * - Android Emulator: http://10.0.2.2:5000/api
 * - iOS Simulator: http://localhost:5000/api
 * - Physical Device: http://<your-ip>:5000/api
 */

// Replace with your local machine's IP address if testing on a physical device
const LOCAL_IP = '192.168.31.69'; 

export const API_CONFIG = {
  BASE_URL: __DEV__ 
    ? `http://${LOCAL_IP}:5000/api` 
    : 'https://api.yourproductionurl.com/api', // Update this when deploying to production
  HEADERS: {
    'X-App-ID': 'farm_manager_prod_mobile_7f8e9d0c1b2a',
    'Content-Type': 'application/json',
  },
};
