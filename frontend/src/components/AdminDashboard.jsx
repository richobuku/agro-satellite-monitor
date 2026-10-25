import React, { useState, useMemo } from 'react';
import {
  ShieldAlert,
  Sprout,
  Satellite,
  Layers,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Search,
  Filter,
  ExternalLink,
  Droplets,
  Sun,
  Activity,
  ArrowUpRight,
  Database,
  RefreshCw,
  Sliders,
  Check
} from 'lucide-react';

export default function AdminDashboard({
  fields,
  onSelectFieldAndSwitchToMap,
  hasApiKey,
  onOpenSettings,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [cropFilter, setCropFilter] = useState('ALL');
  const [healthFilter, setHealthFilter] = useState('ALL'); // 'ALL' | 'HEALTHY' | 'MODERATE' | 'STRESSED'
  const [acknowledgedAlerts, setAcknowledgedAlerts] = useState({});

  // Aggregated KPIs
  const totalHectares = useMemo(() => {
    return fields.reduce((sum, f) => sum + (parseFloat(f.area_ha) || 0), 0).toFixed(2);
  }, [fields]);

  const totalAcres = useMemo(() => {
    return (parseFloat(totalHectares) * 2.47105).toFixed(2);
  }, [totalHectares]);

  // Crop distribution
  const cropStats = useMemo(() => {
    const counts = {};
    fields.forEach((f) => {
      const crop = f.crop || 'Unspecified';
      if (!counts[crop]) {
        counts[crop] = { count: 0, area: 0, sumNdvi: 0 };
      }
      counts[crop].count += 1;
      counts[crop].area += parseFloat(f.area_ha) || 0;
      counts[crop].sumNdvi += f.currentNdvi || 0.65;
    });

    return Object.entries(counts).map(([crop, data]) => ({
      crop,
      count: data.count,
      area: data.area.toFixed(1),
      avgNdvi: (data.sumNdvi / data.count).toFixed(2),
      percent: fields.length > 0 ? Math.round((data.count / fields.length) * 100) : 0,
    }));
  }, [fields]);

  // Early warning anomalies & alerts generator
  const alerts = useMemo(() => {
    const list = [];
    fields.forEach((f) => {
      const ndvi = f.currentNdvi !== undefined ? f.currentNdvi : 0.65;
      const moisture = f.soilMoisture !== undefined ? f.soilMoisture : 28;

      if (ndvi < 0.40) {
        list.push({
          id: `${f.id}-ndvi-low`,
          fieldId: f.id,
          fieldName: f.name,
          type: 'danger',
          category: 'Vegetation Stress',
          severity: 'CRITICAL',
          message: `NDVI index at ${ndvi.toFixed(2)} indicates acute chlorosis or stunted crop canopy.`,
          metric: `NDVI: ${ndvi.toFixed(2)}`,
          action: 'Inspect Sentinel-2 NDVI',
        });
      } else if (ndvi < 0.55) {
        list.push({
          id: `${f.id}-ndvi-mod`,
          fieldId: f.id,
          fieldName: f.name,
          type: 'warning',
          category: 'Vegetation Watch',
          severity: 'MODERATE',
          message: `Canopy vigor is trending below regional baseline for ${f.crop || 'crop'}.`,
          metric: `NDVI: ${ndvi.toFixed(2)}`,
          action: 'Review Time-lapse',
        });
      }

      if (moisture < 20) {
        list.push({
          id: `${f.id}-moisture-crit`,
          fieldId: f.id,
          fieldName: f.name,
          type: 'danger',
          category: 'Moisture Deficit',
          severity: 'HIGH',
          message: `Root-zone soil moisture is ${moisture}% (below wilting coefficient threshold).`,
          metric: `Moisture: ${moisture}%`,
          action: 'Check Weather & Irrigation',
        });
      }
    });

    // Provide default demo alerts if all fields are optimal
    if (list.length === 0 && fields.length > 0) {
      list.push({
        id: 'system-pass-sync',
        fieldId: fields[0].id,
        fieldName: fields[0].name,
        type: 'info',
        category: 'Satellite Schedule',
        severity: 'INFO',
        message: 'Next Sentinel-2 constellation flyover scheduled in 36 hours. Cloud cover forecast < 15%.',
        metric: 'Coverage: Sentinel-2B',
        action: 'View Satellite Pass',
      });
    }

    return list;
  }, [fields]);

  // Filtered Fields List
  const filteredFields = useMemo(() => {
    return fields.filter((f) => {
      const matchesSearch =
        f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (f.crop && f.crop.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (f.grower && f.grower.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCrop = cropFilter === 'ALL' || f.crop === cropFilter;

      const ndvi = f.currentNdvi || 0.65;
      let matchesHealth = true;
      if (healthFilter === 'HEALTHY') matchesHealth = ndvi >= 0.6;
      else if (healthFilter === 'MODERATE') matchesHealth = ndvi >= 0.4 && ndvi < 0.6;
      else if (healthFilter === 'STRESSED') matchesHealth = ndvi < 0.4;

      return matchesSearch && matchesCrop && matchesHealth;
    });
  }, [fields, searchQuery, cropFilter, healthFilter]);

  // Average Portfolio NDVI
  const avgPortfolioNdvi = useMemo(() => {
    if (fields.length === 0) return '0.00';
    const sum = fields.reduce((acc, f) => acc + (f.currentNdvi || 0.65), 0);
    return (sum / fields.length).toFixed(2);
  }, [fields]);

  // Export all fields as standardized GeoJSON
  const handleExportGeoJson = () => {
    const featureCollection = {
      type: 'FeatureCollection',
      name: 'AgroPulse_Enterprise_Fields',
      crs: {
        type: 'name',
        properties: { name: 'urn:ogc:def:crs:OGC:1.3:CRS84' },
      },
      features: fields.map((f) => ({
        type: 'Feature',
        id: f.id,
        properties: {
          id: f.id,
          name: f.name,
          crop: f.crop || 'Unknown',
          area_ha: parseFloat(f.area_ha) || 0,
          area_acres: parseFloat(f.area_acres) || 0,
          polyid: f.polyid || null,
          created_at: f.created_at || new Date().toISOString(),
          current_ndvi: f.currentNdvi || 0.65,
        },
        geometry: f.geo_json?.geometry || {
          type: 'Polygon',
          coordinates: [f.coordinates || []],
        },
      })),
    };

    const blob = new Blob([JSON.stringify(featureCollection, null, 2)], { type: 'application/geo+json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agropulse-fields-export-${new Date().toISOString().split('T')[0]}.geojson`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Export fields summary to CSV
  const handleExportCSV = () => {
    const headers = ['ID', 'Field Name', 'Crop', 'Area (Ha)', 'Area (Acres)', 'AgroMonitoring PolyID', 'Current NDVI', 'Latitude', 'Longitude', 'Created At'];
    const rows = fields.map((f) => [
      f.id,
      `"${f.name.replace(/"/g, '""')}"`,
      `"${(f.crop || 'N/A').replace(/"/g, '""')}"`,
      f.area_ha || 0,
      f.area_acres || 0,
      f.polyid || 'SIMULATED',
      f.currentNdvi || 0.65,
      f.center ? f.center[0] : '',
      f.center ? f.center[1] : '',
      f.created_at || '',
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agropulse-farm-summary-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleAcknowledgeAlert = (id) => {
    setAcknowledgedAlerts((prev) => ({ ...prev, [id]: true }));
  };

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px', background: 'var(--bg-primary)' }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span className="badge-emerald">ENTERPRISE AGRONOMY</span>
            <span className="badge-cyan">AGROPULSE FLEET v2.5</span>
          </div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, letterSpacing: '-0.5px', color: 'var(--ink)' }}>
            Portfolio Operations & Telemetry
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Aggregated satellite canopy monitoring, anomaly detection, crop distribution, and bulk GIS exports.
          </p>
        </div>

        {/* Global Bulk Export Tools */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button className="btn-secondary" onClick={handleExportCSV} title="Export field telemetry to spreadsheet">
            <FileSpreadsheet size={15} style={{ color: 'var(--g)' }} />
            <span>Export CSV</span>
          </button>

          <button className="btn-secondary" onClick={handleExportGeoJson} title="Export boundaries for Leaf / QGIS / John Deere">
            <Download size={15} style={{ color: 'var(--cyan)' }} />
            <span>Export GeoJSON</span>
          </button>

          <button className="btn-secondary" onClick={onOpenSettings} title="Configure AgroMonitoring API">
            <Sliders size={15} style={{ color: hasApiKey ? 'var(--g)' : 'var(--amber)' }} />
            <span>API Settings</span>
          </button>
        </div>
      </div>

      {/* Top Telemetry KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 16, marginBottom: 28 }}>
        {/* Total Monitored Area */}
        <div className="card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Monitored Footprint
            </span>
            <Layers size={18} style={{ color: 'var(--g)' }} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.5px' }}>
            {totalHectares} <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-muted)' }}>Ha</span>
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--g)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
            <span>≈ {totalAcres} Acres</span>
            <span style={{ color: 'var(--text-subtle)' }}>• {fields.length} active plots</span>
          </div>
        </div>

        {/* Portfolio Mean NDVI */}
        <div className="card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Mean Canopy NDVI
            </span>
            <Activity size={18} style={{ color: 'var(--cyan)' }} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.5px' }}>
            {avgPortfolioNdvi}
          </div>
          <div style={{ fontSize: '0.74rem', color: parseFloat(avgPortfolioNdvi) > 0.6 ? 'var(--g)' : 'var(--amber)', marginTop: 4 }}>
            {parseFloat(avgPortfolioNdvi) > 0.6 ? '● Healthy Vegetative Vigor' : '● Moderate Density'}
          </div>
        </div>

        {/* Active Alerts Count */}
        <div className="glass-card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Early Warning Alerts
            </span>
            <ShieldAlert size={18} style={{ color: alerts.length > 0 ? 'var(--amber-500)' : 'var(--emerald-400)' }} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: alerts.length > 0 ? 'var(--amber-500)' : '#fff', letterSpacing: '-0.5px' }}>
            {alerts.filter((a) => !acknowledgedAlerts[a.id]).length}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: 4 }}>
            {alerts.length > 0 ? 'Plots require agronomist review' : 'All plots in optimal band'}
          </div>
        </div>

        {/* AgroMonitoring API Gateway */}
        <div className="glass-card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              AgroMonitoring Gateway
            </span>
            <Satellite size={18} style={{ color: hasApiKey ? 'var(--emerald-400)' : 'var(--text-subtle)' }} />
          </div>
          <div style={{ fontSize: '1.15rem', fontWeight: 700, color: hasApiKey ? 'var(--emerald-400)' : 'var(--text-muted)', marginTop: 4 }}>
            {hasApiKey ? 'Connected (Live API)' : 'Simulated Sandbox'}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', marginTop: 4 }}>
            Sentinel-2 & Landsat-8 cache active
          </div>
        </div>
      </div>

      {/* Early Warning Center & Crop Distribution Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 20, marginBottom: 28 }}>
        {/* Early Warning Center */}
        <div className="card" style={{ padding: '20px 22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertTriangle size={18} style={{ color: 'var(--amber)' }} />
              <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--ink)' }}>
                Anomaly Detection & Early Warning
              </h2>
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Automated Sentinel-2 & Soil Telemetry Rules
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 280, overflowY: 'auto' }}>
            {alerts.map((alert) => {
              const isAck = acknowledgedAlerts[alert.id];
              return (
                <div
                  key={alert.id}
                  style={{
                    background: isAck ? 'var(--soft)' : '#ffffff',
                    border: `1px solid ${
                      isAck
                        ? 'var(--line)'
                        : alert.severity === 'CRITICAL'
                        ? 'rgba(201, 48, 44, 0.4)'
                        : 'rgba(180, 83, 9, 0.4)'
                    }`,
                    borderRadius: 'var(--radius-md)',
                    padding: '12px 14px',
                    opacity: isAck ? 0.6 : 1,
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span
                        className={
                          alert.severity === 'CRITICAL'
                            ? 'badge-rose'
                            : alert.severity === 'HIGH' || alert.severity === 'MODERATE'
                            ? 'badge-amber'
                            : 'badge-cyan'
                        }
                      >
                        {alert.category}
                      </span>
                      <strong style={{ fontSize: '0.84rem', color: 'var(--ink)' }}>{alert.fieldName}</strong>
                    </div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {alert.metric}
                    </span>
                  </div>

                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 8 }}>
                    {alert.message}
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <button
                      onClick={() => onSelectFieldAndSwitchToMap(alert.fieldId)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--g)',
                        fontSize: '0.74rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <span>{alert.action}</span>
                      <ArrowUpRight size={13} />
                    </button>

                    {!isAck ? (
                      <button
                        onClick={() => handleAcknowledgeAlert(alert.id)}
                        className="btn-secondary"
                        style={{ padding: '3px 8px', fontSize: '0.7rem' }}
                      >
                        <Check size={12} /> Acknowledge
                      </button>
                    ) : (
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-subtle)' }}>
                        ✓ Acknowledged
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Crop Portfolio Distribution */}
        <div className="card" style={{ padding: '20px 22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sprout size={18} style={{ color: 'var(--g)' }} />
              <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--ink)' }}>
                Crop Distribution & Hectares
              </h2>
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              {cropStats.length} Unique Crop Types
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {cropStats.map((c) => (
              <div key={c.crop} style={{ background: 'var(--soft)', padding: '10px 14px', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <strong style={{ fontSize: '0.84rem', color: 'var(--ink)' }}>{c.crop}</strong>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>({c.count} plots)</span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>
                    {c.area} Ha <span style={{ color: 'var(--text-subtle)' }}>({c.percent}%)</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div style={{ width: '100%', height: 6, background: 'rgba(255, 255, 255, 0.08)', borderRadius: 3, overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${c.percent}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, var(--emerald-500) 0%, var(--cyan-500) 100%)',
                      borderRadius: 3,
                    }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: '0.7rem', color: 'var(--text-subtle)' }}>
                  <span>Avg NDVI: <strong style={{ color: 'var(--emerald-400)' }}>{c.avgNdvi}</strong></span>
                  <span>Sentinel-2 Ready</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Fields & Plots Master Directory */}
      <div className="card" style={{ padding: '22px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--ink)', marginBottom: 2 }}>
              Fleet & Garden Master Directory
            </h2>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Filter, search and inspect monitored plots across all agricultural zones.
            </p>
          </div>

          {/* Search and Filters */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search plot, crop..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  background: '#fff',
                  border: '1.5px solid var(--bd)',
                  borderRadius: 'var(--radius-md)',
                  padding: '7px 12px 7px 30px',
                  color: 'var(--ink)',
                  fontSize: '0.8rem',
                  outline: 'none',
                  width: 180,
                }}
              />
            </div>

            {/* Health Filter Pills */}
            <div className="segmented-nav">
              <button
                className={`segmented-nav-btn ${healthFilter === 'ALL' ? 'active' : ''}`}
                onClick={() => setHealthFilter('ALL')}
              >
                All ({fields.length})
              </button>
              <button
                className={`segmented-nav-btn ${healthFilter === 'HEALTHY' ? 'active' : ''}`}
                onClick={() => setHealthFilter('HEALTHY')}
              >
                Optimal
              </button>
              <button
                className={`segmented-nav-btn ${healthFilter === 'STRESSED' ? 'active' : ''}`}
                onClick={() => setHealthFilter('STRESSED')}
              >
                Stressed
              </button>
            </div>
          </div>
        </div>

        {/* Directory Table */}
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Plot / Garden</th>
                <th>Crop Type</th>
                <th>Surface Area</th>
                <th>Current NDVI</th>
                <th>AgroMonitoring ID</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredFields.map((f) => {
                const ndvi = f.currentNdvi !== undefined ? f.currentNdvi : 0.65;
                const isOptimal = ndvi >= 0.6;
                const isModerate = ndvi >= 0.4 && ndvi < 0.6;

                return (
                  <tr key={f.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--ink)', fontSize: '0.88rem' }}>{f.name}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {f.center ? `${f.center[0].toFixed(4)}°N, ${f.center[1].toFixed(4)}°E` : 'Polygon bound'}
                      </div>
                    </td>
                    <td>
                      <span className="badge-cyan" style={{ fontSize: '0.74rem' }}>
                        {f.crop || 'Crop unassigned'}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--ink)' }}>{f.area_ha} Ha</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>{f.area_acres} Acres</div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            background: isOptimal ? 'var(--emerald-500)' : isModerate ? 'var(--amber-500)' : 'var(--rose-500)',
                            boxShadow: `0 0 8px ${isOptimal ? 'var(--emerald-500)' : isModerate ? 'var(--amber-500)' : 'var(--rose-500)'}`,
                          }}
                        />
                        <strong style={{ fontFamily: 'var(--font-mono)' }}>{ndvi.toFixed(2)}</strong>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                        {f.polyid ? f.polyid.substring(0, 12) + '...' : 'Local Sandbox'}
                      </span>
                    </td>
                    <td>
                      <span
                        className={
                          isOptimal ? 'badge-emerald' : isModerate ? 'badge-amber' : 'badge-rose'
                        }
                      >
                        {isOptimal ? 'High Vigor' : isModerate ? 'Moderate' : 'Stress Alert'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn-secondary"
                        onClick={() => onSelectFieldAndSwitchToMap(f.id)}
                        style={{ padding: '6px 12px', fontSize: '0.76rem' }}
                      >
                        <Satellite size={13} style={{ color: 'var(--cyan-500)' }} />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
