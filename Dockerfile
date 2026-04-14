# Multi-stage build — backend + frontend em 1 container

# --- Stage 1: build frontend ---
FROM node:20-alpine AS web-build
WORKDIR /build
COPY web/package.json web/package-lock.json ./
RUN npm ci
COPY web/ ./
RUN npm run build

# --- Stage 2: produção (API serve tudo) ---
FROM node:20-slim AS runtime

# Deps do Playwright / Chromium
RUN apt-get update && apt-get install -y --no-install-recommends \
  ca-certificates curl fonts-liberation \
  libasound2 libatk-bridge2.0-0 libatk1.0-0 libcairo2 libcups2 libdrm2 \
  libgbm1 libglib2.0-0 libnspr4 libnss3 libpango-1.0-0 libx11-6 \
  libxcb1 libxcomposite1 libxdamage1 libxext6 libxfixes3 libxkbcommon0 \
  libxrandr2 wget \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Backend
COPY apps/api/package.json apps/api/package-lock.json ./apps/api/
WORKDIR /app/apps/api
RUN npm ci --omit=dev
RUN npx playwright install chromium

# Código backend
WORKDIR /app
COPY apps/api ./apps/api

# Squad + memória (dados que o backend lê)
COPY squads ./squads
COPY _opensquad ./_opensquad

# Frontend buildado
COPY --from=web-build /build/dist ./web/dist

WORKDIR /app/apps/api

ENV NODE_ENV=production
ENV PORT=3000
ENV SERVE_STATIC=/app/web/dist
EXPOSE 3000

CMD ["node", "--env-file=.env", "src/server.js"]
