# Step 1: Build the React Application
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Step 2: Serve the application with Nginx
FROM nginx:alpine
# Copy built static files to Nginx's serve directory
COPY --from=build /app/build /usr/share/nginx/html
# Add a custom nginx.conf to handle React Router navigation
RUN echo 'server { \
    listen 8080; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

# Expose port (Cloud Run uses 8080 by default)
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
