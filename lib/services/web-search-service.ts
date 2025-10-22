/**
 * Web Search Service for Sampath Bank Information
 * Fallback search when RAG knowledge base returns no results
 */

export interface WebSearchResult {
  title: string;
  snippet: string;
  url: string;
  source: string;
}

export interface WebSearchResponse {
  results: WebSearchResult[];
  query: string;
  totalResults: number;
  searchTime: number;
}

/**
 * Search the web for Sampath Bank information using Google Custom Search API
 * Only searches for Sampath Bank-related content
 */
export async function searchSampathBankWeb(query: string): Promise<WebSearchResponse> {
  const startTime = Date.now();
  
  // Add "Sampath Bank" to the query to ensure relevant results
  const searchQuery = `Sampath Bank Sri Lanka ${query}`;
  
  console.log('🌐 Web search query:', searchQuery);
  
  try {
    // Google Custom Search API configuration
    const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_SEARCH_API_KEY;
    const SEARCH_ENGINE_ID = process.env.NEXT_PUBLIC_GOOGLE_SEARCH_ENGINE_ID;
    
    if (!GOOGLE_API_KEY || !SEARCH_ENGINE_ID) {
      console.warn('⚠️ Google Search API not configured, using fallback');
      return getFallbackResults(query, startTime);
    }
    
    // Call Google Custom Search API
    const url = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${SEARCH_ENGINE_ID}&q=${encodeURIComponent(searchQuery)}&num=5`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Google Search API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Parse results
    const results: WebSearchResult[] = [];
    
    if (data.items && Array.isArray(data.items)) {
      for (const item of data.items) {
        results.push({
          title: item.title || 'No title',
          snippet: item.snippet || 'No description available',
          url: item.link || '#',
          source: new URL(item.link).hostname
        });
      }
    }
    
    const searchTime = Date.now() - startTime;
    
    console.log(`✅ Web search completed: ${results.length} results in ${searchTime}ms`);
    
    return {
      results,
      query: searchQuery,
      totalResults: parseInt(data.searchInformation?.totalResults || '0'),
      searchTime
    };
    
  } catch (error) {
    console.error('❌ Web search error:', error);
    return getFallbackResults(query, startTime);
  }
}

/**
 * Fallback results when API is not available or fails
 */
function getFallbackResults(query: string, startTime: number): WebSearchResponse {
  const results: WebSearchResult[] = [
    {
      title: 'Sampath Bank Official Website',
      snippet: 'Visit the official Sampath Bank website for comprehensive information about our banking services, products, and branch locations.',
      url: 'https://www.sampath.lk',
      source: 'sampath.lk'
    },
    {
      title: 'Sampath Bank Contact Information',
      snippet: 'Contact Sampath Bank customer care: 24/7 Hotline: +94 11 2 30 30 00, Email: customercare@sampath.lk',
      url: 'https://www.sampath.lk/en/contact-us',
      source: 'sampath.lk'
    },
    {
      title: 'Sampath Bank Branch Locator',
      snippet: 'Find your nearest Sampath Bank branch or ATM location across Sri Lanka.',
      url: 'https://www.sampath.lk/en/branch-locator',
      source: 'sampath.lk'
    }
  ];
  
  return {
    results,
    query,
    totalResults: results.length,
    searchTime: Date.now() - startTime
  };
}

/**
 * Format web search results for Gemini response
 */
export function formatWebSearchResults(response: WebSearchResponse): string {
  if (response.results.length === 0) {
    return 'කණගාටුයි, වෙබ් සෙවුමෙන් තොරතුරු හමු නොවුණා. කරුණාකර සම්පත් බැංකුවේ නිල වෙබ් අඩවිය (www.sampath.lk) බලන්න හෝ 011-2-30-30-00 අමතන්න.';
  }
  
  let formatted = 'වෙබ් සෙවුමෙන් මේ තොරතුරු හමු වුණා:\n\n';
  
  response.results.forEach((result, index) => {
    formatted += `${index + 1}. ${result.title}\n`;
    formatted += `   ${result.snippet}\n`;
    formatted += `   මූලාශ්‍රය: ${result.url}\n\n`;
  });
  
  formatted += '\nමෙම තොරතුරු වෙබයෙන් ලබාගත් ඒවා වන අතර, නිවැරදි තොරතුරු සඳහා සම්පත් බැංකුවේ නිල වෙබ් අඩවිය බලන්න.';
  
  return formatted;
}
