# syntax=docker/dockerfile:1

# ----------------------------------------------------
# Stage 1: Base Alpine Image with Node.js 20 & Utilities
# ----------------------------------------------------
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat openssl netcat-openbsd
WORKDIR /app

# ----------------------------------------------------
# Stage 2: Install Node Dependencies
# ----------------------------------------------------
FROM base AS deps
COPY package.json package-lock.json* ./
COPY prisma ./prisma/
RUN npm ci

# ----------------------------------------------------
# Stage 3: Build Next.js Application
# ----------------------------------------------------
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

# Generate Prisma Client for Linux Alpine engine
RUN npx prisma generate

# Build Next.js
RUN npm run build

# ----------------------------------------------------
# Stage 4: Production Runner
# ----------------------------------------------------
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Salin node_modules, build output, prisma, dan scripts pendukung
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/docker-entrypoint.sh ./docker-entrypoint.sh

# Normalisasi line-ending (CRLF ke LF) jika dibuat di Windows dan beri izin eksekusi
RUN sed -i 's/\r$//' ./docker-entrypoint.sh && chmod +x ./docker-entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["npm", "run", "start"]
