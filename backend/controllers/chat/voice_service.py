
from fastapi import Response

from constants.server_codes import INTERNAL_SERVER_ERROR
from brain.voice_engine import generate_voice_wav_bytes
from schemas.request_schemas import TTSRequest

async def synthesize_speech(payload: TTSRequest):
    wav_bytes = generate_voice_wav_bytes(payload.message)
    if wav_bytes is None:
        return Response(status_code=INTERNAL_SERVER_ERROR, content="TTS generation failed")
    return Response(content=wav_bytes, media_type="audio/wav")