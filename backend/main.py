from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# --- CORS CONFIGURATION ---
# This allows your React app to talk to this backend without "Blocked by CORS" errors
origins = [
    "http://localhost:5173",  # Vite (React) default port
    "http://localhost:3000",  # Next.js default port
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods (GET, POST, PUT, DELETE, etc.)
    allow_headers=["*"],  # Allow all headers
)

# --- ROUTES ---
@app.get("/")
def read_root():
    return {"message": "Hello from FastAPI backend!"}

@app.get("/data")
def get_data():
    return {
        "users": [
            {"id": 1, "name": "Alice", "role": "Admin"},
            {"id": 2, "name": "Bob", "role": "User"},
        ]
    }