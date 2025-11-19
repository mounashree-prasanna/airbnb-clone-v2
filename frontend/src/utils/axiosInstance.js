import axios from "axios";
import { API_BASE_URL } from "./constants";

// ✅ Create a custom axios instance
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// ✅ Add an interceptor to attach the token automatically
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token"); // your JWT from login
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ Add a response interceptor for token errors
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn("⚠️ Unauthorized or expired token");
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
