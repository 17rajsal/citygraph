import { useEffect, useRef, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import cytoscape from 'cytoscape';
import './App.css';

import { useAuth } from './context/AuthContext.jsx';
import ProtectedRoute from './components/Auth/ProtectedRoute.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import MapView from './components/HistoricalMap/MapView.jsx';
import NepalReferenceView from './components/NepalMap/NepalReferenceView.jsx';
import EmergencyRouteCard from './components/Common/EmergencyRouteCard.jsx';

const API = 'http://127.0.0.1:8000';

function Dashboard() {
  const { user, logout, fetchWithAuth } = useAuth();

  const graphRef = useRef(null);
  const cyRef = useRef(null);

  const [viewMode, setViewMode] = useState('synthetic_delhi'); // 'synthetic_delhi' | 'delhi_historical' | 'nepal_reference'
  const [centerViewType, setCenterViewType] = useState('graph'); // 'graph' | 'map'
  const [graph, setGraph] = useState(null);
  const [simulation, setSimulation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('connecting'); // 'connected' | 'disconnected' | 'connecting'
  const [selectedNode, setSelectedNode] = useState(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Collapsible side panels for mobile
  const [controlsOpen, setControlsOpen] = useState(true);
  const [detailsOpen, setDetailsOpen] = useState(true);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const closeDropdown = (e) => {
      if (!e.target.closest('.user-profile-cluster')) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('click', closeDropdown);
    return () => document.removeEventListener('click', closeDropdown);
  }, []);

  // Health and connection check
  const checkConnection = async () => {
    try {
      const res = await fetch(`${API}/api/health`);
      if (res.ok) {
        setConnectionStatus('connected');
      } else {
        setConnectionStatus('disconnected');
      }
    } catch {
      setConnectionStatus('disconnected');
    }
  };

  const loadGraph = async () => {
    try {
      setConnectionStatus('connecting');
      const response = await fetchWithAuth(`${API}/graph`);

      if (!response.ok) {
        throw new Error('Failed to load network graph from backend.');
      }

      const data = await response.json();
      setGraph(data);
      setConnectionStatus('connected');
      setError('');

      // Auto-select initial node if none selected or sync selected node data
      setSelectedNode((prev) => {
        if (prev) {
          const updated = data.nodes?.find((n) => n.id === prev.id);
          return updated || prev;
        }
        return (
          data.nodes?.find((n) => n.id === 'node_43') ||
          data.nodes?.find((n) => n.id === 'node_1') ||
          data.nodes?.[0] ||
          null
        );
      });
    } catch (err) {
      console.error(err);
      setError(err.message);
      setConnectionStatus('disconnected');
    }
  };

  useEffect(() => {
    loadGraph();
    const interval = setInterval(checkConnection, 15000);
    return () => clearInterval(interval);
  }, [fetchWithAuth]);

  // Cytoscape initialization and updates
  useEffect(() => {
    if (viewMode !== 'synthetic_delhi' || centerViewType !== 'graph' || !graph || !graphRef.current) {
      return;
    }

    if (cyRef.current) {
      cyRef.current.destroy();
    }

    const elements = [
      ...(graph.nodes || []).map((node) => ({
        data: {
          id: node.id,
          label: node.short_name || node.name || node.id.replace('node_', 'N'),
          name: node.name || node.id,
          short_name: node.short_name || node.id,
          type: node.type,
          type_label: node.type_label || (
            node.type === 'hospital' ? 'Emergency Hospital' :
            node.type === 'fire_station' ? 'Emergency Operations' :
            node.type === 'drainage' ? 'Stormwater Pumping Station' :
            node.type === 'transformer' ? 'Power Grid Substation' :
            'Arterial Road Junction'
          ),
          zone: node.zone || 'Municipal Grid',
          description: node.description || '',
          capacity: node.capacity,
          current_load: node.current_load,
          risk: node.risk,
          status: node.status,
          criticality: node.criticality,
          failure_reason: node.failure_reason || (
            node.status === 'failed' ? 'Intake capacity overwhelmed by storm runoff.' :
            node.status === 'affected' ? 'Secondary runoff flooding risk from adjacent failed regulator.' :
            'Operating within normal design capacity.'
          ),
          connected_corridors: node.connected_corridors || [],
          metadata_origin: node.metadata_origin || 'Synthetic asset metadata',
        },
      })),

      ...(graph.edges || []).map((edge, index) => ({
        data: {
          id: `edge_${index}`,
          source: edge.source,
          target: edge.target,
          distance: edge.distance,
        },
      })),
    ];

    const cy = cytoscape({
      container: graphRef.current,
      elements,
      style: [
        {
          selector: 'node',
          style: {
            label: 'data(label)',
            'background-color': '#475569',
            color: '#f8fafc',
            'text-valign': 'center',
            'text-halign': 'center',
            'font-size': '8.5px',
            'font-weight': '600',
            'text-max-width': '65px',
            'text-wrap': 'ellipsis',
            width: 32,
            height: 32,
            'border-width': 1.5,
            'border-color': '#64748b',
            'text-outline-width': 1,
            'text-outline-color': '#0f172a',
          },
        },
        {
          selector: 'node[type="hospital"]',
          style: {
            shape: 'hexagon',
            'background-color': '#0284c7',
            'border-color': '#38bdf8',
            width: 38,
            height: 38,
          },
        },
        {
          selector: 'node[type="fire_station"]',
          style: {
            shape: 'diamond',
            'background-color': '#ea580c',
            'border-color': '#fb923c',
            width: 36,
            height: 36,
          },
        },
        {
          selector: 'node[type="drainage"]',
          style: {
            shape: 'rectangle',
            'background-color': '#0d9488',
            'border-color': '#2dd4bf',
            width: 34,
            height: 28,
          },
        },
        {
          selector: 'node[type="transformer"]',
          style: {
            shape: 'round-rectangle',
            'background-color': '#ca8a04',
            'border-color': '#facc15',
            width: 34,
            height: 30,
          },
        },
        {
          selector: 'node[type="road"]',
          style: {
            shape: 'ellipse',
            'background-color': '#334155',
            'border-color': '#64748b',
            width: 26,
            height: 26,
          },
        },
        {
          selector: 'node[status="failed"]',
          style: {
            'background-color': '#ef4444',
            'border-color': '#fecaca',
            'border-width': 3.5,
            color: '#ffffff',
          },
        },
        {
          selector: 'node[status="affected"]',
          style: {
            'background-color': '#f97316',
            'border-color': '#ffedd5',
            'border-width': 2.5,
            color: '#ffffff',
          },
        },
        {
          selector: 'node[status="safe"]',
          style: {
            'border-color': '#22c55e',
            'border-width': 2,
          },
        },
        {
          selector: 'node:selected',
          style: {
            'border-color': '#38bdf8',
            'border-width': 4,
            'background-blacken': -0.2,
          },
        },
        {
          selector: 'edge',
          style: {
            width: 1.5,
            'line-color': '#334155',
            'curve-style': 'bezier',
            opacity: 0.6,
          },
        },
      ],
      layout: {
        name: 'cose',
        animate: false,
        randomize: false,
        fit: true,
        padding: 40,
        nodeRepulsion: () => 450000,
        idealEdgeLength: () => 60,
      },
    });

    // Tap node handler
    cy.on('tap', 'node', (evt) => {
      const node = evt.target;
      const nData = node.data();
      const rawNode = graph.nodes?.find((n) => n.id === nData.id);
      setSelectedNode(rawNode || nData);
    });

    // Auto select previously active node in cytoscape
    if (selectedNode) {
      const cyNode = cy.getElementById(selectedNode.id);
      if (cyNode) {
        cyNode.select();
      }
    }

    cyRef.current = cy;

    return () => {
      cy.destroy();
      cyRef.current = null;
    };
  }, [graph, viewMode, centerViewType]);

  // Center node in Cytoscape when selectedNode changes
  useEffect(() => {
    if (cyRef.current && selectedNode) {
      const cyNode = cyRef.current.getElementById(selectedNode.id);
      if (cyNode && cyNode.length) {
        cyRef.current.$('node:selected').unselect();
        cyNode.select();
      }
    }
  }, [selectedNode]);

  const runSimulation = async () => {
    try {
      setLoading(true);
      const response = await fetchWithAuth(`${API}/simulate/heavy-rain`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rainfall_level: 90 }),
      });

      if (!response.ok) {
        throw new Error('Simulation execution failed.');
      }

      const data = await response.json();
      setSimulation(data);
      setGraph(data);

      if (selectedNode) {
        const updated = data.nodes?.find((n) => n.id === selectedNode.id);
        if (updated) setSelectedNode(updated);
      }
      setError('');
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetNetwork = async () => {
    try {
      setLoading(true);
      const response = await fetchWithAuth(`${API}/reset`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Reset request failed.');
      }

      const data = await response.json();
      setSimulation(null);
      setGraph(data);

      if (selectedNode) {
        const updated = data.nodes?.find((n) => n.id === selectedNode.id);
        if (updated) setSelectedNode(updated);
      }
      setError('');
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Metric values
  const totalNodes = graph?.summary?.total_nodes ?? (graph?.nodes?.length || 0);
  const failedCount = graph?.summary?.failed_nodes ?? (graph?.failed_nodes?.length || 0);
  const affectedCount = graph?.summary?.affected_nodes ?? (graph?.affected_nodes?.length || 0);
  const highestRiskNode = graph?.summary?.highest_risk_node || 'N/A';
  const highestRiskAssetName = graph?.summary?.highest_risk_asset_name || highestRiskNode;
  const safeRoute = simulation?.safe_route || graph?.safe_route || [];

  return (
    <div className="app-shell">
      {/* Premium Dark Header */}
      <header className="header">
        <div className="header-left">
          <div className="brand-logo" aria-hidden="true">
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" rx="1.5" />
              <rect x="14" y="3" width="7" height="7" rx="1.5" />
              <rect x="14" y="14" width="7" height="7" rx="1.5" />
              <rect x="3" y="14" width="7" height="7" rx="1.5" />
              <path d="M10 6.5h4" />
              <path d="M6.5 10v4" />
              <path d="M17.5 10v4" />
              <path d="M10 17.5h4" />
            </svg>
          </div>

          <div className="brand-text">
            <div className="brand-title-row">
              <h1>CityGraph</h1>
              <span className="brand-version-tag">PRO</span>
            </div>
            <p>Urban Infrastructure Risk Intelligence</p>
          </div>

          {/* Connection Indicator */}
          <div
            className={`header-status status-${connectionStatus}`}
            role="status"
            aria-live="polite"
            title={`Backend status: ${connectionStatus}`}
          >
            <span className="status-dot"></span>
            <span className="status-text">
              {connectionStatus === 'connected' ? 'Connected' : connectionStatus === 'connecting' ? 'Connecting...' : 'Disconnected'}
            </span>
          </div>
        </div>

        <div className="header-actions">
          {/* Mode-specific context warning badges */}
          {viewMode === 'delhi_historical' && (
            <div className="header-historical-badge" role="status">
              <span className="historical-badge-dot"></span>
              <span className="historical-badge-text">HISTORICAL REFERENCE • NOT LIVE DATA</span>
            </div>
          )}
          {viewMode === 'nepal_reference' && (
            <div className="header-historical-badge header-nepal-badge" role="status">
              <span className="historical-badge-dot nepal-dot"></span>
              <span className="historical-badge-text">SIMULATED REFERENCE MODEL • NOT LIVE DATA</span>
            </div>
          )}

          {/* 3-Mode Segmented Switcher */}
          <div className="view-mode-switch" role="tablist" aria-label="Simulation Mode">
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === 'synthetic_delhi'}
              className={`mode-tab-btn ${viewMode === 'synthetic_delhi' ? 'active' : ''}`}
              onClick={() => setViewMode('synthetic_delhi')}
            >
              <span className="tab-icon">☍</span>
              <span>Synthetic Delhi Network</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === 'delhi_historical'}
              className={`mode-tab-btn ${viewMode === 'delhi_historical' ? 'active' : ''}`}
              onClick={() => setViewMode('delhi_historical')}
            >
              <span className="tab-icon">🗺️</span>
              <span>Delhi Historical Replay</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === 'nepal_reference'}
              className={`mode-tab-btn ${viewMode === 'nepal_reference' ? 'active' : ''}`}
              onClick={() => setViewMode('nepal_reference')}
            >
              <span className="tab-icon">🏔️</span>
              <span>Nepal Flash-Flood Reference</span>
            </button>
          </div>

          {/* User Profile Menu */}
          <div className="user-profile-cluster">
            <button
              type="button"
              className="user-profile-btn"
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              aria-expanded={userMenuOpen}
              aria-label="User Account Menu"
            >
              <div className="user-avatar-circle">
                {user?.full_name ? user.full_name[0].toUpperCase() : user?.username ? user.username[0].toUpperCase() : 'U'}
              </div>
              <div className="user-meta-col">
                <span className="user-display-name">{user?.full_name || user?.username || 'Analyst'}</span>
                <span className="user-role-badge">{user?.role || 'Incident Commander'}</span>
              </div>
              <span className="user-menu-arrow">▾</span>
            </button>

            {userMenuOpen && (
              <div className="user-dropdown-menu">
                <div className="user-dropdown-header">
                  <strong>{user?.full_name || user?.username}</strong>
                  <span className="dropdown-email">{user?.email}</span>
                </div>
                <div className="dropdown-divider"></div>
                <div className="dropdown-item-meta">
                  <span className="meta-role-tag">Role: {user?.role || 'Incident Commander'}</span>
                </div>
                <button
                  type="button"
                  className="logout-action-btn"
                  onClick={() => {
                    setUserMenuOpen(false);
                    logout();
                  }}
                >
                  <span className="logout-icon">⏻</span>
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="main-content">
        {viewMode === 'synthetic_delhi' ? (
          <>
            {/* Top 4 Equal-Height Metric Cards (Reference Image 1) */}
            <section className="stats-grid" aria-label="System Metrics">
              <div className="stat-card stat-card-total">
                <div className="stat-card-header">
                  <span className="stat-label">Total Infrastructure Assets</span>
                  <span className="stat-icon stat-icon-total" aria-hidden="true">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="6" cy="6" r="3" />
                      <circle cx="18" cy="6" r="3" />
                      <circle cx="18" cy="18" r="3" />
                      <circle cx="6" cy="18" r="3" />
                      <line x1="9" y1="6" x2="15" y2="6" />
                      <line x1="18" y1="9" x2="18" y2="15" />
                      <line x1="15" y1="18" x2="9" y2="18" />
                      <line x1="6" y1="15" x2="6" y2="9" />
                    </svg>
                  </span>
                </div>
                <div className="stat-card-body">
                  <strong className="stat-value" title={String(totalNodes)}>{totalNodes}</strong>
                  <span className="stat-description">Monitored smart city facilities</span>
                </div>
              </div>

              <div className="stat-card stat-card-failed">
                <div className="stat-card-header">
                  <span className="stat-label">Critical Failures</span>
                  <span className="stat-icon stat-icon-failed" aria-hidden="true">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                  </span>
                </div>
                <div className="stat-card-body">
                  <strong className="stat-value" title={String(failedCount)}>{failedCount}</strong>
                  <span className="stat-description">Drainage regulators overwhelmed</span>
                </div>
              </div>

              <div className="stat-card stat-card-affected">
                <div className="stat-card-header">
                  <span className="stat-label">Secondary Impacts</span>
                  <span className="stat-icon stat-icon-affected" aria-hidden="true">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2v4" />
                      <path d="M12 18v4" />
                      <path d="m4.93 4.93 2.83 2.83" />
                      <path d="m16.24 16.24 2.83 2.83" />
                      <path d="M2 12h4" />
                      <path d="M18 12h4" />
                      <path d="m4.93 19.07 2.83-2.83" />
                      <path d="m16.24 7.76 2.83-2.83" />
                    </svg>
                  </span>
                </div>
                <div className="stat-card-body">
                  <strong className="stat-value" title={String(affectedCount)}>{affectedCount}</strong>
                  <span className="stat-description">Adjacent road corridors at risk</span>
                </div>
              </div>

              <div className="stat-card stat-card-risk">
                <div className="stat-card-header">
                  <span className="stat-label">Highest Risk Asset</span>
                  <span className="stat-icon stat-icon-risk" aria-hidden="true">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      <path d="M12 8v4" />
                      <path d="M12 16h.01" />
                    </svg>
                  </span>
                </div>
                <div className="stat-card-body">
                  <strong className="stat-value" title={`${highestRiskAssetName} (${highestRiskNode})`}>
                    {highestRiskAssetName}
                  </strong>
                  <span className="stat-description">Critical operational risk index</span>
                </div>
              </div>
            </section>

            {/* Responsive 3-Panel Layout (Left Controls -> Center Network -> Right Details) */}
            <div className="dashboard-layout">
              {/* Left Column: Scenario & Simulation Controls Panel */}
              <aside className={`dashboard-controls ${!controlsOpen ? 'collapsible-closed' : ''}`}>
                <div className="control-card">
                  <div
                    className="collapsible-trigger-header"
                    onClick={() => setControlsOpen(!controlsOpen)}
                  >
                    <div>
                      <p className="eyebrow">DISASTER RESPONSE INTELLIGENCE</p>
                      <h2>Simulation Controls</h2>
                    </div>
                    <span className="collapse-indicator">
                      {controlsOpen ? '▲ Collapse' : '▼ Expand'}
                    </span>
                  </div>

                  <div className="collapsible-body">
                    {/* Scenario Information Box */}
                    <div className="scenario-meta-box">
                      <div className="scenario-meta-item">
                        <span>Active Scenario:</span>
                        <strong>Monsoon Cloudburst (90mm/hr)</strong>
                      </div>
                      <div className="scenario-meta-item">
                        <span>Primary Hazard:</span>
                        <strong style={{ color: '#ef4444' }}>Stormwater Surcharge</strong>
                      </div>
                      <div className="scenario-meta-item">
                        <span>Monitored Assets:</span>
                        <strong>70 Grid Nodes</strong>
                      </div>
                      <div className="scenario-meta-item">
                        <span>Data Origin:</span>
                        <strong style={{ color: '#38bdf8' }}>Synthetic Model</strong>
                      </div>
                    </div>

                    <div className="action-button-stack">
                      <button
                        type="button"
                        onClick={runSimulation}
                        disabled={loading}
                        className="btn btn-primary"
                      >
                        {loading ? 'Simulating Cascade...' : '⚡ Run Heavy Rain Simulation'}
                      </button>

                      <button
                        type="button"
                        onClick={resetNetwork}
                        disabled={loading}
                        className="btn btn-secondary"
                      >
                        ⟲ Reset Network Baseline
                      </button>
                    </div>

                    {error && (
                      <div className="error-banner" role="alert">
                        <strong>Notice:</strong> {error}
                      </div>
                    )}

                    {/* Interactive Legend */}
                    <div className="legend-card">
                      <h3>INFRASTRUCTURE & STATUS LEGEND</h3>
                      <div className="legend-grid">
                        <div className="legend-item">
                          <span className="shape-glyph shape-hospital" aria-hidden="true">⬢</span>
                          <span>Emergency Hospital (Blue)</span>
                        </div>
                        <div className="legend-item">
                          <span className="shape-glyph shape-fire" aria-hidden="true">◆</span>
                          <span>Fire Operations (Orange)</span>
                        </div>
                        <div className="legend-item">
                          <span className="shape-glyph shape-drainage" aria-hidden="true">■</span>
                          <span>Stormwater Pump (Teal)</span>
                        </div>
                        <div className="legend-item">
                          <span className="shape-glyph shape-transformer" aria-hidden="true">▢</span>
                          <span>Power Substation (Yellow)</span>
                        </div>
                        <div className="legend-item">
                          <span className="shape-glyph shape-road" aria-hidden="true">●</span>
                          <span>Road Junction (Gray)</span>
                        </div>
                        <div className="legend-item">
                          <span className="status-dot dot-failed" aria-hidden="true"></span>
                          <span>Critical Failure (Red)</span>
                        </div>
                        <div className="legend-item">
                          <span className="status-dot dot-affected" aria-hidden="true"></span>
                          <span>Secondary Risk (Orange)</span>
                        </div>
                        <div className="legend-item">
                          <span className="status-dot dot-safe" aria-hidden="true"></span>
                          <span>Operational (Green)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </aside>

              {/* Center Column: Network Visualization Panel with Graph/Map View Toggle */}
              <section className="dashboard-graph" aria-label="Delhi Infrastructure Network">
                <div className="graph-card">
                  <div className="graph-card-header">
                    <div>
                      <p className="eyebrow">TOPOLOGICAL VISUALIZATION</p>
                      <h2>Delhi Infrastructure Network</h2>
                    </div>

                    <div className="graph-toolbar-actions">
                      {/* Graph / Map Toggle */}
                      <div className="view-type-toggle" role="group" aria-label="Center View Selector">
                        <button
                          type="button"
                          className={`view-toggle-btn ${centerViewType === 'graph' ? 'active' : ''}`}
                          onClick={() => setCenterViewType('graph')}
                        >
                          Graph View
                        </button>
                        <button
                          type="button"
                          className={`view-toggle-btn ${centerViewType === 'map' ? 'active' : ''}`}
                          onClick={() => setCenterViewType('map')}
                        >
                          Grid Map
                        </button>
                      </div>

                      {/* Cytoscape Viewport Controls */}
                      {centerViewType === 'graph' && (
                        <div className="viewport-controls">
                          <button
                            type="button"
                            className="vp-btn"
                            onClick={() => cyRef.current?.zoom(cyRef.current.zoom() * 1.25)}
                            title="Zoom In"
                          >
                            +
                          </button>
                          <button
                            type="button"
                            className="vp-btn"
                            onClick={() => cyRef.current?.zoom(cyRef.current.zoom() * 0.8)}
                            title="Zoom Out"
                          >
                            −
                          </button>
                          <button
                            type="button"
                            className="vp-btn"
                            onClick={() => cyRef.current?.fit(null, 40)}
                            title="Fit Network"
                          >
                            ⟲
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Cytoscape Network Container or Spatial Grid Map */}
                  {centerViewType === 'graph' ? (
                    <div ref={graphRef} className="cy-graph" />
                  ) : (
                    <div className="spatial-grid-canvas">
                      <div className="spatial-grid-header">
                        <span>Zonal Municipal Grid • Click asset node to inspect</span>
                      </div>
                      <div className="spatial-zones-container">
                        {['North Yamuna Drainage Basin', 'Central Emergency Division', 'South Delhi Medical Corridor', 'Old Delhi Lowland Basin'].map((zone) => {
                          const zoneNodes = (graph?.nodes || []).filter((n) => (n.zone || '').includes(zone.split(' ')[0]));
                          return (
                            <div key={zone} className="spatial-zone-card">
                              <h4>{zone}</h4>
                              <div className="zone-nodes-chip-grid">
                                {zoneNodes.map((n) => (
                                  <button
                                    key={n.id}
                                    type="button"
                                    className={`zone-node-chip status-${n.status} ${selectedNode?.id === n.id ? 'active' : ''}`}
                                    onClick={() => setSelectedNode(n)}
                                  >
                                    <span className="chip-name">{n.short_name || n.name}</span>
                                    <span className="chip-id">({n.id})</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </section>

              {/* Right Column: Asset Details Inspector & Emergency Safe Route */}
              <aside className={`dashboard-details ${!detailsOpen ? 'collapsible-closed' : ''}`}>
                <div
                  className="collapsible-trigger-header details-trigger"
                  onClick={() => setDetailsOpen(!detailsOpen)}
                >
                  <h2>Asset Diagnostics & Route</h2>
                  <span className="collapse-indicator">
                    {detailsOpen ? '▲ Collapse' : '▼ Expand'}
                  </span>
                </div>

                <div className="collapsible-body">
                  {/* Asset Details Inspector */}
                  <div className="inspector-card">
                    <div className="inspector-header">
                      <span className="inspector-eyebrow">ASSET DIAGNOSTIC INSPECTOR</span>
                      <span className="metadata-provenance-tag">Synthetic asset metadata</span>
                    </div>

                    {selectedNode ? (
                      <div className="inspector-content">
                        <div className="inspector-name-row">
                          <h3 className="inspector-asset-name">{selectedNode.name || selectedNode.id}</h3>
                          <span className={`status-pill status-${selectedNode.status || 'safe'}`}>
                            {(selectedNode.status || 'safe').toUpperCase()}
                          </span>
                        </div>

                        <div className="inspector-meta-bar">
                          <span className="type-badge">{selectedNode.type_label || selectedNode.type}</span>
                          <span className="node-id-badge">{selectedNode.id}</span>
                          <span className="zone-badge">📍 {selectedNode.zone || 'Municipal Grid'}</span>
                        </div>

                        {/* Failure or Hazard Diagnostic */}
                        <div className="inspector-diagnostic-box">
                          <span className="diagnostic-label">Operational Diagnostic:</span>
                          <p className="diagnostic-text">{selectedNode.failure_reason}</p>
                        </div>

                        {/* Risk Metric & Load Ratio */}
                        <div className="inspector-metrics-grid">
                          <div className="inspector-metric-cell">
                            <span className="metric-cell-label">Risk Ratio:</span>
                            <div className="risk-score-display">
                              <strong className="risk-number">{selectedNode.risk || 0}</strong>
                              <div className="risk-bar-track">
                                <div
                                  className="risk-bar-fill"
                                  style={{
                                    width: `${Math.min((selectedNode.risk || 0) * 100, 100)}%`,
                                    backgroundColor:
                                      selectedNode.risk > 0.9 ? '#ef4444' : selectedNode.risk > 0.6 ? '#f97316' : '#22c55e',
                                  }}
                                />
                              </div>
                            </div>
                          </div>

                          <div className="inspector-metric-cell">
                            <span className="metric-cell-label">Current Load vs Capacity:</span>
                            <strong className="load-ratio-display">
                              {selectedNode.current_load ?? 0} / {selectedNode.capacity ?? 100}
                            </strong>
                          </div>
                        </div>

                        {/* Asset Description */}
                        {selectedNode.description && (
                          <div className="inspector-description-section">
                            <span className="desc-label">Role Description:</span>
                            <p className="desc-text">{selectedNode.description}</p>
                          </div>
                        )}

                        {/* Connected Corridors */}
                        {selectedNode.connected_corridors && selectedNode.connected_corridors.length > 0 && (
                          <div className="connected-corridors-section">
                            <span className="corridors-label">Connected Arterial Corridors:</span>
                            <div className="corridor-chips-list">
                              {selectedNode.connected_corridors.map((cName, idx) => (
                                <span key={idx} className="corridor-chip">
                                  🛣️ {cName}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="empty-inspector-state">
                        Click on any infrastructure node in the network to inspect diagnostics.
                      </div>
                    )}
                  </div>

                  {/* Reusable Emergency Safe Route Card */}
                  <EmergencyRouteCard
                    title="Emergency Safe Route"
                    subtitle="Calculated route bypassing overwhelmed drainage regulators"
                    origin={{ name: 'AIIMS Apex Trauma Center', id: 'node_1' }}
                    destination={{ name: 'Delhi Fire Service HQ Operations', id: 'node_2' }}
                    distance={2.4}
                    estimatedTime="8 mins (Synthetic Detour)"
                    status={safeRoute.length ? 'Route calculated' : 'Not calculated'}
                    routeStatusBadge={safeRoute.length ? 'ROUTE ACTIVE' : 'AWAITING RUN'}
                    waypoints={safeRoute.map((nodeId) => {
                      const nodeObj = graph?.nodes?.find((n) => n.id === nodeId);
                      return {
                        id: nodeId,
                        name: nodeObj?.name || nodeId,
                        short_name: nodeObj?.short_name || nodeId,
                      };
                    })}
                    avoidedAssets={[
                      'Kashmere Gate Sluice (node_20)',
                      'ITO Drain #12 Regulator (node_30)',
                      'Barapullah Sluice Gate (node_40)',
                      'Lajpat Nagar Storm Pump (node_50)',
                      'Wazirabad Main Drain (node_60)',
                    ]}
                    safetyExplanation="Emergency route steers through elevated transit segments bypassing inundated drainage units."
                    isModelGenerated={true}
                    onWaypointClick={(wp) => {
                      const found = graph?.nodes?.find((n) => n.id === wp.id);
                      if (found) setSelectedNode(found);
                    }}
                    activeWaypointId={selectedNode?.id}
                  />
                </div>
              </aside>
            </div>
          </>
        ) : viewMode === 'delhi_historical' ? (
          <MapView apiBaseUrl={API} />
        ) : (
          <NepalReferenceView apiBaseUrl={API} />
        )}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}