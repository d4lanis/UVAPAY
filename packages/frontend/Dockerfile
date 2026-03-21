FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY packages/frontend/package*.json ./packages/frontend/

RUN npm install

COPY . .

ARG VITE_API_URL=http://localhost:4000
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build:shared && npm run build:frontend

FROM node:20-alpine

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/packages/shared ./packages/shared
COPY --from=builder --chown=nodejs:nodejs /app/packages/frontend/node_modules ./packages/frontend/node_modules
COPY --from=builder --chown=nodejs:nodejs /app/packages/frontend/package.json ./packages/frontend/package.json
COPY --from=builder --chown=nodejs:nodejs /app/packages/frontend/vite.config.ts ./packages/frontend/vite.config.ts
COPY --from=builder --chown=nodejs:nodejs /app/packages/frontend/dist ./packages/frontend/dist

USER nodejs

WORKDIR /app/packages/frontend

EXPOSE 5173

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget --spider -q http://127.0.0.1:5173 || exit 1

CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "5173"]
