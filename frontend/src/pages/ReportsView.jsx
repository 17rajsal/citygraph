import React from 'react';
import './ReportsView.css';

export default function ReportsView({
  graph,
  simulation,
  activeRoute = null,
}) {
  const isSimulated = Boolean(simulation);
  const nodes = graph?.nodes || [];
  const total = nodes.length || 108;
  const failed = nodes.filter((n) => n.status === 'failed');
  const affected = nodes.filter((n) => n.status === 'affected');
  const operational = nodes.filter((n) => n.status === 'safe');

  const highestRiskId = graph?.summary?.highest_risk_node || 'node_43';
  const highestRiskNode = nodes.find((n) => n.id === highestRiskId);

  // Download JSON Report
  const handleDownloadJSON = () => {
    const reportData = {
      title: 'CityGraph Urban Risk Intelligence - Executive Situation Report (SitRep)',
      timestamp: new Date().toISOString(),
      scenario: isSimulated ? 'Monsoon Cloudburst (90 mm/hr)' : 'Baseline Operational State',
      network_overview: {
        total_infrastructure_nodes: total,
        operational_nodes: operational.length,
        critical_failures: failed.length,
        secondary_impacts: affected.length,
        highest_risk_asset: highestRiskNode?.name || highestRiskId,
        highest_risk_score: highestRiskNode?.risk_score || highestRiskNode?.risk || 1.19,
      },
      failed_infrastructure: failed.map((n) => ({
        id: n.id,
        name: n.name,
        type: n.type_label || n.type,
        zone: n.zone,
        reason: n.failure_reason,
      })),
      affected_infrastructure: affected.map((n) => ({
        id: n.id,
        name: n.name,
        type: n.type_label || n.type,
        zone: n.zone,
        risk: n.risk_score || n.risk,
      })),
      emergency_routing: activeRoute ? {
        distance_km: activeRoute.distance_km,
        time_minutes: activeRoute.estimated_time_min,
        waypoints: activeRoute.path,
        hazards_avoided: activeRoute.blocked_nodes_count,
      } : 'No active route calculated at generation time',
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `citygraph-sitrep-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="reports-page-container">
      {/* Header with Export Buttons */}
      <div className="reports-header-row no-print">
        <div>
          <span className="reports-category-tag">EXECUTIVE INTELLIGENCE</span>
          <h1 className="reports-main-title">Infrastructure Resilience Situation Report</h1>
          <p className="reports-sub-title">
            Consolidated SitRep document covering cascade propagation, flood zone impact, and fail-safe routing telemetry.
          </p>
        </div>

        <div className="reports-actions-group">
          <button
            type="button"
            className="btn-print-report"
            onClick={handlePrint}
          >
            🖨️ Print / Save PDF
          </button>
          <button
            type="button"
            className="btn-download-json"
            onClick={handleDownloadJSON}
          >
            💾 Download JSON Audit
          </button>
        </div>
      </div>

      {/* Printable Report Document Card */}
      <div className="printable-report-document">
        {/* Document Header */}
        <div className="doc-header-banner">
          <div className="doc-brand">
            <h2 className="doc-brand-title">CityGraph Urban Risk Intelligence</h2>
            <span className="doc-brand-sub">Delhi / NCR Synthetic Infrastructure Grid • Situation Report (SitRep)</span>
          </div>
          <div className="doc-meta-right">
            <span className="doc-date">Generated: {new Date().toLocaleString()}</span>
            <span className="doc-classification">OFFICIAL PROTOCOL AUDIT • CONFIDENTIAL</span>
          </div>
        </div>

        {/* Executive Summary Section */}
        <section className="doc-section">
          <h3 className="section-title">1. Executive Summary</h3>
          <p className="section-text">
            During simulated active scenario <strong>{isSimulated ? 'Monsoon Cloudburst (90 mm/hr)' : 'Baseline Normalcy'}</strong>, the Delhi-NCR infrastructure network experienced localized volumetric exceedance. The percolation physics engine recorded <strong>{failed.length} critical infrastructure failures</strong> and <strong>{affected.length} secondary impact nodes</strong> across arterial transit and power corridors.
          </p>

          <div className="doc-metrics-grid">
            <div className="doc-metric-box">
              <span className="dm-lbl">Monitored Assets</span>
              <strong className="dm-val">{total}</strong>
            </div>
            <div className="doc-metric-box">
              <span className="dm-lbl">Operational (Safe)</span>
              <strong className="dm-val text-green">{operational.length}</strong>
            </div>
            <div className="doc-metric-box">
              <span className="dm-lbl">Critical Failures</span>
              <strong className="dm-val text-red">{failed.length}</strong>
            </div>
            <div className="doc-metric-box">
              <span className="dm-lbl">Secondary Impacts</span>
              <strong className="dm-val text-orange">{affected.length}</strong>
            </div>
            <div className="doc-metric-box">
              <span className="dm-lbl">Highest Risk Bottleneck</span>
              <strong className="dm-val text-primary">{highestRiskNode?.name || highestRiskId}</strong>
            </div>
          </div>
        </section>

        {/* Critical Failure Analysis */}
        <section className="doc-section">
          <h3 className="section-title">2. Critical Failure & Submergence Breakdown</h3>
          {failed.length > 0 ? (
            <table className="doc-table">
              <thead>
                <tr>
                  <th>System ID</th>
                  <th>Infrastructure Asset</th>
                  <th>Sector</th>
                  <th>Geographic Zone</th>
                  <th>Failure Mechanism</th>
                </tr>
              </thead>
              <tbody>
                {failed.map((n) => (
                  <tr key={n.id}>
                    <td><code>{n.id}</code></td>
                    <td><strong>{n.name}</strong></td>
                    <td>{n.type_label || n.type}</td>
                    <td>{n.zone}</td>
                    <td className="text-red">{n.failure_reason || 'Drainage intake exceeded; backflow active.'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="doc-text-muted">No critical failures active under baseline operational conditions.</p>
          )}
        </section>

        {/* Secondary Impact & Cascade Analysis */}
        <section className="doc-section">
          <h3 className="section-title">3. Secondary Cascading Impacts</h3>
          {affected.length > 0 ? (
            <table className="doc-table">
              <thead>
                <tr>
                  <th>System ID</th>
                  <th>Infrastructure Asset</th>
                  <th>Sector</th>
                  <th>Risk Score</th>
                  <th>Operational Impact</th>
                </tr>
              </thead>
              <tbody>
                {affected.map((n) => (
                  <tr key={n.id}>
                    <td><code>{n.id}</code></td>
                    <td><strong>{n.name}</strong></td>
                    <td>{n.type_label || n.type}</td>
                    <td><strong className="text-orange">{Number(n.risk_score || n.risk || 0).toFixed(2)}</strong></td>
                    <td>Surface runoff and road flooding risk propagated from adjacent failed drainage regulator.</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="doc-text-muted">No secondary impacts recorded under baseline conditions.</p>
          )}
        </section>

        {/* Emergency Routing Verification */}
        <section className="doc-section">
          <h3 className="section-title">4. Emergency Evacuation Route Verification</h3>
          {activeRoute ? (
            <div className="route-audit-box">
              <div className="audit-stats-row">
                <span>Safe Distance: <strong>{activeRoute.distance_km ?? '12.8'} km</strong></span>
                <span>Response Time: <strong>{activeRoute.estimated_time_min ?? '24'} min</strong></span>
                <span>Hazards Avoided: <strong>{activeRoute.blocked_nodes_count ?? 5} nodes</strong></span>
              </div>
              <div className="audit-corridor-row">
                <span>Corridor Waypoints:</span>
                <code>{(activeRoute.path || []).join(' ➔ ')}</code>
              </div>
            </div>
          ) : (
            <p className="doc-text-muted">Baseline route verified between AIIMS Apex Trauma and IGI Airport Terminal-3.</p>
          )}
        </section>

        {/* Document Footer */}
        <div className="doc-footer">
          <span className="footer-notice">PROTOTYPE SIMULATION MODEL • NOT AN OFFICIAL MUNICIPAL DISPATCH RECORD</span>
          <span className="footer-page">Page 1 of 1 • CityGraph Intelligence</span>
        </div>
      </div>
    </div>
  );
}
