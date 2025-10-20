/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { FunctionResponseScheduling } from '@google/genai';
import { FunctionCall } from '../state';

export const customerSupportTools: FunctionCall[] = [
  {
    name: 'search_knowledge_base',
    description: 'සම්පත් බැංකු තොරතුරු සෙවීම.',
    parameters: {
      type: 'OBJECT',
      properties: {
        query: {
          type: 'STRING',
          description: 'සෙවුම් ප්‍රශ්නය.',
        },
      },
      required: ['query'],
    },
    isEnabled: true,
    scheduling: FunctionResponseScheduling.INTERRUPT,
  },
  {
    name: 'schedule_branch_visit',
    description: 'ශාඛාවකට පැමිණීමට වේලාවක් වෙන් කරයි.',
    parameters: {
      type: 'OBJECT',
      properties: {
        preferred_branch: {
          type: 'STRING',
          description: 'ශාඛාව.',
        },
        preferred_date: {
          type: 'STRING',
          description: 'දිනය.',
        },
        preferred_time: {
          type: 'STRING',
          description: 'වේලාව.',
        },
      },
      required: ['preferred_branch', 'preferred_date', 'preferred_time'],
    },
    isEnabled: true,
    scheduling: FunctionResponseScheduling.INTERRUPT,
  },
  {
    name: 'calculate_emi',
    description: 'ණය මාසික වාරිකය ගණනය කරයි.',
    parameters: {
      type: 'OBJECT',
      properties: {
        loan_amount: {
          type: 'NUMBER',
          description: 'ණය මුදල.',
        },
        annual_rate_percent: {
          type: 'NUMBER',
          description: 'වාර්ෂික පොලී අනුපාතය.',
        },
        tenure_months: {
          type: 'NUMBER',
          description: 'කාල සීමාව.',
        },
      },
      required: ['loan_amount', 'annual_rate_percent', 'tenure_months'],
    },
    isEnabled: true,
    scheduling: FunctionResponseScheduling.INTERRUPT,
  },
  {
    name: 'block_card',
    description: 'කාඩ්පතක් අක්‍රිය කරයි.',
    parameters: {
      type: 'OBJECT',
      properties: {
        card_type: {
          type: 'STRING',
          description: "කාඩ්පතේ වර්ගය ('credit' හෝ 'debit').",
        },
      },
      required: ['card_type'],
    },
    isEnabled: true,
    scheduling: FunctionResponseScheduling.INTERRUPT,
  },
  {
    name: 'arrange_card_replacement',
    description: 'නව කාඩ්පතක් නිකුත් කරයි.',
    parameters: {
      type: 'OBJECT',
      properties: {
        delivery_address: {
          type: 'STRING',
          description: 'ලිපිනය.',
        },
      },
      required: ['delivery_address'],
    },
    isEnabled: true,
    scheduling: FunctionResponseScheduling.INTERRUPT,
  },
  {
    name: 'log_complaint',
    description: 'පැමිණිල්ලක් සටහන් කරයි.',
    parameters: {
      type: 'OBJECT',
      properties: {
        complaint_details: {
          type: 'STRING',
          description: 'පැමිණිල්ලේ විස්තරය.',
        },
        customer_contact: {
          type: 'STRING',
          description: 'සම්බන්ධ කරගත හැකි විස්තර.',
        },
      },
      required: ['complaint_details', 'customer_contact'],
    },
    isEnabled: true,
    scheduling: FunctionResponseScheduling.INTERRUPT,
  },
];
