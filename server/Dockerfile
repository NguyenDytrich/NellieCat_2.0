FROM node:16-alpine3.11 AS installer 
WORKDIR /usr
COPY package.json ./
COPY yarn.lock ./
RUN yarn install

FROM node:16-alpine3.11 AS builder
WORKDIR /usr
COPY --from=installer /usr/node_modules ./node_modules
COPY --from=installer /usr/yarn.lock ./
COPY --from=installer /usr/package.json ./
COPY babel.config.js ./
COPY tsconfig.json ./
COPY src ./src
RUN yarn build

FROM node:16-alpine3.11
WORKDIR /app
COPY --from=builder /usr/build ./build
COPY --from=installer /usr/node_modules ./node_modules
COPY --from=installer /usr/yarn.lock ./
COPY --from=installer /usr/package.json ./
CMD ["node", "./build/index.js"]
