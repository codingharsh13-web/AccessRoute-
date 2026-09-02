import React from 'react';
import { RouteData, AccessibilityProfile } from '../types';
import { ShieldCheck, AlertTriangle, Clock, Footprints, Layers, CheckCircle2, XCircle, Play, Sparkles } from 'lucide-react';

interface RouteComparisonProps {
  recommendedRoute: RouteData;
  fastestRoute: RouteData;
  alternativeRoute: RouteData;
  selectedProfile: AccessibilityProfile;
  selectedRouteType: 'recommended' | 'fastest' | 'alternative';
  onSelectRouteType: (type: 'recommended' | 'fastest' | 'alternative') => void;
  onStartNavigation: () => void;
}

export const RouteComparison: React.FC<RouteComparisonProps> = ({
  recommendedRoute,
  fastestRoute,
  alternativeRoute,
  selectedProfile,
  selectedRouteType,
  onSelectRouteType,
  onStartNavigation,
}) => {
  const getScoreBadge = (score: number) => {
    if (score >= 90) return 'bg-emerald-600 text-white';
    if (score >= 70) return 'bg-amber-500 text-white';
    return 'bg-rose-600 text-white';
  };

  const candidateRoutes = [recommendedRoute, fastestRoute, alternativeRoute];

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs text-slate-900 space-y-4">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-blue-600" />
            Route Evaluation & Accessibility Scoring
          </h2>
          <p className="text-xs text-slate-500 font-medium">Evaluated against {selectedProfile.name} profile limits</p>
        </div>

        <button
          onClick={onStartNavigation}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs sm:text-sm flex items-center space-x-1.5 shadow-md shadow-blue-600/20 transition-all transform active:scale-95"
        >
          <Play className="w-4 h-4 fill-white" />
          <span>Start Navigation</span>
        </button>
      </div>

      {/* Candidate Route Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {candidateRoutes.map((route) => {
          const isSelected = selectedRouteType === route.type;
          const isRecommended = route.type === 'recommended';
          
          return (
            <div
              key={route.id}
              onClick={() => onSelectRouteType(route.type)}
              className={`cursor-pointer rounded-2xl p-4 border-2 transition-all relative flex flex-col justify-between ${
                isSelected
                  ? isRecommended
                    ? 'border-emerald-500 bg-emerald-50/40 shadow-sm ring-1 ring-emerald-500'
                    : route.type === 'fastest'
                    ? 'border-rose-500 bg-rose-50/40 shadow-sm ring-1 ring-rose-500'
                    : 'border-blue-500 bg-blue-50/40 shadow-sm ring-1 ring-blue-500'
                  : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/80'
              }`}
            >
              {isRecommended && (
                <div className="absolute -top-3 left-3 bg-emerald-600 text-white text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                  <ShieldCheck className="w-3 h-3" /> AccessRoute Recommended
                </div>
              )}

              <div>
                <div className="flex items-start justify-between mt-1 mb-2">
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 leading-snug">{route.name}</h3>
                    <span className="text-[11px] font-bold text-slate-500">
                      ⏱️ {route.totalDurationMinutes >= 60 ? `${Math.floor(route.totalDurationMinutes / 60)} hr ${route.totalDurationMinutes % 60} min` : `${route.totalDurationMinutes} min`} • {route.totalDistanceMeters >= 1000 ? `${(route.totalDistanceMeters / 1000).toFixed(1)} km` : `${route.totalDistanceMeters} m`}
                    </span>
                  </div>

                  <div className="flex flex-col items-end shrink-0">
                    <span className={`px-2.5 py-1 rounded-xl text-base font-black tracking-tight ${getScoreBadge(route.accessibilityScore)}`}>
                      {route.accessibilityScore}/100
                    </span>
                    <span className="text-[9px] font-bold text-slate-400 mt-0.5">Accessibility Score</span>
                  </div>
                </div>

                {/* Reasoning */}
                <p className="text-[11px] text-slate-600 bg-white p-2.5 rounded-xl border border-slate-200 mb-3 leading-relaxed">
                  <span className="font-bold text-slate-800">Score Evaluation: </span>
                  {route.scoreReasoning}
                </p>

                {/* Feature Pills */}
                <div className="space-y-1 text-xs">
                  {route.featuresList.map((feat, i) => (
                    <div key={i} className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Select Indicator */}
              <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs font-bold">
                <span className={isSelected ? 'text-slate-900' : 'text-slate-400'}>
                  {isSelected ? '✓ Active Route' : 'Click to select'}
                </span>
                {route.stairsCount > 0 ? (
                  <span className="text-rose-600 text-[11px]">⚠️ {route.stairsCount} Stairs</span>
                ) : (
                  <span className="text-emerald-600 text-[11px]">✅ Step-Free</span>
                )}
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};
