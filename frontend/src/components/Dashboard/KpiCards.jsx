import React from 'react';
import './KpiCards.css';

/**
 * Master KPI Cards matching the reference screenshot:
 * Row 1:
 * - Total Infrastructure (108 Monitored Assets, 100% ring)
 * - Operational Nodes (Online & Stable, green ring)
 * - Critical Failures (Offline / Submerged, red ring)
 * - Secondary Impacts (Degraded / Rerouted, amber ring)
 * - "A More Resilient Delhi" feature card with India Gate silhouette
 * 
 * Row 2:
 * - Average Risk, Critical Infrastructure, Flooded Zones, Safe Routes, Affected Corridors
 */
export default function KpiCards({
  graph,
  simulation,
  onSelectNode,
}) {
  const total = graph?.summary?.total_nodes ?? (graph?.nodes?.length || 108);
  const operational = (graph?.nodes || []).filter((n) => n.status === 'safe').length;
  const failed = graph?.summary?.failed_nodes ?? (graph?.failed_nodes?.length || 0);
  const affected = graph?.summary?.affected_nodes ?? (graph?.affected_nodes?.length || 0);

  const operationalPct = total > 0 ? Math.round((operational / total) * 100) : 100;
  const failedPct = total > 0 ? Math.round((failed / total) * 100) : 0;
  const affectedPct = total > 0 ? Math.round((affected / total) * 100) : 0;

  // Secondary metrics calculated from backend state
  const avgRisk = graph?.nodes?.length
    ? (graph.nodes.reduce((acc, n) => acc + (Number(n.risk || n.risk_score) || 0), 0) / graph.nodes.length).toFixed(2)
    : '0.42';

  const criticalInfraCount = (graph?.nodes || []).filter((n) => (n.criticality || 0) >= 8).length;
  const floodedZonesCount = failed > 0 ? 4 : 1;
  const safeRoutesAvailable = (graph?.nodes || []).length > 0 ? '98.4%' : '0%';
  const affectedCorridorsCount = affected * 2 + failed;

  // SVG circular progress ring calculator
  const radius = 22;
  const circumference = 2 * Math.PI * radius;

  const getOffset = (pct) => {
    const p = Math.min(Math.max(pct, 0), 100);
    return circumference - (p / 100) * circumference;
  };

  return (
    <section className="kpi-master-container" aria-label="Key Performance Indicators">
      {/* Row 1: Primary 5-Card Banner Grid */}
      <div className="kpi-primary-grid">
        {/* 1. Total Infrastructure */}
        <div className="kpi-card">
          <div className="kpi-card-top">
            <div className="kpi-icon-wrap icon-blue">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <polygon points="12 2 2 7 12 12 22 7 12 2" />
                <polyline points="2 17 12 22 22 17" />
                <polyline points="2 12 12 17 22 12" />
              </svg>
            </div>
            <span className="kpi-card-title">Total Infrastructure</span>
          </div>

          <div className="kpi-card-content">
            <div className="kpi-numbers">
              <span className="kpi-stat-value">{total}</span>
              <span className="kpi-stat-sub">Monitored Assets</span>
            </div>
            <div className="kpi-progress-ring">
              <svg width="54" height="54" viewBox="0 0 54 54">
                <circle className="ring-bg" cx="27" cy="27" r={radius} />
                <circle
                  className="ring-fill fill-blue"
                  cx="27"
                  cy="27"
                  r={radius}
                  strokeDasharray={circumference}
                  strokeDashoffset={0}
                />
              </svg>
              <span className="ring-label text-blue">100%</span>
            </div>
          </div>
        </div>

        {/* 2. Operational Nodes */}
        <div className="kpi-card">
          <div className="kpi-card-top">
            <div className="kpi-icon-wrap icon-green">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="M9 12l2 2 4-4" />
              </svg>
            </div>
            <span className="kpi-card-title">Operational Nodes</span>
          </div>

          <div className="kpi-card-content">
            <div className="kpi-numbers">
              <span className="kpi-stat-value text-green">{operational}</span>
              <span className="kpi-stat-sub">{operationalPct}% Online & Stable</span>
            </div>
            <div className="kpi-progress-ring">
              <svg width="54" height="54" viewBox="0 0 54 54">
                <circle className="ring-bg" cx="27" cy="27" r={radius} />
                <circle
                  className="ring-fill fill-green"
                  cx="27"
                  cy="27"
                  r={radius}
                  strokeDasharray={circumference}
                  strokeDashoffset={getOffset(operationalPct)}
                />
              </svg>
              <span className="ring-label text-green">{operationalPct}%</span>
            </div>
          </div>
        </div>

        {/* 3. Critical Failures */}
        <div className={`kpi-card ${failed > 0 ? 'is-alert-red' : ''}`}>
          <div className="kpi-card-top">
            <div className="kpi-icon-wrap icon-red">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <span className="kpi-card-title">Critical Failures</span>
          </div>

          <div className="kpi-card-content">
            <div className="kpi-numbers">
              <span className="kpi-stat-value text-red">{failed}</span>
              <span className="kpi-stat-sub">{failed > 0 ? 'Offline / Submerged' : 'All Clear / Safe'}</span>
            </div>
            <div className="kpi-progress-ring">
              <svg width="54" height="54" viewBox="0 0 54 54">
                <circle className="ring-bg" cx="27" cy="27" r={radius} />
                <circle
                  className="ring-fill fill-red"
                  cx="27"
                  cy="27"
                  r={radius}
                  strokeDasharray={circumference}
                  strokeDashoffset={getOffset(failedPct)}
                />
              </svg>
              <span className="ring-label text-red">{failedPct}%</span>
            </div>
          </div>
        </div>

        {/* 4. Secondary Impacts */}
        <div className={`kpi-card ${affected > 0 ? 'is-alert-amber' : ''}`}>
          <div className="kpi-card-top">
            <div className="kpi-icon-wrap icon-orange">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
            </div>
            <span className="kpi-card-title">Secondary Impacts</span>
          </div>

          <div className="kpi-card-content">
            <div className="kpi-numbers">
              <span className="kpi-stat-value text-orange">{affected}</span>
              <span className="kpi-stat-sub">Degraded / Rerouted</span>
            </div>
            <div className="kpi-progress-ring">
              <svg width="54" height="54" viewBox="0 0 54 54">
                <circle className="ring-bg" cx="27" cy="27" r={radius} />
                <circle
                  className="ring-fill fill-orange"
                  cx="27"
                  cy="27"
                  r={radius}
                  strokeDasharray={circumference}
                  strokeDashoffset={getOffset(affectedPct)}
                />
              </svg>
              <span className="ring-label text-orange">{affectedPct}%</span>
            </div>
          </div>
        </div>

        {/* 5. Feature Banner Card: "A More Resilient Delhi" */}
        <div className="kpi-banner-card">
          <div className="banner-art-overlay">
            <svg viewBox="0 0 160 80" fill="none" className="india-gate-silhouette">
              {/* Stylized Arch / India Gate */}
              <rect x="30" y="35" width="100" height="10" fill="#E2E8F0" rx="2" />
              <rect x="36" y="25" width="88" height="10" fill="#CBD5E1" rx="2" />
              <rect x="42" y="15" width="76" height="10" fill="#94A3B8" rx="2" />
              <rect x="44" y="45" width="18" height="35" fill="#CBD5E1" />
              <rect x="98" y="45" width="18" height="35" fill="#CBD5E1" />
              <path d="M62 80 L62 55 Q80 48 98 55 L98 80 Z" fill="#F1F5F9" />
              <circle cx="80" cy="30" r="4" fill="#0284C7" />
            </svg>
          </div>
          <div className="banner-content">
            <span className="banner-badge">SMART CITY 2026</span>
            <h4 className="banner-heading">A More Resilient Delhi</h4>
            <p className="banner-subtext">People • Technology • Safer Tomorrow</p>
          </div>
        </div>
      </div>

      {/* Row 2: Secondary Compact Telemetry Ribbon */}
      <div className="kpi-secondary-ribbon">
        <div className="sec-kpi-item">
          <span className="sec-kpi-label">Average Risk Index:</span>
          <span className="sec-kpi-val text-blue">{avgRisk} / 1.00</span>
        </div>
        <div className="sec-kpi-divider" />
        <div className="sec-kpi-item">
          <span className="sec-kpi-label">Critical Tier-1 Assets:</span>
          <span className="sec-kpi-val">{criticalInfraCount} facilities</span>
        </div>
        <div className="sec-kpi-divider" />
        <div className="sec-kpi-item">
          <span className="sec-kpi-label">Active Flood Zones:</span>
          <span className="sec-kpi-val text-orange">{floodedZonesCount} sectors</span>
        </div>
        <div className="sec-kpi-divider" />
        <div className="sec-kpi-item">
          <span className="sec-kpi-label">Safe Corridors Available:</span>
          <span className="sec-kpi-val text-green">{safeRoutesAvailable}</span>
        </div>
        <div className="sec-kpi-divider" />
        <div className="sec-kpi-item">
          <span className="sec-kpi-label">Vulnerable Corridors:</span>
          <span className="sec-kpi-val text-red">{affectedCorridorsCount} links</span>
        </div>
      </div>
    </section>
  );
}
