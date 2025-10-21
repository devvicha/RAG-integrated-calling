#!/usr/bin/env python3
"""
Generate metadata.json for Knowledge Base files
Scans all .md and .json files under Knowledge_base/, excluding the savings/ subfolder
"""

import os
import json
from pathlib import Path
from datetime import date

# Configuration
KB_PATH = Path("Knowledge_base")
EXCLUDED_FOLDERS = {"savings"}  # Add more folders to exclude if needed
EXCLUDED_FILES = {"metadata.json", "embeddings_index.json", "faiss_index.bin"}
TODAY = date.today().strftime("%Y-%m-%d")

def should_exclude(file_path: Path) -> bool:
    """Check if a file should be excluded from metadata generation"""
    # Check if any parent folder is in excluded list
    for part in file_path.parts:
        if part in EXCLUDED_FOLDERS:
            return True
    
    # Check if filename is in excluded list
    if file_path.name in EXCLUDED_FILES:
        return True
    
    # Exclude temporary, cache, and backup files
    if file_path.name.startswith('.') or file_path.name.endswith(('~', '.bak', '.tmp')):
        return True
    
    return False

def infer_category(file_path: Path) -> str:
    """Infer category from the immediate parent folder"""
    # Get relative path from Knowledge_base
    try:
        rel_path = file_path.relative_to(KB_PATH)
        parts = rel_path.parts
        
        # If file is directly in Knowledge_base, use "general" as category
        if len(parts) == 1:
            return "general"
        
        # Otherwise, use the immediate parent folder name
        return parts[-2]
    except ValueError:
        return "general"

def generate_metadata() -> list[dict]:
    """Scan Knowledge_base and generate metadata for all files"""
    metadata = []
    
    # Find all .md and .json files
    for file_path in KB_PATH.rglob("*"):
        # Skip directories
        if not file_path.is_file():
            continue
        
        # Only process .md and .json files
        if file_path.suffix not in {".md", ".json"}:
            continue
        
        # Skip excluded files and folders
        if should_exclude(file_path):
            continue
        
        # Infer category from folder structure
        category = infer_category(file_path)
        
        # Create metadata entry
        entry = {
            "file_path": str(file_path),
            "category": category,
            "language": "en",
            "product_area": category,
            "requires_auth": False,
            "last_reviewed": TODAY
        }
        
        metadata.append(entry)
    
    return metadata

def main():
    """Main execution function"""
    if not KB_PATH.exists():
        print(f"❌ Error: Knowledge_base folder not found at {KB_PATH.resolve()}")
        return
    
    print(f"🔍 Scanning {KB_PATH.resolve()} for .md and .json files...")
    print(f"📁 Excluding folders: {', '.join(EXCLUDED_FOLDERS)}")
    
    metadata = generate_metadata()
    
    # Sort by file_path for consistency
    metadata.sort(key=lambda x: x["file_path"])
    
    # Save to metadata.json
    output_path = KB_PATH / "metadata.json"
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, ensure_ascii=False, indent=2)
    
    print(f"\n✅ Metadata generated for {len(metadata)} files (excluding savings)")
    print(f"📄 Saved to: {output_path.resolve()}")
    
    # Print category breakdown
    category_counts = {}
    for entry in metadata:
        cat = entry["category"]
        category_counts[cat] = category_counts.get(cat, 0) + 1
    
    print(f"\n📊 Category breakdown:")
    for cat, count in sorted(category_counts.items()):
        print(f"   {cat}: {count} files")

if __name__ == "__main__":
    main()
