import './EmergencyRouteCard.css';

export default function EmergencyRouteCard({
  title = "Emergency Safe Route",
  subtitle = "Calculated route bypassing failed infrastructure",
  origin,
  destination,
  distance,
  estimatedTime,
  status = "Active",
  routeStatusBadge,
  avoidedAssets = [],
  waypoints = [],
  safetyExplanation,
  isModelGenerated = true,
  onWaypointClick,
  activeWaypointId,
}) {
  const hasRoute = waypoints && waypoints.length > 0;

  return (
    <div className="emergency-route-card" aria-label={title}>
      <div className="erc-header">
        <div>
          <div className="erc-badge-row">
            <span className="erc-icon" aria-hidden="true">🚑</span>
            <h3 className="erc-title">{title}</h3>
          </div>
          {subtitle && <p className="erc-subtitle">{subtitle}</p>}
        </div>

        <span className={`erc-status-pill ${hasRoute ? 'status-active' : 'status-inactive'}`}>
          {routeStatusBadge || (hasRoute ? status : 'Not Calculated')}
        </span>
      </div>

      {hasRoute ? (
        <div className="erc-body">
          {/* Origin and Destination Card */}
          <div className="erc-endpoints-grid">
            <div className="erc-endpoint">
              <span className="erc-endpoint-label">ORIGIN</span>
              <strong className="erc-endpoint-value" title={origin?.fullName || origin?.name || origin}>
                {origin?.name || origin || 'Facility Origin'}
              </strong>
              {origin?.id && <span className="erc-node-id">{origin.id}</span>}
            </div>

            <div className="erc-endpoint-arrow" aria-hidden="true">→</div>

            <div className="erc-endpoint">
              <span className="erc-endpoint-label">DESTINATION</span>
              <strong className="erc-endpoint-value" title={destination?.fullName || destination?.name || destination}>
                {destination?.name || destination || 'Facility Destination'}
              </strong>
              {destination?.id && <span className="erc-node-id">{destination.id}</span>}
            </div>
          </div>

          {/* Metrics: Distance & Estimated Time */}
          <div className="erc-metrics-row">
            {distance !== undefined && distance !== null && (
              <div className="erc-metric-pill">
                <span className="metric-label">Route Distance:</span>
                <strong className="metric-value">{distance} km</strong>
              </div>
            )}
            {estimatedTime ? (
              <div className="erc-metric-pill">
                <span className="metric-label">Estimated Transit:</span>
                <strong className="metric-value">{estimatedTime}</strong>
              </div>
            ) : (
              <div className="erc-metric-pill erc-illustrative-pill">
                <span className="metric-label">Transit Time:</span>
                <span className="metric-sub">Illustrative route estimate</span>
              </div>
            )}
          </div>

          {/* Sequential Waypoints */}
          <div className="erc-waypoints-section">
            <span className="erc-section-label">Sequential Corridor Waypoints:</span>
            <div className="erc-waypoints-list">
              {waypoints.map((wp, idx) => {
                const wpId = typeof wp === 'object' ? wp.id : wp;
                const wpName = typeof wp === 'object' ? (wp.short_name || wp.name || wp.id) : wp;
                const isSelected = activeWaypointId === wpId;
                const isLast = idx === waypoints.length - 1;

                return (
                  <div key={`${wpId}-${idx}`} className="erc-waypoint-wrapper">
                    <button
                      type="button"
                      className={`erc-waypoint-chip ${isSelected ? 'selected' : ''}`}
                      onClick={() => onWaypointClick && onWaypointClick(wp)}
                      title={`Inspect waypoint: ${wpName}`}
                    >
                      <span className="wp-idx">{idx + 1}</span>
                      <span className="wp-name">{wpName}</span>
                    </button>
                    {!isLast && <span className="wp-arrow" aria-hidden="true">→</span>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Avoided / Bypassed Failed Assets */}
          {avoidedAssets && avoidedAssets.length > 0 && (
            <div className="erc-avoided-section">
              <span className="erc-section-label">Bypassed Hazards & Failed Assets:</span>
              <ul className="erc-avoided-list">
                {avoidedAssets.map((asset, idx) => (
                  <li key={idx}>
                    <span className="avoid-icon" aria-hidden="true">✕</span>
                    <span>{typeof asset === 'object' ? (asset.name || asset.id) : asset}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Safety Narrative */}
          {safetyExplanation && (
            <div className="erc-narrative-box">
              <span className="narrative-icon" aria-hidden="true">🛡️</span>
              <p>{safetyExplanation}</p>
            </div>
          )}

          {/* Model Generated Disclaimer */}
          {isModelGenerated && (
            <div className="erc-disclaimer">
              <span>⚠️ Model-generated route for demonstration • Not for live emergency navigation</span>
            </div>
          )}
        </div>
      ) : (
        <div className="erc-empty-state">
          <p>Run simulation or select active flood timeline to calculate an emergency safe route.</p>
        </div>
      )}
    </div>
  );
}
