# Build static assets (VITE_* are baked in at build time)
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ARG VITE_API_URL=
ARG VITE_GOOGLE_CLIENT_ID=
ARG VITE_SITE_URL=https://enarmx.com.mx
ARG VITE_APP_NAME=ENARMX
ARG VITE_CLARITY_PROJECT_ID=
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID
ENV VITE_SITE_URL=$VITE_SITE_URL
ENV VITE_APP_NAME=$VITE_APP_NAME
ENV VITE_CLARITY_PROJECT_ID=$VITE_CLARITY_PROJECT_ID

RUN npm run build

FROM nginx:alpine AS runner
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
