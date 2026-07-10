import React, { useState, useEffect } from 'react';
import api from '../api.js';

export default function WorldSelect({ config, onBack }) {
  const [worlds, setWorlds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [hotWorld, setHotWorld] = useState(null);

  useEffect(() => {
    loadWorlds();
    api.getHotWorld().then(r => r.world && setHotWorld(r.world)).catch(() => {});
  }, []);

  const loadWorlds = async () => {
    setLoading(true);
    try {
      const result = await api.getWorlds();
      setWorlds(result.worlds || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filtered = filter === 'all'
    ? worlds
    : worlds.filter(w => w.worldState === filter);

  return (
    <div className="world-select">
      <header className="world-select-header">
        <button className="btn-back" onClick={onBack}>← 返回</button>
        <h2>🌍 选择世界</h2>
      </header>

      <div className="world-select-content">
        <div className="filter-bar">
          <button className={`btn-tag ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>全部</button>
          <button className={`btn-tag ${filter === 'golden_age' ? 'active' : ''}`} onClick={() => setFilter('golden_age')}>☀️ 光辉时代</button>
          <button className={`btn-tag ${filter === 'rift_age' ? 'active' : ''}`} onClick={() => setFilter('rift_age')}>🌑 裂隙时代</button>
        </div>

        {hotWorld && (
          <div className="hot-world">
            <h3>🔥 热门世界</h3>
            <div className="hot-world-card">
              <div className="hot-world-name">{hotWorld.name}</div>
              <div className="hot-world-state">
                {config?.worldStates?.[hotWorld.worldState]?.name || hotWorld.worldState}
              </div>
              <div className="hot-world-count">👥 {hotWorld.playerCount} 人在线</div>
            </div>
          </div>
        )}

        <div className="world-list">
          <h3>全部世界 ({filtered.length})</h3>
          {loading && <p>加载中...</p>}
          {!loading && filtered.length === 0 && (
            <p className="empty-text">暂时没有可用的世界。请在创建角色时选择创建新世界。</p>
          )}
          {filtered.map(w => (
            <div key={w.id} className="world-card">
              <div className="world-card-header">
                <strong>{w.name}</strong>
                <span className="world-type">{w.type === 'private' ? '🔒 私人' : '🌐 公开'}</span>
              </div>
              <div className="world-card-info">
                <span>{w.worldStateName}</span>
                <span>👥 {w.playerCount} 人</span>
                <span>{new Date(w.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
