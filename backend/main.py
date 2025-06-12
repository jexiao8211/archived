import uvicorn # acts as web server to run the fastapi app
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List

from backend.routers import auth, users, collections, items

# TODO: Update the endpoints in this file
# Define data models
## FastAPI can automatically validate data coming in and it can format data going
## out based on Pydantic models

class Fruit(BaseModel):
    name: str

class Fruits(BaseModel):
    fruits: List[Fruit]

app = FastAPI()

# Define the sources that can access the endpoints on the backend server
origins = [
    "http://localhost:5173" # For development
]

# Enable and configure the CORS middleware
## CORS = Cross-Origin Resource Sharing
## prohibits unauthorized websites, endpoints, or servers from accessing the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True, # Lets us send things like JWT tokens
    allow_methods=["*"], # Allows all methods (this rg allows us to block delete or put methods for example)
    allow_headers=["*"], # Allows all headers
)



# Define the endpoint functions
app.include_router(users.router)
app.include_router(auth.router)
app.include_router(collections.router)
app.include_router(items.router)


if __name__ == "__main__":
    uvicorn.run(app, 
                host="0.0.0.0", # Run on all active IP addresses
                port=8000) # FastAPI default
