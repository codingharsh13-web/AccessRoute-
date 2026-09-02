import React from 'react';
import { Navigation, Sparkles, AlertTriangle, ShieldCheck, Sun, Moon, PlusCircle } from 'lucide-react';
import { AccessibilityProfile } from '../types';

interface NavbarProps {
  activeProfile: AccessibilityProfile;
  highContrast: boolean;
  onToggleContrast: () => void;
  onOpenReportModal: () => void;
  onOpenAiInspector: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeProfile,
  highContrast,
  onToggleContrast,
  onOpenReportModal,
  onOpenAiInspector,
}) => {
  return (
    <header className={`sticky top-0 z-30 border-b shadow-sm ${highContrast ? 'bg-black text-yellow-400 border-yellow-400' : 'bg-slate-900 text-white border-slate-800'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & App Branding */}
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Navigation className="h-6 w-6 text-slate-950 font-bold" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-xl tracking-tight text-white">Access<span className="text-emerald-400">Route</span></span>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Hackathon MVP
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">AI-Powered Accessibility Navigation Engine</p>
            </div>
          </div>

          {/* Center Profile Badge */}
          <div className="hidden md:flex items-center space-x-2 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
            <span className="text-xs text-slate-400">Active Profile:</span>
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              {activeProfile.name}
            </span>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            
            {/* AI Vision Inspector Modal Button */}
            <button
              onClick={onOpenAiInspector}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md shadow-indigo-600/30"
              title="Test Gemini AI Image Barrier Detection"
            >
              <Sparkles className="w-4 h-4 text-indigo-200 animate-spin-slow" />
              <span className="hidden sm:inline">AI Vision Scanner</span>
              <span className="sm:hidden">AI Scan</span>
            </button>

            {/* Report Barrier Button */}
            <button
              onClick={onOpenReportModal}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-md shadow-emerald-600/30"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Report Barrier</span>
              <span className="sm:hidden">Report</span>
            </button>

            {/* High Contrast Toggle Button */}
            <button
              onClick={onToggleContrast}
              className={`p-2 rounded-lg border transition-colors ${
                highContrast 
                  ? 'bg-yellow-400 text-black border-yellow-500 font-bold' 
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'
              }`}
              title="Toggle High Contrast Mode for Low Vision"
              aria-label="Toggle High Contrast"
            >
              {highContrast ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

          </div>
        </div>
      </div>
    </header>
  );
};

