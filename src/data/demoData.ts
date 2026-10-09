import type {
  CropRecResponse,
  FarmRecordsResponse,
  ForecastResponse,
  PlantingPlanResponse,
  SoilReadingResponse
} from '../components/types';

const capturedAt = '2026-10-08T22:17:59.000Z';

export const soilData: SoilReadingResponse = {
  fieldId: 'field-01',
  location: 'Limpopo, South Africa',
  overallStatus: 'low_battery',
  capturedAt,
  sensorsConnected: 1,
  sensorsTotal: 1,
  sensors: [
    {
      id: 'sensor-001',
      name: 'Field A · Main Probe',
      model: 'Meter Group 5TE (Soil Moisture + EC + Temp)',
      zone: 'North Ridge',
      status: 'connected',
      batteryPercent: 84,
      signalStrength: 72,
      lastSyncAt: capturedAt,
      supportedMetricKeys: ['moisture', 'temperature', 'ec'],
      values: { moisture: 42, temperature: 24.6, ec: 1.12 }
    },
  ],
  metrics: [
    { key: 'moisture', label: 'Volumetric Water Content', unit: '%', value: 42, rangeMin: 0, rangeMax: 60, fromSensorId: 'sensor-001', fromSensorName: 'Field A · Main Probe', capturedAt },
    { key: 'temperature', label: 'Soil Temperature', unit: '°C', value: 24.6, rangeMin: -10, rangeMax: 60, fromSensorId: 'sensor-001', fromSensorName: 'Field A · Main Probe', capturedAt },
    { key: 'ec', label: 'Electrical Conductivity', unit: 'mS/cm', value: 1.12, rangeMin: 0, rangeMax: 10, fromSensorId: 'sensor-001', fromSensorName: 'Field A · Main Probe', capturedAt }
  ],
  legacyCompat: { moisture: 42, temperature: 24.6, ph: null, nitrogen: null, phosphorus: null, potassium: null },
  availableMetricKeys: ['moisture', 'temperature', 'ec']
};

export const weatherData: ForecastResponse = {
  location: 'Limpopo, ZA',
  source: 'CropCue seasonal forecast',
  days: [
    { date: '2026-10-09', tempMax: 28, tempMin: 16, rainfall: 0, condition: 'Sunny' },
    { date: '2026-10-10', tempMax: 27, tempMin: 17, rainfall: 2, condition: 'Partly Cloudy' },
    { date: '2026-10-11', tempMax: 25, tempMin: 15, rainfall: 12, condition: 'Showers' },
    { date: '2026-10-12', tempMax: 24, tempMin: 14, rainfall: 18, condition: 'Rainy' },
    { date: '2026-10-13', tempMax: 26, tempMin: 15, rainfall: 3, condition: 'Cloudy' }
  ]
};

const weatherContext = 'Rainfall expected 11–12 Oct. Hold planting 1 day before rain so seeds don\'t wash away; start from 14 Oct onward — after the soil has drained for 2 days.';

export const cropRecommendations: CropRecResponse = {
  basedOnMetricKeys: soilData.availableMetricKeys,
  weatherContext,
  recommendations: [
    {
      crop: 'Maize (White Corn)', suitability: 'High', bestPlanting: '15 Oct – 5 Nov (after rains settle)',
      why: 'Fits 10-day warm weather window · moisture 42% · pH 6.4 · N 38 ppm · rain window 11–12 Oct factored in',
      weatherNotes: 'Maize seeds wash out easily in heavy rain. Delay sowing until 2 days after the 11–12 Oct showers — that puts you in the 15–25 Oct sweet spot.',
      companions: ['Pumpkin', 'Beans'], avoidInRotation: ['Sorghum'], caveats: 'Nitrogen is borderline — add compost pre-sow.'
    },
    {
      crop: 'Butternut Squash', suitability: 'High', bestPlanting: '20 Oct – 10 Nov',
      why: 'Potassium profile supports fruiting · moisture 42% · pH 6.4 · N 38 ppm · rain window 11–12 Oct factored in',
      weatherNotes: 'Butternut hates cold wet seedbeds. Wait until 20 Oct — 9 days after the big rains — so the mounds warm up and drain well.',
      companions: ['Corn', 'Radish'], avoidInRotation: ['Melons'], caveats: null
    },
    {
      crop: 'Spinach', suitability: 'Medium', bestPlanting: '14 Oct – 25 Oct',
      why: 'Cooler window suits leafy growth · moisture 42% · pH 6.4 · N 38 ppm · rain window 11–12 Oct factored in',
      weatherNotes: 'Spinach can take a light rain but hates being pounded. Plant from 14 Oct (2 days after the last heavy shower) — the cooler days that follow will suit leafy growth.',
      companions: ['Strawberry', 'Onion'], avoidInRotation: ['Beetroot'], caveats: 'N low for leafy greens — side-dress at 4 weeks.'
    }
  ]
};

export const farmRecords: FarmRecordsResponse = {
  history: [
    { season: '2025/26', crop: 'Maize', planted: '2025-11-02', harvested: '2026-04-18', yieldKg: 2480, notes: 'Late rain reduced final yield' },
    { season: '2025/26', crop: 'Spinach', planted: '2025-09-10', harvested: '2025-12-04', yieldKg: 620, notes: 'Good rotation with previous beans' },
    { season: '2024/25', crop: 'Beans', planted: '2024-10-22', harvested: '2025-02-11', yieldKg: 540, notes: 'Companion with pumpkin worked well' }
  ],
  rotationSuggestion: 'Consider legumes (beans / cowpeas) next to restore nitrogen — especially after this season\'s maize.'
};

export const plantingPlan: PlantingPlanResponse = {
  weatherContext,
  plan: [
    { week: '19–25 Oct', action: 'Apply compost / manure to Field A', crop: null, note: 'Apply compost this week — ahead of the 11–12 Oct rains so the moisture releases nutrients. Target 40 ppm available N baseline.' },
    { week: '26 Oct – 1 Nov', action: 'Plant Maize (row spacing 75 cm)', crop: 'Maize', note: 'Plant maize from 14 Oct onward — 2 days after the heavy rains end so seeds don\'t wash out. Row spacing 75 cm.' },
    { week: '2–8 Nov', action: 'Plant Butternut between maize rows', crop: 'Butternut', note: 'Butternut hates cold wet mounds — delay into this week (well after 11–12 Oct) so the soil warms back up. Plant between maize rows for ground cover.' },
    { week: '9–15 Nov', action: 'Moisture check via sensor-001 + top-dress', crop: null, note: 'After the recent rains, first check that sensor-001 moisture is trending back below 65% before top-dressing N. If < 30% for 48h, irrigate lightly.' }
  ]
};
