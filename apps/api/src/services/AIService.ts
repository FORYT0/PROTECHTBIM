import Groq from 'groq-sdk';

// AIService — powered by Groq (llama-3.3-70b-versatile)
// GROQ_API_KEY must be set in Railway environment variables.
// Never hardcode API keys in source code.

const SYSTEM_PROMPT = `You are ARIA — the AI assistant for PROTECHT BIM, a construction project management platform.
You are an expert in:
- Construction project management (BIM, Gantt, scheduling, critical path)
- Cost control, contract administration, change order management  
- Quality management, snagging, defect tracking
- Risk assessment and mitigation for construction projects
- Kenyan construction industry standards and regulations (NCA, KEBS, KBC)
- FIDIC contracts, JBC forms, BOQ analysis
- Health & Safety (OSHA Kenya, site safety protocols)

Be concise, practical and construction-specific. Use KES for currency when relevant.
When asked about project data, acknowledge you can see the context provided.
Format responses with markdown when helpful (bullet points, bold headings).`;

let groqClient: Groq | null = null;

function getClient(): Groq {
  if (!groqClient) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error('GROQ_API_KEY environment variable is not set');
    groqClient = new Groq({ apiKey });
  }
  return groqClient;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface RiskScoreResult {
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

class AIService {
  async chat(messages: ChatMessage[], projectContext?: string): Promise<string> {
    const client = getClient();
    const systemMessages: ChatMessage[] = [{ role: 'system', content: SYSTEM_PROMPT }];
    if (projectContext) {
      systemMessages.push({ role: 'system', content: `Current project context:\n${projectContext}` });
    }
    const response = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [...systemMessages, ...messages],
      max_tokens: 1024,
      temperature: 0.7,
    });
    return response.choices[0]?.message?.content ?? 'No response generated.';
  }

  async chatAsProjectManager(messages: ChatMessage[]): Promise<string> {
    return this.chat(messages);
  }

  async evaluateRisk(scenario: string, projectContext?: string): Promise<RiskScoreResult> {
    const client = getClient();
    const prompt = `Evaluate the construction risk. Respond ONLY with valid JSON:
Scenario: ${scenario}
${projectContext ? `Project context: ${projectContext}` : ''}

JSON structure:
{"score":<1-10>,"level":"<Low|Medium|High|Critical>","summary":"<one sentence>","factors":["<f1>","<f2>","<f3>"],"recommendations":["<r1>","<r2>","<r3>"]}`;
    const response = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: 'Construction risk expert. Respond with valid JSON only.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 512,
      temperature: 0.3,
    });
    const raw = response.choices[0]?.message?.content ?? '{}';
    try {
      return JSON.parse(raw.replace(/```json|```/g, '').trim()) as RiskScoreResult;
    } catch {
      return { score: 5, level: 'Medium', summary: 'Risk assessment completed', factors: [scenario.slice(0, 100)], recommendations: ['Review project documentation'] };
    }
  }

  async generateProjectInsights(projectData: {
    name: string; progress: number;
    budget: { total: number; spent: number };
    openSnags: number; criticalSnags: number;
    pendingChangeOrders: number; daysRemaining: number;
    workPackages: { total: number; overdue: number };
  }): Promise<AIInsight[]> {
    const client = getClient();
    const pct = Math.round(projectData.budget.spent / projectData.budget.total * 100);
    const prompt = `Analyze this construction project and generate 3-5 actionable insights as a JSON array:
Project: ${projectData.name} | Progress: ${projectData.progress}%
Budget: KES ${projectData.budget.total.toLocaleString()} total, ${pct}% spent
Open snags: ${projectData.openSnags} (${projectData.criticalSnags} critical)
Pending COs: ${projectData.pendingChangeOrders} | Days remaining: ${projectData.daysRemaining}
Overdue WPs: ${projectData.workPackages.overdue}/${projectData.workPackages.total}

JSON array only:
[{"type":"<schedule|cost|quality|risk|contract>","title":"<title>","description":"<1-2 sentences>","priority":"<low|medium|high|critical>","action":"<specific action>"}]`;
    const response = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: 'Construction project analyst. Respond with valid JSON only.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 800,
      temperature: 0.4,
    });
    const raw = response.choices[0]?.message?.content ?? '[]';
    try {
      return JSON.parse(raw.replace(/```json|```/g, '').trim()) as AIInsight[];
    } catch {
      return [{ type: 'risk', title: 'Review Project Status', description: 'Manual review required.', priority: 'medium' }];
    }
  }

  async analyzeChangeOrder(changeOrder: { title: string; description: string; reason: string; costImpact: number; scheduleImpactDays: number }): Promise<any> {
    const client = getClient();
    const response = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: 'Construction contract administrator. Respond with valid JSON only.' },
        { role: 'user', content: `Analyze this change order and respond with JSON only:
Title: ${changeOrder.title}
Description: ${changeOrder.description}
Reason: ${changeOrder.reason}
Cost Impact: KES ${changeOrder.costImpact.toLocaleString()}
Schedule Impact: ${changeOrder.scheduleImpactDays} days

{"recommendation":"<Approve|Reject|Request More Info>","confidence":<0-100>,"reasoning":"<2-3 sentences>","risks":["<r1>","<r2>"],"negotiationPoints":["<p1>","<p2>"]}` },
      ],
      max_tokens: 512,
      temperature: 0.3,
    });
    const raw = response.choices[0]?.message?.content ?? '{}';
    try {
      return JSON.parse(raw.replace(/```json|```/g, '').trim());
    } catch {
      return { recommendation: 'Request More Info', confidence: 50, reasoning: 'Manual review required.', risks: ['Insufficient information'] };
    }
  }

  async generateSnagDescription(location: string, category: string, severity: string): Promise<string> {
    const client = getClient();
    const response = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: 'Generate concise technical construction defect descriptions. 1-2 sentences only.' },
        { role: 'user', content: `Technical description for a ${severity} ${category} defect at ${location} on a construction site.` },
      ],
      max_tokens: 100,
      temperature: 0.5,
    });
    return response.choices[0]?.message?.content ?? 'Defect requiring rectification.';
  }

  async summarizeDailyReport(workCompleted: string, delays?: string, safetyIncidents?: string): Promise<string> {
    const client = getClient();
    const response = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: 'Summarize construction site daily reports concisely. 2-3 sentences.' },
        { role: 'user', content: `Work: ${workCompleted}\nDelays: ${delays || 'None'}\nSafety: ${safetyIncidents || 'None'}` },
      ],
      max_tokens: 150,
      temperature: 0.4,
    });
    return response.choices[0]?.message?.content ?? workCompleted;
  }
}

export const aiService = new AIService();
export default AIService;
