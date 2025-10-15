/**
 * Function Dispatcher for Live API Tool Calls
 * Handles routing and execution of function calls from Gemini Live API
 */

import { CustomerSupportService, ServiceResponse } from './customer-support-service-new';
import { VectorDocument } from './vector-db-service';

export interface FunctionCallData {
  id: string;
  name: string;
  args: Record<string, any>;
}

/**
 * Main dispatcher that routes function calls to appropriate handlers
 */
export class FunctionDispatcher {
  
  static async dispatch(functionCall: FunctionCallData): Promise<FunctionResponse> {
    const { id, name, args } = functionCall;
    
    try {
      let result: any;
      
      switch (name) {
        case 'search_knowledge':
          result = await CustomerSupportService.searchKnowledge(args.query);
          break;
          
        case 'fetch_exchange_rate':
          result = await CustomerSupportService.fetchExchangeRate(
            args.from_currency, 
            args.to_currency
          );
          break;
          
        case 'schedule_branch_visit':
          result = await CustomerSupportService.scheduleBranchVisit(
            args.preferred_branch,
            args.preferred_date,
            args.preferred_time
          );
          break;
          
        case 'calculate_emi':
          result = await CustomerSupportService.calculateEMI(
            args.loan_amount,
            args.annual_rate_percent,
            args.tenure_months
          );
          break;
          
        case 'get_account_balance':
          result = await CustomerSupportService.getAccountBalance(args.account_number);
          break;
          
        case 'find_nearest_branch':
          result = await this.findNearestBranch(args.location);
          break;
          
        case 'get_loan_eligibility':
          result = await this.getLoanEligibility(args);
          break;
          
        default:
          result = { 
            error: `Unknown function: ${name}`,
            suggestion: 'Available functions: search_knowledge, fetch_exchange_rate, schedule_branch_visit, calculate_emi'
          };
      }

      return {
        id,
        name,
        response: {
          result,
          sources: result.sources || [],
          error: result.error
        }
      };
      
    } catch (error) {
      console.error(`Function dispatch error for ${name}:`, error);
      
      return {
        id,
        name,
        response: {
          result: null,
          error: `Failed to execute ${name}: ${error.message}`
        }
      };
    }
  }

  /**
   * Batch process multiple function calls
   */
  static async dispatchBatch(functionCalls: FunctionCallData[]): Promise<FunctionResponse[]> {
    const promises = functionCalls.map(fc => this.dispatch(fc));
    return Promise.all(promises);
  }

  // Additional helper functions
  private static async findNearestBranch(location: string) {
    // Mock implementation - replace with actual location service
    const branches = [
      { name: 'කොළඹ ප්‍රධාන ශාඛාව', distance: '2.1 km', address: 'Fort, Colombo 01' },
      { name: 'බම්බලපිටිය ශාඛාව', distance: '3.5 km', address: 'Bambalapitiya, Colombo 04' },
      { name: 'කන්දි ශාඛාව', distance: '5.2 km', address: 'Kandy Road, Kandy' }
    ];

    return {
      branches: branches.slice(0, 3),
      location,
      sources: [{
        title: 'ශාඛා සොයාගැනීම',
        snippet: `${location} අවට ශාඛා ${branches.length}ක් සොයා ගන්නා ලදී`,
        confidence: 0.95
      }]
    };
  }

  private static async getLoanEligibility(args: any) {
    const { monthly_income, existing_loans, employment_type } = args;
    
    // Simple eligibility calculation
    const maxLoanAmount = monthly_income * 60; // 5 years worth
    const eligibleAmount = maxLoanAmount - (existing_loans || 0);
    
    return {
      eligible: eligibleAmount > 0,
      maxAmount: Math.max(0, eligibleAmount),
      monthlyIncome: monthly_income,
      recommendation: eligibleAmount > 500000 ? 
        'ඔබ ඉහළ ණය මුදලකට සුදුසුකම් ලබයි' : 
        'කුඩා ණය මුදලක් සඳහා සුදුසුකම් ලබයි',
      sources: [{
        title: 'ණය සුදුසුකම් පරීක්ෂාව',
        snippet: `මාසික ආදායම: LKR ${monthly_income.toLocaleString()}`,
        confidence: 0.9
      }]
    };
  }
}
