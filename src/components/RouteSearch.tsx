import React, { useState } from 'react';
import { LocationPoint, SavedPlace } from '../types';
import { PRESET_LOCATIONS } from '../data/mockData';
import { MapPin, ArrowRightLeft, Search, Navigation, Compass, Crosshair, AlertCircle, Map, Check } from 'lucide-react';

interface RouteSearchProps {
  origin: LocationPoint;
  destination: LocationPoint;
  onSelectOrigin: (loc: LocationPoint) => void;
  onSelectDestination: (loc: LocationPoint) => void;
  onSwap: () => void;
  onCalculate: () => void;
  isLoading: boolean;
  userLocation: { lat: number; lng: number } | null;
  savedPlaces: SavedPlace[];
  pickingTarget?: 'origin' | 'destination' | null;
  onTogglePickOnMap?: (target: 'origin' | 'destination' | null) => void;
}

export const RouteSearch: React.FC<RouteSearchProps> = ({
  origin,
  destination,
  onSelectOrigin,
  onSelectDestination,
  onSwap,
  onCalculate,
  isLoading,
  userLocation,
  savedPlaces,
  pickingTarget = null,
  onTogglePickOnMap,
}) => {
  const [originSearchText, setOriginSearchText] = useState(origin.name);
  const [destSearchText, setDestSearchText] = useState(destination.name);
  const [isSearchingOrigin, setIsSearchingOrigin] = useState(false);
  const [isSearchingDest, setIsSearchingDest] = useState(false);

  const handleUseCurrentLocationForOrigin = () => {
    if (userLocation) {
      const currentLoc: LocationPoint = {
        id: 'loc_current_user',
        name: 'My Current Location',
        category: 'transit',
        lat: userLocation.lat,
        lng: userLocation.lng,
        address: `Lat: ${userLocation.lat.toFixed(4)}, Lng: ${userLocation.lng.toFixed(4)}`,
      };
      setOriginSearchText('My Current Location');
      onSelectOrigin(currentLoc);
    }
  };

  const handleCustomPlaceSubmit = (type: 'origin' | 'destination', text: string) => {
    if (!text.trim()) return;

    // Check if matches preset
    const match = PRESET_LOCATIONS.find(
      (l) => l.name.toLowerCase().includes(text.toLowerCase()) || l.address.toLowerCase().includes(text.toLowerCase())
    );

    if (match) {
      if (type === 'origin') {
        setOriginSearchText(match.name);
        onSelectOrigin(match);
      } else {
        setDestSearchText(match.name);
        onSelectDestination(match);
      }
      return;
    }

    // Otherwise create custom geocoded point based on search query
    // Simple deterministic hash for demo coordinates if geocoding service is offline
    let hash = 0;
    for (let i = 0; i < text.length; i++) hash = (hash << 5) - hash + text.charCodeAt(i);
    const latOffset = ((Math.abs(hash) % 100) - 50) * 0.002;
    const lngOffset = ((Math.abs(hash * 7) % 100) - 50) * 0.002;

    const customLoc: LocationPoint = {
      id: `loc_custom_${Date.now()}`,
      name: text.trim(),
      category: 'landmark',
      lat: Number((28.6129 + latOffset).toFixed(4)),
      lng: Number((77.2295 + lngOffset).toFixed(4)),
      address: `Custom location: ${text.trim()}`,
    };

    if (type === 'origin') {
      onSelectOrigin(customLoc);
    } else {
      onSelectDestination(customLoc);
    }
  };

  // Check if either origin or destination is outside NIT Delhi campus coverage
  const isOriginOutsideCoverage = Math.abs(origin.lat - 28.8433) > 0.05 || Math.abs(origin.lng - 77.1055) > 0.05;
  const isDestOutsideCoverage = Math.abs(destination.lat - 28.8433) > 0.05 || Math.abs(destination.lng - 77.1055) > 0.05;
  const isLimitedCoverage = isOriginOutsideCoverage || isDestOutsideCoverage;

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs text-slate-900 space-y-4">
      
      {/* Header & Map Pick Indicator */}
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
          <Navigation className="w-4 h-4 text-blue-600" />
          Set Journey Origin & Destination
        </h2>
        {pickingTarget && (
          <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-extrabold animate-pulse flex items-center gap-1">
            <Map className="w-3 h-3" /> Click on Map to set {pickingTarget.toUpperCase()}
          </span>
        )}
      </div>

      {/* Inputs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
        
        {/* Origin Input */}
        <div className="md:col-span-5 relative">
          <div className="flex items-center justify-between mb-1">
            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wide flex items-center gap-1">
              Start Location (Origin)
            </label>
            <div className="flex items-center gap-2">
              {userLocation && (
                <button
                  type="button"
                  onClick={handleUseCurrentLocationForOrigin}
                  className="text-[10px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <Crosshair className="w-3 h-3" /> My Location
                </button>
              )}
              {onTogglePickOnMap && (
                <button
                  type="button"
                  onClick={() => onTogglePickOnMap(pickingTarget === 'origin' ? null : 'origin')}
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded border transition-colors ${
                    pickingTarget === 'origin'
                      ? 'bg-amber-500 text-white border-amber-600'
                      : 'text-slate-600 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <Map className="w-3 h-3 inline mr-0.5" /> Pick on Map
                </button>
              )}
            </div>
          </div>

          <div className="relative flex items-center">
            <div className="absolute left-3 text-emerald-600 pointer-events-none">
              <MapPin className="w-4 h-4 fill-emerald-600/20" />
            </div>
            
            <select
              value={origin.id}
              onChange={(e) => {
                if (e.target.value === 'loc_current_user' && userLocation) {
                  handleUseCurrentLocationForOrigin();
                } else {
                  const found = PRESET_LOCATIONS.find((l) => l.id === e.target.value);
                  if (found) {
                    setOriginSearchText(found.name);
                    onSelectOrigin(found);
                  }
                }
              }}
              className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm font-semibold rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all"
            >
              {origin.id.startsWith('loc_custom_') || origin.id === 'loc_current_user' ? (
                <option value={origin.id}>📍 {origin.name}</option>
              ) : null}
              {PRESET_LOCATIONS.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  🟢 {loc.name} ({loc.category})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Swap Button */}
        <div className="md:col-span-2 flex justify-center py-1">
          <button
            onClick={() => {
              onSwap();
              const temp = originSearchText;
              setOriginSearchText(destSearchText);
              setDestSearchText(temp);
            }}
            className="p-2.5 rounded-full border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition-transform active:scale-95 shadow-xs"
            title="Swap Origin and Destination"
          >
            <ArrowRightLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Destination Input */}
        <div className="md:col-span-5 relative">
          <div className="flex items-center justify-between mb-1">
            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wide block">
              End Location (Destination)
            </label>
            {onTogglePickOnMap && (
              <button
                type="button"
                onClick={() => onTogglePickOnMap(pickingTarget === 'destination' ? null : 'destination')}
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded border transition-colors ${
                  pickingTarget === 'destination'
                    ? 'bg-amber-500 text-white border-amber-600'
                    : 'text-slate-600 border-slate-300 hover:bg-slate-100'
                }`}
              >
                <Map className="w-3 h-3 inline mr-0.5" /> Pick on Map
              </button>
            )}
          </div>

          <div className="relative flex items-center">
            <div className="absolute left-3 text-rose-600 pointer-events-none">
              <MapPin className="w-4 h-4 fill-rose-600/20" />
            </div>
            
            <select
              value={destination.id}
              onChange={(e) => {
                const found = PRESET_LOCATIONS.find((l) => l.id === e.target.value);
                if (found) {
                  setDestSearchText(found.name);
                  onSelectDestination(found);
                }
              }}
              className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm font-semibold rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all"
            >
              {destination.id.startsWith('loc_custom_') ? (
                <option value={destination.id}>🔴 {destination.name}</option>
              ) : null}
              {PRESET_LOCATIONS.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  🔴 {loc.name} ({loc.category})
                </option>
              ))}
            </select>
          </div>
        </div>

      </div>

      {/* Preset Pills */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1">
        <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1">
          <Compass className="w-3.5 h-3.5 text-slate-400" /> Presets:
        </span>
        {PRESET_LOCATIONS.map((preset) => (
          <button
            key={preset.id}
            onClick={() => {
              setDestSearchText(preset.name);
              onSelectDestination(preset);
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors ${
              destination.id === preset.id
                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            {preset.name.split(' ')[0]}
          </button>
        ))}
      </div>

      {/* Accessibility Coverage Notice Banner */}
      {isLimitedCoverage && (
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-300/80 text-amber-900 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-extrabold text-amber-950 block">Accessibility Data Coverage Notice</span>
            <p className="text-[11px] text-amber-800 leading-snug">
              Accessibility data coverage is limited in this area (outside primary NIT Delhi survey). Route availability does not guarantee complete accessibility information.
            </p>
          </div>
        </div>
      )}

      {/* Calculate Accessible Route Action */}
      <div>
        <button
          onClick={onCalculate}
          disabled={isLoading}
          className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm sm:text-base tracking-wide flex items-center justify-center space-x-2 shadow-md shadow-blue-600/20 transition-all transform active:scale-[0.99] disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Evaluating Route Intelligence...</span>
            </>
          ) : (
            <>
              <Search className="w-5 h-5" />
              <span>Find Accessibility-Aware Route</span>
            </>
          )}
        </button>
      </div>

    </div>
  );
};

