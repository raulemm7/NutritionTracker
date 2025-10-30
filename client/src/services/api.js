import axios from "axios";
import LocalStorageService from "./localStorage";

// Operation types
export const OPERATION_TYPES = {
  ADD_FOOD_TO_MEAL: "ADD_FOOD_TO_MEAL",
  UPDATE_MEAL: "UPDATE_MEAL",
  DELETE_FOOD_FROM_MEAL: "DELETE_FOOD_FROM_MEAL",
};

class ApiService {
  constructor() {
    this.baseURL = "http://localhost:4000/api";
    this.isOnline = navigator.onLine;

    // Listen for online/offline changes
    window.addEventListener("online", () => {
      this.isOnline = true;
      this.processPendingOperations();
    });
    window.addEventListener("offline", () => {
      this.isOnline = false;
    });
  }

  async getFoods() {
    try {
      // Check authentication first
      const authToken = LocalStorageService.getAuthToken();
      if (!authToken) {
        throw new Error("Not authenticated");
      }

      const cachedFoods = LocalStorageService.getFoodsCache();
      
      if (!this.isOnline) {
        if (cachedFoods) return cachedFoods;
        throw new Error("No cached foods available");
      }

      try {
        const response = await axios.get(`${this.baseURL}/foods`, {
          headers: {
            Authorization: `Bearer ${authToken}`
          }
        });
        // Cache foods when we get them
        LocalStorageService.setFoodsCache(response.data);
        return response.data;
      } catch (error) {
        if (error.response && error.response.status === 401) {
          // Clear cache if unauthorized
          LocalStorageService.clearAuth();
          throw new Error("Not authenticated");
        }
        if (cachedFoods) return cachedFoods;
        throw error;
      }
    } catch (error) {
      console.error("Error fetching foods:", error);
      throw error;
    }
  }

  // Meals API
  async getMeals(date) {
    try {
      // Verify authentication
      const userId = LocalStorageService.getUserId();
      const authToken = LocalStorageService.getAuthToken();
      if (!userId || !authToken) {
        throw new Error("User not authenticated");
      }

      // Always ensure we have foods cached
      await this.getFoods();

      // Get local data for the current user only
      const localMeals = LocalStorageService.getOfflineMealsByDate(userId, date) || {};

      if (!this.isOnline) {
        return localMeals;
      }

      // If online, get server data and merge with local
      try {
        const response = await axios.get(`${this.baseURL}/meals/${date}`, {
          headers: {
            Authorization: `Bearer ${authToken}`
          }
        });
        
        const serverMeals = response.data || {};

        // Merge server and local data, preferring local pending changes
        const mergedMeals = {
          breakfast: { ...serverMeals.breakfast, ...localMeals.breakfast },
          lunch: { ...serverMeals.lunch, ...localMeals.lunch },
          dinner: { ...serverMeals.dinner, ...localMeals.dinner },
        };

        // Update local storage with merged data
        Object.entries(mergedMeals).forEach(([mealType, mealData]) => {
          if (mealData) {
            LocalStorageService.addOfflineMeal(date, mealType, mealData);
          }
        });

        return mergedMeals;
      } catch (error) {
        console.warn("Failed to fetch from server, using local data:", error);
        return localMeals;
      }
    } catch (error) {
      console.error("Error in getMeals:", error);
      throw error;
    }
  }

  async addFoodToMeal(date, mealType, foodData) {
    const operation = {
      type: OPERATION_TYPES.ADD_FOOD_TO_MEAL,
      data: { date, mealType, foodData },
    };

    try {
      if (!this.isOnline) {
        return this.handleOfflineOperation(operation);
      }

      const response = await axios.post(
        `${this.baseURL}/meals/${date}/${mealType}`,
        foodData,
      );
      return response.data;
    } catch (error) {
      return this.handleOfflineOperation(operation);
    }
  }

  // Handle offline operations
  async handleOfflineOperation(operation) {
    const { type, data } = operation;
    let result;

    switch (type) {
      case OPERATION_TYPES.ADD_FOOD_TO_MEAL: {
        const { date, mealType, foodData } = data;
          const userId = LocalStorageService.getUserId();
          const meals = LocalStorageService.getOfflineMealsByDate(userId, date) || {};

        if (!meals[mealType]) {
          meals[mealType] = {
            time: new Date().toLocaleTimeString("en-US", { hour12: false }),
            foods: [],
          };
        }

        // Get complete food info from cache
        let food = LocalStorageService.getFoodFromCache(foodData.foodId);
        if (!food && this.isOnline) {
          console.log("Food not in cache, fetching fresh data...");

          // Only try to fetch if we're online
          const response = await axios.get(`${this.baseURL}/foods`);
          if (response.data && Array.isArray(response.data)) {
            LocalStorageService.setFoodsCache(response.data);
            food = LocalStorageService.getFoodFromCache(foodData.foodId);
          }
        }

        if (!food) {
          throw new Error(
            "Could not get food data. Please ensure you are online and try again.",
          );
        }

        // Create the food entry with all necessary data
        const foodEntry = {
          id: food.id,
          name: food.name,
          calories: food.calories,
          quantity: Number(foodData.quantity),
        };

        meals[mealType].foods.push(foodEntry);
        result = LocalStorageService.addOfflineMeal(
          date,
          mealType,
          meals[mealType],
        );
        break;
      }
      // Add other operation type handlers here
    }

    // Add to pending operations queue
    LocalStorageService.addPendingOperation(operation);
    return result;
  }

  // Process pending operations when back online
  async processPendingOperations() {
    if (!this.isOnline) return;

    const operations = LocalStorageService.getPendingOperations();
    const results = [];

    for (const operation of operations) {
      try {
        const { type, data } = operation;
        let result;

        switch (type) {
          case OPERATION_TYPES.ADD_FOOD_TO_MEAL: {
            const { date, mealType, foodData } = data;
            result = await axios.post(
              `${this.baseURL}/meals/${date}/${mealType}`,
              foodData,
            );
            break;
          }
          // Add other operation type handlers here
        }

        results.push({ success: true, operation, result: result.data });
        LocalStorageService.removePendingOperation(operation.id);
      } catch (error) {
        results.push({ success: false, operation, error });
      }
    }

    // Update last sync timestamp
    LocalStorageService.updateLastSync();
    return results;
  }

  // Get pending operations count
  getPendingOperationsCount() {
    return LocalStorageService.getPendingOperations().length;
  }
}

export default new ApiService();
