"""Core orchestration for the Streamlit customer-care assistant."""

from __future__ import annotations

from typing import Any, Dict

from .gemini_client import GeminiClient
from .vector_db_service import VectorDBService


class CustomerSupportService:
    """Coordinates retrieval augmented generation for customer queries."""

    def __init__(self, vector_db: VectorDBService, gemini_client: GeminiClient) -> None:
        self.vector_db = vector_db
        self.gemini_client = gemini_client

    def process_query(self, query: str, language: str = "english") -> Dict[str, Any]:
        documents = self.vector_db.search(query, top_k=5)
        answer = self.gemini_client.generate_response(
            query,
            context=documents,
            language=language,
        )
        return {
            "content": answer,
            "sources": [
                {
                    "title": doc.get("title"),
                    "content": doc.get("content"),
                    "score": doc.get("score"),
                }
                for doc in documents
            ],
        }
