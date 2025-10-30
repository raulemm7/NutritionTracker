import React, { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = localStorage.getItem("authToken");
    if (!t) {
      setLoading(false);
      return;
    }
    axios.defaults.headers.common["Authorization"] = `Bearer ${t}`;
    // verify with server
    axios
      .get("http://localhost:4000/api/verify")
      .then((res) => {
        setUser(res.data.user);
        setToken(t);
      })
      .catch(() => {
        localStorage.removeItem("authToken");
        delete axios.defaults.headers.common["Authorization"];
        setUser(null);
        setToken(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (username, password) => {
    const res = await axios.post("http://localhost:4000/api/login", {
      username,
      password,
    });
    const t = res.data.token;
    localStorage.setItem("authToken", t);
    axios.defaults.headers.common["Authorization"] = `Bearer ${t}`;
    setToken(t);
    setUser(res.data.user);

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

  const logout = () => {
    localStorage.removeItem("authToken");
    delete axios.defaults.headers.common["Authorization"];
    setToken(null);
    setUser(null);

    // Disconnect socket
    const { disconnectSocket } = require("../utils/socket");
    disconnectSocket();
  };

  const value = { user, token, loading, login, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthProvider;
