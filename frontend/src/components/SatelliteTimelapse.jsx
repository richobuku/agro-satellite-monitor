import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  FastForward,
  Satellite,
  Calendar,
  Cloud,
  Activity,
  History,
  TrendingDown,
  TrendingUp,
  Gauge,
  Clock
} from 'lucide-react';

export default function SatelliteTimelapse({
  scenes,
  selectedSceneIndex,
  onSelectSceneIndex,
  activeLayerType,
  onChangeLayerType,
  loading,
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playDirection, setPlayDirection] = useState('forward'); // 'forward' | 'reverse'
  const [speedMultiplier, setSpeedMultiplier] = useState(1); // 0.5x, 1x, 2x
  const playIntervalRef = useRef(null);

  // Interval duration based on speed multiplier
  const intervalMs = Math.round(1500 / speedMultiplier);

  useEffect(() => {
    if (isPlaying) {
      playIntervalRef.current = setInterval(() => {
        onSelectSceneIndex((prev) => {
          if (!scenes || scenes.length === 0) return 0;
          if (playDirection === 'reverse') {
            // Step backward in time (rewind to emergence / planting)
            return (prev - 1 + scenes.length) % scenes.length;
          } else {
            // Step forward in time (toward maturity / harvest)
            return (prev + 1) % scenes.length;
          }
        });
      }, intervalMs);
    } else {
      if (playIntervalRef.current) clearInterval(playIntervalRef.current);
    }

    return () => {
      if (playIntervalRef.current) clearInterval(playIntervalRef.current);
    };
  }, [isPlaying, scenes, playDirection, speedMultiplier, intervalMs]);

  const currentScene = scenes && scenes.length > 0 ? scenes[selectedSceneIndex] : null;

  // Calculate Delta NDVI vs previous date (or subsequent date for backwards inspection)
  const prevScene = selectedSceneIndex > 0 ? scenes[selectedSceneIndex - 1] : null;
  const currentNdvi = currentScene?.stats?.ndvi || currentScene?.simulatedNdvi || 0;
  const prevNdvi = prevScene ? (prevScene.stats?.ndvi || prevScene.simulatedNdvi || 0) : null;
  const ndviDelta = prevNdvi !== null ? (currentNdvi - prevNdvi) : 0;

  if (loading) {
    return (
      <div className="glass-card" style={{ padding: '16px 20px', textAlign: 'center' }}>
        <div style={{ color: 'var(--cyan-500)', fontSize: '0.86rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <Satellite size={16} className="pulse-marker" /> Fetching Satellite Imagery Timeline…
        </div>
      </div>
    );
  }

  if (!scenes || scenes.length === 0) {
    return (
      <div className="glass-card" style={{ padding: '16px 20px', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem' }}>
          No satellite scenes found for this date range.
        </p>
      </div>
    );
  }

  // Get NDVI label & color
  let ndviCategory = 'Moderate Vigor';
  let ndviColor = '#f59e0b';
  if (currentNdvi >= 0.6) {
    ndviCategory = 'Dense / High Vigor';
    ndviColor = '#10b981';
  } else if (currentNdvi < 0.3) {
    ndviCategory = 'Sparse / Emergence';
    ndviColor = '#ef4444';
  }

  const handleTogglePlay = (direction = 'forward') => {
    if (isPlaying && playDirection === direction) {
      setIsPlaying(false);
    } else {
      setPlayDirection(direction);
      setIsPlaying(true);
    }
  };

  return (
    <div className="card" style={{ padding: '18px 20px' }}>
      {/* Header with Layer Switcher */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Satellite size={18} style={{ color: 'var(--cyan)' }} />
          <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--ink)' }}>Satellite Time-Lapse</span>
          {isPlaying && (
            <span
              style={{
                fontSize: '0.66rem',
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
                background: playDirection === 'reverse' ? 'var(--redt)' : 'var(--gt)',
                color: playDirection === 'reverse' ? 'var(--red)' : 'var(--g)',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              {playDirection === 'reverse' ? <RotateCcw size={10} /> : <Play size={10} />}
              {playDirection === 'reverse' ? 'Rewinding (Reverse)' : 'Playing Forward'}
            </span>
          )}
        </div>

        {/* Layer Mode Picker */}
        <div style={{ display: 'flex', gap: 3, background: 'var(--soft)', padding: 3, borderRadius: 'var(--radius-sm)' }}>
          {[
            { id: 'truecolor', label: 'True Color' },
            { id: 'ndvi', label: 'NDVI' },
            { id: 'falsecolor', label: 'False Color' },
          ].map((mode) => (
            <button
              key={mode.id}
              onClick={() => onChangeLayerType(mode.id)}
              style={{
                border: 'none',
                background: activeLayerType === mode.id ? 'var(--g)' : 'transparent',
                color: activeLayerType === mode.id ? '#fff' : 'var(--text-muted)',
                fontSize: '0.74rem',
                fontWeight: 600,
                padding: '4px 8px',
                borderRadius: 5,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      {/* Current Scene Metadata Badges */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))',
          gap: 10,
          marginBottom: 14,
        }}
      >
        <div className="card" style={{ padding: '8px 12px', background: 'var(--soft)' }}>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-subtle)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Calendar size={12} /> Acquisition Date
          </div>
          <div style={{ fontSize: '0.84rem', fontWeight: 700, marginTop: 2, color: 'var(--ink)' }}>
            {currentScene?.date}
          </div>
        </div>

        <div className="card" style={{ padding: '8px 12px', background: 'var(--soft)' }}>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-subtle)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Cloud size={12} /> Cloud Cover
          </div>
          <div style={{ fontSize: '0.84rem', fontWeight: 700, marginTop: 2, color: 'var(--ink)' }}>
            {currentScene?.clouds}%
          </div>
        </div>

        <div className="card" style={{ padding: '8px 12px', background: 'var(--soft)' }}>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-subtle)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Activity size={12} /> NDVI Health
          </div>
          <div style={{ fontSize: '0.84rem', fontWeight: 800, color: ndviColor, marginTop: 2 }}>
            {currentNdvi.toFixed(2)}
          </div>
        </div>

        <div className="card" style={{ padding: '8px 12px', background: 'var(--soft)' }}>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-subtle)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <History size={12} /> Δ vs Prior Scene
          </div>
          <div
            style={{
              fontSize: '0.82rem',
              fontWeight: 800,
              color: ndviDelta > 0 ? 'var(--emerald-400)' : ndviDelta < 0 ? '#ef4444' : 'var(--text-muted)',
              marginTop: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 3,
            }}
          >
            {ndviDelta > 0 ? (
              <TrendingUp size={12} />
            ) : ndviDelta < 0 ? (
              <TrendingDown size={12} />
            ) : null}
            {prevScene ? `${ndviDelta >= 0 ? '+' : ''}${ndviDelta.toFixed(2)}` : 'Baseline'}
          </div>
        </div>
      </div>

      {/* Progress Scrubber Slider */}
      <div style={{ marginBottom: 14 }}>
        <input
          type="range"
          min="0"
          max={scenes.length - 1}
          value={selectedSceneIndex}
          onChange={(e) => {
            setIsPlaying(false);
            onSelectSceneIndex(parseInt(e.target.value, 10));
          }}
          style={{
            width: '100%',
            accentColor: 'var(--emerald-500)',
            cursor: 'pointer',
            height: 6,
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-subtle)', marginTop: 4 }}>
          <span>{scenes[0]?.date} (Earliest)</span>
          <span style={{ color: 'var(--emerald-400)', fontWeight: 600 }}>
            Scene {selectedSceneIndex + 1} of {scenes.length}
          </span>
          <span>{scenes[scenes.length - 1]?.date} (Latest)</span>
        </div>
      </div>

      {/* Bidirectional Play Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.25)', padding: '8px 12px', borderRadius: 'var(--radius-md)' }}>
        {/* Playback Speed Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Clock size={12} style={{ color: 'var(--text-subtle)' }} />
          {[0.5, 1, 2].map((s) => (
            <button
              key={s}
              onClick={() => setSpeedMultiplier(s)}
              style={{
                border: 'none',
                background: speedMultiplier === s ? 'rgba(255,255,255,0.12)' : 'transparent',
                color: speedMultiplier === s ? 'var(--cyan-400)' : 'var(--text-subtle)',
                fontSize: '0.68rem',
                fontWeight: 700,
                padding: '2px 6px',
                borderRadius: 4,
                cursor: 'pointer',
              }}
            >
              {s}x
            </button>
          ))}
        </div>

        {/* Center: Rewind / Play Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Step Back (1 scene into past) */}
          <button
            className="btn-secondary"
            onClick={() => {
              setIsPlaying(false);
              onSelectSceneIndex((prev) => Math.max(0, prev - 1));
            }}
            disabled={selectedSceneIndex === 0}
            title="Step 1 scene backward into history"
            style={{ padding: '6px 8px' }}
          >
            <SkipBack size={15} />
          </button>

          {/* Reverse Play / Rewind Button */}
          <button
            onClick={() => handleTogglePlay('reverse')}
            className="btn-secondary"
            style={{
              padding: '6px 10px',
              fontSize: '0.74rem',
              borderColor: isPlaying && playDirection === 'reverse' ? '#ef4444' : 'var(--border-subtle)',
              color: isPlaying && playDirection === 'reverse' ? '#f87171' : 'var(--text-muted)',
              background: isPlaying && playDirection === 'reverse' ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
            title="Rewind time-lapse backward toward planting / emergence"
          >
            <RotateCcw size={14} className={isPlaying && playDirection === 'reverse' ? 'pulse-marker' : ''} />
            <span>Rewind</span>
          </button>

          {/* Forward Play Button */}
          <button
            onClick={() => handleTogglePlay('forward')}
            className="btn-primary"
            style={{
              padding: '6px 14px',
              fontSize: '0.74rem',
              background: isPlaying && playDirection === 'forward' ? 'var(--emerald-600)' : 'var(--emerald-500)',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
            }}
            title="Play time-lapse forward in chronological sequence"
          >
            {isPlaying && playDirection === 'forward' ? <Pause size={14} /> : <Play size={14} />}
            <span>{isPlaying && playDirection === 'forward' ? 'Pause' : 'Play Forward'}</span>
          </button>

          {/* Step Forward (1 scene into future) */}
          <button
            className="btn-secondary"
            onClick={() => {
              setIsPlaying(false);
              onSelectSceneIndex((prev) => Math.min(scenes.length - 1, prev + 1));
            }}
            disabled={selectedSceneIndex === scenes.length - 1}
            title="Step 1 scene forward"
            style={{ padding: '6px 8px' }}
          >
            <SkipForward size={15} />
          </button>
        </div>

        {/* Direction Notice */}
        <div style={{ fontSize: '0.68rem', color: 'var(--text-subtle)', textAlign: 'right' }}>
          {playDirection === 'reverse' ? 'Past ⏪' : '⏩ Future'}
        </div>
      </div>
    </div>
  );
}

