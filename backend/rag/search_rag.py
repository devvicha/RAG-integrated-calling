"""
FastAPI RAG backend for Gemini Live
-----------------------------------
Loads FAISS + metadata from Knowledge_base/, encodes incoming Sinhala/English
queries, retrieves top-k chunks, and returns them as JSON.
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import json, faiss, numpy as np
from pathlib import Path
from sentence_transformers import SentenceTransformer
import torch

# ---------- Config ----------
DEVICE = "mps" if torch.backends.mps.is_available() else "cpu"
MODEL_NAME = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"

# absolute path to your Knowledge_base
KB_PATH = Path("/Users/vichakshaviduranga/Documents/IDEA_8_ML/RAGFORSAMPATHGEMINI/sampath-bank-customer-care5_withRAGEMINI/Knowledge_base")
INDEX_PATH = KB_PATH / "faiss_index.bin"
META_PATH = KB_PATH / "metadata.json"

# ---------- Load assets ----------
print(f"🔄 Loading model {MODEL_NAME} on {DEVICE} ...")
model = SentenceTransformer(MODEL_NAME, device=DEVICE)

print(f"🔄 Loading FAISS index from {INDEX_PATH}")
index = faiss.read_index(str(INDEX_PATH))

print(f"🔄 Loading metadata from {META_PATH}")
metadata = json.loads(META_PATH.read_text(encoding="utf-8"))
print(f"✅ Loaded {len(metadata)} documents")

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
def search_faiss(query: str, k: int = 3) -> str:
    """Encode query, search FAISS, and return concatenated top results."""
    emb = model.encode([query], normalize_embeddings=True)
    D, I = index.search(np.array(emb, dtype=np.float32), k)
    results = []
    for idx, score in zip(I[0], D[0]):
        item = metadata[idx]
        snippet = item["chunk_text"].strip()
        results.append(f"[{score:.3f}] {snippet}")
    combined = "\n".join(results)
    print(f"🔍 Query: {query[:80]} ...\nTop result:\n{results[0][:200]}...")
    return combined

# ---------- Routes ----------
@app.post("/rag")
async def rag_search(q: Query):
    try:
        result_text = search_faiss(q.query, q.k)
        return {"result": result_text}
    except Exception as e:
        return {"error": str(e)}

@app.get("/")
def root():
    return {"status": "RAG backend running", "docs": len(metadata)}

# ---------- Run hint ----------
# uvicorn backend.rag.search_rag:app --reload --port 8000