// src/utils/api.js
import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL, // comes from your .env file
  withCredentials: true, // include cookies / sessions
});

export default API;
