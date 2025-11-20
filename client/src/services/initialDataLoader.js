import LocalStorageService from "./localStorage";
import axios from "axios";
import { API_BASE_URL } from "../config";

export async function loadInitialData() {
  try {
    console.log("Fetching and caching foods data...");
    const foodsResponse = await axios.get(`${API_BASE_URL}/foods`);
    const foods = foodsResponse.data;

    if (!Array.isArray(foods) || foods.length === 0) {
      throw new Error("No foods data received");
    }

    // Store foods in localStorage
    LocalStorageService.setFoodsCache(foods);
    console.log(`Cached ${foods.length} foods successfully`);

    return foods;
  } catch (error) {
    console.error("Error loading foods data:", error);
    throw error;
  }
}
