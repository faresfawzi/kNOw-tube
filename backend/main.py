import os
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from together import Together
from routes import transcript, quiz, flashcard, graph

app = FastAPI()

load_dotenv(Path(__file__).resolve().parent / ".env")


TOGETHER_API_KEY = os.getenv("TOGETHER_API_KEY")
together_client = Together()


app.state.together_client = together_client

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

# --- WEBSOCKETS ---
@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await ws.accept()
    try:
        while True:
            # Receive any incoming text message
            _ = await ws.receive_text()
            # Respond with a confirmation
            await ws.send_text("received")
    except WebSocketDisconnect:
        # Client disconnected
        pass

# Include routers
app.include_router(transcript.router)
app.include_router(quiz.router)
app.include_router(flashcard.router)
app.include_router(graph.router)
