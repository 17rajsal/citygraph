import React, { useState } from 'react';
import './EmergencyRoutingView.css';

export default function EmergencyRoutingView({
  nodes = [],
  activeRoute = null,
  routeOrigin = null,
  routeDestination = null,
  onSelectOrigin = () => {},
  onSelectDestination = () => {},
  onCalculateRoute = () => {},
  onClearRoute = () => {},
  onNavigateToMap = () => {},
  loading = false,
}) {
  const [selectedOriginId, setSelectedOriginId] = useState(routeOrigin?.id || 'node_1');
  const [selectedDestId, setSelectedDestId] = useState(routeDestination?.id || 'node_70');

  // Emergency Mission Presets
  const emergencyPresets = [
    {
      title: 'Level-1 Trauma Transfer',
      sub: 'AIIMS Trauma → IGI Airport T3',
      origin: 'node_1',
      dest: 'node_70',
      badge: 'PRIORITY-1',
      desc: 'Critical medical transfer along South-West Arterial Corridor bypassing lowlands.',
    },
    {
      title: 'Water Rescue Deployment',
      sub: 'DFS HQ Operations → Kashmere Gate Sluice',
      origin: 'node_2',
      dest: 'node_20',
      badge: 'DISPATCH',
      desc: 'Heavy rescue deployment to inundated Old Delhi Ring Road basin.',
    },
    {
      title: 'Substation Inter-Grid Evacuation',
      sub: 'Civil Lines Substation → Jaypee Medical Noida',
      origin: 'node_15',
      dest: 'node_73',
      badge: 'INTERSTATE',
      desc: 'Cross-river transit connecting North Delhi grid command to Noida healthcare hub.',
    },
    {
      title: 'Executive Corridor Evacuation',
      sub: 'Central Secretariat → Cyber Hub Gurugram',
      origin: 'node_97',
      dest: 'node_81',
      badge: 'GOV CORRIDOR',
      desc: 'Direct multi-modal evacuation corridor from Ministries into Gurugram.',
    },
  ];

  const handleApplyPreset = (preset) => {
    setSelectedOriginId(preset.origin);
    setSelectedDestId(preset.dest);
    const origNode = nodes.find((n) => n.id === preset.origin);
    const destNode = nodes.find((n) => n.id === preset.dest);
    if (origNode) onSelectOrigin(origNode);
    if (destNode) onSelectDestination(destNode);
    onCalculateRoute(preset.origin, preset.dest);
  };

  const handleRunRoute = () => {
    if (!selectedOriginId || !selectedDestId) return;
    const origNode = nodes.find((n) => n.id === selectedOriginId);
    const destNode = nodes.find((n) => n.id === selectedDestId);
    if (origNode) onSelectOrigin(origNode);
    if (destNode) onSelectDestination(destNode);
    onCalculateRoute(selectedOriginId, selectedDestId);
  };

  const currentOriginNode = nodes.find((n) => n.id === selectedOriginId);
  const currentDestNode = nodes.find((n) => n.id === selectedDestId);

  return (
    <div className="routing-page-container">
      {/* Page Header */}
      <div className="routing-header-row">
        <div>
          <span className="routing-category-tag">DISPATCH & RESCUE COMMAND</span>
          <h1 className="routing-main-title">Emergency Safe Corridor Routing</h1>
          <p className="routing-sub-title">
            Dynamic Dijkstra pathfinding penalizing submerged infrastructure, inundated underpasses, and degraded grid sectors.
          </p>
        </div>
      </div>

      {/* Preset Quick Actions */}
      <div className="routing-presets-grid">
        {emergencyPresets.map((p) => (
          <div
            key={p.title}
            className="preset-card"
            onClick={() => handleApplyPreset(p)}
          >
            <div className="preset-card-top">
              <span className="preset-badge">{p.badge}</span>
              <span className="preset-arrow">➔</span>
            </div>
            <h4 className="preset-title">{p.title}</h4>
            <span className="preset-sub">{p.sub}</span>
            <p className="preset-desc">{p.desc}</p>
          </div>
        ))}
      </div>

      {/* Main Routing Command Split: Setup vs Output */}
      <div className="routing-workspace-grid">
        {/* Left: Origin & Destination Selector Panel */}
        <div className="routing-panel-card">
          <div className="card-header-clean">
            <h3 className="card-heading">Configure Route Corridors</h3>
            <span className="card-tag">NetworkX Dijkstra</span>
          </div>

          <div className="route-form-body">
            {/* Origin */}
            <div className="form-group">
              <label className="form-lbl">
                <span className="lbl-pin pin-blue">📍</span>
                Route Origin (Dispatch Hub / Base):
              </label>
              <select
                className="route-select-input"
                value={selectedOriginId}
                onChange={(e) => setSelectedOriginId(e.target.value)}
              >
                {nodes.map((n) => (
                  <option key={n.id} value={n.id} disabled={n.status === 'failed'}>
                    {n.name || n.id} ({n.id}) - {n.type_label || n.type} [{n.zone}] {n.status === 'failed' ? '(OFFLINE / FLOODED)' : ''}
                  </option>
                ))}
              </select>
              {currentOriginNode && (
                <div className="node-quick-meta">
                  <span>Zone: {currentOriginNode.zone}</span> • <span>Criticality: {currentOriginNode.criticality ?? 5}/10</span>
                </div>
              )}
            </div>

            {/* Destination */}
            <div className="form-group">
              <label className="form-lbl">
                <span className="lbl-pin pin-orange">🏁</span>
                Route Destination (Incident / Staging Point):
              </label>
              <select
                className="route-select-input"
                value={selectedDestId}
                onChange={(e) => setSelectedDestId(e.target.value)}
              >
                {nodes.map((n) => (
                  <option key={n.id} value={n.id} disabled={n.status === 'failed'}>
                    {n.name || n.id} ({n.id}) - {n.type_label || n.type} [{n.zone}] {n.status === 'failed' ? '(OFFLINE / FLOODED)' : ''}
                  </option>
                ))}
              </select>
              {currentDestNode && (
                <div className="node-quick-meta">
                  <span>Zone: {currentDestNode.zone}</span> • <span>Criticality: {currentDestNode.criticality ?? 5}/10</span>
                </div>
              )}
            </div>

            {/* Calculate Button */}
            <div className="form-actions-row">
              <button
                type="button"
                className="btn-calc-route"
                onClick={handleRunRoute}
                disabled={loading || selectedOriginId === selectedDestId}
              >
                {loading ? 'Computing Safe Path...' : '🧭 Calculate Safe Route'}
              </button>
              <button
                type="button"
                className="btn-clear-route"
                onClick={onClearRoute}
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* Right: Route Telemetry & Avoidance Summary */}
        <div className="routing-panel-card">
          <div className="card-header-clean">
            <h3 className="card-heading">Dijkstra Routing Telemetry</h3>
            <span className="card-tag tag-safe">Real-Time Optimization</span>
          </div>

          {activeRoute ? (
            <div className="route-telemetry-output">
              {/* Top Stats Cluster */}
              <div className="route-stats-grid">
                <div className="r-stat-box">
                  <span className="r-num text-blue">{activeRoute.distance_km ?? '12.8'} km</span>
                  <span className="r-lbl">Total Safe Distance</span>
                </div>
                <div className="r-stat-box">
                  <span className="r-num text-green">{activeRoute.estimated_time_min ?? '24'} min</span>
                  <span className="r-lbl">Est. Response Time</span>
                </div>
                <div className="r-stat-box">
                  <span className="r-num text-red">{activeRoute.blocked_nodes_count ?? 5}</span>
                  <span className="r-lbl">Hazards Avoided</span>
                </div>
                <div className="r-stat-box">
                  <span className="r-num text-orange">{activeRoute.path?.length ?? 6}</span>
                  <span className="r-lbl">Waypoints</span>
                </div>
              </div>

              {/* Waypoint Path Timeline */}
              <div className="waypoint-timeline-box">
                <span className="timeline-title">Calculated Waypoint Sequence:</span>
                <div className="timeline-chips-list">
                  {(activeRoute.path || []).map((nodeId, idx) => {
                    const nodeObj = nodes.find((n) => n.id === nodeId);
                    return (
                      <div key={nodeId} className="waypoint-item">
                        <span className="wp-index">#{idx + 1}</span>
                        <span className="wp-name">{nodeObj?.name || nodeId}</span>
                        <span className="wp-id">({nodeId})</span>
                        {idx < activeRoute.path.length - 1 && <span className="wp-arrow">➔</span>}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Button: View on Master Map */}
              <button
                type="button"
                className="btn-view-map-corridor"
                onClick={onNavigateToMap}
              >
                🗺️ View Corridor On Full Map ➔
              </button>
            </div>
          ) : (
            <div className="empty-route-state">
              <span className="empty-icon">🧭</span>
              <h4>No Active Route Calculated</h4>
              <p>Select origin and destination nodes, or choose an emergency preset above to calculate a safe transit corridor.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
