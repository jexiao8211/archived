import os
import uvicorn # acts as web server to run the fastapi app
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.database import engine, Base
from backend.routers import auth, images, users, collections, items, contact
from backend.config import settings

# Create database tables
Base.metadata.create_all(bind=engine)


app = FastAPI()

# Serve files at /backend/uploads/<filename>
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
# Mount the static files at the exact path that the image URLs use
app.mount("/backend/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Enable and configure the CORS middleware
## CORS = Cross-Origin Resource Sharing
## prohibits unauthorized websites, endpoints, or servers from accessing the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True, # Lets us send things like JWT tokens
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"], # More restrictive than "*"
    allow_headers=["*"], # Allows all headers
)

# Include routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(collections.router)
app.include_router(items.router)
app.include_router(images.router)
app.include_router(contact.router)

if __name__ == "__main__":
    uvicorn.run(app, 
                host=settings.HOST, # Run on all active IP addresses
                port=settings.PORT) # FastAPI default
