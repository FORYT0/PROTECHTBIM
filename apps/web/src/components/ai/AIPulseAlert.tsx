import React, { useState, useEffect } from 'react';

/**
 * AIPulseAlert
 * 
 * An animated banner/pill that occasionally shows AI-driven insights on the dashboard.
 */
export const AIPulseAlert: React.FC = () => {
  const [insight, setInsight] = useState<string | null>(null);

  useEffect(() => {
    // Simulate real-time insights based on Dashboard context. 
    // In a production app, this would be wired to the WebSocket or AI backend.
    const insights = [
      "AI Pulse: Schedule variance detected. 'Foundation Pouring' is tracking 2 days behind.",
      "AI Pulse: Budget alert. Material costs for 'Structural Steel' are trending 8% higher than baseline.",
      "AI Pulse: Resource optimization available. Suggest moving 2 carpenters to 'Framing Phase'.",
      "AI Pulse: Weather warning. Incoming rain may delay 'Roofing' next Tuesday. Adjust schedule?",
    ];

    // Show a new insight every 30 seconds
    const interval = setInterval(() => {
      const newInsight = insights[Math.floor(Math.random() * insights.length)];
      setInsight(newInsight);
    }, 30000);

    // Initial insight
    setTimeout(() => {
      setInsight(insights[0]);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  if (!insight) return null;

  return (
    <div className="w-full mb-6 animate-slide-in-up">
      <div className="ai-glass px-4 py-3 rounded-xl border border-blue-500/20 shadow-lg flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative flex items-center justify-center">
            {/* The pulsing dot */}
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-ai-pulse" />
          </div>
          <p className="text-sm font-medium text-blue-100 tracking-wide">
            {insight}
          </p>
        </div>
        <button 
          onClick={() => setInsight(null)}
          className="text-gray-500 hover:text-white transition-colors ml-4"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};
