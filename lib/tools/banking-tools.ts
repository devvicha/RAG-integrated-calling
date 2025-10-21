/**
 * Enhanced Tool Definitions for Sampath Bank Customer Care
 * Function schemas that describe tasks for Gemini Live API
 */

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, any>;
    required: string[];
  };
  isEnabled: boolean;
}

export const bankingTools: ToolDefinition[] = [
  {
    name: 'searchKnowledge',
    description: 'Search the bank\'s knowledge base for information about accounts, services, policies, procedures, and general banking questions. Use this for any banking-related queries.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The search query to find relevant banking information'
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results to return (default: 5)',
          default: 5
        }
      },
      required: ['query']
    },
    isEnabled: true
  },
  
  {
    name: 'getExchangeRates',
    description: 'Get current foreign exchange rates for currency conversion. Provides buying and selling rates for major currencies against LKR.',
    parameters: {
      type: 'object',
      properties: {
        currency: {
          type: 'string',
          description: 'Specific currency code (USD, EUR, GBP, etc.). If not provided, returns rates for all major currencies'
        }
      },
      required: []
    },
    isEnabled: true
  },
  
  {
    name: 'findBranches',
    description: 'Find Sampath Bank branches and ATMs by location. Returns branch details including address, contact information, services, and operating hours.',
    parameters: {
      type: 'object',
      properties: {
        location: {
          type: 'string',
          description: 'City, area, or specific location to search for branches'
        },
        limit: {
          type: 'number',
          description: 'Maximum number of branches to return (default: 5)',
          default: 5
        }
      },
      required: ['location']
    },
    isEnabled: true
  },
  
  {
    name: 'scheduleCallback',
    description: 'Schedule a callback appointment for customer service. Use this when customers want to be contacted by a bank representative.',
    parameters: {
      type: 'object',
      properties: {
        phoneNumber: {
          type: 'string',
          description: 'Customer\'s phone number for the callback'
        },
        preferredTime: {
          type: 'string',
          description: 'Preferred date and time for the callback in ISO format or natural language (e.g., "2024-10-03T14:30:00" or "tomorrow at 2:30 PM")'
        },
        purpose: {
          type: 'string',
          description: 'Optional: Purpose or topic for the callback (e.g., "loan inquiry", "account issue")'
        }
      },
      required: ['phoneNumber', 'preferredTime']
    },
    isEnabled: true
  },
  
  {
    name: 'getAccountBalance',
    description: 'Get account balance and basic account information. Note: This requires customer authentication and should only be used when customer provides account details.',
    parameters: {
      type: 'object',
      properties: {
        accountNumber: {
          type: 'string',
          description: 'Customer\'s account number'
        },
        userId: {
          type: 'string',
          description: 'Optional: Authenticated user ID for security'
        }
      },
      required: ['accountNumber']
    },
    isEnabled: false // Disabled by default for security - enable only when authentication is implemented
  },

  {
    name: 'calculate_emi',
    description: 'ණය මාසික වාරිකය ගණනය කරයි. Calculate monthly EMI (Equated Monthly Installment) for loans.',
    parameters: {
      type: 'object',
      properties: {
        loan_amount: {
          type: 'number',
          description: 'ණය මුදල. Loan amount in LKR (minimum 50,000)'
        },
        annual_rate_percent: {
          type: 'number',
          description: 'වාර්ෂික පොලී අනුපාතය. Annual interest rate as a percentage'
        },
        tenure_months: {
          type: 'number',
          description: 'කාල සීමාව මාස වලින්. Loan tenure in months'
        }
      },
      required: ['loan_amount', 'annual_rate_percent', 'tenure_months']
    },
    isEnabled: true
  },

  {
    name: 'calculate_savings',
    description: 'ඉතිරිකිරීම් ගිණුම් වර්ධනය ගණනය කරයි. Calculate savings account growth with compound interest.',
    parameters: {
      type: 'object',
      properties: {
        initial_deposit: {
          type: 'number',
          description: 'ආරම්භක තැන්පතු මුදල. Initial deposit amount in LKR (minimum 1,000)'
        },
        monthly_deposit: {
          type: 'number',
          description: 'මාසික තැන්පතු මුදල. Monthly deposit amount in LKR'
        },
        annual_rate_percent: {
          type: 'number',
          description: 'වාර්ෂික පොලී අනුපාතය. Annual interest rate as a percentage'
        },
        tenure_months: {
          type: 'number',
          description: 'කාල සීමාව මාස වලින්. Savings period in months'
        }
      },
      required: ['initial_deposit', 'monthly_deposit', 'annual_rate_percent', 'tenure_months']
    },
    isEnabled: true
  }
];

// Export individual tools for easier access
export const searchKnowledgeTool = bankingTools.find(tool => tool.name === 'searchKnowledge')!;
export const getExchangeRatesTool = bankingTools.find(tool => tool.name === 'getExchangeRates')!;
export const findBranchesTool = bankingTools.find(tool => tool.name === 'findBranches')!;
export const scheduleCallbackTool = bankingTools.find(tool => tool.name === 'scheduleCallback')!;
export const getAccountBalanceTool = bankingTools.find(tool => tool.name === 'getAccountBalance')!;

/**
 * Get enabled tools only
 */
export function getEnabledTools(): ToolDefinition[] {
  return bankingTools.filter(tool => tool.isEnabled);
}

/**
 * Get tool by name
 */
export function getToolByName(name: string): ToolDefinition | undefined {
  return bankingTools.find(tool => tool.name === name);
}

/**
 * Enable/disable a tool
 */
export function setToolEnabled(toolName: string, enabled: boolean): boolean {
  const tool = getToolByName(toolName);
  if (tool) {
    tool.isEnabled = enabled;
    return true;
  }
  return false;
}
