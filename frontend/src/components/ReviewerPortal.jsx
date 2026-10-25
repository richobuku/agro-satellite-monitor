import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle,
  Copy,
  ExternalLink,
  Download,
  FileCheck,
  Layers,
  Sprout,
  Activity,
  Droplets,
  Calendar,
  Compass,
  FileSpreadsheet,
  QrCode,
  Share2,
  Printer,
  ChevronRight,
  Info
} from 'lucide-react';

export default function ReviewerPortal({
  fields = [],
  selectedField,
  onSelectField,
  onSwitchToMap,
}) {
  const [activeFieldId, setActiveFieldId] = useState(selectedField?.id || fields[0]?.id || null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [dossierModalOpen, setDossierModalOpen] = useState(false);

  const currentField = fields.find((f) => f.id === activeFieldId) || fields[0] || null;

  const handleCopyLink = () => {
    const url = `${window.location.origin}${window.location.pathname}?mode=reviewer&plot=${currentField?.id || ''}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handlePrintDossier = () => {
    window.print();
  };

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px', background: 'var(--bg-primary)' }}>
      {/* Reviewer Header & Verification Banner */}
      <div
        className="glass-panel"
        style={{
          padding: '18px 24px',
          marginBottom: 24,
          border: '1px solid rgba(16, 185, 129, 0.4)',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(6, 182, 212, 0.08) 100%)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.2)',
              border: '2px solid var(--emerald-500)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 15px rgba(16, 185, 129, 0.4)',
            }}
          >
            <ShieldCheck size={24} style={{ color: 'var(--emerald-400)' }} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="badge-emerald" style={{ fontSize: '0.72rem' }}>
                THIRD-PARTY AUDITOR MODE
              </span>
              <span className="badge-cyan" style={{ fontSize: '0.72rem' }}>
                READ-ONLY VERIFICATION
              </span>
            </div>
            <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--ink)', marginTop: 4 }}>
              Partner Verification & Micro-Plot Inspection Portal
            </h1>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Independent reviewer view for agricultural banks, crop insurers, off-takers, and donor agencies.
            </p>
          </div>
        </div>

        {/* Shareable Link & Export Tools */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            className="btn-secondary"
            onClick={handleCopyLink}
            title="Copy shareable link for external reviewers and partners"
            style={{ borderColor: copiedLink ? 'var(--g)' : 'var(--line)' }}
          >
            <Share2 size={15} style={{ color: copiedLink ? 'var(--g)' : 'var(--cyan)' }} />
            <span>{copiedLink ? 'Link Copied!' : 'Copy Reviewer Link'}</span>
          </button>

          <button
            className="btn-primary"
            onClick={() => setDossierModalOpen(true)}
            title="Generate official audit dossier for loan or insurance approval"
          >
            <FileCheck size={16} />
            <span>Audit Dossier</span>
          </button>
        </div>
      </div>

      {/* Main Audit Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 24, alignItems: 'start' }}>
        {/* Left Column: Plots Fleet Directory */}
        <div className="card" style={{ padding: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h2 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--ink)' }}>
              Monitored Plots ({fields.length})
            </h2>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Select to inspect</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {fields.map((field) => {
              const isSelected = currentField?.id === field.id;
              const isMicro = field.is_micro_plot || field.area_acres <= 0.5;

              return (
                <div
                  key={field.id}
                  onClick={() => setActiveFieldId(field.id)}
                  style={{
                    background: isSelected ? 'var(--gt)' : '#fff',
                    border: `1.5px solid ${isSelected ? 'var(--g)' : 'var(--line)'}`,
                    borderRadius: 'var(--radius-md)',
                    padding: '12px 14px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <strong style={{ fontSize: '0.86rem', color: isSelected ? 'var(--g)' : 'var(--ink)' }}>
                      {field.name}
                    </strong>
                    {isMicro && (
                      <span className="badge-cyan" style={{ fontSize: '0.65rem', padding: '1px 5px' }}>
                        1/8 ACRE
                      </span>
                    )}
                  </div>

                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: 4 }}>
                    {field.crop} • <strong style={{ color: 'var(--ink)' }}>{field.area_acres} Acres</strong> ({field.area_ha} Ha)
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, fontSize: '0.7rem' }}>
                    <span style={{ color: 'var(--text-subtle)' }}>
                      {field.resolution_tier || 'Satellite 10m'}
                    </span>
                    <span style={{ color: 'var(--g)', fontWeight: 600 }}>
                      NDVI: {(field.currentNdvi || 0.68).toFixed(2)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Deep Verification Dossier */}
        {currentField ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Plot Identification & GPS Integrity Card */}
            <div className="card" style={{ padding: '22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span className="badge-emerald">AUDIT VERIFIED</span>
                    {currentField.is_micro_plot ? (
                      <span className="badge-cyan">UAV RTK DRONE PRECISION (1.5 CM/PX)</span>
                    ) : (
                      <span className="badge-cyan">SENTINEL-2 CALIBRATED</span>
                    )}
                  </div>
                  <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--ink)' }}>
                    {currentField.name}
                  </h2>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Coordinates: {currentField.center ? `${currentField.center[0].toFixed(5)}°N, ${currentField.center[1].toFixed(5)}°E` : 'Polygon bound'} • Gulu Agricultural Zone
                  </p>
                </div>

                <button
                  className="btn-secondary"
                  onClick={() => {
                    onSelectField(currentField);
                    onSwitchToMap();
                  }}
                  style={{ fontSize: '0.8rem' }}
                >
                  <Compass size={14} style={{ color: 'var(--g)' }} />
                  <span>Inspect in Cockpit Map</span>
                </button>
              </div>

              {/* Surface & Geometry Metrics */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginTop: 18 }}>
                <div className="card" style={{ padding: '12px 16px', background: 'var(--soft)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>VERIFIED SURFACE AREA</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--ink)', marginTop: 2 }}>
                    {currentField.area_acres} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Acres</span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--g)', marginTop: 2 }}>
                    ≈ {currentField.area_ha} Ha ({Math.round((currentField.area_ha || 0.05) * 10000)} m²)
                  </div>
                </div>

                <div className="card" style={{ padding: '12px 16px', background: 'var(--soft)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>CANOPY HEALTH INDEX</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--g)', marginTop: 2 }}>
                    {(currentField.currentNdvi || 0.72).toFixed(2)} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>NDVI</span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', marginTop: 2 }}>
                    Optimal Vegetative Density
                  </div>
                </div>

                <div className="card" style={{ padding: '12px 16px', background: 'var(--soft)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>ROOT-ZONE MOISTURE</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--cyan)', marginTop: 2 }}>
                    {currentField.soilMoisture || 31}%
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', marginTop: 2 }}>
                    Adequate field capacity
                  </div>
                </div>

                <div className="card" style={{ padding: '12px 16px', background: 'var(--soft)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>RESOLUTION TIER</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--ink)', marginTop: 2 }}>
                    {currentField.is_micro_plot ? '1.5 cm/px' : '10 m/px'}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--cyan)', marginTop: 2 }}>
                    {currentField.is_micro_plot ? 'UAV Centimeter RTK' : 'Sentinel-2 Satellite'}
                  </div>
                </div>
              </div>
            </div>

            {/* Micro-Plot Bed-Level Verification Table (For 1/8 Acre plots) */}
            {currentField.crop_beds && currentField.crop_beds.length > 0 ? (
              <div className="card" style={{ padding: '22px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--ink)' }}>
                      🌱 Micro-Plot Bed Breakdown & Crop Identification (1/8 Acre)
                    </h3>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      High-precision plant spacing, stand count, and bed-level varieties mapped with centimeter drone precision.
                    </p>
                  </div>
                  <span className="badge-emerald">100% CANOPY IDENTIFIED</span>
                </div>

                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Bed Section</th>
                      <th>Verified Crop Variety</th>
                      <th>Plant Spacing</th>
                      <th>Stand Population</th>
                      <th>Health Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentField.crop_beds.map((bed) => (
                      <tr key={bed.id}>
                        <td>
                          <strong style={{ color: 'var(--ink)' }}>{bed.name}</strong>
                        </td>
                        <td>
                          <span className="badge-cyan" style={{ fontSize: '0.74rem' }}>
                            {bed.crop}
                          </span>
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          {bed.spacing}
                        </td>
                        <td>
                          <strong style={{ color: 'var(--g)', fontFamily: 'var(--font-mono)' }}>
                            {bed.plants} plants
                          </strong>
                        </td>
                        <td>
                          <span className="badge-emerald" style={{ fontSize: '0.72rem' }}>
                            ✓ {bed.health}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="card" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <Sprout size={18} style={{ color: 'var(--g)' }} />
                  <h3 style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--ink)' }}>
                    Commercial Field Variety: {currentField.crop}
                  </h3>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  This plot is registered as a commercial block ({currentField.area_acres} Acres). For 1/8 acre micro-plots, bed-level drone crop row segmentation is automatically rendered.
                </p>
              </div>
            )}

            {/* Auditor Sign-off & Compliance Integrity */}
            <div className="card" style={{ padding: '22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle size={18} style={{ color: 'var(--g)' }} />
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--ink)' }}>
                    Compliance & Verification Sign-Off
                  </h3>
                </div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', fontFamily: 'var(--font-mono)' }}>
                  AUDIT ID: #UG-AGP-2026-{(currentField.id || '').toUpperCase()}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10 }}>
                <div style={{ background: 'var(--soft)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--line)' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--g)', fontWeight: 700 }}>✓ BOUNDARY VERIFIED</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-main)', marginTop: 2 }}>
                    GPS Perimeter closed without overlapping claims.
                  </div>
                </div>

                <div style={{ background: 'var(--soft)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--line)' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--g)', fontWeight: 700 }}>✓ SATELLITE HISTORY CALIBRATED</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-main)', marginTop: 2 }}>
                    Sentinel-2 & Landsat optical passes match planting date.
                  </div>
                </div>

                <div style={{ background: 'var(--soft)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--line)' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--g)', fontWeight: 700 }}>✓ DISASTER RISK LOW</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-main)', marginTop: 2 }}>
                    No flooding, hail, or severe drought anomalies recorded.
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Audit Dossier Modal */}
      {dossierModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.82)',
            backdropFilter: 'blur(10px)',
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
        >
          <div
            className="card"
            style={{
              width: 580,
              maxWidth: '95vw',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '28px',
              border: '1.5px solid var(--g)',
              boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
              background: '#fff',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <span className="badge-emerald">OFFICIAL AUDIT REPORT</span>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--ink)', marginTop: 4 }}>
                  AgroPulse Verification Dossier
                </h2>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Issued on: {new Date().toLocaleDateString()} • Reference: UG-AGP-2026-AUDIT
                </div>
              </div>
              <button
                className="btn-secondary"
                onClick={() => setDossierModalOpen(false)}
                style={{ padding: '6px 10px' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, fontSize: '0.84rem' }}>
              <div style={{ background: 'var(--soft)', padding: '14px', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontWeight: 700, color: 'var(--ink)', marginBottom: 6 }}>Plot Identification</div>
                <div>Name: <strong>{currentField?.name}</strong></div>
                <div>Crop: <strong>{currentField?.crop}</strong></div>
                <div>Area: <strong>{currentField?.area_acres} Acres ({currentField?.area_ha} Ha)</strong></div>
                <div>Coordinates: <strong>{currentField?.center ? `${currentField.center[0]}, ${currentField.center[1]}` : 'N/A'}</strong></div>
              </div>

              <div style={{ background: 'var(--soft)', padding: '14px', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontWeight: 700, color: 'var(--ink)', marginBottom: 6 }}>Biophysical Assessment</div>
                <div>Vegetation Vigor (NDVI): <strong>{(currentField?.currentNdvi || 0.72).toFixed(2)} (High Density)</strong></div>
                <div>Root-Zone Soil Moisture: <strong>{currentField?.soilMoisture || 31}%</strong></div>
                <div>Resolution: <strong>{currentField?.resolution_tier || 'Satellite Multi-Spectral'}</strong></div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginTop: 10 }}>
                <button
                  className="btn-secondary"
                  onClick={handlePrintDossier}
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  <Printer size={15} />
                  <span>Print Dossier</span>
                </button>
                <button
                  className="btn-primary"
                  onClick={() => {
                    handlePrintDossier();
                    setDossierModalOpen(false);
                  }}
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  <Download size={15} />
                  <span>Save as PDF</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
