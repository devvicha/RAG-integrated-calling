/**
 * Function Dispatcher for Live API Tool Calls
 * Handles routing and execution of function calls from Gemini Live API
 */

import { CustomerSupportService, ServiceResponse } from './customer-support-service-new';
import { VectorDocument } from './vector-db-service';
import { queryRag } from './vector-db-service';
import { numberToSinhalaText, rupeesToSinhala, percentToSinhala } from '../utils/sinhalaNumberFormatter';
import { searchWasanaBankWeb, formatWebSearchResults } from './web-search-service';

export interface FunctionCall {
  id: string;
  name: string;
  args: Record<string, any>;
}

export interface FunctionResponse {
  id: string;
  name: string;
  response: {
    result: any;
    sources?: string[];
    grounding_chunks?: Array<{
      web?: { uri: string; title: string };
      content: string;
    }>;
    error?: string;
  };
}

export class FunctionDispatcher {
  private customerService: CustomerSupportService;
  private isInitialized: boolean = false;

  constructor(apiKey: string) {
    this.customerService = new CustomerSupportService(apiKey);
  }

  /**
   * Initialize the dispatcher with knowledge base documents
   */
  async initialize(documents: VectorDocument[]): Promise<void> {
    if (this.isInitialized) return;
    
    console.log('🔄 Initializing Function Dispatcher...');
    await this.customerService.initialize(documents);
    this.isInitialized = true;
    console.log('✅ Function Dispatcher initialized');
  }

  /**
   * Dispatch function calls to appropriate handlers
   */
  async dispatchFunctions(functionCalls: FunctionCall[]): Promise<FunctionResponse[]> {
    const responses: FunctionResponse[] = [];

    for (const fc of functionCalls) {
      try {
        const response = await this.executeFunctionCall(fc);
        responses.push(response);
        
        // Log the function execution
        console.log(`✅ Function executed: ${fc.name}`, {
          id: fc.id,
          args: fc.args,
          success: !response.response.error
        });
      } catch (error) {
        console.error(`❌ Function execution failed: ${fc.name}`, error);
        responses.push({
          id: fc.id,
          name: fc.name,
          response: {
            result: null,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
          }
        });
      }
    }

    return responses;
  }

  /**
   * Execute a single function call
   */
  private async executeFunctionCall(fc: FunctionCall): Promise<FunctionResponse> {
    // RAG-based functions don't need dispatcher initialization
    const ragFunctions = ['search_knowledge_base', 'calculate_emi', 'calculate_savings'];
    
    if (!this.isInitialized && !ragFunctions.includes(fc.name)) {
      throw new Error('Dispatcher not initialized. Call initialize() first.');
    }

    let serviceResponse: ServiceResponse;

    switch (fc.name) {
      case 'searchKnowledge':
      case 'search_knowledge':
        serviceResponse = await this.handleSearchKnowledge(fc.args);
        break;
        
      case 'getExchangeRates':
        serviceResponse = await this.handleGetExchangeRates(fc.args);
        break;
        
      case 'findBranches':
        serviceResponse = await this.handleFindBranches(fc.args);
        break;
        
      case 'scheduleCallback':
        serviceResponse = await this.handleScheduleCallback(fc.args);
        break;
        
      case 'getAccountBalance':
        serviceResponse = await this.handleGetAccountBalance(fc.args);
        break;
        
      case 'search_knowledge_base':
        serviceResponse = await this.handleSearchKnowledgeBase(fc.args);
        break;
        
      case 'web_search_sampath_bank':
        serviceResponse = await this.handleWebSearch(fc.args);
        break;
        
      case 'calculate_emi':
        serviceResponse = await this.handleCalculateEMI(fc.args);
        break;
        
      case 'calculate_savings':
        serviceResponse = await this.handleCalculateSavings(fc.args);
        break;
        
      default:
        throw new Error(`Unknown function: ${fc.name}`);
    }

    return {
      id: fc.id,
      name: fc.name,
      response: {
        result: serviceResponse.data,
        sources: serviceResponse.sources,
        grounding_chunks: serviceResponse.grounding_chunks,
        error: serviceResponse.error
      }
    };
  }

  /**
   * Handle knowledge base search
   */
  private async handleSearchKnowledge(args: any): Promise<ServiceResponse> {
    const { query, limit = 5 } = args;
    
    if (!query || typeof query !== 'string') {
      throw new Error('Query parameter is required and must be a string');
    }

    return await this.customerService.searchKnowledge(query, limit);
  }

  /**
   * Handle exchange rates request
   */
  private async handleGetExchangeRates(args: any): Promise<ServiceResponse> {
    const { currency } = args;
    return await this.customerService.getExchangeRates(currency);
  }

  /**
   * Handle branch location search
   */
  private async handleFindBranches(args: any): Promise<ServiceResponse> {
    const { location, limit = 5 } = args;
    
    if (!location || typeof location !== 'string') {
      throw new Error('Location parameter is required and must be a string');
    }

    return await this.customerService.findBranches(location, limit);
  }

  /**
   * Handle callback scheduling
   */
  private async handleScheduleCallback(args: any): Promise<ServiceResponse> {
    const { phoneNumber, preferredTime, purpose } = args;
    
    if (!phoneNumber || typeof phoneNumber !== 'string') {
      throw new Error('Phone number is required and must be a string');
    }
    
    if (!preferredTime || typeof preferredTime !== 'string') {
      throw new Error('Preferred time is required and must be a string');
    }

    return await this.customerService.scheduleCallback(phoneNumber, preferredTime, purpose);
  }

  /**
   * Handle account balance request
   */
  private async handleGetAccountBalance(args: any): Promise<ServiceResponse> {
    const { accountNumber, userId } = args;
    
    if (!accountNumber || typeof accountNumber !== 'string') {
      throw new Error('Account number is required and must be a string');
    }

    return await this.customerService.getAccountBalance(accountNumber, userId);
  }

  /**
   * Handle knowledge base search via vector DB
   */
  private async handleSearchKnowledgeBase(args: any): Promise<ServiceResponse> {
    const { query } = args;
    
    console.log('🔍 Searching RAG backend with query:', query);
    
    if (!query || typeof query !== 'string') {
      throw new Error('Query parameter is required and must be a string');
    }

    try {
      const ragData = await queryRag(query);
      console.log('✅ RAG search completed:', { 
        hitCount: ragData.hits?.length || 0,
        resultLength: ragData.result?.length || 0 
      });

      const hits = Array.isArray(ragData.hits) ? ragData.hits : [];
      const answer = ragData.result;

      const groundingChunks = hits.map(hit => ({
        content: hit.chunk_text,
        score: hit.score,
        web: hit.file_path
          ? { uri: `file://${hit.file_path}`, title: hit.file_path.split('/').pop() ?? hit.file_path }
          : undefined,
      }));

      return {
        data: answer,
        sources: hits.map(hit => hit.file_path ?? 'knowledge-base'),
        grounding_chunks: groundingChunks,
        error: null,
        success: true
      };
    } catch (error) {
      console.error('❌ RAG search failed:', error);
      throw error;
    }
  }

  /**
   * Handle web search for Wasana Bank information (fallback when RAG fails)
   */
  private async handleWebSearch(args: any): Promise<ServiceResponse> {
    const { query } = args;
    
    console.log('🌐 Web search query:', query);
    
    if (!query || typeof query !== 'string') {
      throw new Error('Query parameter is required and must be a string');
    }

    try {
      const webSearchResults = await searchWasanaBankWeb(query);
      console.log(`✅ Web search completed: ${webSearchResults.results.length} results`);

      // Format results for display
      const formattedResults = formatWebSearchResults(webSearchResults);

      // Create grounding chunks from web results
      const groundingChunks = webSearchResults.results.map(result => ({
        content: `${result.title}: ${result.snippet}`,
        web: {
          uri: result.url,
          title: result.title
        }
      }));

      return {
        data: formattedResults,
        sources: webSearchResults.results.map(r => r.url),
        grounding_chunks: groundingChunks,
        error: null,
        success: true
      };
    } catch (error) {
      console.error('❌ Web search failed:', error);
      return {
        data: 'කණගාටුයි, වෙබ් සෙවුම අසාර්ථක වුණා. කරුණාකර වාසනා බැංකුවේ නිල වෙබ් අඩවිය (www.wasana.lk) බලන්න හෝ 011-2-30-30-00 අමතන්න.',
        sources: [],
        grounding_chunks: [],
        error: error instanceof Error ? error.message : 'Web search failed',
        success: false
      };
    }
  }

  /**
   * Handle EMI calculation
   */
  private async handleCalculateEMI(args: any): Promise<ServiceResponse> {
    const { loan_amount, annual_rate_percent, tenure_months, show_formula } = args;

    if (
      loan_amount == null ||
      annual_rate_percent == null ||
      tenure_months == null
    ) {
      throw new Error(
        'loan_amount, annual_rate_percent, and tenure_months are required parameters'
      );
    }

    const computeEMI = (P: number, r: number, n: number): number => {
      const monthlyRate = r / 12 / 100;
      return (
        (P * monthlyRate * Math.pow(1 + monthlyRate, n)) /
        (Math.pow(1 + monthlyRate, n) - 1)
      );
    };

    if (loan_amount < 50000) {
      return {
        data: `ඔයාගේ ඉල්ලීම රුපියල් ${Math.round(loan_amount).toLocaleString()}ක්. කණගාටුයි, LKR 50,000 ට වඩා අඩු ණය මුදල් අපට සම්මත කළ නොහැක. කරුණාකර මුදල තහවුරු කර නැවතත් දන්වන්න.`,
        sources: [],
        grounding_chunks: [],
        error: null,
        success: true,
      };
    }

    const emi = computeEMI(loan_amount, annual_rate_percent, tenure_months);

    const emiStatement = `ඔයාගේ ඉල්ලීම රුපියල් ${Math.round(loan_amount).toLocaleString()}ක්. `;

    return {
      data: show_formula
        ? { emi, formula: 'EMI = [P x r x (1+r)^n] / [(1+r)^n-1]', summary: `${emiStatement}මාසික වාරිකය LKR ${Math.round(emi).toLocaleString()}ක්.` }
        : `${emiStatement}මාසික වාරිකය LKR ${Math.round(emi).toLocaleString()}ක් වටිනවා.`,
      sources: [],
      grounding_chunks: [],
      error: null,
      success: true
    };
  }

  /**
   * Handle Savings calculation with compound interest
   */
  private async handleCalculateSavings(args: any): Promise<ServiceResponse> {
    const { initial_deposit, monthly_deposit, annual_rate_percent, tenure_months } = args;

    if (
      initial_deposit == null ||
      monthly_deposit == null ||
      annual_rate_percent == null ||
      tenure_months == null
    ) {
      throw new Error(
        'initial_deposit, monthly_deposit, annual_rate_percent, and tenure_months are required parameters'
      );
    }

    // Validate minimum deposit
    if (initial_deposit < 1000) {
      return {
        data: `සමාවෙන්න, ඉතිරිකිරීම් ගිණුමක් විවෘත කිරීමට අවම වශයෙන් රුපියල් දහස අවශ්‍යයි.`,
        sources: [],
        grounding_chunks: [],
        error: null,
        success: true,
      };
    }

    // Calculate savings with compound interest
    const monthlyRate = annual_rate_percent / (12 * 100);
    
    // Future value of initial deposit
    const initialFV = initial_deposit * Math.pow(1 + monthlyRate, tenure_months);
    
    // Future value of monthly deposits (annuity)
    const monthlyFV = monthlyRate === 0 
      ? monthly_deposit * tenure_months 
      : monthly_deposit * ((Math.pow(1 + monthlyRate, tenure_months) - 1) / monthlyRate);
    
    const totalValue = initialFV + monthlyFV;
    const totalDeposited = initial_deposit + (monthly_deposit * tenure_months);
    const totalInterest = totalValue - totalDeposited;

    // Format amounts in Sinhala
    const initialDepositSinhala = rupeesToSinhala(initial_deposit);
    const monthlyDepositSinhala = rupeesToSinhala(monthly_deposit);
    const totalValueSinhala = rupeesToSinhala(Math.round(totalValue));
    const totalInterestSinhala = rupeesToSinhala(Math.round(totalInterest));
    const rateSinhala = percentToSinhala(annual_rate_percent);
    const tenureSinhala = numberToSinhalaText(tenure_months);

    return {
      data: `හරි, ඔයා ${initialDepositSinhala} ආරම්භක තැන්පතුවක් හා ${monthlyDepositSinhala} මාසික තැන්පතුවක් ${rateSinhala} වාර්ෂික පොලී අනුපාතයකින්, ${tenureSinhala} මාස කාලයක් තියාගත්තොත්, ඔයාගේ මුළු ඉතිරිකිරීම් ${totalValueSinhala} විතර වෙයි. එයින් පොලිය ${totalInterestSinhala}. මේ ගණන් දළ ඇස්තමේන්තු විදියට සලකන්න, හොඳද?`,
      sources: ['Savings Calculator'],
      grounding_chunks: [],
      error: null,
      success: true
    };
  }

  /**
   * Get available functions
   */
  getAvailableFunctions(): string[] {
    return [
      'searchKnowledge',
      'getExchangeRates',
      'findBranches',
      'scheduleCallback',
      'getAccountBalance',
      'search_knowledge_base',
      'web_search_sampath_bank',
      'calculate_emi',
      'calculate_savings'
    ];
  }

  /**
   * Get dispatcher statistics
   */
  getStats(): any {
    return {
      initialized: this.isInitialized,
      available_functions: this.getAvailableFunctions(),
      service_stats: this.customerService.getServiceStats()
    };
  }
}
