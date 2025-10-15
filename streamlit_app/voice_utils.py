"""Voice input/output utilities for the Streamlit assistant."""

from __future__ import annotations

import io
import os
import tempfile
from typing import Optional

import streamlit as st
from faster_whisper import WhisperModel
from gtts import gTTS


LANGUAGE_CODE_MAP = {
    "english": "en",
    "sinhala": "si",
    "sinhala / සිංහල": "si",
    "tamil": "ta",
}


def language_to_iso(language: str) -> str:
    """Return ISO language code, defaults to English."""
    return LANGUAGE_CODE_MAP.get(language.lower(), "en")


@st.cache_resource(show_spinner=False)
def load_whisper_model() -> WhisperModel:
    """Cache the Whisper model so it loads only once."""
    # `small` offers a good Sinhala balance without huge downloads.
    return WhisperModel("small", device="cpu", compute_type="int8")


def transcribe_audio(audio_bytes: bytes, language: str) -> str:
    """Transcribe microphone audio into text."""
    lang_code = language_to_iso(language)
    with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
        tmp.write(audio_bytes)
        tmp.flush()
        temp_path = tmp.name
    try:
        model = load_whisper_model()
        segments, _ = model.transcribe(
            temp_path,
            language=lang_code,
            beam_size=5,
        )
        text = " ".join(segment.text.strip() for segment in segments).strip()
        return text
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)


def synthesize_audio(text: str, language: str) -> Optional[io.BytesIO]:
    """Return MP3 audio for assistant replies."""
    lang_code = language_to_iso(language)
    try:
        tts = gTTS(text=text, lang=lang_code, slow=False)
    except ValueError:
        # Fallback to English if the requested language is unsupported.
        tts = gTTS(text=text, lang="en", slow=False)
    buffer = io.BytesIO()
    tts.write_to_fp(buffer)
    buffer.seek(0)
    return buffer
