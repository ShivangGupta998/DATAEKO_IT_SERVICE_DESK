# Stage 1: Build React/Vite app
FROM node:18-alpine AS builder

WORKDIR /app

# Accept Vite build argument from docker-compose
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

COPY package*.json ./
# Force npm to download optional platform binaries for Alpine
RUN npm install --include=optional

COPY . .
RUN npm run build

# Stage 2: Serve application using Nginx
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]