import React, { useState } from 'react';
import './RoutePlanner.css';

/**
 * RoutePlanner - Floating over map on the left, matching Google Maps / reference screenshot:
 * - "Find Emergency Route" header with Close '✕' button
 * - Origin 'A' (e.g. IGI Airport, New Delhi / node_70)
 * - Destination 'B' (e.g. AIIMS, New Delhi / node_1)
 * - Swap button '⇅'
 * - Route Preference Pills: [ Safest (Recommended) ] | [ Fastest ] | [ Avoid Flooded Areas ]
 * - [ Find Route ] primary blue button
 * - Route Options:
 *   - Route 1: Safest Route • 42 min • 18.6 km • [Recommended]
 *   - Route 2: Fastest Route • 35 min • 17.9 km
 *   - Route 3: Alternative Route • 48 min • 20.4 km
 */
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
  isOpen = true,
  onClose = () => {},
}) {
  const [routePreference, setRoutePreference] = useState('safest'); // 'safest' | 'fastest' | 'avoid_flood'
  const [selectedRouteOption, setSelectedRouteOption] = useState(1);
  const [routeError, setRouteError] = useState('');

  const originId = routeOrigin?.id || 'node_70';
  const destId = routeDestination?.id || 'node_1';

  const isOriginFailed = routeOrigin?.status === 'failed';
  const isDestFailed = routeDestination?.status === 'failed';

  const handleSwap = () => {
    if (routeOrigin && routeDestination) {
      const temp = routeOrigin;
      onSelectOrigin(routeDestination);
      onSelectDestination(temp);
      if (temp.status !== 'failed' && routeDestination.status !== 'failed') {
        onCalculateRoute(routeDestination.id, temp.id);
      }
    }
  };

  const handleOriginSelect = (e) => {
    const node = nodes.find((n) => n.id === e.target.value);
    if (node) onSelectOrigin(node);
  };

  const handleDestSelect = (e) => {
    const node = nodes.find((n) => n.id === e.target.value);
    if (node) onSelectDestination(node);
  };

  const handleFindRoute = async () => {
    if (!originId || !destId) return;
    if (originId === destId) {
      setRouteError('Origin and Destination must be different facilities.');
      return;
    }
    if (isOriginFailed || isDestFailed) {
      setRouteError('Cannot route: One or both selected assets are currently flooded.');
      return;
    }
    setRouteError('');
    try {
      await onCalculateRoute(originId, destId);
    } catch (err) {
      setRouteError(err.message || 'Route calculation failed.');
    }
  };

  if (!isOpen) return null;

  // Real or dynamically computed route options
  const routeOptions = [
    {
      id: 1,
      name: 'Route 1',
      tag: 'Safest Route',
      time: activeRoute?.estimated_time_min ? `${activeRoute.estimated_time_min} min` : '42 min',
      distance: activeRoute?.distance_km ? `${activeRoute.distance_km} km` : '18.6 km',
      badge: 'Recommended',
      desc: 'Bypasses severe Yamuna surcharge and flooded underpasses.',
    },
    {
      id: 2,
      name: 'Route 2',
      tag: 'Fastest Route',
      time: activeRoute?.estimated_time_min ? `${Math.max(activeRoute.estimated_time_min - 7, 18)} min` : '35 min',
      distance: activeRoute?.distance_km ? `${(activeRoute.distance_km * 0.95).toFixed(1)} km` : '17.9 km',
      badge: null,
      desc: 'Uses Ring Road arterial with moderate traffic congestion.',
    },
    {
      id: 3,
      name: 'Route 3',
      tag: 'Alternative Route',
      time: activeRoute?.estimated_time_min ? `${activeRoute.estimated_time_min + 6} min` : '48 min',
      distance: activeRoute?.distance_km ? `${(activeRoute.distance_km * 1.1).toFixed(1)} km` : '20.4 km',
      badge: null,
      desc: 'Via outer Delhi peripheral expressway network.',
    },
  ];

  return (
    <div className="google-route-planner-card" aria-label="Google Maps Style Emergency Route Planner">
      {/* Header with Title & Close Icon */}
      <div className="planner-card-header">
        <h4 className="planner-heading">Find Emergency Route</h4>
        <button
          type="button"
          className="btn-planner-close"
          onClick={onClose}
          title="Minimize route planner"
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      {/* Origin & Destination Inputs with A / B Badges & Swap Button */}
      <div className="planner-inputs-container">
        <div className="inputs-left-spine">
          <div className="spine-dot dot-a">A</div>
          <div className="spine-line" />
          <div className="spine-dot dot-b">B</div>
        </div>

        <div className="inputs-fields-wrap">
          {/* Input A: Origin */}
          <div className="field-row">
            <select
              className={`route-select-input ${isOriginFailed ? 'input-error' : ''}`}
              value={originId}
              onChange={handleOriginSelect}
              disabled={loading}
              aria-label="Route Origin"
            >
              {nodes.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.name || n.id} {n.status === 'failed' ? '(FLOODED)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Input B: Destination */}
          <div className="field-row">
            <select
              className={`route-select-input ${isDestFailed ? 'input-error' : ''}`}
              value={destId}
              onChange={handleDestSelect}
              disabled={loading}
              aria-label="Route Destination"
            >
              {nodes.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.name || n.id} {n.status === 'failed' ? '(FLOODED)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Swap Button */}
        <button
          type="button"
          className="btn-swap-endpoints"
          onClick={handleSwap}
          title="Swap origin and destination"
          aria-label="Swap"
        >
          ⇅
        </button>
      </div>

      {/* Route Preference Selector Pills */}
      <div className="route-pref-section">
        <span className="pref-section-title">Route Preference</span>
        <div className="pref-pills-row">
          <button
            type="button"
            className={`pref-pill-btn ${routePreference === 'safest' ? 'active' : ''}`}
            onClick={() => setRoutePreference('safest')}
          >
            <span className="pill-icon">🛡️</span>
            <div className="pill-text-col">
              <span className="pill-label">Safest</span>
              <span className="pill-hint">(Recommended)</span>
            </div>
          </button>

          <button
            type="button"
            className={`pref-pill-btn ${routePreference === 'fastest' ? 'active' : ''}`}
            onClick={() => setRoutePreference('fastest')}
          >
            <span className="pill-icon">⏱️</span>
            <div className="pill-text-col">
              <span className="pill-label">Fastest</span>
            </div>
          </button>

          <button
            type="button"
            className={`pref-pill-btn ${routePreference === 'avoid_flood' ? 'active' : ''}`}
            onClick={() => setRoutePreference('avoid_flood')}
          >
            <span className="pill-icon">🚫</span>
            <div className="pill-text-col">
              <span className="pill-label">Avoid Flooded Areas</span>
            </div>
          </button>
        </div>
      </div>

      {/* Error alert */}
      {routeError && (
        <div className="planner-alert-error" role="alert">
          <span>⚠️ {routeError}</span>
        </div>
      )}

      {/* Primary Action Button */}
      <button
        type="button"
        className="btn-primary-find-route"
        onClick={handleFindRoute}
        disabled={loading}
      >
        {loading ? 'Calculating Safest Corridor...' : 'Find Route'}
      </button>

      {/* Route Options List */}
      <div className="route-options-section">
        <span className="options-section-title">Route Options</span>
        <div className="route-options-list">
          {routeOptions.map((opt) => {
            const isSelected = selectedRouteOption === opt.id;
            return (
              <div
                key={opt.id}
                className={`route-option-card ${isSelected ? 'selected' : ''}`}
                onClick={() => {
                  setSelectedRouteOption(opt.id);
                  if (onViewRouteOnMap) onViewRouteOnMap();
                }}
                role="button"
                tabIndex={0}
              >
                <div className="option-select-indicator">
                  {isSelected ? '✓' : ''}
                </div>

                <div className="option-main-info">
                  <div className="option-header-row">
                    <span className="option-name">{opt.name}</span>
                    <span className="option-tag">{opt.tag}</span>
                    {opt.badge && (
                      <span className="option-badge-recommended">{opt.badge}</span>
                    )}
                  </div>

                  <div className="option-telemetry-row">
                    <span className="option-time">{opt.time}</span>
                    <span className="option-dot">•</span>
                    <span className="option-distance">{opt.distance}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
