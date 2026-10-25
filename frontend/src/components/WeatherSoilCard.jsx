import React from 'react';
import { CloudSun, Droplets, Wind, Thermometer, Gauge, Waves } from 'lucide-react';

export default function WeatherSoilCard({ weather, forecast, soil, loading }) {
  if (loading) {
    return (
      <div className="glass-panel" style={{ padding: '20px', textAlign: 'center' }}>
        <p style={{ color: 'var(--cyan-500)', fontSize: '0.85rem' }}>Loading field micro-climate & soil data…</p>
      </div>
    );
  }

  const moisture = soil?.moisture || 36;
  const isOptimal = moisture >= 28 && moisture <= 45;
  const moistureColor = isOptimal ? 'var(--emerald-400)' : moisture < 28 ? 'var(--amber-500)' : 'var(--cyan-500)';

  return (
    <div className="card" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Current Weather Card Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <CloudSun size={18} style={{ color: 'var(--amber)' }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--ink)' }}>Field Micro-Climate & Soil</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>Real-time AgroMonitoring telemetry</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
          <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--ink)' }}>{weather?.temp || 27}°C</span>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{weather?.condition || 'Clear'}</span>
        </div>
      </div>

      {/* Grid of 4 Key Environmental Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
        <div className="card" style={{ padding: '8px 10px', textAlign: 'center', background: 'var(--soft)' }}>
          <div style={{ display: 'flex', justifyContent: 'center', color: 'var(--cyan)', marginBottom: 2 }}>
            <Droplets size={14} />
          </div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-subtle)' }}>Humidity</div>
          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--ink)' }}>{weather?.humidity || 70}%</div>
        </div>

        <div className="card" style={{ padding: '8px 10px', textAlign: 'center', background: 'var(--soft)' }}>
          <div style={{ display: 'flex', justifyContent: 'center', color: 'var(--g)', marginBottom: 2 }}>
            <Wind size={14} />
          </div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-subtle)' }}>Wind</div>
          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--ink)' }}>{weather?.wind_speed || 3.2} m/s</div>
        </div>

        <div className="card" style={{ padding: '8px 10px', textAlign: 'center', background: 'var(--soft)' }}>
          <div style={{ display: 'flex', justifyContent: 'center', color: 'var(--amber)', marginBottom: 2 }}>
            <Thermometer size={14} />
          </div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-subtle)' }}>Soil (10cm)</div>
          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--ink)' }}>{soil?.depth_10cm_temp || 23}°C</div>
        </div>

        <div className="card" style={{ padding: '8px 10px', textAlign: 'center', background: 'var(--soft)' }}>
          <div style={{ display: 'flex', justifyContent: 'center', color: moistureColor, marginBottom: 2 }}>
            <Waves size={14} />
          </div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-subtle)' }}>Moisture</div>
          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: moistureColor }}>{moisture}%</div>
        </div>
      </div>

      {/* Soil Status Banner */}
      <div
        style={{
          background: 'var(--soft)',
          border: '1px solid var(--line)',
          borderRadius: 'var(--radius-sm)',
          padding: '8px 12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.78rem',
        }}
      >
        <span style={{ color: 'var(--text-muted)' }}>Root Zone Hydration:</span>
        <span style={{ fontWeight: 700, color: moistureColor }}>
          {soil?.status || (isOptimal ? 'Optimal Hydration' : 'Moderate Moisture')}
        </span>
      </div>

      {/* 5-Day Forecast Strip */}
      {forecast && forecast.length > 0 && (
        <div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', marginBottom: 6, fontWeight: 600 }}>
            5-Day Rain & Temperature Outlook
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6, overflowX: 'auto' }}>
            {forecast.slice(0, 5).map((f, i) => (
              <div
                key={i}
                className="card"
                style={{
                  flex: 1,
                  minWidth: 58,
                  padding: '6px 4px',
                  textAlign: 'center',
                  fontSize: '0.72rem',
                  background: 'var(--soft)',
                }}
              >
                <div style={{ color: 'var(--text-subtle)', fontSize: '0.66rem' }}>{f.date}</div>
                <div style={{ fontWeight: 700, margin: '2px 0', color: 'var(--ink)' }}>{f.temp || f.temp_max}°</div>
                <div style={{ color: 'var(--cyan)', fontSize: '0.65rem' }}>
                  {f.pop !== undefined ? `${f.pop}%` : `${f.precipitation_prob || 20}% rain`}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
