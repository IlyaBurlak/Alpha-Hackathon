from fastapi import FastAPI

app = FastAPI(title="ML service")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
