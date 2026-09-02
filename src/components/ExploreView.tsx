import React, { useState } from 'react';
import { LocationPoint } from '../types';
import { PRESET_LOCATIONS } from '../data/mockData';
import { Compass, MapPin, CheckCircle2, Navigation, Search, Building2, Hospital, Bus, BookOpen } from 'lucide-react';

interface ExploreViewProps {
  onSelectDestination: (loc: LocationPoint) => void;
  onSelectOrigin: (loc: LocationPoint) => void;
}

export const ExploreView: React.FC<ExploreViewProps> = ({ onSelectDestination, onSelectOrigin }) => {
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'campus': return <Building2 className="w-4 h-4 text-blue-600" />;
      case 'transit': return <Bus className="w-4 h-4 text-emerald-600" />;
      case 'medical': return <Hospital className="w-4 h-4 text-rose-600" />;
      default: return <BookOpen className="w-4 h-4 text-indigo-600" />;
    }
  };

  const filteredLocations = PRESET_LOCATIONS.filter((loc) => {
    const matchesCategory = filterCategory === 'all' || loc.category === filterCategory;
    const matchesSearch = loc.name.toLowerCase().includes(searchQuery.toLowerCase()) || loc.address.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-md">
        <div className="flex items-center space-x-2 text-blue-200 text-xs font-bold uppercase tracking-wider mb-1">
          <Compass className="w-4 h-4" /> Accessible Places Database
        </div>
        <h2 className="text-xl sm:text-2xl font-extrabold">Discover Accessible Places</h2>
        <p className="text-xs sm:text-sm text-blue-100 mt-1 max-w-2xl">
          Explore verified accessible facilities, transit hubs, landmarks, and medical centers.
        </p>

        {/* Search & Filter Bar */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-12 gap-2">
          <div className="sm:col-span-8 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search accessible buildings, metro stations, landmarks..."
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm font-medium rounded-xl bg-white text-slate-900 placeholder:text-slate-400 outline-none"
            />
          </div>
          <div className="sm:col-span-4">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm font-bold rounded-xl bg-blue-800 text-white border border-blue-500 outline-none"
            >
              <option value="all">All Categories</option>
              <option value="campus">Campus Buildings</option>
              <option value="transit">Transit Hubs</option>
              <option value="medical">Medical Centers</option>
            </select>
          </div>
        </div>
      </div>

      {/* Places Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredLocations.map((loc) => (
          <div
            key={loc.id}
            className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <div className="p-2 rounded-lg bg-slate-100">
                    {getCategoryIcon(loc.category)}
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{loc.category}</span>
                    <h3 className="font-extrabold text-sm text-slate-900 leading-snug">{loc.name}</h3>
                  </div>
                </div>
                {loc.isPrototypeData && (
                  <span className="text-[9px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded border border-amber-300">
                    Demo Data
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-500 mb-3 leading-relaxed">
                📍 {loc.address}
              </p>

              {/* Accessible Features List */}
              {loc.accessibleFeatures && (
                <div className="space-y-1 mb-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Accessibility Features:</span>
                  <div className="flex flex-wrap gap-1">
                    {loc.accessibleFeatures.map((feat, i) => (
                      <span key={i} className="text-[11px] font-medium bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                        {feat}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Action Buttons */}
            <div className="pt-3 border-t border-slate-100 flex items-center space-x-2">
              <button
                onClick={() => onSelectOrigin(loc)}
                className="flex-1 py-1.5 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
              >
                Set as Start
              </button>
              <button
                onClick={() => onSelectDestination(loc)}
                className="flex-1 py-1.5 px-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors flex items-center justify-center space-x-1"
              >
                <Navigation className="w-3 h-3" />
                <span>Navigate Here</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

