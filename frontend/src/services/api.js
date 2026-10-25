const API_BASE = '/api';

// Storage keys for client-side offline / static resilience
const STORAGE_KEY_FIELDS = 'agropulse_fields_v2';
const STORAGE_KEY_CONFIG = 'agropulse_config_v2';
const STORAGE_KEY_USERS = 'agropulse_users_v2';

// Standard fallback starter plots (Uganda demonstration coordinates)
const DEFAULT_STARTER_FIELDS = [
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
    created_at: '2026-08-16T18:13:32.159Z',
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
    created_at: '2026-08-31T18:13:32.165Z',
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
      { id: 'bed_3', name: 'Beds 8-10', crop: "African Bird's Eye Chili", spacing: '60cm x 40cm', plants: 185, health: 'Flowering' },
    ],
    coordinates: [
      [32.2981, 2.7751],
      [32.29831, 2.7751],
      [32.29831, 2.77531],
      [32.2981, 2.77531],
      [32.2981, 2.7751],
    ],
    notes: '1/8th Acre high-intensity demonstration plot. Drone-mapped with centimeter RTK accuracy.',
    created_at: '2026-09-02T10:00:00.000Z',
  }
];

const DEFAULT_USERS = [
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

// Helper: safe JSON fetch that never throws on 404/HTML responses
async function safeFetchJson(url, options = {}) {
  try {
    const res = await fetch(url, options);
    const contentType = res.headers.get('content-type') || '';
    if (!res.ok) {
      if (contentType.includes('application/json')) {
        const errJson = await res.json().catch(() => ({}));
        return { ok: false, status: res.status, error: errJson.error || `HTTP ${res.status}` };
      }
      return { ok: false, status: res.status, error: `Server returned HTTP ${res.status}` };
    }
    if (contentType.includes('application/json')) {
      const data = await res.json();
      return { ok: true, data };
    }
    return { ok: false, status: res.status, error: 'Non-JSON response' };
  } catch (err) {
    return { ok: false, error: err.message || 'Network error' };
  }
}

// Local storage helpers
function getStoredFields() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_FIELDS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (_) {}
  return [...DEFAULT_STARTER_FIELDS];
}

function setStoredFields(fields) {
  try {
    localStorage.setItem(STORAGE_KEY_FIELDS, JSON.stringify(fields));
  } catch (_) {}
}

function getStoredUsers() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USERS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (_) {}
  return [...DEFAULT_USERS];
}

function setStoredUsers(users) {
  try {
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
  } catch (_) {}
}

export const api = {
  // Config & API Keys
  getConfig: async () => {
    const res = await safeFetchJson(`${API_BASE}/config`);
    if (res.ok && res.data) return res.data;
    const local = localStorage.getItem(STORAGE_KEY_CONFIG) || '';
    return { apiKey: local };
  },
  saveConfig: async (apiKey) => {
    try {
      localStorage.setItem(STORAGE_KEY_CONFIG, apiKey);
    } catch (_) {}
    const res = await safeFetchJson(`${API_BASE}/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey }),
    });
    if (res.ok && res.data) return res.data;
    return { success: true, apiKey };
  },

  // Fields CRUD with seamless client-side persistence fallback
  getFields: async () => {
    const res = await safeFetchJson(`${API_BASE}/fields`);
    if (res.ok && Array.isArray(res.data) && res.data.length > 0) {
      // Merge unique local fields if any were added while offline
      const local = getStoredFields();
      const serverIds = new Set(res.data.map((f) => f.id));
      const clientOnly = local.filter((f) => !serverIds.has(f.id));
      const merged = [...clientOnly, ...res.data];
      setStoredFields(merged);
      return merged;
    }
    return getStoredFields();
  },

  createField: async (fieldData) => {
    // 1. Try remote API first
    const apiRes = await safeFetchJson(`${API_BASE}/fields`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fieldData),
    });

    if (apiRes.ok && apiRes.data && apiRes.data.id) {
      const local = getStoredFields().filter((f) => f.id !== apiRes.data.id);
      const updated = [apiRes.data, ...local];
      setStoredFields(updated);
      return apiRes.data;
    }

    // 2. Resilient fallback: Save in client storage with full field metadata
    let center = [2.7745, 32.299];
    if (Array.isArray(fieldData.coordinates) && fieldData.coordinates.length > 0) {
      const sumLat = fieldData.coordinates.reduce((sum, pt) => sum + (pt[1] || pt.lat || 0), 0);
      const sumLng = fieldData.coordinates.reduce((sum, pt) => sum + (pt[0] || pt.lng || 0), 0);
      center = [
        Math.round((sumLat / fieldData.coordinates.length) * 1000000) / 1000000,
        Math.round((sumLng / fieldData.coordinates.length) * 1000000) / 1000000,
      ];
    }

    const ha = parseFloat(fieldData.area_ha) || 0.41;
    const acres = Math.round(ha * 2.47105 * 100) / 100;
    const newField = {
      id: `field_${Date.now()}`,
      name: fieldData.name || 'Mapped Garden',
      crop: fieldData.crop || 'Maize',
      planting_date: fieldData.planting_date || new Date().toISOString().split('T')[0],
      area_ha: Math.round(ha * 100) / 100,
      area_acres: acres,
      center,
      polyid: `local_poly_${Date.now()}`,
      coordinates: fieldData.coordinates || [],
      notes: fieldData.notes || '',
      created_at: new Date().toISOString(),
      currentNdvi: 0.68,
    };

    const current = getStoredFields();
    setStoredFields([newField, ...current]);
    return newField;
  },

  deleteField: async (id) => {
    // Attempt remote delete asynchronously
    safeFetchJson(`${API_BASE}/fields/${id}`, { method: 'DELETE' }).catch(() => {});
    // Always remove from local persistence
    const remaining = getStoredFields().filter((f) => f.id !== id);
    setStoredFields(remaining);
    return { success: true, id };
  },

  // Satellite Timelapse & Scenes with synthetic fallback
  getSatelliteHistory: async (polyid, start, end) => {
    const params = new URLSearchParams();
    if (start) params.set('start', start);
    if (end) params.set('end', end);

    const res = await safeFetchJson(`${API_BASE}/satellite/history/${polyid}?${params}`);
    if (res.ok && Array.isArray(res.data) && res.data.length > 0) {
      return res.data;
    }

    // High-fidelity fallback Sentinel-2 scenes
    const nowSec = Math.floor(Date.now() / 1000);
    const startSec = start ? parseInt(start, 10) : nowSec - 60 * 86400;
    const endSec = end ? parseInt(end, 10) : nowSec;
    const scenes = [];
    for (let t = startSec; t <= endSec; t += 5 * 86400) {
      const d = new Date(t * 1000);
      const progress = (t - startSec) / (endSec - startSec || 1);
      const simulatedNdvi = Math.max(0.2, Math.min(0.85, 0.25 + Math.sin(progress * Math.PI) * 0.58));
      scenes.push({
        dt: t,
        date: d.toISOString().split('T')[0],
        type: 'Sentinel-2 L2A',
        clouds: Math.floor(Math.random() * 10),
        coverage: 100,
        simulatedNdvi: Math.round(simulatedNdvi * 100) / 100,
        image: {
          truecolor: 'https://tiles.maps.eox.at/wms?service=wms&request=getmap&version=1.1.1&layers=s2cloudless-2020&styles=&format=image/jpeg',
          ndvi: '',
        },
        stats: { ndvi: simulatedNdvi, evi: simulatedNdvi * 0.88 },
        isSimulated: true
      });
    }
    return scenes;
  },

  // NDVI Analytics with seasonal curve fallback
  getNdviHistory: async (polyid, start, end) => {
    const params = new URLSearchParams();
    if (start) params.set('start', start);
    if (end) params.set('end', end);

    const res = await safeFetchJson(`${API_BASE}/ndvi/history/${polyid}?${params}`);
    if (res.ok && Array.isArray(res.data) && res.data.length > 0) {
      return res.data;
    }

    const nowSec = Math.floor(Date.now() / 1000);
    const startSec = start ? parseInt(start, 10) : nowSec - 90 * 86400;
    const endSec = end ? parseInt(end, 10) : nowSec;
    const points = [];
    for (let t = startSec; t <= endSec; t += 3 * 86400) {
      const progress = (t - startSec) / (endSec - startSec || 1);
      const base = 0.22 + Math.sin(progress * Math.PI) * 0.56;
      const noise = Math.sin(t / 86400) * 0.02;
      const mean = Math.max(0.18, Math.min(0.88, base + noise));
      points.push({
        dt: t,
        date: new Date(t * 1000).toISOString().split('T')[0],
        mean: Math.round(mean * 100) / 100,
        max: Math.round(Math.min(1.0, mean + 0.08) * 100) / 100,
        min: Math.round(Math.max(0.05, mean - 0.08) * 100) / 100,
        median: Math.round(mean * 100) / 100,
        std: 0.04,
        isSimulated: true
      });
    }
    return points;
  },

  // Weather & Soil with fallback
  getWeather: async (lat = 2.7745, lon = 32.299) => {
    const res = await safeFetchJson(`${API_BASE}/weather?lat=${lat}&lon=${lon}`);
    if (res.ok && res.data) return res.data;
    return {
      temp: 27.8,
      feels_like: 29.2,
      humidity: 68,
      wind_speed: 3.4,
      clouds: 20,
      description: 'Scattered clouds, ideal growing conditions',
      icon: '03d',
      pressure: 1014,
      rain_1h: 0,
      dew_point: 21.4,
      isSimulated: true
    };
  },

  getForecast: async (lat = 2.7745, lon = 32.299) => {
    const res = await safeFetchJson(`${API_BASE}/weather/forecast?lat=${lat}&lon=${lon}`);
    if (res.ok && Array.isArray(res.data) && res.data.length > 0) return res.data;
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const now = new Date();
    return Array.from({ length: 5 }).map((_, i) => {
      const d = new Date(now.getTime() + (i + 1) * 86400000);
      return {
        day: days[d.getDay()],
        date: d.toISOString().split('T')[0],
        temp_max: 29 + Math.floor(Math.random() * 3),
        temp_min: 19 + Math.floor(Math.random() * 2),
        pop: Math.floor(Math.random() * 40),
        condition: i % 2 === 0 ? 'Sunny' : 'Scattered Showers',
      };
    });
  },

  getSoil: async (polyid) => {
    const res = await safeFetchJson(`${API_BASE}/soil?polyid=${polyid}`);
    if (res.ok && res.data) return res.data;
    return {
      moisture: 32.4,
      temp_10cm: 25.1,
      surface_temp: 28.3,
      organic_matter_pct: 3.8,
      ph_level: 6.4,
      status: 'Adequate Moisture',
      isSimulated: true
    };
  },

  // User Management with full client-side CRUD fallback
  getUsers: async () => {
    const res = await safeFetchJson(`${API_BASE}/users`);
    if (res.ok && Array.isArray(res.data) && res.data.length > 0) {
      setStoredUsers(res.data);
      return res.data;
    }
    return getStoredUsers();
  },

  createUser: async (userData) => {
    const res = await safeFetchJson(`${API_BASE}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    if (res.ok && res.data && res.data.id) {
      const current = getStoredUsers().filter((u) => u.id !== res.data.id);
      const updated = [res.data, ...current];
      setStoredUsers(updated);
      return res.data;
    }

    const initials = (userData.name || 'User')
      .split(' ')
      .map((p) => p[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase();

    const newUser = {
      id: `usr_${Date.now()}`,
      name: userData.name,
      email: userData.email,
      phone: userData.phone || '',
      role: userData.role || 'Field Auditor',
      status: 'active',
      district: userData.district || 'Gulu Northern Hub',
      assigned_gardens_count: 1,
      audits_completed: 0,
      last_active: 'Invited just now',
      avatar: initials || 'U',
      permissions: userData.permissions || ['view_telemetry', 'map_garden'],
      created_at: new Date().toISOString()
    };

    const current = getStoredUsers();
    setStoredUsers([newUser, ...current]);
    return newUser;
  },

  updateUser: async (id, updates) => {
    const res = await safeFetchJson(`${API_BASE}/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (res.ok && res.data) {
      const current = getStoredUsers();
      const updated = current.map((u) => (u.id === id ? { ...u, ...res.data } : u));
      setStoredUsers(updated);
      return res.data;
    }

    const current = getStoredUsers();
    const updated = current.map((u) => (u.id === id ? { ...u, ...updates } : u));
    setStoredUsers(updated);
    return updated.find((u) => u.id === id) || updates;
  },

  deleteUser: async (id) => {
    safeFetchJson(`${API_BASE}/users/${id}`, { method: 'DELETE' }).catch(() => {});
    const current = getStoredUsers().filter((u) => u.id !== id);
    setStoredUsers(current);
    return { success: true, id };
  },

  // Analytics & Insights
  getAnalyticsSummary: async () => {
    const res = await safeFetchJson(`${API_BASE}/analytics/summary`);
    if (res.ok && res.data) return res.data;

    const fields = getStoredFields();
    const users = getStoredUsers();
    const totalHa = fields.reduce((acc, f) => acc + (parseFloat(f.area_ha) || 0), 0);
    const totalAcres = totalHa * 2.47105;
    const totalAudits = users.reduce((acc, u) => acc + (u.audits_completed || 0), 0);

    return {
      totalFields: fields.length,
      totalHa: Math.round(totalHa * 100) / 100,
      totalAcres: Math.round(totalAcres * 100) / 100,
      totalUsers: users.length,
      activeSurveyors: users.filter((u) => u.status === 'active' && u.audits_completed > 0).length || 5,
      totalAudits: totalAudits || 344,
      healthDistribution: [
        { name: 'Optimal Canopy (NDVI > 0.70)', count: 12, percent: 66, color: '#15803d' },
        { name: 'Healthy / Moderate (0.50 - 0.70)', count: 4, percent: 22, color: '#16a34a' },
        { name: 'Early Moisture Stress (0.35 - 0.50)', count: 2, percent: 11, color: '#d97706' },
        { name: 'Severe Stress / Barren (< 0.35)', count: 0, percent: 1, color: '#dc2626' }
      ],
      yieldEstimates: [
        { crop: 'Maize & Soybean', benchmark_tons_ha: 3.8, projected_tons_ha: 4.35, confidence: '94%', change_pct: '+14.4%' },
        { crop: 'Sunflower', benchmark_tons_ha: 1.9, projected_tons_ha: 2.25, confidence: '91%', change_pct: '+18.4%' },
        { crop: 'Sweet Corn (Micro-Plot)', benchmark_tons_ha: 6.2, projected_tons_ha: 7.10, confidence: '96%', change_pct: '+14.5%' },
        { crop: 'Arabica Coffee', benchmark_tons_ha: 2.1, projected_tons_ha: 2.40, confidence: '89%', change_pct: '+14.2%' }
      ],
      satelliteMetrics: {
        constellation: 'Sentinel-2A / 2B & Landsat 8/9',
        revisit_interval_days: 4.8,
        cloud_free_pass_rate_pct: 91.4,
        total_scenes_indexed: 184,
        highest_resolution: '10m Multi-Spectral (B2/B3/B4/B8) + 1.5cm UAV RTK'
      }
    };
  },

  getUserActivity: async () => {
    const res = await safeFetchJson(`${API_BASE}/analytics/user-activity`);
    if (res.ok && res.data) return res.data;

    return {
      weeklyTrends: [
        { week: 'W36 (Sep 01)', surveys: 18, verified: 16, flagged: 2 },
        { week: 'W37 (Sep 08)', surveys: 24, verified: 22, flagged: 2 },
        { week: 'W38 (Sep 15)', surveys: 31, verified: 29, flagged: 2 },
        { week: 'W39 (Sep 22)', surveys: 27, verified: 26, flagged: 1 },
        { week: 'W40 (Sep 29)', surveys: 36, verified: 33, flagged: 3 },
        { week: 'W41 (Oct 06)', surveys: 42, verified: 40, flagged: 2 },
        { week: 'W42 (Oct 13)', surveys: 39, verified: 38, flagged: 1 },
        { week: 'W43 (Oct 20)', surveys: 48, verified: 46, flagged: 2 }
      ],
      auditorLeaderboard: [
        { id: 'usr_03', name: 'Jacob Odur', role: 'Senior Field Auditor', avatar: 'JO', district: 'Gulu District', audits: 114, accuracyRate: '98.8%', avgSurveyTimeMin: 22 },
        { id: 'usr_02', name: 'Dr. Sarah Akello', role: 'Chief Agronomist', avatar: 'SA', district: 'Gulu & Lira Hubs', audits: 78, accuracyRate: '99.4%', avgSurveyTimeMin: 35 },
        { id: 'usr_04', name: 'Jimmy Ouni', role: 'Farm Enterprise Manager', avatar: 'JO', district: 'Lira District', audits: 53, accuracyRate: '97.5%', avgSurveyTimeMin: 28 },
        { id: 'usr_01', name: 'Richard Obuku', role: 'Super Admin', avatar: 'RO', district: 'All Regions', audits: 42, accuracyRate: '99.1%', avgSurveyTimeMin: 18 },
        { id: 'usr_05', name: 'Racheal Kobusinge', role: 'ESG Reviewer', avatar: 'RK', district: 'Northern & Western', audits: 39, accuracyRate: '98.2%', avgSurveyTimeMin: 30 },
        { id: 'usr_06', name: 'Moses Okello', role: 'GPS Field Surveyor', avatar: 'MO', district: 'Kitgum Micro-Plots', audits: 18, accuracyRate: '96.9%', avgSurveyTimeMin: 24 }
      ]
    };
  }
};
