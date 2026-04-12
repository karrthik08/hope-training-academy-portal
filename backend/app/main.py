from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.router import api_router

app = FastAPI(title="HOPE Training Academy API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "https://hope-frontend-qm4p.onrender.com"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)

@app.get("/")
def root():
    return {"message": "HOPE Training Academy API"}

@app.get("/health")
def health():
    return {"status": "healthy"}
