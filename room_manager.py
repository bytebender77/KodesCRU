"""
Collaborative Room Manager for KodesCRUxxx
Manages real-time collaborative coding sessions
"""

import asyncio
import json
import logging
from typing import Dict, List, Set, Optional
from datetime import datetime
from dataclasses import dataclass, asdict
from collections import defaultdict
import uuid

logger = logging.getLogger(__name__)


@dataclass
class User:
    """User in a collaborative room"""
    id: str
    name: str
    color: str  # Hex color for cursor
    is_host: bool = False
    joined_at: str = None
    
    def __post_init__(self):
        if self.joined_at is None:
            self.joined_at = datetime.utcnow().isoformat()
    
    def to_dict(self):
        return asdict(self)


@dataclass
class Room:
    """Collaborative coding room"""
    id: str
    name: str
    host_id: str
    language: str
    code: str
    created_at: str
    max_users: int = 10
    is_public: bool = True
    users: Dict[str, User] = None
    
    def __post_init__(self):
        if self.users is None:
            self.users = {}
    
    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "host_id": self.host_id,
            "language": self.language,
            "code": self.code,
            "created_at": self.created_at,
            "max_users": self.max_users,
            "is_public": self.is_public,
            "users": [user.to_dict() for user in self.users.values()],
            "user_count": len(self.users)
        }


class RoomManager:
    """Manages collaborative rooms and WebSocket connections"""
    
    def __init__(self):
        # Room storage: room_id -> Room
        self.rooms: Dict[str, Room] = {}
        
        # Active connections: room_id -> set of websocket connections
        self.connections: Dict[str, Set] = defaultdict(set)
        
        # User to room mapping: user_id -> room_id
        self.user_rooms: Dict[str, str] = {}
        
        # WebSocket to user mapping: websocket -> user_id
        self.ws_users: Dict = {}
        
        # User colors (for cursor display)
        self.user_colors = [
            "#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", 
            "#98D8C8", "#F7DC6F", "#BB8FCE", "#85C1E2",
            "#F8B739", "#52B788", "#E76F51", "#2A9D8F"
        ]
        self.color_index = 0
    
    def generate_room_id(self) -> str:
        """Generate unique room ID"""
        return str(uuid.uuid4())[:8]
    
    def generate_user_id(self) -> str:
        """Generate unique user ID"""
        return str(uuid.uuid4())
    
    def get_user_color(self) -> str:
        """Get next available color for user cursor"""
        color = self.user_colors[self.color_index % len(self.user_colors)]
        self.color_index += 1
        return color
    
    def create_room(
        self,
        name: str,
        host_name: str,
        language: str = "Python",
        code: str = "",
        max_users: int = 10,
        is_public: bool = True
    ) -> Room:
        """Create a new collaborative room"""
        room_id = self.generate_room_id()
        host_id = self.generate_user_id()
        
        # Create host user
        host = User(
            id=host_id,
            name=host_name,
            color=self.get_user_color(),
            is_host=True
        )
        
        # Create room
        room = Room(
            id=room_id,
            name=name,
            host_id=host_id,
            language=language,
            code=code,
            created_at=datetime.utcnow().isoformat(),
            max_users=max_users,
            is_public=is_public,
            users={host_id: host}
        )
        
        self.rooms[room_id] = room
        logger.info(f"Created room {room_id}: {name}")
        
        return room
    
    def get_room(self, room_id: str) -> Optional[Room]:
        """Get room by ID"""
        return self.rooms.get(room_id)
    
    def delete_room(self, room_id: str) -> bool:
        """Delete a room"""
        if room_id in self.rooms:
            # Remove all users
            for user_id in list(self.rooms[room_id].users.keys()):
                self.user_rooms.pop(user_id, None)
            
            # Remove connections
            self.connections.pop(room_id, None)
            
            # Delete room
            del self.rooms[room_id]
            logger.info(f"Deleted room {room_id}")
            return True
        return False
    
    def join_room(self, room_id: str, user_name: str, websocket) -> Optional[User]:
        """User joins a room"""
        room = self.get_room(room_id)
        if not room:
            logger.warning(f"Room {room_id} does not exist")
            return None
        
        # Check if room is full
        if len(room.users) >= room.max_users:
            logger.warning(f"Room {room_id} is full")
            return None
        
        # Check if this websocket is already connected to a user in this room
        existing_user_id = self.ws_users.get(websocket)
        if existing_user_id and existing_user_id in room.users:
            # User already in room, just update websocket mapping
            user = room.users[existing_user_id]
            self.connections[room_id].add(websocket)
            logger.info(f"User {user_name} reconnected to room {room_id}")
            return user
        
        # Check if host is joining (host name matches and host user exists)
        host_user = None
        for user in room.users.values():
            if user.name == user_name and user.is_host:
                host_user = user
                break
        
        if host_user:
            # Host is joining, use existing host user
            user = host_user
            # Update websocket mappings
            self.connections[room_id].add(websocket)
            self.ws_users[websocket] = user.id
            if user.id not in self.user_rooms:
                self.user_rooms[user.id] = room_id
            logger.info(f"Host {user_name} joined room {room_id}")
            return user
        
        # Create new user
        user_id = self.generate_user_id()
        user = User(
            id=user_id,
            name=user_name,
            color=self.get_user_color(),
            is_host=False
        )
        
        # Add user to room
        room.users[user_id] = user
        self.user_rooms[user_id] = room_id
        
        # Add WebSocket connection
        self.connections[room_id].add(websocket)
        self.ws_users[websocket] = user_id
        
        logger.info(f"User {user_name} ({user_id}) joined room {room_id}")
        return user
    
    def leave_room(self, websocket) -> Optional[tuple]:
        """User leaves a room"""
        user_id = self.ws_users.get(websocket)
        if not user_id:
            return None
        
        room_id = self.user_rooms.get(user_id)
        if not room_id:
            return None
        
        room = self.get_room(room_id)
        if not room:
            return None
        
        # Remove user
        user = room.users.pop(user_id, None)
        self.user_rooms.pop(user_id, None)
        self.connections[room_id].discard(websocket)
        self.ws_users.pop(websocket, None)
        
        # Delete room if empty
        if len(room.users) == 0:
            self.delete_room(room_id)
        
        logger.info(f"User {user_id} left room {room_id}")
        return (room_id, user)
    
    def update_code(self, room_id: str, code: str) -> bool:
        """Update room code"""
        room = self.get_room(room_id)
        if room:
            room.code = code
            return True
        return False
    
    def update_language(self, room_id: str, language: str) -> bool:
        """Update room language"""
        room = self.get_room(room_id)
        if room:
            room.language = language
            return True
        return False
    
    def get_room_users(self, room_id: str) -> List[User]:
        """Get all users in a room"""
        room = self.get_room(room_id)
        return list(room.users.values()) if room else []
    
    def get_connections(self, room_id: str) -> Set:
        """Get all WebSocket connections for a room"""
        return self.connections.get(room_id, set())
    
    def get_public_rooms(self) -> List[Dict]:
        """Get all public rooms"""
        return [
            room.to_dict() 
            for room in self.rooms.values() 
            if room.is_public
        ]
    
    async def broadcast_to_room(self, room_id: str, message: dict, exclude_ws=None):
        """Broadcast message to all users in a room"""
        connections = self.get_connections(room_id)
        
        disconnected = set()
        for ws in connections:
            if ws == exclude_ws:
                continue
            
            try:
                await ws.send_json(message)
            except Exception as e:
                logger.error(f"Error broadcasting to websocket: {e}")
                disconnected.add(ws)
        
        # Clean up disconnected websockets
        for ws in disconnected:
            self.leave_room(ws)


# Global room manager instance
room_manager = RoomManager()