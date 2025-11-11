"""
Main FastAPI Application
AI-Powered Scheduling System for Accountability Centre
"""

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.models.database import init_db
from app.routers import scheduling, calendar, ai, health

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    # Startup
    logger.info("Starting Accountability Centre AI Scheduler...")

    # Initialize database
    try:
        engine = init_db(settings.database_url)
        logger.info(f"Database initialized: {settings.database_url}")
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")
        raise

    yield

    # Shutdown
    logger.info("Shutting down...")


# Create FastAPI app
app = FastAPI(
    title="Accountability Centre AI Scheduler",
    description="Intelligent scheduling system with Google Calendar integration and OpenAI-powered optimization",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router, prefix="/health", tags=["Health"])
app.include_router(calendar.router, prefix="/calendar", tags=["Calendar"])
app.include_router(scheduling.router, prefix="/schedule", tags=["Scheduling"])
app.include_router(ai.router, prefix="/ai", tags=["AI"])


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Accountability Centre AI Scheduler API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=True,
        log_level="info",
    )
