from fastapi import APIRouter

from controllers.chat.send_chat import send_chat_message
from controllers.chat.get_session_chats import get_session_chats
from controllers.chat.voice_service import synthesize_speech

CHAT_ROUTER = APIRouter(prefix="/chat", tags=["Chat API"])

CHAT_ROUTER.add_api_route("/send", send_chat_message, methods=["POST"])
CHAT_ROUTER.add_api_route("/messages/{session_id}", get_session_chats, methods=["GET"])
CHAT_ROUTER.add_api_route("/tts", synthesize_speech, methods=["POST"])