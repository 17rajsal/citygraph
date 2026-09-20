import React from 'react';
import './AssetInspector.css';

export default function AssetInspector({
  selectedNode,
  routeOrigin = null,
  routeDestination = null,
  onSetOrigin = () => {},
  onSetDestination = () => {},
  onCalculateRoute = () => {},
}) {
  if (!selectedNode) {
    return (
      <div className="asset-inspector-panel empty-state">
        <div className="inspector-empty-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
        </div>
        <h4 className="empty-title">No Asset Selected</h4>
        <p className="empty-desc">Click any marker on the Delhi map or Cytoscape network to inspect live telemetry.</p>
      </div>
    );
  }

  const status = selectedNode.status || 'safe';
  const isFailed = status === 'failed';
  const isAffected = status === 'affected';
  const riskVal = Number(selectedNode.risk_score || selectedNode.risk || 0);
  const load = selectedNode.load ?? selectedNode.current_load ?? 75;
  const capacity = selectedNode.capacity ?? 63;
  const loadPct = capacity > 0 ? Math.round((load / capacity) * 100) : 119;

  const isCurrentOrigin = routeOrigin?.id === selectedNode.id;
  const isCurrentDest = routeDestination?.id === selectedNode.id;

  const handleRouteFrom = () => {
    if (isFailed) return;
    onSetOrigin(selectedNode);
    if (routeDestination && routeDestination.id !== selectedNode.id && routeDestination.status !== 'failed') {
      onCalculateRoute(selectedNode.id, routeDestination.id);
    }
  };

  const handleRouteTo = () => {
    if (isFailed) return;
    onSetDestination(selectedNode);
    if (routeOrigin && routeOrigin.id !== selectedNode.id && routeOrigin.status !== 'failed') {
      onCalculateRoute(routeOrigin.id, selectedNode.id);
    }
  };

  const handleTriggerDijkstra = () => {
    if (routeOrigin && routeDestination) {
      onCalculateRoute(routeOrigin.id, routeDestination.id);
    } else {
      handleRouteFrom();
    }
  };

  return (
    <div className="asset-inspector-panel">
      {/* Top Header Row with Status Badge */}
      <div className="inspector-header">
        <div className="inspector-title-row">
          <span className="inspector-section-label">Selected Asset</span>
          <span className={`status-pill-badge status-${status}`}>
            {status === 'failed' ? 'CRITICAL / OFFLINE' : status === 'affected' ? 'AFFECTED' : 'SAFE'}
          </span>
        </div>
        <h3 className="asset-title">{selectedNode.name || selectedNode.id}</h3>
        <span className="asset-subtitle">
          {selectedNode.type_label || (selectedNode.type ? selectedNode.type.toUpperCase() : 'Arterial Road Junction')} • {selectedNode.zone || 'South-East Arterial Transit Corridor'}
        </span>
      </div>

      {/* Visual Photo Banner with Flood Risk Badge and Estimated Depth */}
      <div className="asset-visual-banner-wrap">
        <div className="asset-photo-card">
          <div className="photo-backdrop">
            {/* Illustrated Underpass / Infrastructure Cutaway */}
            <svg viewBox="0 0 300 120" className="photo-svg-graphic" fill="none">
              <rect width="300" height="120" fill="#1E293B" />
              {/* Overpass Bridge */}
              <rect x="0" y="20" width="300" height="25" fill="#334155" />
              <rect x="0" y="42" width="300" height="4" fill="#64748B" />
              {/* Pillars */}
              <rect x="70" y="45" width="20" height="75" fill="#475569" />
              <rect x="210" y="45" width="20" height="75" fill="#475569" />
              {/* Roadway & Water Reflection */}
              <rect x="0" y="90" width="300" height="30" fill={isFailed || isAffected ? '#0369A1' : '#0F172A'} opacity="0.8" />
              {/* Water ripples if flooded */}
              {(isFailed || isAffected) && (
                <>
                  <path d="M0 95 Q75 92 150 95 T300 95" stroke="#38BDF8" strokeWidth="2" fill="none" opacity="0.7" />
                  <path d="M0 105 Q75 102 150 105 T300 105" stroke="#0284C7" strokeWidth="2" fill="none" opacity="0.5" />
                </>
              )}
              {/* Vehicles */}
              <rect x="110" y="80" width="36" height="16" rx="3" fill="#E2E8F0" opacity="0.8" />
              <rect x="155" y="82" width="30" height="14" rx="3" fill="#94A3B8" opacity="0.6" />
            </svg>
          </div>

          <div className="photo-overlay-badges">
            <span className="badge-flood-risk">
              <span className="dot-pulse" />
              FLOOD RISK
            </span>
            <span className="badge-depth">
              {isFailed ? '1.4 m' : isAffected ? '0.8 m' : '0.1 m'} Estimated depth
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons: Route From / Route To */}
      <div className="inspector-routing-actions">
        <button
          type="button"
          className={`btn-inspector-route btn-route-from ${isCurrentOrigin ? 'is-active' : ''} ${isFailed ? 'is-disabled' : ''}`}
          onClick={handleRouteFrom}
          disabled={isFailed}
          title={isFailed ? 'Cannot stage dispatch from flooded asset' : 'Set as route origin'}
        >
          {isCurrentOrigin ? '✓ Current Origin' : '📍 Route From Here'}
        </button>

        <button
          type="button"
          className={`btn-inspector-route btn-route-to ${isCurrentDest ? 'is-active' : ''} ${isFailed ? 'is-disabled' : ''}`}
          onClick={handleRouteTo}
          disabled={isFailed}
          title={isFailed ? 'Cannot route to flooded destination' : 'Set as route destination'}
        >
          {isCurrentDest ? '✓ Current Destination' : '🏁 Route To Here'}
        </button>
      </div>

      {/* Asset Tag Row */}
      <div className="asset-tag-row">
        <span className="tag-node-id">
          <span className="tag-pin">📍</span>
          {selectedNode.id}
        </span>
        <span className="tag-corridor-name">
          {selectedNode.zone || 'South-East Arterial Transit Corridor'}
        </span>
      </div>

      {/* Operational State */}
      <div className="asset-state-row">
        <span className="state-label">Operational State:</span>
        <span className={`state-pill-text state-${status}`}>
          {status === 'failed' ? 'CRITICAL FAILURE • OFFLINE' : status === 'affected' ? 'DEGRADED PERFORMANCE • HIGH LOAD' : 'NORMAL / NOMINAL CAPACITY'}
        </span>
      </div>

      {/* Alert Callout Box */}
      <div className={`inspector-alert-box alert-${status}`}>
        <span className="alert-icon">⚠️</span>
        <div className="alert-text-group">
          <span className="alert-header">
            {isFailed ? 'INUNDATION / VOLUMETRIC SURCHARGE' : isAffected ? 'CASCADE LOAD WARNING' : 'NOMINAL MONITORING'}
          </span>
          <p className="alert-body">
            {selectedNode.failure_reason || (isFailed ? 'Stormwater intake capacity exceeded; underpass submerged.' : 'Normal operational parameters; within design tolerance.')}
          </p>
        </div>
      </div>

      {/* Telemetry Progress Bars */}
      <div className="telemetry-bars-group">
        {/* Risk Index */}
        <div className="telemetry-bar-row">
          <div className="bar-header">
            <span className="bar-label">Calculated Risk Index</span>
            <span className="bar-val-badge risk-badge">{riskVal.toFixed(2)}</span>
          </div>
          <div className="bar-track">
            <div
              className={`bar-fill ${riskVal >= 1.0 ? 'fill-red' : riskVal >= 0.7 ? 'fill-orange' : 'fill-green'}`}
              style={{ width: `${Math.min(riskVal * 60, 100)}%` }}
            />
          </div>
        </div>

        {/* Load / Capacity */}
        <div className="telemetry-bar-row">
          <div className="bar-header">
            <span className="bar-label">Load / Capacity</span>
            <span className="bar-val-text">
              {load} / {capacity} <strong className="load-pct-strong">({loadPct}%)</strong>
            </span>
          </div>
          <div className="bar-track">
            <div
              className={`bar-fill ${loadPct > 100 ? 'fill-blue-overflow' : 'fill-blue'}`}
              style={{ width: `${Math.min(loadPct, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* 4-Item Telemetry Grid */}
      <div className="telemetry-stats-grid">
        <div className="stat-grid-cell">
          <span className="cell-label">System ID</span>
          <span className="cell-value font-mono">{selectedNode.id}</span>
        </div>
        <div className="stat-grid-cell">
          <span className="cell-label">Criticality</span>
          <span className="cell-value">{selectedNode.criticality ?? 2} / 10</span>
        </div>
        <div className="stat-grid-cell">
          <span className="cell-label">Coordinates</span>
          <span className="cell-value font-mono">
            {selectedNode.latitude ?? selectedNode.lat ? `${Number(selectedNode.latitude ?? selectedNode.lat).toFixed(4)}° N, ${Number(selectedNode.longitude ?? selectedNode.lng).toFixed(4)}° E` : '28.5700° N, 77.2500° E'}
          </span>
        </div>
        <div className="stat-grid-cell">
          <span className="cell-label">Connected Corridors</span>
          <span className="cell-value">
            {selectedNode.connected_nodes?.length ?? selectedNode.connected_corridors?.length ?? 3} Links
          </span>
        </div>
      </div>

      {/* Emergency Routing CTA Card at Bottom */}
      <div className="emergency-routing-cta-card">
        <div className="cta-left">
          <div className="cta-icon-box">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <rect x="1" y="3" width="15" height="13" />
              <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
              <circle cx="5.5" cy="18.5" r="2.5" />
              <circle cx="18.5" cy="18.5" r="2.5" />
            </svg>
          </div>
          <div className="cta-text">
            <h5 className="cta-title">Emergency Routing</h5>
            <span className="cta-sub">Find Safest Path in Real-Time</span>
            <span className="cta-micro">Uses Dijkstra's algorithm with live risk data</span>
          </div>
        </div>
        <button
          type="button"
          className="btn-dijkstra-safe"
          onClick={handleTriggerDijkstra}
        >
          DIJKSTRA SAFE PATH
        </button>
      </div>
    </div>
  );
}
