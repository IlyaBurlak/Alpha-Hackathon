FROM python:3.12.8-slim AS build
WORKDIR /build
RUN python -m venv /venv
ENV PATH="/venv/bin:$PATH"
COPY ml/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

FROM python:3.12.8-slim
ENV PATH="/venv/bin:$PATH" PYTHONUNBUFFERED=1
WORKDIR /app
COPY --from=build /venv /venv
COPY ml/app ./app
RUN useradd --system --uid 10001 appuser
USER appuser
EXPOSE 8000
HEALTHCHECK --interval=10s --timeout=3s --retries=5 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')"
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
