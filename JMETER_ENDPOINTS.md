# Airbnb Lab2 - Complete API Endpoints for JMeter Testing

**Base URL:** `http://airbnb.local` (or your ingress hostname)

**Note:** All endpoints require `Content-Type: application/json` header. Protected endpoints require `Authorization: Bearer <token>` header.

---

## 🔐 TRAVELER SERVICE (`/traveler`)

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required | Request Body |
|--------|----------|-------------|---------------|--------------|
| POST | `/traveler/auth/signup` | Register new traveler | No | `{ name, email, password, role: "traveler", phone?, city?, country?, language?, gender? }` |
| POST | `/traveler/auth/login` | Login traveler | No | `{ email, password, role: "traveler" }` |
| POST | `/traveler/auth/logout` | Logout traveler | No | `{ refreshToken }` |
| POST | `/traveler/auth/refresh` | Refresh access token | No | `{ refreshToken }` |
| POST | `/traveler/auth/check-session` | Check session (with refresh token) | No | `{ refreshToken? }` |
| GET | `/traveler/auth/check-session` | Check session (with access token) | Yes | - |

### Profile Endpoints

| Method | Endpoint | Description | Auth Required | Request Body |
|--------|----------|-------------|---------------|--------------|
| GET | `/traveler/profile` | Get traveler profile | Yes | - |
| PUT | `/traveler/profile` | Update traveler profile | Yes | `{ name?, email?, phone?, city?, state?, country?, languages?, gender?, about?, profile_image? }` |

### Favourites Endpoints

| Method | Endpoint | Description | Auth Required | Request Body |
|--------|----------|-------------|---------------|--------------|
| GET | `/traveler/favourites/my-favourites` | Get all favourites | Yes | - |
| POST | `/traveler/favourites/add` | Add to favourites | Yes | `{ propertyId }` |
| DELETE | `/traveler/favourites/remove/:propertyId` | Remove from favourites | Yes | - |

### Health Check

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/traveler/` | Service health check | No |

---

## 🏠 OWNER SERVICE (`/owner`)

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required | Request Body |
|--------|----------|-------------|---------------|--------------|
| POST | `/owner/auth/signup` | Register new owner | No | `{ name, email, password, phone?, role: "owner" }` |
| POST | `/owner/auth/login` | Login owner | No | `{ email, password, role: "owner" }` |
| POST | `/owner/auth/logout` | Logout owner | No | `{ refreshToken }` |
| POST | `/owner/auth/refresh` | Refresh access token | No | `{ refreshToken }` |
| POST | `/owner/auth/check-session` | Check session (with refresh token) | No | `{ refreshToken? }` |
| GET | `/owner/auth/check-session` | Check session (with access token) | Yes | - |

### Profile Endpoints

| Method | Endpoint | Description | Auth Required | Request Body |
|--------|----------|-------------|---------------|--------------|
| GET | `/owner/auth/profile` | Get owner profile | Yes | - |
| PUT | `/owner/auth/profile` | Update owner profile | Yes | `{ name?, email?, phone?, location?, about?, city?, state?, country?, languages?, gender?, profile_image? }` |

### Health Check

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/owner/` | Service health check | No |
| GET | `/owner/health` | Health check endpoint | No |

---

## 🏘️ PROPERTY SERVICE (`/property`)

### Public Property Endpoints

| Method | Endpoint | Description | Auth Required | Request Body |
|--------|----------|-------------|---------------|--------------|
| GET | `/property/api/property` | Get all properties | No | - |
| GET | `/property/api/property/search` | Search properties | No | Query params: `?location=...&startDate=...&endDate=...&guests=...` |
| GET | `/property/api/property/:id` | Get property by ID | No | - |

### Owner Property Management Endpoints

| Method | Endpoint | Description | Auth Required | Request Body |
|--------|----------|-------------|---------------|--------------|
| GET | `/property/api/property/owner/me` | Get owner's properties | Yes (Owner) | - |
| POST | `/property/api/property/owner` | Create new property | Yes (Owner) | `{ title, description, location, price, bedrooms, bathrooms, guests, amenities[], photo_url? }` |
| PUT | `/property/api/property/owner/:id` | Update property | Yes (Owner) | `{ title?, description?, location?, price?, bedrooms?, bathrooms?, guests?, amenities[]?, photo_url? }` |
| DELETE | `/property/api/property/owner/:id` | Delete property | Yes (Owner) | - |

### Health Check

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/property/` | Service health check | No |

---

## 📅 BOOKING SERVICE (`/booking`)

### Booking Endpoints

| Method | Endpoint | Description | Auth Required | Request Body |
|--------|----------|-------------|---------------|--------------|
| POST | `/booking/booking` | Create new booking | Yes | `{ propertyId, ownerId, startDate, endDate, guests }` |
| GET | `/booking/booking/traveler` | Get traveler's bookings | Yes | - |
| GET | `/booking/booking/owner/:ownerId` | Get owner's bookings | No | - |
| PUT | `/booking/booking/:id/status` | Update booking status | No | `{ status: "ACCEPTED" \| "CANCELLED" \| "PENDING" }` |

### Health Check

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/booking/` | Service health check | No |

---

## 🤖 AI SERVICE (`/ai`)

### Chatbot Endpoints

| Method | Endpoint | Description | Auth Required | Request Body |
|--------|----------|-------------|---------------|--------------|
| POST | `/ai/chatbot` | Chat with AI concierge | No | `{ traveler_id, message, booking_context? }` |
| GET | `/ai/chatbot/history/:traveler_id` | Get chat history | No | - |
| DELETE | `/ai/chatbot/history/:traveler_id` | Clear chat history | No | - |

### Health Check

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/ai/health` | Service health check | No |

---

## 📝 Sample Request Bodies

### Traveler Signup
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "role": "traveler",
  "phone": "+1234567890",
  "city": "New York",
  "country": "USA"
}
```

### Owner Signup
```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "password": "SecurePass123!",
  "role": "owner",
  "phone": "+1234567890"
}
```

### Login (Traveler/Owner)
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "role": "traveler"
}
```

### Refresh Token
```json
{
  "refreshToken": "<refresh_token_from_login>"
}
```

### Create Booking
```json
{
  "propertyId": "507f1f77bcf86cd799439011",
  "ownerId": "507f1f77bcf86cd799439012",
  "startDate": "2025-12-01",
  "endDate": "2025-12-05",
  "guests": 2
}
```

### Update Booking Status
```json
{
  "status": "CANCELLED"
}
```

### Create Property
```json
{
  "title": "Beautiful Beach House",
  "description": "Stunning ocean view",
  "location": "Miami, FL",
  "price": 150,
  "bedrooms": 3,
  "bathrooms": 2,
  "guests": 6,
  "amenities": ["WiFi", "Pool", "Parking"]
}
```

### AI Chatbot
```json
{
  "traveler_id": "507f1f77bcf86cd799439011",
  "message": "I want to visit Miami from November 17 to November 19",
  "booking_context": {
    "location": "Miami",
    "startDate": "2025-11-17",
    "endDate": "2025-11-19"
  }
}
```

### Add to Favourites
```json
{
  "propertyId": "507f1f77bcf86cd799439011"
}
```

---

## 🔑 Authentication Flow for JMeter

1. **Signup/Login** → Get `accessToken` and `refreshToken`
2. **Use accessToken** → Set header: `Authorization: Bearer <accessToken>`
3. **When accessToken expires (2 min)** → Use `/refresh` endpoint with `refreshToken`
4. **Get new accessToken** → Update Authorization header
5. **Logout** → Send `refreshToken` in body to clear session

---

## 📊 JMeter Test Plan Structure

### Thread Groups Suggested:
1. **Authentication Tests** - Signup, Login, Refresh, Logout
2. **Traveler Flow** - Profile, Favourites, Bookings
3. **Owner Flow** - Profile, Properties, Bookings
4. **Property Search** - Search, View, Create, Update, Delete
5. **Booking Flow** - Create, View, Cancel
6. **AI Chatbot** - Chat, History

### Variables to Set:
- `${BASE_URL}` = `http://airbnb.local`
- `${ACCESS_TOKEN}` = Token from login response
- `${REFRESH_TOKEN}` = Refresh token from login response
- `${TRAVELER_ID}` = User ID from login
- `${OWNER_ID}` = Owner ID from login
- `${PROPERTY_ID}` = Property ID from create property
- `${BOOKING_ID}` = Booking ID from create booking

---

## ⚠️ Important Notes

1. **Token Expiry**: Access tokens expire in 2 minutes. Use refresh token endpoint to get new access token.
2. **CORS**: All endpoints support CORS from `http://airbnb.local` and `http://localhost:5173`
3. **Path Rewriting**: Ingress rewrites paths, so `/traveler/auth/login` becomes `/auth/login` internally
4. **Protected Routes**: Routes marked "Yes" require valid JWT token in Authorization header
5. **Role-based Access**: Some routes require specific roles (traveler/owner)

