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
    const base =
      role === "owner"
        ? `${API_BASE_URL}/owner/auth`
        : `${API_BASE_URL}/traveler/auth`;
    return axios.post(`${base}/logout`, {}, { withCredentials: true });
  }

  async checkSession(role) {
    const base =
      role === "owner"
        ? `${API_BASE_URL}/owner/auth`
        : `${API_BASE_URL}/traveler/auth`;
    return axios.get(`${base}/check-session`, { withCredentials: true });
  }
}

export default new AuthService();
