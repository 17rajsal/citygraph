import React, { useEffect } from 'react';
import './MethodologyModal.css';

export default function MethodologyModal({ isOpen, onClose }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-cluster">
            <span className="modal-category">SYSTEM DOCUMENTATION & TECHNICAL WHITE PAPER</span>
            <h3 className="modal-title">CityGraph Simulation Architecture & Methodology</h3>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <section className="modal-section">
            <h4>1. Topological Modeling of Critical Infrastructure</h4>
            <p>
              CityGraph represents municipal infrastructure as an interconnected directed network \(G = (V, E)\), where vertices \(V\) represent critical physical assets (drainage sluices, hospitals, power substations, fire stations, and arterial intersections) and edges \(E\) represent physical and functional interdependencies.
            </p>
          </section>

          <section className="modal-section">
            <h4>2. Cascading Failure Simulation Algorithm</h4>
            <p>
              When high-intensity rainfall (e.g. 90 mm/hr cloudburst) impacts the municipal boundary:
            </p>
            <ul>
              <li><strong>Initial Stress Inundation:</strong> Drainage assets and underpasses exceed their rated volumetric capacity (\(L_i &gt; C_i\)), transitioning directly to a <code>failed</code> state.</li>
              <li><strong>Load Redistribution:</strong> Unhandled stormwater and transit volume are redistributed to topologically adjacent nodes according to their transfer weights.</li>
              <li><strong>Secondary Failure Propagation:</strong> If adjacent nodes exceed critical safety thresholds (\(\text{load} / \text{capacity} &gt; 1.0\)), they enter a degraded <code>affected</code> status, modeling true cascading ripple effects across non-colocated utility sectors.</li>
            </ul>
          </section>

          <section className="modal-section">
            <h4>3. Resilient Emergency Routing (Dijkstra Safe Corridor)</h4>
            <p>
              Emergency evacuation corridors are generated via an augmented Dijkstra algorithm:
            </p>
            <ul>
              <li>Nodes with <code>status: 'failed'</code> are completely blocked (\(\text{weight} = \infty\)).</li>
              <li>Nodes with <code>status: 'affected'</code> or high vulnerability (\(\text{risk} &gt; 0.8\)) carry an dynamic risk penalty (+45 minutes), guiding emergency dispatch vehicles to safer, unobstructed corridors.</li>
            </ul>
          </section>

          <section className="modal-section">
            <h4>4. Operational Disclaimer & Safety Notice</h4>
            <div className="modal-disclaimer-box">
              <strong>SIMULATED REFERENCE MODEL • NOT AN OFFICIAL LIVE DISPATCH FEED</strong>
              <p>
                CityGraph provides computational modeling for civil defense preparedness, urban resilience research, and tabletop disaster scenario training. Real-world incident response should follow verified directives from municipal disaster management authorities.
              </p>
            </div>
          </section>
        </div>

        <div className="modal-footer">
          <span className="modal-version-tag">CityGraph v2.4.0 • Build 2026</span>
          <button type="button" className="btn-modal-close" onClick={onClose}>Close Overview</button>
        </div>
      </div>
    </div>
  );
}
