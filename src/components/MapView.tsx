import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import L from 'leaflet';
import { LocationPoint, Barrier, RouteData } from '../types';
import { Info, Navigation, Search } from 'lucide-react';

// NIT Delhi campus center
const NIT_DELHI_CENTER = { lat: 28.8433, lng: 77.1055 };

interface MapViewProps {
  origin: LocationPoint;
  destination: LocationPoint;
  barriers: Barrier[];
  recommendedRoute: RouteData | null;
  fastestRoute: RouteData | null;
  alternativeRoute: RouteData | null;
  selectedRouteType: 'recommended' | 'fastest' | 'alternative';
  onSelectRouteType: (type: 'recommended' | 'fastest' | 'alternative') => void;
  userLocation: { lat: number; lng: number } | null;
  onMapClickLocation?: (lat: number, lng: number) => void;
}

// Singleton loader so the API is only loaded once across hot-reloads
let googleMapsLoaderPromise: Promise<typeof google> | null = null;

function getGoogleMapsLoader(apiKey: string): Promise<typeof google> {
  if (!googleMapsLoaderPromise) {
    const loader = new Loader({
      apiKey,
      version: 'weekly',
      libraries: ['places', 'geometry'],
    });
    googleMapsLoaderPromise = loader.load();
  }
  return googleMapsLoaderPromise;
}

// Convert [lat,lng][] route coordinates to Google LatLngLiteral[]
function coordsToLatLng(coords: [number, number][]): google.maps.LatLngLiteral[] {
  return coords.map(([lat, lng]) => ({ lat, lng }));
}

// Make a coloured circle SVG data-URL for markers
function circleSvgUrl(label: string, fill: string, size = 34): string {
  const fs = Math.round(size * 0.42);
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">` +
    `<circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 2}" fill="${fill}" stroke="white" stroke-width="3"/>` +
    `<text x="${size / 2}" y="${size / 2 + fs * 0.37}" text-anchor="middle" font-size="${fs}" font-weight="800" fill="white" font-family="system-ui">${label}</text>` +
    `</svg>`
  )}`;
}

// Make a rounded-square SVG for barrier markers
function barrierSvgUrl(fill: string): string {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30">` +
    `<rect x="2" y="2" width="26" height="26" rx="7" fill="${fill}" stroke="white" stroke-width="2"/>` +
    `<text x="15" y="21" text-anchor="middle" font-size="15">⚠️</text>` +
    `</svg>`
  )}`;
}

// Leaflet helpers (used for the no-key fallback)
function makePinHTML(label: string, bg: string, size = 32): string {
  return `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${bg};border:3px solid white;box-shadow:0 4px 12px rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;color:white;font-weight:800;font-size:${Math.round(size * 0.42)}px;font-family:system-ui,sans-serif;pointer-events:none;">${label}</div>`;
}

export const MapView: React.FC<MapViewProps> = ({
  origin,
  destination,
  barriers,
  recommendedRoute,
  fastestRoute,
  alternativeRoute,
  selectedRouteType,
  onSelectRouteType,
  userLocation,
  onMapClickLocation,
}) => {
  const apiKey = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '').trim();
  const hasApiKey = apiKey.length > 0 && apiKey !== 'your_google_maps_api_key_here';

  // ── Google Maps refs ──
  const googleContainerRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const overlayRefs = useRef<{
    polylines: google.maps.Polyline[];
    markers: google.maps.Marker[];
    infoWindows: google.maps.InfoWindow[];
  }>({ polylines: [], markers: [], infoWindows: [] });
  const [gmapsReady, setGmapsReady] = useState(false);
  const [gmapsError, setGmapsError] = useState<string | null>(null);

  // ── Leaflet refs (fallback) ──
  const leafletContainerRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const leafletLayersRef = useRef<L.LayerGroup | null>(null);

  // Clear all Google overlay objects
  const clearOverlays = useCallback(() => {
    overlayRefs.current.polylines.forEach((p) => p.setMap(null));
    overlayRefs.current.markers.forEach((m) => m.setMap(null));
    overlayRefs.current.infoWindows.forEach((iw) => iw.close());
    overlayRefs.current = { polylines: [], markers: [], infoWindows: [] };
  }, []);

  // ─────────────────────────────────────────────────────────────
  // 1. Initialize Google Maps (runs once when apiKey is present)
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!hasApiKey) return;

    getGoogleMapsLoader(apiKey)
      .then(() => {
        if (!googleContainerRef.current || googleMapRef.current) return;

        const map = new google.maps.Map(googleContainerRef.current, {
          center: NIT_DELHI_CENTER,
          zoom: 15,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          zoomControl: true,
          zoomControlOptions: { position: google.maps.ControlPosition.RIGHT_BOTTOM },
          gestureHandling: 'greedy',
          styles: [
            { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'simplified' }] },
            { featureType: 'transit.station', elementType: 'labels', stylers: [{ visibility: 'on' }] },
          ],
        });

        googleMapRef.current = map;

        map.addListener('click', (e: google.maps.MapMouseEvent) => {
          if (e.latLng && onMapClickLocation) {
            onMapClickLocation(e.latLng.lat(), e.latLng.lng());
          }
        });

        // Wire Places SearchBox to the search <input>
        if (searchInputRef.current) {
          const sb = new google.maps.places.SearchBox(searchInputRef.current, {
            bounds: new google.maps.LatLngBounds(
              { lat: 28.82, lng: 77.08 },
              { lat: 28.87, lng: 77.13 }
            ),
          });
          sb.addListener('places_changed', () => {
            const places = sb.getPlaces();
            if (!places || places.length === 0) return;
            const place = places[0];
            if (place.geometry?.location) {
              map.panTo(place.geometry.location);
              map.setZoom(17);
            }
          });
        }

        setGmapsReady(true);
      })
      .catch((err) => {
        console.warn('[AccessRoute] Google Maps load error:', err);
        setGmapsError('Google Maps failed to load. Check your API key or network.');
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasApiKey, apiKey]);

  // ─────────────────────────────────────────────────────────────
  // 2. Re-render AccessRoute overlay on Google Maps when props change
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!gmapsReady || !googleMapRef.current) return;
    const map = googleMapRef.current;
    clearOverlays();

    const newPolylines: google.maps.Polyline[] = [];
    const newMarkers: google.maps.Marker[] = [];
    const newInfoWindows: google.maps.InfoWindow[] = [];
    const bounds = new google.maps.LatLngBounds();
    let hasBounds = false;

    // Route polylines
    const routeDefs: Array<{
      route: RouteData | null;
      type: 'recommended' | 'fastest' | 'alternative';
      color: string;
      dotted?: boolean;
      tooltip: string;
    }> = [
      { route: recommendedRoute, type: 'recommended', color: '#10B981', tooltip: '✅ AccessRoute Recommended (Step-Free 94/100)' },
      { route: fastestRoute, type: 'fastest', color: '#EF4444', dotted: true, tooltip: '⚠️ Direct Fastest Route (38 Stairs Hazard)' },
      { route: alternativeRoute, type: 'alternative', color: '#2563EB', tooltip: '🔵 Perimeter Loop (Step-Free 88/100)' },
    ];

    routeDefs.forEach(({ route, type, color, dotted, tooltip }) => {
      if (!route || route.coordinates.length === 0) return;
      const isSelected = selectedRouteType === type;
      const path = coordsToLatLng(route.coordinates);

      const poly = new google.maps.Polyline({
        path,
        geodesic: true,
        strokeColor: color,
        strokeOpacity: dotted ? 0 : (isSelected ? 0.95 : 0.35),
        strokeWeight: isSelected ? 7 : 4,
        icons: dotted
          ? [{ icon: { path: 'M 0,-1 0,1', strokeOpacity: 1, strokeColor: color, scale: isSelected ? 4 : 3 }, offset: '0', repeat: '18px' }]
          : undefined,
        map,
        clickable: true,
        zIndex: isSelected ? 10 : 5,
      });

      poly.addListener('click', () => onSelectRouteType(type));

      const iw = new google.maps.InfoWindow({ content: `<span style="font-family:system-ui;font-size:12px">${tooltip}</span>` });
      poly.addListener('mouseover', (e: google.maps.PolyMouseEvent) => {
        if (e.latLng) { iw.setPosition(e.latLng); iw.open(map); }
      });
      poly.addListener('mouseout', () => iw.close());

      path.forEach((pt) => { bounds.extend(pt); hasBounds = true; });
      newPolylines.push(poly);
      newInfoWindows.push(iw);
    });

    // Origin marker (A)
    const originPos = { lat: origin.lat, lng: origin.lng };
    const originMarker = new google.maps.Marker({
      position: originPos, map,
      title: `A: ${origin.name}`,
      icon: { url: circleSvgUrl('A', '#2563EB'), scaledSize: new google.maps.Size(34, 34), anchor: new google.maps.Point(17, 17) },
      optimized: false, zIndex: 20,
    });
    const originIW = new google.maps.InfoWindow({
      content: `<div style="font-family:system-ui;max-width:210px">
        <div style="font-weight:700;color:#2563EB">🟢 Start: ${origin.name}</div>
        <div style="font-size:11px;color:#475569;margin-top:2px">${origin.address}</div>
        ${origin.accessibleFeatures?.length ? `<div style="margin-top:4px;font-size:11px;color:#047857">♿ ${origin.accessibleFeatures.slice(0, 2).join(' • ')}</div>` : ''}
      </div>`,
    });
    originMarker.addListener('click', () => originIW.open(map, originMarker));
    bounds.extend(originPos); hasBounds = true;
    newMarkers.push(originMarker); newInfoWindows.push(originIW);

    // Destination marker (B)
    const destPos = { lat: destination.lat, lng: destination.lng };
    const destMarker = new google.maps.Marker({
      position: destPos, map,
      title: `B: ${destination.name}`,
      icon: { url: circleSvgUrl('B', '#EF4444'), scaledSize: new google.maps.Size(34, 34), anchor: new google.maps.Point(17, 17) },
      optimized: false, zIndex: 20,
    });
    const destIW = new google.maps.InfoWindow({
      content: `<div style="font-family:system-ui;max-width:210px">
        <div style="font-weight:700;color:#EF4444">🔴 Destination: ${destination.name}</div>
        <div style="font-size:11px;color:#475569;margin-top:2px">${destination.address}</div>
        ${destination.accessibleFeatures?.length ? `<div style="margin-top:4px;font-size:11px;color:#047857">♿ ${destination.accessibleFeatures.slice(0, 2).join(' • ')}</div>` : ''}
      </div>`,
    });
    destMarker.addListener('click', () => destIW.open(map, destMarker));
    bounds.extend(destPos); hasBounds = true;
    newMarkers.push(destMarker); newInfoWindows.push(destIW);

    // User location (blue dot)
    if (userLocation) {
      const userDotSvg = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24">` +
        `<circle cx="12" cy="12" r="12" fill="#06B6D4" fill-opacity="0.22"/>` +
        `<circle cx="12" cy="12" r="8" fill="#06B6D4" stroke="white" stroke-width="2.5"/>` +
        `</svg>`
      )}`;
      const userMarker = new google.maps.Marker({
        position: userLocation, map,
        title: 'Your Location',
        icon: { url: userDotSvg, scaledSize: new google.maps.Size(24, 24), anchor: new google.maps.Point(12, 12) },
        optimized: false, zIndex: 25,
      });
      const userIW = new google.maps.InfoWindow({ content: `<div style="font-family:system-ui;font-weight:700;color:#0891B2">📍 You Are Here</div>` });
      userMarker.addListener('click', () => userIW.open(map, userMarker));
      newMarkers.push(userMarker); newInfoWindows.push(userIW);
    }

    // Accessibility barrier markers
    barriers.forEach((barrier) => {
      const color = barrier.severity === 'critical' ? '#EF4444' : barrier.severity === 'moderate' ? '#F59E0B' : '#3B82F6';
      const bm = new google.maps.Marker({
        position: { lat: barrier.lat, lng: barrier.lng }, map,
        title: barrier.title,
        icon: { url: barrierSvgUrl(color), scaledSize: new google.maps.Size(30, 30), anchor: new google.maps.Point(15, 15) },
        optimized: false, zIndex: 15,
      });
      const severityLabel = barrier.severity === 'critical' ? '🔴 Critical' : barrier.severity === 'moderate' ? '🟡 Moderate' : '🔵 Low';
      const biw = new google.maps.InfoWindow({
        content: `<div style="font-family:system-ui;max-width:230px">
          <div style="font-size:10px;font-weight:700;color:${color};text-transform:uppercase;letter-spacing:.05em">${barrier.category.replace('_', ' ')} — ${severityLabel}</div>
          <div style="font-size:13px;font-weight:700;color:#0F172A;margin:3px 0">${barrier.title}</div>
          <p style="font-size:11px;color:#475569;margin:4px 0 6px">${barrier.description}</p>
          ${barrier.isPrototypeData ? `<span style="font-size:10px;background:#FEF3C7;color:#92400E;padding:1px 7px;border-radius:4px;font-weight:700;border:1px solid #FCD34D">Demo Accessibility Data</span>` : ''}
          ${barrier.photoUrl ? `<img src="${barrier.photoUrl}" style="width:100%;height:80px;object-fit:cover;border-radius:6px;margin-top:6px"/>` : ''}
        </div>`,
      });
      bm.addListener('click', () => biw.open(map, bm));
      newMarkers.push(bm); newInfoWindows.push(biw);
    });

    overlayRefs.current = { polylines: newPolylines, markers: newMarkers, infoWindows: newInfoWindows };

    if (hasBounds) map.fitBounds(bounds, { top: 60, bottom: 90, left: 40, right: 40 });
  }, [
    gmapsReady, origin, destination, barriers,
    recommendedRoute, fastestRoute, alternativeRoute,
    selectedRouteType, userLocation, clearOverlays, onSelectRouteType,
  ]);

  // ─────────────────────────────────────────────────────────────
  // 3. Leaflet fallback (only when no API key is set)
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (hasApiKey || !leafletContainerRef.current) return;

    if (!leafletMapRef.current) {
      const map = L.map(leafletContainerRef.current, {
        center: [NIT_DELHI_CENTER.lat, NIT_DELHI_CENTER.lng],
        zoom: 15,
        zoomControl: false,
      });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | AccessRoute Prototype',
        maxZoom: 19,
      }).addTo(map);
      L.control.zoom({ position: 'bottomright' }).addTo(map);
      leafletLayersRef.current = L.layerGroup().addTo(map);
      leafletMapRef.current = map;
      map.on('click', (e: L.LeafletMouseEvent) => {
        if (onMapClickLocation) onMapClickLocation(e.latlng.lat, e.latlng.lng);
      });
    }

    const map = leafletMapRef.current;
    const layers = leafletLayersRef.current;
    if (!map || !layers) return;
    layers.clearLayers();

    const makeIcon = (label: string, bg: string) =>
      L.divIcon({ className: '', html: makePinHTML(label, bg), iconSize: [32, 32], iconAnchor: [16, 16] });

    // Routes
    [
      { route: recommendedRoute, type: 'recommended' as const, color: '#10B981', tt: '✅ Recommended (Step-Free 94/100)' },
      { route: fastestRoute, type: 'fastest' as const, color: '#EF4444', dash: '8,8', tt: '⚠️ Fastest (38 Stairs)' },
      { route: alternativeRoute, type: 'alternative' as const, color: '#2563EB', tt: '🔵 Alternative (88/100)' },
    ].forEach(({ route, type, color, dash, tt }) => {
      if (!route?.coordinates.length) return;
      const sel = selectedRouteType === type;
      L.polyline(route.coordinates, { color, weight: sel ? 7 : 4, opacity: sel ? 0.95 : 0.4, dashArray: dash })
        .bindTooltip(tt).addTo(layers);
    });

    // Markers
    L.marker([origin.lat, origin.lng], { icon: makeIcon('A', '#2563EB') })
      .bindPopup(`<b>🟢 Start:</b> ${origin.name}<br/><small>${origin.address}</small>`).addTo(layers);
    L.marker([destination.lat, destination.lng], { icon: makeIcon('B', '#EF4444') })
      .bindPopup(`<b>🔴 Destination:</b> ${destination.name}<br/><small>${destination.address}</small>`).addTo(layers);

    if (userLocation) {
      L.marker([userLocation.lat, userLocation.lng], {
        icon: L.divIcon({
          className: '',
          html: `<div style="width:18px;height:18px;border-radius:50%;background:#06B6D4;border:3px solid white;box-shadow:0 0 0 6px rgba(6,182,212,.3)"></div>`,
          iconSize: [18, 18], iconAnchor: [9, 9],
        }),
      }).bindPopup('<b>📍 You Are Here</b>').addTo(layers);
    }

    barriers.forEach((barrier) => {
      const c = barrier.severity === 'critical' ? '#EF4444' : barrier.severity === 'moderate' ? '#F59E0B' : '#3B82F6';
      L.marker([barrier.lat, barrier.lng], {
        icon: L.divIcon({
          className: '',
          html: `<div style="width:28px;height:28px;border-radius:8px;background:${c};border:2px solid white;box-shadow:0 3px 10px rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center;font-size:14px">⚠️</div>`,
          iconSize: [28, 28], iconAnchor: [14, 14],
        }),
      }).bindPopup(`
        <div style="font-family:system-ui;max-width:210px">
          <div style="font-size:10px;font-weight:700;color:${c};text-transform:uppercase">${barrier.category.replace('_', ' ')} BARRIER</div>
          <div style="font-size:13px;font-weight:700;color:#0F172A;margin:2px 0">${barrier.title}</div>
          <p style="font-size:11px;color:#475569;margin:4px 0 6px">${barrier.description}</p>
          ${barrier.isPrototypeData ? `<span style="font-size:10px;background:#FEF3C7;color:#92400E;padding:1px 6px;border-radius:4px;font-weight:700">Demo Accessibility Data</span>` : ''}
        </div>`).addTo(layers);
    });

    map.fitBounds([[origin.lat, origin.lng], [destination.lat, destination.lng]], { padding: [40, 40] });
  }, [
    hasApiKey, origin, destination, barriers,
    recommendedRoute, fastestRoute, alternativeRoute,
    selectedRouteType, userLocation, onMapClickLocation,
  ]);

  // ─────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="relative w-full h-[440px] sm:h-[500px] lg:h-[560px] rounded-2xl overflow-hidden border border-slate-200 shadow-md bg-slate-100">

      {/* Google Maps container */}
      {hasApiKey && (
        <div ref={googleContainerRef} className="absolute inset-0 w-full h-full z-0" />
      )}

      {/* Leaflet fallback container */}
      {!hasApiKey && (
        <div ref={leafletContainerRef} className="absolute inset-0 w-full h-full z-0" />
      )}

      {/* Google Maps: Places search bar (top-left, only when loaded) */}
      {hasApiKey && gmapsReady && (
        <div className="absolute top-3 left-3 z-10 flex items-center gap-2 max-w-xs w-full">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search any place on map…"
              className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-white/95 backdrop-blur-md shadow-md focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
        </div>
      )}

      {/* Google Maps: AccessRoute layer badge */}
      {hasApiKey && gmapsReady && (
        <div className="absolute top-3 right-3 z-10 bg-blue-600 text-white px-2.5 py-1 rounded-lg text-[10px] font-bold shadow-md flex items-center gap-1">
          <Navigation className="w-3 h-3" />
          AccessRoute Layer
        </div>
      )}

      {/* Google Maps error */}
      {hasApiKey && gmapsError && (
        <div className="absolute top-3 left-3 right-3 z-10 bg-rose-900/90 text-white px-3 py-2 rounded-xl border border-rose-500/40 shadow-xl text-xs flex items-center gap-2">
          <Info className="w-4 h-4 text-rose-300 shrink-0" />
          {gmapsError}
        </div>
      )}

      {/* No API key warning (Leaflet mode) */}
      {!hasApiKey && (
        <div className="absolute top-3 left-3 right-3 z-10 bg-slate-900/90 backdrop-blur-md text-white px-3 py-2 rounded-xl border border-amber-500/40 shadow-xl flex items-center gap-2 text-xs">
          <Info className="w-4 h-4 text-amber-400 shrink-0" />
          <p className="text-slate-200 text-[11px] sm:text-xs">
            <span className="font-bold text-amber-300">Google Maps Unconfigured:</span>{' '}
            Set{' '}
            <code className="bg-slate-800 px-1 py-0.5 rounded text-amber-200 font-mono">VITE_GOOGLE_MAPS_API_KEY</code>
            {' '}in{' '}
            <code className="bg-slate-800 px-1 py-0.5 rounded text-amber-200 font-mono">.env</code>.
            {' '}Showing AccessRoute Prototype Map (NIT Delhi).
          </p>
        </div>
      )}

      {/* Route selector (floating bottom bar) */}
      <div className="absolute bottom-4 left-4 right-4 z-10 bg-white/95 backdrop-blur-md text-slate-800 p-1.5 rounded-xl border border-slate-200 shadow-xl flex items-center gap-1 text-xs overflow-x-auto">
        {[
          { type: 'recommended' as const, label: 'Recommended', dot: 'bg-emerald-400', active: 'bg-emerald-600' },
          { type: 'fastest' as const, label: 'Fastest (Stairs)', dot: 'bg-rose-400', active: 'bg-rose-600' },
          { type: 'alternative' as const, label: 'Alternative', dot: 'bg-blue-400', active: 'bg-blue-600' },
        ].map(({ type, label, dot, active }) => (
          <button
            key={type}
            onClick={() => onSelectRouteType(type)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap ${
              selectedRouteType === type ? `${active} text-white shadow-md` : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span className={`w-2.5 h-2.5 rounded-full ${dot} shrink-0`} />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
};

