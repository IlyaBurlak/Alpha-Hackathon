FROM node:24.4.1-alpine AS build
RUN apk add --no-cache python3 make g++
WORKDIR /app
COPY server/package.json server/package-lock.json ./
RUN npm ci
COPY server .
RUN npm run build

FROM node:26.12.1-alpine AS integration-test
WORKDIR /app
COPY server/package.json server/package-lock.json ./
RUN npm ci
COPY server .
CMD ["npm", "run", "test:integration"]

FROM node:24.4.1-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY server/package.json server/package-lock.json ./
RUN apk add --no-cache --virtual .build-deps python3 make g++ \
  && npm ci --omit=dev \
  && apk del .build-deps \
  && npm cache clean --force
COPY --from=build /app/dist dist
RUN mkdir data && chown node:node data
WORKDIR /app/data
USER node
EXPOSE 3001
HEALTHCHECK --interval=10s --timeout=3s --retries=5 \
  CMD node -e "fetch('http://localhost:3001/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "/app/dist/index.js"]
