import { useState, useEffect } from 'react';
import './DashboardHeader.css';

export default function DashboardHeader({
  connectionStatus,
  onRetryConnection,
  onSearchSelect,
  nodes = [],
  user,
  onLogout,
  selectedLocation,
  setSelectedLocation,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [timeString, setTimeString] = useState('');

  // Live formatted clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const datePart = now.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
      const timePart = now.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
      setTimeString(`${datePart} | ${timePart}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Search filter
  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      setSearchOpen(false);
      return;
    }
    const q = searchTerm.toLowerCase();
    const matches = nodes.filter(
      (n) =>
        (n.name && n.name.toLowerCase().includes(q)) ||
        (n.short_name && n.short_name.toLowerCase().includes(q)) ||
        n.id.toLowerCase().includes(q) ||
        (n.zone && n.zone.toLowerCase().includes(q))
    ).slice(0, 6);
    setSearchResults(matches);
    setSearchOpen(matches.length > 0);
  }, [searchTerm, nodes]);

  const handleSelectAsset = (asset) => {
    setSearchTerm('');
    setSearchOpen(false);
    if (onSearchSelect) onSearchSelect(asset);
  };

  return (
    <header className="dash-header" role="banner">
      {/* Left: Location Selector */}
      <div className="dash-header-left">
        <div className="location-select-wrap">
          <span className="location-pin-icon" aria-hidden="true">📍</span>
          <select
            className="location-dropdown"
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            aria-label="Location Selector"
          >
            <option value="delhi_ncr">New Delhi, India</option>
            <option value="central_delhi">Central Delhi (Connaught Place / ITO)</option>
            <option value="south_delhi">South Delhi (AIIMS / Okhla)</option>
            <option value="north_delhi">North Delhi (Wazirabad / Kashmere Gate)</option>
            <option value="trans_yamuna">Trans-Yamuna (Mayur Vihar / Noida Link)</option>
          </select>
          <span className="dropdown-caret" aria-hidden="true">▾</span>
        </div>
      </div>

      {/* Center: Search Box with live dropdown */}
      <div className="dash-header-center">
        <div className="search-input-wrap">
          <span className="search-icon" aria-hidden="true">🔍</span>
          <input
            type="text"
            className="search-input"
            placeholder="Search location, asset or node ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => { if (searchResults.length) setSearchOpen(true); }}
            aria-label="Search Assets"
          />
          {searchTerm && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={() => { setSearchTerm(''); setSearchOpen(false); }}
            >
              ✕
            </button>
          )}

          {/* Search suggestions dropdown */}
          {searchOpen && (
            <div className="search-results-dropdown">
              {searchResults.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="search-result-row"
                  onClick={() => handleSelectAsset(item)}
                >
                  <div className="result-text">
                    <span className="result-name">{item.name || item.id}</span>
                    <span className="result-sub">{item.type_label || item.type} &bull; {item.zone || 'Delhi Grid'}</span>
                  </div>
                  <span className={`result-status-pill status-${item.status || 'safe'}`}>
                    {item.id}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right: Connection status, Clock & User */}
      <div className="dash-header-right">
        {/* Connection Status Badge */}
        <div className="connection-status-container">
          <div className={`status-pill-badge ${connectionStatus === 'connected' ? 'connected' : 'disconnected'}`}>
            <span className="status-circle"></span>
            <span>{connectionStatus === 'connected' ? 'Backend Connected' : 'Backend Disconnected'}</span>
          </div>

          {connectionStatus === 'disconnected' && onRetryConnection && (
            <button
              type="button"
              className="header-retry-btn"
              onClick={onRetryConnection}
              title="Retry connecting to server"
            >
              ⟲
            </button>
          )}
        </div>

        {/* Live Clock */}
        <div className="header-clock" title="System Local Time">
          <span className="clock-icon" aria-hidden="true">🕒</span>
          <span className="clock-text">{timeString || 'Sep 19, 2026 | 12:24 AM'}</span>
        </div>

        {/* User Profile */}
        <div className="header-user-cluster">
          <button
            type="button"
            className="user-btn"
            onClick={() => setProfileOpen(!profileOpen)}
            aria-expanded={profileOpen}
          >
            <div className="user-avatar-circle">
              {user?.full_name ? user.full_name[0].toUpperCase() : 'R'}
            </div>
            <div className="user-text-col">
              <span className="user-name-text">{user?.full_name || 'Raj Salonia'}</span>
              <span className="user-role-text">{user?.role || 'Incident Commander'}</span>
            </div>
          </button>

          {profileOpen && (
            <div className="profile-dropdown-menu">
              <div className="profile-dropdown-info">
                <strong>{user?.full_name || 'Raj Salonia'}</strong>
                <span>{user?.email || 'admin@citygraph.org'}</span>
                <span className="profile-role-tag">{user?.role || 'Incident Commander'}</span>
              </div>
              <div className="profile-divider"></div>
              <button
                type="button"
                className="profile-logout-btn"
                onClick={() => {
                  setProfileOpen(false);
                  if (onLogout) onLogout();
                }}
              >
                ⏻ Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
