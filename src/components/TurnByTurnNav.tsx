import React, { useState } from 'react';
import { RouteData } from '../types';
import { Navigation, Volume2, AlertOctagon, CheckCircle2, ChevronRight, CornerUpRight, ArrowUp } from 'lucide-react';

interface TurnByTurnNavProps {
  route: RouteData;
  highContrast?: boolean;
}

export const TurnByTurnNav: React.FC<TurnByTurnNavProps> = ({ route, highContrast = false }) => {
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const triggerHapticFeedback = () => {
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate([150, 80, 150]);
      } catch (e) {
        // ignore if not supported or disabled
      }
    }
  };

  const speakInstruction = (text: string) => {
    triggerHapticFeedback();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.onend = () => setIsSpeaking(false);
      setIsSpeaking(true);
      window.speechSynthesis.speak(utterance);
    } else {
      alert(`Audio Navigation: "${text}"`);
    }
  };

  return (
    <div className={`p-4 rounded-2xl border ${highContrast ? 'bg-black border-yellow-400 text-yellow-400' : 'bg-white border-slate-200 shadow-sm text-slate-800'}`}>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
          <Navigation className="w-4 h-4 text-emerald-500" />
          Turn-by-Turn Accessible Guidance ({route.steps.length} Steps)
        </h2>
        
        {/* Audio Reader Simulator */}
        <button
          onClick={() => speakInstruction(route.steps[activeStepIndex]?.spokenInstruction || route.steps[activeStepIndex]?.instruction || 'Navigation active')}
          className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
            isSpeaking
              ? 'bg-rose-500 text-white animate-pulse'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
          }`}
          title="Listen to Step Audio Guidance"
        >
          <Volume2 className="w-3.5 h-3.5" />
          <span>{isSpeaking ? 'Reading Step...' : 'Audio Voice Alert'}</span>
        </button>
      </div>

      <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1 custom-scrollbar">
        {route.steps.map((step, idx) => {
          const isActive = idx === activeStepIndex;
          return (
            <div
              key={step.stepNumber}
              onClick={() => {
                setActiveStepIndex(idx);
                triggerHapticFeedback();
              }}
              className={`p-3 rounded-xl border transition-all cursor-pointer ${
                isActive
                  ? route.type === 'recommended' || route.type === 'alternative'
                    ? 'border-emerald-500 bg-emerald-50/70 shadow-sm ring-1 ring-emerald-500'
                    : 'border-rose-500 bg-rose-50/70 shadow-sm ring-1 ring-rose-500'
                  : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                      step.isAccessible
                        ? 'bg-emerald-500 text-white'
                        : 'bg-rose-500 text-white'
                    }`}
                  >
                    {step.stepNumber}
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                      {step.instruction}
                    </h4>
                    
                    {/* Step Attributes */}
                    <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-slate-500 font-medium">
                      <span>📏 {step.distanceMeters}m</span>
                      <span>⏱️ {Math.round(step.durationSeconds / 60)} min</span>
                      <span className="capitalize">🛣️ {step.surfaceType.replace('_', ' ')}</span>
                      <span>📐 {step.slopeDegrees}° Incline</span>
                    </div>

                    {/* Step Warning */}
                    {step.hazardWarning && (
                      <div className="mt-2 p-2 rounded-md bg-rose-100 border border-rose-300 text-rose-800 text-xs font-bold flex items-center gap-1.5">
                        <AlertOctagon className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>{step.hazardWarning}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  {step.isAccessible ? (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                      Accessible
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-md">
                      Barrier Risk
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

