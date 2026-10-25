import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Layers, MapPin, Navigation, Compass, Check, X, Plus, Sparkles, ZoomIn, ZoomOut } from 'lucide-react';

// Spherical polygon area calculator in square meters -> hectares / acres
function computePolygonArea(coords) {
  if (!coords || coords.length < 3) return 0;
  const radius = 6378137; // Earth's radius in meters
  let area = 0;

  for (let i = 0; i < coords.length; i++) {
    const j = (i + 1) % coords.length;
    const p1 = coords[i]; // [lng, lat]
    const p2 = coords[j];

    const lon1 = (p1[0] * Math.PI) / 180;
    const lat1 = (p1[1] * Math.PI) / 180;
    const lon2 = (p2[0] * Math.PI) / 180;
    const lat2 = (p2[1] * Math.PI) / 180;

    area += (lon2 - lon1) * (2 + Math.sin(lat1) + Math.sin(lat2));
  }

  area = Math.abs((area * radius * radius) / 2.0);
  return area; // in square meters
}

const SATELLITE_TILES = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
const STREET_TILES = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

export default function FieldMap({
  fields = [],
  selectedField,
  onSelectField,
  onOpenNewFieldModal,
  activeLayerType, // 'truecolor' | 'ndvi' | 'falsecolor'
  activeScene,
  drawingMode,
  setDrawingMode,
  draftPoints = [],
  setDraftPoints,
}) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const baseTileLayerRef = useRef(null);
  const layersGroup = useRef(null);
  const draftGroup = useRef(null);
  const satelliteOverlayRef = useRef(null);

  // Map base layer type
  const [mapType, setMapType] = useState('satellite'); // 'satellite' | 'streets'

  // User real-time location & tracking
  const [liveGpsActive, setLiveGpsActive] = useState(true);
  const [gpsCoords, setGpsCoords] = useState(null); // { lat, lng, accuracy, heading, speed }
  const [gpsStatus, setGpsStatus] = useState('searching'); // 'searching' | 'locked' | 'fallback' | 'denied'
  const [followUser, setFollowUser] = useState(false);
  const [autoWalkMode, setAutoWalkMode] = useState(false); // Auto drop points every 8-10m
  const watchIdRef = useRef(null);
  const userMarkerRef = useRef(null);
  const userAccuracyCircleRef = useRef(null);
  const lastRecordedPtRef = useRef(null);

  // 1. Initialize Map on Mount
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const initialCenter = selectedField?.center || [2.7745, 32.299]; // Default coordinates
    const map = L.map(mapRef.current, {
      center: initialCenter,
      zoom: 15,
      maxZoom: 22,
      zoomControl: false,
    });

    // Add Base Satellite Tiles with high zoom headroom
    baseTileLayerRef.current = L.tileLayer(SATELLITE_TILES, {
      maxZoom: 22,
      maxNativeZoom: 19,
      attribution: '&copy; Esri World Imagery',
    }).addTo(map);

    layersGroup.current = L.featureGroup().addTo(map);
    draftGroup.current = L.featureGroup().addTo(map);

    mapInstance.current = map;

    // Fast initial location detection on mount
    if (navigator.geolocation) {
      setGpsStatus('searching');
      const onInitialSuccess = (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        setGpsCoords({ lat: latitude, lng: longitude, accuracy: Math.round(accuracy || 0) });
        setGpsStatus('locked');
        if (!selectedField && mapInstance.current) {
          mapInstance.current.setView([latitude, longitude], 16);
        }
      };

      const onInitialFail = () => {
        // Fallback to standard accuracy or IP geolocation if GPS hardware lock takes long
        navigator.geolocation.getCurrentPosition(
          onInitialSuccess,
          () => {
            fetch('https://ipapi.co/json/')
              .then((r) => r.json())
              .then((data) => {
                if (data && data.latitude && data.longitude) {
                  setGpsCoords({ lat: data.latitude, lng: data.longitude, accuracy: 2500, isIpFallback: true });
                  setGpsStatus('fallback');
                  if (!selectedField && mapInstance.current) {
                    mapInstance.current.setView([data.latitude, data.longitude], 13);
                  }
                }
              })
              .catch(() => setGpsStatus('denied'));
          },
          { enableHighAccuracy: false, timeout: 6000 }
        );
      };

      navigator.geolocation.getCurrentPosition(onInitialSuccess, onInitialFail, {
        enableHighAccuracy: false,
        timeout: 4500,
      });
    }

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      map.remove();
      mapInstance.current = null;
    };
  }, []);

  // 2. Base Tile Switcher (Satellite <-> Streets)
  useEffect(() => {
    if (!mapInstance.current || !baseTileLayerRef.current) return;
    const url = mapType === 'satellite' ? SATELLITE_TILES : STREET_TILES;
    baseTileLayerRef.current.setUrl(url);
  }, [mapType]);

  // 3. Render Field Polygons
  useEffect(() => {
    const map = mapInstance.current;
    const group = layersGroup.current;
    if (!map || !group) return;

    group.clearLayers();

    fields.forEach((field) => {
      // coordinates can be in field.coordinates or field.geo_json.geometry.coordinates[0]
      let rawCoords = field.coordinates;
      if (!rawCoords && field.geo_json?.geometry?.coordinates?.[0]) {
        rawCoords = field.geo_json.geometry.coordinates[0];
      }
      if (!rawCoords || rawCoords.length < 3) return;

      // Leaflet expects [lat, lng], whereas GeoJSON has [lng, lat]
      const latlngs = rawCoords.map((pt) => [pt[1], pt[0]]);
      const isSelected = selectedField && selectedField.id === field.id;

      const polygon = L.polygon(latlngs, {
        color: isSelected ? '#10b981' : '#06b6d4',
        weight: isSelected ? 3 : 1.8,
        fillColor: isSelected ? '#10b981' : '#06b6d4',
        fillOpacity: isSelected ? 0.28 : 0.12,
        dashArray: isSelected ? null : '4, 4',
      });

      polygon.bindTooltip(
        `<div style="font-weight:700;color:#fff">${field.name}</div>
         <div style="font-size:11px;color:#94a3b8">${field.crop || 'Crop'} • ${field.area_ha} Ha</div>`,
        { permanent: isSelected, direction: 'center', className: 'custom-field-label' }
      );

      polygon.on('click', () => {
        if (!drawingMode) {
          onSelectField(field);
        }
      });

      // If plot has micro-beds (e.g. 1/8 acre intercropped), render bed-level crop partitions
      if (field.crop_beds && field.crop_beds.length > 0) {
        const bedCount = field.crop_beds.length;
        const lats = latlngs.map((p) => p[0]);
        const lngs = latlngs.map((p) => p[1]);
        const minLat = Math.min(...lats);
        const maxLat = Math.max(...lats);
        const minLng = Math.min(...lngs);
        const maxLng = Math.max(...lngs);
        const latStep = (maxLat - minLat) / bedCount;

        const bedPalette = ['#f59e0b', '#10b981', '#f43f5e', '#06b6d4'];

        field.crop_beds.forEach((bed, bIdx) => {
          const bedMinLat = minLat + bIdx * latStep;
          const bedMaxLat = minLat + (bIdx + 1) * latStep;
          const bedBox = [
            [bedMinLat, minLng],
            [bedMinLat, maxLng],
            [bedMaxLat, maxLng],
            [bedMaxLat, minLng],
          ];

          const color = bedPalette[bIdx % bedPalette.length];
          const bedPoly = L.polygon(bedBox, {
            color: color,
            weight: 1.5,
            fillColor: color,
            fillOpacity: isSelected ? 0.38 : 0.22,
            dashArray: '3, 3',
          });

          bedPoly.bindTooltip(
            `<div style="font-weight:800;color:${color}">${bed.name}: ${bed.crop}</div>
             <div style="font-size:10px;color:#cbd5e1">${bed.plants} plants • ${bed.spacing}</div>`,
            { permanent: isSelected, direction: 'center', className: 'custom-field-label' }
          );

          bedPoly.on('click', () => {
            if (!drawingMode) onSelectField(field);
          });

          group.addLayer(bedPoly);
        });
      }

      group.addLayer(polygon);
    });

    // Center on selected field if bounds exist
    if (selectedField) {
      let rawCoords = selectedField.coordinates;
      if (!rawCoords && selectedField.geo_json?.geometry?.coordinates?.[0]) {
        rawCoords = selectedField.geo_json.geometry.coordinates[0];
      }
      if (rawCoords && rawCoords.length >= 3) {
        const latlngs = rawCoords.map((pt) => [pt[1], pt[0]]);
        const bounds = L.latLngBounds(latlngs);
        const maxFitZoom = selectedField.is_micro_plot || selectedField.area_acres <= 0.5 ? 20 : 17;
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: maxFitZoom, animate: true });
      } else if (selectedField.center) {
        map.setView(selectedField.center, selectedField.is_micro_plot ? 19 : 16, { animate: true });
      }
    }
  }, [fields, selectedField, drawingMode]);

  // 4. Satellite Layer Overlay (TrueColor / NDVI / FalseColor)
  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;

    if (satelliteOverlayRef.current) {
      map.removeLayer(satelliteOverlayRef.current);
      satelliteOverlayRef.current = null;
    }

    if (activeScene && activeLayerType) {
      const tileUrl = activeScene[activeLayerType] || activeScene.truecolor;
      if (tileUrl) {
        satelliteOverlayRef.current = L.tileLayer(tileUrl, {
          opacity: 0.85,
          zIndex: 400,
        }).addTo(map);
      }
    }
  }, [activeScene, activeLayerType]);

  // 5. Drawing Mode Interaction
  useEffect(() => {
    const map = mapInstance.current;
    const group = draftGroup.current;
    if (!map || !group) return;

    group.clearLayers();

    if (!drawingMode) return;

    // Render draft vertices & polyline
    if (draftPoints.length > 0) {
      const latlngs = draftPoints.map((pt) => [pt[1], pt[0]]);

      // Polyline / Draft Polygon
      const draftPoly = L.polygon(latlngs, {
        color: '#f59e0b',
        weight: 2.5,
        fillColor: '#f59e0b',
        fillOpacity: 0.2,
        dashArray: '5, 5',
      });
      group.addLayer(draftPoly);

      // Marker on each corner vertex
      draftPoints.forEach((pt, idx) => {
        const marker = L.circleMarker([pt[1], pt[0]], {
          radius: idx === 0 ? 7 : 5,
          color: idx === 0 ? '#10b981' : '#f59e0b',
          fillColor: '#ffffff',
          fillOpacity: 1,
          weight: 2,
        });
        group.addLayer(marker);
      });
    }

    // Map click handler to add points
    const handleMapClick = (e) => {
      const { lat, lng } = e.latlng;
      setDraftPoints((prev) => [...prev, [lng, lat]]);
    };

    map.on('click', handleMapClick);

    return () => {
      map.off('click', handleMapClick);
    };
  }, [drawingMode, draftPoints]);

  // 6. Continuous Real-Time GPS Tracking via watchPosition
  useEffect(() => {
    if (!liveGpsActive) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (userMarkerRef.current && mapInstance.current) {
        mapInstance.current.removeLayer(userMarkerRef.current);
        userMarkerRef.current = null;
      }
      if (userAccuracyCircleRef.current && mapInstance.current) {
        mapInstance.current.removeLayer(userAccuracyCircleRef.current);
        userAccuracyCircleRef.current = null;
      }
      return;
    }

    if (!navigator.geolocation) {
      setGpsStatus('denied');
      return;
    }

    const handlePos = (pos) => {
      const { latitude, longitude, accuracy, heading, speed } = pos.coords;
      const coords = { lat: latitude, lng: longitude, accuracy: Math.round(accuracy || 0), heading, speed };
      setGpsCoords(coords);
      setGpsStatus('locked');

      const map = mapInstance.current;
      if (!map) return;

      // Update or create accuracy circle
      if (!userAccuracyCircleRef.current) {
        userAccuracyCircleRef.current = L.circle([latitude, longitude], {
          radius: accuracy || 10,
          color: '#06b6d4',
          fillColor: '#06b6d4',
          fillOpacity: 0.12,
          weight: 1,
          dashArray: '3, 4',
        }).addTo(map);
      } else {
        userAccuracyCircleRef.current.setLatLng([latitude, longitude]);
        userAccuracyCircleRef.current.setRadius(accuracy || 10);
      }

      // Update or create user location marker with radar pulse
      if (!userMarkerRef.current) {
        const customIcon = L.divIcon({
          className: 'gps-user-marker-container',
          html: `
            <div style="position:relative;width:32px;height:32px;display:flex;align-items:center;justify-content:center;">
              <div class="gps-radar-ring" style="position:absolute;width:28px;height:28px;border-radius:50%;background:rgba(6,182,212,0.35);border:1px solid #06b6d4;"></div>
              <div style="width:14px;height:14px;border-radius:50%;background:#06b6d4;border:2.5px solid #ffffff;box-shadow:0 0 12px rgba(6,182,212,0.9);z-index:2;"></div>
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        userMarkerRef.current = L.marker([latitude, longitude], { icon: customIcon, zIndexOffset: 1000 }).addTo(map);
      } else {
        userMarkerRef.current.setLatLng([latitude, longitude]);
      }

      // Auto-follow map pan
      if (followUser) {
        map.panTo([latitude, longitude], { animate: true, duration: 0.8 });
      }

      // Auto-walk perimeter recording (if autoWalkMode is enabled)
      if (autoWalkMode && drawingMode) {
        const last = lastRecordedPtRef.current;
        if (!last) {
          lastRecordedPtRef.current = [longitude, latitude];
          setDraftPoints((prev) => [...prev, [longitude, latitude]]);
        } else {
          // Distance calculation (Haversine approx)
          const dLat = (latitude - last[1]) * 111320;
          const dLng = (longitude - last[0]) * 111320 * Math.cos(latitude * (Math.PI / 180));
          const distM = Math.sqrt(dLat * dLat + dLng * dLng);

          // Record new vertex every 8 meters of walking
          if (distM >= 8) {
            lastRecordedPtRef.current = [longitude, latitude];
            setDraftPoints((prev) => [...prev, [longitude, latitude]]);
          }
        }
      }
    };

    const handleErr = (err) => {
      console.warn('GPS Watch Notice:', err.message, 'code:', err.code);
      if (err.code === 1) {
        setGpsStatus('denied');
      } else if (err.code === 2 || err.code === 3) {
        // Code 2 (POSITION_UNAVAILABLE) or Code 3 (TIMEOUT)
        // High-accuracy hardware GNSS unavailable on laptops/Macs; fall back to standard Wi-Fi / IP
        if (watchIdRef.current !== null) {
          navigator.geolocation.clearWatch(watchIdRef.current);
          watchIdRef.current = navigator.geolocation.watchPosition(
            handlePos,
            () => {
              handleUseIpLocation();
            },
            {
              enableHighAccuracy: false,
              maximumAge: 15000,
              timeout: 8000,
            }
          );
        }
      }
    };

    watchIdRef.current = navigator.geolocation.watchPosition(handlePos, handleErr, {
      enableHighAccuracy: false,
      maximumAge: 5000,
      timeout: 6000,
    });

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [liveGpsActive, followUser, autoWalkMode, drawingMode]);

  // Fallback to Network / IP Geolocation if hardware GPS is blocked or unavailable
  const handleUseIpLocation = () => {
    setGpsStatus('searching');
    fetch('https://ipapi.co/json/')
      .then((r) => r.json())
      .then((data) => {
        if (data && data.latitude && data.longitude) {
          const coords = {
            lat: data.latitude,
            lng: data.longitude,
            accuracy: 2500,
            city: data.city,
            country: data.country_name,
            isIpFallback: true,
          };
          setGpsCoords(coords);
          setGpsStatus('fallback');
          if (mapInstance.current) {
            mapInstance.current.flyTo([data.latitude, data.longitude], 13, { duration: 1.2 });
          }
        }
      })
      .catch(() => {
        // Silently keep current map view
      });
  };

  // One-tap force locate & fly to real-time position
  const handleLocateMe = () => {
    setLiveGpsActive(true);
    setFollowUser(true);
    if (!navigator.geolocation) {
      handleUseIpLocation();
      return;
    }
    setGpsStatus('searching');

    const tryStandardAccuracy = () => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude, accuracy } = pos.coords;
          setGpsCoords({ lat: latitude, lng: longitude, accuracy: Math.round(accuracy || 0) });
          setGpsStatus('locked');
          if (mapInstance.current) {
            mapInstance.current.flyTo([latitude, longitude], 16, { duration: 1.0 });
          }
        },
        () => handleUseIpLocation(),
        { enableHighAccuracy: false, timeout: 6000, maximumAge: 30000 }
      );
    };

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        setGpsCoords({ lat: latitude, lng: longitude, accuracy: Math.round(accuracy || 0) });
        setGpsStatus('locked');
        if (mapInstance.current) {
          mapInstance.current.flyTo([latitude, longitude], 17, { duration: 1.2 });
        }
      },
      () => tryStandardAccuracy(),
      { enableHighAccuracy: false, timeout: 4500 }
    );
  };

  // Toggle Continuous Real-Time GPS Tracking
  const handleToggleLiveGps = () => {
    if (!liveGpsActive) {
      handleLocateMe();
    } else {
      setLiveGpsActive(false);
      setAutoWalkMode(false);
    }
  };

  // Record current GPS position into polygon boundary
  const handleRecordGpsPoint = () => {
    if (gpsCoords) {
      setDraftPoints((prev) => [...prev, [gpsCoords.lng, gpsCoords.lat]]);
      if (mapInstance.current) {
        mapInstance.current.panTo([gpsCoords.lat, gpsCoords.lng]);
      }
      return;
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude, accuracy } = pos.coords;
          setGpsCoords({ lat: latitude, lng: longitude, accuracy: Math.round(accuracy || 0) });
          setDraftPoints((prev) => [...prev, [longitude, latitude]]);
          if (mapInstance.current) {
            mapInstance.current.panTo([latitude, longitude]);
          }
        },
        () => {
          // If hardware GPS is unavailable on macOS, drop corner at current map center seamlessly
          if (mapInstance.current) {
            const center = mapInstance.current.getCenter();
            setDraftPoints((prev) => [...prev, [center.lng, center.lat]]);
          }
        },
        { enableHighAccuracy: false, timeout: 3500 }
      );
    } else if (mapInstance.current) {
      const center = mapInstance.current.getCenter();
      setDraftPoints((prev) => [...prev, [center.lng, center.lat]]);
    }
  };

  const calculatedAreaM2 = computePolygonArea(draftPoints);
  const calculatedHa = Math.round((calculatedAreaM2 / 10000) * 100) / 100;
  const calculatedAcres = Math.round(calculatedHa * 2.47105 * 100) / 100;

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Map Canvas */}
      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />

      {/* Floating Top Controls */}
      <div
        style={{
          position: 'absolute',
          top: 16,
          left: 16,
          right: 16,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pointerEvents: 'none',
          zIndex: 1000,
        }}
      >
        {/* Left Badge: Active Field Indicator */}
        <div
          className="card"
          style={{
            pointerEvents: 'auto',
            padding: '8px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              backgroundColor: selectedField ? 'var(--g)' : 'var(--text-subtle)',
              boxShadow: selectedField ? '0 0 10px var(--g)' : 'none',
            }}
          />
          <div>
            <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--ink)' }}>
              {selectedField ? selectedField.name : 'Select or Map a Garden'}
            </div>
            {selectedField && (
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                {selectedField.crop} • {selectedField.area_ha} Ha ({selectedField.area_acres} Acres)
              </div>
            )}
          </div>
        </div>

        {/* Right Controls: Map Layer & Live GPS Toggle */}
        <div style={{ pointerEvents: 'auto', display: 'flex', gap: 8 }}>
          <button
            className="btn-secondary"
            onClick={() => setMapType(mapType === 'satellite' ? 'streets' : 'satellite')}
            title="Toggle Satellite / Street Map"
          >
            <Layers size={16} />
            <span style={{ fontSize: '0.78rem' }}>{mapType === 'satellite' ? 'Satellite' : 'Street'}</span>
          </button>

          <button
            className="btn-secondary"
            onClick={handleToggleLiveGps}
            style={{
              borderColor: liveGpsActive ? 'var(--cyan-500)' : 'var(--border-subtle)',
              background: liveGpsActive ? 'rgba(6, 182, 212, 0.2)' : 'rgba(255, 255, 255, 0.08)',
            }}
            title="Toggle Continuous Real-Time GPS Tracking"
          >
            <Navigation
              size={16}
              style={{
                color: liveGpsActive ? 'var(--cyan-500)' : 'var(--text-muted)',
              }}
            />
            <span style={{ fontSize: '0.78rem', color: liveGpsActive ? 'var(--cyan-500)' : 'var(--text-main)' }}>
              {liveGpsActive ? 'Live GPS Active' : 'Enable Live GPS'}
            </span>
          </button>
        </div>
      </div>

      {/* Floating GPS Telemetry HUD (when Live GPS is active) */}
      {liveGpsActive && (
        <div
          className="card"
          style={{
            position: 'absolute',
            top: 72,
            right: 16,
            zIndex: 900,
            padding: '7px 14px',
            fontSize: '0.74rem',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            border: `1px solid ${
              gpsStatus === 'locked'
                ? 'rgba(21, 128, 61, 0.4)'
                : gpsStatus === 'denied'
                ? 'rgba(201, 48, 44, 0.4)'
                : 'rgba(2, 132, 199, 0.4)'
            }`,
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background:
                gpsStatus === 'locked' ? 'var(--g)' : gpsStatus === 'denied' ? 'var(--red)' : 'var(--cyan)',
              boxShadow: `0 0 10px ${
                gpsStatus === 'locked' ? 'var(--g)' : gpsStatus === 'denied' ? 'var(--red)' : 'var(--cyan)'
              }`,
            }}
          />
          <div>
            {gpsCoords ? (
              <>
                <span style={{ color: 'var(--text-muted)' }}>GPS: </span>
                <strong style={{ color: 'var(--ink)' }}>
                  {gpsCoords.lat.toFixed(5)}, {gpsCoords.lng.toFixed(5)}
                </strong>
                <span style={{ color: 'var(--text-subtle)', marginLeft: 6 }}>±{gpsCoords.accuracy}m</span>
              </>
            ) : gpsStatus === 'denied' ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: 'var(--rose-500)', fontWeight: 600 }}>Location Blocked in Browser</span>
                <button
                  onClick={handleUseIpLocation}
                  className="btn-secondary"
                  style={{ padding: '2px 8px', fontSize: '0.68rem', borderColor: 'var(--cyan-500)', color: 'var(--cyan-500)' }}
                  title="Approximate location via your internet connection"
                >
                  📍 Use IP Approx
                </button>
              </div>
            ) : (
              <span style={{ color: 'var(--cyan-500)', fontWeight: 600 }}>Acquiring Real-Time Satellite Fix...</span>
            )}
          </div>

          {gpsCoords && (
            <button
              onClick={() => setFollowUser(!followUser)}
              style={{
                background: followUser ? 'rgba(6,182,212,0.25)' : 'transparent',
                border: '1px solid var(--border-subtle)',
                color: followUser ? 'var(--cyan-500)' : 'var(--text-muted)',
                fontSize: '0.68rem',
                fontWeight: 600,
                padding: '3px 8px',
                borderRadius: 4,
                cursor: 'pointer',
              }}
              title="Keep map centered on user as you move"
            >
              {followUser ? 'Following' : 'Free Pan'}
            </button>
          )}

          <button
            onClick={handleLocateMe}
            className="btn-secondary"
            style={{ padding: '3px 8px', fontSize: '0.7rem' }}
            title="Re-center map on your exact GPS coordinates"
          >
            <Navigation size={11} style={{ color: 'var(--cyan-500)' }} /> Center
          </button>
        </div>
      )}

      {/* Floating Real-Time Locate Me Action Button (Bottom-Right) */}
      <button
        onClick={handleLocateMe}
        style={{
          position: 'absolute',
          bottom: drawingMode ? 100 : 28,
          right: 20,
          zIndex: 900,
          borderRadius: '50%',
          width: 44,
          height: 44,
          padding: 0,
          border: '1px solid rgba(255,255,255,0.2)',
          background: 'linear-gradient(135deg, #06b6d4 0%, #059669 100%)',
          color: '#fff',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 18px rgba(6, 182, 212, 0.45)',
          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        title="Find My Real-Time Location"
      >
        <Navigation size={20} color="#fff" />
      </button>

      {/* Drawing Toolbar Overlay (Activated when Mapping New Field) */}
      {drawingMode && (
        <div
          className="card"
          style={{
            position: 'absolute',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
            padding: '14px 20px',
            maxWidth: '92vw',
            width: 440,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            background: '#fff',
            border: '2px solid var(--amber)',
            boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Compass size={18} style={{ color: 'var(--amber)' }} />
              <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--ink)' }}>
                {draftPoints.length < 3 ? 'Tap corners on map or walk perimeter' : 'Garden boundary enclosed'}
              </span>
            </div>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
              {draftPoints.length} vertices
            </div>
          </div>

          {draftPoints.length >= 3 && (
            <div
              style={{
                background: 'var(--ambert)',
                borderRadius: 'var(--radius-sm)',
                padding: '6px 12px',
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.8rem',
              }}
            >
              <span style={{ color: 'var(--mute)' }}>Calculated Area:</span>
              <strong style={{ color: 'var(--amber)' }}>
                {calculatedHa} Hectares ({calculatedAcres} Acres)
              </strong>
            </div>
          )}

          {/* Action Row */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <button
              className="btn-secondary"
              onClick={handleRecordGpsPoint}
              style={{ flex: 1, fontSize: '0.78rem' }}
              title="Record a vertex at your exact current GPS position"
            >
              <Navigation size={13} style={{ color: 'var(--cyan)' }} />
              <span>📍 Drop GPS Corner</span>
            </button>

            <button
              className="btn-secondary"
              onClick={() => {
                if (!liveGpsActive) setLiveGpsActive(true);
                setAutoWalkMode(!autoWalkMode);
              }}
              style={{
                flex: 1,
                fontSize: '0.78rem',
                borderColor: autoWalkMode ? 'var(--g)' : 'var(--bd)',
                background: autoWalkMode ? 'var(--gt)' : '#fff',
                color: autoWalkMode ? 'var(--g)' : 'var(--ink)',
              }}
              title="Automatically drops a vertex every 8-10 meters as you walk the garden boundary"
            >
              <span>🚶 {autoWalkMode ? 'Auto-Walking ON' : 'Walk Perimeter'}</span>
            </button>

            {draftPoints.length >= 3 && (
              <button
                className="primary"
                onClick={() => onOpenNewFieldModal(draftPoints, calculatedHa)}
                style={{ flex: 1.2, fontSize: '0.82rem' }}
              >
                <Check size={16} /> Save Field
              </button>
            )}

            <button
              className="btn-secondary"
              onClick={() => {
                setDrawingMode(false);
                setDraftPoints([]);
                setAutoWalkMode(false);
              }}
              style={{ color: 'var(--rose-500)', padding: '8px 10px' }}
              title="Cancel drawing"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
