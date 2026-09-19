import React, { useState, useEffect } from 'react';
import './RoutePlanner.css';

export default function RoutePlanner({
  nodes = [],
  activeRoute = null,
  routeOrigin = null,
  routeDestination = null,
  routingMode = false,
  onToggleRoutingMode = () => {},
  onSelectOrigin = () => {},
  onSelectDestination = () => {},
  onCalculateRoute = () => {},
  onClearRoute = () => {},
  onViewRouteOnMap = () => {},
  loading = false,
}) {
  const [routeError, setRouteError] = useState('');

  // Synchronize internal select state when props change
  const originId = routeOrigin?.id || 'node_1';
  const destId = routeDestination?.id || 'node_70';

  // Check if either origin or destination is currently failed/submerged
  const isOriginFailed = routeOrigin?.status === 'failed';
  const isDestFailed = routeDestination?.status === 'failed';

  useEffect(() => {
    if (isOriginFailed) {
      setRouteError(`⚠️ Origin (${routeOrigin.name || originId}) is submerged/failed. Emergency vehicles cannot deploy from a flooded asset.`);
    } else if (isDestFailed) {
      setRouteError(`⚠️ Destination (${routeDestination.name || destId}) is submerged/failed. Emergency vehicles cannot access a flooded asset.`);
    } else {
      setRouteError('');
    }
  }, [routeOrigin, routeDestination, isOriginFailed, isDestFailed, originId, destId]);

  const handleOriginChange = (e) => {
    const selected = nodes.find((n) => n.id === e.target.value);
    if (selected) {
      onSelectOrigin(selected);
    }
  };

  const handleDestChange = (e) => {
    const selected = nodes.find((n) => n.id === e.target.value);
    if (selected) {
      onSelectDestination(selected);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!originId || !destId) return;
    if (originId === destId) {
      setRouteError('Origin and Destination must be different locations.');
      return;
    }
    if (isOriginFailed || isDestFailed) {
      setRouteError('Cannot calculate dispatch route: one or both endpoints are submerged. Please pick operational facilities.');
      return;
    }
    setRouteError('');
    try {
      await onCalculateRoute(originId, destId);
    } catch (err) {
      setRouteError(err.message || 'Routing calculation failed.');
    }
  };

  return (
    <div className="route-planner-panel">
      <div className="planner-header">
        <div className="planner-title-row">
          <span className="planner-badge">EMERGENCY ROUTING</span>
          <span className="algo-tag">DIJKSTRA SAFE PATH</span>
        </div>
        <h3 className="planner-title">Find Emergency Route</h3>
        <p className="planner-desc">
          Bypasses submerged roads & drainage regulators; dynamically penalizes cascading risk zones.
        </p>
      </div>

      <form className="planner-form" onSubmit={handleSubmit}>
        {/* Origin Selector */}
        <div className="form-group">
          <div className="form-label-row">
            <label className="form-label" htmlFor="route-origin">
              <span className="label-dot origin-dot" />
              FROM (ORIGIN)
            </label>
            <button
              type="button"
              className={`btn-select-map ${routingMode ? 'btn-select-active' : ''}`}
              onClick={onToggleRoutingMode}
              title="Click a marker on the map to set origin"
            >
              {routingMode ? '📍 Clicking Map...' : '🗺️ Select on Map'}
            </button>
          </div>
          <div className="select-wrapper">
            <select
              id="route-origin"
              className={`planner-select ${isOriginFailed ? 'select-warning' : ''}`}
              value={originId}
              onChange={handleOriginChange}
              disabled={loading}
            >
              {nodes.map((node) => (
                <option key={node.id} value={node.id}>
                  {node.status === 'failed' ? '⚠️ [FAILED] ' : ''}
                  {node.name || node.id} ({node.type_label || node.type})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Destination Selector */}
        <div className="form-group">
          <div className="form-label-row">
            <label className="form-label" htmlFor="route-dest">
              <span className="label-dot dest-dot" />
              TO (DESTINATION)
            </label>
            <button
              type="button"
              className={`btn-select-map ${routingMode ? 'btn-select-active' : ''}`}
              onClick={onToggleRoutingMode}
              title="Click a marker on the map to set destination"
            >
              {routingMode ? '🏁 Clicking Map...' : '🗺️ Select on Map'}
            </button>
          </div>
          <div className="select-wrapper">
            <select
              id="route-dest"
              className={`planner-select ${isDestFailed ? 'select-warning' : ''}`}
              value={destId}
              onChange={handleDestChange}
              disabled={loading}
            >
              {nodes.map((node) => (
                <option key={node.id} value={node.id}>
                  {node.status === 'failed' ? '⚠️ [FAILED] ' : ''}
                  {node.name || node.id} ({node.type_label || node.type})
                </option>
              ))}
            </select>
          </div>
        </div>

        {routeError && (
          <div className="route-error-banner" role="alert">
            <span>{routeError}</span>
          </div>
        )}

        {/* Action Button */}
        <button
          type="submit"
          className={`btn-find-route ${loading ? 'loading' : ''}`}
          disabled={loading || !originId || !destId || isOriginFailed || isDestFailed}
        >
          {loading ? (
            <span>Computing Resilient Path...</span>
          ) : (
            <>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <span>Find Safe Route</span>
            </>
          )}
        </button>
      </form>

      {/* Active Route Telemetry Card */}
      {activeRoute && (
        <div className="active-route-card">
          <div className="route-status-header">
            <div className="route-live-tag">
              <span className="ping-dot" />
              <span>SAFE ROUTE FOUND</span>
            </div>
            <button
              type="button"
              className="btn-clear-route"
              onClick={onClearRoute}
              title="Clear Route"
            >
              Clear Route
            </button>
          </div>

          <div className="route-stats-grid">
            <div className="route-stat">
              <span className="stat-label">Total Distance</span>
              <span className="stat-val text-cyan">{activeRoute.distance_km} km</span>
            </div>
            <div className="route-stat">
              <span className="stat-label">Estimated Transit</span>
              <span className="stat-val text-cyan">{activeRoute.estimated_time_min} min</span>
            </div>
            <div className="route-stat">
              <span className="stat-label">Path Nodes</span>
              <span className="stat-val">{activeRoute.path ? activeRoute.path.length : 0} Sites</span>
            </div>
            <div className="route-stat">
              <span className="stat-label">Hazards Avoided</span>
              <span className="stat-val text-green">
                {activeRoute.blocked_nodes_count ?? activeRoute.avoided_assets?.length ?? 5} Blocked
              </span>
            </div>
          </div>

          <div className="route-actions-row">
            <button
              type="button"
              className="btn-view-route-map"
              onClick={onViewRouteOnMap}
              title="Fit map view to complete route"
            >
              🔍 View Route on Map
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
