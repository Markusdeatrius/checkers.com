FROM node:25-slim AS builder
RUN apt-get update -y && apt-get install -y openssl
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .

ARG DATABASE_URL
ENV DATABASE_URL=${DATABASE_URL}
RUN npx prisma generate
RUN npm run build

FROM node:25-slim AS runner
RUN apt-get update -y && apt-get install -y openssl
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

EXPOSE 3002

CMD npx prisma migrate deploy && node dist/server.js