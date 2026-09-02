import React from 'react';
import { Navigation, MapPin, Sparkles, PlusCircle, Compass, History, Bookmark, Sliders, ShieldCheck } from 'lucide-react';
import { AccessibilityProfile } from '../types';

interface HeaderProps {
  activeTab: 'home' | 'explore' | 'trips' | 'saved' | 'profile';
  onTabChange: (tab: 'home' | 'explore' | 'trips' | 'saved' | 'profile') => void;
  activeProfile: AccessibilityProfile;
  onOpenReportModal: () => void;
  onOpenAiInspector: () => void;
  onUseCurrentLocation: () => void;
  isLocating: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  activeProfile,
  onOpenReportModal,
  onOpenAiInspector,
  onUseCurrentLocation,
  isLocating,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top bar: Branding & Actions */}
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Tagline */}
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-600/20">
              <Navigation className="h-5 w-5 font-bold" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-xl tracking-tight text-slate-900">
                  Access<span className="text-blue-600">Route</span>
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-blue-50 text-blue-700 border border-blue-200 uppercase tracking-wide">
                  Live Prototype
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium hidden sm:block">Navigate without barriers.</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center space-x-2">
            
            {/* Live Location Button */}
            <button
              onClick={onUseCurrentLocation}
              disabled={isLocating}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors"
              title="Use Browser Geolocation"
            >
              <MapPin className={`w-3.5 h-3.5 ${isLocating ? 'animate-bounce text-blue-600' : 'text-slate-500'}`} />
              <span className="hidden sm:inline">{isLocating ? 'Locating...' : 'My Location'}</span>
            </button>

            {/* AI Vision Scanner */}
            <button
              onClick={onOpenAiInspector}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden sm:inline">AI Barrier Scanner</span>
            </button>

            {/* Report Barrier Button */}
            <button
              onClick={onOpenReportModal}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Report Barrier</span>
            </button>

          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="flex items-center space-x-1 border-t border-slate-100 py-1 overflow-x-auto custom-scrollbar">
          
          <button
            onClick={() => onTabChange('home')}
            className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
              activeTab === 'home'
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Route Planner</span>
          </button>

          <button
            onClick={() => onTabChange('explore')}
            className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
              activeTab === 'explore'
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Explore Places</span>
          </button>

          <button
            onClick={() => onTabChange('trips')}
            className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
              activeTab === 'trips'
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>My Trips</span>
          </button>

          <button
            onClick={() => onTabChange('saved')}
            className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
              activeTab === 'saved'
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Saved Places</span>
          </button>

          <button
            onClick={() => onTabChange('profile')}
            className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
              activeTab === 'profile'
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-blue-600" />
            <span>Profile: {activeProfile.name.split(' ')[0]}</span>
          </button>

        </div>

      </div>
    </header>
  );
};

