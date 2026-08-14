"""
Pravaah Engine — WebSocket Manager

Manages connected WebSocket clients and broadcasts typed events.
Thread-safe via asyncio.Lock.
"""

from __future__ import annotations

import asyncio
import json
import logging
from typing import Set

from fastapi import WebSocket
from app.schemas import WSEvent

logger = logging.getLogger(__name__)


class WebSocketManager:
    """Manages a set of active WebSocket connections."""

    def __init__(self) -> None:
        self._connections: Set[WebSocket] = set()
        self._lock = asyncio.Lock()

    async def connect(self, websocket: WebSocket) -> None:
        await websocket.accept()
        async with self._lock:
            self._connections.add(websocket)
        logger.info("WS client connected", extra={"total": len(self._connections)})

    async def disconnect(self, websocket: WebSocket) -> None:
        async with self._lock:
            self._connections.discard(websocket)
        logger.info("WS client disconnected", extra={"total": len(self._connections)})

    async def broadcast(self, event: WSEvent) -> None:
        """Broadcast a typed WSEvent to all connected clients."""
        message = event.model_dump_json()
        dead: list[WebSocket] = []

        async with self._lock:
            connections = list(self._connections)

        for ws in connections:
            try:
                await ws.send_text(message)
            except Exception as exc:
                logger.warning("WS send failed, removing client: %s", exc)
                dead.append(ws)

        if dead:
            async with self._lock:
                for ws in dead:
                    self._connections.discard(ws)

    @property
    def client_count(self) -> int:
        return len(self._connections)


# Singleton used by FastAPI app
ws_manager = WebSocketManager()
