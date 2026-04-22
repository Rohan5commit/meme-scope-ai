import { NvidiaProvider } from '@/lib/llm/nvidia';
import type { LlmProvider } from '@/lib/llm/types';

export function getLlmProvider(): LlmProvider {
  const provider = (process.env.LLM_PROVIDER || 'nvidia').toLowerCase();

  if (provider === 'nvidia') {
    return new NvidiaProvider();
  }

  throw new Error(`Unsupported LLM provider: ${provider}`);
}
