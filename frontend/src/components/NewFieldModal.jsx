import React, { useState } from 'react';
import { X, Check, Sprout, Calendar, MapPin, FileText } from 'lucide-react';

const COMMON_CROPS = [
  'Maize',
  'Coffee (Robusta/Arabica)',
  'Soybean',
  'Sunflower',
  'Cassava',
  'Beans',
  'Rice',
  'Bananas / Matooke',
  'Sorghum',
  'Cotton',
  'Vegetables & Horticulture',
  'Other / Mixed Cropping',
];

export default function NewFieldModal({
  isOpen,
  onClose,
  draftPoints,
  calculatedHa,
  onSaveField,
}) {
  const [name, setName] = useState('');
  const [crop, setCrop] = useState('Maize');
  const [plantingDate, setPlantingDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    try {
      await onSaveField({
        name: name.trim(),
        crop,
        planting_date: plantingDate,
        area_ha: calculatedHa,
        coordinates: draftPoints,
        notes: notes.trim(),
      });
      setName('');
      setNotes('');
      onClose();
    } catch (err) {
      alert('Error saving field: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const calculatedAcres = Math.round(calculatedHa * 2.47105 * 100) / 100;

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
            <Sprout size={20} style={{ color: 'var(--g)' }} />
            <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--ink)' }}>Register Mapped Garden</span>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Boundary Size Banner */}
          <div
            style={{
              background: 'var(--gt)',
              border: '1px solid rgba(21, 128, 61, 0.3)',
              borderRadius: 'var(--radius-sm)',
              padding: '10px 14px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '0.82rem',
            }}
          >
            <span style={{ color: 'var(--text-muted)' }}>GPS Mapped Area:</span>
            <span style={{ fontWeight: 800, color: 'var(--g)' }}>
              {calculatedHa} Ha ({calculatedAcres} Acres)
            </span>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
              Garden / Plot Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Oyam Cassava Block B"
              value={name}
              onChange={(e) => setName(e.target.value)}
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

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
              Crop Type
            </label>
            <select
              value={crop}
              onChange={(e) => setCrop(e.target.value)}
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
            >
              {COMMON_CROPS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
              Planting / Sowing Date
            </label>
            <input
              type="date"
              value={plantingDate}
              onChange={(e) => setPlantingDate(e.target.value)}
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

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
              Field Notes / Variety / Irrigation
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Hybrid seed Longe 5, drip irrigation, fertile loam soil"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: 'var(--radius-sm)',
                background: '#fff',
                border: '1.5px solid var(--bd)',
                color: 'var(--ink)',
                fontSize: '0.84rem',
                outline: 'none',
                resize: 'none',
              }}
            />
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              style={{ flex: 1, justifyContent: 'center' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="primary"
              disabled={saving}
              style={{ flex: 1.5, justifyContent: 'center' }}
            >
              <Check size={16} />
              {saving ? 'Registering…' : 'Save & Track Garden'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
