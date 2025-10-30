import React, { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";
import LocalStorageService from "../services/localStorage";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize axios defaults with stored token if it exists
  useEffect(() => {
    const t = LocalStorageService.getAuthToken();
    if (t) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${t}`;
    }
  }, []);

  // Check authentication on mount
  useEffect(() => {
    const t = LocalStorageService.getAuthToken();
    if (!t) {
      setLoading(false);
      return;
    }

    // verify with server
    axios
      .get("http://localhost:4000/api/verify")
      .then((res) => {
        setUser(res.data.user);
        setToken(t);
        LocalStorageService.setUserId(res.data.user.id);
      })
      .catch(() => {
        handleLogout();
      })
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = () => {
    LocalStorageService.clearAuth();
    delete axios.defaults.headers.common["Authorization"];
    setUser(null);
    setToken(null);
  };

  const login = async (username, password) => {
    const res = await axios.post("http://localhost:4000/api/login", {
      username,
      password,
    });
    
    const t = res.data.token;
    const userData = res.data.user;
    
    // Set up auth state
    LocalStorageService.setAuthToken(t);
    LocalStorageService.setUserId(userData.id);
    axios.defaults.headers.common["Authorization"] = `Bearer ${t}`;
    setToken(t);
    setUser(userData);
    
    // Initialize socket connection with token
    const { initializeSocket } = await import("../utils/socket");
    initializeSocket(t);

    // Load and cache foods data immediately after login
    const { loadInitialData } = await import("../services/initialDataLoader");
    try {
      const foods = await loadInitialData();
      console.log("Foods cached successfully:", foods.length, "items");
    } catch (error) {
      console.error("Failed to cache foods:", error);
      // Show error to user
      alert("Failed to load foods data. Some features might not work offline.");
    }

    return res.data.user;
  };

  const logout = async () => {
    LocalStorageService.clearAuth();
    delete axios.defaults.headers.common["Authorization"];
    setToken(null);
    setUser(null);

    // Disconnect socket using dynamic import
    const { disconnectSocket } = await import("../utils/socket");
    disconnectSocket();
  };

  const value = { user, token, loading, login, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthProvider;
