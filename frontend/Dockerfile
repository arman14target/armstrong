# syntax=docker/dockerfile:1

# ---- Build stage: produce the static export in out/ ----
FROM node:22-alpine AS build
WORKDIR /app

# NEXT_PUBLIC_* keys are baked into the bundle at build time.
# All optional — the app degrades gracefully without them.
ARG NEXT_PUBLIC_GEMINI_API_KEY=""
ARG NEXT_PUBLIC_GEMINI_MODEL=""
ARG NEXT_PUBLIC_API_URL=""
ENV NEXT_PUBLIC_GEMINI_API_KEY=$NEXT_PUBLIC_GEMINI_API_KEY \
    NEXT_PUBLIC_GEMINI_MODEL=$NEXT_PUBLIC_GEMINI_MODEL \
    NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---- Serve stage: nginx serving the static files ----
FROM nginx:1.27-alpine AS runner
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/out /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
