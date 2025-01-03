# Stage 1: Build
FROM node:18 as builder

WORKDIR /app
COPY . ./app

RUN yarn install
RUN yarn build


# Stage 2: Production
FROM node:18-alpine

WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/dist ./dist
COPY ecosystem.config.js .
COPY package.json .
COPY yarn.lock .

RUN yarn generate:schemas
RUN yarn global add pm2

CMD ["yarn", "run", "start:prod"]