"""Thin wrapper around the Gemini client for Streamlit use."""

from __future__ import annotations

from typing import Iterable, Dict, Any

import google.generativeai as genai


class GeminiClient:
    """Handles prompting Gemini with retrieved context."""

    def __init__(
        self,
        api_key: str,
        model_name: str = "gemini-1.5-flash-latest",
        fallback_model: str = "gemini-pro",
    ) -> None:
        genai.configure(api_key=api_key)
        model_candidates = [model_name, fallback_model, "gemini-1.0-pro"]
        last_exception: Exception | None = None
        for candidate in model_candidates:
            try:
                self.model = genai.GenerativeModel(candidate)
                return
            except Exception as exc:  # pragma: no cover - depends on API availability
                last_exception = exc
                continue
        raise RuntimeError(
            "Unable to initialise Gemini model. Tried: "
            + ", ".join(model_candidates)
        ) from last_exception

    def generate_response(
        self,
        query: str,
        *,
        context: Iterable[Dict[str, Any]] | None = None,
        language: str = "english",
    ) -> str:
        prompt = self._build_prompt(query, context=context, language=language)
        response = self.model.generate_content(prompt)
        return response.text.strip()

    @staticmethod
    def _build_prompt(
        query: str,
        *,
        context: Iterable[Dict[str, Any]] | None,
        language: str,
    ) -> str:
        base = [
            "You are a helpful Sampath Bank customer-care specialist.",
            f"Respond in {language} unless the user explicitly requests another language.",
            "",
            f"Customer query: {query}",
        ]
        if context:
            base.append("\nRelevant internal knowledge:")
            for doc in context:
                title = doc.get("title", "Document")
                body = doc.get("content", "")
                base.append(f"- {title}: {body}")
        base.append(
            "\nCraft a concise, trustworthy answer and cite supporting facts when possible."
        )
        return "\n".join(base)
