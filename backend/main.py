from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes.chat_routes import CHAT_ROUTER
from routes.game_routes import GAME_ROUTER
from routes.user_routes import USER_ROUTER

server = FastAPI(title="Directive Server", version="0.1.0")

server.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@server.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "Directive Tactical Server",
        "version": "0.1.0",
    }

server.include_router(CHAT_ROUTER)
server.include_router(GAME_ROUTER)
server.include_router(USER_ROUTER)
