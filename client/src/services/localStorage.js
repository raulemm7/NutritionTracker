const STORAGE_KEYS = {
  PENDING_OPERATIONS: "pendingOperations",
  OFFLINE_MEALS: "offlineMeals",
  LAST_SYNC: "lastSync",
  FOODS_CACHE: "foodsCache",
  USER_ID: "userId",
  AUTH_TOKEN: "authToken",
};

class LocalStorageService {
  // Authentication methods
  static getUserId() {
    return localStorage.getItem(STORAGE_KEYS.USER_ID);
  }

  static setUserId(userId) {
    localStorage.setItem(STORAGE_KEYS.USER_ID, userId);
  }

  static getAuthToken() {
    return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  }

  static setAuthToken(token) {
    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
  }

  static clearAuth() {
    const userId = this.getUserId();
    if (userId) {
      // Clear all user-specific data
      localStorage.removeItem(`${STORAGE_KEYS.OFFLINE_MEALS}_${userId}`);
      localStorage.removeItem(`${STORAGE_KEYS.PENDING_OPERATIONS}_${userId}`);
    }
    // Clear all auth and cache data
    localStorage.removeItem(STORAGE_KEYS.USER_ID);
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.FOODS_CACHE);
    localStorage.removeItem(STORAGE_KEYS.LAST_SYNC);
    
    // Clear any potential leftover data
    for (const key in STORAGE_KEYS) {
      const fullKey = STORAGE_KEYS[key];
      // Remove any user-specific data that might have been missed
      if (userId) {
        localStorage.removeItem(`${fullKey}_${userId}`);
      }
      // Remove the base key as well
      localStorage.removeItem(fullKey);
    }
  }

  // Pending operations queue
  static getPendingOperations() {
    const userId = this.getUserId();
    if (!userId) return [];
    
    const operations = localStorage.getItem(`${STORAGE_KEYS.PENDING_OPERATIONS}_${userId}`);
    return operations ? JSON.parse(operations) : [];
  }

  static addPendingOperation(operation) {
    const userId = this.getUserId();
    if (!userId) return [];

    const operations = this.getPendingOperations();
    operations.push({
      ...operation,
      userId,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
    });
    localStorage.setItem(
      `${STORAGE_KEYS.PENDING_OPERATIONS}_${userId}`,
      JSON.stringify(operations),
    );
    return operations;
  }

  static removePendingOperation(operationId) {
    const userId = this.getUserId();
    if (!userId) return [];

    const operations = this.getPendingOperations();
    const filtered = operations.filter((op) => op.id !== operationId);
    localStorage.setItem(
      `${STORAGE_KEYS.PENDING_OPERATIONS}_${userId}`,
      JSON.stringify(filtered),
    );
    return filtered;
  }

  // Offline meals data
  static getOfflineMeals() {
    const userId = this.getUserId();
    if (!userId) return {};
    
    const meals = localStorage.getItem(`${STORAGE_KEYS.OFFLINE_MEALS}_${userId}`);
    return meals ? JSON.parse(meals) : {};
  }

  static setOfflineMeals(meals) {
    const userId = this.getUserId();
    if (!userId) return;
    
    localStorage.setItem(`${STORAGE_KEYS.OFFLINE_MEALS}_${userId}`, JSON.stringify(meals));
  }

  static getOfflineMealsByDate(userId, date) {
    if (!userId) return null;
    
    const meals = this.getOfflineMeals();
    return meals[date] || null;
  }

  static addOfflineMeal(date, mealType, mealData) {
    const userId = this.getUserId();
    if (!userId) return null;
    
    const meals = this.getOfflineMeals();
    if (!meals[date]) {
      meals[date] = {};
    }
    meals[date][mealType] = mealData;
    this.setOfflineMeals(meals);
    return meals[date];
  }

  // Last sync timestamp
  static getLastSync() {
    return localStorage.getItem(STORAGE_KEYS.LAST_SYNC);
  }

  static updateLastSync() {
    const now = new Date().toISOString();
    localStorage.setItem(STORAGE_KEYS.LAST_SYNC, now);
    return now;
  }

  // Foods cache
  static setFoodsCache(foods) {
    if (!Array.isArray(foods)) {
      console.error("Invalid foods data:", foods);
      return;
    }
    console.log("Caching foods:", foods.length, "items");
    localStorage.setItem(STORAGE_KEYS.FOODS_CACHE, JSON.stringify(foods));
  }

  static getFoodsCache() {
    try {
      const foods = localStorage.getItem(STORAGE_KEYS.FOODS_CACHE);
      if (!foods) return null;

      const parsed = JSON.parse(foods);
      if (!Array.isArray(parsed)) {
        console.error("Cached foods is not an array:", parsed);
        return null;
      }
      return parsed;
    } catch (error) {
      console.error("Error getting foods cache:", error);
      return null;
    }
  }

  static getFoodFromCache(foodId) {
    const foods = this.getFoodsCache();
    if (!foods) {
      console.error("No foods in cache");
      return null;
    }
    const food = foods.find((f) => f.id === foodId);
    if (!food) {
      console.error("Food not found in cache:", foodId);
      return null;
    }
    return food;
  }

  // Clear all offline data
  static clearOfflineData() {
    localStorage.removeItem(STORAGE_KEYS.PENDING_OPERATIONS);
    localStorage.removeItem(STORAGE_KEYS.OFFLINE_MEALS);
    localStorage.removeItem(STORAGE_KEYS.LAST_SYNC);
    localStorage.removeItem(STORAGE_KEYS.FOODS_CACHE);
  }
}

export default LocalStorageService;
