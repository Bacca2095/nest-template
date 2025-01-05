# Stage 1: Development
FROM node:lts-alpine AS dev

WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY --chown=node:node package.json yarn.lock ./
RUN yarn install --frozen-lockfile
COPY --chown=node:node . .
USER node


# Stage 2: Build
FROM node:lts-alpine AS build

WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY --chown=node:node --from=dev /app/node_modules ./node_modules
COPY --chown=node:node . .
RUN yarn prisma:generate
RUN yarn build
RUN yarn install --frozen-lockfile --production
USER node


# Stage 3: Production
FROM node:lts-alpine AS prod

WORKDIR /app

COPY --chown=node:node --from=build /app/dist ./dist
COPY --chown=node:node --from=build /app/prisma ./prisma
COPY --chown=node:node --from=build /app/node_modules ./node_modules
COPY --chown=node:node --from=build /app/package.json ./package.json
COPY --chown=node:node --from=build /app/yarn.lock ./yarn.lock
RUN yarn prisma:generate
RUN rm -rf /root/.cache /tmp/*

CMD ["yarn", "run", "start:prod"]