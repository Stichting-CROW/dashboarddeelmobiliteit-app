import { Logger } from './logger';
import { env } from 'node:process';
import { OpenAI } from 'openai';

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

export class LlmService {
  private logger: Logger;
  private apiKey: string;
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 1000; // 1 second
  private openai: OpenAI;
  private modelName: string;
  private conversation: ConversationMessage[] = [];

  constructor(logger: Logger) {
    this.logger = logger;
    this.apiKey = env.OPENAI_API_KEY || '';
    const useExternal = env.USEEXTERNAL === 'true';
    const externalUrl = env.EXTERNALURL || '';
    const externalKey = env.EXTERNALKEY || '';
    
    if (useExternal) {
      console.log('Using external LLM API');
      this.modelName = env.EXTERNAL_MODEL_NAME || 'ollama/gemma3:12b';

      if (!externalUrl || !externalKey) {
        throw new Error('EXTERNALURL and EXTERNALKEY environment variables are required when USEEXTERNAL is true');
      }
      this.apiKey = externalKey;
      this.openai = new OpenAI({
        baseURL: externalUrl,
        apiKey: this.apiKey,
        fetch: (async (input: RequestInfo, init?: RequestInit): Promise<Response> => {
          this.logger.debug(`Making request to external endpoint: ${input}`);
          const response = await fetch(input, init);
          this.logger.debug(`Received response from external endpoint: ${response.status}`);
          return response;
        }) as typeof fetch,
      });
    } else {
      if (!this.apiKey) {
        throw new Error('OPENAI_API_KEY environment variable is required when USEEXTERNAL is false');
      }
      console.log('Using openAI LLM API');
      this.modelName = env.OPENAI_MODEL_NAME || 'gpt-4-vision-preview';
      this.openai = new OpenAI({
        apiKey: this.apiKey,
      });
    }
  }

  public getConversation(): ConversationMessage[] {
    return this.conversation;
  }

  public clearConversation() {
    this.conversation = [];
  }

  public async sendMessage(userMessage: string): Promise<ConversationMessage[]> {
    this.conversation.push({ role: 'user', content: userMessage });
    let retries = 0;
    while (retries < this.MAX_RETRIES) {
      try {
        const response = await this.openai.chat.completions.create({
          model: this.modelName,
          messages: this.conversation.map(msg => ({ role: msg.role, content: msg.content })),
          max_tokens: 1000
        });
        const content = response.choices[0]?.message?.content || '';
        this.conversation.push({ role: 'assistant', content });
        return this.conversation;
      } catch (error) {
        retries++;
        if (retries === this.MAX_RETRIES) {
          throw error;
        }
        this.logger.warn(`Retry ${retries}/${this.MAX_RETRIES} after error: ${error}`);
        await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY));
      }
    }
    throw new Error('Failed to get LLM response after maximum retries');
  }
} 