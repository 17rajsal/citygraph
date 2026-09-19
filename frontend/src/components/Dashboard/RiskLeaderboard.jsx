import React, { useMemo } from 'react';
import './RiskLeaderboard.css';

export default function RiskLeaderboard({
  nodes = [],
  selectedNode = null,
  onSelectNode = () => {},
}) {
  // Sort nodes by risk descending and take top 5
  const topAssets = useMemo(() => {
    if (!nodes || !nodes.length) return [];
    return [...nodes]
      .sort((a, b) => (Number(b.risk) || 0) - (Number(a.risk) || 0))
      .slice(0, 5);
  }, [nodes]);

  return (
    <div className="analytics-card risk-leaderboard-card">
      <div className="card-header-row">
        <div>
          <h4 className="card-title">Top 5 Highest Risk Assets</h4>
          <span className="card-subtitle">Ranked by Cascading Vulnerability Score</span>
        </div>
        <span className="live-rank-badge">LIVE RANKING</span>
      </div>

      <div className="leaderboard-table-wrapper">
        <table className="leaderboard-table">
          <thead>
            <tr>
              <th className="th-asset">Asset / Sector</th>
              <th className="th-risk">Risk Score</th>
              <th className="th-status">Status</th>
            </tr>
          </thead>
          <tbody>
            {topAssets.map((asset, index) => {
              const isSelected = selectedNode && selectedNode.id === asset.id;
              const riskNum = Number(asset.risk || 0);
              const status = asset.status || 'safe';

              return (
                <tr
                  key={asset.id}
                  className={`asset-table-row ${isSelected ? 'row-selected' : ''}`}
                  onClick={() => onSelectNode(asset)}
                  title={`Click to inspect ${asset.name || asset.id}`}
                >
                  <td className="td-asset">
                    <div className="asset-name-cell">
                      <span className="rank-num">#{index + 1}</span>
                      <div className="asset-meta-cell">
                        <span className="asset-row-name">{asset.name || asset.id}</span>
                        <span className="asset-row-type">
                          {asset.type_label || asset.type} • {asset.zone || 'Central Delhi'}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td className="td-risk">
                    <span className={`risk-badge risk-${riskNum > 1 ? 'critical' : riskNum > 0.7 ? 'high' : 'norm'}`}>
                      {riskNum.toFixed(2)}
                    </span>
                  </td>

                  <td className="td-status">
                    <span className={`status-badge status-${status}`}>
                      {status.toUpperCase()}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="leaderboard-footer-hint">
        <span>Click any row above to center map and inspect asset telemetry.</span>
      </div>
    </div>
  );
}
