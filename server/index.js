import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { calculateRoutes } from './routingEngine.js';
import { analyzeBarrierImage } from './aiVision.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '15mb' }));

// Initial prototype barriers store for NIT Delhi
let activeBarriers = [
  {
    id: 'bar_nitd_1',
    title: 'Unramped Staircase at Admin Block Entrance',
    category: 'stairs',
    severity: 'critical',
    lat: 28.8448,
    lng: 77.1068,
    description: 'Flight of 12 concrete steps at main entrance without side ramp. Wheelchair users must detour via West Academic Gate ramp.',
    photoUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=600&q=80',
    reportedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    upvotes: 31,
    status: 'confirmed',
    aiVerified: true,
    isPrototypeData: true,
    aiAnalysis: {
      detectedType: 'Unramped Concrete Staircase',
      confidence: 97,
      severity: 'critical',
      hazardDescription: 'Detected steep flight of 12 concrete steps lacking wheelchair ramp or chairlift.',
      featuresDetected: ['Flight of 12 steps', 'Concrete tread', 'No ramp access', 'Steel handrail present'],
      recommendedCategory: 'stairs',
      accessibilityAdvice: 'Impassable for Wheelchair & Stroller profiles. Reroute via West Entrance ramp.',
      isAiGenerated: true,
    },
  },
  {
    id: 'bar_nitd_2',
    title: 'Utility Construction Work on Access Corridor',
    category: 'construction',
    severity: 'moderate',
    lat: 28.8425,
    lng: 77.1045,
    description: 'Utility trenching narrows pedestrian walkway to 60cm with loose dirt and gravel surface.',
    photoUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=600&q=80',
    reportedAt: new Date(Date.now() - 3600000 * 6).toISOString(),
    upvotes: 14,
    status: 'confirmed',
    aiVerified: true,
    isPrototypeData: true,
  },
  {
    id: 'bar_nitd_3',
    title: 'Missing Dropped Curb Cut at Gate 2 Crossing',
    category: 'high_curb',
    severity: 'moderate',
    lat: 28.8438,
    lng: 77.1090,
    description: 'Straight 16cm vertical curb drop at main road signalized crossing without lowered ramp transition.',
    photoUrl: 'https://images.unsplash.com/photo-1584467735871-8e85353a8413?auto=format&fit=crop&w=600&q=80',
    reportedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    upvotes: 19,
    status: 'confirmed',
    aiVerified: true,
    isPrototypeData: true,
  },
  {
    id: 'bar_nitd_4',
    title: 'Broken Mezzanine Elevator at Narela Overbridge',
    category: 'broken_elevator',
    severity: 'critical',
    lat: 28.8520,
    lng: 77.0950,
    description: 'Public overbridge elevator out of service. Requires using 44-step pedestrian stair tower to cross tracks.',
    photoUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb186c572?auto=format&fit=crop&w=600&q=80',
    reportedAt: new Date(Date.now() - 3600000 * 30).toISOString(),
    upvotes: 42,
    status: 'confirmed',
    aiVerified: true,
    isPrototypeData: true,
  },
];

// 1. Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'AccessRoute Backend API',
    tagline: 'Navigate without barriers',
    demoEnvironment: 'NIT Delhi (Narela, Delhi 110040)',
    googleMapsConfigured: !!(process.env.VITE_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY),
    geminiConfigured: !!process.env.GEMINI_API_KEY,
    timestamp: new Date().toISOString(),
  });
});

// 2. Fetch active barriers
app.get('/api/barriers', (req, res) => {
  res.json({
    success: true,
    count: activeBarriers.length,
    barriers: activeBarriers,
  });
});

// 3. Submit community barrier report
app.post('/api/barriers', async (req, res) => {
  try {
    const { title, category, severity, lat, lng, description, photoBase64, photoUrl, aiAnalysis } = req.body;

    if (!lat || !lng || !category) {
      return res.status(400).json({ error: 'Location (lat, lng) and category are required.' });
    }

    const newBarrier = {
      id: `bar_${Date.now()}`,
      title: title || `${category.replace('_', ' ').toUpperCase()} Reported`,
      category,
      severity: severity || 'moderate',
      lat: Number(lat),
      lng: Number(lng),
      description: description || 'Community reported accessibility barrier.',
      photoUrl: photoUrl || photoBase64 || 'https://images.unsplash.com/photo-1584467735871-8e85353a8413?auto=format&fit=crop&w=600&q=80',
      reportedAt: new Date().toISOString(),
      upvotes: 1,
      status: 'submitted',
      aiVerified: !!aiAnalysis,
      aiAnalysis: aiAnalysis || null,
    };

    activeBarriers.unshift(newBarrier);

    res.status(201).json({
      success: true,
      message: 'Barrier report submitted successfully!',
      barrier: newBarrier,
    });
  } catch (err) {
    console.error('Error submitting barrier:', err);
    res.status(500).json({ error: 'Failed to save barrier report.' });
  }
});

// 4. Calculate routes (Recommended, Fastest, Alternative)
app.post('/api/routes/calculate', (req, res) => {
  try {
    const { origin, destination, profileId = 'wheelchair' } = req.body;

    if (!origin || !destination) {
      return res.status(400).json({ error: 'Origin and destination points are required.' });
    }

    const routeResults = calculateRoutes(origin, destination, profileId, activeBarriers);

    res.json({
      success: true,
      profileId,
      origin,
      destination,
      routes: routeResults,
    });
  } catch (err) {
    console.error('Error calculating routes:', err);
    res.status(500).json({ error: 'Failed to calculate accessible route.' });
  }
});

// 5. AI Vision Barrier Analysis endpoint
app.post('/api/ai/analyze-image', async (req, res) => {
  try {
    const { imageBase64, mimeType } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'imageBase64 field is required.' });
    }

    const analysisResult = await analyzeBarrierImage(imageBase64, mimeType || 'image/jpeg');

    res.json({
      success: true,
      analysis: analysisResult,
    });
  } catch (err) {
    console.error('AI Vision endpoint error:', err);
    res.status(500).json({ error: 'Image analysis failed.' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Express Unhandled Error:', err);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 AccessRoute Backend API running on http://localhost:${PORT}`);
  });
}

export default app;
