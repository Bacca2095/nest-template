# Stage 1: Build
FROM node:18 as builder

# Establecer directorio de trabajo
WORKDIR /app

# Copiar solo los archivos necesarios para la instalación
COPY package.json yarn.lock ./

# Instalar dependencias sin desarrollo para minimizar tamaño
RUN yarn install --frozen-lockfile

# Copiar el resto del código fuente
COPY . .

# Construir la aplicación
RUN yarn build


# Stage 2: Production
FROM node:18-alpine as production

# Crear directorio de trabajo
WORKDIR /app

# Instalar dependencias necesarias para la ejecución
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/yarn.lock ./yarn.lock
COPY --from=builder /app/ecosystem.config.js ./ecosystem.config.js

# Generar Prisma Client
RUN yarn prisma:generate

# Instalar PM2 globalmente
RUN yarn global add pm2

# Establecer comando por defecto
CMD ["yarn", "run", "start:prod"]