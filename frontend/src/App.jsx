import React, { useState, useEffect } from 'react';
import {
  Satellite,
  Layers,
  Sprout,
  Activity,
  CloudSun,
  Settings,
  Plus,
  Compass,
  BarChart3,
  ShieldCheck,
  HeartPulse,
  Users,
  TrendingUp,
  Menu,
  X,
  Download,
} from 'lucide-react';
import FieldMap from './components/FieldMap';
import SatelliteTimelapse from './components/SatelliteTimelapse';
import NdviHealthChart from './components/NdviHealthChart';
import WeatherSoilCard from './components/WeatherSoilCard';
import FieldListDrawer from './components/FieldListDrawer';
import NewFieldModal from './components/NewFieldModal';
import SettingsModal from './components/SettingsModal';
import AdminDashboard from './components/AdminDashboard';
import ReviewerPortal from './components/ReviewerPortal';
import CropHealthDiagnostics from './components/CropHealthDiagnostics';
import UserManagement from './components/UserManagement';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import { api } from './services/api';

export default function App() {
  const [fields, setFields] = useState([]);
  const [selectedField, setSelectedField] = useState(null);
  const [mainView, setMainView] = useState('cockpit'); // 'cockpit' | 'admin' | 'reviewer' | 'users' | 'analytics'
  const [activeTab, setActiveTab] = useState('timelapse'); // 'fields' | 'timelapse' | 'wellness' | 'ndvi' | 'weather'

  // Satellite layer and timeline states
  const [activeLayerType, setActiveLayerType] = useState('truecolor'); // 'truecolor' | 'ndvi' | 'falsecolor'
  const [scenes, setScenes] = useState([]);
  const [selectedSceneIndex, setSelectedSceneIndex] = useState(0);
  const [scenesLoading, setScenesLoading] = useState(false);

  // NDVI stats
  const [ndviStats, setNdviStats] = useState([]);
  const [ndviLoading, setNdviLoading] = useState(false);

  // Weather & Soil
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [soil, setSoil] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);

  // Drawing state
  const [drawingMode, setDrawingMode] = useState(false);
  const [draftPoints, setDraftPoints] = useState([]);
  const [newFieldModalOpen, setNewFieldModalOpen] = useState(false);
  const [calculatedHa, setCalculatedHa] = useState(0);

  // Settings & Utilities Menu
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [hamburgerOpen, setHamburgerOpen] = useState(false);

  const handleExportAllGeoJson = () => {
    const featureCollection = {
      type: 'FeatureCollection',
      name: 'AgroPulse_Fields_Fleet',
      crs: { type: 'name', properties: { name: 'urn:ogc:def:crs:OGC:1.3:CRS84' } },
      features: fields.map((f) => ({
        type: 'Feature',
        id: f.id,
        properties: {
          id: f.id,
          name: f.name,
          crop: f.crop || 'Unknown',
          area_ha: f.area_ha || 0,
          area_acres: f.area_acres || 0,
          polyid: f.polyid || 'SIMULATED',
        },
        geometry: {
          type: 'Polygon',
          coordinates: [f.coordinates || []],
        },
      })),
    };
    const blob = new Blob([JSON.stringify(featureCollection, null, 2)], { type: 'application/geo+json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agropulse-fields-fleet-${new Date().toISOString().split('T')[0]}.geojson`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Load initial fields and config
  const fetchAllFields = async () => {
    try {
      const fieldList = await api.getFields();
      setFields(fieldList);
      if (fieldList.length > 0 && !selectedField) {
        setSelectedField(fieldList[0]);
      }
    } catch (err) {
      console.error('Failed to load fields:', err);
    }
  };

  const checkConfig = async () => {
    try {
      const cfg = await api.getConfig();
      setHasApiKey(cfg.hasApiKey);
    } catch (_) {}
  };

  useEffect(() => {
    fetchAllFields();
    checkConfig();

    // Check if opened via shareable reviewer/auditor link
    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') === 'reviewer') {
      setMainView('reviewer');
    }
  }, []);

  // Fetch telemetry whenever selectedField changes
  useEffect(() => {
    if (!selectedField) return;

    // 1. Fetch satellite scenes
    setScenesLoading(true);
    api.getSatelliteHistory(selectedField.polyid)
      .then((data) => {
        setScenes(data || []);
        setSelectedSceneIndex(data && data.length > 0 ? data.length - 1 : 0);
      })
      .catch(console.error)
      .finally(() => setScenesLoading(false));

    // 2. Fetch NDVI historical curve
    setNdviLoading(true);
    api.getNdviHistory(selectedField.polyid)
      .then((data) => setNdviStats(data || []))
      .catch(console.error)
      .finally(() => setNdviLoading(false));

    // 3. Fetch Weather & Soil
    if (selectedField.center) {
      setWeatherLoading(true);
      const [lat, lon] = selectedField.center;
      Promise.all([
        api.getWeather(lat, lon),
        api.getForecast(lat, lon),
        api.getSoil(selectedField.polyid),
      ])
        .then(([w, f, s]) => {
          setWeather(w);
          setForecast(f);
          setSoil(s);
        })
        .catch(console.error)
        .finally(() => setWeatherLoading(false));
    }
  }, [selectedField]);

  const handleStartDrawing = () => {
    setDrawingMode(true);
    setDraftPoints([]);
    setMainView('cockpit');
  };

  const handleOpenNewFieldModal = (pts, ha) => {
    setDraftPoints(pts);
    setCalculatedHa(ha);
    setNewFieldModalOpen(true);
  };

  const handleSaveField = async (fieldPayload) => {
    const created = await api.createField(fieldPayload);
    setFields((prev) => [created, ...prev]);
    setSelectedField(created);
    setDrawingMode(false);
    setDraftPoints([]);
  };

  const handleDeleteField = async (id) => {
    await api.deleteField(id);
    setFields((prev) => prev.filter((f) => f.id !== id));
    if (selectedField?.id === id) {
      const remaining = fields.filter((f) => f.id !== id);
      setSelectedField(remaining[0] || null);
    }
  };

  const activeScene = scenes[selectedSceneIndex] || null;

  return (
    <div className="shell">
      {/* Persistent Left Sidebar in Forest Green (#143a2a) */}
      <aside className="side">
        <div className="brand">
          <div className="mark">
            <Satellite size={20} color="var(--side)" strokeWidth={2.2} />
          </div>
          <div>
            <b>AgroPulse</b>
            <small>Satellite Monitor</small>
          </div>
        </div>

        {/* Primary Views */}
        <button
          type="button"
          className={`nv ${mainView === 'cockpit' && activeTab !== 'fields' ? 'on' : ''}`}
          onClick={() => {
            setMainView('cockpit');
            if (activeTab === 'fields') setActiveTab('timelapse');
          }}
          id="nav-cockpit-btn"
        >
          <Satellite size={17} />
          <span>Satellite Cockpit</span>
        </button>

        <button
          type="button"
          className={`nv ${mainView === 'cockpit' && activeTab === 'fields' ? 'on' : ''}`}
          onClick={() => {
            setMainView('cockpit');
            setActiveTab('fields');
          }}
          id="nav-gardens-btn"
        >
          <Sprout size={17} />
          <span>Garden Registry</span>
        </button>

        <button
          type="button"
          className={`nv ${mainView === 'admin' ? 'on' : ''}`}
          onClick={() => setMainView('admin')}
          id="nav-admin-btn"
        >
          <BarChart3 size={17} />
          <span>Enterprise Admin</span>
        </button>

        <button
          type="button"
          className={`nv ${mainView === 'analytics' ? 'on' : ''}`}
          onClick={() => setMainView('analytics')}
          id="nav-analytics-btn"
        >
          <TrendingUp size={17} />
          <span>Analytics & BI</span>
        </button>

        <hr />

        <div className="nav-section-title">Telemetry & AI</div>

        <button
          type="button"
          className={`nv ${mainView === 'cockpit' && activeTab === 'wellness' ? 'on' : ''}`}
          onClick={() => {
            setMainView('cockpit');
            setActiveTab('wellness');
          }}
        >
          <HeartPulse size={17} />
          <span>AI Crop Wellness</span>
        </button>

        <button
          type="button"
          className={`nv ${mainView === 'cockpit' && activeTab === 'timelapse' ? 'on' : ''}`}
          onClick={() => {
            setMainView('cockpit');
            setActiveTab('timelapse');
          }}
        >
          <Layers size={17} />
          <span>Time-Lapse Player</span>
        </button>

        <button
          type="button"
          className={`nv ${mainView === 'cockpit' && activeTab === 'ndvi' ? 'on' : ''}`}
          onClick={() => {
            setMainView('cockpit');
            setActiveTab('ndvi');
          }}
        >
          <Activity size={17} />
          <span>NDVI Curves</span>
        </button>

        <button
          type="button"
          className={`nv ${mainView === 'cockpit' && activeTab === 'weather' ? 'on' : ''}`}
          onClick={() => {
            setMainView('cockpit');
            setActiveTab('weather');
          }}
        >
          <CloudSun size={17} />
          <span>Weather & Soil</span>
        </button>

        <div className="gap" />
      </aside>

      {/* Main Content Area */}
      <div className="main">
        {/* Top App Header */}
        <header className="top">
          <div>
            <h1>
              {mainView === 'cockpit'
                ? (selectedField ? selectedField.name : 'Satellite Cockpit')
                : mainView === 'admin'
                ? 'Enterprise Admin & Farm Portfolio'
                : mainView === 'reviewer'
                ? 'Reviewer & Auditor Portal'
                : mainView === 'users'
                ? 'Team & User Access Management'
                : 'Executive Analytics & Operational Intelligence'}
            </h1>
            <small>
              {mainView === 'cockpit'
                ? (selectedField
                    ? `${selectedField.crop || 'Crop plot'} • ${selectedField.area_ha || '0.00'} Ha (${((parseFloat(selectedField.area_ha) || 0) * 2.47105).toFixed(2)} Acres)`
                    : 'Sentinel-2 & Landsat Multi-Spectral Field Monitoring')
                : mainView === 'admin'
                ? 'Aggregated portfolio KPIs, crop anomalies, and bulk GIS exports'
                : mainView === 'reviewer'
                ? 'Third-party GPS and boundary verification dossiers'
                : mainView === 'users'
                ? 'Assign roles, set field-level GPS permissions, and monitor field audit compliance'
                : 'Cross-portfolio agronomic curves, surveyor inspection velocity, yield models, and satellite metrics'}
            </small>
          </div>

          <div className="sp" />

          {/* Live Satellite status pill */}
          <div className="oncall" title="Sentinel-2 & Landsat Real-time Constellation">
            <span className="dot" />
            <span>SENTINEL-2 LIVE</span>
            <span className="t">10m Res</span>
          </div>

          {/* Map garden quick trigger */}
          {mainView === 'cockpit' ? (
            <button
              type="button"
              className="btn-o"
              onClick={handleStartDrawing}
              style={{
                borderColor: drawingMode ? 'var(--amber)' : undefined,
                color: drawingMode ? 'var(--amber)' : undefined,
              }}
            >
              <Compass size={15} style={{ color: drawingMode ? 'var(--amber)' : 'var(--g)' }} />
              <span>{drawingMode ? 'Drawing Points...' : '+ Map Garden'}</span>
            </button>
          ) : (
            <button
              type="button"
              className="btn-o"
              onClick={() => setMainView('cockpit')}
            >
              <Satellite size={15} style={{ color: 'var(--g)' }} />
              <span>Open Cockpit Map</span>
            </button>
          )}

          {/* Top Right: Hamburger Menu for Secondary Tools & User Management */}
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              className="btn-o"
              onClick={() => setHamburgerOpen(!hamburgerOpen)}
              title="System Menu & Utilities"
              style={{
                height: '36px',
                width: '36px',
                padding: 0,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: hamburgerOpen ? 'var(--gt)' : '#fff',
                borderColor: hamburgerOpen ? 'var(--g)' : 'var(--bd)',
                color: hamburgerOpen ? 'var(--g)' : 'var(--ink)'
              }}
            >
              {hamburgerOpen ? <X size={17} /> : <Menu size={17} />}
            </button>

            {hamburgerOpen && (
              <>
                <div
                  style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 998,
                  }}
                  onClick={() => setHamburgerOpen(false)}
                />
                <div
                  className="card"
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    width: '300px',
                    padding: '8px 0',
                    zIndex: 999,
                    boxShadow: '0 12px 32px rgba(0,0,0,0.12)',
                    border: '1px solid var(--bd)',
                    background: '#fff',
                    borderRadius: '10px'
                  }}
                >
                  <div style={{ padding: '8px 16px 6px', fontSize: '10px', fontWeight: 700, color: 'var(--sub)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    Team & Organization
                  </div>

                  {/* Team & Users Management */}
                  <button
                    type="button"
                    className="menu-item"
                    onClick={() => {
                      setMainView('users');
                      setHamburgerOpen(false);
                    }}
                    style={{
                      background: mainView === 'users' ? 'var(--gt)' : 'transparent',
                    }}
                  >
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #143a2a, #15803d)',
                        color: '#fff',
                        fontSize: 11,
                        fontWeight: 700,
                        display: 'grid',
                        placeItems: 'center',
                        flexShrink: 0
                      }}
                    >
                      RO
                    </div>
                    <div style={{ textAlign: 'left', flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span>Team & Users</span>
                        <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--g)', background: 'var(--gt)', padding: '1px 7px', borderRadius: '12px' }}>
                          6 Active
                        </span>
                      </div>
                      <small style={{ fontSize: '11px', color: 'var(--sub)' }}>Role-based auditor permissions & RBAC</small>
                    </div>
                  </button>

                  <hr style={{ border: 0, borderTop: '1px solid var(--line)', margin: '6px 0' }} />

                  <div style={{ padding: '8px 16px 6px', fontSize: '10px', fontWeight: 700, color: 'var(--sub)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    Utilities & Ancillary Tools
                  </div>

                  <button
                    type="button"
                    className="menu-item"
                    onClick={() => {
                      setMainView('reviewer');
                      setHamburgerOpen(false);
                    }}
                  >
                    <ShieldCheck size={16} style={{ color: 'var(--g)' }} />
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink)' }}>Reviewer & Auditor Portal</div>
                      <small style={{ fontSize: '11px', color: 'var(--sub)' }}>ESG & bank inspection dossiers</small>
                    </div>
                  </button>

                  <button
                    type="button"
                    className="menu-item"
                    onClick={() => {
                      setSettingsOpen(true);
                      setHamburgerOpen(false);
                    }}
                  >
                    <Settings size={16} style={{ color: hasApiKey ? 'var(--g)' : 'var(--sub)' }} />
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink)' }}>AgroMonitoring API Config</div>
                      <small style={{ fontSize: '11px', color: 'var(--sub)' }}>{hasApiKey ? 'Enterprise Key Active' : 'Configure API Key'}</small>
                    </div>
                  </button>

                  <button
                    type="button"
                    className="menu-item"
                    onClick={() => {
                      setHamburgerOpen(false);
                      handleStartDrawing();
                    }}
                  >
                    <Compass size={16} style={{ color: drawingMode ? 'var(--amber)' : 'var(--blue)' }} />
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink)' }}>Map Garden (GPS / RTK)</div>
                      <small style={{ fontSize: '11px', color: 'var(--sub)' }}>{drawingMode ? 'Drawing Points Active' : 'Draw polygon boundaries'}</small>
                    </div>
                  </button>

                  <button
                    type="button"
                    className="menu-item"
                    onClick={() => {
                      setHamburgerOpen(false);
                      handleExportAllGeoJson();
                    }}
                  >
                    <Download size={16} style={{ color: 'var(--ink)' }} />
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink)' }}>Export Fleet GeoJSON</div>
                      <small style={{ fontSize: '11px', color: 'var(--sub)' }}>Download all {fields.length} boundaries</small>
                    </div>
                  </button>

                  <hr style={{ border: 0, borderTop: '1px solid var(--line)', margin: '6px 0' }} />

                  <div style={{ padding: '8px 16px', fontSize: '11px', color: 'var(--muted)', lineHeight: 1.4 }}>
                    <b>Constellation Status:</b> Sentinel-2A/2B • 4.8-day revisit cadence • 10m Multi-spectral.
                  </div>
                </div>
              </>
            )}
          </div>
        </header>

        {/* Content Body */}
        <div className="content">
          {mainView === 'reviewer' ? (
            <ReviewerPortal
              fields={fields}
              selectedField={selectedField}
              onSelectField={setSelectedField}
              onSwitchToMap={() => setMainView('cockpit')}
            />
          ) : mainView === 'admin' ? (
            <AdminDashboard
              fields={fields}
              onSelectFieldAndSwitchToMap={(fieldId) => {
                const target = fields.find((f) => f.id === fieldId);
                if (target) setSelectedField(target);
                setMainView('cockpit');
              }}
              hasApiKey={hasApiKey}
              onOpenSettings={() => setSettingsOpen(true)}
            />
          ) : mainView === 'users' ? (
            <UserManagement />
          ) : mainView === 'analytics' ? (
            <AnalyticsDashboard />
          ) : (
            /* Cockpit Split View */
            <div style={{ display: 'flex', width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
              {/* Left Telemetry Card Panel */}
              <aside
                style={{
                  width: 440,
                  maxWidth: '38vw',
                  height: '100%',
                  borderRight: '1px solid var(--line)',
                  background: '#fff',
                  display: 'flex',
                  flexDirection: 'column',
                  zIndex: 10,
                  boxShadow: '1px 0 3px rgba(0,0,0,0.02)',
                }}
              >
                {/* Telemetry Tabs */}
                <div
                  style={{
                    display: 'flex',
                    padding: '10px 14px',
                    borderBottom: '1px solid var(--line)',
                    gap: 4,
                    background: 'var(--soft)',
                    overflowX: 'auto',
                  }}
                >
                  {[
                    { id: 'timelapse', label: 'Time-Lapse', icon: Satellite },
                    { id: 'wellness', label: 'AI Wellness', icon: HeartPulse },
                    { id: 'ndvi', label: 'NDVI Curve', icon: Activity },
                    { id: 'weather', label: 'Weather & Soil', icon: CloudSun },
                    { id: 'fields', label: 'Gardens', icon: Sprout },
                  ].map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                          flex: 1,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: 3,
                          padding: '7px 4px',
                          borderRadius: 6,
                          border: 'none',
                          background: isActive ? '#fff' : 'transparent',
                          color: isActive ? 'var(--g)' : 'var(--mute)',
                          boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                          cursor: 'pointer',
                          fontSize: '0.70rem',
                          fontWeight: 700,
                          transition: 'all 0.15s ease',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        <Icon size={16} />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Tab Body */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '16px', background: 'var(--bg)' }}>
                  {activeTab === 'wellness' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      <CropHealthDiagnostics
                        field={selectedField}
                        ndviHistory={ndviStats}
                        weather={weather}
                        soil={soil}
                      />
                      <SatelliteTimelapse
                        scenes={scenes}
                        selectedSceneIndex={selectedSceneIndex}
                        onSelectSceneIndex={setSelectedSceneIndex}
                        activeLayerType={activeLayerType}
                        onChangeLayerType={setActiveLayerType}
                        loading={scenesLoading}
                      />
                    </div>
                  )}

                  {activeTab === 'timelapse' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      <SatelliteTimelapse
                        scenes={scenes}
                        selectedSceneIndex={selectedSceneIndex}
                        onSelectSceneIndex={setSelectedSceneIndex}
                        activeLayerType={activeLayerType}
                        onChangeLayerType={setActiveLayerType}
                        loading={scenesLoading}
                      />
                      <NdviHealthChart data={ndviStats} loading={ndviLoading} />
                    </div>
                  )}

                  {activeTab === 'ndvi' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      <NdviHealthChart data={ndviStats} loading={ndviLoading} />
                      <SatelliteTimelapse
                        scenes={scenes}
                        selectedSceneIndex={selectedSceneIndex}
                        onSelectSceneIndex={setSelectedSceneIndex}
                        activeLayerType={activeLayerType}
                        onChangeLayerType={setActiveLayerType}
                        loading={scenesLoading}
                      />
                    </div>
                  )}

                  {activeTab === 'weather' && (
                    <WeatherSoilCard
                      weather={weather}
                      forecast={forecast}
                      soil={soil}
                      loading={weatherLoading}
                    />
                  )}

                  {activeTab === 'fields' && (
                    <FieldListDrawer
                      fields={fields}
                      selectedField={selectedField}
                      onSelectField={(f) => {
                        setSelectedField(f);
                        setActiveTab('timelapse');
                      }}
                      onStartDrawing={handleStartDrawing}
                      onDeleteField={handleDeleteField}
                    />
                  )}
                </div>
              </aside>

              {/* Center Map */}
              <main style={{ flex: 1, height: '100%', position: 'relative' }}>
                <FieldMap
                  fields={fields}
                  selectedField={selectedField}
                  onSelectField={setSelectedField}
                  onOpenNewFieldModal={handleOpenNewFieldModal}
                  activeLayerType={activeLayerType}
                  activeScene={activeScene}
                  drawingMode={drawingMode}
                  setDrawingMode={setDrawingMode}
                  draftPoints={draftPoints}
                  setDraftPoints={setDraftPoints}
                />
              </main>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <NewFieldModal
        isOpen={newFieldModalOpen}
        onClose={() => setNewFieldModalOpen(false)}
        draftPoints={draftPoints}
        calculatedHa={calculatedHa}
        onSaveField={handleSaveField}
      />

      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onApiKeySaved={() => {
          checkConfig();
          fetchAllFields();
        }}
      />
    </div>
  );
}
