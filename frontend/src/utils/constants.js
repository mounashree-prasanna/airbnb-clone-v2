export const COUNTRIES = [
  { code: "US", name: "United States" },
  { code: "IN", name: "India" },
  { code: "UK", name: "United Kingdom" },
  { code: "CA", name: "Canada" },
  { code: "AU", name: "Australia" },
];

export const LANGUAGES = ["English", "Spanish", "French", "Hindi", "Mandarin"];

export const GENDERS = ["Male", "Female", "Other", "Prefer not to say"];

// API Base URL - Uses environment variable or falls back to ingress host
// Set VITE_API_BASE_URL in .env file to your ingress external IP/hostname
// Example: VITE_API_BASE_URL=http://airbnb.local or VITE_API_BASE_URL=http://YOUR_EXTERNAL_IP
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://airbnb.local";

// API endpoint helpers for different microservices
export const API_ENDPOINTS = {
  // Traveler service routes (via /traveler)
  TRAVELER: {
    AUTH: `${API_BASE_URL}/traveler/auth`,
    PROFILE: `${API_BASE_URL}/traveler/profile`,
    FAVOURITES: `${API_BASE_URL}/traveler/favourites`,
    USERS: `${API_BASE_URL}/traveler`,
  },
  // Property service routes (via /property)
  PROPERTY: {
    BASE: `${API_BASE_URL}/property/api/property`,
    SEARCH: `${API_BASE_URL}/property/api/property/search`,
    OWNER: `${API_BASE_URL}/property/api/property/owner`,
  },
  // Owner service routes (via /owner)
  OWNER: {
    BASE: `${API_BASE_URL}/owner/api/owner`,
    PROFILE: `${API_BASE_URL}/owner/api/owner/profile`,
  },
  // Booking service routes (via /booking)
  BOOKING: {
    BASE: `${API_BASE_URL}/booking/booking`,
    TRAVELER: `${API_BASE_URL}/booking/booking/traveler`,
    OWNER: `${API_BASE_URL}/booking/booking/owner`,
  },
};