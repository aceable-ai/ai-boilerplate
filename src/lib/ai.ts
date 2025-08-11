import { openai } from '@ai-sdk/openai';
import { generateText, generateObject } from 'ai';
import { z } from 'zod';

// AI SDK configuration
export const aiConfig = {
  model: openai('gpt-4o-2024-11-20'), // Latest GPT-4o model
  temperature: 0.8,
  maxTokens: 32000,
};

// Simplified generation function using AI SDK
export async function generateWithAI(prompt: string, systemMessage?: string) {
  const { text } = await generateText({
    model: aiConfig.model,
    temperature: aiConfig.temperature,
    messages: [
      ...(systemMessage ? [{ role: 'system' as const, content: systemMessage }] : []),
      { role: 'user' as const, content: prompt },
    ],
  });
  
  return text;
}

// Legacy compatibility - export for existing code
export { openai } from '@ai-sdk/openai';

// Legacy config for existing code
export const GENERATION_CONFIG = {
  model: 'gpt-4o-2024-11-20',
  temperature: 0.8,
  maxTokens: 32000,
};

// Modern 2025 approach: Type-safe object generation with Zod schemas
export async function generateTypedObject<T>(
  schema: z.ZodSchema<T>,
  prompt: string,
  systemMessage?: string
): Promise<T> {
  const { object } = await generateObject({
    model: aiConfig.model,
    temperature: aiConfig.temperature,
    schema: schema,
    prompt: systemMessage ? `${systemMessage}\n\n${prompt}` : prompt,
  });
  
  return object;
}

// Legacy makeOpenAIRequest function for compatibility
export async function makeOpenAIRequest(messages: Array<{ role: string; content: string }>, config = GENERATION_CONFIG) {
  const { text } = await generateText({
    model: openai(config.model),
    temperature: config.temperature,
    messages: messages.map(msg => ({
      role: msg.role as 'system' | 'user' | 'assistant',
      content: msg.content,
    })),
  });
  
  return text;
}