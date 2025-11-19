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
    return axios.post(`${base}/logout`, {}, { withCredentials: true });
  }

  async checkSession(role) {
    const resolvedRole = role || localStorage.getItem("role") || "traveler";
    const base =
      resolvedRole === "owner"
        ? `${API_BASE_URL}/owner/auth`
        : `${API_BASE_URL}/traveler/auth`;
    
    // Include Authorization header with token for checkSession
    const token = localStorage.getItem("token");
    const config = { 
      withCredentials: true,
      headers: {}
    };
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return axios.get(`${base}/check-session`, config);
  }
}

export default new AuthService();
