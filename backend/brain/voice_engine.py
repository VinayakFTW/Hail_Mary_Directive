import io
import sys
import threading
import torch

# Workaround for Windows/torchvision runtime operator incompatibility in transformers
sys.modules.setdefault("torchvision", None)
sys.modules.setdefault("torchvision.io", None)

from scipy.io.wavfile import write as wav_write
from soprano import SopranoTTS
from soprano.utils.streaming import play_stream

from constants.server_codes import INTERNAL_SERVER_ERROR, SUCCESS

_tts_model = None
_tts_lock = threading.Lock()

def get_tts_model() -> SopranoTTS:
    global _tts_model
    if _tts_model is None:
        device = "cuda" if torch.cuda.is_available() else "cpu"
        _tts_model = SopranoTTS(
            backend="transformers",
            device=device,
            cache_size_mb=500,
            decoder_batch_size=2
        )
    return _tts_model

def _voice_engine(text: str) -> dict:
    if not text or not text.strip():
        return {"status_code": SUCCESS, "message": "Empty text skipped"}

    try:
        with _tts_lock:
            model = get_tts_model()
            stream = model.infer_stream(text.strip(), chunk_size=1)
            play_stream(stream)
        return {"status_code": SUCCESS, "message": "Audio playback completed"}
    except Exception as e:
        print(f"[VoiceEngine Error]: {e}")
        return {
            "status_code": INTERNAL_SERVER_ERROR,
            "message": f"Error in voice engine: {str(e)}"
        }

def _voice_engine_async(text: str) -> None:
    thread = threading.Thread(target=_voice_engine, args=(text,), daemon=True)
    thread.start()

def generate_voice_wav_bytes(text: str) -> bytes | None:
    if not text or not text.strip():
        return None
    try:
        with _tts_lock:
            model = get_tts_model()
            audio_tensor = model.infer(text.strip())
            audio_np = audio_tensor.cpu().numpy().squeeze()
            
            buffer = io.BytesIO()
            wav_write(buffer, 32000, audio_np)
            buffer.seek(0)
            return buffer.read()
    except Exception as e:
        print(f"[VoiceEngine WAV Error]: {e}")
        return None