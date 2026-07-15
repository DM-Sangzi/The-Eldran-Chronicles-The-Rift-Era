import React, { useMemo } from 'react';

// 地图节点布局坐标（SVG坐标系，容器 560x400）
const MAP_LAYOUT = {
  rift_zone:      { x: 480, y: 40 },
  elf_ruins:      { x: 380, y: 40 },
  deep_forest:    { x: 380, y: 115 },
  forest_edge:    { x: 290, y: 115 },
  river_crossing: { x: 160, y: 115 },
  bandit_camp:    { x: 70,  y: 170 },
  town_gate:      { x: 430, y: 190 },
  market_square:  { x: 350, y: 260 },
  tavern:         { x: 270, y: 310 },
  dark_alley:     { x: 270, y: 370 },
  temple:         { x: 430, y: 260 },
  graveyard:      { x: 500, y: 260 },
  underground:    { x: 430, y: 340 },
  sewer:          { x: 350, y: 400 },
};

// BFS 最短路径
function findPath(regions, fromId, toId) {
  if (fromId === toId) return [];
  const adj = {};
  regions.forEach(r => { adj[r.id] = r.neighbors || []; });
  if (!adj[fromId] || !adj[toId]) return null;

  const queue = [[fromId]];
  const visited = new Set([fromId]);
  while (queue.length > 0) {
    const path = queue.shift();
    const last = path[path.length - 1];
    for (const nb of (adj[last] || [])) {
      if (nb === toId) return [...path, nb];
      if (!visited.has(nb)) {
        visited.add(nb);
        queue.push([...path, nb]);
      }
    }
  }
  return null;
}

export default function MapPanel({ config, character, onMove }) {
  const regions = config?.mapRegions || [];
  const currentId = character?.currentLocation;
  const explored = character?.exploredRegions || [];
  const isForsaken = character?.talent === 'forsaken';
  const quest = character?.activeQuest;

  // 任务目标地点
  const questTargetId = useMemo(() => {
    if (!quest || quest.type !== 'multi_stage' || quest.status !== 'active') return null;
    const stage = quest.stages?.[(quest.currentStage || 1) - 1];
    return stage?.needAction === 'move' ? stage.needLocation : null;
  }, [quest]);

  const currentRegion = regions.find(r => r.id === currentId);
  const neighbors = currentRegion?.neighbors || [];

  // 计算任务路径
  const questPath = useMemo(() => {
    if (!questTargetId || !currentId) return null;
    return findPath(regions, currentId, questTargetId);
  }, [regions, currentId, questTargetId]);

  // 生成连接线
  const connections = useMemo(() => {
    const seen = new Set();
    const lines = [];
    regions.forEach(r => {
      (r.neighbors || []).forEach(nId => {
        const key = [r.id, nId].sort().join('-');
        if (!seen.has(key)) {
          seen.add(key);
          const a = MAP_LAYOUT[r.id];
          const b = MAP_LAYOUT[nId];
          if (a && b) lines.push({ from: a, to: b, key });
        }
      });
    });
    return lines;
  }, [regions]);

  const getRegionName = (id) => {
    const r = regions.find(rr => rr.id === id);
    return r ? r.name : id;
  };

  const isAdjacent = (id) => neighbors.includes(id);
  const isExplored = (id) => explored.includes(id);

  return (
    <div className="map-panel">
      <h3>🗺️ 艾尔德兰地图</h3>
      <div className="current-location">
        📍 当前位置：<strong>{currentRegion?.name || '未知'}</strong>
      </div>
      <p className="location-desc">{currentRegion?.desc}</p>

      {/* 任务路径提示 */}
      {questTargetId && questPath && questPath.length > 0 && (
        <div className="map-quest-hint">
          🎯 任务目标：<strong>{getRegionName(questTargetId)}</strong>
          <br />
          📍 路径：{questPath.map((id, i) => (
            <span key={id}>
              {i > 0 && ' → '}
              <span className={id === currentId ? 'path-current' : id === questTargetId ? 'path-target' : ''}>
                {getRegionName(id)}
              </span>
            </span>
          ))}
          <br />
          <span className="path-tip">点击下方相邻区域逐步前进，或输入"前往{getRegionName(questPath[1])}"快速移动</span>
        </div>
      )}

      {/* SVG 全图 */}
      <div className="map-svg-container">
        <svg viewBox="0 0 580 460" className="map-svg">
          {/* 连接线 */}
          {connections.map(({ from, to, key }) => (
            <line
              key={key}
              x1={from.x} y1={from.y} x2={to.x} y2={to.y}
              className="map-line"
            />
          ))}

          {/* 区域节点 */}
          {regions.map(r => {
            const pos = MAP_LAYOUT[r.id];
            if (!pos) return null;
            const isCurrent = r.id === currentId;
            const isAdj = isAdjacent(r.id);
            const isExp = isExplored(r.id);
            const isTarget = r.id === questTargetId;

            // 未探索且不相邻：隐藏
            if (!isExp && !isAdj && !isCurrent) return null;

            const nodeLabel = isExp ? r.name : '???';
            let nodeClass = 'map-svg-node';
            if (isCurrent) nodeClass += ' svg-current';
            else if (isAdj) nodeClass += ' svg-adjacent';
            else nodeClass += ' svg-explored';
            if (isTarget) nodeClass += ' svg-quest-target';

            return (
              <g
                key={r.id}
                className={nodeClass}
                onClick={isAdj ? () => onMove(r.id) : undefined}
                style={{ cursor: isAdj ? 'pointer' : 'default' }}
              >
                {/* 背景矩形 */}
                <rect
                  x={pos.x - 50} y={pos.y - 20}
                  width={100} height={40}
                  rx={6}
                  className="svg-node-bg"
                />
                {/* 图标 */}
                <text x={pos.x - 32} y={pos.y + 4} className="svg-node-icon" textAnchor="middle">
                  {isCurrent ? '📍' : isTarget ? '🎯' : isExp ? '🔵' : '❓'}
                </text>
                {/* 名称 */}
                <text x={pos.x - 8} y={pos.y + 4} className="svg-node-text" textAnchor="start">
                  {nodeLabel}
                </text>
                {/* 神弃者警告 */}
                {r.id === 'temple' && isForsaken && isExp && (
                  <text x={pos.x} y={pos.y + 24} className="svg-node-warning" textAnchor="middle" fontSize="9">
                    ⚠️
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* 图例 */}
      <div className="map-legend">
        <span>📍 当前位置</span>
        <span>🔵 已探索</span>
        <span>❓ 未知区域</span>
        {questTargetId && <span>🎯 任务目标</span>}
      </div>

      {/* 相邻区域快速移动 */}
      <div className="map-quick-move">
        <h4>🚶 可前往的相邻区域：</h4>
        <div className="quick-move-buttons">
          {neighbors.map(nId => {
            const r = regions.find(rr => rr.id === nId);
            if (!r) return null;
            const isOnPath = questPath && questPath.includes(nId);
            return (
              <button
                key={nId}
                className={`btn-move ${isOnPath ? 'btn-move-path' : ''}`}
                onClick={() => onMove(nId)}
              >
                {isExplored(nId) ? '🔵' : '❓'} {r.name}
                {isOnPath && questTargetId && <span className="path-badge">→ 目标方向</span>}
              </button>
            );
          })}
          {neighbors.length === 0 && (
            <span className="no-neighbors">该区域没有可通行的道路</span>
          )}
        </div>
      </div>

      {/* 已探索区域列表 */}
      <div className="explored-list">
        <h4>已探索区域：</h4>
        {explored.map(id => {
          const region = regions.find(r => r.id === id);
          return region ? (
            <div key={id} className="explored-item">
              {region.id === currentId ? '📍' : '✅'} {region.name}
            </div>
          ) : null;
        })}
      </div>
    </div>
  );
}
