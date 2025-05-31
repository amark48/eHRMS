// src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  // When the component mounts, try to load an existing auth token from localStorage.
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (token) {
      console.log("[DEBUG] AuthContext: Found token:", token);
      try {
        const decodedUser = jwtDecode(token);
        console.log("[DEBUG] AuthContext: Decoded token payload:", decodedUser);
        setUser(decodedUser);
      } catch (error) {
        console.error("[DEBUG] AuthContext: Failed to decode token:", error);
        localStorage.removeItem("authToken");
      }
    } else {
      console.log("[DEBUG] AuthContext: No auth token found in localStorage.");
    }
  }, []);

  // Utility method to login a user by setting the token.
  const login = (token) => {
    localStorage.setItem("authToken", token);
    console.log("[DEBUG] AuthContext: login() set token:", token);
    try {
      const decodedUser = jwtDecode(token);
      console.log("[DEBUG] AuthContext: login() decoded user:", decodedUser);
      setUser(decodedUser);
    } catch (error) {
      console.error("[DEBUG] AuthContext: login() failed to decode token:", error);
    }
  };

  // Utility method to log out the user.
  const logout = () => {
    localStorage.removeItem("authToken");
    setUser(null);
    console.log("[DEBUG] AuthContext: Logged out, user set to null");
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to easily access the auth context in other components.
export const useAuth = () => useContext(AuthContext);