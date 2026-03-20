import { Groq } from 'groq-sdk';

export class AIService {
  private groq: Groq;
  private isAvailable: boolean = false;

  constructor() {
    const apiKey = process.env.GROQ_API_KEY;
    if (apiKey) {
      try {
        this.groq = new Groq({ apiKey });
        this.isAvailable = true;
        console.log('[AIService] Initialized successfully with GROQ_API_KEY');
      } catch (error) {
        console.error('[AIService] Failed to initialize Groq client:', error);
      }
    } else {
      console.warn('[AIService] GROQ_API_KEY is missing. AI features will be disabled.');
      // Stub the groq client so it doesn't crash if called
      this.groq = null as any;
    }
  }

  /**
   * Generates a risk score and mitigation strategy for a given scenario.
   */
  async evaluateRisk(scenario: string): Promise<{ score: number; mitigations: string[] }> {
    if (!this.isAvailable) {
      return { score: 50, mitigations: ['Ensure GROQ API key is configured to receive AI mitigations.'] };
    }

    try {
      const response = await this.groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are a Senior Construction Project Manager and Risk Consultant. Evaluate the conceptual risk of the proposed scenario. Respond strictly in JSON format with two keys: "score" (a number between 0 and 100, where 100 is extremely risky) and "mitigations" (an array of 3 actionable short bullet points).'
          },
          {
            role: 'user',
            content: scenario
          }
        ],
        model: 'llama-3.3-70b-versatile',
        response_format: { type: 'json_object' },
        temperature: 0.2, // Low temperature for consistent risk assessment formatting
      });

      const resultText = response.choices[0]?.message?.content || '{}';
      const result = JSON.parse(resultText);

      return {
        score: result.score || 0,
        mitigations: result.mitigations || ['No mitigations generated.']
      };
    } catch (error) {
      console.error('[AIService] Error evaluating risk:', error);
      throw new Error('Failed to evaluate risk using AI.');
    }
  }

  /**
   * Generates conversational response as an AI Project Manager Copilot.
   */
  async chatAsProjectManager(messages: { role: 'user' | 'assistant' | 'system', content: string }[]): Promise<string> {
    if (!this.isAvailable) {
      return 'AI features are currently unavailable. Please check your system configuration (GROQ_API_KEY).';
    }

    try {
      // Ensure the system prompt is always injected first to maintain context
      const systemContext = {
        role: 'system' as const,
        content: `You are an AI Construction Project Manager integrated into the PROTECHT BIM platform.
You are professional, authoritative, but concise. Provide strategic advice on scheduling, cost management, and risk.
Format responses using Markdown (lists, bolding) when appropriate to be punchy and readable.`
      };

      const fullMessages = [systemContext, ...messages];

      const response = await this.groq.chat.completions.create({
        messages: fullMessages,
        model: 'llama-3.3-70b-versatile',
        temperature: 0.7,
      });

      return response.choices[0]?.message?.content || 'I encountered an error formulating a response.';
    } catch (error) {
      console.error('[AIService] Error in AI chat:', error);
      throw new Error('Failed to generate AI response.');
    }
  }
}

export const aiService = new AIService();
