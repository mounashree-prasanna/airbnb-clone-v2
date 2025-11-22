# ---------------------------
# Stage 1: Build environment
# ---------------------------
FROM node:18-alpine

# Set working directory inside container
WORKDIR /app

# Copy package files first (better caching)
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy everything else (including kafka folder)
COPY . .

# Expose the service port
EXPOSE 7003

# Start the service
CMD ["node", "server.js"]