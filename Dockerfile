# ---------- Stage 1: Build ----------
FROM node:22-slim AS builder

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /usr/src/app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

# ---------- Stage 2: Runtime ----------
FROM node:22-slim AS runner

RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

RUN addgroup --system broadcastservice \
    && usermod -aG broadcastservice node

WORKDIR /usr/src/app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY --from=builder /usr/src/app/package.json /usr/src/app/pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile

COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/assets ./assets

RUN chown -R node:node /usr/src/app

USER node
ENV NODE_ENV=production

CMD ["node", "dist/main.js"]