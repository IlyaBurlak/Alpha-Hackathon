# No package-lock.json in this service yet, so `npm install` is used instead of `npm ci`;
# switch to `npm ci` once the lock file is committed.
FROM node:24.4.1-alpine AS build
WORKDIR /app
COPY externalSystemsMock/package.json ./
RUN npm install
COPY externalSystemsMock .
RUN npm run build

FROM node:24.4.1-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY externalSystemsMock/package.json ./
RUN npm install --omit=dev && npm cache clean --force
COPY --from=build /app/dist dist
USER node
EXPOSE 5006
HEALTHCHECK --interval=10s --timeout=3s --retries=5 \
  CMD node -e "fetch('http://localhost:5006/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "dist/index.js"]
