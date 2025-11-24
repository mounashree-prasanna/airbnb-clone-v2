# ---- Build Stage ----
FROM node:20-alpine AS builder

    # Set working directory
    WORKDIR /app
    
    # Copy package.json and lock file first (for better caching)
    COPY package*.json ./
    
# Install dependencies using npm ci for faster, more reliable builds
RUN npm ci
    
    # Copy rest of the project files
    COPY . .
    
    # Build the app (creates the dist/ folder)
    RUN npm run build
    
    # ---- Production Stage ----
    FROM nginx:alpine
    
    # Remove default nginx static assets
    RUN rm -rf /usr/share/nginx/html/*
    
    # Copy build output from builder
    COPY --from=builder /app/dist /usr/share/nginx/html
    
# Copy custom nginx configuration for React Router SPA support
COPY nginx.conf /etc/nginx/conf.d/default.conf
    
    # Expose port 80 for the service
    EXPOSE 80
    
    # Start nginx
    CMD ["nginx", "-g", "daemon off;"]