# Stage 1: Build
FROM node:18 as builder

WORKDIR /app
COPY prisma ./prisma
COPY package.json .
COPY yarn.lock .

RUN yarn install


# Stage 2: Production
FROM node:18-alpine

WORKDIR /app
COPY --from=builder /node_modules ./node_modules
COPY --from=builder /prisma ./prisma
ADD dist .
COPY ecosystem.config.js .
COPY package.json .
COPY yarn.lock .

RUN yarn generate:schemas
RUN yarn global add pm2

CMD ["yarn", "run", "start:prod"]