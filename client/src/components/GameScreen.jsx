import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../api.js';
import CombatPanel from './CombatPanel.jsx';
import MapPanel from './MapPanel.jsx';
import InventoryPanel from './InventoryPanel.jsx';

export default function GameScreen({ character: initialChar, token, world, config, onRefresh, onOpenSocial, onBackToTitle }) {
  const [char, setChar] = useState(initialChar);
  const [narrative, setNarrative] = useState('');
  const [input, setInput] = useState('');
  const [history, setHistory] = useState([]);
  const [activePanel, setActivePanel] = useState(null); // 'map' | 'inventory' | 'status'
  const [combatData, setCombatData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const chatRef = useRef(null);
  const inputRef = useRef(null);

  const showNotification = useCallback((msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  }, []);

  useEffect(() => {
    loadScene();
  }, []);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [history]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setActivePanel(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const loadScene = async () => {
    try {
      const result = await api.getScene(token);
      setChar(result.character);
      setNarrative(result.narrative);
    } catch (err) {
      showNotification('加载场景失败: ' + err.message);
    }
  };

  const handleAction = async (overrideInput) => {
    const actionText = overrideInput || input.trim();
    if (!actionText && !overrideInput) return;

    setLoading(true);
    const playerMsg = { role: 'player', content: actionText, time: new Date().toLocaleTimeString() };
    setHistory(prev => [...prev, playerMsg]);
    setInput('');

    try {
      const result = await api.doAction(token, actionText);
      setChar(result.character);

      let sysContent = result.narrative;
      if (result.combat && result.combat.status === 'active') {
        setCombatData(result.combat);
      }

      const sysMsg = { role: 'system', content: sysContent, time: new Date().toLocaleTimeString() };
      setHistory(prev => [...prev, sysMsg]);
    } catch (err) {
      const errMsg = { role: 'system', content: '❌ ' + err.message, time: new Date().toLocaleTimeString() };
      setHistory(prev => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleMove = async (regionId) => {
    setLoading(true);
    try {
      const result = await api.moveTo(token, regionId);
      setChar(result.character);
      setNarrative(result.narrative);
      const sysMsg = { role: 'system', content: result.narrative, time: new Date().toLocaleTimeString() };
      setHistory(prev => [...prev, sysMsg]);
    } catch (err) {
      showNotification('移动失败: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRoll = async () => {
    setLoading(true);
    try {
      const result = await api.rollDice(token, {});
      const rollResult = result.roll;
      let msg = `🎲 D20判定：${rollResult.roll} + ${rollResult.modifier} = **${rollResult.total}**\n`;
      if (rollResult.rerolled) msg += `（幸运女神眷顾：原掷${rollResult.originalRoll}，重掷）\n`;
      msg += rollResult.criticalSuccess ? '🌟 天然20！大成功！' : '';
      msg += rollResult.criticalFail ? '💀 天然1……大失败。' : '';
      msg += rollResult.success ? '✅ 判定成功！' : '❌ 判定失败。';
      const sysMsg = { role: 'system', content: msg, time: new Date().toLocaleTimeString() };
      setHistory(prev => [...prev, sysMsg]);
    } catch (err) {
      showNotification('掷骰失败: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCombatAction = async (action, payload) => {
    try {
      const result = await api.combatAction(token, action, payload);
      if (result.character) setChar(result.character);

      let narrative;
      if (result.combat) {
        setCombatData(result.combat);
        narrative = result.log?.slice(-5).join('\n') || '';
      } else {
        narrative = '战斗已结束。';
      }

      if (result.combat?.status === 'victory') {
        narrative += `\n\n🏆 **胜利！** 获得了经验和金币。`;
        setTimeout(() => { setCombatData(null); loadScene(); }, 2000);
      } else if (result.combat?.status === 'defeat') {
        narrative += '\n\n💀 **你被击败了……**';
        setTimeout(() => { setCombatData(null); }, 2000);
      } else if (result.combat?.status === 'escaped') {
        setTimeout(() => { setCombatData(null); }, 1500);
      }

      const sysMsg = { role: 'system', content: narrative, time: new Date().toLocaleTimeString() };
      setHistory(prev => [...prev, sysMsg]);
    } catch (err) {
      showNotification('战斗指令失败: ' + err.message);
    }
  };

  const startCombat = async (enemyId) => {
    try {
      const result = await api.startCombat(token, enemyId);
      setCombatData(result.combat);
      const sysMsg = { role: 'system', content: result.narrative, time: new Date().toLocaleTimeString() };
      setHistory(prev => [...prev, sysMsg]);
    } catch (err) {
      showNotification('无法开始战斗: ' + err.message);
    }
  };

  const handleAllocatePoints = async (points) => {
    try {
      const result = await api.allocatePoints(token, points);
      setChar(result.character);
      showNotification('✅ 属性点分配成功！');
    } catch (err) {
      showNotification('分配失败: ' + err.message);
    }
  };

  const currentRegion = config?.mapRegions?.find(r => r.id === char.currentLocation);
  const hpPercent = char.maxHp > 0 ? (char.currentHp / char.maxHp * 100) : 0;
  const mpPercent = char.maxMp > 0 ? (char.currentMp / char.maxMp * 100) : 0;
  const className = config?.classes?.[char.class]?.name || char.class;
  const raceName = config?.races?.[char.race]?.name || char.race;
  const worldStateName = config?.worldStates?.[char.worldState]?.name || char.worldState;
  const isForsaken = char.talent === 'forsaken';

  const quickActions = [
    { label: '⚔️ 攻击', action: '攻击眼前的敌人', desc: '发起战斗' },
    { label: '🔍 探索', action: '仔细搜索周围的环境', desc: '搜索区域' },
    { label: '🗣️ 交谈', action: '与附近的人交谈', desc: '社交互动' },
    { label: '🎲 掷骰', action: '/roll', desc: 'D20判定' },
  ];

  return (
    <div className="game-screen">
      {notification && (
        <div className="notification">{notification}</div>
      )}

      {/* 顶栏 */}
      <header className="game-header">
        <div className="header-left">
          <button className="btn-icon" onClick={onBackToTitle} title="返回标题">🏠</button>
          <span className="game-title-small">艾尔德兰编年史</span>
        </div>
        <div className="header-info">
          <span>{raceName} {className}</span>
          {isForsaken && <span className="forsaken-badge">💀 神弃者</span>}
          <span>Lv.{char.level}</span>
          <span>⭐ {char.exp}</span>
          <span>💰 {char.gold}G</span>
        </div>
        <div className="header-right">
          <span className="world-badge">🌍 {world?.name || worldStateName}</span>
          <button className="btn-icon" onClick={onOpenSocial}>👥</button>
        </div>
      </header>

      {/* 主体 */}
      <div className="game-body">
        {/* 左侧面板 */}
        <aside className="side-panel">
          <div className="character-status">
            <div className={`avatar-frame ${isForsaken ? 'forsaken-frame' : ''}`}>
              <div className="avatar">{isForsaken ? '💀' : '🧑'}</div>
            </div>
            <h3>{char.name}</h3>
            <p className="char-title">{raceName} · {className} · Lv.{char.level}</p>

            <div className="stat-bar hp-bar">
              <div className="stat-label">❤️ HP</div>
              <div className="bar-track">
                <div className="bar-fill hp" style={{ width: `${Math.max(0, hpPercent)}%` }} />
              </div>
              <div className="stat-value">{char.currentHp}/{char.maxHp}</div>
            </div>

            <div className="stat-bar mp-bar">
              <div className="stat-label">💎 MP</div>
              <div className="bar-track">
                <div className="bar-fill mp" style={{ width: `${Math.max(0, mpPercent)}%` }} />
              </div>
              <div className="stat-value">{char.currentMp}/{char.maxMp}</div>
            </div>

            <div className="stat-bar exp-bar">
              <div className="stat-label">⭐ EXP</div>
              <div className="bar-track">
                <div className="bar-fill exp" style={{ width: `${Math.min(100, (char.exp / (char.level * 100)) * 100)}%` }} />
              </div>
            </div>

            <div className="attr-grid">
              <div className="attr-item">💪 {char.attributes.str} <small>力量</small></div>
              <div className="attr-item">🏃 {char.attributes.agi} <small>敏捷</small></div>
              <div className="attr-item">🧠 {char.attributes.int} <small>智力</small></div>
              <div className="attr-item">💬 {char.attributes.cha} <small>魅力</small></div>
            </div>

            {char.extraPoints > 0 && <AllocatePoints points={char.extraPoints} onAllocate={handleAllocatePoints} />}
          </div>

          <div className="side-buttons">
            <button className={`btn-side ${activePanel === 'map' ? 'active' : ''}`}
              onClick={() => setActivePanel(activePanel === 'map' ? null : 'map')}>
              🗺️ 地图
            </button>
            <button className={`btn-side ${activePanel === 'inventory' ? 'active' : ''}`}
              onClick={() => setActivePanel(activePanel === 'inventory' ? null : 'inventory')}>
              🎒 背包
            </button>
            <button className="btn-side"
              onClick={() => startCombat(null)}>
              ⚔️ 遭遇
            </button>
            <button className="btn-side"
              onClick={handleRoll}>
              🎲 掷骰
            </button>
          </div>

          <div className="location-info">
            📍 当前：<strong>{currentRegion?.name || '未知'}</strong>
          </div>
        </aside>

        {/* 中间叙事面板 */}
        <main className="narrative-panel">
          <div className="chat-area" ref={chatRef}>
            <div className="chat-msg system-msg narrative-msg">
              <div className="msg-content" dangerouslySetInnerHTML={{
                __html: narrative.replace(/\n/g, '<br/>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
              }} />
            </div>

            {history.map((msg, i) => (
              <div key={i} className={`chat-msg ${msg.role === 'player' ? 'player-msg' : 'system-msg'}`}>
                <div className="msg-meta">
                  {msg.role === 'player' ? '🗣️ 你' : '📜 世界'} · {msg.time}
                </div>
                <div className="msg-content" dangerouslySetInnerHTML={{
                  __html: msg.content.replace(/\n/g, '<br/>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                }} />
              </div>
            ))}

            {loading && <div className="typing-indicator">世界正在回应你的行动……</div>}
          </div>

          {/* 战斗面板 */}
          {combatData && combatData.status === 'active' && (
            <CombatPanel combat={combatData} onAction={handleCombatAction} character={char} />
          )}

          {/* 输入区 */}
          <div className="input-area">
            <div className="quick-actions">
              {quickActions.map((qa, i) => (
                <button key={i} className="btn-quick" onClick={() => handleAction(qa.action)}
                  title={qa.desc} disabled={loading}>
                  {qa.label}
                </button>
              ))}
            </div>
            <div className="input-row">
              <input
                ref={inputRef}
                type="text"
                className="game-input"
                placeholder="描述你的行动……（例如：我走向森林深处，小心地避开地上的枯枝）"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleAction(); }}
                disabled={loading}
                autoFocus
              />
              <button className="btn-send" onClick={() => handleAction()} disabled={loading || !input.trim()}>
                ▶
              </button>
            </div>
          </div>
        </main>

        {/* 右侧面板 */}
        {activePanel && (
          <aside className="right-panel">
            <button className="btn-close-panel" onClick={() => setActivePanel(null)}>✕</button>
            {activePanel === 'map' && (
              <MapPanel config={config} character={char} onMove={handleMove} />
            )}
            {activePanel === 'inventory' && (
              <InventoryPanel character={char} />
            )}
          </aside>
        )}
      </div>
    </div>
  );
}

// 属性点分配组件
function AllocatePoints({ points, onAllocate }) {
  const [str, setStr] = useState(0);
  const [agi, setAgi] = useState(0);
  const [int, setInt] = useState(0);
  const [cha, setCha] = useState(0);
  const remaining = points - str - agi - int - cha;

  return (
    <div className="allocate-points">
      <h4>🎯 可用属性点：{remaining}</h4>
      <div className="alloc-row">
        <span>💪 力量</span>
        <button onClick={() => setStr(s => s - 1)} disabled={str <= 0}>-</button>
        <span>{str}</span>
        <button onClick={() => setStr(s => Math.min(s + 1, s + remaining))} disabled={remaining <= 0}>+</button>
      </div>
      <div className="alloc-row">
        <span>🏃 敏捷</span>
        <button onClick={() => setAgi(s => s - 1)} disabled={agi <= 0}>-</button>
        <span>{agi}</span>
        <button onClick={() => setAgi(s => Math.min(s + 1, s + remaining))} disabled={remaining <= 0}>+</button>
      </div>
      <div className="alloc-row">
        <span>🧠 智力</span>
        <button onClick={() => setInt(s => s - 1)} disabled={int <= 0}>-</button>
        <span>{int}</span>
        <button onClick={() => setInt(s => Math.min(s + 1, s + remaining))} disabled={remaining <= 0}>+</button>
      </div>
      <div className="alloc-row">
        <span>💬 魅力</span>
        <button onClick={() => setCha(s => s - 1)} disabled={cha <= 0}>-</button>
        <span>{cha}</span>
        <button onClick={() => setCha(s => Math.min(s + 1, s + remaining))} disabled={remaining <= 0}>+</button>
      </div>
      <button className="btn-primary btn-small" disabled={remaining !== 0}
        onClick={() => { onAllocate({ str, agi, int, cha }); setStr(0); setAgi(0); setInt(0); setCha(0); }}>
        确认分配
      </button>
    </div>
  );
}
