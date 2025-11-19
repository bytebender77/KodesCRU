from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from typing import Optional
import logging
import json
import os
from pathlib import Path
from ai_engine import (
    explain_code,
    debug_code,
    generate_code,
    convert_logic_to_code,
    analyze_complexity,
    trace_code,
    get_snippets,
    get_projects,
    get_roadmaps,
    check_llm_health
)
from code_executor import executor, SUPPORTED_LANGUAGES
from websocket_handler import connection_manager
from room_manager import room_manager

logger = logging.getLogger(__name__)

app = FastAPI()

# Serve static images if directory exists
BASE_DIR = Path(__file__).parent
IMAGES_DIR = BASE_DIR / "images"

if IMAGES_DIR.exists():
    app.mount("/images", StaticFiles(directory=IMAGES_DIR), name="images")

# Add CORS middleware
# Get allowed origins from environment variable or use defaults
ALLOWED_ORIGINS_STR = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173"
)
# Clean up origins: remove whitespace and filter empty strings
ALLOWED_ORIGINS = [origin.strip() for origin in ALLOWED_ORIGINS_STR.split(",") if origin.strip()]

# Log allowed origins for debugging (don't log in production)
if os.getenv("DEBUG", "False").lower() == "true":
    logger.info(f"Allowed CORS origins: {ALLOWED_ORIGINS}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
)

class RequestModel(BaseModel):
    language: str = None
    code: str = None
    topic: str = None
    level: str = None
    logic: str = None
    snippet: str = None
    snippet_name: str = None
    project_topic: str = None
    roadmap_topic: str = None

class ExecuteCodeRequest(BaseModel):
    code: str = Field(..., min_length=1, description="Code to execute")
    language: str = Field(..., min_length=1, description="Programming language")
    stdin: Optional[str] = Field(default="", description="Standard input")
    version: Optional[str] = Field(default="*", description="Language version")

class ExecuteCodeResponse(BaseModel):
    success: bool
    output: str
    error: Optional[str] = None
    language: str
    stage: Optional[str] = None
    exit_code: Optional[int] = None
    version: Optional[str] = None

class CreateRoomRequest(BaseModel):
    name: str = Field(..., min_length=1, description="Room name")
    host_name: str = Field(..., min_length=1, description="Host name")
    language: str = Field(default="Python", description="Programming language")
    code: str = Field(default="", description="Initial code")
    max_users: int = Field(default=10, ge=2, le=50, description="Maximum users")
    is_public: bool = Field(default=True, description="Public room")

@app.post("/explain")
def explain(req: RequestModel):
    return {"response": explain_code(req.language, req.topic or "", req.level, req.code or "")}

@app.post("/debug")
def debug(req: RequestModel):
    return {"response": debug_code(req.language, req.code, req.topic or "")}

@app.post("/generate")
def generate(req: RequestModel):
    return {"response": generate_code(req.language, req.topic, req.level)}

@app.post("/convert_logic")
def convert_logic(req: RequestModel):
    return {"response": convert_logic_to_code(req.logic, req.language)}

@app.post("/analyze_complexity")
def analyze(req: RequestModel):
    return {"response": analyze_complexity(req.code)}

@app.post("/get_snippets")
def get_snippets_endpoint(req: RequestModel):
    return {"response": get_snippets(req.language, req.snippet or req.topic or "")}

@app.post("/get_projects")
def get_projects_endpoint(req: RequestModel):
    return {"response": get_projects(req.level, req.topic)}

@app.post("/get_roadmaps")
def get_roadmaps_endpoint(req: RequestModel):
    return {"response": get_roadmaps(req.level, req.topic)}

@app.post("/trace_code")
def trace_code_endpoint(req: RequestModel):
    return {"response": trace_code(req.code or "", req.language or "python")}

@app.get("/health")
def health():
    health_status = check_llm_health()
    return {"status": "ok", "llm": health_status}

@app.post("/execute_code", response_model=ExecuteCodeResponse)
async def execute_code_endpoint(request: ExecuteCodeRequest):
    """
    Execute code in various programming languages
    
    Supported languages: Python, JavaScript, Java, C++, C, C#, Ruby, Go, Rust, PHP, etc.
    """
    try:
        logger.info(f"Execute code request: {request.language}")
        result = await executor.execute_code(
            code=request.code,
            language=request.language,
            stdin=request.stdin,
            version=request.version
        )
        return ExecuteCodeResponse(**result)
    except Exception as e:
        logger.error(f"Execute code error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/supported_languages")
async def get_supported_languages():
    """Get list of supported programming languages"""
    return {
        "languages": list(SUPPORTED_LANGUAGES.keys()),
        "count": len(SUPPORTED_LANGUAGES)
    }

@app.get("/runtimes")
async def get_runtimes():
    """Get detailed runtime information for all languages"""
    try:
        runtimes = await executor.get_runtimes()
        return {
            "runtimes": runtimes,
            "count": len(runtimes)
        }
    except Exception as e:
        logger.error(f"Failed to get runtimes: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# WebSocket endpoint for collaborative rooms
@app.websocket("/ws/{room_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: str):
    """
    WebSocket endpoint for real-time collaborative coding
    
    Message types:
    - join: Join a room (requires room_id, user_name)
    - leave: Leave the current room
    - code_change: Broadcast code changes (requires room_id, code)
    - cursor_move: Broadcast cursor position (requires room_id, position)
    - language_change: Change programming language (requires room_id, language)
    - chat_message: Send chat message (requires room_id, message)
    - execute_code: Broadcast code execution result (requires room_id, result)
    - voice_audio: Broadcast voice audio data (requires room_id, audio_data)
    """
    await connection_manager.connect(websocket)
    
    try:
        while True:
            # Receive message from client - can be text or binary (for audio)
            try:
                # Try to receive as text first
                data = await websocket.receive_text()
                
                try:
                    message = json.loads(data)
                    message["room_id"] = room_id  # Ensure room_id is set
                    await connection_manager.handle_message(websocket, message)
                except json.JSONDecodeError:
                    await websocket.send_json({
                        "type": "error",
                        "message": "Invalid JSON format"
                    })
                except Exception as e:
                    logger.error(f"Error handling message: {e}")
                    await websocket.send_json({
                        "type": "error",
                        "message": str(e)
                    })
            except Exception as e:
                # If text receive fails, try binary (for future audio streaming)
                try:
                    data = await websocket.receive_bytes()
                    # For now, we handle audio via base64 in JSON messages
                    # This can be extended for binary audio streaming
                    logger.debug(f"Received binary data: {len(data)} bytes")
                except Exception as binary_err:
                    logger.error(f"Error receiving message: {e}, binary: {binary_err}")
                    break
    
    except WebSocketDisconnect:
        # Handle user leaving
        await connection_manager.handle_leave(websocket)
        logger.info(f"WebSocket disconnected for room {room_id}")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        await connection_manager.handle_leave(websocket)

# REST endpoints for room management
@app.post("/rooms/create")
async def create_room(request: CreateRoomRequest):
    """Create a new collaborative room"""
    try:
        room = room_manager.create_room(
            name=request.name,
            host_name=request.host_name,
            language=request.language,
            code=request.code,
            max_users=request.max_users,
            is_public=request.is_public
        )
        return {
            "success": True,
            "room": room.to_dict()
        }
    except Exception as e:
        logger.error(f"Error creating room: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/rooms/{room_id}")
async def get_room(room_id: str):
    """Get room information"""
    room = room_manager.get_room(room_id)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    return {
        "success": True,
        "room": room.to_dict()
    }

@app.get("/rooms")
async def list_rooms():
    """List all public rooms"""
    try:
        rooms = room_manager.get_public_rooms()
        return {
            "success": True,
            "rooms": rooms,
            "count": len(rooms)
        }
    except Exception as e:
        logger.error(f"Error listing rooms: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/rooms/{room_id}")
async def delete_room(room_id: str):
    """Delete a room (only if empty or by host)"""
    room = room_manager.get_room(room_id)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    # Only allow deletion if room is empty
    if len(room.users) > 0:
        raise HTTPException(status_code=403, detail="Cannot delete room with active users")
    
    success = room_manager.delete_room(room_id)
    if success:
        return {"success": True, "message": "Room deleted"}
    else:
        raise HTTPException(status_code=500, detail="Failed to delete room")

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on application shutdown"""
    await executor.close()
    logger.info("Application shutdown complete")
