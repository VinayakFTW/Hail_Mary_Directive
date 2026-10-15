from types import SimpleNamespace
from sqlalchemy.orm import Session

from utils.server_response import server_response
from schemas.request_schemas import SignupRequest
from schemas.postgredb_schema import Engine, Users
from constants.server_codes import CREATED, INTERNAL_SERVER_ERROR, CONFLICT

STATIC_TEXT = SimpleNamespace(
    USER_CREATED_SUCCESS="User created successfully",
    USER_ALREADY_EXISTS="User with this email already exists",
    USER_CREATION_FAILED="Failed to create user",)

async def create_user(user_data: SignupRequest):
    if not user_data.email or "@" not in user_data.email or "." not in user_data.email.split("@")[-1]:
        return server_response(
            status_code=CONFLICT,
            message="Invalid email address format.",
        )
    with Session(Engine) as db:
        try:
            existing_user = db.query(Users).filter(Users.email == user_data.email).first()
            if existing_user:
                return server_response(
                    status_code=CONFLICT,
                    message=STATIC_TEXT.USER_ALREADY_EXISTS,
                )

            new_user = Users(
                name=user_data.name,
                email=user_data.email,
                role=user_data.role.upper(),
            )
            db.add(new_user)
            db.commit()
            db.refresh(new_user)

            return server_response(
                status_code=CREATED,
                message=STATIC_TEXT.USER_CREATED_SUCCESS,
                data={
                    "user_id": new_user.id,
                    "name": new_user.name,
                    "email": new_user.email,
                    "role": new_user.role.value,
                    "created_at": new_user.created_at.isoformat(),
                },
            )

        except Exception as e:
            db.rollback()
            return server_response(
                status_code=INTERNAL_SERVER_ERROR,
                message=STATIC_TEXT.USER_CREATION_FAILED,
            )