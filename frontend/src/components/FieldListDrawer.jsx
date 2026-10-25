import React, { useState } from 'react';
import { Sprout, Plus, Search, Trash2, MapPin, Calendar, Layers } from 'lucide-react';

export default function FieldListDrawer({
  fields,
  selectedField,
  onSelectField,
  onStartDrawing,
  onDeleteField,
}) {
  const [search, setSearch] = useState('');

  const filtered = fields.filter((f) =>
    (f.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (f.crop || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Search & New Garden Button */}
      <div style={{ marginBottom: 12, display: 'flex', gap: 8 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: 11, color: 'var(--text-subtle)' }} />
          <input
            type="text"
            placeholder="Search gardens, crops…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 10px 8px 30px',
              borderRadius: 'var(--radius-sm)',
              background: '#fff',
              border: '1.5px solid var(--bd)',
              color: 'var(--ink)',
              fontSize: '0.8rem',
              outline: 'none',
            }}
          />
        </div>

        <button
          className="primary"
          onClick={onStartDrawing}
          style={{ padding: '8px 12px', fontSize: '0.78rem' }}
          title="Map a new garden boundary on the phone/map"
        >
          <Plus size={15} />
          <span>New Garden</span>
        </button>
      </div>

      {/* Field Cards List */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, paddingRight: 2 }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
            No gardens found. Tap "New Garden" to map your first field boundary.
          </div>
        ) : (
          filtered.map((f) => {
            const isSelected = selectedField?.id === f.id;
            return (
              <div
                key={f.id}
                className="card"
                onClick={() => onSelectField(f)}
                style={{
                  padding: '12px 14px',
                  cursor: 'pointer',
                  borderColor: isSelected ? 'var(--g)' : 'var(--line)',
                  background: isSelected ? 'var(--gt)' : '#fff',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', color: isSelected ? 'var(--g)' : 'var(--ink)' }}>
                    {f.name}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ color: 'var(--cyan)', fontWeight: 600 }}>{f.crop}</span>
                    <span>•</span>
                    <span>{f.area_ha} Ha ({f.area_acres} Ac)</span>
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-subtle)', marginTop: 2 }}>
                    Planted: {f.planting_date || 'N/A'}
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm(`Delete field "${f.name}"?`)) {
                      onDeleteField(f.id);
                    }
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-subtle)',
                    padding: 6,
                    borderRadius: 4,
                    cursor: 'pointer',
                  }}
                  title="Delete field"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
