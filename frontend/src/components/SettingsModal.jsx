import React, { useState, useEffect } from 'react';
import { X, Key, ExternalLink, Check, ShieldCheck, Sparkles } from 'lucide-react';
import { api } from '../services/api';

export default function SettingsModal({ isOpen, onClose, onApiKeySaved }) {
  const [apiKey, setApiKey] = useState('');
  const [hasApiKey, setHasApiKey] = useState(false);
  const [keyPreview, setKeyPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      api.getConfig().then((res) => {
        setHasApiKey(res.hasApiKey);
        setKeyPreview(res.keyPreview);
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSavedSuccess(false);
    try {
      const res = await api.saveConfig(apiKey);
      setHasApiKey(res.hasApiKey);
      setSavedSuccess(true);
      if (onApiKeySaved) onApiKeySaved();
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      alert('Error saving API key: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: 440,
          background: '#fff',
          border: '1px solid var(--line)',
          boxShadow: '0 16px 40px rgba(0, 0, 0, 0.15)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--line)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Key size={18} style={{ color: 'var(--cyan)' }} />
            <span style={{ fontWeight: 700, fontSize: '0.96rem', color: 'var(--ink)' }}>AgroMonitoring Satellite Settings</span>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSave} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Status Badge */}
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              background: hasApiKey ? 'var(--gt)' : 'var(--ambert)',
              border: `1px solid ${hasApiKey ? 'rgba(21, 128, 61, 0.3)' : 'rgba(180, 83, 9, 0.3)'}`,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              fontSize: '0.82rem',
            }}
          >
            {hasApiKey ? (
              <>
                <ShieldCheck size={20} style={{ color: 'var(--g)' }} />
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--g)' }}>Live API Connected</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.74rem' }}>
                    Active Key: {keyPreview}
                  </div>
                </div>
              </>
            ) : (
              <>
                <Sparkles size={20} style={{ color: 'var(--amber)' }} />
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--amber)' }}>Demo & Simulation Mode Active</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.74rem' }}>
                    Using simulated Sentinel-2 satellite time-lapse & micro-climate.
                  </div>
                </div>
              </>
            )}
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
              AgroMonitoring API Key (AppID)
            </label>
            <input
              type="password"
              placeholder={hasApiKey ? 'Enter new key to replace existing' : 'e.g. 7f9a1b2c3d4e5f6a7b8c9d0e'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: 'var(--radius-sm)',
                background: '#fff',
                border: '1.5px solid var(--bd)',
                color: 'var(--ink)',
                fontSize: '0.86rem',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ fontSize: '0.74rem', color: 'var(--text-subtle)', lineHeight: 1.5 }}>
            Get your free or commercial API key from{' '}
            <a
              href="https://agromonitoring.com/price#satellite-1"
              target="_blank"
              rel="noreferrer"
              style={{ color: 'var(--cyan)', textDecoration: 'none', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 3 }}
            >
              agromonitoring.com/price <ExternalLink size={11} />
            </a>
            . Enables Sentinel-2 / Landsat-8 real-time satellite imagery, NDVI indices, weather forecasts, and soil telemetry for your polygons.
          </div>

          {savedSuccess && (
            <div style={{ color: 'var(--g)', fontSize: '0.8rem', fontWeight: 600, textAlign: 'center' }}>
              ✓ Settings saved successfully!
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              style={{ flex: 1, justifyContent: 'center' }}
            >
              Close
            </button>
            <button
              type="submit"
              className="primary"
              disabled={loading || !apiKey.trim()}
              style={{ flex: 1.5, justifyContent: 'center' }}
            >
              <Check size={16} />
              {loading ? 'Saving…' : 'Save & Connect'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
