FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY packages/backend/package*.json ./packages/backend/

RUN npm install

COPY . .

RUN npm run build:shared && npm run build:backend

FROM node:20-alpine

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/packages/shared ./packages/shared
COPY --from=builder --chown=nodejs:nodejs /app/packages/backend/node_modules ./packages/backend/node_modules
COPY --from=builder --chown=nodejs:nodejs /app/packages/backend/package.json ./packages/backend/package.json
COPY --from=builder --chown=nodejs:nodejs /app/packages/backend/dist ./packages/backend/dist

USER nodejs

WORKDIR /app/packages/backend

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --spider -q http://localhost:4000/health || exit 1

CMD ["node", "dist/index.js"]
