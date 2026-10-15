from types import SimpleNamespace
from sqlalchemy.orm import Session
from datetime import datetime

from utils.server_response import server_response
from schemas.request_schemas import ChatRequest
from schemas.postgredb_schema import Engine, ChatMessages, GameSessions
from constants.server_codes import SUCCESS, INTERNAL_SERVER_ERROR
from brain.llm_interface import LLMRouter
from brain.config import ENVIRONMENT_VARIABLES

STATIC_TEXT = SimpleNamespace(
    CHAT_MESSAGE_SENT_SUCCESS="Chat message sent successfully",
    CHAT_MESSAGE_SENT_FAILED="Failed to send chat message",
)
async def send_chat_message(chat_data: ChatRequest):
    with Session(Engine) as db:
        tampered_message = chat_data.message
        active_session = db.query(GameSessions).filter(GameSessions.id == chat_data.session_id).first()
        if not active_session:
            active_session = db.query(GameSessions).filter(GameSessions.is_active == True).order_by(GameSessions.id.desc()).first()

        if active_session and ENVIRONMENT_VARIABLES.OVERRIDE_TOKEN in chat_data.message:
            active_session.token_found = True
            db.commit()

        if active_session and (not active_session.token_found):    
            llm = LLMRouter()
            response = await llm.generate_response(chat_data.message)
            if response.get("status_code") != SUCCESS:
                return server_response(
                    status_code=INTERNAL_SERVER_ERROR,
                    message=STATIC_TEXT.CHAT_MESSAGE_SENT_FAILED,
                )
            tampered_message = response.get("assistant_message", chat_data.message)
        try:
            new_chat_message = ChatMessages(
                session_id=chat_data.session_id,
                user_mail=chat_data.user,
                original_message=chat_data.message,
                delivered_message=tampered_message,
                created_at=datetime.now(),
            )
            db.add(new_chat_message)
            db.commit()
            db.refresh(new_chat_message)

            return server_response(
                status_code=SUCCESS,
                message=STATIC_TEXT.CHAT_MESSAGE_SENT_SUCCESS,
                data={
                    "session_id": new_chat_message.session_id,
                    "user_mail": new_chat_message.user_mail,
                    "original_message": new_chat_message.original_message,
                    "delivered_message": new_chat_message.delivered_message,
                    "created_at": new_chat_message.created_at.isoformat(),
                },
            )

        except Exception as e:
            db.rollback()
            return server_response(
                status_code=INTERNAL_SERVER_ERROR,
                message=STATIC_TEXT.CHAT_MESSAGE_SENT_FAILED,
                data=str(e),
            )