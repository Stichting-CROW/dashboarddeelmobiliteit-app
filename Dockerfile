FROM node:24 AS builder

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM ghcr.io/static-web-server/static-web-server:2-alpine

COPY --from=builder /usr/src/app/build /public
