import axios from "axios";
import { API_BASE_URL } from "../utils/constants";

axios.defaults.withCredentials = true;

class AuthService {
  async login(role, payload) {
    // Dynamically pick endpoint based on role
    const base =
      role === "owner"
        ? `${API_BASE_URL}/owner/auth`
        : `${API_BASE_URL}/traveler/auth`;

    return axios.post(
      `${base}/login`,
      { ...payload, role },
      {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
      }
    );
  }

  async signup(role, payload) {
    const base =
      role === "owner"
        ? `${API_BASE_URL}/owner/auth`
        : `${API_BASE_URL}/traveler/auth`;

    return axios.post(
      `${base}/signup`,
      { ...payload, role },
      {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
      }
    );
  }

  async logout(role) {
    const resolvedRole = role || localStorage.getItem("role") || "traveler";
    const base =
      resolvedRole === "owner"
        ? `${API_BASE_URL}/owner/auth`
        : `${API_BASE_URL}/traveler/auth`;
    const refreshToken = localStorage.getItem("refreshToken");
    return axios.post(`${base}/logout`, { refreshToken }, { withCredentials: true });
  }

  async checkSession(role) {
    const resolvedRole = role || localStorage.getItem("role") || "traveler";
    const base =
      resolvedRole === "owner"
        ? `${API_BASE_URL}/owner/auth`
        : `${API_BASE_URL}/traveler/auth`;
    
    // Include Authorization header with token and refreshToken in body
    const token = localStorage.getItem("token");
    const refreshToken = localStorage.getItem("refreshToken");
    const config = { 
      withCredentials: true,
      headers: {}
    };
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Use POST to send refreshToken in body, fallback to GET for backward compatibility
    if (refreshToken) {
      return axios.post(`${base}/check-session`, { refreshToken }, config);
    }
    return axios.get(`${base}/check-session`, config);
  }

  async refreshToken(role) {
    const resolvedRole = role || localStorage.getItem("role") || "traveler";
    const base =
      resolvedRole === "owner"
        ? `${API_BASE_URL}/owner/auth`
        : `${API_BASE_URL}/traveler/auth`;
    const refreshToken = localStorage.getItem("refreshToken");
    
    if (!refreshToken) {
      throw new Error("No refresh token available");
    }
    
    return axios.post(`${base}/refresh`, { refreshToken }, { withCredentials: true });
  }
}

export default new AuthService();
