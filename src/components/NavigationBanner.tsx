import React, { useState, useEffect } from 'react';
import { RouteData, AccessibilityProfile } from '../types';
import { Navigation, Volume2, VolumeX, AlertTriangle, CheckCircle2, Square, ChevronRight, Bell, Activity } from 'lucide-react';

interface NavigationBannerProps {
  route: RouteData;
  activeProfile: AccessibilityProfile;
  onEndNavigation: (distanceMeters: number, durationMinutes: number) => void;
}

export const NavigationBanner: React.FC<NavigationBannerProps> = ({
  route,
  activeProfile,
  onEndNavigation,
}) => {
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [voiceEnabled, setVoiceEnabled] = useState(activeProfile.audioVoiceGuidance);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const currentStep = route.steps[currentStepIdx] || route.steps[0];

  // Journey timer
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Speak instruction when step changes or voice enabled
  useEffect(() => {
    if (voiceEnabled && currentStep && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const textToSpeak = currentStep.spokenInstruction || currentStep.instruction;
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.rate = 0.95;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);

      // Trigger haptic vibration for visual/hearing impaired mode
      if (activeProfile.hapticFeedback && 'vibrate' in navigator) {
        navigator.vibrate([100, 50, 100]);
      }
    }
  }, [currentStepIdx, voiceEnabled, currentStep, activeProfile]);

  const toggleVoice = () => {
    if (voiceEnabled) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
    setVoiceEnabled(!voiceEnabled);
  };

  const handleNextStep = () => {
    if (currentStepIdx < route.steps.length - 1) {
      setCurrentStepIdx((prev) => prev + 1);
    } else {
      // Arrived!
      const totalMinutes = Math.max(1, Math.round(elapsedSeconds / 60));
      onEndNavigation(route.totalDistanceMeters, totalMinutes);
    }
  };

  const minutesFormatted = Math.floor(elapsedSeconds / 60);
  const secondsFormatted = (elapsedSeconds % 60).toString().padStart(2, '0');

  return (
    <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-xl border border-slate-800 space-y-4 animate-fade-in">
      
      {/* Top Session Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping"></div>
          <span className="font-extrabold text-xs text-emerald-400 uppercase tracking-wider flex items-center gap-1">
            <Activity className="w-3.5 h-3.5" /> Navigation Active • Recording Journey
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {/* Timer Display */}
          <span className="font-mono font-bold text-xs text-slate-300 bg-slate-800 px-2.5 py-1 rounded-lg">
            ⏱️ {minutesFormatted}:{secondsFormatted}
          </span>

          {/* Voice Guidance Toggle */}
          <button
            onClick={toggleVoice}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 ${
              voiceEnabled
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
            title="Toggle Voice Turn Announcements"
          >
            {voiceEnabled ? <Volume2 className="w-3.5 h-3.5 text-blue-200" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{voiceEnabled ? 'Voice On' : 'Mute Voice'}</span>
          </button>
        </div>
      </div>

      {/* Main Next Maneuver Banner */}
      <div className="flex items-start justify-between gap-3 p-3 bg-slate-950/80 rounded-xl border border-slate-800">
        <div className="flex items-start space-x-3">
          <div className="p-3 rounded-xl bg-blue-600 text-white font-extrabold text-lg shrink-0">
            {currentStep.stepNumber}
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-blue-400 tracking-wider">Next Instruction ({currentStepIdx + 1} of {route.steps.length})</span>
            <h3 className="font-extrabold text-base sm:text-lg text-white leading-snug">
              {currentStep.instruction}
            </h3>
            {currentStep.spokenInstruction && (
              <p className="text-xs text-slate-400 mt-1 italic flex items-center gap-1">
                🗣️ "{currentStep.spokenInstruction}"
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Hazard Warning Banner */}
      {currentStep.hazardWarning && (
        <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-200 text-xs font-bold flex items-center space-x-2">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{currentStep.hazardWarning}</span>
        </div>
      )}

      {/* Bottom Progress Controls */}
      <div className="flex items-center justify-between pt-1">
        <button
          onClick={() => onEndNavigation(route.totalDistanceMeters, Math.max(1, Math.round(elapsedSeconds / 60)))}
          className="px-3.5 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 font-bold text-xs flex items-center space-x-1.5 transition-colors"
        >
          <Square className="w-3.5 h-3.5 fill-rose-300" />
          <span>End Navigation & Save Trip</span>
        </button>

        <button
          onClick={handleNextStep}
          className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs sm:text-sm flex items-center space-x-1.5 shadow-lg shadow-emerald-600/30 transition-all"
        >
          <span>{currentStepIdx < route.steps.length - 1 ? 'Next Step' : 'Finish Trip'}</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
};

