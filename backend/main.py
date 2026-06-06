import os
import sys

current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from core import config

from api.routes_health import router as health_router
from api.routes_upload import router as upload_router
from api.routes_ai_test import router as ai_test_router
from api.routes_synthesis import router as synthesis_router
from api.routes_stt import router as stt_router

app = FastAPI(title="CaseDepth API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=config.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(ai_test_router)
app.include_router(upload_router)
app.include_router(synthesis_router)
app.include_router(stt_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
