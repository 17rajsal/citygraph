export default function HistoricalBanner({ _metadata, currentDateInfo }) {
  return (
    <div className="historical-banner">
      <div className="historical-banner-content">
        <div className="historical-pill">
          <span className="live-dot historical-dot"></span>
          HISTORICAL REFERENCE LAYER • NOT LIVE DATA
        </div>

        <div className="historical-banner-text">
          <strong>Delhi Yamuna River Flood Replay (July 2023)</strong>
          <span className="banner-divider">|</span>
          <span>
            Peak Level: <strong>208.66m</strong> (Danger Mark: 205.33m)
          </span>
          {currentDateInfo?.water_level_m && (
            <>
              <span className="banner-divider">|</span>
              <span className="current-level-tag">
                Current Replay Level: <strong>{currentDateInfo.water_level_m}m</strong>
              </span>
            </>
          )}
        </div>
      </div>

      <div className="historical-disclaimer-note">
        Reference scenario based on Central Water Commission (CWC) & Delhi Disaster Management Authority historical records.
      </div>
    </div>
  );
}
