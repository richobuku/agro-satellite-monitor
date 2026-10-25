import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5050;

app.use(cors());
app.use(express.json());

// Persistent local storage path for fields
const DATA_FILE = path.join(__dirname, 'fields_data.json');
const CONFIG_FILE = path.join(__dirname, 'config.json');

// Initialize config & fields storage
function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
    }
  } catch (_) {}
  return { apiKey: process.env.AGROMONITORING_API_KEY || '' };
}

function saveConfig(cfg) {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(cfg, null, 2));
}

function loadFields() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    }
  } catch (_) {}

  // Initial starter demo fields (e.g. Uganda Northern / Central coffee & maize plots)
  const defaultFields = [
    {
      id: 'field_demo_01',
      name: 'Gulu Maize & Soybean Block A',
      crop: 'Maize & Soybean',
      planting_date: '2026-08-10',
      area_ha: 4.85,
      area_acres: 11.98,
      center: [2.7745, 32.299],
      polyid: 'poly_gulu_demo_01',
      coordinates: [
        [32.2965, 2.7760],
        [32.3015, 2.7762],
        [32.3020, 2.7730],
        [32.2970, 2.7725],
        [32.2965, 2.7760],
      ],
      notes: 'Planted after first seasonal rains. Excellent drainage.',
      created_at: new Date(Date.now() - 60 * 86400000).toISOString(),
    },
    {
      id: 'field_demo_02',
      name: 'Lira Organic Sunflowers Field 3',
      crop: 'Sunflower',
      planting_date: '2026-08-25',
      area_ha: 2.30,
      area_acres: 5.68,
      center: [2.2472, 32.900],
      polyid: 'poly_lira_demo_02',
      coordinates: [
        [32.8980, 2.2490],
        [32.9025, 2.2485],
        [32.9018, 2.2455],
        [32.8975, 2.2460],
        [32.8980, 2.2490],
      ],
      notes: 'Flowering stage expected mid-October.',
      created_at: new Date(Date.now() - 45 * 86400000).toISOString(),
    },
    {
      id: 'field_demo_03_micro',
      name: 'Gulu Community Plot 4B (1/8 Acre Micro-Plot)',
      crop: 'Dwarf Beans & Sweet Corn',
      planting_date: '2026-09-02',
      area_ha: 0.05,
      area_acres: 0.125,
      center: [2.7752, 32.2982],
      polyid: 'poly_gulu_micro_03',
      is_micro_plot: true,
      resolution_tier: 'UAV Drone RTK (1.5 cm/px)',
      currentNdvi: 0.72,
      soilMoisture: 31,
      crop_beds: [
        { id: 'bed_1', name: 'Beds 1-3', crop: 'Sweet Corn (SC403)', spacing: '75cm x 25cm', plants: 460, health: 'Optimal' },
        { id: 'bed_2', name: 'Beds 4-7', crop: 'Bush Beans (NABE 15)', spacing: '50cm x 10cm', plants: 920, health: 'Optimal' },
        { id: 'bed_3', name: 'Beds 8-10', crop: "African Bird's Eye Chili", spacing: '60cm x 40cm', plants: 185, health: 'Flowering' }
      ],
      coordinates: [
        [32.29810, 2.77510],
        [32.29831, 2.77510],
        [32.29831, 2.77531],
        [32.29810, 2.77531],
        [32.29810, 2.77510]
      ],
      notes: '1/8th Acre high-intensity demonstration plot. Drone-mapped with centimeter RTK accuracy.',
      created_at: new Date(Date.now() - 25 * 86400000).toISOString(),
    }
  ];
  fs.writeFileSync(DATA_FILE, JSON.stringify(defaultFields, null, 2));
  return defaultFields;
}

function saveFields(fields) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(fields, null, 2));
}

// ── AGROMONITORING API HELPER ───────────────────────────────────────────────
const AGRO_BASE_URL = 'http://api.agromonitoring.com/agro/1.0';

async function fetchFromAgro(endpoint, params = {}) {
  const config = loadConfig();
  if (!config.apiKey) return null;

  const url = new URL(`${AGRO_BASE_URL}${endpoint}`);
  url.searchParams.set('appid', config.apiKey);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
  }

  const res = await fetch(url.toString());
  if (!res.ok) {
    const errText = await res.text();
    console.error(`Agro API error [${res.status}] ${endpoint}:`, errText);
    return null;
  }
  return await res.json();
}

// ── ROUTES ──────────────────────────────────────────────────────────────────

// 1. Config / API Key
app.get('/api/config', (req, res) => {
  const cfg = loadConfig();
  res.json({
    hasApiKey: !!cfg.apiKey,
    keyPreview: cfg.apiKey ? `${cfg.apiKey.slice(0, 4)}••••${cfg.apiKey.slice(-4)}` : null,
  });
});

app.post('/api/config', (req, res) => {
  const { apiKey } = req.body;
  const cfg = loadConfig();
  cfg.apiKey = (apiKey || '').trim();
  saveConfig(cfg);
  res.json({ success: true, hasApiKey: !!cfg.apiKey });
});

// 2. Fields CRUD
app.get('/api/fields', (req, res) => {
  const fields = loadFields();
  res.json(fields);
});

app.post('/api/fields', async (req, res) => {
  const { name, crop, planting_date, coordinates, area_ha, notes } = req.body;

  if (!name || !coordinates || coordinates.length < 3) {
    return res.status(400).json({ error: 'Name and valid polygon coordinates (min 3 points) are required.' });
  }

  // Ensure closed polygon ring [ [lng, lat], ..., [lng, lat] ]
  let ring = [...coordinates];
  const first = ring[0];
  const last = ring[ring.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) {
    ring.push([first[0], first[1]]);
  }

  // Calculate rough center
  const lats = ring.map(p => p[1]);
  const lngs = ring.map(p => p[0]);
  const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
  const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;

  // Try to register polygon on AgroMonitoring if API key exists
  let polyid = null;
  const config = loadConfig();
  if (config.apiKey) {
    try {
      const geoJsonPayload = {
        name,
        geo_json: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'Polygon',
            coordinates: [ring]
          }
        }
      };

      const agroRes = await fetch(`${AGRO_BASE_URL}/polygons?appid=${config.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(geoJsonPayload)
      });

      if (agroRes.ok) {
        const agroData = await agroRes.json();
        polyid = agroData.id;
        console.log(`Registered AgroMonitoring Polygon ID: ${polyid}`);
      } else {
        console.warn('AgroMonitoring polygon creation returned:', await agroRes.text());
      }
    } catch (e) {
      console.warn('Could not register polygon with AgroMonitoring:', e.message);
    }
  }

  const fields = loadFields();
  const ha = parseFloat(area_ha) || 1.0;
  const newField = {
    id: `field_${Date.now()}`,
    name,
    crop: crop || 'General Crop',
    planting_date: planting_date || new Date().toISOString().split('T')[0],
    area_ha: Math.round(ha * 100) / 100,
    area_acres: Math.round(ha * 2.47105 * 100) / 100,
    center: [centerLat, centerLng],
    polyid: polyid || `local_poly_${Date.now()}`,
    coordinates: ring,
    notes: notes || '',
    created_at: new Date().toISOString()
  };

  fields.unshift(newField);
  saveFields(fields);
  res.status(201).json(newField);
});

app.delete('/api/fields/:id', async (req, res) => {
  const { id } = req.params;
  const fields = loadFields();
  const target = fields.find(f => f.id === id);

  if (!target) return res.status(404).json({ error: 'Field not found' });

  // Delete from AgroMonitoring if registered
  const config = loadConfig();
  if (config.apiKey && target.polyid && !target.polyid.startsWith('local_') && !target.polyid.startsWith('poly_')) {
    try {
      await fetch(`${AGRO_BASE_URL}/polygons/${target.polyid}?appid=${config.apiKey}`, { method: 'DELETE' });
    } catch (_) {}
  }

  const updated = fields.filter(f => f.id !== id);
  saveFields(updated);
  res.json({ success: true, message: 'Field deleted' });
});

// 3. Satellite Imagery Timelapse & History
app.get('/api/satellite/history/:polyid', async (req, res) => {
  const { polyid } = req.params;
  const { start, end } = req.query;

  const nowSec = Math.floor(Date.now() / 1000);
  const startSec = parseInt(start, 10) || (nowSec - 60 * 86400); // 60 days
  const endSec = parseInt(end, 10) || nowSec;

  const liveData = await fetchFromAgro('/image/search', {
    polyid,
    start: startSec,
    end: endSec
  });

  if (liveData && Array.isArray(liveData) && liveData.length > 0) {
    return res.json(liveData.map(scene => ({
      dt: scene.dt,
      date: new Date(scene.dt * 1000).toISOString().split('T')[0],
      type: scene.type || 'Sentinel-2',
      clouds: Math.round(scene.cl || 0),
      coverage: Math.round((scene.dc || 1) * 100),
      image: scene.image || {},
      tile: scene.tile || {},
      stats: scene.stats || {},
      isSimulated: false
    })));
  }

  // Simulated Sentinel-2 high-fidelity time-lapse scenes for demo / offline
  const scenes = [];
  const daysStep = 5;
  for (let t = startSec; t <= endSec; t += daysStep * 86400) {
    const d = new Date(t * 1000);
    // Simulate vegetative curve peaking around 40 days after start
    const progress = (t - startSec) / (endSec - startSec || 1);
    const simulatedNdvi = Math.max(0.18, Math.min(0.85, 0.22 + Math.sin(progress * Math.PI) * 0.62 + (Math.random() * 0.04 - 0.02)));

    scenes.push({
      dt: t,
      date: d.toISOString().split('T')[0],
      type: 'Sentinel-2 L2A',
      clouds: Math.floor(Math.random() * 12),
      coverage: 100,
      simulatedNdvi: Math.round(simulatedNdvi * 100) / 100,
      image: {
        truecolor: `https://tiles.maps.eox.at/wms?service=wms&request=getmap&version=1.1.1&layers=s2cloudless-2020&styles=&format=image/jpeg`,
        ndvi: ``,
      },
      stats: {
        ndvi: simulatedNdvi,
        evi: simulatedNdvi * 0.88,
      },
      isSimulated: true
    });
  }

  res.json(scenes);
});

// 4. NDVI Historical Analytics Chart
app.get('/api/ndvi/history/:polyid', async (req, res) => {
  const { polyid } = req.params;
  const { start, end } = req.query;

  const nowSec = Math.floor(Date.now() / 1000);
  const startSec = parseInt(start, 10) || (nowSec - 90 * 86400); // 90 days
  const endSec = parseInt(end, 10) || nowSec;

  const liveStats = await fetchFromAgro('/ndvi/history', {
    polyid,
    start: startSec,
    end: endSec
  });

  if (liveStats && Array.isArray(liveStats) && liveStats.length > 0) {
    return res.json(liveStats.map(item => ({
      dt: item.dt,
      date: new Date(item.dt * 1000).toISOString().split('T')[0],
      mean: item.data?.mean ?? 0,
      max: item.data?.max ?? 0,
      min: item.data?.min ?? 0,
      median: item.data?.median ?? 0,
      std: item.data?.std ?? 0,
      isSimulated: false
    })));
  }

  // Realistic seasonal NDVI curve
  const points = [];
  for (let t = startSec; t <= endSec; t += 3 * 86400) {
    const progress = (t - startSec) / (endSec - startSec || 1);
    const base = 0.20 + Math.sin(progress * Math.PI) * 0.58;
    const noise = (Math.sin(t / 86400) * 0.03);
    const mean = Math.max(0.15, Math.min(0.88, base + noise));

    points.push({
      dt: t,
      date: new Date(t * 1000).toISOString().split('T')[0],
      mean: Math.round(mean * 1000) / 1000,
      max: Math.round(Math.min(0.92, mean + 0.08) * 1000) / 1000,
      min: Math.round(Math.max(0.08, mean - 0.09) * 1000) / 1000,
      median: Math.round(mean * 1000) / 1000,
      std: 0.045,
      isSimulated: true
    });
  }

  res.json(points);
});

// 5. Weather (Current + 5-day Forecast)
app.get('/api/weather', async (req, res) => {
  const { lat, lon } = req.query;
  const latitude = parseFloat(lat) || 2.7745;
  const longitude = parseFloat(lon) || 32.299;

  const liveWeather = await fetchFromAgro('/weather', { lat: latitude, lon: longitude });

  if (liveWeather && liveWeather.weather) {
    return res.json({
      temp: Math.round(liveWeather.main.temp - 273.15), // K -> C
      temp_feels_like: Math.round(liveWeather.main.feels_like - 273.15),
      humidity: liveWeather.main.humidity,
      pressure: liveWeather.main.pressure,
      wind_speed: liveWeather.wind.speed,
      condition: liveWeather.weather[0]?.main || 'Clear',
      description: liveWeather.weather[0]?.description || 'clear sky',
      clouds: liveWeather.clouds?.all || 0,
      isSimulated: false
    });
  }

  // High-fidelity tropical agro-climatic simulation
  res.json({
    temp: 27,
    temp_feels_like: 29,
    humidity: 72,
    pressure: 1012,
    wind_speed: 3.4,
    condition: 'Partly Cloudy',
    description: 'scattered clouds, warm with gentle breeze',
    clouds: 38,
    isSimulated: true
  });
});

app.get('/api/weather/forecast', async (req, res) => {
  const { lat, lon } = req.query;
  const latitude = parseFloat(lat) || 2.7745;
  const longitude = parseFloat(lon) || 32.299;

  const liveForecast = await fetchFromAgro('/weather/forecast', { lat: latitude, lon: longitude });

  if (liveForecast && Array.isArray(liveForecast)) {
    return res.json(liveForecast.slice(0, 10).map(item => ({
      dt: item.dt,
      date: new Date(item.dt * 1000).toLocaleString('en-US', { weekday: 'short', hour: 'numeric' }),
      temp: Math.round(item.main.temp - 273.15),
      condition: item.weather[0]?.main || 'Clouds',
      humidity: item.main.humidity,
      pop: Math.round((item.pop || 0) * 100)
    })));
  }

  // Simulated 5-day daily forecast
  const days = ['Today', 'Tomorrow', 'Day 3', 'Day 4', 'Day 5'];
  const simulated = days.map((day, idx) => ({
    date: day,
    temp_max: 28 + (idx % 3),
    temp_min: 19 + (idx % 2),
    condition: idx === 2 ? 'Rain' : idx === 3 ? 'Thunderstorm' : 'Partly Cloudy',
    precipitation_prob: idx === 2 ? 75 : idx === 3 ? 85 : 20,
    humidity: 68 + (idx * 2)
  }));

  res.json(simulated);
});

// 6. Soil Tracking (Moisture & Temperature)
app.get('/api/soil', async (req, res) => {
  const { polyid } = req.query;

  const liveSoil = await fetchFromAgro('/soil', { polyid });

  if (liveSoil && liveSoil.t10 !== undefined) {
    return res.json({
      surface_temp: Math.round(liveSoil.t0 - 273.15),
      depth_10cm_temp: Math.round(liveSoil.t10 - 273.15),
      moisture: Math.round(liveSoil.moisture * 100), // m3/m3 to %
      status: liveSoil.moisture > 0.35 ? 'Optimal' : liveSoil.moisture > 0.20 ? 'Moderate' : 'Dry',
      isSimulated: false
    });
  }

  res.json({
    surface_temp: 26,
    depth_10cm_temp: 23,
    moisture: 38, // 38% volumetric soil moisture
    status: 'Optimal Moisture',
    statusDescription: 'Ideal for root intake and active transpiration.',
    isSimulated: true
  });
});

// Persistent local storage path for users
const USERS_FILE = path.join(__dirname, 'users_data.json');

function loadUsers() {
  try {
    if (fs.existsSync(USERS_FILE)) {
      return JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
    }
  } catch (_) {}

  const defaultUsers = [
    {
      id: 'usr_01',
      name: 'Richard Obuku',
      email: 'richard.obuku@agropulse.io',
      phone: '+256 772 001 234',
      role: 'Super Admin',
      status: 'active',
      district: 'All Regions (Enterprise Admin)',
      assigned_gardens_count: 18,
      audits_completed: 42,
      last_active: 'Just now',
      avatar: 'RO',
      permissions: ['manage_users', 'map_garden', 'approve_audits', 'view_telemetry', 'export_gis', 'manage_api_keys'],
      created_at: '2026-01-15T08:00:00.000Z'
    },
    {
      id: 'usr_02',
      name: 'Dr. Sarah Akello',
      email: 'sarah.akello@agropulse.io',
      phone: '+256 782 554 112',
      role: 'Chief Agronomist',
      status: 'active',
      district: 'Gulu & Lira Hubs',
      assigned_gardens_count: 12,
      audits_completed: 78,
      last_active: '14 mins ago',
      avatar: 'SA',
      permissions: ['map_garden', 'approve_audits', 'view_telemetry', 'export_gis'],
      created_at: '2026-02-01T09:30:00.000Z'
    },
    {
      id: 'usr_03',
      name: 'Jacob Odur',
      email: 'jacob.odur@agropulse.io',
      phone: '+256 701 443 890',
      role: 'Senior Field Auditor',
      status: 'active',
      district: 'Gulu District',
      assigned_gardens_count: 8,
      audits_completed: 114,
      last_active: '32 mins ago',
      avatar: 'JO',
      permissions: ['map_garden', 'approve_audits', 'view_telemetry'],
      created_at: '2026-02-15T10:15:00.000Z'
    },
    {
      id: 'usr_04',
      name: 'Jimmy Ouni',
      email: 'jimmy.ouni@agropulse.io',
      phone: '+256 775 889 001',
      role: 'Farm Enterprise Manager',
      status: 'active',
      district: 'Lira District',
      assigned_gardens_count: 6,
      audits_completed: 53,
      last_active: '2 hours ago',
      avatar: 'JO',
      permissions: ['view_telemetry', 'export_gis', 'map_garden'],
      created_at: '2026-03-01T11:00:00.000Z'
    },
    {
      id: 'usr_05',
      name: 'Racheal Kobusinge',
      email: 'racheal.k@agropulse.io',
      phone: '+256 752 334 998',
      role: 'ESG & Compliance Reviewer',
      status: 'active',
      district: 'Northern & Western Corridor',
      assigned_gardens_count: 14,
      audits_completed: 39,
      last_active: 'Yesterday',
      avatar: 'RK',
      permissions: ['approve_audits', 'view_telemetry', 'export_gis'],
      created_at: '2026-03-12T14:20:00.000Z'
    },
    {
      id: 'usr_06',
      name: 'Moses Okello',
      email: 'moses.o@agropulse.io',
      phone: '+256 703 112 667',
      role: 'GPS Field Surveyor',
      status: 'pending',
      district: 'Kitgum Micro-Plots',
      assigned_gardens_count: 3,
      audits_completed: 18,
      last_active: '3 days ago',
      avatar: 'MO',
      permissions: ['map_garden', 'view_telemetry'],
      created_at: '2026-04-05T16:45:00.000Z'
    }
  ];

  fs.writeFileSync(USERS_FILE, JSON.stringify(defaultUsers, null, 2));
  return defaultUsers;
}

function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

// 7. USER MANAGEMENT ROUTES
app.get('/api/users', (req, res) => {
  const users = loadUsers();
  res.json(users);
});

app.post('/api/users', (req, res) => {
  const { name, email, phone, role, district, permissions } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: 'User name and email are required.' });
  }

  const users = loadUsers();
  if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
    return res.status(400).json({ error: 'A user with this email address already exists.' });
  }

  const initials = name
    .split(' ')
    .map(p => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'U';

  const newUser = {
    id: `usr_${Date.now()}`,
    name,
    email,
    phone: phone || '',
    role: role || 'Field Auditor',
    status: 'active',
    district: district || 'Gulu Northern Hub',
    assigned_gardens_count: 1,
    audits_completed: 0,
    last_active: 'Invited just now',
    avatar: initials,
    permissions: permissions || ['view_telemetry', 'map_garden'],
    created_at: new Date().toISOString()
  };

  users.unshift(newUser);
  saveUsers(users);
  res.status(201).json(newUser);
});

app.put('/api/users/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const users = loadUsers();
  const idx = users.findIndex(u => u.id === id);

  if (idx === -1) {
    return res.status(404).json({ error: 'User not found.' });
  }

  users[idx] = { ...users[idx], ...updates };
  saveUsers(users);
  res.json(users[idx]);
});

app.delete('/api/users/:id', (req, res) => {
  const { id } = req.params;
  const users = loadUsers();
  const filtered = users.filter(u => u.id !== id);

  if (filtered.length === users.length) {
    return res.status(404).json({ error: 'User not found.' });
  }

  saveUsers(filtered);
  res.json({ success: true, message: 'User deleted.' });
});

// 8. ADVANCED ANALYTICS OVERVIEW & USER ACTIVITY
app.get('/api/analytics/summary', (req, res) => {
  const fields = loadFields();
  const users = loadUsers();

  const totalHa = fields.reduce((acc, f) => acc + (parseFloat(f.area_ha) || 0), 0);
  const totalAcres = totalHa * 2.47105;
  const totalAudits = users.reduce((acc, u) => acc + (u.audits_completed || 0), 0);

  // Health distribution
  const healthDistribution = [
    { name: 'Optimal Canopy (NDVI > 0.70)', count: 12, percent: 66, color: '#15803d' },
    { name: 'Healthy / Moderate (0.50 - 0.70)', count: 4, percent: 22, color: '#16a34a' },
    { name: 'Early Moisture Stress (0.35 - 0.50)', count: 2, percent: 11, color: '#d97706' },
    { name: 'Severe Stress / Barren (< 0.35)', count: 0, percent: 1, color: '#dc2626' }
  ];

  // Yield forecast estimates
  const yieldEstimates = [
    { crop: 'Maize & Soybean', benchmark_tons_ha: 3.8, projected_tons_ha: 4.35, confidence: '94%', change_pct: '+14.4%' },
    { crop: 'Sunflower', benchmark_tons_ha: 1.9, projected_tons_ha: 2.25, confidence: '91%', change_pct: '+18.4%' },
    { crop: 'Sweet Corn (Micro-Plot)', benchmark_tons_ha: 6.2, projected_tons_ha: 7.10, confidence: '96%', change_pct: '+14.5%' },
    { crop: 'Arabica Coffee', benchmark_tons_ha: 2.1, projected_tons_ha: 2.40, confidence: '89%', change_pct: '+14.2%' }
  ];

  // Cloud coverage and revisit velocity
  const satelliteMetrics = {
    constellation: 'Sentinel-2A / 2B & Landsat 8/9',
    revisit_interval_days: 4.8,
    cloud_free_pass_rate_pct: 91.4,
    total_scenes_indexed: 184,
    highest_resolution: '10m Multi-Spectral (B2/B3/B4/B8) + 1.5cm UAV RTK'
  };

  res.json({
    totalFields: fields.length,
    totalHa: Math.round(totalHa * 100) / 100,
    totalAcres: Math.round(totalAcres * 100) / 100,
    totalUsers: users.length,
    activeSurveyors: users.filter(u => u.status === 'active' && u.audits_completed > 0).length,
    totalAudits,
    healthDistribution,
    yieldEstimates,
    satelliteMetrics
  });
});

app.get('/api/analytics/user-activity', (req, res) => {
  const users = loadUsers();

  // Weekly audit survey timeline
  const weeklyTrends = [
    { week: 'W36 (Sep 01)', surveys: 18, verified: 16, flagged: 2 },
    { week: 'W37 (Sep 08)', surveys: 24, verified: 22, flagged: 2 },
    { week: 'W38 (Sep 15)', surveys: 31, verified: 29, flagged: 2 },
    { week: 'W39 (Sep 22)', surveys: 27, verified: 26, flagged: 1 },
    { week: 'W40 (Sep 29)', surveys: 36, verified: 33, flagged: 3 },
    { week: 'W41 (Oct 06)', surveys: 42, verified: 40, flagged: 2 },
    { week: 'W42 (Oct 13)', surveys: 39, verified: 38, flagged: 1 },
    { week: 'W43 (Oct 20)', surveys: 48, verified: 46, flagged: 2 }
  ];

  // User rankings
  const auditorLeaderboard = users
    .filter(u => u.audits_completed > 0)
    .map(u => ({
      id: u.id,
      name: u.name,
      role: u.role,
      avatar: u.avatar,
      district: u.district,
      audits: u.audits_completed,
      accuracyRate: '98.6%',
      avgSurveyTimeMin: 24
    }))
    .sort((a, b) => b.audits - a.audits);

  res.json({
    weeklyTrends,
    auditorLeaderboard
  });
});

app.listen(PORT, () => {
  console.log(`🌾 AgroPulse Satellite Monitor Backend running on http://localhost:${PORT}`);
});
