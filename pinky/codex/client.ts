/**
 * OpenAI Client Wrapper for Codex Integration
 *
 * Provides a thin wrapper around the OpenAI API with:
 * - Environment-based configuration
 * - Rate limiting
 * - Error handling
 * - Model selection
 */

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | ContentPart[];
}

interface ContentPart {
  type: 'text' | 'image_url';
  text?: string;
  image_url?: {
    url: string;
    detail?: 'auto' | 'low' | 'high';
  };
}

interface ChatCompletionOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

interface ChatCompletionResponse {
  content: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
}

// Rate limiter state
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL_MS = 200; // 5 requests per second max

/**
 * Simple rate limiter to prevent hitting API limits
 */
async function rateLimit(): Promise<void> {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < MIN_REQUEST_INTERVAL_MS) {
    await new Promise((resolve) =>
      setTimeout(resolve, MIN_REQUEST_INTERVAL_MS - elapsed)
    );
  }
  lastRequestTime = Date.now();
}

/**
 * Get OpenAI API key from environment
 */
export function getApiKey(): string {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      'OPENAI_API_KEY environment variable is not set. ' +
        'Add it to .env.local: OPENAI_API_KEY=sk-your-key-here'
    );
  }
  return apiKey;
}

/**
 * Available models for Codex operations
 */
export const MODELS = {
  // Fast, cheap model for quick analysis
  GPT4_TURBO: 'gpt-4-turbo',
  // Best model for complex analysis
  GPT4O: 'gpt-4o',
  // Cheapest option for simple tasks
  GPT4O_MINI: 'gpt-4o-mini',
} as const;

/**
 * Default model for Codex operations (cost-optimized)
 */
export const DEFAULT_MODEL = MODELS.GPT4O_MINI;

/**
 * Create a chat completion request to OpenAI
 */
export async function createChatCompletion(
  messages: ChatMessage[],
  options: ChatCompletionOptions = {}
): Promise<ChatCompletionResponse> {
  const apiKey = getApiKey();
  const model = options.model || DEFAULT_MODEL;

  // Apply rate limiting
  await rateLimit();

  // Build request body
  const requestBody = {
    model,
    messages: options.systemPrompt
      ? [{ role: 'system' as const, content: options.systemPrompt }, ...messages]
      : messages,
    temperature: options.temperature ?? 0.3,
    max_tokens: options.maxTokens ?? 4096,
  };

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new CodexError(
        `OpenAI API error: ${response.status} ${response.statusText}`,
        response.status,
        errorData
      );
    }

    const data = await response.json();

    return {
      content: data.choices[0]?.message?.content || '',
      usage: {
        promptTokens: data.usage?.prompt_tokens || 0,
        completionTokens: data.usage?.completion_tokens || 0,
        totalTokens: data.usage?.total_tokens || 0,
      },
      model: data.model,
    };
  } catch (error) {
    if (error instanceof CodexError) {
      throw error;
    }
    throw new CodexError(
      `Failed to call OpenAI API: ${error instanceof Error ? error.message : 'Unknown error'}`,
      0,
      error
    );
  }
}

/**
 * Create a vision-enabled chat completion (for screenshot analysis)
 */
export async function createVisionCompletion(
  textPrompt: string,
  imageBase64: string,
  options: ChatCompletionOptions = {}
): Promise<ChatCompletionResponse> {
  const messages: ChatMessage[] = [
    {
      role: 'user',
      content: [
        { type: 'text', text: textPrompt },
        {
          type: 'image_url',
          image_url: {
            url: `data:image/png;base64,${imageBase64}`,
            detail: 'high',
          },
        },
      ],
    },
  ];

  // Force GPT-4o for vision tasks (mini doesn't support vision well)
  return createChatCompletion(messages, {
    ...options,
    model: options.model || MODELS.GPT4O,
  });
}

/**
 * Custom error class for Codex operations
 */
export class CodexError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public details?: unknown
  ) {
    super(message);
    this.name = 'CodexError';
  }
}

/**
 * Check if the API key is configured
 */
export function isConfigured(): boolean {
  try {
    getApiKey();
    return true;
  } catch {
    return false;
  }
}
