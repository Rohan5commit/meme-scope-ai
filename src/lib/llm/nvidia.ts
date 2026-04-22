    import type { LlmProvider, TextGenerationRequest, TextGenerationResponse } from '@/lib/llm/types';

    const DEFAULT_BASE_URL = 'https://integrate.api.nvidia.com/v1';
    const DEFAULT_MODEL = 'openai/gpt-oss-20b';
    const DEFAULT_TIMEOUT_MS = 12_000;

    interface NvidiaChoice {
      message?: {
        content?: string | Array<{ type?: string; text?: string }>;
      };
    }

    interface NvidiaResponse {
      model?: string;
      choices?: NvidiaChoice[];
      error?: {
        message?: string;
      };
    }

    async function fetchWithAbort(url: string, init: RequestInit, timeoutMs: number, label: string) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      try {
        return await fetch(url, {
          ...init,
          signal: controller.signal,
        });
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          throw new Error(`${label} timed out after ${timeoutMs}ms`);
        }

        throw error;
      } finally {
        clearTimeout(timeoutId);
      }
    }

    export class NvidiaProvider implements LlmProvider {
      async generateText(request: TextGenerationRequest): Promise<TextGenerationResponse> {
        const apiKey = process.env.NIM_API_KEY;
        if (!apiKey) {
          throw new Error('NIM_API_KEY is missing. Add it in your environment before running live AI analysis.');
        }

        const baseUrl = (process.env.NIM_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, '');
        const model = process.env.NIM_MODEL || DEFAULT_MODEL;
        const timeoutMs = request.timeoutMs ?? DEFAULT_TIMEOUT_MS;

        const response = await fetchWithAbort(
          `${baseUrl}/chat/completions`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model,
              messages: [
                {
                  role: 'system',
                  content: request.systemPrompt,
                },
                {
                  role: 'user',
                  content: request.userPrompt,
                },
              ],
              temperature: request.temperature ?? 0.25,
              max_tokens: request.maxTokens ?? 1700,
            }),
          },
          timeoutMs,
          'NVIDIA NIM',
        );

        const payload = (await response.json()) as NvidiaResponse;
        if (!response.ok) {
          throw new Error(payload.error?.message || `NVIDIA NIM request failed with ${response.status}`);
        }

        const content = payload.choices?.[0]?.message?.content;
        const text = Array.isArray(content)
          ? content.map((part) => part.text ?? '').join('\n').trim()
          : (content ?? '').trim();

        if (!text) {
          throw new Error('NVIDIA NIM returned an empty completion.');
        }

        return {
          provider: 'nvidia',
          model: payload.model || model,
          text,
        };
      }
    }
