import React, { useState } from 'react';
import { DEMO_SAMPLE_PHOTOS } from '../data/mockData';
import { analyzeBarrierPhoto } from '../services/api';
import { AIAnalysisResult } from '../types';
import { Sparkles, X, Upload, CheckCircle2, ShieldAlert, Cpu, ArrowRight, Eye } from 'lucide-react';

interface AiVisionInspectorProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyAsBarrier?: (analysis: AIAnalysisResult, photoUrl: string) => void;
}

export const AiVisionInspector: React.FC<AiVisionInspectorProps> = ({
  isOpen,
  onClose,
  onApplyAsBarrier,
}) => {
  const [selectedSample, setSelectedSample] = useState(DEMO_SAMPLE_PHOTOS[0]);
  const [customPhoto, setCustomPhoto] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<AIAnalysisResult | null>(DEMO_SAMPLE_PHOTOS[0].presetResult);

  if (!isOpen) return null;

  const currentPhotoUrl = customPhoto || selectedSample.url;

  const handleSelectSample = async (sample: typeof DEMO_SAMPLE_PHOTOS[0]) => {
    setSelectedSample(sample);
    setCustomPhoto(null);
    setResult(sample.presetResult);
  };

  const handleCustomUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setCustomPhoto(base64);
        runAiScan(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const runAiScan = async (imageBase64?: string) => {
    setIsScanning(true);
    try {
      const imgToScan = imageBase64 || currentPhotoUrl;
      const res = await analyzeBarrierPhoto(imgToScan);
      setResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-slate-900 text-white rounded-2xl max-w-3xl w-full shadow-2xl border border-indigo-500/30 overflow-hidden my-6">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-b border-indigo-500/20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/30">
              <Cpu className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-extrabold text-lg text-white">Gemini AI Vision Barrier Analyzer</h3>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Multimodal Inference
                </span>
              </div>
              <p className="text-xs text-slate-400">Automated visual hazard audit for urban accessibility routes</p>
            </div>
          </div>

          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sandbox Content */}
        <div className="p-6 space-y-6 max-h-[82vh] overflow-y-auto custom-scrollbar">
          
          {/* Sample Preset Selector */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                Select Sample Urban Barrier Photo or Upload Custom
              </label>
              <label className="cursor-pointer text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 bg-emerald-950/60 border border-emerald-500/40 px-2.5 py-1 rounded-lg">
                <Upload className="w-3.5 h-3.5" /> Upload Custom Photo
                <input type="file" accept="image/*" onChange={handleCustomUpload} className="hidden" />
              </label>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {DEMO_SAMPLE_PHOTOS.map((sample) => {
                const isSelected = !customPhoto && selectedSample.id === sample.id;
                return (
                  <button
                    key={sample.id}
                    onClick={() => handleSelectSample(sample)}
                    className={`relative rounded-xl overflow-hidden border-2 text-left transition-all group ${
                      isSelected
                        ? 'border-indigo-400 ring-2 ring-indigo-500/40 shadow-lg'
                        : 'border-slate-800 hover:border-slate-600 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={sample.url} alt={sample.name} className="w-full h-20 object-cover group-hover:scale-105 transition-transform" />
                    <div className="p-2 bg-slate-950/90 border-t border-slate-800">
                      <span className="text-[11px] font-bold text-slate-200 line-clamp-1">{sample.name}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Photo & AI Analysis Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
            
            {/* Left: Image Preview */}
            <div className="md:col-span-5 relative rounded-2xl overflow-hidden border border-slate-700 bg-slate-950 shadow-inner">
              <img src={currentPhotoUrl} alt="Barrier visual" className="w-full h-64 object-cover" />
              
              {/* Scan Overlay Effect */}
              {isScanning && (
                <div className="absolute inset-0 bg-indigo-950/70 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-center">
                  <div className="w-10 h-10 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin mb-3"></div>
                  <span className="text-xs font-bold text-indigo-200">Gemini Vision AI Extracting Hazards...</span>
                </div>
              )}

              <div className="p-3 bg-slate-950/90 text-center border-t border-slate-800">
                <button
                  onClick={() => runAiScan()}
                  disabled={isScanning}
                  className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4 text-purple-200" />
                  <span>Re-Run Gemini AI Analysis</span>
                </button>
              </div>
            </div>

            {/* Right: AI Inspection Card */}
            <div className="md:col-span-7 space-y-3">
              {result ? (
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-indigo-500/30 shadow-xl space-y-3">
                  
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">AI Hazard Detection</span>
                      <h4 className="font-extrabold text-base text-white">{result.detectedType}</h4>
                    </div>

                    <div className="text-right">
                      <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 inline-block">
                        {result.confidence}% Match
                      </span>
                    </div>
                  </div>

                  {/* Identified Features Tags */}
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 block mb-1.5">Visual Features Identified:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {result.featuresDetected.map((feat, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-xs border border-slate-700 font-medium">
                          ✓ {feat}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Hazard Description */}
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
                    <span className="font-bold text-indigo-300 block mb-0.5">Hazard Evaluation:</span>
                    <p className="leading-relaxed">{result.hazardDescription}</p>
                  </div>

                  {/* Routing Advice */}
                  <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-500/30 text-xs text-emerald-300">
                    <span className="font-bold text-emerald-400 block mb-0.5">AccessRoute Navigation Advice:</span>
                    <p className="leading-relaxed">{result.accessibilityAdvice}</p>
                  </div>

                  {/* Apply Button */}
                  {onApplyAsBarrier && (
                    <button
                      onClick={() => {
                        onApplyAsBarrier(result, currentPhotoUrl);
                        onClose();
                      }}
                      className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-lg shadow-emerald-600/20 transition-all"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Add AI Verified Barrier to Live Map</span>
                    </button>
                  )}

                </div>
              ) : (
                <div className="p-6 text-center text-slate-400 border border-dashed border-slate-800 rounded-2xl">
                  Click "Run Gemini AI Analysis" to inspect obstacle photo.
                </div>
              )}
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

