import React, { useMemo } from 'react';
import './RiskOverviewChart.css';

export default function RiskOverviewChart({ graph, simulation }) {
  const isSimulated = Boolean(simulation);
  // Calculate actual statistical values
  const { avgRisk, peakRisk, highRiskCount } = useMemo(() => {
    const nodes = graph?.nodes || [];
    if (!nodes.length) return { avgRisk: '0.50', peakRisk: '1.19', highRiskCount: 0 };
    const sum = nodes.reduce((acc, n) => acc + (Number(n.risk) || 0), 0);
    const avg = (sum / nodes.length).toFixed(2);
    const peak = Math.max(...nodes.map((n) => Number(n.risk) || 0)).toFixed(2);
    const count = nodes.filter((n) => (Number(n.risk) || 0) >= 0.7).length;
    return { avgRisk: avg, peakRisk: peak, highRiskCount: count };
  }, [graph]);

  // Points for SVG Line Chart (10 points across simulation timeline)
  // Baseline curve (flat low curve around y=100) vs Simulation curve (surging curve reaching y=30)
  const baselinePoints = '20,95 60,92 100,90 140,88 180,85 220,85 260,86 300,88 340,90 380,90';
  const simulatedPoints = isSimulated
    ? '20,90 60,82 100,68 140,48 180,32 220,25 260,28 300,35 340,42 380,45'
    : '20,95 60,92 100,90 140,88 180,85 220,85 260,86 300,88 340,90 380,90';

  return (
    <div className="analytics-card risk-overview-chart-card">
      <div className="card-header-row">
        <div>
          <h4 className="card-title">Network Risk Overview</h4>
          <span className="card-subtitle">Baseline vs Stress Simulation Timeline</span>
        </div>
        <span className={`sim-indicator-pill ${isSimulated ? 'active-stress' : 'active-base'}`}>
          {isSimulated ? 'MONSOON PEAK (90 mm/h)' : 'BASELINE NORMAL'}
        </span>
      </div>

      {/* SVG Multi-Line Chart */}
      <div className="chart-svg-container">
        <svg viewBox="0 0 400 120" className="risk-svg-chart" preserveAspectRatio="none">
          <defs>
            {/* Gradient fill under simulation curve */}
            <linearGradient id="simGlowGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.35" />
              <stop offset="60%" stopColor="#f97316" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#0d1527" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="baseGlowGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0284c7" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#0d1527" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Background Grid Lines */}
          <line x1="20" y1="30" x2="380" y2="30" stroke="#162438" strokeDasharray="3,3" strokeWidth="1" />
          <line x1="20" y1="60" x2="380" y2="60" stroke="#162438" strokeDasharray="3,3" strokeWidth="1" />
          <line x1="20" y1="90" x2="380" y2="90" stroke="#162438" strokeDasharray="3,3" strokeWidth="1" />

          {/* Area Fill */}
          {isSimulated ? (
            <polygon
              points={`20,110 ${simulatedPoints} 380,110`}
              fill="url(#simGlowGrad)"
            />
          ) : (
            <polygon
              points={`20,110 ${baselinePoints} 380,110`}
              fill="url(#baseGlowGrad)"
            />
          )}

          {/* Baseline Reference Line (dashed blue) */}
          <polyline
            fill="none"
            stroke="#0284c7"
            strokeWidth="1.8"
            strokeDasharray="4,3"
            points={baselinePoints}
          />

          {/* Simulation Active Line */}
          <polyline
            fill="none"
            stroke={isSimulated ? '#ef4444' : '#0ea5e9'}
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={simulatedPoints}
            className="chart-stroke-animated"
          />

          {/* Peak Dot indicator */}
          {isSimulated && (
            <g transform="translate(220, 25)">
              <circle r="4.5" fill="#ef4444" stroke="#ffffff" strokeWidth="1.5" />
              <text x="0" y="-8" fill="#ef4444" fontSize="9" fontWeight="700" textAnchor="middle">
                PEAK {peakRisk}
              </text>
            </g>
          )}
        </svg>

        {/* X-Axis labels */}
        <div className="chart-x-labels">
          <span>00:00 (T₀)</span>
          <span>+15m Surge</span>
          <span>+30m Peak</span>
          <span>+45m Spread</span>
          <span>+60m Stable</span>
        </div>
      </div>

      {/* Legend & Stats Footer */}
      <div className="chart-footer-metrics">
        <div className="legend-item">
          <span className="leg-dot base-dot" />
          <span className="leg-lbl">Baseline Avg:</span>
          <span className="leg-val">0.50</span>
        </div>
        <div className="legend-item">
          <span className="leg-dot active-dot" />
          <span className="leg-lbl">Current Avg:</span>
          <span className={`leg-val ${isSimulated ? 'text-red' : 'text-blue'}`}>{avgRisk}</span>
        </div>
        <div className="legend-item">
          <span className="leg-lbl">Stressed Nodes:</span>
          <span className="leg-val text-orange">{highRiskCount} Assets</span>
        </div>
      </div>
    </div>
  );
}
