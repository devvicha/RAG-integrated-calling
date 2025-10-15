from __future__ import annotations

import os
from pathlib import Path
import hashlib

import streamlit as st
from streamlit.errors import StreamlitSecretNotFoundError

try:
    from streamlit_mic_recorder import mic_recorder  # type: ignore

    MIC_RECORDER_AVAILABLE = True
except ModuleNotFoundError:
    mic_recorder = None  # type: ignore
    MIC_RECORDER_AVAILABLE = False

from streamlit_app.chat_interface import ChatInterface
from streamlit_app.customer_support_service import CustomerSupportService
from streamlit_app.gemini_client import GeminiClient
from streamlit_app.vector_db_service import VectorDBService
from streamlit_app.voice_utils import synthesize_audio, transcribe_audio


st.set_page_config(
    page_title="Sampath Bank Customer Care",
    page_icon="🏦",
    layout="wide",
    initial_sidebar_state="expanded",
)


def resolve_api_key() -> str:
    secrets_key = None
    if hasattr(st, "secrets"):
        try:
            secrets_key = st.secrets.get("GEMINI_API_KEY")
        except (StreamlitSecretNotFoundError, KeyError):
            secrets_key = None
    env_key = os.getenv("GEMINI_API_KEY")
    api_key = secrets_key or env_key
    if not api_key:
        st.error(
            "⚠️ No Gemini API key found. Set `GEMINI_API_KEY` in Streamlit secrets "
            "or as an environment variable."
        )
        st.stop()
    return api_key


def load_vector_db() -> VectorDBService:
    if "vector_db" in st.session_state:
        return st.session_state.vector_db
    with st.spinner("Loading embedding model…"):
        vector_db = VectorDBService()
    kb_files = [Path("lib/prompts/knowledge-base.json")]
    existing_files = [path for path in kb_files if path.exists()]
    if existing_files:
        with st.spinner("Loading knowledge base…"):
            vector_db.load_documents(existing_files)
    st.session_state.vector_db = vector_db
    return vector_db


def load_customer_support(api_key: str) -> CustomerSupportService:
    if "customer_support" in st.session_state:
        return st.session_state.customer_support
    vector_db = load_vector_db()
    gemini_client = GeminiClient(api_key=api_key)
    support_service = CustomerSupportService(vector_db, gemini_client)
    st.session_state.customer_support = support_service
    return support_service


def main() -> None:
    api_key = resolve_api_key()
    chat = ChatInterface()
    service = load_customer_support(api_key)

    with st.sidebar:
        st.title("🏦 Sampath Bank")
        st.markdown("### Customer Care Assistant")

        language = st.selectbox(
            "Preferred language",
            ["English", "Sinhala", "Tamil"],
        )
        voice_mode = st.checkbox(
            "Enable voice mode",
            value=False,
            help="Record Sinhala/Tamil queries and hear spoken responses.",
            disabled=not MIC_RECORDER_AVAILABLE,
        )
        if not MIC_RECORDER_AVAILABLE:
            st.caption(
                "Install `streamlit-mic-recorder` to unlock Sinhala/Tamil voice capture."
            )
        st.session_state["voice_mode"] = voice_mode
        st.session_state["voice_language"] = language

        vector_db = load_vector_db()
        st.markdown("#### Knowledge base")
        st.success(f"Loaded {len(vector_db.documents)} documents")

        if st.button("🗑️ Clear conversation"):
            chat.clear()
            st.rerun()

    st.title("💬 Customer Care Chat")

    if not chat.history():
        chat.add_message(
            "assistant",
            "Hello! I'm the Sampath Bank virtual assistant. "
            "How can I help you today?",
    )

    chat.render_history()

    voice_prompt = None
    voice_enabled = st.session_state.get("voice_mode", False) and MIC_RECORDER_AVAILABLE
    if voice_enabled:
        st.markdown("🎙️ **Voice mode enabled** — press the microphone to speak.")
        audio_result = mic_recorder(
            start_prompt="🎤 Start recording",
            stop_prompt="Stop",
            just_once=False,
            use_container_width=True,
            key="sinhala_mic",
        )
        if audio_result and isinstance(audio_result, dict) and audio_result.get("bytes"):
            audio_hash = hashlib.md5(audio_result["bytes"]).hexdigest()
            if audio_hash != st.session_state.get("last_audio_hash"):
                st.session_state["last_audio_hash"] = audio_hash
                with st.spinner("Transcribing speech…"):
                    try:
                        voice_prompt = transcribe_audio(audio_result["bytes"], language)
                        if voice_prompt:
                            st.info(f"🗣️ Recognized speech: {voice_prompt}")
                    except Exception as exc:
                        st.error(f"Speech transcription failed: {exc}")

    text_prompt = st.chat_input("Type your question…")
    prompt = text_prompt or voice_prompt

    if prompt:
        chat.add_message("user", prompt)
        with st.chat_message("user"):
            st.write(prompt)
        with st.chat_message("assistant"):
            with st.spinner("Thinking…"):
                response = service.process_query(prompt, language=language.lower())
                st.write(response["content"])
                chat.render_sources(response.get("sources"))
                if voice_enabled:
                    with st.spinner("Generating audio reply…"):
                        audio_bytes = synthesize_audio(response["content"], language)
                    if audio_bytes:
                        st.audio(audio_bytes, format="audio/mp3")
        chat.add_message(
            "assistant",
            response["content"],
            sources=response.get("sources"),
        )


if __name__ == "__main__":
    main()
