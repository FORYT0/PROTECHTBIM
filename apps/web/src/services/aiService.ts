import apiRequest from '../utils/api';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
}

export interface RiskScore {
  score: number;
  level: 'Low' | 'Medium' | 'High' | 'Critical';
  summary: string;
  factors: string[];
  recommendations: string[];
}

export interface AIInsight {
  type: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  action?: string;
}

export const aiService = {
  async getStatus(): Promise<{ available: boolean; model: string; message: string }> {
    try {
      const r = await apiRequest('/ai/status');
      if (!r.ok) return { available: false, model: '', message: 'AI unavailable' };
      return r.json();
    } catch {
      return { available: false, model: '', message: 'AI unreachable' };
    }
  },

  async chat(messages: ChatMessage[], projectContext?: string): Promise<string> {
    const r = await apiRequest('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        projectContext,
      }),
    });
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      throw new Error(err.error || 'AI chat failed');
    }
    return (await r.json()).response;
  },

  async evaluateRisk(scenario: string, projectContext?: string): Promise<RiskScore> {
    const r = await apiRequest('/ai/risk-score', {
      method: 'POST',
      body: JSON.stringify({ scenario, projectContext }),
    });
    if (!r.ok) throw new Error('Risk evaluation failed');
    return r.json();
  },

  async getProjectInsights(projectData: any): Promise<AIInsight[]> {
    const r = await apiRequest('/ai/insights', {
      method: 'POST',
      body: JSON.stringify({ projectData }),
    });
    if (!r.ok) throw new Error('Insights generation failed');
    return (await r.json()).insights;
  },

  async analyzeChangeOrder(changeOrder: any): Promise<any> {
    const r = await apiRequest('/ai/analyze-change-order', {
      method: 'POST',
      body: JSON.stringify({ changeOrder }),
    });
    if (!r.ok) throw new Error('Analysis failed');
    return r.json();
  },

  async generateSnagDescription(location: string, category: string, severity: string): Promise<string> {
    const r = await apiRequest('/ai/generate-snag-description', {
      method: 'POST',
      body: JSON.stringify({ location, category, severity }),
    });
    if (!r.ok) throw new Error('Generation failed');
    return (await r.json()).description;
  },

  async summarizeReport(workCompleted: string, delays?: string, safetyIncidents?: string): Promise<string> {
    const r = await apiRequest('/ai/summarize-report', {
      method: 'POST',
      body: JSON.stringify({ workCompleted, delays, safetyIncidents }),
    });
    if (!r.ok) throw new Error('Summarization failed');
    return (await r.json()).summary;
  },
};

export default aiService;
