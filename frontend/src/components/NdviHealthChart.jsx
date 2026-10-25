import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceArea,
  Area,
  ComposedChart,
} from 'recharts';
import { TrendingUp, AlertCircle, CheckCircle2, Leaf } from 'lucide-react';

export default function NdviHealthChart({ data, loading }) {
  if (loading) {
    return (
      <div className="glass-panel" style={{ padding: '20px', textAlign: 'center' }}>
        <p style={{ color: 'var(--emerald-400)', fontSize: '0.85rem' }}>Loading NDVI historical health curve…</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="glass-panel" style={{ padding: '20px', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No historical NDVI points recorded yet.</p>
      </div>
    );
  }

  // Format data for Recharts
  const chartPoints = data.map((d) => ({
    date: d.date.slice(5), // '08-15'
    fullDate: d.date,
    mean: d.mean,
    min: d.min,
    max: d.max,
  }));

  const latest = data[data.length - 1]?.mean || 0;
  const previous = data[Math.max(0, data.length - 5)]?.mean || latest;
  const delta = Math.round((latest - previous) * 100) / 100;

  return (
    <div className="card" style={{ padding: '18px 20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Leaf size={18} style={{ color: 'var(--g)' }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--ink)' }}>Vegetation Health Index (NDVI)</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>Multi-spectral satellite vigor tracking</div>
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--g)' }}>
            {latest.toFixed(2)}
          </div>
          <div style={{ fontSize: '0.7rem', color: delta >= 0 ? 'var(--g)' : 'var(--rose-500)', fontWeight: 600 }}>
            {delta >= 0 ? `+${delta}` : delta} vs last month
          </div>
        </div>
      </div>

      {/* Chart container */}
      <div style={{ width: '100%', height: 180 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartPoints} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
            <defs>
              <linearGradient id="ndviGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#15803d" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#15803d" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />

            <XAxis dataKey="date" stroke="#8b988f" fontSize={10} tickLine={false} />
            <YAxis domain={[0, 1]} stroke="#8b988f" fontSize={10} tickLine={false} ticks={[0.2, 0.4, 0.6, 0.8]} />

            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const pt = payload[0].payload;
                return (
                  <div
                    style={{
                      background: '#fff',
                      border: '1px solid var(--bd)',
                      padding: '8px 12px',
                      borderRadius: 8,
                      fontSize: '0.75rem',
                      boxShadow: '0 4px 14px rgba(0,0,0,0.08)',
                      color: 'var(--ink)',
                    }}
                  >
                    <div style={{ color: 'var(--mute)', marginBottom: 2 }}>{pt.fullDate}</div>
                    <div style={{ fontWeight: 700, color: 'var(--g)' }}>
                      NDVI: {pt.mean.toFixed(3)}
                    </div>
                    <div style={{ color: 'var(--faint)', fontSize: '0.7rem' }}>
                      Range: {pt.min.toFixed(2)} - {pt.max.toFixed(2)}
                    </div>
                  </div>
                );
              }}
            />

            <Area type="monotone" dataKey="mean" stroke="#15803d" strokeWidth={2.5} fillOpacity={1} fill="url(#ndviGradient)" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Vigor Range Legend */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--mute)', marginTop: 8, pt: 8, borderTop: '1px solid var(--line)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }} />
          <span>&lt;0.3 Bare/Stressed</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b' }} />
          <span>0.3–0.6 Moderate</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#15803d' }} />
          <span>&gt;0.6 Dense Canopy</span>
        </div>
      </div>
    </div>
  );
}
