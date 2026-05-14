FROM node:25-slim AS builder

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --prefer-offline --no-audit --progress=false
COPY . .
RUN npm run build

FROM node:25-slim
WORKDIR /app
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000
COPY --from=builder /app/.output ./.output

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]