import type { WebSource } from './insights';

export interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
}

export interface ChatResponse {
  reply: string;
  usedGemini: boolean;
  sources: WebSource[];
  demoMode?: boolean;
  error?: string;
}
