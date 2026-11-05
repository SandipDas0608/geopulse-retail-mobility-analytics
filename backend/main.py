import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers.mobility import router as mobility_router
from routers.snowflake import router as snowflake_router
app = FastAPI(
    title="GeoPulse API",
    description="Backend API for GeoPulse Hyper-Local Retail Mobility Analytics",
    version="1.0.0"
)
# Local development origins
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
# Add deployed frontend origins through environment configuration
configured_origins = os.getenv("CORS_ORIGINS", "")
for origin in configured_origins.split(","):
    origin = origin.strip().rstrip("/")
    if origin and origin not in origins:
        origins.append(origin)
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)
app.include_router(mobility_router)
app.include_router(snowflake_router)
@app.get("/")
def root():
    return {
        "project": "GeoPulse",
        "message": "GeoPulse Backend API is running"
    }
@app.get("/health")
def health_check():
    return {
        "status": "ok"
    }
