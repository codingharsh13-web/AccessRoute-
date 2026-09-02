import React, { useState, useEffect } from 'react';
import { 
  AccessibilityProfile, 
  LocationPoint, 
  Barrier, 
  RouteData, 
  SavedPlace, 
  RecordedTrip, 
  BarrierReportPayload, 
  AIAnalysisResult 
} from './types';
import { 
  ACCESSIBILITY_PROFILES, 
  PRESET_LOCATIONS, 
  INITIAL_BARRIERS, 
  INITIAL_SAVED_PLACES, 
  INITIAL_RECORDED_TRIPS 
} from './data/mockData';
import { fetchBarriers, submitBarrierReport, calculateRoute } from './services/api';

import { Header } from './components/Header';
import { ProfileSelector } from './components/ProfileSelector';
import { RouteSearch } from './components/RouteSearch';
import { MapView } from './components/MapView';
import { RouteComparison } from './components/RouteComparison';
import { TurnByTurnNav } from './components/TurnByTurnNav';
import { NavigationBanner } from './components/NavigationBanner';
import { ExploreView } from './components/ExploreView';
import { MyTripsView } from './components/MyTripsView';
import { SavedPlacesView } from './components/SavedPlacesView';
import { BarrierReportModal } from './components/BarrierReportModal';
import { AiVisionInspector } from './components/AiVisionInspector';

import { Info, ShieldAlert, Sparkles, Navigation } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'explore' | 'trips' | 'saved' | 'profile'>('home');
  const [selectedProfile, setSelectedProfile] = useState<AccessibilityProfile>(ACCESSIBILITY_PROFILES[0]);
  
  // Origin & Destination default to NIT Delhi Academic Block -> Narela Metro
  const [origin, setOrigin] = useState<LocationPoint>(PRESET_LOCATIONS[0]);
  const [destination, setDestination] = useState<LocationPoint>(PRESET_LOCATIONS[3]);

  const [barriers, setBarriers] = useState<Barrier[]>(INITIAL_BARRIERS);
  const [recommendedRoute, setRecommendedRoute] = useState<RouteData | null>(null);
  const [fastestRoute, setFastestRoute] = useState<RouteData | null>(null);
  const [alternativeRoute, setAlternativeRoute] = useState<RouteData | null>(null);
  
  const [selectedRouteType, setSelectedRouteType] = useState<'recommended' | 'fastest' | 'alternative'>('recommended');
  const [isLoadingRoutes, setIsLoadingRoutes] = useState(false);

  // Map location picker target mode ('origin' | 'destination' | null)
  const [pickingTarget, setPickingTarget] = useState<'origin' | 'destination' | null>(null);

  // Geolocation state
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  // Active Navigation Mode session
  const [isNavigating, setIsNavigating] = useState(false);

  // Saved Places & Recorded Trips (Persisted in localStorage)
  const [savedPlaces, setSavedPlaces] = useState<SavedPlace[]>(() => {
    const local = localStorage.getItem('accessroute_saved_places');
    return local ? JSON.parse(local) : INITIAL_SAVED_PLACES;
  });

  const [recordedTrips, setRecordedTrips] = useState<RecordedTrip[]>(() => {
    const local = localStorage.getItem('accessroute_trips');
    return local ? JSON.parse(local) : INITIAL_RECORDED_TRIPS;
  });

  // Modals
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isAiInspectorOpen, setIsAiInspectorOpen] = useState(false);

  // Persist local state
  useEffect(() => {
    localStorage.setItem('accessroute_saved_places', JSON.stringify(savedPlaces));
  }, [savedPlaces]);

  useEffect(() => {
    localStorage.setItem('accessroute_trips', JSON.stringify(recordedTrips));
  }, [recordedTrips]);

  // Load backend barriers
  useEffect(() => {
    fetchBarriers().then((data) => setBarriers(data));
  }, []);

  // Recalculate routes on origin/destination/profile update
  useEffect(() => {
    let isMounted = true;
    setIsLoadingRoutes(true);

    calculateRoute(origin, destination, selectedProfile.id)
      .then((routes: any) => {
        if (isMounted) {
          setRecommendedRoute(routes.recommendedRoute || routes.accessibleRoute);
          setFastestRoute(routes.fastestRoute || routes.standardRoute);
          setAlternativeRoute(routes.alternativeRoute || routes.accessibleRoute);
          setIsLoadingRoutes(false);
        }
      })
      .catch((err) => {
        console.error('Route calculation error:', err);
        if (isMounted) setIsLoadingRoutes(false);
      });

    return () => {
      isMounted = false;
    };
  }, [origin, destination, selectedProfile]);

  // Handle setting location via Map click
  const handleMapClickLocation = (lat: number, lng: number) => {
    if (pickingTarget === 'origin') {
      setOrigin({
        id: `loc_map_${Date.now()}`,
        name: `Map Pick (${lat.toFixed(3)}, ${lng.toFixed(3)})`,
        category: 'landmark',
        lat: Number(lat.toFixed(5)),
        lng: Number(lng.toFixed(5)),
        address: `Selected point on map (${lat.toFixed(5)}, ${lng.toFixed(5)})`,
      });
      setPickingTarget(null);
    } else if (pickingTarget === 'destination') {
      setDestination({
        id: `loc_map_${Date.now()}`,
        name: `Map Pick (${lat.toFixed(3)}, ${lng.toFixed(3)})`,
        category: 'landmark',
        lat: Number(lat.toFixed(5)),
        lng: Number(lng.toFixed(5)),
        address: `Selected point on map (${lat.toFixed(5)}, ${lng.toFixed(5)})`,
      });
      setPickingTarget(null);
    }
  };

  // Geolocation handling
  const handleUseCurrentLocation = () => {
    if ('geolocation' in navigator) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setIsLocating(false);
          const currentPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserLocation(currentPos);
          setOrigin({
            id: 'loc_current_user',
            name: 'My Current Location',
            category: 'transit',
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            address: `Lat: ${pos.coords.latitude.toFixed(4)}, Lng: ${pos.coords.longitude.toFixed(4)}`,
          });
        },
        (err) => {
          setIsLocating(false);
          alert('Location permission denied or unavailable. You can manually pick locations from the dropdown or map.');
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
    }
  };

  const handleSwapLocations = () => {
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
  };

  const handleBarrierSubmitted = async (payload: BarrierReportPayload) => {
    const created = await submitBarrierReport(payload);
    setBarriers((prev) => [created, ...prev]);
    // Recalculate routes
    const routes: any = await calculateRoute(origin, destination, selectedProfile.id);
    setRecommendedRoute(routes.recommendedRoute || routes.accessibleRoute);
    setFastestRoute(routes.fastestRoute || routes.standardRoute);
    setAlternativeRoute(routes.alternativeRoute || routes.accessibleRoute);
  };

  const handleApplyAiBarrierFromInspector = (analysis: AIAnalysisResult, photoUrl: string) => {
    handleBarrierSubmitted({
      title: analysis.detectedType,
      category: analysis.recommendedCategory,
      severity: analysis.severity,
      lat: (origin.lat + destination.lat) / 2 + 0.001,
      lng: (origin.lng + destination.lng) / 2 + 0.001,
      description: analysis.hazardDescription,
      photoUrl,
      aiAnalysis: analysis,
    });
  };

  // End navigation session & save recorded journey
  const handleEndNavigationSession = (distanceMeters: number, durationMinutes: number) => {
    setIsNavigating(false);
    const activeRoute = selectedRouteType === 'recommended' ? recommendedRoute : selectedRouteType === 'fastest' ? fastestRoute : alternativeRoute;
    
    const newTrip: RecordedTrip = {
      id: `trip_${Date.now()}`,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      startTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      endTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      origin,
      destination,
      distanceMeters,
      durationMinutes,
      profileId: selectedProfile.id,
      accessibilityScore: activeRoute ? activeRoute.accessibilityScore : 94,
      routeType: selectedRouteType,
      coordinates: activeRoute ? activeRoute.coordinates : [],
    };

    setRecordedTrips((prev) => [newTrip, ...prev]);
    alert(`🎉 Journey Complete! Saved to My Trips (${(distanceMeters / 1000).toFixed(2)} km in ${durationMinutes} min).`);
  };

  const activeRoute = selectedRouteType === 'recommended' ? recommendedRoute : selectedRouteType === 'fastest' ? fastestRoute : alternativeRoute;

  return (
    <div className="min-h-screen flex flex-col font-sans bg-slate-50 text-slate-900">
      
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        activeProfile={selectedProfile}
        onOpenReportModal={() => setIsReportModalOpen(true)}
        onOpenAiInspector={() => setIsAiInspectorOpen(true)}
        onUseCurrentLocation={handleUseCurrentLocation}
        isLocating={isLocating}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* VIEW 1: HOME ROUTE PLANNER */}
        {activeTab === 'home' && (
          <div className="space-y-6">
            
            {/* Step 1: Profile Selector */}
            <ProfileSelector
              selectedProfile={selectedProfile}
              onSelectProfile={setSelectedProfile}
            />

            {/* Step 2: Route Search */}
            <RouteSearch
              origin={origin}
              destination={destination}
              onSelectOrigin={setOrigin}
              onSelectDestination={setDestination}
              onSwap={handleSwapLocations}
              onCalculate={() => calculateRoute(origin, destination, selectedProfile.id)}
              isLoading={isLoadingRoutes}
              userLocation={userLocation}
              savedPlaces={savedPlaces}
              pickingTarget={pickingTarget}
              onTogglePickOnMap={setPickingTarget}
            />

            {/* Navigation Session Active Banner */}
            {isNavigating && activeRoute && (
              <NavigationBanner
                route={activeRoute}
                activeProfile={selectedProfile}
                onEndNavigation={handleEndNavigationSession}
              />
            )}

            {/* Main Split View: Left (Evaluations & Turn Guidance) / Right (Map) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Left Column */}
              <div className="lg:col-span-6 space-y-6">
                
                {recommendedRoute && fastestRoute && alternativeRoute && (
                  <RouteComparison
                    recommendedRoute={recommendedRoute}
                    fastestRoute={fastestRoute}
                    alternativeRoute={alternativeRoute}
                    selectedProfile={selectedProfile}
                    selectedRouteType={selectedRouteType}
                    onSelectRouteType={setSelectedRouteType}
                    onStartNavigation={() => setIsNavigating(true)}
                  />
                )}

                {activeRoute && (
                  <TurnByTurnNav
                    route={activeRoute}
                  />
                )}

              </div>

              {/* Right Column: Map View */}
              <div className="lg:col-span-6 sticky top-20">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Navigation className="w-4 h-4 text-blue-600" />
                    AccessRoute Map & Barrier Overlay
                  </h3>
                  <span className="text-xs font-semibold text-slate-500">
                    {barriers.length} Active Barrier Pins
                  </span>
                </div>

                <MapView
                  origin={origin}
                  destination={destination}
                  barriers={barriers}
                  recommendedRoute={recommendedRoute}
                  fastestRoute={fastestRoute}
                  alternativeRoute={alternativeRoute}
                  selectedRouteType={selectedRouteType}
                  onSelectRouteType={setSelectedRouteType}
                  userLocation={userLocation}
                  onMapClickLocation={handleMapClickLocation}
                />
              </div>

            </div>

          </div>
        )}

        {/* VIEW 2: EXPLORE ACCESSIBLE PLACES */}
        {activeTab === 'explore' && (
          <ExploreView
            onSelectOrigin={(loc) => { setOrigin(loc); setActiveTab('home'); }}
            onSelectDestination={(loc) => { setDestination(loc); setActiveTab('home'); }}
          />
        )}

        {/* VIEW 3: MY TRIPS / JOURNEY HISTORY */}
        {activeTab === 'trips' && (
          <MyTripsView
            trips={recordedTrips}
            onSelectTripToReplay={(trip) => {
              setOrigin(trip.origin);
              setDestination(trip.destination);
              setActiveTab('home');
            }}
            onDeleteTrip={(id) => setRecordedTrips((prev) => prev.filter((t) => t.id !== id))}
          />
        )}

        {/* VIEW 4: SAVED PLACES */}
        {activeTab === 'saved' && (
          <SavedPlacesView
            savedPlaces={savedPlaces}
            onAddSavedPlace={(place) => setSavedPlaces((prev) => [place, ...prev])}
            onDeleteSavedPlace={(id) => setSavedPlaces((prev) => prev.filter((p) => p.id !== id))}
            onSelectDestination={(loc) => { setDestination(loc); setActiveTab('home'); }}
          />
        )}

        {/* VIEW 5: ACCESSIBILITY PROFILE SETTINGS */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs max-w-2xl mx-auto space-y-4">
            <h2 className="text-lg font-extrabold text-slate-900">Active Profile Parameters</h2>
            <ProfileSelector
              selectedProfile={selectedProfile}
              onSelectProfile={setSelectedProfile}
            />
            <div className="p-4 rounded-xl bg-slate-50 text-xs text-slate-600 space-y-2 border border-slate-200">
              <span className="font-bold text-slate-800 block">Current Mobility Thresholds:</span>
              <div>• Maximum Slope Grade: <span className="font-bold text-blue-600">{selectedProfile.maxSlopeDegrees}°</span></div>
              <div>• Avoid Stairs: <span className="font-bold text-blue-600">{selectedProfile.avoidStairs ? 'Yes (Mandatory Step-Free)' : 'No (Tolerates Handrail Steps)'}</span></div>
              <div>• Audio Voice Guidance: <span className="font-bold text-blue-600">{selectedProfile.audioVoiceGuidance ? 'Enabled (SpeechSynthesis)' : 'Disabled'}</span></div>
              <div>• Haptic Vibrations: <span className="font-bold text-blue-600">{selectedProfile.hapticFeedback ? 'Enabled' : 'Disabled'}</span></div>
            </div>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-slate-200 py-6 bg-white text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="font-extrabold text-slate-900">AccessRoute</span>
            <span>— Navigate without barriers</span>
          </div>
          <p className="text-slate-400">
            AccessRoute Prototype • Universal Accessible Path Navigation
          </p>
        </div>
      </footer>

      {/* Modals */}
      <BarrierReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onSubmitted={handleBarrierSubmitted}
        currentLat={origin.lat}
        currentLng={origin.lng}
      />

      <AiVisionInspector
        isOpen={isAiInspectorOpen}
        onClose={() => setIsAiInspectorOpen(false)}
        onApplyAsBarrier={handleApplyAiBarrierFromInspector}
      />

    </div>
  );
}

export default App;
