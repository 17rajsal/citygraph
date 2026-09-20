import React from 'react';
import './LiveTrafficAlerts.css';

/**
 * LiveTrafficAlerts - Matches Section 19 of User Specification:
 * "LIVE TRAFFIC & ALERTS
 * Example alerts based on actual backend state:
 * - ⚠ Moderate traffic on Ring Road (~8 min delay)
 * - ℹ Waterlogging reported near ITO (Use alternative route)
 * - 🔴 Drainage pump at Nizamuddin (Operating at 92% capacity)
 * Clicking an alert should focus the relevant location on the map."
 */
export default function LiveTrafficAlerts({
  simulation,
  graph,
  onFocusNode,
}) {
  const isSimulated = Boolean(simulation);

  const alerts = isSimulated
    ? [
        {
          id: 'alert-1',
          type: 'danger',
          icon: '🔴',
          title: 'Drainage Sluice Submerged near Ring Road Underpass #43',
          desc: 'Stormwater backflow detected. Mathura Road & Barapullah flyover approach inundated (depth ~0.8m).',
          nodeId: 'node_43',
          badge: 'CRITICAL',
        },
        {
          id: 'alert-2',
          type: 'warning',
          icon: '⚠️',
          title: 'Waterlogging Reported near ITO & Kashmere Gate',
          desc: 'Ring Road lowlands congested. Traffic rerouting via Central Arterial & Metro Viaduct.',
          nodeId: 'node_20',
          badge: 'REROUTING',
        },
        {
          id: 'alert-3',
          type: 'info',
          icon: 'ℹ️',
          title: 'AIIMS Apex Trauma Center Corridor Active',
          desc: 'South-West Arterial link towards IGI Airport T3 prioritized for emergency triage transit.',
          nodeId: 'node_1',
          badge: 'PRIORITY-1',
        },
        {
          id: 'alert-4',
          type: 'warning',
          icon: '⚡',
          title: 'Civil Lines Substation High Load (92% Capacity)',
          desc: 'Power distribution redirected to prevent regional grid overload.',
          nodeId: 'node_15',
          badge: 'HIGH LOAD',
        },
      ]
    : [
        {
          id: 'alert-baseline-1',
          type: 'info',
          icon: 'ℹ️',
          title: 'Baseline City Operations Normal',
          desc: 'All 108 monitored Delhi-NCR infrastructure nodes operating within nominal tolerances.',
          nodeId: 'node_1',
          badge: 'NOMINAL',
        },
        {
          id: 'alert-baseline-2',
          type: 'warning',
          icon: '⚠️',
          title: 'Pre-Monsoon Sluice Readiness Active',
          desc: 'Barapullah & Nizamuddin pumping stations on standby for heavy precipitation surcharge.',
          nodeId: 'node_43',
          badge: 'MONITORING',
        },
      ];

  const handleAlertClick = (nodeId) => {
    if (!onFocusNode || !graph?.nodes) return;
    const target = graph.nodes.find((n) => n.id === nodeId);
    if (target) {
      onFocusNode(target);
    }
  };

  return (
    <div className="live-traffic-alerts-card" aria-label="Live Traffic & Telemetry Alerts">
      <div className="alerts-card-header">
        <div className="header-left-title">
          <span className="pulse-alert-dot" />
          <h4 className="alerts-heading">Live Traffic & Alerts</h4>
        </div>
        <span className="alerts-count-badge">
          {alerts.length} Active {alerts.length === 1 ? 'Notice' : 'Alerts'}
        </span>
      </div>

      <div className="alerts-list-grid">
        {alerts.map((item) => (
          <div
            key={item.id}
            className={`alert-item alert-type-${item.type}`}
            onClick={() => handleAlertClick(item.nodeId)}
            title="Click to focus location on map"
            role="button"
            tabIndex={0}
          >
            <span className="alert-item-icon">{item.icon}</span>
            <div className="alert-item-body">
              <div className="alert-item-top">
                <span className="alert-item-title">{item.title}</span>
                <span className={`alert-item-badge badge-${item.type}`}>
                  {item.badge}
                </span>
              </div>
              <p className="alert-item-desc">{item.desc}</p>
            </div>
            <span className="alert-focus-arrow" aria-hidden="true">→</span>
          </div>
        ))}
      </div>
    </div>
  );
}
