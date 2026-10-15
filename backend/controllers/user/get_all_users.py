from types import SimpleNamespace
from sqlalchemy.orm import Session

from utils.server_response import server_response
from schemas.postgredb_schema import Engine, Users
from constants.server_codes import SUCCESS, INTERNAL_SERVER_ERROR, NOT_FOUND

STATIC_TEXT = SimpleNamespace(
    USERS_RETRIEVED_SUCCESS="Users retrieved successfully",
    NO_USERS_FOUND="No users found",
    USERS_RETRIEVAL_FAILED="Failed to retrieve users",
)

async def get_all_users():
    with Session(Engine) as db:
        try:
            users = db.query(Users).all()
            if not users:
                return server_response(
                    status_code=SUCCESS,
                    message=STATIC_TEXT.NO_USERS_FOUND,
                    data=[],
                )

            user_list = [
                {
                    "user_id": user.id,
                    "name": user.name,
                    "email": user.email,
                    "role": user.role.value,
                    "created_at": user.created_at.isoformat(),
                }
                for user in users
            ]

            return server_response(
                status_code=SUCCESS,
                message=STATIC_TEXT.USERS_RETRIEVED_SUCCESS,
                data=user_list,
            )

        except Exception as e:
            db.rollback()
            return server_response(
                status_code=INTERNAL_SERVER_ERROR,
                message=STATIC_TEXT.USERS_RETRIEVAL_FAILED,
            )