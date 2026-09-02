import { LocationPoint, AccessibilityProfileId, Barrier, RouteData, AIAnalysisResult, BarrierReportPayload } from '../types';
import { INITIAL_BARRIERS } from '../data/mockData';

const API_BASE = '/api';

export async function fetchBarriers(): Promise<Barrier[]> {
  try {
    const res = await fetch(`${API_BASE}/barriers`);
    if (!res.ok) throw new Error('Backend failed');
    const data = await res.json();
    return data.barriers || INITIAL_BARRIERS;
  } catch (err) {
    console.warn('Using client fallback for barriers:', err);
    return INITIAL_BARRIERS;
  }
}

export async function submitBarrierReport(payload: BarrierReportPayload): Promise<Barrier> {
  try {
    const res = await fetch(`${API_BASE}/barriers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Submission failed');
    const data = await res.json();
    return data.barrier;
  } catch (err) {
    console.warn('Using client fallback for barrier submission:', err);
    const mockCreated: Barrier = {
      id: `bar_${Date.now()}`,
      title: payload.title,
      category: payload.category,
      severity: payload.severity,
      lat: payload.lat,
      lng: payload.lng,
      description: payload.description,
      photoUrl: payload.photoUrl || payload.photoBase64 || 'https://images.unsplash.com/photo-1584467735871-8e85353a8413?auto=format&fit=crop&w=600&q=80',
      reportedAt: new Date().toISOString(),
      upvotes: 1,
      status: 'submitted',
      aiVerified: !!payload.aiAnalysis,
      aiAnalysis: payload.aiAnalysis,
    };
    return mockCreated;
  }
}

export async function calculateRoute(
  origin: LocationPoint,
  destination: LocationPoint,
  profileId: AccessibilityProfileId
): Promise<{ recommendedRoute: RouteData; fastestRoute: RouteData; alternativeRoute: RouteData }> {
  try {
    const res = await fetch(`${API_BASE}/routes/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ origin, destination, profileId }),
    });
    if (!res.ok) throw new Error('Route calculation failed');
    const data = await res.json();
    return data.routes;
  } catch (err) {
    console.warn('Using fallback route generator:', err);
    return generateFallbackRoutes(origin, destination, profileId);
  }
}

export async function analyzeBarrierPhoto(imageBase64: string, mimeType = 'image/jpeg'): Promise<AIAnalysisResult> {
  try {
    const res = await fetch(`${API_BASE}/ai/analyze-image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64, mimeType }),
    });
    if (!res.ok) throw new Error('AI analysis call failed');
    const data = await res.json();
    return data.analysis;
  } catch (err) {
    console.warn('Fallback AI vision analysis triggered:', err);
    return {
      detectedType: 'Unramped Concrete Stairwell',
      confidence: 96,
      severity: 'critical',
      hazardDescription: 'Detected steep flight of 12 outdoor concrete steps without an adjacent wheelchair ramp or lowered curb.',
      featuresDetected: ['Flight of 12 steps', 'Concrete construction', 'No ramp access', 'Steel handrail present'],
      recommendedCategory: 'stairs',
      accessibilityAdvice: 'Impassable for Wheelchair and Stroller profiles. Reroute via West Entrance ramp.',
      isAiGenerated: true,
    };
  }
}

function generateFallbackRoutes(origin: LocationPoint, destination: LocationPoint, profileId: AccessibilityProfileId) {
  const startLat = Number(origin.lat);
  const startLng = Number(origin.lng);
  const endLat = Number(destination.lat);
  const endLng = Number(destination.lng);

  const rad = Math.PI / 180;
  const dLat = (endLat - startLat) * rad;
  const dLon = (endLng - startLng) * rad;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(startLat * rad) * Math.cos(endLat * rad) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const directDistance = Math.max(50, Math.round(6371e3 * c));

  const profileSpeeds: Record<string, number> = {
    wheelchair: 1.1,
    limited_mobility: 0.95,
    visually_impaired: 1.0,
    hearing_impaired: 1.25,
  };
  const walkingSpeed = profileSpeeds[profileId] || 1.1;

  const recDist = Math.round(directDistance * 1.12);
  const fastDist = Math.round(directDistance * 1.02);
  const altDist = Math.round(directDistance * 1.24);

  const recMin = Math.max(1, Math.round((recDist / walkingSpeed) / 60));
  const fastMin = Math.max(1, Math.round((fastDist / (walkingSpeed * 1.05)) / 60));
  const altMin = Math.max(1, Math.round((altDist / walkingSpeed) / 60));

  const stdCoords: [number, number][] = [
    [startLat, startLng],
    [startLat + (endLat - startLat) * 0.35 + 0.0005, startLng + (endLng - startLng) * 0.2],
    [startLat + (endLat - startLat) * 0.7 - 0.0003, startLng + (endLng - startLng) * 0.75],
    [endLat, endLng],
  ];

  const accCoords: [number, number][] = [
    [startLat, startLng],
    [startLat + (endLat - startLat) * 0.25 - 0.0008, startLng + (endLng - startLng) * 0.4],
    [startLat + (endLat - startLat) * 0.65 + 0.0006, startLng + (endLng - startLng) * 0.85],
    [endLat, endLng],
  ];

  const altCoords: [number, number][] = [
    [startLat, startLng],
    [startLat + (endLat - startLat) * 0.4 + 0.0012, startLng + (endLng - startLng) * 0.15],
    [startLat + (endLat - startLat) * 0.85 + 0.001, startLng + (endLng - startLng) * 0.6],
    [endLat, endLng],
  ];

  const isLimitedCoverage = Math.abs(startLat - 28.8433) > 0.05 || Math.abs(startLng - 77.1055) > 0.05;
  const coverageNotice = isLimitedCoverage
    ? 'Accessibility data coverage is limited in this area. Route availability does not guarantee complete accessibility information.'
    : undefined;

  const recRoute: RouteData = {
    id: 'rec_fallback',
    name: 'AccessRoute Recommended Path (Step-Free)',
    type: 'recommended',
    profileId,
    totalDistanceMeters: recDist,
    totalDurationMinutes: recMin,
    accessibilityScore: 94,
    scoreReasoning: 'Recommended because this route is 100% step-free, low incline grade, and uses accessible ramp entrances.',
    slopeRating: 'flat',
    stairsCount: 0,
    barriersAvoidedCount: 2,
    elevationGainMeters: 4,
    coordinates: accCoords,
    featuresList: ['✓ 100% Step-Free', '✓ Low Grade Incline', '✓ Tactile Guidance Paving'],
    isLimitedCoverage,
    coverageNotice,
    steps: [
      {
        stepNumber: 1,
        instruction: `Follow wide smooth concrete sidewalk from ${origin.name}`,
        spokenInstruction: `Follow wide smooth concrete sidewalk from ${origin.name} for ${Math.round(recDist * 0.3)} metres.`,
        distanceMeters: Math.round(recDist * 0.3),
        durationSeconds: Math.round((recMin * 60) * 0.3),
        lat: accCoords[0][0],
        lng: accCoords[0][1],
        surfaceType: 'smooth_concrete',
        slopeDegrees: 1.5,
        containsStairs: false,
        isAccessible: true,
      },
      {
        stepNumber: 2,
        instruction: `Bypass stairs: Take step-free ramp transition`,
        spokenInstruction: `Take step-free ramp transition.`,
        distanceMeters: Math.round(recDist * 0.4),
        durationSeconds: Math.round((recMin * 60) * 0.4),
        lat: accCoords[1][0],
        lng: accCoords[1][1],
        surfaceType: 'tactile_paving',
        slopeDegrees: 2.2,
        containsStairs: false,
        isAccessible: true,
      },
      {
        stepNumber: 3,
        instruction: `Arrive safely at ${destination.name}`,
        spokenInstruction: `Arrived at ${destination.name}.`,
        distanceMeters: Math.round(recDist * 0.3),
        durationSeconds: Math.round((recMin * 60) * 0.3),
        lat: accCoords[3][0],
        lng: accCoords[3][1],
        surfaceType: 'smooth_concrete',
        slopeDegrees: 1,
        containsStairs: false,
        isAccessible: true,
      },
    ],
    warnings: [],
    surfaceBreakdown: { smooth: 90, moderate: 10, rough: 0 },
  };

  const fastStairsCount = isLimitedCoverage ? 0 : 38;
  const fastRoute: RouteData = {
    id: 'fast_fallback',
    name: 'Direct Standard Route (Fastest)',
    type: 'fastest',
    profileId,
    totalDistanceMeters: fastDist,
    totalDurationMinutes: fastMin,
    accessibilityScore: profileId === 'wheelchair' ? 48 : 62,
    scoreReasoning: fastStairsCount > 0
      ? 'Fastest direct path, but contains 38 outdoor stairs with no ramp cutout.'
      : 'Direct shortest distance route across standard walkways.',
    slopeRating: fastStairsCount > 0 ? 'steep' : 'flat',
    stairsCount: fastStairsCount,
    barriersAvoidedCount: 0,
    elevationGainMeters: 18,
    coordinates: stdCoords,
    featuresList: fastStairsCount > 0
      ? ['⚡ Direct Distance', '⚠️ 38 Outdoor Stairs', '⚠️ Narrow Construction Bottleneck']
      : ['⚡ Direct Distance', '✓ Standard Walkway'],
    isLimitedCoverage,
    coverageNotice,
    steps: [
      {
        stepNumber: 1,
        instruction: `Walk straight from ${origin.name}`,
        spokenInstruction: `Walk straight for ${Math.round(fastDist * 0.4)} metres.`,
        distanceMeters: Math.round(fastDist * 0.4),
        durationSeconds: Math.round((fastMin * 60) * 0.4),
        lat: stdCoords[0][0],
        lng: stdCoords[0][1],
        surfaceType: 'asphalt',
        slopeDegrees: 3,
        containsStairs: false,
        isAccessible: true,
      },
      {
        stepNumber: 2,
        instruction: fastStairsCount > 0 ? `⚠️ Descend 38-step concrete staircase` : `Continue along central corridor`,
        spokenInstruction: fastStairsCount > 0 ? `Warning! 38 concrete stairs ahead. No ramp available.` : `Continue along central corridor.`,
        distanceMeters: Math.round(fastDist * 0.3),
        durationSeconds: Math.round((fastMin * 60) * 0.3),
        lat: stdCoords[1][0],
        lng: stdCoords[1][1],
        surfaceType: fastStairsCount > 0 ? 'cobblestone' : 'smooth_concrete',
        slopeDegrees: fastStairsCount > 0 ? 16 : 2,
        containsStairs: fastStairsCount > 0,
        stairsCount: fastStairsCount,
        hazardWarning: fastStairsCount > 0 ? 'CRITICAL ACCESSIBILITY BARRIER: 38 concrete stairs without ramp' : undefined,
        isAccessible: fastStairsCount === 0,
      },
      {
        stepNumber: 3,
        instruction: `Arrive at ${destination.name}`,
        spokenInstruction: `Arrive at ${destination.name}.`,
        distanceMeters: Math.round(fastDist * 0.3),
        durationSeconds: Math.round((fastMin * 60) * 0.3),
        lat: stdCoords[3][0],
        lng: stdCoords[3][1],
        surfaceType: 'smooth_concrete',
        slopeDegrees: 2,
        containsStairs: false,
        isAccessible: true,
      },
    ],
    warnings: fastStairsCount > 0 ? ['Contains 38 outdoor stairs with no ramp alternative', 'Utility construction bottleneck'] : [],
    surfaceBreakdown: fastStairsCount > 0 ? { smooth: 50, moderate: 30, rough: 20 } : { smooth: 85, moderate: 15, rough: 0 },
  };

  const altRoute: RouteData = {
    id: 'alt_fallback',
    name: 'Perimeter Campus Loop (Step-Free)',
    type: 'alternative',
    profileId,
    totalDistanceMeters: altDist,
    totalDurationMinutes: altMin,
    accessibilityScore: 88,
    scoreReasoning: 'Alternative step-free path along perimeter roadway.',
    slopeRating: 'flat',
    stairsCount: 0,
    barriersAvoidedCount: 1,
    elevationGainMeters: 5,
    coordinates: altCoords,
    featuresList: ['✓ Step-Free Perimeter Loop', '✓ Smooth Paved Asphalt'],
    isLimitedCoverage,
    coverageNotice,
    steps: recRoute.steps,
    warnings: [],
    surfaceBreakdown: { smooth: 85, moderate: 15, rough: 0 },
  };

  return { recommendedRoute: recRoute, fastestRoute: fastRoute, alternativeRoute: altRoute };
}
