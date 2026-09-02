import React, { useState } from 'react';
import { SavedPlace, LocationPoint } from '../types';
import { PRESET_LOCATIONS } from '../data/mockData';
import { Bookmark, Home, Briefcase, Building, Plus, Trash2, Navigation, MapPin } from 'lucide-react';

interface SavedPlacesViewProps {
  savedPlaces: SavedPlace[];
  onAddSavedPlace: (place: SavedPlace) => void;
  onDeleteSavedPlace: (id: string) => void;
  onSelectDestination: (loc: LocationPoint) => void;
}

export const SavedPlacesView: React.FC<SavedPlacesViewProps> = ({
  savedPlaces,
  onAddSavedPlace,
  onDeleteSavedPlace,
  onSelectDestination,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [label, setLabel] = useState<'Home' | 'Work' | 'Campus Hostel' | 'Custom'>('Home');
  const [customTitle, setCustomTitle] = useState('');
  const [selectedLocationId, setSelectedLocationId] = useState(PRESET_LOCATIONS[0].id);

  const getLabelIcon = (lbl: string) => {
    switch (lbl) {
      case 'Home': return <Home className="w-4 h-4 text-blue-600" />;
      case 'Work': return <Briefcase className="w-4 h-4 text-emerald-600" />;
      case 'Campus Hostel': return <Building className="w-4 h-4 text-indigo-600" />;
      default: return <Bookmark className="w-4 h-4 text-purple-600" />;
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const loc = PRESET_LOCATIONS.find((l) => l.id === selectedLocationId) || PRESET_LOCATIONS[0];
    onAddSavedPlace({
      id: `saved_${Date.now()}`,
      label,
      customTitle: customTitle || loc.name,
      location: loc,
      savedAt: new Date().toISOString(),
    });
    setIsAdding(false);
    setCustomTitle('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2 text-blue-600 text-xs font-bold uppercase tracking-wider mb-1">
            <Bookmark className="w-4 h-4" /> Quick Favorites & Destinations
          </div>
          <h2 className="text-xl font-extrabold text-slate-900">Saved Places</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Save frequent destinations like Home, Work, and Hostel for 1-tap route planning.
          </p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center space-x-1.5 shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Place</span>
        </button>
      </div>

      {/* Add New Place Form */}
      {isAdding && (
        <form onSubmit={handleSave} className="bg-blue-50/70 rounded-2xl p-5 border border-blue-200 space-y-3 animate-fade-in">
          <h3 className="font-bold text-sm text-blue-950">Add Favorite Location</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">Label Type</label>
              <select
                value={label}
                onChange={(e) => setLabel(e.target.value as any)}
                className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-white outline-none"
              >
                <option value="Home">🏠 Home</option>
                <option value="Work">🏢 Work</option>
                <option value="Campus Hostel">🏫 Campus Hostel</option>
                <option value="Custom">⭐ Custom Favorite</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">Custom Name / Title</label>
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="e.g. My Hostel Room 304"
                className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-white outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">Select NIT Delhi Location</label>
              <select
                value={selectedLocationId}
                onChange={(e) => setSelectedLocationId(e.target.value)}
                className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-white outline-none"
              >
                {PRESET_LOCATIONS.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-200 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
            >
              Save Location
            </button>
          </div>
        </form>
      )}

      {/* Saved Places Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {savedPlaces.map((sp) => (
          <div
            key={sp.id}
            className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs hover:border-blue-300 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <div className="p-2 rounded-lg bg-slate-100">
                    {getLabelIcon(sp.label)}
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{sp.label}</span>
                    <h3 className="font-extrabold text-sm text-slate-900 leading-snug">{sp.customTitle || sp.location.name}</h3>
                  </div>
                </div>
                <button
                  onClick={() => onDeleteSavedPlace(sp.id)}
                  className="text-slate-400 hover:text-rose-600 p-1 rounded"
                  title="Remove saved place"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <p className="text-xs text-slate-500 mb-3">
                📍 {sp.location.address}
              </p>
            </div>

            <button
              onClick={() => onSelectDestination(sp.location)}
              className="w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center space-x-1.5 shadow-sm transition-colors"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Set as Destination</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

