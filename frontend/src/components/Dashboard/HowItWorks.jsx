import React, { useState } from 'react';
import './HowItWorks.css';

export default function HowItWorks() {
  const [isExpanded, setIsExpanded] = useState(true);

  const steps = [
    {
      stepNumber: '01',
      title: 'Infrastructure Data',
      icon: '🏛️',
      summary: '108 Monitored Assets',
      description: 'Geospatial synthetic modeling of hospitals, fire stations, drainage pumps, substations, roads, and metro interchanges.',
      badge: 'Data Layer',
    },
    {
      stepNumber: '02',
      title: 'Graph Construction',
      icon: '🕸️',
      summary: 'NetworkX Topology',
      description: 'Creates a connected multi-modal network with 237 physical, transit, and electrical interdependency corridors.',
      badge: 'Graph Engine',
    },
    {
      stepNumber: '03',
      title: 'Hazard Injection',
      icon: '🌧️',
      summary: 'Monsoon Cloudburst',
      description: 'Simulates 90 mm/hr cloudburst rainfall triggering volumetric intake exceedance in Yamuna stormwater sluices.',
      badge: 'Climate Stress',
    },
    {
      stepNumber: '04',
      title: 'Cascading Failure Simulation',
      icon: '⚡',
      summary: 'Cross-Sector Spiral',
      description: 'Sluice backflows submerge arterial roads, cut substation feeders, and bottleneck critical transit interchanges.',
      badge: 'Percolation Model',
    },
    {
      stepNumber: '05',
      title: 'Risk Analysis',
      icon: '📊',
      summary: 'Dynamic Risk Scoring',
      description: 'Calculates continuous node vulnerability, identifying single points of failure like Ring Road Underpass #43.',
      badge: 'Risk Analytics',
    },
    {
      stepNumber: '06',
      title: 'Emergency Routing',
      icon: '🚑',
      summary: 'Dijkstra Safe Corridor',
      description: 'Finds the safest emergency evacuation and dispatch path, automatically bypassing inundated hazard corridors.',
      badge: 'Fail-Safe Routing',
    },
  ];

  return (
    <section className="how-it-works-panel" aria-label="How CityGraph Works">
      <div className="how-header-row" onClick={() => setIsExpanded(!isExpanded)} role="button" tabIndex={0}>
        <div className="how-header-left">
          <span className="how-pill-tag">HOW CITYGRAPH WORKS</span>
          <h2 className="how-main-title">6-Step Urban Resilience Intelligence Architecture</h2>
          <span className="how-subtitle">From climate hazard injection to real-time emergency routing</span>
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
            {isExpanded ? 'Collapse Guide ▴' : 'Expand Guide ▾'}
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
