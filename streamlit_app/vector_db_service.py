"""Simple in-memory vector store for Streamlit deployment."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, Iterable, List, Sequence

import numpy as np
from sentence_transformers import SentenceTransformer


class VectorDBService:
    """Loads knowledge base documents and supports semantic search."""

    def __init__(self, model_name: str = "sentence-transformers/all-MiniLM-L6-v2") -> None:
        self.model = SentenceTransformer(model_name)
        self.documents: List[Dict[str, Any]] = []
        self._embeddings: np.ndarray | None = None

    def load_documents(self, paths: Sequence[Path]) -> None:
        for path in paths:
            data = json.loads(path.read_text())
            if isinstance(data, dict):
                data = [data]
            if not isinstance(data, list):
                continue
            for entry in data:
                doc = self._normalise_document(entry)
                self.add_document(doc)

    def add_document(self, document: Dict[str, Any]) -> None:
        self.documents.append(document)
        embedding = self._embed_text(document["content"])
        if self._embeddings is None:
            self._embeddings = embedding.reshape(1, -1)
        else:
            self._embeddings = np.vstack([self._embeddings, embedding])

    def search(self, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
        if not self.documents:
            return []
        query_vec = self._embed_text(query)
        scores = self._cosine_similarity(query_vec, self._embeddings)
        top_indices = np.argsort(scores)[::-1][:top_k]
        results: List[Dict[str, Any]] = []
        for idx in top_indices:
            doc = dict(self.documents[idx])
            doc["score"] = float(scores[idx])
            results.append(doc)
        return results

    def _embed_text(self, text: str) -> np.ndarray:
        return self.model.encode(text, convert_to_numpy=True)

    @staticmethod
    def _cosine_similarity(query_vec: np.ndarray, matrix: np.ndarray) -> np.ndarray:
        query_norm = np.linalg.norm(query_vec)
        matrix_norm = np.linalg.norm(matrix, axis=1)
        denom = matrix_norm * query_norm + 1e-10
        return (matrix @ query_vec) / denom

    @staticmethod
    def _normalise_document(entry: Dict[str, Any]) -> Dict[str, Any]:
        content = entry.get("content", "")
        if isinstance(content, dict):
            content = json.dumps(content, ensure_ascii=False, indent=2)
        return {
            "id": entry.get("id"),
            "title": entry.get("title") or "Knowledge Document",
            "content": str(content),
            "metadata": entry.get("metadata", {}),
        }
