# Build Stage
FROM node:18-alpine AS build
WORKDIR /app

# Copy dependency files
COPY package*.json ./
RUN npm ci

# Copy source code and build React static bundle
COPY . .
RUN npm run build

# Production Stage
FROM nginx:alpine
WORKDIR /usr/share/nginx/html

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy build artifacts from previous stage
COPY --from=build /app/dist .

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
