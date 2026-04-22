export interface TextGenerationRequest {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
}

export interface TextGenerationResponse {
  provider: string;
  model: string;
  text: string;
}

export interface LlmProvider {
  generateText(request: TextGenerationRequest): Promise<TextGenerationResponse>;
}
