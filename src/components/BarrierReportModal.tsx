import React, { useState } from 'react';
import { BarrierCategory, BarrierSeverity, BarrierReportPayload, AIAnalysisResult } from '../types';
import { analyzeBarrierPhoto } from '../services/api';
import { X, Camera, Sparkles, Upload, MapPin, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface BarrierReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitted: (payload: BarrierReportPayload) => void;
  currentLat: number;
  currentLng: number;
}

export const BarrierReportModal: React.FC<BarrierReportModalProps> = ({
  isOpen,
  onClose,
  onSubmitted,
  currentLat,
  currentLng,
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<BarrierCategory>('stairs');
  const [severity, setSeverity] = useState<BarrierSeverity>('critical');
  const [lat, setLat] = useState(currentLat);
  const [lng, setLng] = useState(currentLng);
  const [description, setDescription] = useState('');
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<AIAnalysisResult | null>(null);

  if (!isOpen) return null;

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setPhotoBase64(base64);
        setAiResult(null); // reset old AI result on new upload
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRunAiAnalysis = async () => {
    if (!photoBase64) return;
    setIsAnalyzing(true);
    try {
      const result = await analyzeBarrierPhoto(photoBase64);
      setAiResult(result);
      if (result) {
        setCategory(result.recommendedCategory);
        setSeverity(result.severity);
        setTitle(result.detectedType);
        setDescription(result.hazardDescription);
      }
    } catch (err) {
      console.error('AI Analysis failed:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitted({
      title: title || `${category.replace('_', ' ')} Hazard`,
      category,
      severity,
      lat,
      lng,
      description,
      photoBase64: photoBase64 || undefined,
      aiAnalysis: aiResult || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden my-8">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-lg bg-emerald-500 text-slate-950">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">Report Accessibility Barrier</h3>
              <p className="text-xs text-slate-400">Crowdsourced Community Hazard Network</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
          
          {/* Photo Upload & AI Scan */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
            <label className="text-xs font-bold text-slate-700 block mb-2">
              📸 Upload Barrier Photo for AI Analysis
            </label>

            {photoBase64 ? (
              <div className="relative rounded-lg overflow-hidden border border-slate-300 max-h-48">
                <img src={photoBase64} alt="Uploaded barrier" className="w-full h-44 object-cover" />
                <button
                  type="button"
                  onClick={() => { setPhotoBase64(null); setAiResult(null); }}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-900/80 text-white hover:bg-slate-900"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-emerald-500 hover:bg-emerald-50/50 transition-colors">
                <Upload className="w-8 h-8 text-slate-400 mb-1" />
                <span className="text-xs font-bold text-slate-700">Click to upload photo</span>
                <span className="text-[10px] text-slate-400">PNG, JPG up to 10MB</span>
                <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
              </label>
            )}

            {/* AI Vision Trigger Button */}
            {photoBase64 && (
              <div className="mt-3">
                <button
                  type="button"
                  onClick={handleRunAiAnalysis}
                  disabled={isAnalyzing}
                  className="w-full py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50"
                >
                  {isAnalyzing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Gemini AI Vision Scanning Photo...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-yellow-300" />
                      <span>🤖 AI Auto-Scan Photo (Auto-Fill Form)</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* AI Scan Results Display */}
            {aiResult && (
              <div className="mt-3 p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-left text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-indigo-900 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600" /> AI Detection Complete
                  </span>
                  <span className="font-extrabold text-indigo-700 bg-indigo-200/60 px-2 py-0.5 rounded-full text-[10px]">
                    {aiResult.confidence}% Confidence
                  </span>
                </div>
                <p className="font-semibold text-indigo-950">{aiResult.detectedType}</p>
                <p className="text-indigo-800 text-[11px] mt-0.5">{aiResult.hazardDescription}</p>
              </div>
            )}

          </div>

          {/* Title */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Obstacle Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Broken Elevator at Montgomery Plaza"
              className="w-full px-3 py-2 text-xs sm:text-sm font-medium rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            />
          </div>

          {/* Category & Severity Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as BarrierCategory)}
                className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                <option value="stairs">🪜 Stairs (No Ramp)</option>
                <option value="broken_elevator">🛗 Broken Elevator</option>
                <option value="blocked_ramp">🚧 Blocked Ramp</option>
                <option value="steep_incline">🏔️ Steep Incline (&gt;10%)</option>
                <option value="construction">🏗️ Construction Obstacle</option>
                <option value="high_curb">📐 High Curb Drop</option>
                <option value="uneven_pavement">🪨 Uneven Cobblestones</option>
                <option value="narrow_path">🚶 Narrow Path (&lt;80cm)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Severity Level</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as BarrierSeverity)}
                className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                <option value="critical">🔴 Critical (Impassable)</option>
                <option value="moderate">🟠 Moderate (Caution)</option>
                <option value="low">🔵 Low (Minor Lip/Vibration)</option>
              </select>
            </div>
          </div>

          {/* Location Coordinates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Latitude</label>
              <input
                type="number"
                step="0.0001"
                value={lat}
                onChange={(e) => setLat(parseFloat(e.target.value))}
                className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-300 outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Longitude</label>
              <input
                type="number"
                step="0.0001"
                value={lng}
                onChange={(e) => setLng(parseFloat(e.target.value))}
                className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-300 outline-none"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Obstacle Notes / Details</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe condition, step count, handrail status, or suggested detour..."
              className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-md shadow-emerald-600/30"
            >
              Submit Barrier Report
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
