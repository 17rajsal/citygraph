import React from 'react';
import './Sidebar.css';

export default function Sidebar({
  viewMode,
  setViewMode,
  onRunSimulation,
  onResetNetwork,
  loading,
  selectedScenario,
  setSelectedScenario,
  layerFilters,
  setLayerFilters,
  mapStyle,
  setMapStyle,
}) {
  const toggleLayer = (type) => {
    setLayerFilters((prev) => ({
      ...prev,
      [type]: !prev[type],
    }));
  };

  return (
    <aside className="sidebar-container" aria-label="Control Sidebar">
      {/* Brand Header */}
      <div className="sidebar-brand">
        <div className="sidebar-logo" aria-hidden="true">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M3 21h18M5 21V7l8-4v18M13 10l6-3v14" />
            <circle cx="9" cy="9" r="1" fill="currentColor" />
            <circle cx="9" cy="13" r="1" fill="currentColor" />
            <circle cx="9" cy="17" r="1" fill="currentColor" />
            <circle cx="16" cy="13" r="1" fill="currentColor" />
            <circle cx="16" cy="17" r="1" fill="currentColor" />
          </svg>
        </div>
        <div className="sidebar-brand-text">
          <div className="brand-name">CityGraph</div>
          <div className="brand-tagline">Urban Risk Intelligence</div>
          <div className="brand-motto">Resilient Cities. Safer Lives.</div>
        </div>
      </div>

      <div className="sidebar-scrollable-content">
        {/* MODE & SCENARIO */}
        <div className="sidebar-section">
          <span className="section-title">MODE & SCENARIO</span>
          <div className="mode-nav-list" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === 'synthetic_delhi'}
              className={`mode-nav-item ${viewMode === 'synthetic_delhi' ? 'active' : ''}`}
              onClick={() => setViewMode('synthetic_delhi')}
            >
              <span className="mode-nav-icon">📍</span>
              <div className="mode-nav-text">
                <span className="mode-name">Synthetic Delhi Network</span>
                <span className="mode-sub">Interact with city graph</span>
              </div>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={viewMode === 'delhi_historical'}
              className={`mode-nav-item ${viewMode === 'delhi_historical' ? 'active' : ''}`}
              onClick={() => setViewMode('delhi_historical')}
            >
              <span className="mode-nav-icon">🗺️</span>
              <div className="mode-nav-text">
                <span className="mode-name">Delhi Historical Replay</span>
                <span className="mode-sub">Past flood events (July 2023)</span>
              </div>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={viewMode === 'nepal_reference'}
              className={`mode-nav-item ${viewMode === 'nepal_reference' ? 'active' : ''}`}
              onClick={() => setViewMode('nepal_reference')}
            >
              <span className="mode-nav-icon">🏔️</span>
              <div className="mode-nav-text">
                <span className="mode-name">Nepal Reference Scenario</span>
                <span className="mode-sub">Compare disaster patterns</span>
              </div>
            </button>
          </div>
        </div>

        {/* SCENARIO CONTROLS (Active in Synthetic Delhi mode) */}
        {viewMode === 'synthetic_delhi' && (
          <div className="sidebar-section">
            <span className="section-title">SCENARIO CONTROLS</span>
            <div className="scenario-select-wrap">
              <span className="scenario-icon">🌧️</span>
              <select
                className="sidebar-scenario-select"
                value={selectedScenario}
                onChange={(e) => setSelectedScenario(e.target.value)}
                disabled={loading}
              >
                <option value="heavy_rain">Monsoon Cloudburst (90mm/hr rainfall)</option>
                <option value="normal">Normal Baseline Conditions</option>
              </select>
            </div>

            <div className="sidebar-btn-group">
              <button
                type="button"
                className="sidebar-btn-primary"
                onClick={onRunSimulation}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-small" aria-hidden="true"></span>
                    <span>Simulating...</span>
                  </>
                ) : (
                  <>
                    <span className="btn-glyph">▶</span>
                    <span>Run Simulation</span>
                  </>
                )}
              </button>

              <button
                type="button"
                className="sidebar-btn-secondary"
                onClick={onResetNetwork}
                disabled={loading}
              >
                <span className="btn-glyph">⟲</span>
                <span>Reset to Baseline</span>
              </button>
            </div>
          </div>
        )}

        {/* INFRASTRUCTURE & ENVIRONMENTAL LAYERS */}
        <div className="sidebar-section">
          <span className="section-title">MAP LAYERS</span>
          <div className="layer-checkbox-list">
            <label className="layer-check-item">
              <input
                type="checkbox"
                checked={layerFilters.flood_zones ?? true}
                onChange={() => toggleLayer('flood_zones')}
              />
              <span className="layer-glyph glyph-flood">🌊</span>
              <span className="layer-name highlight-flood">Flood Risk Zones</span>
            </label>

            <label className="layer-check-item">
              <input
                type="checkbox"
                checked={layerFilters.road ?? true}
                onChange={() => toggleLayer('road')}
              />
              <span className="layer-glyph glyph-road">🛣️</span>
              <span className="layer-name">Road Network</span>
            </label>

            <label className="layer-check-item">
              <input
                type="checkbox"
                checked={layerFilters.hospital ?? true}
                onChange={() => toggleLayer('hospital')}
              />
              <span className="layer-glyph glyph-hosp">➕</span>
              <span className="layer-name">Hospitals</span>
            </label>

            <label className="layer-check-item">
              <input
                type="checkbox"
                checked={layerFilters.fire_station ?? true}
                onChange={() => toggleLayer('fire_station')}
              />
              <span className="layer-glyph glyph-fire">🔥</span>
              <span className="layer-name">Fire Stations</span>
            </label>

            <label className="layer-check-item">
              <input
                type="checkbox"
                checked={layerFilters.drainage ?? true}
                onChange={() => toggleLayer('drainage')}
              />
              <span className="layer-glyph glyph-drain">💧</span>
              <span className="layer-name">Drainage / Pumps</span>
            </label>

            <label className="layer-check-item">
              <input
                type="checkbox"
                checked={layerFilters.transformer ?? true}
                onChange={() => toggleLayer('transformer')}
              />
              <span className="layer-glyph glyph-trans">⚡</span>
              <span className="layer-name">Transformers</span>
            </label>

            <label className="layer-check-item">
              <input
                type="checkbox"
                checked={layerFilters.metro ?? true}
                onChange={() => toggleLayer('metro')}
              />
              <span className="layer-glyph glyph-metro">🚇</span>
              <span className="layer-name">Metro Stations</span>
            </label>
          </div>
        </div>

        {/* STATUS LEGEND */}
        <div className="sidebar-section">
          <span className="section-title">STATUS LEGEND</span>
          <div className="status-legend-list">
            <div className="legend-row">
              <span className="status-bullet dot-op"></span>
              <span>Operational (Safe)</span>
            </div>
            <div className="legend-row">
              <span className="status-bullet dot-risk"></span>
              <span>At Risk (0.7 - 0.9)</span>
            </div>
            <div className="legend-row">
              <span className="status-bullet dot-aff"></span>
              <span>Affected (Overloaded)</span>
            </div>
            <div className="legend-row">
              <span className="status-bullet dot-fail"></span>
              <span>Failed / Inundated</span>
            </div>
            <div className="legend-row">
              <span className="flood-legend-box"></span>
              <span>Flood Risk Zone</span>
            </div>
            <div className="legend-row">
              <span className="safe-route-line"></span>
              <span>Safe Corridor (Dijkstra)</span>
            </div>
          </div>
        </div>

        {/* MAP STYLE */}
        {viewMode === 'synthetic_delhi' && (
          <div className="sidebar-section">
            <span className="section-title">MAP BASEMAP</span>
            <div className="map-style-pills">
              {[
                { id: 'dark', label: 'Dark' },
                { id: 'streets', label: 'Streets' },
                { id: 'satellite', label: 'Satellite' },
              ].map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  className={`map-style-btn ${mapStyle === id ? 'active' : ''}`}
                  onClick={() => setMapStyle(id)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
