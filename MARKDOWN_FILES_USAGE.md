# How Markdown (.md) Files Are Utilized in This Project

## Overview
This project uses `.md` (Markdown) files in **two distinct ways**:

1. **Knowledge Base Content** (`.md` files in `Knowledge_base/`)
2. **Documentation** (`.md` files in root and other directories)

---

## 1. Knowledge Base `.md` Files (RAG System)

### Location
`/Knowledge_base/**/*.md`

### Purpose
These markdown files serve as the **source of truth** for the RAG (Retrieval-Augmented Generation) system. They contain banking information that Nova uses to answer customer questions.

### How They Work

#### Step 1: Indexing Process (`backend/rag/build_index.py`)
```python
# The system scans all .md files in Knowledge_base/
markdown_files = list(knowledge_base_path.glob("**/*.md"))

# Each file is:
# 1. Read and parsed
# 2. Split into chunks (400 chars with 50 char overlap)
# 3. Converted to embeddings using sentence-transformers
# 4. Stored in FAISS vector index
```

**Example Knowledge Base Files:**
```
Knowledge_base/
├── loans/
│   ├── catalog.md          ← Loan products information
│   └── lifecycle.md        ← Loan application workflow
├── accounts/
│   └── types.md           ← Account types
├── pawning/
│   ├── randiriya_pawning.md  ← Pawning services
│   └── pawning_overview.md   ← General pawning info
├── calculators/
│   └── emi.md             ← EMI calculation details
└── faqs/
    └── base.md            ← Common FAQs
```

#### Step 2: Query Processing (`backend/rag/search_rag.py`)
```python
# When user asks a question in Sinhala:
# 1. Question is translated to English (per system prompt)
# 2. Query is converted to embedding
# 3. FAISS searches for similar chunks from .md files
# 4. Top 3 results are returned
# 5. Nova responds in Sinhala using the retrieved info
```

**Example Flow:**
```
User: "ණය ගැන කියන්න" (Tell me about loans)
  ↓
Translation: "loans information"
  ↓
RAG Search: Finds chunks from loans/catalog.md, loans/lifecycle.md
  ↓
Nova: "හ්ම්ම්... හරි. බලන්න, සම්පත් බැංකුවේ..." (responds in Sinhala)
```

#### Step 3: FAISS Index Files
The indexed `.md` content is stored as:
- `faiss_index.bin` - Vector embeddings
- `metadata.json` - File paths and chunk info

### Key Files That Process Knowledge Base `.md`
| File | Purpose |
|------|---------|
| `backend/rag/build_index.py` | Reads `.md` files, creates FAISS index |
| `backend/rag/search_rag.py` | Queries FAISS index for relevant chunks |
| `lib/services/vector-db-service.ts` | Frontend service calling RAG backend |
| `lib/services/function-dispatcher-new.ts` | Handles `search_knowledge_base` tool |

### Adding New Knowledge Base Content
To add new banking information:

1. **Create a new `.md` file** in appropriate subfolder:
   ```bash
   touch Knowledge_base/cards/credit_cards.md
   ```

2. **Write content in markdown**:
   ```markdown
   # Credit Cards
   
   ## Features
   - Reward points
   - Cash back
   
   ## Eligibility
   - Minimum income: LKR 50,000
   ```

3. **Rebuild FAISS index**:
   ```bash
   cd backend/rag
   python build_index.py
   ```

4. **Test retrieval**:
   ```bash
   curl -X POST http://localhost:8000/search \
     -H "Content-Type: application/json" \
     -d '{"query": "credit cards"}'
   ```

---

## 2. Documentation `.md` Files (Project Documentation)

### Location
Root directory and other folders (NOT in `Knowledge_base/`)

### Purpose
These files are **human-readable documentation** for developers, not used by the RAG system. They explain:
- How to set up the project
- How features work
- Implementation details
- Testing guides

### Key Documentation Files

#### Configuration & Setup
| File | Purpose | Used By |
|------|---------|---------|
| `README.md` | Main project documentation | Developers |
| `CONDA_SETUP.md` | Environment setup guide | Developers |
| `.env.local.example` | Environment variable template | Developers |

#### Voice & TTS Configuration
| File | Purpose | Used By |
|------|---------|---------|
| `VOICE_CONFIGURATION_GUIDE.md` | Voice selection guide | Developers |
| `VOICE_IMPLEMENTATION_SUMMARY.md` | Voice feature implementation | Developers |
| `PRONUNCIATION_GUIDE.md` | Sinhala pronunciation improvements | Developers |

#### RAG & Knowledge Base
| File | Purpose | Used By |
|------|---------|---------|
| `PAWNING_KB_STATUS.md` | Pawning KB coverage status | Developers |
| `WEB_SEARCH_INTEGRATION.md` | Web search fallback feature | Developers |
| `ENVIRONMENT_SETUP.md` | Environment config guide | Developers |

#### Error Handling & Testing
| File | Purpose | Used By |
|------|---------|---------|
| `ERROR_HANDLING_IMPLEMENTATION.md` | Error handling details | Developers |
| `STREAM_ERROR_HANDLING_GUIDE.md` | Stream error guide | Developers |
| `TEST_CHECKLIST.md` | Testing checklist | Developers |

#### Knowledge Base Documentation
| File | Purpose | Used By |
|------|---------|---------|
| `Knowledge_base/README.md` | KB structure explanation | Developers |
| `Knowledge_base/metadata.json` | Auto-generated metadata | `build_index.py` |

### How Documentation `.md` Files Are NOT Used
❌ **NOT indexed by FAISS** - They're not in the vector database  
❌ **NOT used by RAG** - Nova doesn't answer questions from them  
❌ **NOT read at runtime** - They're for humans, not the application  

### How Documentation `.md` Files ARE Used
✅ **Read by developers** - During setup and debugging  
✅ **Referenced in README** - Links to detailed guides  
✅ **Version controlled** - Tracked in git for team collaboration  
✅ **Living documentation** - Updated as features change  

---

## Summary Table

| Aspect | Knowledge Base `.md` | Documentation `.md` |
|--------|---------------------|-------------------|
| **Location** | `Knowledge_base/**/*.md` | Root, docs, etc. |
| **Purpose** | Banking data for RAG | Developer guides |
| **Processed By** | `build_index.py` | N/A (human-read) |
| **Indexed** | ✅ Yes (FAISS) | ❌ No |
| **Used at Runtime** | ✅ Yes (RAG queries) | ❌ No |
| **Audience** | Nova AI Agent | Human Developers |
| **Content Type** | Bank products, policies | Setup, architecture |
| **Updates Require** | FAISS rebuild | Git commit only |

---

## Best Practices

### For Knowledge Base `.md` Files
1. ✅ Use clear, concise language
2. ✅ Include Sinhala keywords in metadata
3. ✅ Organize by topic (loans/, accounts/, etc.)
4. ✅ Keep chunks small (< 400 chars works best)
5. ✅ Rebuild index after changes
6. ✅ Test retrieval with curl

### For Documentation `.md` Files
1. ✅ Keep README.md up to date
2. ✅ Link related docs together
3. ✅ Use clear headings and structure
4. ✅ Include code examples
5. ✅ Update when features change
6. ✅ Don't duplicate KB content here

---

## Common Confusion Points

### ❓ "Why isn't my documentation showing up in RAG responses?"
**Answer:** Documentation `.md` files are NOT in `Knowledge_base/` so they're not indexed. Only files in `Knowledge_base/**/*.md` are used by RAG.

### ❓ "I updated a KB `.md` file but Nova still gives old answers"
**Answer:** You need to rebuild the FAISS index:
```bash
cd backend/rag
python build_index.py
```

### ❓ "Can I delete documentation `.md` files?"
**Answer:** You can, but you'll lose valuable setup/troubleshooting info. They don't affect app performance since they're not loaded at runtime.

### ❓ "Should I put new bank info in README.md?"
**Answer:** No! Bank information should go in `Knowledge_base/**/*.md` so RAG can use it. README.md is for project setup instructions.

---

## Quick Reference

### To Add Banking Information (RAG System):
```bash
# 1. Create .md file in Knowledge_base/
echo "# New Product Info" > Knowledge_base/products/new_product.md

# 2. Add content
vim Knowledge_base/products/new_product.md

# 3. Rebuild index
cd backend/rag && python build_index.py

# 4. Test
curl -X POST http://localhost:8000/search -d '{"query": "new product"}'
```

### To Add Project Documentation:
```bash
# 1. Create .md file in root or docs/
echo "# New Feature Guide" > NEW_FEATURE_GUIDE.md

# 2. Add content
vim NEW_FEATURE_GUIDE.md

# 3. Link from README
echo "- [New Feature](./NEW_FEATURE_GUIDE.md)" >> README.md

# 4. Commit
git add NEW_FEATURE_GUIDE.md README.md
git commit -m "docs: add new feature guide"
```

---

## Related Files
- `backend/rag/build_index.py` - Indexes KB `.md` files
- `backend/rag/search_rag.py` - Searches indexed content
- `lib/services/vector-db-service.ts` - Frontend RAG service
- `lib/prompts/system-prompt.ts` - Instructs Nova to use RAG

---

**Last Updated:** October 22, 2025  
**Maintained By:** Development Team
