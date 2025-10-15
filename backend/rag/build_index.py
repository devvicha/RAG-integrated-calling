import os
import json
from pathlib import Path
from sentence_transformers import SentenceTransformer
from langchain.text_splitter import RecursiveCharacterTextSplitter
import faiss
import numpy as np

# Enable Apple's Metal Performance Shaders (MPS) if available
import torch
if torch.backends.mps.is_available():
    device = torch.device("mps")
else:
    device = torch.device("cpu")

# Paths
repo_root = Path(__file__).resolve().parents[2]
knowledge_base_path = repo_root / "Knowledge_base"
faiss_index_path = knowledge_base_path / "faiss_index.bin"
metadata_path = knowledge_base_path / "metadata.json"
print(f"[DEBUG] Using Knowledge Base path: {knowledge_base_path.resolve()}")

if not knowledge_base_path.exists():
    raise FileNotFoundError(f"Knowledge base directory not found at {knowledge_base_path.resolve()}")

# Initialize SentenceTransformer
# Defaulting to a public multilingual model; override via EMBEDDING_MODEL env if required.
model_name = os.environ.get("EMBEDDING_MODEL", "sentence-transformers/distiluse-base-multilingual-cased-v2")
model = SentenceTransformer(model_name, device=device)

# RecursiveCharacterTextSplitter tuned for small KBs
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=400,
    chunk_overlap=50
)

# Collect all Markdown and JSON files
markdown_files = list(knowledge_base_path.glob("**/*.md"))
json_files = [
    path for path in knowledge_base_path.glob("**/*.json")
    if path.name not in {"embeddings_index.json", "faiss_index.bin", "metadata.json"}
]

chunks = []
metadata = []

# Process Markdown files
for md_file in markdown_files:
    with open(md_file, "r", encoding="utf-8") as f:
        text = f.read()
    # Strip Markdown formatting
    clean_text = text.replace("#", "").replace("*", "").replace("`", "")
    split_texts = text_splitter.split_text(clean_text)
    for chunk in split_texts:
        chunks.append(chunk)
        metadata.append({"file_path": str(md_file), "chunk_text": chunk})

def stringify_json_content(data) -> str:
    """Recursively convert JSON content into a searchable string."""
    if isinstance(data, dict):
        preferred_keys = ["title", "content", "description", "body", "text", "answer"]
        parts = [stringify_json_content(data[key]) for key in preferred_keys if key in data and data[key]]
        if not parts:
            parts = [stringify_json_content(value) for value in data.values()]
        return " ".join(filter(None, map(str.strip, parts)))
    if isinstance(data, list):
        return " ".join(filter(None, (stringify_json_content(item) for item in data)))
    return str(data)


# Process JSON files
for json_file in json_files:
    with open(json_file, "r", encoding="utf-8") as f:
        data = json.load(f)

    text = stringify_json_content(data).strip()
    if not text:
        print(f"[WARN] Skipping empty JSON file: {json_file}")
        continue

    split_texts = text_splitter.split_text(text)
    for chunk in split_texts:
        chunks.append(chunk)
        metadata.append({"file_path": str(json_file), "chunk_text": chunk})

print(f"Loaded {len(chunks)} chunks from {len(markdown_files)} markdown and {len(json_files)} JSON files.")

if not chunks:
    raise ValueError("No chunks were generated. Ensure Knowledge_base/ contains non-empty .md or .json files.")

# Generate embeddings
embeddings = model.encode(chunks, normalize_embeddings=True)
embeddings = np.atleast_2d(embeddings)

# Create FAISS index
dimension = embeddings.shape[1]
index = faiss.IndexFlatIP(dimension)
index.add(embeddings)

# Save FAISS index
faiss.write_index(index, str(faiss_index_path))

# Save metadata
with open(metadata_path, "w", encoding="utf-8") as f:
    json.dump(metadata, f, ensure_ascii=False, indent=4)

# Print summary
print(f"Total chunks: {len(chunks)}")
print("✅ Index built successfully")
