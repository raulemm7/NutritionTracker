import LocalStorageService from './localStorage';
import axios from 'axios';

export async function loadInitialData() {
    try {
        console.log('Fetching and caching foods data...');
        const foodsResponse = await axios.get('http://localhost:4000/api/foods');
        const foods = foodsResponse.data;
        
        if (!Array.isArray(foods) || foods.length === 0) {
            throw new Error('No foods data received');
        }

        // Store foods in localStorage
        LocalStorageService.setFoodsCache(foods);
        console.log(`Cached ${foods.length} foods successfully`);

        return foods;
    } catch (error) {
        console.error('Error loading foods data:', error);
        throw error;
    }
}