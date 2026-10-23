FROM node:24.4.1-alpine AS build
WORKDIR /repo
COPY package.json package-lock.json ./
COPY client/package.json client/
COPY server/package.json server/
RUN npm ci -w server
COPY server server
RUN npm run build -w server

FROM node:24.4.1-alpine
ENV NODE_ENV=production
WORKDIR /repo
COPY package.json package-lock.json ./
COPY client/package.json client/
COPY server/package.json server/
RUN npm ci -w server --omit=dev && npm cache clean --force
COPY --from=build /repo/server/dist server/dist
USER node
EXPOSE 5006
HEALTHCHECK --interval=10s --timeout=3s --retries=5 \
  CMD node -e "fetch('http://localhost:5006/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server/dist/index.js"]
