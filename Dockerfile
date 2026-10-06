# syntax = docker/dockerfile:1
# Serves on 0.0.0.0:$PORT; SQLite lives on the /data volume.
FROM docker.io/library/node:24.21.0-slim
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --prod --frozen-lockfile --ignore-scripts
COPY server/ server/
COPY public/ public/
COPY assets/stickers.json assets/
COPY README.md ./
COPY docs/ docs/
ENV DATA_DIR=/data NODE_ENV=production
CMD ["node", "server/main.ts"]
