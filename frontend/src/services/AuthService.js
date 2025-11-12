import axios from "axios";

const AUTH_API_URL = "http://localhost:5000/api/auth";

axios.defaults.withCredentials = true;

class AuthService {
  async login(role, payload) {
    return axios.post(
      `${AUTH_API_URL}/login`,
      { ...payload, role },
      {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
      }
    );
  }

  async signup(role, payload) {
    return axios.post(
      `${AUTH_API_URL}/signup`,
      { ...payload, role },
      {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
      }
    );
  }

  async logout() {
    return axios.post(`${AUTH_API_URL}/logout`, {}, { withCredentials: true });
  }

  async checkSession() {
    return axios.get(`${AUTH_API_URL}/check-session`, { withCredentials: true });
  }
}

export default new AuthService();
