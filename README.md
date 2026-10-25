# 🛰️ AgroPulse — Precision Satellite Field & Garden Monitor

**AgroPulse** is an independent, full-stack satellite agronomy and plot-monitoring platform. It empowers farmers, extension workers, and agribusiness managers to map garden boundaries directly on their phone or computer, track vegetative health via earth-observation satellites, analyze historical time-lapses, and monitor micro-climate and root-zone soil telemetry.

Powered by multi-spectral satellite imagery and the [AgroMonitoring API](https://agromonitoring.com/price#satellite-1).

---

## 🌟 Key Features

### 1. 📱 Mobile & Desktop Field Mapping
* **Boundary Polygon Mapping:** Tap or click map corners to enclose any farm, garden, or plot.
* **🚶 GPS Walk-the-Field Mode:** Tap *"Drop GPS Point"* while physically walking the field perimeter on a phone or tablet.
* **Auto Surface Measurement:** Automatically calculates and displays acreage and hectares in real time.

### 2. 🛰️ Satellite Performance Tracking (Sentinel-2 & Landsat)
* **Vegetation Indices:**
  * **NDVI (Normalized Difference Vegetation Index):** Multi-spectral vigor heatmap from bare soil (`<0.2`) to dense canopy (`>0.7`).
  * **True Color:** High-resolution optical satellite view.
  * **False Color:** Near-Infrared contrast highlighting crop moisture stress and chlorophyll density.

### 3. ⏱️ Satellite Time-Lapse Player
* **Interactive Scrubber:** Slide across historical satellite scenes over the past 30–90 days.
* **Play / Pause Animator:** Automatically steps through scenes to visualize crop emergence, vegetative growth, canopy peak, and harvesting.
* **Scene Metrics:** Cloud cover percentage, satellite mission type, and date per scene.

### 4. 📈 NDVI Historical Crop Health Curves
* **Multi-Month Health Trends:** Interactive Recharts curve plotting mean, minimum, and maximum NDVI over time.
* **Vigor Threshold Zones:** Color-coded benchmarks indicating whether crops are stressed, moderately growing, or thriving.

### 5. 🌦️ Weather & Root-Zone Soil Telemetry
* **Micro-Climate Telemetry:** Current temperature, humidity, wind speed, pressure, and weather conditions.
* **5-Day Agricultural Forecast:** Temperature ranges and rain probabilities for field operations planning.
* **Soil Telemetry:** Volumetric soil moisture percentage and soil temperature at 10cm root depth.

---

## 🚀 Quick Start

### 1. Run with One Command
From the project folder:
```bash
./run.sh
```

Or run backend and frontend separately:
```bash
# Terminal 1: Backend API (Port 5050)
cd backend && npm start

# Terminal 2: Frontend App (Port 3030)
cd frontend && npm run dev
```

Open your browser at: **[http://localhost:3030](http://localhost:3030)**

---

## 🔑 Connecting Your AgroMonitoring API Key
1. The app works **immediately out of the box** in high-fidelity simulation mode with demo fields.
2. To connect live Sentinel-2 / Landsat feeds:
   * Get an API key from [agromonitoring.com/price](https://agromonitoring.com/price#satellite-1).
   * Click the **⚙️ Settings** icon in the top right corner of AgroPulse.
   * Paste your key and click **Save & Connect**.
   * Any newly saved field will automatically register with AgroMonitoring and stream live satellite imagery.

---

## 🏗️ Project Architecture
```
agro-satellite-monitor/
├── run.sh                     # One-click runner script
├── package.json               # Root scripts
├── backend/
│   ├── server.js              # Express REST API & AgroMonitoring proxy
│   ├── fields_data.json       # Persistent JSON field database
│   ├── config.json            # Encrypted local API key storage
│   └── package.json
└── frontend/
    ├── index.html
    ├── vite.config.js
    ├── src/
    │   ├── App.jsx            # Master layout & responsive dashboard
    │   ├── index.css          # Glassmorphic, dark theme & mobile styling
    │   ├── components/
    │   │   ├── FieldMap.jsx            # Interactive Leaflet map & GPS drawing
    │   │   ├── SatelliteTimelapse.jsx  # Satellite scene player & slider
    │   │   ├── NdviHealthChart.jsx     # Recharts NDVI curve & zones
    │   │   ├── WeatherSoilCard.jsx     # Micro-climate & soil telemetry
    │   │   ├── FieldListDrawer.jsx     # Garden selector & search
    │   │   ├── NewFieldModal.jsx       # Field registration modal
    │   │   └── SettingsModal.jsx       # API key configuration
    │   └── services/
    │       └── api.js                  # Frontend HTTP client
    └── package.json
```
