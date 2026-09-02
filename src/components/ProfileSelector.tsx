import React from 'react';
import { AccessibilityProfile, AccessibilityProfileId } from '../types';
import { ACCESSIBILITY_PROFILES } from '../data/mockData';
import { Accessibility, Footprints, Eye, EarOff, Check, Sliders } from 'lucide-react';

interface ProfileSelectorProps {
  selectedProfile: AccessibilityProfile;
  onSelectProfile: (profile: AccessibilityProfile) => void;
}

export const ProfileSelector: React.FC<ProfileSelectorProps> = ({
  selectedProfile,
  onSelectProfile,
}) => {
  const getIcon = (id: AccessibilityProfileId) => {
    switch (id) {
      case 'wheelchair': return <Accessibility className="w-5 h-5" />;
      case 'limited_mobility': return <Footprints className="w-5 h-5" />;
      case 'visually_impaired': return <Eye className="w-5 h-5" />;
      case 'hearing_impaired': return <EarOff className="w-5 h-5" />;
    }
  };

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs text-slate-900">
      
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
          <Sliders className="w-4 h-4 text-blue-600" />
          Select Accessibility Mode
        </h2>
        <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
          {selectedProfile.badgeText}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {ACCESSIBILITY_PROFILES.map((profile) => {
          const isSelected = selectedProfile.id === profile.id;
          return (
            <button
              key={profile.id}
              onClick={() => onSelectProfile(profile)}
              className={`relative flex flex-col p-3.5 rounded-xl border text-left transition-all ${
                isSelected
                  ? 'bg-blue-50/80 border-blue-600 ring-2 ring-blue-600/20 text-slate-900 shadow-xs'
                  : 'bg-slate-50/60 border-slate-200 hover:bg-slate-100/80 text-slate-700'
              }`}
            >
              {isSelected && (
                <div className="absolute top-3 right-3 w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
              )}
              
              <div className="flex items-center space-x-2.5 mb-2">
                <div className={`p-2 rounded-lg ${isSelected ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                  {getIcon(profile.id)}
                </div>
                <span className="font-extrabold text-sm">{profile.name}</span>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed">
                {profile.description}
              </p>
            </button>
          );
        })}
      </div>

    </div>
  );
};
