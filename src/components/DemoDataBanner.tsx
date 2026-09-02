import React, { useState } from 'react';
import { Info, X, Sparkles, CheckCircle2 } from 'lucide-react';

export const DemoDataBanner: React.FC = () => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="bg-amber-500/10 border-b border-amber-500/30 text-amber-900 px-4 py-2 text-xs sm:text-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-800 font-bold uppercase text-[10px] tracking-wider border border-amber-500/30">
            Prototype Demo Data
          </span>
          <p className="text-amber-950 font-medium">
            <span className="font-semibold">Hackathon Preview:</span> Accessibility nodes, incline metrics & obstacle reports are simulated prototype data for San Francisco Urban Hub & Tech Campus.
          </p>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-amber-800 hover:text-amber-950 p-1 rounded-md hover:bg-amber-500/20"
          title="Dismiss warning"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

