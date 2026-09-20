import React from 'react';
import './QuickActionsBar.css';

export default function QuickActionsBar({
  onRunEvacuation = () => {},
  onFindEmergencyRoute = () => {},
  onGenerateReport = () => {},
  onViewRiskHeatmap = () => {},
}) {
  return (
    <div className="quick-actions-container" aria-label="Command Center Quick Actions">
      <div className="quick-actions-label">
        <span>Quick Actions</span>
      </div>

      <div className="quick-actions-grid">
        <button
          type="button"
          className="quick-action-btn btn-action-evacuation"
          onClick={onRunEvacuation}
        >
          <span className="action-icon">🏃</span>
          <span className="action-title">Run Evacuation Plan</span>
        </button>

        <button
          type="button"
          className="quick-action-btn btn-action-route"
          onClick={onFindEmergencyRoute}
        >
          <span className="action-icon">✈</span>
          <span className="action-title">Find Emergency Route</span>
        </button>

        <button
          type="button"
          className="quick-action-btn btn-action-report"
          onClick={onGenerateReport}
        >
          <span className="action-icon">📄</span>
          <span className="action-title">Generate Report</span>
        </button>

        <button
          type="button"
          className="quick-action-btn btn-action-heatmap"
          onClick={onViewRiskHeatmap}
        >
          <span className="action-icon">📊</span>
          <span className="action-title">View Risk Heatmap</span>
        </button>
      </div>
    </div>
  );
}
