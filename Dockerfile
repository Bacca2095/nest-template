# Stage 1: Build
FROM node:18 as builder

COPY . .

RUN yarn install --network-timeout 1000000
RUN yarn build


# Stage 2: Production
FROM node:18-alpine

WORKDIR /app
COPY --from=builder /node_modules ./node_modules
COPY --from=builder /prisma ./prisma
COPY --from=builder /dist .
COPY ecosystem.config.js .
COPY package.json .
COPY yarn.lock .

RUN yarn prisma:generate
RUN yarn global add pm2

CMD ["yarn", "run", "start:prod"]