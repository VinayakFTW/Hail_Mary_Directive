from types import SimpleNamespace
from sqlalchemy.orm import Session

from utils.server_response import server_response
from schemas.postgredb_schema import Engine, ChatMessages
from constants.server_codes import SUCCESS, INTERNAL_SERVER_ERROR

STATIC_TEXT = SimpleNamespace(
    CHAT_MESSAGES_RETRIEVED_SUCCESS="Chat messages retrieved successfully",
    CHAT_MESSAGES_RETRIEVAL_FAILED="Failed to retrieve chat messages",
)

async def get_session_chats(session_id: int):
    with Session(Engine) as db:
        try:
            chat_messages = (
                db.query(ChatMessages)
                .filter(ChatMessages.session_id == session_id)
                .order_by(ChatMessages.created_at.asc())
                .all()
            )

            chat_messages_data = [
                {
                    "id": message.id,
                    "session_id": message.session_id,
                    "user_mail": message.user_mail,
                    "original_message": message.original_message,
                    "delivered_message": message.delivered_message,
                    "created_at": message.created_at.isoformat() if message.created_at else None,
                }
                for message in chat_messages
            ]

            return server_response(
                status_code=SUCCESS,
                message=STATIC_TEXT.CHAT_MESSAGES_RETRIEVED_SUCCESS,
                data=chat_messages_data,
            )

        except Exception as e:
            return server_response(
                status_code=INTERNAL_SERVER_ERROR,
                message=STATIC_TEXT.CHAT_MESSAGES_RETRIEVAL_FAILED,
            )