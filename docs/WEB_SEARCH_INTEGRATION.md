# Web Search Integration for Wasana Bank RAG System

## Overview
Integrated web search as a fallback mechanism when the RAG knowledge base returns no results or insufficient information. The system now follows a two-tier search strategy:
1. **Primary**: RAG knowledge base (FAISS index)
2. **Fallback**: Web search (Google Custom Search API)

## Key Features

### 1. **Sinhala-to-English Query Translation**
- All queries (both for RAG and web search) are translated from Sinhala to English before being processed
- This ensures consistent search results from both sources
- Example translations:
  - "ණය ගැන කියන්න" → "loan information"
  - "පැවනුම් ගැන විස්තර" → "pawning details"
  - "ඉතිරිකිරීම් ගිණුම්" → "savings accounts"

### 2. **Web Search Tool**
- **Name**: `web_search_wasana_bank`
- **Purpose**: Search the web for Wasana Bank information when RAG fails
- **API**: Google Custom Search API (with fallback)
- **Scope**: Only searches for Wasana Bank-related content
- **Query Enhancement**: Automatically adds "Wasana Bank Sri Lanka" to queries

### 3. **Search Flow**
```
Customer Query (Sinhala)
    ↓
Translate to English
    ↓
Search RAG Knowledge Base
    ↓
Results Found? ─── Yes ──→ Return RAG Results (in Sinhala)
    │
    No
    ↓
Search Web (Google)
    ↓
Format & Return Web Results (in Sinhala with source citations)
```

### 4. **Response Formatting**
Web search results are formatted in Sinhala with:
- Result title and snippet
- Source URL
- Disclaimer about web-sourced information
- Recommendation to verify with official Wasana Bank sources

## Implementation Files

### 1. `/lib/services/web-search-service.ts` (NEW)
**Purpose**: Handles web search API calls and result formatting

**Key Functions**:
- `searchWasanaBankWeb(query: string)`: Main search function
- `formatWebSearchResults(response)`: Formats results in Sinhala
- `getFallbackResults()`: Provides default results when API unavailable

**Configuration**:
- Requires environment variables:
  - `NEXT_PUBLIC_GOOGLE_SEARCH_API_KEY`
  - `NEXT_PUBLIC_GOOGLE_SEARCH_ENGINE_ID`
- Falls back to hardcoded Wasana Bank links if API not configured

### 2. `/lib/services/function-dispatcher-new.ts` (UPDATED)
**Changes**:
- Added `handleWebSearch()` method
- Added `web_search_wasana_bank` case to function switch
- Imported web search service
- Added to available functions list

### 3. `/lib/tools/customer-support.ts` (UPDATED)
**Changes**:
- Added `web_search_wasana_bank` tool definition
- Updated `search_knowledge` tool description to indicate priority
- Both tools now require English queries

### 4. `/lib/prompts/system-prompt.ts` (UPDATED)
**Changes**:
- Added comprehensive tool usage instructions
- Specified Sinhala-to-English translation requirement
- Defined search priority (RAG first, then web)
- Added examples of query translation

## Configuration

### Environment Variables
Add to `.env.local`:
```bash
# Google Custom Search API (optional - has fallback)
NEXT_PUBLIC_GOOGLE_SEARCH_API_KEY=your_google_api_key_here
NEXT_PUBLIC_GOOGLE_SEARCH_ENGINE_ID=your_search_engine_id_here
```

### Getting Google Custom Search API Credentials:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create or select a project
3. Enable "Custom Search API"
4. Create API credentials (API Key)
5. Go to [Google Custom Search](https://cse.google.com/cse/)
6. Create a new search engine
7. Configure it to search `sampath.lk` domain (or all of web)
8. Get the Search Engine ID

## Usage Examples

### Example 1: Customer asks in Sinhala
**Customer**: "හෝම් ලෝන් එකේ පොලිය කීයද?"

**System Process**:
1. Translate: "home loan interest rate"
2. Search RAG knowledge base
3. If no results → Search web with "Wasana Bank Sri Lanka home loan interest rate"
4. Format and respond in Sinhala

### Example 2: RAG has results
**Customer**: "ණය ගැන කියන්න"

**System**:
1. Translate: "loan information"
2. Search RAG → **Found results** ✅
3. Return RAG results in Sinhala
4. No web search needed

### Example 3: RAG fails, web search succeeds
**Customer**: "නව ශාඛා කොහෙද?"

**System**:
1. Translate: "new branch locations"
2. Search RAG → No results ❌
3. Search web → **Found results** ✅
4. Return: "වෙබ් සෙවුමෙන් මේ තොරතුරු හමු වුණා: [results with URLs]"

## Fallback Mechanism

If Google API is not configured or fails, the system provides:
- Wasana Bank official website
- Customer care hotline
- Branch locator link
- Contact information

## Testing

### Test Web Search Integration:
```bash
# Start the app
npm run dev

# Test queries that should trigger web search:
# 1. "අලුත් සේවා මොනවද?"
# 2. "බැංකු වේලාවන් මොනවද?"
# 3. "වාර්ෂික වාර්තාව කොහෙන් බලන්නද?"
```

### Test RAG → Web Fallback:
1. Ask a question not in the knowledge base
2. Verify RAG returns "තොරතුරු හමු නොවුණා"
3. Verify system automatically triggers web search
4. Check response includes web sources and disclaimer

## Monitoring & Logs

Look for these log messages:
- `🔍 Searching RAG backend with query:` - RAG search initiated
- `✅ RAG search completed:` - RAG results returned
- `🌐 Web search query:` - Web search triggered
- `✅ Web search completed:` - Web results returned
- `❌ Web search failed:` - Error in web search

## Benefits

1. **Better Coverage**: Can answer questions not in knowledge base
2. **Up-to-date Info**: Web search provides latest information
3. **Graceful Degradation**: Falls back to hardcoded links if API fails
4. **Source Attribution**: Always cites web sources
5. **Consistent Language**: All searches use English internally, respond in Sinhala

## Future Enhancements

1. **Smart Query Expansion**: Enhance English translations with banking terms
2. **Result Caching**: Cache web search results to reduce API calls
3. **Custom Ranking**: Prioritize official Wasana Bank domains
4. **Multi-language Results**: Support English responses when customer uses English
5. **Search Analytics**: Track which queries trigger web search vs RAG

## Related Documentation
- `README.md` - General project documentation
- `PRONUNCIATION_GUIDE.md` - Sinhala pronunciation improvements
- `VOICE_CONFIGURATION_GUIDE.md` - Voice and TTS configuration
- `PAWNING_KB_STATUS.md` - Knowledge base coverage

---
**Last Updated**: January 2025
**Status**: ✅ Implemented and Ready for Testing
