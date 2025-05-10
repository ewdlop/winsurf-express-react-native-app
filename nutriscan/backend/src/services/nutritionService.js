const axios = require('axios');
const FormData = require('form-data');
const logger = require('../utils/logger');

class NutritionService {
  constructor() {
    this.nutritionixBaseUrl = 'https://trackapi.nutritionix.com/v2';
    this.appId = process.env.NUTRITIONIX_APP_ID;
    this.apiKey = process.env.NUTRITIONIX_API_KEY;
  }

  // Configure axios instance with Nutritionix headers
  _getAxiosInstance() {
    return axios.create({
      baseURL: this.nutritionixBaseUrl,
      headers: {
        'x-app-id': this.appId,
        'x-app-key': this.apiKey,
        'x-remote-user-id': '0',
        'Content-Type': 'application/json'
      }
    });
  }

  // Scan food by barcode
  async scanBarcode(barcode) {
    try {
      const instance = this._getAxiosInstance();
      const response = await instance.get(`/search/item?upc=${barcode}`);
      
      if (!response.data.foods || response.data.foods.length === 0) {
        throw new Error('No nutritional information found for this barcode');
      }

      const foodItem = response.data.foods[0];
      return this._formatNutritionData(foodItem);
    } catch (error) {
      logger.error('Barcode scanning error', { 
        barcode, 
        error: error.message 
      });
      throw error;
    }
  }

  // Instant food search and nutrition lookup
  async searchFood(query) {
    try {
      const instance = this._getAxiosInstance();
      const response = await instance.post('/natural/nutrients', { query });
      
      if (!response.data.foods || response.data.foods.length === 0) {
        throw new Error('No nutritional information found');
      }

      const foodItem = response.data.foods[0];
      return this._formatNutritionData(foodItem);
    } catch (error) {
      logger.error('Food search error', { 
        query, 
        error: error.message 
      });
      throw error;
    }
  }

  // Scan food image for nutrition
  async scanFoodImage(imageFile) {
    try {
      const instance = this._getAxiosInstance();
      
      // Create form data for image upload
      const formData = new FormData();
      formData.append('image', imageFile);

      const response = await instance.post('/nutrition-details', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (!response.data.foods || response.data.foods.length === 0) {
        throw new Error('No nutritional information found in the image');
      }

      const foodItem = response.data.foods[0];
      return this._formatNutritionData(foodItem);
    } catch (error) {
      logger.error('Food image scanning error', { 
        error: error.message 
      });
      throw error;
    }
  }

  // Format nutrition data to a consistent structure
  _formatNutritionData(foodItem) {
    return {
      foodName: foodItem.food_name || 'Unknown Food',
      servingSize: {
        amount: foodItem.serving_qty || 1,
        unit: foodItem.serving_unit || 'serving'
      },
      nutritionalInfo: {
        calories: foodItem.nf_calories || 0,
        protein: foodItem.nf_protein || 0,
        carbohydrates: foodItem.nf_total_carbohydrate || 0,
        fat: foodItem.nf_total_fat || 0,
        fiber: foodItem.nf_dietary_fiber || 0,
        sugar: foodItem.nf_sugars || 0
      },
      fullNutritionDetails: foodItem
    };
  }
}

module.exports = new NutritionService();
