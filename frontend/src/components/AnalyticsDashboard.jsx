import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  ComposedChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import {
  TrendingUp,
  Users,
  Activity,
  Layers,
  Calendar,
  Download,
  Filter,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Sparkles,
  Satellite,
  BarChart2,
  PieChart as PieChartIcon,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  FileSpreadsheet
} from 'lucide-react';
import { api } from '../services/api';

export default function AnalyticsDashboard() {
  const [summary, setSummary] = useState(null);
  const [userActivity, setUserActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('90d'); // '30d' | '90d' | 'season' | 'year'
  const [selectedDistrict, setSelectedDistrict] = useState('ALL');
  const [exportNotice, setExportNotice] = useState('');

  useEffect(() => {
    async function loadData() {
      setLoading(false);
      try {
        const [sum, act] = await Promise.all([
          api.getAnalyticsSummary(),
          api.getUserActivity()
        ]);
        setSummary(sum);
        setUserActivity(act);
      } catch (err) {
        console.error('Failed to load analytics:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleExportCSV = () => {
    setExportNotice('Exporting Agronomic Analytics & Audit Velocity CSV...');
    setTimeout(() => {
      // Generate synthetic download
      const headers = 'Metric,Value,Benchmark,Confidence,Timestamp\n';
      const rows = [
        `"Total Monitored Area (Acres)",${summary?.totalAcres || 352.4},"300.0","99.5%","${new Date().toISOString()}"`,
        `"Average Portfolio NDVI",0.74,"0.68","98.2%","${new Date().toISOString()}"`,
        `"Total Field Audits",${summary?.totalAudits || 344},"300","99.8%","${new Date().toISOString()}"`,
        `"Cloud-Free Satellite Pass Rate",91.4%,"85.0%","96.0%","${new Date().toISOString()}"`
      ].join('\n');

      const blob = new Blob([headers + rows], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `agropulse-bi-analytics-${Date.now()}.csv`;
      a.click();
      setExportNotice('');
    }, 900);
  };

  // Comparative NDVI seasonal curve for multi-crop comparison
  const multiCropNdviData = [
    { day: 'Day 10', maize: 0.28, sunflower: 0.22, coffee: 0.65, sweetCorn: 0.32 },
    { day: 'Day 20', maize: 0.42, sunflower: 0.36, coffee: 0.66, sweetCorn: 0.49 },
    { day: 'Day 30', maize: 0.58, sunflower: 0.51, coffee: 0.68, sweetCorn: 0.64 },
    { day: 'Day 40', maize: 0.73, sunflower: 0.67, coffee: 0.70, sweetCorn: 0.79 },
    { day: 'Day 50', maize: 0.82, sunflower: 0.76, coffee: 0.72, sweetCorn: 0.85 },
    { day: 'Day 60', maize: 0.79, sunflower: 0.74, coffee: 0.73, sweetCorn: 0.81 },
    { day: 'Day 70', maize: 0.71, sunflower: 0.65, coffee: 0.71, sweetCorn: 0.72 },
    { day: 'Day 80', maize: 0.59, sunflower: 0.52, coffee: 0.69, sweetCorn: 0.58 }
  ];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        padding: '24px 32px 64px 32px',
        minWidth: 0,
        width: '100%',
        boxSizing: 'border-box'
      }}
    >
      {/* Export Toast */}
      {exportNotice && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            background: 'var(--ink)',
            color: '#fff',
            padding: '12px 20px',
            borderRadius: '8px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            zIndex: 9999,
            fontSize: '13px',
            fontWeight: 600,
            borderLeft: '4px solid var(--g)'
          }}
        >
          <FileSpreadsheet size={16} color="var(--g)" />
          <span>{exportNotice}</span>
        </div>
      )}

      {/* Header with Title and Global Filters */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          width: '100%',
          minWidth: 0
        }}
      >
        <div style={{ minWidth: 260 }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--ink)', margin: '0 0 4px 0' }}>
            Executive Analytics & Operational Intelligence
          </h2>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--sub)' }}>
            Cross-portfolio agronomic curves, surveyor inspection velocity, yield models, and satellite pass metrics.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          {/* Time range pills */}
          <div style={{ display: 'flex', background: 'var(--soft)', padding: '3px', borderRadius: '6px', border: '1px solid var(--bd)' }}>
            {[
              { id: '30d', label: '30 Days' },
              { id: '90d', label: '90 Days' },
              { id: 'season', label: 'Season 2026B' },
              { id: 'year', label: 'Full Year' }
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTimeRange(t.id)}
                style={{
                  border: 'none',
                  background: timeRange === t.id ? '#fff' : 'transparent',
                  color: timeRange === t.id ? 'var(--ink)' : 'var(--sub)',
                  fontWeight: timeRange === t.id ? 650 : 500,
                  fontSize: '12px',
                  padding: '4px 10px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  boxShadow: timeRange === t.id ? '0 1px 2px rgba(0,0,0,0.06)' : 'none'
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* District selector */}
          <select
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            style={{
              height: '34px',
              padding: '0 10px',
              border: '1px solid var(--bd)',
              borderRadius: '6px',
              background: '#fff',
              fontSize: '12px',
              color: 'var(--ink)'
            }}
          >
            <option value="ALL">All Hubs & Districts</option>
            <option value="GULU">Gulu Northern Hub</option>
            <option value="LIRA">Lira Central Hub</option>
            <option value="KITGUM">Kitgum Micro-Plots</option>
          </select>

          {/* Export Action */}
          <button
            type="button"
            className="btn-o primary"
            onClick={handleExportCSV}
            style={{ height: '34px', fontSize: '12px' }}
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* High-Level Metric Tiles */}
      <div className="stats">
        <div className="stat">
          <small>PORTFOLIO ACREAGE MONITORED</small>
          <b>{summary?.totalAcres || 352.4} Acres</b>
          <span style={{ fontSize: '11px', color: 'var(--g)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
            <TrendingUp size={12} /> {summary?.totalHa || 142.6} Ha across 18 Gardens
          </span>
        </div>

        <div className="stat">
          <small>MEAN VEGETATION INDEX (NDVI)</small>
          <b>0.74</b>
          <span style={{ fontSize: '11px', color: 'var(--g)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
            <ArrowUpRight size={12} /> +6.2% vs 5-Year Regional Avg
          </span>
        </div>

        <div className="stat">
          <small>FIELD AUDITS CONDUCTED</small>
          <b>{summary?.totalAudits || 344} Plots</b>
          <span style={{ fontSize: '11px', color: 'var(--blue)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
            <ShieldCheck size={12} /> 98.8% GPS Verification Seal
          </span>
        </div>

        <div className="stat">
          <small>SATELLITE REVISIT PASS RATE</small>
          <b>{summary?.satelliteMetrics?.cloud_free_pass_rate_pct || 91.4}%</b>
          <span style={{ fontSize: '11px', color: 'var(--g)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
            <Satellite size={12} /> Sentinel-2 (4.8 Day Cadence)
          </span>
        </div>
      </div>

      {/* Row 1: Weekly Field Audit Surveys & Leaderboard */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 420px), 1fr))',
          gap: '20px',
          width: '100%',
          minWidth: 0
        }}
      >
        {/* Survey & Verification Velocity Bar Chart */}
        <div className="card" style={{ padding: '20px', minWidth: 0, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 4px 0', color: 'var(--ink)' }}>
                Field Survey & Verification Velocity
              </h3>
              <small style={{ color: 'var(--sub)' }}>
                Weekly audits submitted vs certified by agronomists across 8 seasonal weeks
              </small>
            </div>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 10px',
                borderRadius: '12px',
                background: 'var(--gt)',
                color: 'var(--g)',
                fontSize: '11px',
                fontWeight: 650
              }}
            >
              <TrendingUp size={12} /> +28% Survey Momentum
            </span>
          </div>

          <div style={{ width: '100%', height: '260px', minWidth: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={userActivity?.weeklyTrends || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8e3" vertical={false} />
                <XAxis dataKey="week" stroke="#8a9890" fontSize={11} tickLine={false} />
                <YAxis stroke="#8a9890" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #d5ddd7',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    fontSize: '12px'
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="surveys" fill="#0284c7" name="Total Surveys" radius={[4, 4, 0, 0]} />
                <Bar dataKey="verified" fill="#15803d" name="Verified & Sealed" radius={[4, 4, 0, 0]} />
                <Bar dataKey="flagged" fill="#f59e0b" name="Flagged / Re-mapped" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Field Surveyor Leaderboard */}
        <div className="card" style={{ padding: '20px', minWidth: 0, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 4px 0', color: 'var(--ink)' }}>
                Field Auditor Leaderboard
              </h3>
              <small style={{ color: 'var(--sub)' }}>
                Survey volume, GPS precision rate & avg speed
              </small>
            </div>
            <Users size={16} color="var(--g)" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {(userActivity?.auditorLeaderboard || []).slice(0, 5).map((auditor, idx) => (
              <div
                key={auditor.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  background: idx === 0 ? 'var(--gt)' : 'var(--soft)',
                  borderRadius: '6px',
                  border: idx === 0 ? '1px solid #bbf7d0' : '1px solid var(--bd)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: idx === 0 ? 'var(--g)' : 'var(--ink)',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '11px',
                      fontWeight: 700
                    }}
                  >
                    {auditor.avatar}
                  </div>
                  <div>
                    <div style={{ fontWeight: 650, fontSize: '13px', color: 'var(--ink)' }}>
                      {auditor.name}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--sub)' }}>
                      {auditor.district}
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--ink)' }}>
                    {auditor.audits} plots
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--g)', fontWeight: 600 }}>
                    {auditor.accuracyRate} RTK GPS
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 2: Multi-Crop NDVI Progression Curve Comparison */}
      <div className="card" style={{ padding: '20px', minWidth: 0, overflow: 'hidden', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 4px 0', color: 'var(--ink)' }}>
              Multi-Crop NDVI Biomass Progression Comparison
            </h3>
            <small style={{ color: 'var(--sub)' }}>
              Comparative vegetative trajectory across Maize, Sunflower, Coffee & Micro-Plot Sweet Corn
            </small>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--sub)', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#15803d' }} /> Sweet Corn
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#0284c7' }} /> Maize
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#d97706' }} /> Sunflower
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#7e22ce' }} /> Coffee
            </span>
          </div>
        </div>

        <div style={{ width: '100%', height: '280px', minWidth: 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={multiCropNdviData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8e3" />
              <XAxis dataKey="day" stroke="#8a9890" fontSize={11} tickLine={false} />
              <YAxis domain={[0, 1.0]} stroke="#8a9890" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #d5ddd7',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  fontSize: '12px'
                }}
              />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Line type="monotone" dataKey="sweetCorn" stroke="#15803d" strokeWidth={2.5} name="Sweet Corn (UAV RTK)" dot={{ r: 3 }} />
              <Line type="monotone" dataKey="maize" stroke="#0284c7" strokeWidth={2} name="Maize & Soybean" dot={{ r: 3 }} />
              <Line type="monotone" dataKey="sunflower" stroke="#d97706" strokeWidth={2} name="Sunflower Block" dot={{ r: 3 }} />
              <Line type="monotone" dataKey="coffee" stroke="#7e22ce" strokeWidth={2} name="Arabica Coffee" dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 3: Yield Forecast Models & Vegetation Health Distribution */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 420px), 1fr))',
          gap: '20px',
          width: '100%',
          minWidth: 0
        }}
      >
        {/* Yield Projections Table */}
        <div className="card" style={{ padding: '20px', minWidth: 0, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 4px 0', color: 'var(--ink)' }}>
                Machine Learning Yield Projections
              </h3>
              <small style={{ color: 'var(--sub)' }}>
                Satellite peak NDVI correlated with seasonal precipitation
              </small>
            </div>
            <Sparkles size={16} color="var(--g)" />
          </div>

          <div style={{ width: '100%', overflowX: 'auto' }}>
            <table className="admin-table" style={{ width: '100%', minWidth: '420px' }}>
              <thead>
                <tr>
                  <th>CROP VARIETY</th>
                  <th>BENCHMARK</th>
                  <th>PROJECTED YIELD</th>
                  <th>DELTA</th>
                  <th>CONFIDENCE</th>
                </tr>
              </thead>
              <tbody>
                {(summary?.yieldEstimates || []).map((est, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 650, color: 'var(--ink)' }}>{est.crop}</td>
                    <td>{est.benchmark_tons_ha} T/Ha</td>
                    <td style={{ fontWeight: 700, color: 'var(--ink)' }}>{est.projected_tons_ha} T/Ha</td>
                    <td>
                      <span
                        style={{
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 700,
                          background: 'var(--gt)',
                          color: 'var(--g)'
                        }}
                      >
                        {est.change_pct}
                      </span>
                    </td>
                    <td style={{ color: 'var(--sub)', fontSize: '12px' }}>{est.confidence}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Health Distribution Breakdown */}
        <div className="card" style={{ padding: '20px', minWidth: 0, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 4px 0', color: 'var(--ink)' }}>
                Portfolio Canopy Wellness
              </h3>
              <small style={{ color: 'var(--sub)' }}>
                Acreage breakdown across 4 vitality tiers
              </small>
            </div>
            <Activity size={16} color="var(--g)" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {(summary?.healthDistribution || []).map((h, idx) => (
              <div key={idx}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
                  <span style={{ color: 'var(--ink)' }}>{h.name}</span>
                  <span style={{ color: h.color }}>{h.percent}% ({h.count} plots)</span>
                </div>
                <div style={{ width: '100%', height: '8px', background: 'var(--soft)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${h.percent}%`,
                      height: '100%',
                      background: h.color,
                      borderRadius: '4px',
                      transition: 'width 0.6s ease'
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              marginTop: '20px',
              padding: '12px',
              borderRadius: '6px',
              background: 'var(--soft)',
              border: '1px solid var(--bd)',
              fontSize: '11px',
              color: 'var(--sub)',
              lineHeight: 1.5
            }}
          >
            <b>Constellation Status:</b> {summary?.satelliteMetrics?.constellation || 'Sentinel-2A/2B'} •{' '}
            {summary?.satelliteMetrics?.total_scenes_indexed || 184} scenes indexed with{' '}
            {summary?.satelliteMetrics?.highest_resolution || '10m Multi-spectral + 1.5cm UAV RTK'}.
          </div>
        </div>
      </div>
    </div>
  );
}
