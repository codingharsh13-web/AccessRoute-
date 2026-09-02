import React from 'react';
import { RecordedTrip, LocationPoint } from '../types';
import { History, Clock, MapPin, ShieldCheck, Play, Trash2, ArrowRight } from 'lucide-react';

interface MyTripsViewProps {
  trips: RecordedTrip[];
  onSelectTripToReplay: (trip: RecordedTrip) => void;
  onDeleteTrip: (tripId: string) => void;
}

export const MyTripsView: React.FC<MyTripsViewProps> = ({
  trips,
  onSelectTripToReplay,
  onDeleteTrip,
}) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2 text-blue-600 text-xs font-bold uppercase tracking-wider mb-1">
            <History className="w-4 h-4" /> Journey History & Recording
          </div>
          <h2 className="text-xl font-extrabold text-slate-900">My Recorded Trips</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            AccessRoute tracks active journeys only when explicitly authorized during navigation sessions.
          </p>
        </div>
        <div className="text-right">
          <span className="text-2xl font-black text-blue-600">{trips.length}</span>
          <span className="text-xs text-slate-400 font-semibold block">Trips Saved</span>
        </div>
      </div>

      {/* Trips List */}
      {trips.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center text-slate-500">
          <History className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="font-bold text-sm text-slate-800">No Recorded Trips Yet</h3>
          <p className="text-xs text-slate-400 mt-1">
            Start a navigation session on the Route Planner tab to record your first accessible journey!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {trips.map((trip) => (
            <div
              key={trip.id}
              className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs hover:border-blue-300 transition-all flex flex-col justify-between"
            >
              <div>
                {/* Top info */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-500">
                    📅 {trip.date} • {trip.startTime}
                  </span>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                      Score: {trip.accessibilityScore}/100
                    </span>
                    <button
                      onClick={() => onDeleteTrip(trip.id)}
                      className="text-slate-400 hover:text-rose-600 p-1 rounded"
                      title="Delete trip log"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Origin -> Destination */}
                <div className="space-y-2 p-3 bg-slate-50 rounded-xl mb-3 border border-slate-100">
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="text-xs font-bold text-slate-800 line-clamp-1">{trip.origin.name}</span>
                  </div>
                  <div className="pl-1 text-slate-300">│</div>
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    <span className="text-xs font-bold text-slate-800 line-clamp-1">{trip.destination.name}</span>
                  </div>
                </div>

                {/* Trip Stats */}
                <div className="grid grid-cols-3 gap-2 p-2 bg-slate-100 rounded-lg text-center text-xs mb-3 font-semibold text-slate-700">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Distance</span>
                    <span>{(trip.distanceMeters / 1000).toFixed(2)} km</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Duration</span>
                    <span>{trip.durationMinutes} min</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Mode</span>
                    <span className="capitalize">{trip.profileId.replace('_', ' ')}</span>
                  </div>
                </div>
              </div>

              {/* Replay Action */}
              <button
                onClick={() => onSelectTripToReplay(trip)}
                className="w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center space-x-1.5 shadow-sm transition-colors"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Replay Trip Route on Map</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

