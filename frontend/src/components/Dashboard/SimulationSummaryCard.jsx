import React from 'react';
import './SimulationSummaryCard.css';

export default function SimulationSummaryCard({
  graph,
  simulation,
  onReset,
  loading,
}) {
  const isSimulated = Boolean(simulation);
  const failed = graph?.summary?.failed_nodes ?? (graph?.failed_nodes?.length || 0);
  const affected = graph?.summary?.affected_nodes ?? (graph?.affected_nodes?.length || 0);
  const highestId = graph?.summary?.highest_risk_node || 'N/A';
  const highestName = graph?.summary?.highest_risk_asset_name || highestId;

  // Actual working JSON report export
  const handleExportReport = () => {
    const reportData = {
      title: 'CityGraph Urban Risk Intelligence - Assessment Report',
      timestamp: new Date().toISOString(),
      scenario: isSimulated ? 'Monsoon Cloudburst (90mm/h)' : 'Baseline Operational State',
      metrics: {
        total_nodes: graph?.nodes?.length || 0,
        failed_nodes_count: failed,
        affected_nodes_count: affected,
        highest_risk_asset: highestName,
      },
      failed_assets: (graph?.nodes || []).filter((n) => n.status === 'failed'),
      affected_assets: (graph?.nodes || []).filter((n) => n.status === 'affected'),
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `citygraph-assessment-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="analytics-card simulation-summary-card">
      <div className="card-header-row">
        <div>
          <h4 className="card-title">Simulation Summary</h4>
          <span className="card-subtitle">Automated Impact & Resilience Findings</span>
        </div>
        <div className={`status-pill-badge ${isSimulated ? 'badge-complete' : 'badge-baseline'}`}>
          {isSimulated ? '✓ SIMULATION COMPLETE' : 'BASELINE READY'}
        </div>
      </div>

      <div className="summary-content-body">
        {isSimulated ? (
          <ul className="findings-list">
            <li className="finding-item finding-crit">
              <span className="bullet-dot crit-dot" />
              <span>
                <strong>{failed} Critical Assets Offline:</strong> Inundation and localized drainage failures.
              </span>
            </li>
            <li className="finding-item finding-warn">
              <span className="bullet-dot warn-dot" />
              <span>
                <strong>{affected} Secondary Cascading Loads:</strong> Power grid & arterial junctions degraded.
              </span>
            </li>
            <li className="finding-item finding-info">
              <span className="bullet-dot info-dot" />
              <span>
                <strong>Critical Epicenter:</strong> {highestName} exceeded rated hydraulic capacity.
              </span>
            </li>
          </ul>
        ) : (
          <ul className="findings-list">
            <li className="finding-item finding-safe">
              <span className="bullet-dot safe-dot" />
              <span>
                <strong>70 Nodes Operational:</strong> Network running within standard capacity thresholds.
              </span>
            </li>
            <li className="finding-item finding-info">
              <span className="bullet-dot info-dot" />
              <span>
                <strong>Zero Active Failures:</strong> All arterial corridors clear for transit dispatch.
              </span>
            </li>
            <li className="finding-item finding-info">
              <span className="bullet-dot info-dot" />
              <span>
                <strong>Stress Test Available:</strong> Trigger Monsoon Cloudburst to simulate cascading failures.
              </span>
            </li>
          </ul>
        )}
      </div>

      {/* Action Buttons */}
      <div className="summary-actions-cluster">
        <button
          type="button"
          className="btn-export-report"
          onClick={handleExportReport}
          title="Download complete JSON risk assessment report"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          <span>Download Report</span>
        </button>

        {isSimulated && (
          <button
            type="button"
            className="btn-reset-compact"
            onClick={onReset}
            disabled={loading}
            title="Reset network to normal baseline"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
            <span>Reset Baseline</span>
          </button>
        )}
      </div>
    </div>
  );
}
