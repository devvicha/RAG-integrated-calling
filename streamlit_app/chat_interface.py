"""UI helpers for the Streamlit chat experience."""

from __future__ import annotations

from typing import Any, Dict, Iterable, Optional

import streamlit as st


class ChatInterface:
    """Light wrapper around Streamlit's chat widgets."""

    def __init__(self) -> None:
        if "messages" not in st.session_state:
            st.session_state.messages: list[Dict[str, Any]] = []

    def history(self) -> Iterable[Dict[str, Any]]:
        return st.session_state.messages

    def add_message(
        self,
        role: str,
        content: str,
        *,
        sources: Optional[Iterable[Dict[str, Any]]] = None,
    ) -> None:
        message: Dict[str, Any] = {"role": role, "content": content}
        if sources:
            message["sources"] = list(sources)
        st.session_state.messages.append(message)

    def clear(self) -> None:
        st.session_state.messages = []

    def render_history(self) -> None:
        for message in self.history():
            with st.chat_message(message["role"]):
                st.write(message["content"])
                self.render_sources(message.get("sources"))

    @staticmethod
    def render_sources(sources: Optional[Iterable[Dict[str, Any]]]) -> None:
        if not sources:
            return
        with st.expander("📚 Sources"):
            for source in sources:
                title = source.get("title") or "Document"
                content = str(source.get("content", ""))[:300]
                st.markdown(f"- **{title}** — {content}")
