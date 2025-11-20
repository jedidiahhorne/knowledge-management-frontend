# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Accept build argument for API URL BEFORE copying source
# This ensures cache invalidation when the ARG changes
# Railway provides RAILWAY_PUBLIC_DOMAIN for other services, but we need the full public URL
ARG VITE_API_BASE_URL

# Copy source code
COPY . .

# Set environment variable for build
# If VITE_API_BASE_URL is not set, use a placeholder that will be replaced at runtime
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL:-__API_BASE_URL__}

# Log the API URL being used (helps debug and ensures ARG is used, invalidating cache)
RUN echo "Building with VITE_API_BASE_URL=${VITE_API_BASE_URL}"

# Build the application (Vite will use VITE_API_BASE_URL at build time)
RUN npm run build

# Production stage
FROM nginx:alpine

# Install envsubst for environment variable substitution
RUN apk add --no-cache gettext

# Copy built files from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration template
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

# Copy startup script
COPY start-nginx.sh /start-nginx.sh
RUN chmod +x /start-nginx.sh

# Expose port (Railway will provide PORT env var)
EXPOSE 8080

# Start nginx using startup script
CMD ["/start-nginx.sh"]

