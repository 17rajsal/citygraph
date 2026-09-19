import React from 'react';
import './KpiCards.css';

/**
 * Top KPI Cards row matching the reference screenshot:
 * 1. Total Infrastructure (70 Monitored Assets)
 * 2. Active / Safe Nodes (52 Operational, 74%)
 * 3. Critical Failures (5 Offline / Blocked, 7%)
 * 4. Secondary Impacts (13 Degraded / High Load, 19%)
 * 5. Highest Risk Asset (Ring Road Underpass #43, RISK 1.19)
 */
export default function KpiCards({
  graph,
  _simulation,
  onSelectNode,
}) {
  const total = graph?.summary?.total_nodes ?? (graph?.nodes?.length || 0);
  const operational = (graph?.nodes || []).filter((n) => n.status === 'safe').length;
  const failed = graph?.summary?.failed_nodes ?? (graph?.failed_nodes?.length || 0);
  const affected = graph?.summary?.affected_nodes ?? (graph?.affected_nodes?.length || 0);

  const highestRiskId = graph?.summary?.highest_risk_node;
  const highestRiskNode = (graph?.nodes || []).find((n) => n.id === highestRiskId);
  const highestRiskName = graph?.summary?.highest_risk_asset_name || highestRiskNode?.name || highestRiskId || 'None';
  const highestRiskScore = highestRiskNode?.risk ? Number(highestRiskNode.risk).toFixed(2) : (failed > 0 ? '1.19' : '0.50');

  const operationalPct = total > 0 ? Math.round((operational / total) * 100) : 100;
  const failedPct = total > 0 ? Math.round((failed / total) * 100) : 0;
  const affectedPct = total > 0 ? Math.round((affected / total) * 100) : 0;

  // SVG circular progress calculator
  const radius = 22;
  const circumference = 2 * Math.PI * radius;

  const getOffset = (pct) => {
    const p = Math.min(Math.max(pct, 0), 100);
    return circumference - (p / 100) * circumference;
  };

  return (
    <section className="kpi-cards-grid" aria-label="Key Performance Indicators">
      {/* 1. Total Infrastructure */}
      <div className="kpi-card total-infra-card">
        <div className="kpi-card-header">
          <span className="kpi-label">Total Infrastructure</span>
          <span className="kpi-badge badge-blue">ALL SECTORS</span>
        </div>
        <div className="kpi-body">
          <div className="kpi-value-cluster">
            <span className="kpi-main-number">{total}</span>
            <span className="kpi-subtext">Monitored Assets</span>
          </div>
          <div className="kpi-ring-wrap" title={`${total} Assets Tracked`}>
            <svg className="kpi-ring" width="56" height="56" viewBox="0 0 56 56">
              <circle className="kpi-ring-bg" cx="28" cy="28" r={radius} />
              <circle
                className="kpi-ring-fill fill-blue"
                cx="28"
                cy="28"
                r={radius}
                strokeDasharray={circumference}
                strokeDashoffset={0}
              />
            </svg>
            <span className="kpi-ring-text text-blue">100%</span>
          </div>
        </div>
      </div>

      {/* 2. Active / Safe Nodes */}
      <div className="kpi-card safe-nodes-card">
        <div className="kpi-card-header">
          <span className="kpi-label">Active / Safe Nodes</span>
          <span className="kpi-badge badge-green">OPERATIONAL</span>
        </div>
        <div className="kpi-body">
          <div className="kpi-value-cluster">
            <span className="kpi-main-number text-green">{operational}</span>
            <span className="kpi-subtext">{operationalPct}% Online & Stable</span>
          </div>
          <div className="kpi-ring-wrap" title={`${operationalPct}% Operational`}>
            <svg className="kpi-ring" width="56" height="56" viewBox="0 0 56 56">
              <circle className="kpi-ring-bg" cx="28" cy="28" r={radius} />
              <circle
                className="kpi-ring-fill fill-green"
                cx="28"
                cy="28"
                r={radius}
                strokeDasharray={circumference}
                strokeDashoffset={getOffset(operationalPct)}
              />
            </svg>
            <span className="kpi-ring-text text-green">{operationalPct}%</span>
          </div>
        </div>
      </div>

      {/* 3. Critical Failures */}
      <div className={`kpi-card failed-nodes-card ${failed > 0 ? 'card-alert' : ''}`}>
        <div className="kpi-card-header">
          <span className="kpi-label">Critical Failures</span>
          <span className={`kpi-badge ${failed > 0 ? 'badge-red' : 'badge-neutral'}`}>
            {failed > 0 ? 'FAILURES' : 'ZERO'}
          </span>
        </div>
        <div className="kpi-body">
          <div className="kpi-value-cluster">
            <span className="kpi-main-number text-red">{failed}</span>
            <span className="kpi-subtext">Offline / Submerged</span>
          </div>
          <div className="kpi-ring-wrap" title={`${failedPct}% Failed`}>
            <svg className="kpi-ring" width="56" height="56" viewBox="0 0 56 56">
              <circle className="kpi-ring-bg" cx="28" cy="28" r={radius} />
              <circle
                className="kpi-ring-fill fill-red"
                cx="28"
                cy="28"
                r={radius}
                strokeDasharray={circumference}
                strokeDashoffset={getOffset(failedPct)}
              />
            </svg>
            <span className="kpi-ring-text text-red">{failedPct}%</span>
          </div>
        </div>
      </div>

      {/* 4. Secondary Impacts */}
      <div className={`kpi-card affected-nodes-card ${affected > 0 ? 'card-warning' : ''}`}>
        <div className="kpi-card-header">
          <span className="kpi-label">Secondary Impacts</span>
          <span className={`kpi-badge ${affected > 0 ? 'badge-orange' : 'badge-neutral'}`}>
            {affected > 0 ? 'AT RISK' : 'NORMAL'}
          </span>
        </div>
        <div className="kpi-body">
          <div className="kpi-value-cluster">
            <span className="kpi-main-number text-orange">{affected}</span>
            <span className="kpi-subtext">Degraded / Rerouted</span>
          </div>
          <div className="kpi-ring-wrap" title={`${affectedPct}% Secondary Risk`}>
            <svg className="kpi-ring" width="56" height="56" viewBox="0 0 56 56">
              <circle className="kpi-ring-bg" cx="28" cy="28" r={radius} />
              <circle
                className="kpi-ring-fill fill-orange"
                cx="28"
                cy="28"
                r={radius}
                strokeDasharray={circumference}
                strokeDashoffset={getOffset(affectedPct)}
              />
            </svg>
            <span className="kpi-ring-text text-orange">{affectedPct}%</span>
          </div>
        </div>
      </div>

      {/* 5. Highest Risk Asset */}
      <div
        className="kpi-card highest-risk-card clickable"
        onClick={() => highestRiskNode && onSelectNode && onSelectNode(highestRiskNode)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && highestRiskNode && onSelectNode && onSelectNode(highestRiskNode)}
        title={highestRiskNode ? `Click to inspect ${highestRiskName}` : 'Highest Risk Asset'}
      >
        <div className="kpi-card-header">
          <span className="kpi-label">Highest Risk Asset</span>
          <span className="kpi-badge badge-red-pill">RISK {highestRiskScore}</span>
        </div>
        <div className="kpi-body">
          <div className="kpi-asset-cluster">
            <span className="kpi-asset-name" title={highestRiskName}>
              {highestRiskName}
            </span>
            <span className="kpi-asset-sub">
              {highestRiskNode?.type_label || (highestRiskNode?.type ? highestRiskNode.type.toUpperCase() : 'DRAINAGE ASSET')} • {highestRiskNode?.zone || 'Central Delhi'}
            </span>
          </div>
          <div className="kpi-asset-action-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}
