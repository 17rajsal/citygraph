import { useEffect, useState, useCallback, useRef } from 'react';
import { Routes, Route } from 'react-router-dom';
import './App.css';

import { useAuth } from './context/AuthContext.jsx';
import ProtectedRoute from './components/Auth/ProtectedRoute.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';

import DashboardHeader from './components/Dashboard/DashboardHeader.jsx';
import Sidebar from './components/Dashboard/Sidebar.jsx';
import KpiCards from './components/Dashboard/KpiCards.jsx';
import DelhiMap from './components/Dashboard/DelhiMap.jsx';
import GraphView from './components/Dashboard/GraphView.jsx';
import AssetInspector from './components/Dashboard/AssetInspector.jsx';
import RoutePlanner from './components/Dashboard/RoutePlanner.jsx';
import RiskOverviewChart from './components/Dashboard/RiskOverviewChart.jsx';
import RiskLeaderboard from './components/Dashboard/RiskLeaderboard.jsx';
import SimulationSummaryCard from './components/Dashboard/SimulationSummaryCard.jsx';
import MethodologyModal from './components/Dashboard/MethodologyModal.jsx';
import HowItWorks from './components/Dashboard/HowItWorks.jsx';

import MapView from './components/HistoricalMap/MapView.jsx';
import NepalReferenceView from './components/NepalMap/NepalReferenceView.jsx';
import { API_BASE as API } from './config.js';

function Dashboard() {
  const { user, logout, fetchWithAuth } = useAuth();

  // Active view modes: 'synthetic_delhi' | 'delhi_historical' | 'nepal_reference'
  const [viewMode, setViewMode] = useState('synthetic_delhi');
  // Visual layout toggle: 'map' | 'graph'
  const [centerViewType, setCenterViewType] = useState('map');

  // Simulation & Network state
  const [graph, setGraph] = useState(null);
  const [simulation, setSimulation] = useState(null);
  const [selectedScenario, setSelectedScenario] = useState('heavy_rain');

  // Emergency Routing state (two-way synchronized between map and route panel)
  const [routeOrigin, setRouteOrigin] = useState(null);
  const [routeDestination, setRouteDestination] = useState(null);
  const [routingMode, setRoutingMode] = useState(false);
  const [routingStep, setRoutingStep] = useState('idle');
  const [activeRoute, setActiveRoute] = useState(null);
  const [routingLoading, setRoutingLoading] = useState(false);

  // Layers & Map Styling
  const [layerFilters, setLayerFilters] = useState({
    flood_zones: true,
    road: true,
    hospital: true,
    fire_station: true,
    drainage: true,
    transformer: true,
    metro: true,
  });
  const [mapStyle, setMapStyle] = useState('streets'); // CARTO Voyager light basemap by default (Zero key required)

  // Network & UI states
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState('delhi_ncr');
  const [methodologyModalOpen, setMethodologyModalOpen] = useState(false);

  const initialRouteComputedRef = useRef(false);

  // System Health & Connection Check
  const checkConnection = useCallback(async () => {
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
  }, []);

  // Emergency Route Calculation
  const handleCalculateRoute = useCallback(
    async (originId, destId) => {
      try {
        setRoutingLoading(true);
        const response = await fetchWithAuth(`${API}/api/route`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            origin_id: originId,
            destination_id: destId,
          }),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.detail || `Routing failed with status ${response.status}`);
        }

        const routeData = await response.json();
        setActiveRoute(routeData);
        return routeData;
      } catch (err) {
        console.error('Route calculation error:', err);
        throw err;
      } finally {
        setRoutingLoading(false);
      }
    },
    [fetchWithAuth]
  );

  // Initial Graph Fetch
  const loadGraph = useCallback(async () => {
    try {
      setInitialLoading(true);
      setError('');
      setConnectionStatus('connecting');

      const response = await fetchWithAuth(`${API}/graph`);
      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}: Failed to load infrastructure network.`);
      }

      const data = await response.json();
      setGraph(data);
      setConnectionStatus('connected');

      // Auto-select initial high-priority node dynamically
      if (data.nodes && data.nodes.length > 0) {
        const highestRiskId = data.summary?.highest_risk_node;
        const initial = data.nodes.find((n) => n.id === highestRiskId) || data.nodes[0];
        setSelectedNode(initial);

        // Default Origin: AIIMS Trauma (node_1)
        const defOrigin = data.nodes.find((n) => n.id === 'node_1') || data.nodes[0];
        // Default Dest: IGI Airport T3 (node_70)
        const defDest = data.nodes.find((n) => n.id === 'node_70') || data.nodes[data.nodes.length - 1];

        setRouteOrigin(defOrigin);
        setRouteDestination(defDest);

        // Auto-calculate baseline corridor if not yet computed
        if (!initialRouteComputedRef.current && defOrigin && defDest) {
          initialRouteComputedRef.current = true;
          handleCalculateRoute(defOrigin.id, defDest.id).catch(() => {});
        }
      }
    } catch (err) {
      console.error('Error loading graph:', err);
      setError(err.message || 'Unable to connect to the simulation backend.');
      setConnectionStatus('disconnected');
    } finally {
      setInitialLoading(false);
    }
  }, [fetchWithAuth, handleCalculateRoute]);

  useEffect(() => {
    loadGraph();
    const interval = setInterval(checkConnection, 15000);
    return () => clearInterval(interval);
  }, [loadGraph, checkConnection]);

  // Run Cascading Failure Simulation (Heavy Rain 90mm/h)
  const runSimulation = async () => {
    if (loading) return;
    try {
      setLoading(true);
      setError('');

      const response = await fetchWithAuth(`${API}/simulate/heavy-rain`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rainfall_level: 90 }),
      });

      if (!response.ok) {
        throw new Error(`Simulation failed with status ${response.status}`);
      }

      const data = await response.json();
      setSimulation(data);
      setGraph(data);

      // Re-calculate route dynamically around the new 5 failed drainage nodes!
      if (routeOrigin && routeDestination) {
        handleCalculateRoute(routeOrigin.id, routeDestination.id).catch(() => {});
      }

      // Update selected node with newly calculated state
      if (selectedNode) {
        const updated = data.nodes?.find((n) => n.id === selectedNode.id);
        if (updated) setSelectedNode(updated);
      }
    } catch (err) {
      console.error('Simulation error:', err);
      setError(err.message || 'Simulation execution failed.');
    } finally {
      setLoading(false);
    }
  };

  // Reset Network to Normal Baseline
  const resetNetwork = async () => {
    if (loading) return;
    try {
      setLoading(true);
      setError('');

      const response = await fetchWithAuth(`${API}/reset`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(`Reset failed with status ${response.status}`);
      }

      const data = await response.json();
      setSimulation(null);
      setGraph(data);

      // Restore baseline route
      if (routeOrigin && routeDestination) {
        handleCalculateRoute(routeOrigin.id, routeDestination.id).catch(() => {});
      }

      // Update selected node with baseline state
      if (selectedNode) {
        const updated = data.nodes?.find((n) => n.id === selectedNode.id);
        if (updated) setSelectedNode(updated);
      }
    } catch (err) {
      console.error('Reset error:', err);
      setError(err.message || 'Network reset failed.');
    } finally {
      setLoading(false);
    }
  };

  // Direct map routing actions
  const handleToggleRoutingMode = () => {
    const next = !routingMode;
    setRoutingMode(next);
    if (next) {
      setRoutingStep(!routeOrigin ? 'select_origin' : 'select_destination');
      setCenterViewType('map');
    } else {
      setRoutingStep('idle');
    }
  };

  const handleSetOrigin = (node) => {
    setRouteOrigin(node);
    if (!routeDestination) {
      setRoutingMode(true);
      setRoutingStep('select_destination');
    }
  };

  const handleSetDestination = (node) => {
    setRouteDestination(node);
    if (!routeOrigin) {
      setRoutingMode(true);
      setRoutingStep('select_origin');
    }
  };

  const handleClearRoute = () => {
    setActiveRoute(null);
    setRoutingMode(false);
    setRoutingStep('idle');
  };

  const handleViewRouteOnMap = () => {
    setCenterViewType('map');
  };

  return (
    <div className="app-master-layout">
      {/* Left Sidebar */}
      <Sidebar
        viewMode={viewMode}
        setViewMode={setViewMode}
        onRunSimulation={runSimulation}
        onResetNetwork={resetNetwork}
        loading={loading}
        selectedScenario={selectedScenario}
        setSelectedScenario={setSelectedScenario}
        layerFilters={layerFilters}
        setLayerFilters={setLayerFilters}
        mapStyle={mapStyle}
        setMapStyle={setMapStyle}
      />

      {/* Main Workspace Area */}
      <main className="app-main-workspace" role="main">
        {/* Smart-City Intelligence Header */}
        <DashboardHeader
          connectionStatus={connectionStatus}
          onRetryConnection={checkConnection}
          onSearchSelect={setSelectedNode}
          nodes={graph?.nodes || []}
          user={user}
          onLogout={logout}
          selectedLocation={selectedLocation}
          setSelectedLocation={setSelectedLocation}
        />

        <div className="workspace-body">
          {error && (
            <div className="app-error-banner" role="alert">
              <span className="error-icon">⚠️</span>
              <span className="error-msg">{error}</span>
              <button type="button" className="btn-dismiss-err" onClick={() => setError('')}>✕</button>
            </div>
          )}

          {initialLoading ? (
            <div className="initial-loading-state">
              <div className="loading-spinner-core" />
              <h3>Initializing CityGraph Infrastructure Intelligence...</h3>
              <p>Connecting to simulation backend at {API}</p>
            </div>
          ) : (
            <>
              {/* Mode 1: Synthetic Delhi Network (Reference UI) */}
              {viewMode === 'synthetic_delhi' && (
                <div className="dashboard-content-area">
                  {/* Top KPI Cards Row */}
                  <KpiCards
                    graph={graph}
                    _simulation={simulation}
                    onSelectNode={setSelectedNode}
                  />

                  {/* Center Visual & Right Panels Split */}
                  <div className="center-workspace-grid">
                    <div className="center-main-visual">
                      {centerViewType === 'map' ? (
                        <DelhiMap
                          nodes={graph?.nodes || []}
                          edges={graph?.edges || []}
                          selectedNode={selectedNode}
                          onSelectNode={setSelectedNode}
                          mapStyle={mapStyle}
                          layerFilters={layerFilters}
                          activeRoute={activeRoute}
                          centerViewType={centerViewType}
                          onToggleView={setCenterViewType}
                          routingMode={routingMode}
                          routingStep={routingStep}
                          routeOrigin={routeOrigin}
                          routeDestination={routeDestination}
                          onSetOrigin={handleSetOrigin}
                          onSetDestination={handleSetDestination}
                          onCalculateRoute={handleCalculateRoute}
                          onClearRoute={handleClearRoute}
                          simulation={simulation}
                        />
                      ) : (
                        <GraphView
                          graph={graph}
                          selectedNode={selectedNode}
                          onSelectNode={setSelectedNode}
                          centerViewType={centerViewType}
                          onToggleView={setCenterViewType}
                        />
                      )}
                    </div>

                    <div className="center-side-panels">
                      <AssetInspector
                        selectedNode={selectedNode}
                        routeOrigin={routeOrigin}
                        routeDestination={routeDestination}
                        onSetOrigin={handleSetOrigin}
                        onSetDestination={handleSetDestination}
                        onCalculateRoute={handleCalculateRoute}
                      />
                      <RoutePlanner
                        nodes={graph?.nodes || []}
                        activeRoute={activeRoute}
                        routeOrigin={routeOrigin}
                        routeDestination={routeDestination}
                        routingMode={routingMode}
                        onToggleRoutingMode={handleToggleRoutingMode}
                        onSelectOrigin={handleSetOrigin}
                        onSelectDestination={handleSetDestination}
                        onCalculateRoute={handleCalculateRoute}
                        onClearRoute={handleClearRoute}
                        onViewRouteOnMap={handleViewRouteOnMap}
                        loading={routingLoading}
                      />
                    </div>
                  </div>

                  {/* Bottom Analytics Grid (Clean 3-Column Aligned Layout) */}
                  <div className="bottom-analytics-grid">
                    <RiskOverviewChart
                      graph={graph}
                      simulation={simulation}
                    />

                    <RiskLeaderboard
                      nodes={graph?.nodes || []}
                      selectedNode={selectedNode}
                      onSelectNode={setSelectedNode}
                    />

                    <SimulationSummaryCard
                      graph={graph}
                      simulation={simulation}
                      onReset={resetNetwork}
                      loading={loading}
                    />
                  </div>

                  {/* Architecture & Engine Explanation Guide */}
                  <HowItWorks />

                  {/* Footer Ribbon with Educational White Paper Links */}
                  <footer className="dashboard-footer-ribbon">
                    <div className="footer-left-info">
                      <span className="disclaimer-badge">SIMULATED REFERENCE MODEL</span>
                      <span className="disclaimer-text">
                        Illustrative municipal telemetry • Not an official live dispatch feed.
                      </span>
                    </div>

                    <div className="footer-links">
                      <button
                        type="button"
                        className="footer-link-btn"
                        onClick={() => setMethodologyModalOpen(true)}
                      >
                        How CityGraph Works
                      </button>
                      <span className="link-divider">•</span>
                      <button
                        type="button"
                        className="footer-link-btn"
                        onClick={() => setMethodologyModalOpen(true)}
                      >
                        Simulation Methodology
                      </button>
                      <span className="link-divider">•</span>
                      <button
                        type="button"
                        className="footer-link-btn"
                        onClick={() => setMethodologyModalOpen(true)}
                      >
                        White Paper & Roadmap
                      </button>
                    </div>
                  </footer>
                </div>
              )}

              {/* Mode 2: Delhi Historical Replay (Preserved) */}
              {viewMode === 'delhi_historical' && (
                <div className="historical-mode-wrapper">
                  <MapView apiBaseUrl={API} />
                </div>
              )}

              {/* Mode 3: Nepal Flash-Flood Reference Scenario (Preserved) */}
              {viewMode === 'nepal_reference' && (
                <div className="nepal-mode-wrapper">
                  <NepalReferenceView apiBaseUrl={API} />
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Educational & Methodology Modal */}
      <MethodologyModal
        isOpen={methodologyModalOpen}
        onClose={() => setMethodologyModalOpen(false)}
      />
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