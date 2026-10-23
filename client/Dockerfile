FROM node:26.12.1-alpine AS build
WORKDIR /app
COPY client/package.json client/package-lock.json ./
RUN npm ci
COPY client .
RUN npm run build

FROM nginxinc/nginx-unprivileged:1.27.3-alpine
COPY client/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
HEALTHCHECK --interval=10s --timeout=3s --retries=5 \
  CMD wget -qO- http://127.0.0.1:8080/ >/dev/null || exit 1
