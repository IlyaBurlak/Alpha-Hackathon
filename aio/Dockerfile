FROM node:26.12.1-alpine AS client-build
WORKDIR /repo/client
COPY client/package.json client/package-lock.json ./
RUN npm ci
COPY client .
RUN npm run build

FROM node:26.12.1-slim AS server-build
RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /repo/server
COPY server/package.json server/package-lock.json ./
RUN npm ci
COPY server .
RUN npm run build
RUN rm -rf node_modules && npm ci --omit=dev

# No package-lock.json in externalSystemsMock yet, so `npm install` instead of `npm ci`.
FROM node:26.12.1-slim AS external-build
WORKDIR /repo/externalSystemsMock
COPY externalSystemsMock/package.json ./
RUN npm install
COPY externalSystemsMock .
RUN npm run build
RUN rm -rf node_modules && npm install --omit=dev

FROM python:3.12.12-slim-trixie AS ml-build
RUN python -m venv /venv
COPY ml/requirements.txt .
RUN /venv/bin/pip install --no-cache-dir -r requirements.txt

FROM node:26.12.1-slim AS node-runtime

FROM python:3.12.12-slim-trixie
ENV PATH="/venv/bin:$PATH" PYTHONUNBUFFERED=1 NODE_ENV=production \
    ML_SERVICE_URL=http://127.0.0.1:8000
RUN apt-get update \
    && apt-get install -y --no-install-recommends nginx supervisor libatomic1 \
    && rm -rf /var/lib/apt/lists/* \
    && useradd --system --uid 10001 appuser \
    && chown -R appuser /var/log/nginx /var/lib/nginx
COPY --from=node-runtime /usr/local/bin/node /usr/local/bin/node
COPY --from=ml-build /venv /venv
WORKDIR /app
COPY --from=server-build --chown=appuser /repo/server/node_modules server/node_modules
COPY --from=server-build /repo/server/package.json server/package.json
COPY --from=server-build /repo/server/dist server/dist
COPY --from=external-build /repo/externalSystemsMock/node_modules external-systems/node_modules
COPY --from=external-build /repo/externalSystemsMock/package.json external-systems/package.json
COPY --from=external-build /repo/externalSystemsMock/dist external-systems/dist
COPY ml/app ml/app
COPY ml/config ml/config
COPY ml/model ml/model
COPY --from=client-build /repo/client/dist /usr/share/nginx/html
COPY aio/nginx.conf /etc/nginx/nginx.conf
COPY aio/supervisord.conf /etc/supervisord.conf
RUN chown appuser /app/server
USER appuser
EXPOSE 8080
HEALTHCHECK --interval=10s --timeout=3s --retries=5 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8080/api/health')"
CMD ["supervisord", "-n", "-c", "/etc/supervisord.conf"]
