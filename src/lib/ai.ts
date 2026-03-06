import { anthropic } from '@ai-sdk/anthropic';
import { generateText, generateObject } from 'ai';
import { z } from 'zod';

// Default model — switch provider by changing this line
export const defaultModel = anthropic('claude-sonnet-4-20250514');

// AI SDK configuration
export const aiConfig = {
  model: defaultModel,
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

// Type-safe object generation with Zod schemas
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

// Re-export providers for direct use
export { anthropic } from '@ai-sdk/anthropic';
export { openai } from '@ai-sdk/openai';
