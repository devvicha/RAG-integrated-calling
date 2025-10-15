/**
 * Function Dispatcher for Live API Tool Calls
 * Handles routing and execution of function calls from Gemini Live API
 */

import { CustomerSupportService, ServiceResponse } from './customer-support-service-new';
import { VectorDocument, searchKnowledgeBase } from './vector-db-service';

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
    if (!this.isInitialized) {
      throw new Error('Dispatcher not initialized. Call initialize() first.');
    }

    let serviceResponse: ServiceResponse;

    switch (fc.name) {
      case 'searchKnowledge':
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
    
    if (!query || typeof query !== 'string') {
      throw new Error('Query parameter is required and must be a string');
    }

    const result = await searchKnowledgeBase(query);
    return {
      data: result,
      sources: [],
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
      'search_knowledge_base'
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
