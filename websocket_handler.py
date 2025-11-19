"""
WebSocket Handler for Collaborative Rooms
"""

import logging
from fastapi import WebSocket, WebSocketDisconnect
from typing import Dict
import json
from room_manager import room_manager

logger = logging.getLogger(__name__)


class ConnectionManager:
    """Manages WebSocket connections for collaborative rooms"""
    
    async def connect(self, websocket: WebSocket):
        """Accept WebSocket connection"""
        await websocket.accept()
    
    async def handle_message(self, websocket: WebSocket, data: dict):
        """Handle incoming WebSocket messages"""
        message_type = data.get("type")
        
        if message_type == "join":
            await self.handle_join(websocket, data)
        
        elif message_type == "leave":
            await self.handle_leave(websocket)
        
        elif message_type == "code_change":
            await self.handle_code_change(websocket, data)
        
        elif message_type == "cursor_move":
            await self.handle_cursor_move(websocket, data)
        
        elif message_type == "language_change":
            await self.handle_language_change(websocket, data)
        
        elif message_type == "chat_message":
            await self.handle_chat_message(websocket, data)
        
        elif message_type == "execute_code":
            await self.handle_execute_code(websocket, data)
        
        elif message_type == "voice_audio":
            await self.handle_voice_audio(websocket, data)
        
        else:
            logger.warning(f"Unknown message type: {message_type}")
    
    async def handle_join(self, websocket: WebSocket, data: dict):
        """Handle user joining a room"""
        room_id = data.get("room_id")
        user_name = data.get("user_name", "Anonymous")
        
        if not room_id:
            await websocket.send_json({
                "type": "error",
                "message": "Room ID is required"
            })
            return
        
        # Join room
        user = room_manager.join_room(room_id, user_name, websocket)
        
        if not user:
            error_msg = "Failed to join room. Room may be full or doesn't exist."
            await websocket.send_json({
                "type": "error",
                "message": error_msg
            })
            logger.error(f"Failed to join room {room_id} for user {user_name}")
            # Don't close immediately, let client handle it
            return
        
        room = room_manager.get_room(room_id)
        if not room:
            await websocket.send_json({
                "type": "error",
                "message": "Room not found after joining"
            })
            return
        
        # Send room state to the user
        await websocket.send_json({
            "type": "joined",
            "user": user.to_dict(),
            "room": room.to_dict()
        })
        
        # Only notify other users if this is a new user (not a reconnect)
        # Check if user was already in the room before joining
        existing_connections = room_manager.get_connections(room_id)
        if len(existing_connections) > 1:  # More than just this connection
            # Notify other users about new user
            await room_manager.broadcast_to_room(
                room_id,
                {
                    "type": "user_joined",
                    "user": user.to_dict()
                },
                exclude_ws=websocket
            )
    
    async def handle_leave(self, websocket: WebSocket):
        """Handle user leaving a room"""
        result = room_manager.leave_room(websocket)
        
        if result:
            room_id, user = result
            
            # Notify other users
            await room_manager.broadcast_to_room(
                room_id,
                {
                    "type": "user_left",
                    "user": user.to_dict()
                }
            )
    
    async def handle_code_change(self, websocket: WebSocket, data: dict):
        """Handle code changes"""
        room_id = data.get("room_id")
        code = data.get("code", "")
        user_id = room_manager.ws_users.get(websocket)
        
        # Update room code
        room_manager.update_code(room_id, code)
        
        # Broadcast to other users
        await room_manager.broadcast_to_room(
            room_id,
            {
                "type": "code_changed",
                "code": code,
                "user_id": user_id
            },
            exclude_ws=websocket
        )
    
    async def handle_cursor_move(self, websocket: WebSocket, data: dict):
        """Handle cursor position changes"""
        room_id = data.get("room_id")
        position = data.get("position")
        user_id = room_manager.ws_users.get(websocket)
        
        # Broadcast cursor position
        await room_manager.broadcast_to_room(
            room_id,
            {
                "type": "cursor_moved",
                "user_id": user_id,
                "position": position
            },
            exclude_ws=websocket
        )
    
    async def handle_language_change(self, websocket: WebSocket, data: dict):
        """Handle language changes"""
        room_id = data.get("room_id")
        language = data.get("language")
        user_id = room_manager.ws_users.get(websocket)
        
        # Update room language
        room_manager.update_language(room_id, language)
        
        # Broadcast to all users (including sender)
        await room_manager.broadcast_to_room(
            room_id,
            {
                "type": "language_changed",
                "language": language,
                "user_id": user_id
            }
        )
    
    async def handle_chat_message(self, websocket: WebSocket, data: dict):
        """Handle chat messages"""
        room_id = data.get("room_id")
        message = data.get("message")
        user_id = room_manager.ws_users.get(websocket)
        
        room = room_manager.get_room(room_id)
        user = room.users.get(user_id) if room else None
        
        if user:
            # Broadcast chat message
            await room_manager.broadcast_to_room(
                room_id,
                {
                    "type": "chat_message",
                    "user": user.to_dict(),
                    "message": message,
                    "timestamp": user.joined_at
                }
            )
    
    async def handle_execute_code(self, websocket: WebSocket, data: dict):
        """Handle code execution request"""
        room_id = data.get("room_id")
        user_id = room_manager.ws_users.get(websocket)
        result = data.get("result")
        
        # Broadcast execution result to all users
        await room_manager.broadcast_to_room(
            room_id,
            {
                "type": "execution_result",
                "user_id": user_id,
                "result": result
            }
        )
    
    async def handle_voice_audio(self, websocket: WebSocket, data: dict):
        """Handle voice audio data"""
        room_id = data.get("room_id")
        audio_data = data.get("audio_data")
        user_id = room_manager.ws_users.get(websocket)
        
        room = room_manager.get_room(room_id)
        user = room.users.get(user_id) if room else None
        
        if user and audio_data:
            # Broadcast audio to all other users in the room
            await room_manager.broadcast_to_room(
                room_id,
                {
                    "type": "voice_audio",
                    "user_id": user_id,
                    "user": user.to_dict(),
                    "audio_data": audio_data
                },
                exclude_ws=websocket
            )


# Global connection manager
connection_manager = ConnectionManager()