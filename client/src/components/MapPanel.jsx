import React from 'react';

export default function MapPanel({ config, character, onMove }) {
  const currentRegion = config?.mapRegions?.find(r => r.id === character.currentLocation);
  const explored = character.exploredRegions || [];
  const isForsaken = character.talent === 'forsaken';

  const getNeighborRegions = () => {
    if (!currentRegion) return [];
    return (currentRegion.neighbors || []).map(nId =>
      config?.mapRegions?.find(r => r.id === nId)
    ).filter(Boolean);
  };

  const neighbors = getNeighborRegions();

  return (
    <div className="map-panel">
      <h3>🗺️ 艾尔德兰地图</h3>
      <div className="current-location">
        📍 当前位置：<strong>{currentRegion?.name || '未知'}</strong>
      </div>
      <p className="location-desc">{currentRegion?.desc}</p>

      <div className="map-visual">
        <div className="map-node current">
          <div className="node-icon">📍</div>
          <div className="node-name">{currentRegion?.name}</div>
          {isForsaken && currentRegion?.id === 'temple' && (
            <div className="node-warning">⚠️ 不受欢迎</div>
          )}
        </div>

        <div className="map-connections">
          {neighbors.map(region => (
            <div key={region.id} className="map-connector">
              <div className="connector-line">|</div>
              <button
                className={`map-node ${explored.includes(region.id) ? 'explored' : 'unknown'}`}
                onClick={() => onMove(region.id)}
              >
                <div className="node-icon">
                  {explored.includes(region.id) ? '🔵' : '❓'}
                </div>
                <div className="node-name">
                  {explored.includes(region.id) ? region.name : '未知区域'}
                </div>
                {region.id === 'temple' && isForsaken && explored.includes(region.id) && (
                  <div className="node-warning">⚠️ 敌意</div>
                )}
                {region.id === 'rift_zone' && character.talent === 'rift_sense' && (
                  <div className="node-highlight">👁️ 裂隙感知</div>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="map-legend">
        <span>🔵 已探索</span>
        <span>❓ 未探索</span>
        <span>📍 当前位置</span>
      </div>

      <div className="explored-list">
        <h4>已探索区域：</h4>
        {explored.map(id => {
          const region = config?.mapRegions?.find(r => r.id === id);
          return region ? (
            <div key={id} className="explored-item">
              {region.id === character.currentLocation ? '📍' : '✅'} {region.name}
            </div>
          ) : null;
        })}
      </div>
    </div>
  );
}
