"""
FastAPI RAG backend for Gemini Live
-----------------------------------
Loads FAISS + metadata from Knowledge_base/, encodes incoming Sinhala/English
queries, retrieves top-k chunks, and returns them as JSON.
"""

import os
import sys
import time
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import json, faiss, numpy as np
from pathlib import Path
from sentence_transformers import SentenceTransformer
import torch

# ---------- Config ----------
DEVICE = "mps" if torch.backends.mps.is_available() else "cpu"
MODEL_NAME = os.environ.get(
    "EMBEDDING_MODEL", "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
)
print(f"🔥 MPS available: {torch.backends.mps.is_available()} — using device='{DEVICE}'")

# absolute path to your Knowledge_base
KB_PATH = Path("/Users/vichakshaviduranga/Documents/IDEA_8_ML/RAGFORSAMPATHGEMINI/sampath-bank-customer-care5_withRAGEMINI/Knowledge_base")
INDEX_PATH = KB_PATH / "faiss_index.bin"
META_PATH = KB_PATH / "metadata.json"

class SimpleProgressBar:
    def __init__(self, label: str, width: int = 24):
        self.label = label
        self.width = width
        self._start: float | None = None

    def start(self):
        self._start = time.time()
        sys.stdout.write(f"{self.label}: [{' ' * self.width}] 0%")
        sys.stdout.flush()

    def finish(self, detail: str = ""):
        elapsed = 0.0 if self._start is None else time.time() - self._start
        bar = "#" * self.width
        suffix = f" — {detail}" if detail else ""
        sys.stdout.write(f"\r{self.label}: [{bar}] 100% (in {elapsed:.1f}s){suffix}\n")
        sys.stdout.flush()

# ---------- Load assets ----------
model_progress = SimpleProgressBar(f"🔄 Loading model {MODEL_NAME} on {DEVICE}")
model_progress.start()
model_start = time.time()
model = SentenceTransformer(MODEL_NAME, device=DEVICE)
model_progress.finish()
model_load_secs = time.time() - model_start
embedding_dim = getattr(model, "get_sentence_embedding_dimension", lambda: None)()
if embedding_dim:
    print(f"✅ Model ready (dim={embedding_dim}, load_time={model_load_secs:.1f}s)")
else:
    print(f"✅ Model ready (load_time={model_load_secs:.1f}s)")

faiss_progress = SimpleProgressBar(f"🔄 Loading FAISS index from {INDEX_PATH}")
faiss_progress.start()
faiss_start = time.time()
index = faiss.read_index(str(INDEX_PATH))
faiss_progress.finish()
faiss_load_time = time.time() - faiss_start
print(f"✅ FAISS index loaded (dim={index.d}, ntotal={index.ntotal}, load_time={faiss_load_time:.1f}s)")

if embedding_dim and embedding_dim != index.d:
    raise RuntimeError(
        f"Embedding dimension mismatch: model={embedding_dim}, index={index.d}. "
        "Rebuild the index with backend/rag/build_index.py using the same model."
    )

metadata_progress = SimpleProgressBar(f"🔄 Loading metadata from {META_PATH}")
metadata_progress.start()
metadata_start = time.time()
metadata = json.loads(META_PATH.read_text(encoding="utf-8"))
metadata_progress.finish()
print(f"✅ Loaded {len(metadata)} documents (load_time={time.time() - metadata_start:.1f}s)")

# ---------- FastAPI setup ----------
app = FastAPI(title="Gemini RAG Backend")

# CORS for local React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],       # or ["http://localhost:5173"]
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------- Models ----------
class Query(BaseModel):
    query: str
    k: int = 3

# ---------- Utility ----------
def search_faiss(query: str, k: int = 3) -> list[dict]:
    """Encode query, search FAISS, and return the top hits with scores."""
    search_start = time.time()
    encode_start = time.time()
    emb = model.encode([query], normalize_embeddings=True)
    encode_ms = (time.time() - encode_start) * 1000

    emb = np.asarray(emb, dtype=np.float32)
    if emb.ndim == 1:
        emb = np.expand_dims(emb, axis=0)

    faiss_start = time.time()
    D, I = index.search(emb, k)
    faiss_ms = (time.time() - faiss_start) * 1000

    hits: list[dict] = []

    for score, idx in zip(D[0], I[0]):
        if idx < 0 or idx >= len(metadata):
            print(f"[WARN] Ignoring FAISS hit with invalid index {idx}")
            continue

        item = metadata[idx]
        snippet = (item.get("chunk_text") or "").strip()
        if not snippet:
            continue

        hits.append(
            {
                "score": float(score),
                "chunk_text": snippet,
                "file_path": item.get("file_path", ""),
            }
        )

    if not hits:
        raise LookupError("No relevant chunks found for the supplied query.")

    print(
        f"[DEBUG] Query: {query[:80]} ... top score: {hits[0]['score']:.3f} "
        f"(total hits={len(hits)}) — encode={encode_ms:.1f}ms faiss={faiss_ms:.1f}ms total={(time.time() - search_start)*1000:.1f}ms"
    )
    return hits

# ---------- Routes ----------
@app.post("/rag")
async def rag_search(q: Query):
    try:
        print(f"[DEBUG] Received query: {q.query}")
        hits = search_faiss(q.query, q.k)
        combined = "\n\n".join(
            f"[score={hit['score']:.3f}] {hit['chunk_text']}" for hit in hits
        )
        return {"result": combined, "hits": hits}
    except Exception as e:
        message = str(e) or e.__class__.__name__
        print(f"[ERROR] Exception in /rag endpoint: {message}")
        return {"error": message}

@app.get("/")
def root():
    return {"status": "RAG backend running", "docs": len(metadata)}

# ---------- Run hint ----------
# uvicorn backend.rag.search_rag:app --reload --port 8000
