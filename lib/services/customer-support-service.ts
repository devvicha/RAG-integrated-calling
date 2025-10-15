/**
 * Backend Service Integration Layer
 * This module handles actual API calls and business logic execution
 */

// Types for function responses
export interface FunctionResponse {
  id: string;
  name: string;
  response: {
    result: any;
    sources?: GroundingSource[];
    error?: string;
  };
}

export interface GroundingSource {
  title: string;
  url?: string;
  snippet: string;
  confidence?: number;
}

// Banking API Endpoints (replace with actual endpoints)
const API_BASE = process.env.VITE_BANK_API_BASE || 'https://api.sampathbank.com';
const CURRENCY_API = 'https://api.exchangerate-api.com/v4/latest/LKR';

/**
 * Customer Support Function Implementations
 */
export class CustomerSupportService {
  
  /**
   * Search knowledge base for banking information
   */
  static async searchKnowledge(query: string): Promise<any> {
    try {
      // Replace with actual knowledge base API call
      const response = await fetch(`${API_BASE}/knowledge/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, limit: 5 })
      });
      
      if (!response.ok) {
        // Fallback to static knowledge for demo
        return this.getFallbackKnowledge(query);
      }
      
      const data = await response.json();
      return {
        results: data.results,
        sources: data.results.map((item: any) => ({
          title: item.title,
          snippet: item.content.substring(0, 200),
          confidence: item.score
        }))
      };
    } catch (error) {
      console.error('Knowledge search error:', error);
      return this.getFallbackKnowledge(query);
    }
  }

  /**
   * Get current exchange rates
   */
  static async fetchExchangeRate(fromCurrency: string, toCurrency: string): Promise<any> {
    try {
      const response = await fetch(`${CURRENCY_API}`);
      const data = await response.json();
      
      const rate = data.rates[toCurrency.toUpperCase()];
      return {
        rate,
        from: fromCurrency,
        to: toCurrency,
        timestamp: data.date,
        sources: [{
          title: 'Exchange Rate API',
          snippet: `1 ${fromCurrency} = ${rate} ${toCurrency}`,
          confidence: 1.0
        }]
      };
    } catch (error) {
      console.error('Exchange rate fetch error:', error);
      return { error: 'Unable to fetch exchange rate' };
    }
  }

  /**
   * Schedule branch visit
   */
  static async scheduleBranchVisit(branchName: string, date: string, time: string): Promise<any> {
    try {
      // Replace with actual booking API
      const response = await fetch(`${API_BASE}/appointments/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branch: branchName,
          date,
          time,
          service: 'general_inquiry'
        })
      });

      if (!response.ok) {
        return this.getMockAppointment(branchName, date, time);
      }

      const data = await response.json();
      return {
        appointmentId: data.id,
        branch: data.branch,
        dateTime: `${date} ${time}`,
        status: 'confirmed',
        sources: [{
          title: 'සම්පත් බැංකු ශාඛා වෙන්කිරීම්',
          snippet: `ශාඛාව: ${branchName}, දිනය: ${date}, වේලාව: ${time}`,
          confidence: 1.0
        }]
      };
    } catch (error) {
      console.error('Appointment scheduling error:', error);
      return this.getMockAppointment(branchName, date, time);
    }
  }

  /**
   * Calculate EMI for loans
   */
  static async calculateEMI(loanAmount: number, annualRate: number, tenureMonths: number): Promise<any> {
    try {
      const monthlyRate = annualRate / (12 * 100);
      const emi = (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) / 
                  (Math.pow(1 + monthlyRate, tenureMonths) - 1);
      
      const totalAmount = emi * tenureMonths;
      const totalInterest = totalAmount - loanAmount;

      return {
        emi: Math.round(emi),
        totalAmount: Math.round(totalAmount),
        totalInterest: Math.round(totalInterest),
        loanAmount,
        interestRate: annualRate,
        tenure: tenureMonths,
        sources: [{
          title: 'EMI කැල්කියුලේටරය',
          snippet: `මාසික වාරිකය: LKR ${Math.round(emi).toLocaleString()}`,
          confidence: 1.0
        }]
      };
    } catch (error) {
      console.error('EMI calculation error:', error);
      return { error: 'EMI calculation failed' };
    }
  }

  /**
   * Get account balance (demo implementation)
   */
  static async getAccountBalance(accountNumber: string): Promise<any> {
    try {
      // Replace with actual account API
      return {
        balance: 125000,
        currency: 'LKR',
        accountNumber: accountNumber.replace(/\d(?=\d{4})/g, '*'),
        lastUpdated: new Date().toISOString(),
        sources: [{
          title: 'ගිණුම් ශේෂය',
          snippet: `ගිණුම් අංකය: ${accountNumber.replace(/\d(?=\d{4})/g, '*')}`,
          confidence: 1.0
        }]
      };
    } catch (error) {
      console.error('Balance fetch error:', error);
      return { error: 'Unable to fetch account balance' };
    }
  }

  // Fallback methods for demo purposes
  private static getFallbackKnowledge(query: string) {
    const fallbackResponses = {
      'account opening': {
        results: ['ගිණුමක් විවෘත කිරීමට ජාතික හැඳුනුම්පත, ආදායම් ප්‍රකාශනය සහ ලිපිනය සනාථ කරන ලේඛනයක් අවශ්‍ය වේ.'],
        sources: [{ title: 'ගිණුම් විවෘත කිරීම', snippet: 'අවශ්‍ය ලේඛන සහ ක්‍රියාවලිය', confidence: 0.9 }]
      },
      'default': {
        results: ['සම්පත් බැංකුව පිළිබඳ වැඩි විස්තර සඳහා අපගේ වෙබ් අඩවිය නරඹන්න.'],
        sources: [{ title: 'සාමාන්‍ය තොරතුරු', snippet: 'සම්පත් බැංකු සේවා', confidence: 0.8 }]
      }
    };
    
    return fallbackResponses[query.toLowerCase()] || fallbackResponses.default;
  }

  private static getMockAppointment(branch: string, date: string, time: string) {
    return {
      appointmentId: `APT${Date.now()}`,
      branch,
      dateTime: `${date} ${time}`,
      status: 'confirmed',
      sources: [{
        title: 'සම්පත් බැංකු ශාඛා වෙන්කිරීම්',
        snippet: `ශාখාව: ${branch}, දිනය: ${date}, වේලාව: ${time}`,
        confidence: 1.0
      }]
    };
  }
}
