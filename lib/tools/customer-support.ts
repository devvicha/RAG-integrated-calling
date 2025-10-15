/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { FunctionResponseScheduling } from '@google/genai';
import { FunctionCall } from '../state';

export const customerSupportTools: FunctionCall[] = [
  // Knowledge Search Tool
  {
    name: 'search_knowledge',
    description: 'සම්පත් බැංකුවේ සේවා, ගිණුම් විවෘත කිරීම, ණය, සහ වෙනත් බැංකු තොරතුරු සෙවීම.',
    parameters: {
      type: 'OBJECT',
      properties: {
        query: {
          type: 'STRING',
          description: 'සෙවුම් ප්‍රශ්නය හෝ මාතෘකාව',
        },
      },
      required: ['query'],
    },
    isEnabled: true,
    scheduling: FunctionResponseScheduling.NONE,
  },
  
  // Account Opening Tools
  {
    name: 'schedule_branch_visit',
    description: 'ගිණුමක් විවෘත කිරීමට හෝ වෙනත් සේවාවක් සඳහා ශාඛාවකට පැමිණීමට වේලාවක් වෙන් කරයි.',
    parameters: {
      type: 'OBJECT',
      properties: {
        preferred_branch: {
          type: 'STRING',
          description: 'පාරිභෝගිකයා පැමිණීමට කැමති ශාඛාව.',
        },
        preferred_date: {
          type: 'STRING',
          description: 'පැමිණීමට කැමති දිනය.',
        },
        preferred_time: {
          type: 'STRING',
          description: 'පැමිණීමට කැමති වේලාව.',
        },
      },
      required: ['preferred_branch', 'preferred_date', 'preferred_time'],
    },
    isEnabled: true,
    scheduling: FunctionResponseScheduling.INTERRUPT,
  },
  // Loan Tools
  {
    name: 'calculate_emi',
    description: 'ලබා දී ඇති ණය මුදල, වාර්ෂික පොලී අනුපාතය, සහ කාල සීමාව සඳහා මාසික වාරිකය (EMI) ගණනය කරයි.',
    parameters: {
      type: 'OBJECT',
      properties: {
        loan_amount: {
          type: 'NUMBER',
          description: 'ණය මුදල (LKR).',
        },
        annual_rate_percent: {
          type: 'NUMBER',
          description: 'වාර්ෂික පොලී අනුපාතය (%).',
        },
        tenure_months: {
          type: 'NUMBER',
          description: 'ණය කාල සීමාව (මාස වලින්).',
        },
      },
      required: ['loan_amount', 'annual_rate_percent', 'tenure_months'],
    },
    isEnabled: true,
    scheduling: FunctionResponseScheduling.INTERRUPT,
  },
  // Card Service Tools
  {
    name: 'block_card',
    description: 'නැතිවූ හෝ සොරකම් කරන ලද කාඩ්පතක් වහාම අක්‍රිය කර එය භාවිතයට නුසුදුසු බවට පත් කරයි. මෙය ආරක්ෂාව සඳහා පළමු පියවරයි.',
    parameters: {
      type: 'OBJECT',
      properties: {
        card_type: {
          type: 'STRING',
          description: "අක්‍රිය කළ යුතු කාඩ්පතේ වර්ගය, 'credit' හෝ 'debit'.",
        },
      },
      required: ['card_type'],
    },
    isEnabled: true,
    scheduling: FunctionResponseScheduling.INTERRUPT,
  },
  {
    name: 'arrange_card_replacement',
    description: 'අක්‍රිය කරන ලද කාඩ්පතක් වෙනුවට නව කාඩ්පතක් නිකුත් කිරීමට කටයුතු සම්පාදනය කරයි.',
    parameters: {
      type: 'OBJECT',
      properties: {
        delivery_address: {
          type: 'STRING',
          description: 'නව කාඩ්පත යැවිය යුතු ලිපිනය.',
        },
      },
      required: ['delivery_address'],
    },
    isEnabled: true,
    scheduling: FunctionResponseScheduling.INTERRUPT,
  },
  // General Service Tools
  {
    name: 'log_complaint',
    description: 'පාරිභෝගික පැමිණිල්ලක් පද්ධතියේ සටහන් කර ඒ සඳහා පැමිණිලි අංකයක් ජනනය කරයි.',
    parameters: {
      type: 'OBJECT',
      properties: {
        complaint_details: {
          type: 'STRING',
          description: 'පැමිණිල්ලේ සම්පූර්ණ විස්තරය.',
        },
        customer_contact: {
          type: 'STRING',
          description: 'පාරිභෝගිකයා සම්බන්ධ කර ගත හැකි දුරකථන අංකයක් හෝ විද්‍යුත් තැපැල් ලිපිනයක්.',
        },
      },
      required: ['complaint_details', 'customer_contact'],
    },
    isEnabled: true,
    scheduling: FunctionResponseScheduling.INTERRUPT,
  },
];