FROM node:25-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --prefer-offline --no-audit --progress=false

COPY . .

# build TypeScript
RUN npm run build

EXPOSE 5050

# použít start.sh, který generuje Prisma klienta při startu
CMD ["sh", "./start.sh"]
