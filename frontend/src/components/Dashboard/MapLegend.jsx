import React from 'react';
import './MapLegend.css';

/**
 * MapLegend - Bottom map legend matching reference screenshot (media_1789910074876.jpg):
 * 1. Infrastructure: Hospital, Fire Station, Metro Station, Transformer, Drainage / Pump, Road Junction
 * 2. Node Status: Operational, At Risk, Affected, Failed
 * 3. Road Traffic: Fast (Green), Moderate (Yellow), Slow (Orange), Heavy (Red)
 * 4. Flood Risk (Water Depth): Low (0-0.3m), Moderate (0.3-1m), High (1-2m), Severe (>2m)
 * 5. Route: Blue = Selected Route, Gray = Alternative Route
 */
export default function MapLegend() {
  return (
    <div className="map-legend-container" aria-label="Map Visual Legend">
      {/* Col 1: Infrastructure Glyphs */}
      <div className="legend-col">
        <span className="legend-col-title">Infrastructure</span>
        <div className="legend-items-grid">
          <div className="legend-item">
            <span className="legend-glyph glyph-hospital">✚</span>
            <span className="legend-label">Hospital</span>
          </div>
          <div className="legend-item">
            <span className="legend-glyph glyph-fire">🔥</span>
            <span className="legend-label">Fire Station</span>
          </div>
          <div className="legend-item">
            <span className="legend-glyph glyph-metro">Ⓜ</span>
            <span className="legend-label">Metro Station</span>
          </div>
          <div className="legend-item">
            <span className="legend-glyph glyph-transformer">⚡</span>
            <span className="legend-label">Transformer</span>
          </div>
          <div className="legend-item">
            <span className="legend-glyph glyph-drainage">💧</span>
            <span className="legend-label">Drainage / Pump</span>
          </div>
        </div>
      </div>

      <div className="legend-col-divider" />

      {/* Col 2: Node Status */}
      <div className="legend-col">
        <span className="legend-col-title">Node Status</span>
        <div className="legend-items-grid">
          <div className="legend-item">
            <span className="status-dot dot-operational" />
            <span className="legend-label">Operational</span>
          </div>
          <div className="legend-item">
            <span className="status-dot dot-at-risk" />
            <span className="legend-label">At Risk</span>
          </div>
          <div className="legend-item">
            <span className="status-dot dot-failed" />
            <span className="legend-label">Failed</span>
          </div>
        </div>
      </div>

      <div className="legend-col-divider" />

      {/* Col 3: Road Traffic */}
      <div className="legend-col">
        <span className="legend-col-title">Road Traffic</span>
        <div className="legend-items-grid">
          <div className="legend-item">
            <span className="traffic-line line-fast" />
            <span className="legend-label">Fast</span>
          </div>
          <div className="legend-item">
            <span className="traffic-line line-moderate" />
            <span className="legend-label">Moderate</span>
          </div>
          <div className="legend-item">
            <span className="traffic-line line-slow" />
            <span className="legend-label">Slow</span>
          </div>
          <div className="legend-item">
            <span className="traffic-line line-heavy" />
            <span className="legend-label">Heavy</span>
          </div>
        </div>
      </div>

      <div className="legend-col-divider" />

      {/* Col 4: Flood Risk (Water Depth) */}
      <div className="legend-col">
        <span className="legend-col-title">Flood Risk (Water Depth)</span>
        <div className="legend-items-grid">
          <div className="legend-item">
            <span className="depth-swatch swatch-low" />
            <span className="legend-label">Low (0–0.3 m)</span>
          </div>
          <div className="legend-item">
            <span className="depth-swatch swatch-mod" />
            <span className="legend-label">Modera.. (0.3–1 m)</span>
          </div>
          <div className="legend-item">
            <span className="depth-swatch swatch-high" />
            <span className="legend-label">High (1–2 m)</span>
          </div>
          <div className="legend-item">
            <span className="depth-swatch swatch-severe" />
            <span className="legend-label">Severe (&gt; 2 m)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
