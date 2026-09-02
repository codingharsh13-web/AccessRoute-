export type AccessibilityProfileId = 
  | 'wheelchair' 
  | 'limited_mobility' 
  | 'visually_impaired' 
  | 'hearing_impaired';

export interface AccessibilityProfile {
  id: AccessibilityProfileId;
  name: string;
  iconName: string;
  description: string;
  badgeText: string;
  maxSlopeDegrees: number;
  avoidStairs: boolean;
  requireRamps: boolean;
  requireTactilePaving: boolean;
  requireElevatorOverStairs: boolean;
  audioVoiceGuidance: boolean;
  visualAlertsOnly: boolean;
  hapticFeedback: boolean;
}

export interface LocationPoint {
  id: string;
  name: string;
  category: 'transit' | 'campus' | 'landmark' | 'civic' | 'medical' | 'shopping' | 'saved';
  lat: number;
  lng: number;
  address: string;
  accessibleFeatures?: string[];
  isPrototypeData?: boolean;
}

export type BarrierCategory = 
  | 'stairs' 
  | 'steep_incline' 
  | 'blocked_ramp' 
  | 'broken_elevator' 
  | 'construction' 
  | 'high_curb' 
  | 'uneven_pavement' 
  | 'narrow_path'
  | 'inaccessible_crossing'
  | 'parked_vehicle';

export type BarrierSeverity = 'critical' | 'moderate' | 'low';

export interface AIAnalysisResult {
  detectedType: string;
  confidence: number; // 0 to 100
  severity: BarrierSeverity;
  hazardDescription: string;
  featuresDetected: string[];
  recommendedCategory: BarrierCategory;
  accessibilityAdvice: string;
  isAiGenerated: boolean;
}

export interface Barrier {
  id: string;
  title: string;
  category: BarrierCategory;
  severity: BarrierSeverity;
  lat: number;
  lng: number;
  description: string;
  photoUrl?: string;
  reportedAt: string;
  upvotes: number;
  status: 'active' | 'submitted' | 'under_review' | 'confirmed' | 'resolved';
  aiVerified: boolean;
  aiAnalysis?: AIAnalysisResult;
  isPrototypeData?: boolean;
}

export interface RouteStep {
  stepNumber: number;
  instruction: string;
  spokenInstruction?: string;
  distanceMeters: number;
  durationSeconds: number;
  lat: number;
  lng: number;
  surfaceType: 'smooth_concrete' | 'asphalt' | 'cobblestone' | 'gravel' | 'brick' | 'tactile_paving';
  slopeDegrees: number;
  containsStairs: boolean;
  stairsCount?: number;
  hasElevator?: boolean;
  hazardWarning?: string;
  isAccessible: boolean;
}

export interface RouteData {
  id: string;
  name: string;
  type: 'recommended' | 'fastest' | 'alternative';
  profileId: AccessibilityProfileId;
  totalDistanceMeters: number;
  totalDurationMinutes: number;
  accessibilityScore: number; // 0-100
  scoreReasoning: string;
  slopeRating: 'flat' | 'moderate' | 'steep';
  stairsCount: number;
  barriersAvoidedCount: number;
  elevationGainMeters: number;
  coordinates: [number, number][]; // [lat, lng] array
  steps: RouteStep[];
  warnings: string[];
  featuresList: string[];
  isLimitedCoverage?: boolean;
  coverageNotice?: string | null;
  surfaceBreakdown: {
    smooth: number; // percentage
    moderate: number;
    rough: number;
  };
}

export interface SavedPlace {
  id: string;
  label: 'Home' | 'Work' | 'Campus Hostel' | 'Custom';
  customTitle?: string;
  location: LocationPoint;
  savedAt: string;
}

export interface RecordedTrip {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  origin: LocationPoint;
  destination: LocationPoint;
  distanceMeters: number;
  durationMinutes: number;
  profileId: AccessibilityProfileId;
  accessibilityScore: number;
  routeType: 'recommended' | 'fastest' | 'alternative';
  coordinates: [number, number][];
}

export interface BarrierReportPayload {
  title: string;
  category: BarrierCategory;
  severity: BarrierSeverity;
  lat: number;
  lng: number;
  description: string;
  photoBase64?: string;
  photoUrl?: string;
  aiAnalysis?: AIAnalysisResult;
}
