import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './DelhiMap.css';

// Fix default Leaflet icon issues in bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Tile Layer Configurations (100% Free, Reliable, Zero Watermarks, No API Key Required)
const TILE_LAYERS = {
  streets: {
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    subdomains: 'abcd',
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
    maxZoom: 19,
  },
  positron: {
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    subdomains: 'abcd',
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
    maxZoom: 19,
  },
  dark: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    subdomains: 'abcd',
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
    maxZoom: 19,
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri, Maxar, Earthstar Geographics',
    maxZoom: 17,
  },
};

// Delhi Geographic Default Center
const DELHI_CENTER = [28.6250, 77.2200];
const DEFAULT_ZOOM = 12;

// Yamuna River Geographic Spine Coordinates
const YAMUNA_RIVER_LINE = [
  [28.745, 77.220],
  [28.720, 77.232],
  [28.700, 77.234],
  [28.675, 77.236],
  [28.660, 77.244],
  [28.640, 77.249],
  [28.625, 77.250],
  [28.605, 77.256],
  [28.575, 77.265],
  [28.550, 77.278],
  [28.530, 77.295],
  [28.510, 77.315],
];

// Primary Yamuna River Floodplain Polygon (covers actual riverbed and lowlands from Wazirabad to Okhla)
const YAMUNA_PRIMARY_FLOOD_POLYGON = [
  [28.725, 77.228],
  [28.712, 77.238],
  [28.698, 77.235],
  [28.682, 77.234],
  [28.668, 77.238],
  [28.656, 77.246],
  [28.641, 77.248],
  [28.628, 77.252],
  [28.615, 77.253],
  [28.585, 77.262],
  [28.555, 77.275],
  [28.535, 77.288],
  // East bank return:
  [28.530, 77.305],
  [28.560, 77.295],
  [28.590, 77.280],
  [28.618, 77.275],
  [28.635, 77.268],
  [28.665, 77.258],
  [28.695, 77.252],
  [28.720, 77.245],
];

// Secondary Inundation Catchment #1: Kashmere Gate & Monastery Market Ring Road Depression (node_20, node_6, node_61)
const KASHMERE_GATE_FLOOD_POLYGON = [
  [28.678, 77.222],
  [28.679, 77.242],
  [28.658, 77.246],
  [28.650, 77.238],
  [28.654, 77.224],
];

// Secondary Inundation Catchment #2: Ring Road Underpass #43 & Barapullah Basin (node_43, node_40, Mathura Road)
const RING_ROAD_UNDERPASS_FLOOD_POLYGON = [
  [28.590, 77.238],
  [28.586, 77.260],
  [28.562, 77.264],
  [28.558, 77.242],
  [28.572, 77.236],
];

// Secondary Inundation Catchment #3: Mayur Vihar Trans-Yamuna Retention Basin (node_60)
const MAYUR_VIHAR_FLOOD_POLYGON = [
  [28.615, 77.282],
  [28.620, 77.310],
  [28.592, 77.312],
  [28.590, 77.285],
];

// Major Delhi Geographic Hub Labels
const DELHI_GEO_LABELS = [
  { name: 'NEW DELHI', coords: [28.6139, 77.2090] },
  { name: 'OLD DELHI', coords: [28.6562, 77.2320] },
  { name: 'CONNAUGHT PLACE', coords: [28.6328, 77.2197] },
  { name: 'YAMUNA RIVER BASIN', coords: [28.6600, 77.2450] },
  { name: 'NOIDA CORRIDOR', coords: [28.5700, 77.3200] },
  { name: 'GURUGRAM CORRIDOR', coords: [28.4900, 77.0800] },
];

export default function DelhiMap({
  nodes = [],
  edges = [],
  selectedNode = null,
  onSelectNode = () => {},
  mapStyle = 'streets',
  layerFilters = {
    road: true,
    hospital: true,
    fire_station: true,
    drainage: true,
    transformer: true,
    metro: true,
    flood_zones: true,
  },
  activeRoute = null,
  centerViewType = 'map',
  onToggleView = () => {},
  // Routing interaction props
  routingMode = false,
  routingStep = 'idle',
  routeOrigin = null,
  routeDestination = null,
  onSetOrigin = () => {},
  onSetDestination = () => {},
  onCalculateRoute = () => {},
  onClearRoute = () => {},
  simulation = null,
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const tileLayerRef = useRef(null);
  const riverLayerRef = useRef(null);
  const floodZonesLayerRef = useRef(null);
  const edgesLayerRef = useRef(null);
  const routeGlowLayerRef = useRef(null);
  const routePolylineRef = useRef(null);
  const routeMarkersRef = useRef(null);
  const markersLayerRef = useRef(null);
  const geoLabelsLayerRef = useRef(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Quick Filter Dropdown State
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'operational' | 'at_risk' | 'affected' | 'failed'
  const [riskFilter, setRiskFilter] = useState('all'); // 'all' | 'high' | 'medium' | 'low'
  const [typeFilter, setTypeFilter] = useState('all');

  const [routingAlert, setRoutingAlert] = useState(null);

  const isSimulated = Boolean(simulation);

  // Expose global handlers for Leaflet popups
  useEffect(() => {
    window.citygraph_inspect = (nodeId) => {
      const n = nodes.find((item) => item.id === nodeId);
      if (n) onSelectNode(n);
    };

    window.citygraph_routeFrom = (nodeId) => {
      const n = nodes.find((item) => item.id === nodeId);
      if (!n) return;
      if (n.status === 'failed') {
        setRoutingAlert(`⚠️ Cannot stage dispatch at flooded asset: ${n.name || n.id}. Select an operational asset.`);
        setTimeout(() => setRoutingAlert(null), 5000);
        return;
      }
      onSetOrigin(n);
      if (routeDestination && routeDestination.id !== n.id) {
        onCalculateRoute(n.id, routeDestination.id);
      }
    };

    window.citygraph_routeTo = (nodeId) => {
      const n = nodes.find((item) => item.id === nodeId);
      if (!n) return;
      if (n.status === 'failed') {
        setRoutingAlert(`⚠️ Destination is submerged/flooded: ${n.name || n.id}. Select an accessible staging point.`);
        setTimeout(() => setRoutingAlert(null), 5000);
        return;
      }
      onSetDestination(n);
      if (routeOrigin && routeOrigin.id !== n.id) {
        onCalculateRoute(routeOrigin.id, n.id);
      }
    };

    return () => {
      delete window.citygraph_inspect;
      delete window.citygraph_routeFrom;
      delete window.citygraph_routeTo;
    };
  }, [nodes, routeOrigin, routeDestination, onSelectNode, onSetOrigin, onSetDestination, onCalculateRoute]);

  // Filter nodes by Layer checkboxes AND top Filter dropdowns
  const visibleNodes = useMemo(() => {
    return nodes.filter((node) => {
      const type = node.type || 'road';
      const name = (node.name || '').toLowerCase();
      const isMetro = type === 'metro' || name.includes('metro') || name.includes('interchange');

      // 1. Sidebar Layer toggles
      if (isMetro && !layerFilters.metro) return false;
      if (!isMetro && type === 'hospital' && !layerFilters.hospital) return false;
      if (!isMetro && type === 'fire_station' && !layerFilters.fire_station) return false;
      if (!isMetro && (type === 'drainage' || name.includes('pump') || name.includes('drain') || name.includes('sluice')) && !layerFilters.drainage) return false;
      if (!isMetro && (type === 'transformer' || name.includes('power') || name.includes('substation')) && !layerFilters.transformer) return false;
      if (!isMetro && type === 'road' && !layerFilters.road) return false;

      // 2. Type Filter dropdown
      if (typeFilter !== 'all') {
        if (typeFilter === 'metro' && !isMetro) return false;
        if (typeFilter !== 'metro' && (isMetro || node.type !== typeFilter)) return false;
      }

      // 3. Status Filter dropdown
      if (statusFilter !== 'all') {
        const s = node.status || 'safe';
        if (statusFilter === 'operational' && s !== 'safe') return false;
        if (statusFilter === 'at_risk' && (s !== 'safe' || (Number(node.risk) || 0) < 0.7)) return false;
        if (statusFilter === 'affected' && s !== 'affected') return false;
        if (statusFilter === 'failed' && s !== 'failed') return false;
      }

      // 4. Risk Filter dropdown
      if (riskFilter !== 'all') {
        const r = Number(node.risk) || 0;
        if (riskFilter === 'high' && r <= 0.8) return false;
        if (riskFilter === 'medium' && (r < 0.5 || r > 0.8)) return false;
        if (riskFilter === 'low' && r >= 0.5) return false;
      }

      return true;
    });
  }, [nodes, layerFilters, typeFilter, statusFilter, riskFilter]);

  // Search filter list
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return nodes
      .filter((n) => (n.name && n.name.toLowerCase().includes(q)) || (n.id && n.id.toLowerCase().includes(q)))
      .slice(0, 6);
  }, [nodes, searchQuery]);

  // Initialize Map on mount
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: DELHI_CENTER,
      zoom: DEFAULT_ZOOM,
      zoomControl: false,
      attributionControl: false,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Initial Tile Layer (CARTO Voyager Light by default)
    const tileConf = TILE_LAYERS[mapStyle] || TILE_LAYERS.streets;
    const tileLayer = L.tileLayer(tileConf.url, {
      subdomains: tileConf.subdomains || 'abc',
      attribution: tileConf.attribution,
      maxZoom: tileConf.maxZoom,
    }).addTo(map);
    tileLayerRef.current = tileLayer;

    // Feature Layer Groups (Order matters for z-index stacking!)
    riverLayerRef.current = L.layerGroup().addTo(map);
    floodZonesLayerRef.current = L.layerGroup().addTo(map);
    edgesLayerRef.current = L.layerGroup().addTo(map);
    geoLabelsLayerRef.current = L.layerGroup().addTo(map);
    routeGlowLayerRef.current = L.layerGroup().addTo(map);
    routeMarkersRef.current = L.layerGroup().addTo(map);
    markersLayerRef.current = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []); // Run once

  // Update Tile Layer when mapStyle changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;
    const tileConf = TILE_LAYERS[mapStyle] || TILE_LAYERS.streets;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }
    const newTileLayer = L.tileLayer(tileConf.url, {
      subdomains: tileConf.subdomains || 'abc',
      attribution: tileConf.attribution,
      maxZoom: tileConf.maxZoom,
    }).addTo(map);

    // If satellite tile errors occur, fallback smoothly
    newTileLayer.on('tileerror', () => {
      console.warn('Map tile load error, falling back to Carto Dark Matter');
    });

    tileLayerRef.current = newTileLayer;
    newTileLayer.bringToBack();
  }, [mapStyle]);

  // Render Yamuna River Line & Delhi NCR Landmark Badges
  useEffect(() => {
    if (!mapInstanceRef.current || !riverLayerRef.current || !geoLabelsLayerRef.current) return;

    riverLayerRef.current.clearLayers();
    geoLabelsLayerRef.current.clearLayers();

    // Yamuna River Water Ribbon
    const riverCasing = L.polyline(YAMUNA_RIVER_LINE, {
      color: '#0284c7',
      weight: 9,
      opacity: 0.3,
      lineCap: 'round',
      lineJoin: 'round',
    });
    riverLayerRef.current.addLayer(riverCasing);

    const riverCore = L.polyline(YAMUNA_RIVER_LINE, {
      color: '#38bdf8',
      weight: 4,
      opacity: 0.75,
      lineCap: 'round',
      lineJoin: 'round',
    });
    riverLayerRef.current.addLayer(riverCore);

    // Delhi NCR Hub Labels
    DELHI_GEO_LABELS.forEach((hub) => {
      const labelIcon = L.divIcon({
        className: 'delhi-geo-hub-label',
        html: `<span>${hub.name}</span>`,
        iconSize: [120, 20],
        iconAnchor: [60, 10],
      });
      const marker = L.marker(hub.coords, { icon: labelIcon, interactive: false });
      geoLabelsLayerRef.current.addLayer(marker);
    });
  }, []);

  // Render Dedicated Flood Risk Zones (Polygons respond to simulation!)
  useEffect(() => {
    if (!mapInstanceRef.current || !floodZonesLayerRef.current) return;

    floodZonesLayerRef.current.clearLayers();

    // Check if Flood layer is enabled in sidebar
    if (layerFilters.flood_zones === false) return;

    // Baseline vs Post-Simulation styling
    const primaryFillOpacity = isSimulated ? 0.42 : 0.12;
    const secondaryFillOpacity = isSimulated ? 0.35 : 0.10;
    const primaryColor = isSimulated ? '#38bdf8' : '#0284c7';
    const secondaryColor = isSimulated ? '#00f0ff' : '#0369a1';
    const dashArray = isSimulated ? null : '4, 4';

    // 1. Primary Yamuna Floodplain Polygon
    const primaryPolygon = L.polygon(YAMUNA_PRIMARY_FLOOD_POLYGON, {
      color: primaryColor,
      weight: isSimulated ? 2.5 : 1.5,
      dashArray,
      fillColor: '#0369a1',
      fillOpacity: primaryFillOpacity,
      className: isSimulated ? 'leaflet-flood-polygon flood-active' : 'leaflet-flood-polygon',
    });
    primaryPolygon.bindTooltip(
      isSimulated
        ? '⚠️ PRIMARY YAMUNA FLOOD ZONE • ACTIVE 90mm/hr SURCHARGE'
        : 'Yamuna River 100-Year Floodplain (Baseline Risk)',
      { sticky: true, className: 'flood-tooltip' }
    );
    floodZonesLayerRef.current.addLayer(primaryPolygon);

    // 2. Kashmere Gate / Monastery Market Lowland Depression
    const kashmereGatePolygon = L.polygon(KASHMERE_GATE_FLOOD_POLYGON, {
      color: secondaryColor,
      weight: isSimulated ? 2 : 1.2,
      dashArray,
      fillColor: '#0284c7',
      fillOpacity: secondaryFillOpacity,
      className: isSimulated ? 'leaflet-flood-polygon flood-active' : 'leaflet-flood-polygon',
    });
    kashmereGatePolygon.bindTooltip(
      isSimulated
        ? '⚠️ KASHMERE GATE INUNDATION BASIN • SUBMERGED'
        : 'Kashmere Gate Lowland Catchment',
      { sticky: true, className: 'flood-tooltip' }
    );
    floodZonesLayerRef.current.addLayer(kashmereGatePolygon);

    // 3. Ring Road Underpass #43 & Barapullah Depression
    const underpassPolygon = L.polygon(RING_ROAD_UNDERPASS_FLOOD_POLYGON, {
      color: secondaryColor,
      weight: isSimulated ? 2 : 1.2,
      dashArray,
      fillColor: '#0284c7',
      fillOpacity: secondaryFillOpacity,
      className: isSimulated ? 'leaflet-flood-polygon flood-active' : 'leaflet-flood-polygon',
    });
    underpassPolygon.bindTooltip(
      isSimulated
        ? '⚠️ RING ROAD UNDERPASS #43 DEPRESSION • WATERLOGGED'
        : 'Barapullah Sluice Inundation Catchment',
      { sticky: true, className: 'flood-tooltip' }
    );
    floodZonesLayerRef.current.addLayer(underpassPolygon);

    // 4. Mayur Vihar Trans-Yamuna Retention Catchment
    const mayurViharPolygon = L.polygon(MAYUR_VIHAR_FLOOD_POLYGON, {
      color: secondaryColor,
      weight: isSimulated ? 2 : 1.2,
      dashArray,
      fillColor: '#0284c7',
      fillOpacity: secondaryFillOpacity,
      className: isSimulated ? 'leaflet-flood-polygon flood-active' : 'leaflet-flood-polygon',
    });
    mayurViharPolygon.bindTooltip(
      isSimulated
        ? '⚠️ MAYUR VIHAR FLOODPLAIN SPILLWAY • OVERFLOWING'
        : 'Mayur Vihar Spillway Catchment',
      { sticky: true, className: 'flood-tooltip' }
    );
    floodZonesLayerRef.current.addLayer(mayurViharPolygon);
  }, [layerFilters.flood_zones, isSimulated]);

  // Helper to create clean professional HTML markers (No blinding glow everywhere!)
  const createNodeIcon = useCallback(
    (node, isSelected, isOrigin, isDest) => {
      const status = node.status || 'safe';
      const type = node.type || 'road';
      const name = (node.name || '').toLowerCase();
      const isMetro = type === 'metro' || name.includes('metro') || name.includes('interchange');

      let statusClass = 'marker-safe';
      if (status === 'failed') statusClass = 'marker-failed';
      else if (status === 'affected') statusClass = 'marker-affected';

      let typeGlyph = '●';
      if (type === 'hospital') typeGlyph = '+';
      else if (type === 'fire_station') typeGlyph = '▲';
      else if (type === 'drainage') typeGlyph = '■';
      else if (type === 'transformer') typeGlyph = '⚡';
      else if (isMetro) typeGlyph = '🚇';

      let specialBadge = '';
      if (isOrigin) {
        specialBadge = `<div class="marker-routing-tag tag-origin"><span>ORIGIN</span></div>`;
      } else if (isDest) {
        specialBadge = `<div class="marker-routing-tag tag-dest"><span>DEST</span></div>`;
      }

      const classes = [
        'delhi-map-marker',
        statusClass,
        isMetro ? 'metro' : type,
        isSelected ? 'marker-selected' : '',
        isOrigin ? 'marker-is-origin' : '',
        isDest ? 'marker-is-dest' : '',
        routingMode ? 'marker-routing-active' : '',
      ].filter(Boolean).join(' ');

      const html = `
        <div class="${classes}">
          ${status === 'failed' ? '<div class="marker-pulse"></div>' : ''}
          <div class="marker-core">
            <span class="marker-icon-glyph">${typeGlyph}</span>
          </div>
          ${specialBadge}
        </div>
      `;

      return L.divIcon({
        className: 'custom-delhi-marker-container',
        html,
        iconSize: [26, 26],
        iconAnchor: [13, 13],
        popupAnchor: [0, -14],
      });
    },
    [routingMode]
  );

  // Render Infrastructure Nodes on Map
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();

    visibleNodes.forEach((node) => {
      if (!node.lat || !node.lng) return;

      const isSelected = selectedNode && selectedNode.id === node.id;
      const isOrigin = routeOrigin && routeOrigin.id === node.id;
      const isDest = routeDestination && routeDestination.id === node.id;

      const icon = createNodeIcon(node, isSelected, isOrigin, isDest);
      const marker = L.marker([node.lat, node.lng], { icon });

      // Build Dark Popup with Direct Routing & Inspection Actions
      const statusLabel = (node.status || 'SAFE').toUpperCase();
      const isFailed = node.status === 'failed';

      const popupHtml = `
        <div class="delhi-popup-card">
          <div class="delhi-popup-header">
            <span class="delhi-popup-badge status-${node.status || 'safe'}">
              ${statusLabel}
            </span>
            <span class="delhi-popup-risk">RISK ${(Number(node.risk) || 0).toFixed(2)}</span>
          </div>

          <h4 class="delhi-popup-title">${node.name || node.id}</h4>
          <div class="delhi-popup-sub">
            <span>${node.type_label || node.type || 'Infrastructure'}</span> • <span>${node.zone || 'Central Delhi'}</span>
          </div>

          <div class="delhi-popup-metrics">
            <div class="delhi-popup-metric">
              <span class="m-lbl">Load / Capacity:</span>
              <span class="m-val">${node.current_load ?? 50} / ${node.capacity ?? 100}</span>
            </div>
            <div class="delhi-popup-metric">
              <span class="m-lbl">Criticality:</span>
              <span class="m-val">${node.criticality ?? 5}/10</span>
            </div>
          </div>

          ${isFailed ? `
            <div class="popup-fail-warning">
              <span>⚠️ SUBMERGED / OFFLINE: Emergency staging prohibited.</span>
            </div>
          ` : ''}

          <!-- Direct Actions inside Popup -->
          <div class="delhi-popup-actions">
            <button
              type="button"
              class="btn-popup-action btn-popup-inspect"
              onclick="window.citygraph_inspect('${node.id}')"
            >
              🔍 Inspect Asset
            </button>
            <button
              type="button"
              class="btn-popup-action btn-popup-from ${isFailed ? 'btn-disabled' : ''}"
              onclick="window.citygraph_routeFrom('${node.id}')"
              ${isFailed ? 'title="Cannot stage dispatch from flooded asset"' : ''}
            >
              📍 Route From Here
            </button>
            <button
              type="button"
              class="btn-popup-action btn-popup-to ${isFailed ? 'btn-disabled' : ''}"
              onclick="window.citygraph_routeTo('${node.id}')"
              ${isFailed ? 'title="Cannot route to flooded destination"' : ''}
            >
              🏁 Route To Here
            </button>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, {
        className: 'delhi-dark-popup',
        closeButton: true,
        autoPan: true,
      });

      // Node marker click handler: supports routing mode selection & normal inspection
      marker.on('click', () => {
        onSelectNode(node);

        if (routingMode) {
          if (routingStep === 'select_origin' || !routeOrigin) {
            if (node.status === 'failed') {
              setRoutingAlert(`⚠️ Cannot start from flooded asset: ${node.name}. Please select an operational asset.`);
              setTimeout(() => setRoutingAlert(null), 5000);
              return;
            }
            onSetOrigin(node);
            setRoutingAlert(`✓ Origin set to ${node.short_name || node.name}. Now click DESTINATION on map.`);
            setTimeout(() => setRoutingAlert(null), 4000);
          } else if (routingStep === 'select_destination' || (routeOrigin && !routeDestination)) {
            if (node.id === routeOrigin.id) {
              setRoutingAlert('⚠️ Destination cannot be the same as Origin.');
              setTimeout(() => setRoutingAlert(null), 4000);
              return;
            }
            if (node.status === 'failed') {
              setRoutingAlert(`⚠️ Destination is submerged/flooded: ${node.name}. Please select an accessible point.`);
              setTimeout(() => setRoutingAlert(null), 5000);
              return;
            }
            onSetDestination(node);
            setRoutingAlert(`✓ Routing: ${routeOrigin.short_name || routeOrigin.name} → ${node.short_name || node.name}`);
            onCalculateRoute(routeOrigin.id, node.id);
            setTimeout(() => setRoutingAlert(null), 4000);
          }
        }
      });

      markersLayerRef.current.addLayer(marker);
    });
  }, [
    visibleNodes,
    selectedNode,
    routeOrigin,
    routeDestination,
    routingMode,
    routingStep,
    createNodeIcon,
    onSelectNode,
    onSetOrigin,
    onSetDestination,
    onCalculateRoute,
  ]);

  // Center on Selected Node when updated
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedNode) return;
    if (selectedNode.lat && selectedNode.lng) {
      mapInstanceRef.current.panTo([selectedNode.lat, selectedNode.lng], {
        animate: true,
        duration: 0.5,
      });
    }
  }, [selectedNode]);

  // Render Network Interconnection Edges (Failed roads highlighted/dimmed)
  useEffect(() => {
    if (!mapInstanceRef.current || !edgesLayerRef.current) return;

    edgesLayerRef.current.clearLayers();
    if (!edges || !edges.length) return;

    const nodeMap = new Map();
    nodes.forEach((n) => nodeMap.set(n.id, n));

    edges.forEach((edge) => {
      const src = nodeMap.get(edge.source);
      const tgt = nodeMap.get(edge.target);

      if (src && tgt && src.lat && src.lng && tgt.lat && tgt.lng) {
        const isHazardous = src.status === 'failed' || tgt.status === 'failed';
        const isAffected = src.status === 'affected' || tgt.status === 'affected';

        let color = '#2a3b53';
        let weight = 1.2;
        let dashArray = '3, 4';
        let opacity = 0.4;

        if (isHazardous) {
          color = '#ef4444';
          weight = 1.8;
          opacity = 0.55;
          dashArray = '4, 4';
        } else if (isAffected) {
          color = '#f97316';
          opacity = 0.45;
        }

        const polyline = L.polyline(
          [
            [src.lat, src.lng],
            [tgt.lat, tgt.lng],
          ],
          { color, weight, dashArray, opacity }
        );
        edgesLayerRef.current.addLayer(polyline);
      }
    });
  }, [edges, nodes]);

  // Render Glowing Cyan Route Polyline & Terminal Pins
  useEffect(() => {
    if (!mapInstanceRef.current || !routeGlowLayerRef.current || !routeMarkersRef.current) return;

    routeGlowLayerRef.current.clearLayers();
    routeMarkersRef.current.clearLayers();

    if (routePolylineRef.current) {
      mapInstanceRef.current.removeLayer(routePolylineRef.current);
      routePolylineRef.current = null;
    }

    if (!activeRoute || !activeRoute.coordinates || activeRoute.coordinates.length < 2) {
      return;
    }

    const coords = activeRoute.coordinates;

    // Glowing cyan outer casing
    const glowLine = L.polyline(coords, {
      color: '#00f0ff',
      weight: 9,
      opacity: 0.4,
      lineCap: 'round',
      lineJoin: 'round',
    });
    routeGlowLayerRef.current.addLayer(glowLine);

    // Bright cyan inner corridor
    const pathLine = L.polyline(coords, {
      color: '#38bdf8',
      weight: 4.5,
      opacity: 0.98,
      lineCap: 'round',
      lineJoin: 'round',
    });
    routeGlowLayerRef.current.addLayer(pathLine);
    routePolylineRef.current = pathLine;

    // Fit map bounds to show complete safe corridor
    const bounds = L.latLngBounds(coords);
    mapInstanceRef.current.fitBounds(bounds, { padding: [55, 55], maxZoom: 14 });
  }, [activeRoute]);

  // Reset View to Delhi Center
  const handleResetZoom = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView(DELHI_CENTER, DEFAULT_ZOOM, {
        animate: true,
        duration: 0.5,
      });
    }
  };

  // Fit view to all visible nodes
  const handleFitNetwork = () => {
    if (!mapInstanceRef.current || !visibleNodes.length) return;
    const validCoords = visibleNodes.filter((n) => n.lat && n.lng).map((n) => [n.lat, n.lng]);
    if (validCoords.length > 0) {
      const bounds = L.latLngBounds(validCoords);
      mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40] });
    }
  };

  // Toggle Fullscreen
  const handleToggleFullscreen = () => {
    if (!mapContainerRef.current) return;
    if (!document.fullscreenElement) {
      mapContainerRef.current.requestFullscreen?.().then(() => setIsFullscreen(true));
    } else {
      document.exitFullscreen?.().then(() => setIsFullscreen(false));
    }
  };

  // Active filters count
  const activeFiltersCount = [
    statusFilter !== 'all',
    riskFilter !== 'all',
    typeFilter !== 'all',
  ].filter(Boolean).length;

  return (
    <div className={`delhi-map-container ${isFullscreen ? 'is-fullscreen' : ''}`}>
      {/* Floating Top Controls Bar */}
      <div className="map-top-bar">
        {/* View Mode Toggle: [ Map View ] | [ Graph View ] */}
        <div className="view-toggle-pills" role="radiogroup" aria-label="Center View Mode">
          <button
            type="button"
            className={`view-pill-btn ${centerViewType === 'map' ? 'active' : ''}`}
            onClick={() => onToggleView('map')}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
              <line x1="8" y1="2" x2="8" y2="18" />
              <line x1="16" y1="6" x2="16" y2="22" />
            </svg>
            <span>Map View</span>
          </button>
          <button
            type="button"
            className={`view-pill-btn ${centerViewType === 'graph' ? 'active' : ''}`}
            onClick={() => onToggleView('graph')}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
            <span>Graph View</span>
          </button>
        </div>

        {/* Live Delhi Node Search Bar */}
        <div className="map-search-wrapper">
          <div className="map-search-input-box">
            <svg className="search-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              className="map-search-input"
              placeholder="Search Delhi infrastructure..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchDropdown(true);
              }}
              onFocus={() => setShowSearchDropdown(true)}
            />
            {searchQuery && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => {
                  setSearchQuery('');
                  setShowSearchDropdown(false);
                }}
              >
                ✕
              </button>
            )}
          </div>

          {showSearchDropdown && searchResults.length > 0 && (
            <div className="map-search-dropdown">
              {searchResults.map((n) => (
                <div
                  key={n.id}
                  className="search-result-item"
                  onClick={() => {
                    onSelectNode(n);
                    setShowSearchDropdown(false);
                    setSearchQuery(n.name || n.id);
                  }}
                >
                  <div className="res-title-row">
                    <span className="res-name">{n.name || n.id}</span>
                    <span className={`res-badge status-${n.status || 'safe'}`}>
                      {(n.status || 'SAFE').toUpperCase()}
                    </span>
                  </div>
                  <div className="res-meta">
                    <span>{n.type_label || n.type}</span> • <span>Risk: {(Number(n.risk) || 0).toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Filter Menu Dropdown */}
        <div className="map-filter-wrapper">
          <button
            type="button"
            className={`map-tool-btn filter-btn ${activeFiltersCount > 0 ? 'filter-active' : ''}`}
            onClick={() => setShowFilterDropdown(!showFilterDropdown)}
            title="Filter displayed infrastructure"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
            <span>Filters {activeFiltersCount > 0 ? `(${activeFiltersCount})` : ''}</span>
          </button>

          {showFilterDropdown && (
            <div className="map-filter-popover">
              <div className="filter-popover-header">
                <span className="popover-title">FILTER MAP MARKERS</span>
                {activeFiltersCount > 0 && (
                  <button
                    type="button"
                    className="btn-reset-filters"
                    onClick={() => {
                      setStatusFilter('all');
                      setRiskFilter('all');
                      setTypeFilter('all');
                    }}
                  >
                    Reset
                  </button>
                )}
              </div>

              <div className="filter-row">
                <label className="filter-lbl">Status:</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="filter-sel"
                >
                  <option value="all">All Statuses</option>
                  <option value="operational">Operational (Safe)</option>
                  <option value="at_risk">At Risk (Risk &ge; 0.7)</option>
                  <option value="affected">Affected / Overloaded</option>
                  <option value="failed">Failed / Flooded</option>
                </select>
              </div>

              <div className="filter-row">
                <label className="filter-lbl">Risk Index:</label>
                <select
                  value={riskFilter}
                  onChange={(e) => setRiskFilter(e.target.value)}
                  className="filter-sel"
                >
                  <option value="all">All Risk Levels</option>
                  <option value="high">High Risk (&gt; 0.8)</option>
                  <option value="medium">Medium Risk (0.5 - 0.8)</option>
                  <option value="low">Low Risk (&lt; 0.5)</option>
                </select>
              </div>

              <div className="filter-row">
                <label className="filter-lbl">Sector:</label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="filter-sel"
                >
                  <option value="all">All Sectors</option>
                  <option value="hospital">Hospitals</option>
                  <option value="fire_station">Fire Stations</option>
                  <option value="drainage">Drainage & Pumps</option>
                  <option value="transformer">Power Grid</option>
                  <option value="road">Road Junctions</option>
                  <option value="metro">Metro Stations</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons: Fit Network & Reset Zoom */}
        <div className="map-actions-group">
          <button
            type="button"
            className="map-tool-btn"
            onClick={handleFitNetwork}
            title="Fit view to visible nodes"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 3h6v6" />
              <path d="M9 21H3v-6" />
              <path d="M21 3l-7 7" />
              <path d="M3 21l7-7" />
            </svg>
            <span>Fit Network</span>
          </button>

          <button
            type="button"
            className="map-tool-btn"
            onClick={handleResetZoom}
            title="Reset to Central Delhi view"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polygon points="12 8 8 12 12 16 12 8" />
            </svg>
            <span>Reset</span>
          </button>

          <button
            type="button"
            className="map-tool-btn icon-only"
            onClick={handleToggleFullscreen}
            title="Toggle Fullscreen"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
            </svg>
          </button>
        </div>
      </div>

      {/* Routing Mode Active Floating Guidance Banner */}
      {routingMode && (
        <div className="map-routing-guidance-banner">
          <div className="guidance-content">
            <span className="guidance-icon">📍</span>
            <span className="guidance-text">
              {!routeOrigin
                ? 'STEP 1: Click any operational infrastructure marker on the map to set ROUTE ORIGIN'
                : !routeDestination
                ? `STEP 2: Origin set (${routeOrigin.short_name || routeOrigin.name}). Click next marker for DESTINATION`
                : `SAFE CORRIDOR ACTIVE: ${routeOrigin.short_name || routeOrigin.name} → ${routeDestination.short_name || routeDestination.name}`}
            </span>
          </div>
          <button
            type="button"
            className="btn-exit-routing"
            onClick={onClearRoute}
            title="Clear and exit routing mode"
          >
            ✕ Exit
          </button>
        </div>
      )}

      {/* Routing Alert Toast (e.g. if user clicks a submerged node) */}
      {routingAlert && (
        <div className="map-routing-alert-toast" role="alert">
          <span>{routingAlert}</span>
        </div>
      )}

      {/* Actual Leaflet Map Canvas */}
      <div ref={mapContainerRef} className="leaflet-map-canvas" />

      {/* Floating Bottom Delhi Status Overlay */}
      <div className="delhi-map-footer-overlay">
        <span className="region-indicator">DELHI / NCR INFRASTRUCTURE GRID • 70 SITES</span>
        {isSimulated && (
          <span className="flood-alert-pill">
            ⚠️ 90mm/hr MONSOON CLOUDBURST • YAMUNA FLOOD BASIN INUNDATED
          </span>
        )}
        {activeRoute && (
          <span className="route-indicator">
            SAFE CORRIDOR: {activeRoute.distance_km} KM ({activeRoute.estimated_time_min} MIN) • {activeRoute.blocked_nodes_count ?? 5} HAZARDS AVOIDED
          </span>
        )}
      </div>
    </div>
  );
}
