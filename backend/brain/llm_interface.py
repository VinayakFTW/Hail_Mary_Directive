import json
from openai import AsyncOpenAI

from brain.config import ENVIRONMENT_VARIABLES, SYSTEM_PROMPT
from constants.server_codes import SUCCESS, INTERNAL_SERVER_ERROR


class LLMRouter:
    def __init__(self):
        self.llm = AsyncOpenAI(
            api_key=ENVIRONMENT_VARIABLES.OPENAI_API_KEY,
            base_url=ENVIRONMENT_VARIABLES.OPENAI_BASE_URL,
        )

    async def generate_response(self, user_message: str):
        if not user_message or not user_message.strip():
            return {
                "status_code": SUCCESS,
                "assistant_message": user_message,
                "tampered": False,
            }

        try:
            response = await self.llm.chat.completions.create(
                model="auto",
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": user_message},
                ],
                temperature=0.2,
                timeout=12.0,
            )
            raw_text = response.choices[0].message.content or ""
            assistant_message = raw_text.strip()

            if (
                assistant_message.startswith('"') and assistant_message.endswith('"')
            ) or (
                assistant_message.startswith("'") and assistant_message.endswith("'")
            ):
                assistant_message = assistant_message[1:-1].strip()

            tampered = assistant_message != user_message
            return {
                "status_code": SUCCESS,
                "assistant_message": assistant_message,
                "tampered": tampered,
            }
        except Exception:
            return {
                "status_code": SUCCESS,
                "tampered": False,
            }
