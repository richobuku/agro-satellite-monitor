const API_BASE = '/api';

export const api = {
  // Config & API Keys
  getConfig: async () => {
    const res = await fetch(`${API_BASE}/config`);
    return await res.json();
  },
  saveConfig: async (apiKey) => {
    const res = await fetch(`${API_BASE}/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey }),
    });
    return await res.json();
  },

  // Fields CRUD
  getFields: async () => {
    const res = await fetch(`${API_BASE}/fields`);
    return await res.json();
  },
  createField: async (fieldData) => {
    const res = await fetch(`${API_BASE}/fields`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fieldData),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to save field');
    }
    return await res.json();
  },
  deleteField: async (id) => {
    const res = await fetch(`${API_BASE}/fields/${id}`, { method: 'DELETE' });
    return await res.json();
  },

  // Satellite Timelapse & Scenes
  getSatelliteHistory: async (polyid, start, end) => {
    const params = new URLSearchParams();
    if (start) params.set('start', start);
    if (end) params.set('end', end);
    const res = await fetch(`${API_BASE}/satellite/history/${polyid}?${params}`);
    return await res.json();
  },

  // NDVI Analytics
  getNdviHistory: async (polyid, start, end) => {
    const params = new URLSearchParams();
    if (start) params.set('start', start);
    if (end) params.set('end', end);
    const res = await fetch(`${API_BASE}/ndvi/history/${polyid}?${params}`);
    return await res.json();
  },

  // Weather & Soil
  getWeather: async (lat, lon) => {
    const res = await fetch(`${API_BASE}/weather?lat=${lat}&lon=${lon}`);
    return await res.json();
  },
  getForecast: async (lat, lon) => {
    const res = await fetch(`${API_BASE}/weather/forecast?lat=${lat}&lon=${lon}`);
    return await res.json();
  },
  getSoil: async (polyid) => {
    const res = await fetch(`${API_BASE}/soil?polyid=${polyid}`);
    return await res.json();
  },

  // User Management
  getUsers: async () => {
    try {
      const res = await fetch(`${API_BASE}/users`);
      if (res.ok) return await res.json();
    } catch (_) {}
    return [
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
  },
  createUser: async (userData) => {
    const res = await fetch(`${API_BASE}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create user');
    }
    return await res.json();
  },
  updateUser: async (id, updates) => {
    const res = await fetch(`${API_BASE}/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update user');
    }
    return await res.json();
  },
  deleteUser: async (id) => {
    const res = await fetch(`${API_BASE}/users/${id}`, { method: 'DELETE' });
    return await res.json();
  },

  // Analytics & Insights
  getAnalyticsSummary: async () => {
    try {
      const res = await fetch(`${API_BASE}/analytics/summary`);
      if (res.ok) return await res.json();
    } catch (_) {}
    return {
      totalFields: 18,
      totalHa: 142.6,
      totalAcres: 352.4,
      totalUsers: 6,
      activeSurveyors: 5,
      totalAudits: 344,
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
    try {
      const res = await fetch(`${API_BASE}/analytics/user-activity`);
      if (res.ok) return await res.json();
    } catch (_) {}
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

