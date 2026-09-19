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
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
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
  const riskVal = Number(selectedNode.risk || 0);
  const load = selectedNode.current_load ?? 50;
  const capacity = selectedNode.capacity ?? 100;
  const loadPct = capacity > 0 ? Math.min(Math.round((load / capacity) * 100), 150) : 50;

  const isCurrentOrigin = routeOrigin?.id === selectedNode.id;
  const isCurrentDest = routeDestination?.id === selectedNode.id;

  const getTypeColor = (type) => {
    switch (type) {
      case 'hospital': return '#0284c7';
      case 'fire_station': return '#ea580c';
      case 'drainage': return '#0d9488';
      case 'transformer': return '#ca8a04';
      default: return '#3b82f6';
    }
  };

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

  return (
    <div className="asset-inspector-panel">
      <div className="inspector-header">
        <div className="inspector-title-row">
          <span className="inspector-section-label">SELECTED ASSET</span>
          <span className={`status-pill status-${status}`}>
            {status.toUpperCase()}
          </span>
        </div>
        <h3 className="asset-title">{selectedNode.name || selectedNode.id}</h3>
        <span className="asset-subtitle">
          {selectedNode.type_label || (selectedNode.type ? selectedNode.type.toUpperCase() : 'INFRASTRUCTURE ASSET')} • {selectedNode.zone || 'Delhi Metropolitan'}
        </span>
      </div>

      {/* Direct Routing Action Buttons */}
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

      {/* Asset Visual Banner */}
      <div className="asset-visual-card">
        <div
          className="asset-visual-banner"
          style={{
            background: `linear-gradient(135deg, ${getTypeColor(selectedNode.type)}22 0%, #0d1527 100%)`,
            borderBottom: `2px solid ${getTypeColor(selectedNode.type)}88`,
          }}
        >
          <div className="visual-pin-badge" style={{ borderColor: getTypeColor(selectedNode.type) }}>
            <span className="pin-icon">📍</span>
            <span>{selectedNode.id}</span>
          </div>
          <span className="visual-zone-tag">{selectedNode.zone || 'Central Delhi'}</span>
        </div>
        <div className="asset-quick-status">
          <span className="quick-label">Operational State:</span>
          <span className={`quick-val text-${status}`}>
            {status === 'failed' ? 'CRITICAL FAILURE • OFFLINE' : status === 'affected' ? 'DEGRADED PERFORMANCE • HIGH LOAD' : 'NORMAL / NOMINAL CAPACITY'}
          </span>
        </div>
      </div>

      {/* Failure Alert Banner (if failed or affected) */}
      {selectedNode.failure_reason && (
        <div className={`failure-alert-box alert-${status}`}>
          <span className="alert-icon">⚠️</span>
          <div className="alert-content">
            <span className="alert-title">
              {isFailed ? 'INUNDATION / VOLUMETRIC SURCHARGE' : 'CASCADE LOAD WARNING'}
            </span>
            <p className="alert-msg">{selectedNode.failure_reason}</p>
          </div>
        </div>
      )}

      {/* Telemetry Metrics Grid */}
      <div className="telemetry-grid">
        {/* Risk Score */}
        <div className="telemetry-item full-width">
          <div className="telemetry-row">
            <span className="tel-label">Calculated Risk Index</span>
            <span className={`tel-val-highlight risk-${riskVal > 1 ? 'critical' : riskVal > 0.7 ? 'warn' : 'safe'}`}>
              {riskVal.toFixed(2)}
            </span>
          </div>
          <div className="risk-bar-track">
            <div
              className={`risk-bar-fill ${riskVal > 1 ? 'fill-crit' : riskVal > 0.7 ? 'fill-warn' : 'fill-safe'}`}
              style={{ width: `${Math.min(riskVal * 50, 100)}%` }}
            />
          </div>
        </div>

        {/* Load / Capacity */}
        <div className="telemetry-item full-width">
          <div className="telemetry-row">
            <span className="tel-label">Load / Capacity</span>
            <span className="tel-val">
              {load} / {capacity} <strong className="pct-tag">({loadPct}%)</strong>
            </span>
          </div>
          <div className="capacity-bar-track">
            <div
              className={`capacity-bar-fill ${loadPct > 100 ? 'fill-overflow' : loadPct > 80 ? 'fill-warn' : 'fill-norm'}`}
              style={{ width: `${Math.min(loadPct, 100)}%` }}
            />
          </div>
        </div>

        {/* Asset ID */}
        <div className="telemetry-item">
          <span className="tel-label">System ID</span>
          <span className="tel-val font-mono">{selectedNode.id}</span>
        </div>

        {/* Criticality Rating */}
        <div className="telemetry-item">
          <span className="tel-label">Criticality</span>
          <span className="tel-val font-bold">{selectedNode.criticality ?? 5} / 10</span>
        </div>

        {/* Geographic Coordinates */}
        <div className="telemetry-item">
          <span className="tel-label">Coordinates</span>
          <span className="tel-val font-mono">
            {selectedNode.lat ? `${Number(selectedNode.lat).toFixed(4)}° N, ${Number(selectedNode.lng).toFixed(4)}° E` : '28.6139° N, 77.2090° E'}
          </span>
        </div>

        {/* Connected Corridors Count */}
        <div className="telemetry-item">
          <span className="tel-label">Connected Corridors</span>
          <span className="tel-val font-bold">
            {selectedNode.connected_corridors ? selectedNode.connected_corridors.length : 4} Links
          </span>
        </div>
      </div>
    </div>
  );
}
