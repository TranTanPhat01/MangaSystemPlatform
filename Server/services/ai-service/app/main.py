from fastapi import FastAPI

app = FastAPI(title="Manga AI Service")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "AI service is running"}
