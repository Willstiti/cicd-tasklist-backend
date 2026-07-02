FROM node:22-alpine AS build

WORKDIR /app

RUN apk add --no-cache openssl libc6-compat

COPY package*.json ./
COPY prisma ./prisma

RUN npm ci
RUN npx prisma generate

COPY tsconfig.json ./
COPY src ./src

RUN npm run build

FROM node:22-alpine AS prod-deps

WORKDIR /app

RUN apk add --no-cache openssl libc6-compat

COPY package*.json ./
COPY prisma ./prisma

RUN npm ci --omit=dev && npm cache clean --force

FROM node:22-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

RUN apk add --no-cache openssl libc6-compat

# Runtime only needs node to execute dist/server.js; remove npm/npx toolchain.
RUN rm -rf /usr/local/lib/node_modules/npm \
	&& rm -f /usr/local/bin/npm /usr/local/bin/npx

COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma

EXPOSE 3001

CMD ["node", "dist/server.js"]