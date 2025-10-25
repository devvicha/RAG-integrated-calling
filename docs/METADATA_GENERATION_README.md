# Metadata Generation Script - Summary

## Script Created: `generate_metadata.py`

### Purpose
Automatically generates `metadata.json` for all Knowledge Base files, excluding the `savings/` folder (which contains product-specific savings account information).

### Features
✅ Scans all `.md` and `.json` files in `Knowledge_base/`  
✅ Excludes `savings/` folder  
✅ Excludes system files (metadata.json, embeddings_index.json, faiss_index.bin)  
✅ Excludes temporary files (.bak, ~, .tmp, hidden files)  
✅ Auto-infers category from parent folder name  
✅ Sets consistent metadata fields for all files  

### Generated Metadata Fields
```json
{
  "file_path": "Knowledge_base/loans/catalog.md",
  "category": "loans",
  "language": "en",
  "product_area": "loans",
  "requires_auth": false,
  "last_reviewed": "2025-10-22"
}
```

### Execution Results
**Total files processed**: 42  
**Excluded**: savings/ folder (2 files: Double_savings.md, Regular_savings.md)

**Category Breakdown**:
- accounts: 2 files
- bank: 1 file
- calculators: 2 files (EMI + Savings calculator)
- digital: 1 file
- faqs: 1 file
- general: 24 files
- intents: 1 file
- loans: 2 files
- payments: 1 file
- persona: 1 file
- remittances: 1 file
- responses: 1 file
- workflows: 4 files

### How to Use

#### Generate metadata:
```bash
python generate_metadata.py
```

#### Rebuild FAISS index with new metadata:
```bash
conda activate sampath-rag
python backend/rag/build_index.py
```

### Why Exclude Savings Folder?
The `savings/` folder contains specific product descriptions (Double S and Regular Savings accounts) that are already properly indexed by the RAG system through `build_index.py`. This metadata generator is for other Knowledge Base files that need standardized metadata entries.

### Notes
- Metadata is sorted by file_path for consistency
- Date is automatically set to today (YYYY-MM-DD format)
- Can be re-run anytime to update metadata
- Safe to run multiple times (overwrites previous metadata.json)

---
Generated on: 2025-10-22
