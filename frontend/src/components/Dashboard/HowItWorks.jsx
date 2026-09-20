import React, { useState } from 'react';
import './HowItWorks.css';

export default function HowItWorks() {
  const [isExpanded, setIsExpanded] = useState(true);

  const steps = [
    {
      stepNumber: '01',
      title: 'Digital Twin Mapping',
      icon: '🗺️',
      summary: '108 Multi-Modal Assets',
      description: 'Comprehensive geographic modeling of Delhi NCR infrastructure including Level-1 Trauma Hospitals, Fire Commands, Drainage Sluices, 400kV Substations, Metro Interchanges, and Arterial Expressways.',
      badge: 'GIS Graph Model',
    },
    {
      stepNumber: '02',
      title: 'Climate Hazard Injection',
      icon: '🌧️',
      summary: 'Monsoon Cloudburst Simulation',
      description: 'Simulates intense precipitation events (50mm–120mm/hr) across the Yamuna River Basin, stress-testing stormwater regulator intake limits against historic flood thresholds.',
      badge: 'Hydrological Stress',
    },
    {
      stepNumber: '03',
      title: 'Cascading Failure Propagation',
      icon: '⚡',
      summary: 'Multi-Sector Interdependency',
      description: 'Drainage pump overtopping triggers road submergence. Flooded arterial corridors isolate power substations and halt metro feeder access, demonstrating realistic cross-network failure spirals.',
      badge: 'Interdependency Engine',
    },
    {
      stepNumber: '04',
      title: 'Risk Scoring & Bottlenecks',
      icon: '🎯',
      summary: 'Dynamic Asset Vulnerability',
      description: 'NetworkX graph algorithms continuously calculate node risk scores and betweenness centrality, isolating critical single-point failure assets (such as Ring Road Underpass #43).',
      badge: 'Vulnerability Isolation',
    },
    {
      stepNumber: '05',
      title: 'Dynamic Safe Routing',
      icon: '🧭',
      summary: 'Dijkstra Emergency Dispatch',
      description: 'Calculates real-time risk-penalized shortest corridors between emergency response stations and hospitals, guaranteeing ambulances and fire rescue avoid submerged arterial corridors.',
      badge: 'Fail-Safe Navigation',
    },
  ];

  return (
    <section className="how-it-works-panel" aria-label="How CityGraph Works">
      <div className="how-header-row" onClick={() => setIsExpanded(!isExpanded)} role="button" tabIndex={0}>
        <div className="how-header-left">
          <span className="how-pill-tag">ARCHITECTURE & ENGINE</span>
          <h2 className="how-main-title">How CityGraph Works</h2>
          <span className="how-subtitle">5-Step Cascading Resilience & Emergency Dispatch Architecture</span>
        </div>
        <div className="how-header-right">
          <button
            type="button"
            className="how-toggle-btn"
            aria-expanded={isExpanded}
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
          >
            {isExpanded ? 'Collapse Engine Guide ▴' : 'Explore Engine Guide ▾'}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="how-steps-grid">
          {steps.map((s) => (
            <div key={s.stepNumber} className="how-step-card">
              <div className="step-card-top">
                <span className="step-num">{s.stepNumber}</span>
                <span className="step-icon" aria-hidden="true">{s.icon}</span>
              </div>
              <span className="step-badge">{s.badge}</span>
              <h3 className="step-title">{s.title}</h3>
              <div className="step-summary">{s.summary}</div>
              <p className="step-desc">{s.description}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
