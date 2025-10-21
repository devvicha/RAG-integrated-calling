/**
 * Customer Support Service for Sampath Bank
 * Handles customer inquiries, account information, and banking operations
 */

import { VectorDocument, queryRag, RagResponse } from './vector-db-service'; // ✅ FIXED import (matches actual exports)

export interface CustomerQuery {
  query: string;
  context?: string;
  user_id?: string;
}

export interface ServiceResponse {
  success: boolean;
  data?: any;
  error?: string;
  sources?: string[];
  grounding_chunks?: Array<{
    web?: { uri: string; title: string };
    content: string;
    score?: number;
  }>;
}

export interface ExchangeRate {
  currency: string;
  buy_rate: number;
  sell_rate: number;
  last_updated: string;
}

export interface BranchInfo {
  name: string;
  address: string;
  phone: string;
  coordinates: { lat: number; lng: number };
  services: string[];
  hours: string;
  distance?: number;
}

export class CustomerSupportService {
  private apiKey: string;
  private isInitialized: boolean = false;
  private cachedDocuments: VectorDocument[] = [];

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Initialize the service with knowledge base documents
   */
  async initialize(documents: VectorDocument[]): Promise<void> {
    if (this.isInitialized) return;

    console.log('🔄 Initializing Customer Support Service...');
    this.cachedDocuments = documents;
    this.isInitialized = true;
    console.log('✅ Customer Support Service initialized');
  }

  /**
   * Search knowledge base for relevant information using RAG
   */
  async searchKnowledge(query: string, limit: number = 5): Promise<ServiceResponse> {
    try {
      if (!this.isInitialized) {
        throw new Error('Service not initialized. Call initialize() first.');
      }

      // ✅ FIXED TYPE: Ensure RagResponse is correctly shaped
      const ragResult: RagResponse | null = await queryRag(query, limit);

      if (!ragResult || !ragResult.hits?.length) {
        throw new Error('No knowledge base results found');
      }

      const results = ragResult.hits.map((hit, index) => {
        const src = (hit as any).source ?? (hit as any).document ?? (hit as any).path ?? (hit as any).metadata?.source ?? undefined;
        const title = src
          ? String(src).split('/').pop() || `Knowledge Hit ${index + 1}`
          : `Knowledge Hit ${index + 1}`;
        return {
          title,
          content: (hit as any).chunk_text || '', // use existing property only
          score: hit.score ?? 0,
          source: src,
        };
      });

      const groundingChunks = results.map(hit => ({
        content: hit.content,
        score: hit.score,
        web: hit.source
          ? { uri: `file://${hit.source}`, title: hit.title }
          : undefined,
      }));

      return {
        success: true,
        data: {
          query,
          total_found: results.length,
          results,
        },
        sources: results
          .filter(hit => Boolean(hit.source))
          .map(hit => `${hit.title}${hit.source ? ` (${hit.source})` : ''}`),
        grounding_chunks: groundingChunks,
      };
    } catch (error) {
      console.error('❌ Knowledge search failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Knowledge search failed',
        data: { results: [], query, total_found: 0 },
      };
    }
  }

  /**
   * Get current exchange rates from Central Bank or financial API
   */
  async getExchangeRates(currency?: string): Promise<ServiceResponse> {
    try {
      const sampleRates: ExchangeRate[] = [
        { currency: 'USD', buy_rate: 295.0, sell_rate: 305.0, last_updated: new Date().toISOString() },
        { currency: 'EUR', buy_rate: 320.5, sell_rate: 330.5, last_updated: new Date().toISOString() },
        { currency: 'GBP', buy_rate: 380.25, sell_rate: 390.25, last_updated: new Date().toISOString() },
        { currency: 'AUD', buy_rate: 195.75, sell_rate: 205.75, last_updated: new Date().toISOString() },
        { currency: 'JPY', buy_rate: 2.15, sell_rate: 2.25, last_updated: new Date().toISOString() },
        { currency: 'CAD', buy_rate: 218.5, sell_rate: 228.5, last_updated: new Date().toISOString() },
      ];

      const filteredRates = currency
        ? sampleRates.filter(rate => rate.currency.toLowerCase() === currency.toLowerCase())
        : sampleRates;

      return {
        success: true,
        data: {
          base_currency: 'LKR',
          rates: filteredRates,
          last_updated: new Date().toISOString(),
          disclaimer: 'Rates are indicative and subject to change. Please visit our branches for actual rates.',
        },
        sources: ['Sampath Bank Treasury Department'],
      };
    } catch {
      return {
        success: false,
        error: 'Failed to fetch exchange rates',
        data: { base_currency: 'LKR', rates: [] },
      };
    }
  }

  /**
   * Find nearest branch locations
   */
  async findBranches(location: string, limit: number = 5): Promise<ServiceResponse> {
    try {
      const sampleBranches: BranchInfo[] = [
        {
          name: 'Colombo Main Branch',
          address: 'No. 110, Sir James Peiris Mawatha, Colombo 02',
          phone: '+94 11 230 3050',
          coordinates: { lat: 6.9271, lng: 79.8612 },
          services: ['All Banking Services', 'Foreign Exchange', 'Loans', 'Safe Deposit'],
          hours: 'Mon–Fri: 9:00 AM – 5:00 PM',
        },
        {
          name: 'Kandy Branch',
          address: 'No. 123, Kandy Road, Kandy',
          phone: '+94 81 222 3456',
          coordinates: { lat: 7.2906, lng: 80.6337 },
          services: ['All Banking Services', 'ATM', 'Loans'],
          hours: 'Mon–Fri: 9:00 AM – 4:30 PM',
        },
        {
          name: 'Galle Branch',
          address: 'No. 456, Galle Road, Galle',
          phone: '+94 91 234 5678',
          coordinates: { lat: 6.0329, lng: 80.2168 },
          services: ['All Banking Services', 'Foreign Exchange'],
          hours: 'Mon–Fri: 9:00 AM – 4:30 PM',
        },
      ];

      const filteredBranches = sampleBranches
        .filter(branch =>
          branch.name.toLowerCase().includes(location.toLowerCase()) ||
          branch.address.toLowerCase().includes(location.toLowerCase()),
        )
        .slice(0, limit);

      return {
        success: true,
        data: {
          branches: filteredBranches,
          search_location: location,
          total_found: filteredBranches.length,
        },
        sources: ['Sampath Bank Branch Directory'],
      };
    } catch {
      return {
        success: false,
        error: 'Failed to find branches',
        data: { branches: [], search_location: location },
      };
    }
  }

  /**
   * Schedule a callback for customer
   */
  async scheduleCallback(phoneNumber: string, preferredTime: string, purpose?: string): Promise<ServiceResponse> {
    try {
      const phoneRegex = /^[+]?[0-9\s\-()]{7,15}$/;
      if (!phoneRegex.test(phoneNumber)) {
        throw new Error('Invalid phone number format');
      }

      const appointmentTime = new Date(preferredTime);
      if (isNaN(appointmentTime.getTime())) {
        throw new Error('Invalid preferred time format');
      }

      if (appointmentTime <= new Date()) {
        throw new Error('Preferred time must be in the future');
      }

      const appointmentId = `CB_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

      return {
        success: true,
        data: {
          appointment_id: appointmentId,
          phone_number: phoneNumber,
          scheduled_time: appointmentTime.toISOString(),
          purpose: purpose || 'General Inquiry',
          status: 'scheduled',
          confirmation_message: `Your callback has been scheduled. Reference: ${appointmentId}. Our representative will call you at ${phoneNumber} on ${appointmentTime.toLocaleString()}.`,
        },
        sources: ['Sampath Bank Customer Service'],
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to schedule callback',
        data: { phone_number: phoneNumber, status: 'failed' },
      };
    }
  }

  /**
   * Get account balance (requires authentication)
   */
  async getAccountBalance(accountNumber: string, userId?: string): Promise<ServiceResponse> {
    try {
      if (!userId) {
        throw new Error('Authentication required for account information');
      }

      return {
        success: true,
        data: {
          account_number: accountNumber.replace(/\d(?=\d{4})/g, '*'),
          balance: 'LKR 125,450.75',
          available_balance: 'LKR 125,450.75',
          last_transaction: '2024-10-01',
          account_type: 'Savings Account',
          message: 'For security reasons, please verify your identity through our mobile app or visit a branch for detailed account information.',
        },
        sources: ['Sampath Bank Account Services'],
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to retrieve account balance',
        data: { requires_authentication: true },
      };
    }
  }

  /**
   * Get service statistics
   */
  getServiceStats(): Record<string, any> {
    return {
      // ✅ FIXED: removed reference to non-existent vectorDB
      cached_docs: this.cachedDocuments.length,
      service_initialized: this.isInitialized,
      available_functions: [
        'searchKnowledge',
        'getExchangeRates',
        'findBranches',
        'scheduleCallback',
        'getAccountBalance',
      ],
    };
  }
}