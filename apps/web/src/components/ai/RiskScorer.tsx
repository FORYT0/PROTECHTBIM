import React, { useState } from 'react';
import { useAIStore } from '../../stores/useAIStore';

interface RiskScorerProps {
  scenario: string;
  onAnalyzeComplete?: (score: number) => void;
}

/**
 * RiskScorer Component
 * 
 * Takes a construction scenario and pings the AI to score its risk (0-100).
 * Displays a visual gauge and actionable mitigation steps.
 */
export const RiskScorer: React.FC<RiskScorerProps> = ({ scenario, onAnalyzeComplete }) => {
  const [loading, setLoading] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [mitigations, setMitigations] = useState<string[]>([]);
  const { openAIBrain, addMessage } = useAIStore();

  const analyzeRisk = async () => {
    setLoading(true);
    setScore(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/v1/ai/risk-score', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ scenario })
      });

      if (!response.ok) throw new Error('API Error');

      const data = await response.json();
      setScore(data.score);
      setMitigations(data.mitigations);
      if (onAnalyzeComplete) onAnalyzeComplete(data.score);
    } catch (error) {
      console.error(error);
      setScore(0);
      setMitigations(['Failed to analyze risk properly. Please check backend configuration.']);
    } finally {
      setLoading(false);
    }
  };

  const askBrainForDetails = () => {
    openAIBrain();
    addMessage({
      role: 'user',
      content: `I ran a risk analysis on: "${scenario}". The score was ${score}/100. Can you detail exactly why this is the case and how we can mitigate it further?`
    });
  };

  const getScoreColor = () => {
    if (score === null) return 'text-gray-500';
    if (score < 30) return 'text-green-500';
    if (score < 70) return 'text-amber-500';
    return 'text-red-500';
  };

  return (
    <div className="card border border-white/5 ai-glass w-full">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-medium text-white flex items-center">
            <span className="mr-2">🎯</span> AI Risk Scorer
          </h3>
          <p className="text-sm text-gray-400 mt-1">Evaluates the impact of proposed changes</p>
        </div>
        
        {score === null && !loading && (
          <button onClick={analyzeRisk} className="btn-primary text-sm py-2 px-4">
            Analyze Now
          </button>
        )}
      </div>

      <div className="bg-black/30 p-3 rounded-lg mb-4 text-sm text-gray-300 italic border border-white/5">
        "{scenario}"
      </div>

      {loading && (
        <div className="flex items-center space-x-3 text-blue-400 animate-pulse text-sm font-medium">
          <div className="w-4 h-4 rounded-full bg-blue-500 animate-bounce" />
          <p>AI is consulting historical project data...</p>
        </div>
      )}

      {score !== null && (
        <div className="animate-slide-in-up space-y-4 border-t border-white/10 pt-4 mt-2">
          <div className="flex items-center space-x-6">
            <div className="text-center">
              <div className={`text-4xl font-bold tracking-tighter ${getScoreColor()}`}>
                {score}
              </div>
              <div className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Risk Score</div>
            </div>
            
            <div className="flex-1 space-y-2">
              <h4 className="text-sm font-medium text-white">Suggested Mitigations:</h4>
              <ul className="space-y-1">
                {mitigations.map((item, idx) => (
                  <li key={idx} className="text-sm text-gray-300 flex items-start">
                    <span className="text-blue-500 mr-2 mt-0.5">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
             <button 
               onClick={askBrainForDetails}
               className="text-xs text-blue-400 hover:text-blue-300 transition-colors flex items-center"
             >
               Discuss with AI Brain →
             </button>
          </div>
        </div>
      )}
    </div>
  );
};
