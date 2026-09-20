import React, { useState, useMemo } from 'react';
import './InfrastructureView.css';

export default function InfrastructureView({
  nodes = [],
  selectedNode = null,
  onSelectNode = () => {},
  onNavigateToMap = () => {},
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [zoneFilter, setZoneFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [riskFilter, setRiskFilter] = useState('all');
  const [viewFormat, setViewFormat] = useState('table'); // 'table' | 'cards'

  // Summary counts
  const total = nodes.length;
  const operational = nodes.filter((n) => n.status === 'safe').length;
  const atRisk = nodes.filter((n) => n.status === 'safe' && (Number(n.risk || n.risk_score) || 0) >= 0.7).length;
  const affected = nodes.filter((n) => n.status === 'affected').length;
  const failed = nodes.filter((n) => n.status === 'failed').length;

  // Extract unique zones
  const zones = useMemo(() => {
    const set = new Set();
    nodes.forEach((n) => {
      if (n.zone) set.add(n.zone);
    });
    return Array.from(set).sort();
  }, [nodes]);

  // Filter logic
  const filteredNodes = useMemo(() => {
    return nodes.filter((node) => {
      // 1. Search text
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matches =
          (node.name && node.name.toLowerCase().includes(q)) ||
          (node.id && node.id.toLowerCase().includes(q)) ||
          (node.type_label && node.type_label.toLowerCase().includes(q)) ||
          (node.zone && node.zone.toLowerCase().includes(q));
        if (!matches) return false;
      }

      // 2. Type filter
      if (typeFilter !== 'all' && node.type !== typeFilter) return false;

      // 3. Zone filter
      if (zoneFilter !== 'all' && node.zone !== zoneFilter) return false;

      // 4. Status filter
      if (statusFilter !== 'all') {
        const s = node.status || 'safe';
        if (statusFilter === 'safe' && s !== 'safe') return false;
        if (statusFilter === 'affected' && s !== 'affected') return false;
        if (statusFilter === 'failed' && s !== 'failed') return false;
      }

      // 5. Risk filter
      if (riskFilter !== 'all') {
        const r = Number(node.risk_score || node.risk) || 0;
        if (riskFilter === 'high' && r < 0.8) return false;
        if (riskFilter === 'medium' && (r < 0.5 || r >= 0.8)) return false;
        if (riskFilter === 'low' && r >= 0.5) return false;
      }

      return true;
    });
  }, [nodes, searchTerm, typeFilter, zoneFilter, statusFilter, riskFilter]);

  const handleAssetClick = (asset) => {
    onSelectNode(asset);
    onNavigateToMap();
  };

  return (
    <div className="infra-page-container">
      {/* Header with Title & Summary Badges */}
      <div className="infra-header-row">
        <div>
          <span className="infra-category-tag">ENTERPRISE INVENTORY</span>
          <h1 className="infra-main-title">Infrastructure Asset Explorer</h1>
          <p className="infra-sub-title">
            Monitored telemetry, capacities, and interdependency corridors across Delhi and the National Capital Region.
          </p>
        </div>

        {/* Summary Badges Row */}
        <div className="infra-summary-pills">
          <div className="summary-pill pill-total">
            <span className="pill-num">{total}</span>
            <span className="pill-lbl">Total Assets</span>
          </div>
          <div className="summary-pill pill-operational">
            <span className="pill-num text-green">{operational}</span>
            <span className="pill-lbl">Operational</span>
          </div>
          <div className="summary-pill pill-atrisk">
            <span className="pill-num text-amber">{atRisk}</span>
            <span className="pill-lbl">At Risk</span>
          </div>
          <div className="summary-pill pill-affected">
            <span className="pill-num text-orange">{affected}</span>
            <span className="pill-lbl">Affected</span>
          </div>
          <div className="summary-pill pill-failed">
            <span className="pill-num text-red">{failed}</span>
            <span className="pill-lbl">Critical Failures</span>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="infra-toolbar-card">
        <div className="search-box-wrap">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="infra-search-input"
            placeholder="Search by asset name, node ID, corridor, or district..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              type="button"
              className="clear-search-btn"
              onClick={() => setSearchTerm('')}
            >
              ✕
            </button>
          )}
        </div>

        <div className="filter-controls-group">
          {/* Sector / Type Filter */}
          <select
            className="infra-filter-sel"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="all">All Sectors</option>
            <option value="hospital">🏥 Hospitals</option>
            <option value="fire_station">🚒 Fire Stations</option>
            <option value="drainage">💧 Drainage & Pumps</option>
            <option value="transformer">⚡ Transformers / Power</option>
            <option value="road">🛣 Road Junctions</option>
            <option value="metro">🚇 Metro Interchanges</option>
          </select>

          {/* Zone Filter */}
          <select
            className="infra-filter-sel"
            value={zoneFilter}
            onChange={(e) => setZoneFilter(e.target.value)}
          >
            <option value="all">All Geographic Zones</option>
            {zones.map((z) => (
              <option key={z} value={z}>
                {z}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            className="infra-filter-sel"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="safe">Operational (Safe)</option>
            <option value="affected">Affected / Degraded</option>
            <option value="failed">Critical / Flooded</option>
          </select>

          {/* Risk Level Filter */}
          <select
            className="infra-filter-sel"
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
          >
            <option value="all">All Risk Levels</option>
            <option value="high">High Risk (&gt; 0.8)</option>
            <option value="medium">Medium (0.5 - 0.8)</option>
            <option value="low">Low (&lt; 0.5)</option>
          </select>

          {/* View Toggle Button */}
          <div className="view-mode-toggle">
            <button
              type="button"
              className={`toggle-btn ${viewFormat === 'table' ? 'is-active' : ''}`}
              onClick={() => setViewFormat('table')}
              title="Table View"
            >
              ☰ Table
            </button>
            <button
              type="button"
              className={`toggle-btn ${viewFormat === 'cards' ? 'is-active' : ''}`}
              onClick={() => setViewFormat('cards')}
              title="Card Grid View"
            >
              ☷ Cards
            </button>
          </div>
        </div>
      </div>

      {/* Main Results Container */}
      <div className="infra-content-card">
        <div className="results-count-bar">
          <span className="count-text">
            Showing <strong>{filteredNodes.length}</strong> of <strong>{nodes.length}</strong> infrastructure assets
          </span>
          <span className="sim-notice-tag">Prototype / Simulated Infrastructure Data</span>
        </div>

        {viewFormat === 'table' ? (
          <div className="table-responsive-wrapper">
            <table className="infra-data-table">
              <thead>
                <tr>
                  <th>Asset Name & System ID</th>
                  <th>Type / Sector</th>
                  <th>Geographic Zone</th>
                  <th>Operational State</th>
                  <th>Risk Score</th>
                  <th>Load / Capacity</th>
                  <th>Criticality</th>
                  <th>Connected Links</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredNodes.map((n) => {
                  const status = n.status || 'safe';
                  const riskVal = Number(n.risk_score || n.risk || 0);
                  const isSelected = selectedNode?.id === n.id;
                  const load = n.load ?? n.current_load ?? 50;
                  const capacity = n.capacity ?? 100;
                  const pct = capacity > 0 ? Math.round((load / capacity) * 100) : 50;

                  return (
                    <tr
                      key={n.id}
                      className={`infra-table-row ${isSelected ? 'row-selected' : ''}`}
                      onClick={() => handleAssetClick(n)}
                    >
                      <td>
                        <div className="cell-asset-info">
                          <strong className="asset-title-text">{n.name || n.id}</strong>
                          <span className="asset-id-code">{n.id}</span>
                        </div>
                      </td>
                      <td>
                        <span className="sector-tag">{n.type_label || n.type}</span>
                      </td>
                      <td>
                        <span className="zone-text">{n.zone || 'Central Delhi'}</span>
                      </td>
                      <td>
                        <span className={`status-badge-table status-${status}`}>
                          {status === 'failed' ? 'OFFLINE' : status === 'affected' ? 'AFFECTED' : 'SAFE'}
                        </span>
                      </td>
                      <td>
                        <div className="risk-cell">
                          <span className={`risk-number ${riskVal >= 1.0 ? 'text-red' : riskVal >= 0.7 ? 'text-orange' : 'text-green'}`}>
                            {riskVal.toFixed(2)}
                          </span>
                          <div className="mini-risk-bar">
                            <div
                              className={`mini-risk-fill ${riskVal >= 1.0 ? 'bg-red' : riskVal >= 0.7 ? 'bg-orange' : 'bg-green'}`}
                              style={{ width: `${Math.min(riskVal * 60, 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="load-cell-text">
                          {load} / {capacity} <small>({pct}%)</small>
                        </span>
                      </td>
                      <td>
                        <span className="criticality-text font-bold">
                          {n.criticality ?? 5} / 10
                        </span>
                      </td>
                      <td>
                        <span className="links-count">
                          {n.connected_nodes?.length ?? n.connected_corridors?.length ?? 3} Links
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn-table-inspect"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAssetClick(n);
                          }}
                        >
                          View on Map ➔
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* Cards Grid View */
          <div className="infra-cards-grid">
            {filteredNodes.map((n) => {
              const status = n.status || 'safe';
              const riskVal = Number(n.risk_score || n.risk || 0);
              const isSelected = selectedNode?.id === n.id;

              return (
                <div
                  key={n.id}
                  className={`infra-grid-card ${isSelected ? 'card-selected' : ''}`}
                  onClick={() => handleAssetClick(n)}
                >
                  <div className="grid-card-top">
                    <span className="card-type-tag">{n.type_label || n.type}</span>
                    <span className={`grid-status-pill status-${status}`}>
                      {status.toUpperCase()}
                    </span>
                  </div>

                  <h4 className="grid-card-title">{n.name || n.id}</h4>
                  <span className="grid-card-zone">{n.zone}</span>

                  <div className="grid-card-metrics">
                    <div className="metric-col">
                      <span className="m-lbl">Risk Index</span>
                      <strong className={`m-val ${riskVal >= 1.0 ? 'text-red' : 'text-primary'}`}>
                        {riskVal.toFixed(2)}
                      </strong>
                    </div>
                    <div className="metric-col">
                      <span className="m-lbl">Load / Cap</span>
                      <strong className="m-val">{n.load ?? n.current_load ?? 50} / {n.capacity ?? 100}</strong>
                    </div>
                    <div className="metric-col">
                      <span className="m-lbl">Criticality</span>
                      <strong className="m-val">{n.criticality ?? 5} / 10</strong>
                    </div>
                  </div>

                  <p className="grid-card-desc">{n.description}</p>

                  <button
                    type="button"
                    className="btn-grid-inspect"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAssetClick(n);
                    }}
                  >
                    Inspect Asset on Map ➔
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
