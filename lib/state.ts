/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { FunctionResponseScheduling } from '@google/genai';

export * from '../llm/lib/state';

export interface FunctionCall {
  name: string; // Added name property to define the tool name
  description: string; // Added description property for tool explanation
  parameters: {
    type: string;
    properties: Record<string, { type: string; description: string }>;
    required: string[];
  }; // Added parameters property for tool input structure
  isEnabled: boolean; // Added isEnabled property to toggle tool availability
  scheduling: FunctionResponseScheduling | null; // Added scheduling property for response handling
  execute?: (args: Record<string, any>) => Record<string, any>; // Optional execute property for dynamic tool logic
}
