import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../api.js';
import CombatPanel from './CombatPanel.jsx';
import MapPanel from './MapPanel.jsx';
import InventoryPanel from './InventoryPanel.jsx';

export default function GameScreen({ character: initialChar, token, world, config, onRefresh, onOpenSocial, onBackToTitle, initialNarrative, initialTimeInfo, initialQuest }) {
  const [char, setChar] = useState(initialChar);
  const [narrative, setNarrative] = useState('');
  const [input, setInput] = useState('');
  const [history, setHistory] = useState([]);
  const [activePanel, setActivePanel] = useState(null); // 'map' | 'inventory' | 'status'
  const [combatData, setCombatData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [timeInfo, setTimeInfo] = useState(initialTimeInfo || null);
  const [questProgress, setQuestProgress] = useState(
    initialQuest?.type === 'multi_stage' ? initialQuest : null
  );
  const chatRef = useRef(null);
  const inputRef = useRef(null);

  const showNotification = useCallback((msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  }, []);

  useEffect(() => {
    if (initialNarrative) {
      setNarrative(initialNarrative);
    } else {
      loadScene();
    }
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
      if (result.timeInfo) setTimeInfo(result.timeInfo);
      if (result.character?.activeQuest?.type === 'multi_stage') {
        setQuestProgress(result.character.activeQuest);
      }
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
      if (result.timeInfo) setTimeInfo(result.timeInfo);
      if (result.questCompleted) setQuestProgress(null);
      if (result.character?.activeQuest && result.character.activeQuest.type === 'multi_stage') {
        setQuestProgress(result.character.activeQuest);
      } else if (!result.character?.activeQuest) {
        setQuestProgress(null);
      }

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
      if (result.timeInfo) setTimeInfo(result.timeInfo);
      if (result.questCompleted) setQuestProgress(null);
      if (result.character?.activeQuest && result.character.activeQuest.type === 'multi_stage') {
        setQuestProgress(result.character.activeQuest);
      } else if (!result.character?.activeQuest) {
        setQuestProgress(null);
      }
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
  const isForsaken = char.talents?.includes('forsaken');
  const isGoldenAge = char.worldState === 'golden_age';
  const isDeclineAge = char.worldState === 'decline_age';

  // 声望等级名称
  const getReputationName = (value) => {
    if (!config?.reputationTiers) return '未知';
    for (const t of config.reputationTiers) {
      if (value >= t.value) return t.name;
    }
    return config.reputationTiers[config.reputationTiers.length - 1]?.name || '未知';
  };
  const reputationName = getReputationName(char.reputation || 0);

  // 阵营信息
  const factionData = config?.factions?.[char.faction];
  const factionEmoji = factionData ? factionData.emoji || '' : '';
  const factionName = factionData?.name || '';

  // 阵营外交声望
  const factionRepEntries = char.factionRep
    ? Object.entries(char.factionRep).filter(([fid]) => fid !== char.faction)
    : [];

  // 出生地信息
  const birthInfo = char.birthLocation;

  // 武器精通
  const weaponProf = char.weaponProficiency || config?.weaponProficiency?.[char.class];

  // 天生被动技能
  const innateSkills = char.innateSkills;
  const [showInnateDetails, setShowInnateDetails] = useState(false);

  const quickActions = [
    { label: '⚔️ 攻击', action: '攻击眼前的敌人', desc: '发起战斗' },
    { label: '🔍 探索', action: '仔细搜索周围的环境', desc: '搜索区域' },
    { label: '🗣️ 交谈', action: '与附近的人交谈', desc: '社交互动' },
    { label: '⏰ 等待', action: '/wait', desc: '等待时间流逝' },
    { label: '🎲 掷骰', action: '/roll', desc: 'D20判定' },
    { label: '🎒 背包', action: '/bag', desc: '查看物品栏' },
    { label: '📋 任务', action: '/quest', desc: '查看任务' },
    { label: '📚 技能', action: '/skills', desc: '查看技能树' },
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
          {factionData && <span className="faction-badge-header" title={factionData.desc}>{factionEmoji} {factionName}</span>}
          <span>Lv.{char.level}</span>
          <span>⭐ {char.exp}</span>
          <span>💰 {char.gold}G</span>
        </div>
        <div className="header-right">
          <span className={`world-badge ${isGoldenAge ? 'golden-badge' : 'decline-badge'}`}>
            {isGoldenAge ? '📖' : '⚔️'} {world?.name || worldStateName}
          </span>
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

            {birthInfo && (
              <div className="birth-info">
                <span className="birth-icon">🏙️</span>
                <span className="birth-text">{birthInfo.capital} · {birthInfo.place}</span>
              </div>
            )}

            {factionData && (
              <div className="faction-info-sidebar" style={{ borderLeftColor: factionData.color }}>
                <span className="faction-sidebar-emoji">{factionEmoji}</span>
                <span className="faction-sidebar-name">{factionName}</span>
              </div>
            )}

            {weaponProf && (
              <div className="weapon-proficiency-sidebar">
                <span className="weapon-prof-icon">{weaponProf.icon}</span>
                <span className="weapon-prof-type">{weaponProf.type}</span>
              </div>
            )}

            {/* 天赋展示 */}
            {char.talents && char.talents.length > 0 && (
              <div className="talents-display">
                <div className="talents-label">⭐ 角色天赋</div>
                <div className="talents-list">
                  {char.talents.map((tid, i) => {
                    let name = tid;
                    for (const cat of Object.keys(config?.talentCategories || {})) {
                      const found = config.talentCategories[cat]?.find(t => t.id === tid);
                      if (found) { name = found.name; break; }
                    }
                    return <span key={i} className="talent-badge">{tid === 'forsaken' ? '💀' : '⭐'} {name}</span>;
                  })}
                </div>
              </div>
            )}

            {/* 种族天赋展示 */}
            {char.racialTrait && (
              <div className="racial-trait-sidebar">
                <div className="racial-trait-label">{char.racialTrait.icon} 种族天赋：{char.racialTrait.name}</div>
                <div className="racial-trait-sidebar-desc">{char.racialTrait.desc}</div>
              </div>
            )}

            {/* 主动技能 */}
            {char.skills && char.skills.filter(s => s.skillLevel > 0).length > 0 && (
              <div className="active-skills-sidebar">
                <div className="active-skills-title">⚡ 已学技能</div>
                {char.skills.filter(s => s.skillLevel > 0).map(skill => (
                  <div key={skill.id} className="active-skill-item">
                    <span className="active-skill-name">{skill.name} Lv.{skill.skillLevel}</span>
                    <span className="active-skill-type">[{skill.type}]</span>
                  </div>
                ))}
                <div className="active-skills-hint">输入 /skills 查看完整技能树 | /learn 技能ID 学习技能</div>
              </div>
            )}

            {innateSkills && (
              <div className="innate-skills-sidebar">
                <div className="innate-header" onClick={() => setShowInnateDetails(!showInnateDetails)}>
                  <span>⭐ 天生被动</span>
                  <span className="innate-toggle">{showInnateDetails ? '▲' : '▼'}</span>
                </div>
                {showInnateDetails && (
                  <div className="innate-details">
                    {Object.entries(innateSkills).map(([key, skill]) => (
                      <div key={key} className="innate-skill-card">
                        <div className="innate-skill-header">
                          <span className="innate-skill-icon">{skill.icon}</span>
                          <div className="innate-skill-info">
                            <span className="innate-skill-name">{skill.name}</span>
                            <span className="innate-skill-tier">{skill.currentTier.name} · Lv.{skill.currentTier.level}</span>
                          </div>
                        </div>
                        <p className="innate-skill-effect">{skill.currentTier.desc}</p>
                        {skill.nextTier && (
                          <div className="innate-next-tier">
                            <div className="innate-next-bar">
                              <div className="innate-next-fill" style={{
                                width: `${Math.min(100, ((char.level - skill.currentTier.level) / (skill.nextTier.level - skill.currentTier.level)) * 100)}%`
                              }} />
                            </div>
                            <span className="innate-next-label">→ Lv.{skill.nextTier.level} {skill.nextTier.name}</span>
                          </div>
                        )}
                        {skill.isMaxed && (
                          <div className="innate-maxed">🌟 已达终极形态</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="reputation-display">
              <span className="rep-label">⭐ 本阵营声望</span>
              <span className="rep-value">{reputationName}</span>
            </div>

            {factionRepEntries.length > 0 && (
              <div className="faction-rep-list">
                <div className="faction-rep-title">🌐 阵营外交</div>
                {factionRepEntries.map(([fid, val]) => {
                  const fData = config?.factions?.[fid];
                  const repTier = getReputationName(val);
                  return (
                    <div key={fid} className="faction-rep-row">
                      <span className="faction-rep-emoji">{fData?.emoji || '❓'}</span>
                      <span className="faction-rep-name">{fData?.name || fid}</span>
                      <span className="faction-rep-tier">{repTier}</span>
                    </div>
                  );
                })}
              </div>
            )}

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
                <div className="bar-fill exp" style={{ width: `${char.expProgress?.progress || 0}%` }} />
              </div>
              <div className="stat-value">{char.exp}/{char.expProgress?.needed || '?'}</div>
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

          {/* 时间显示 */}
          {timeInfo && (
            <div className={`time-display ${timeInfo.isNight ? 'time-night' : 'time-day'}`}>
              <span className="time-icon">{timeInfo.isNight ? '🌙' : '☀️'}</span>
              <span className="time-text">{timeInfo.periodName}</span>
              <span className="time-full">{timeInfo.full}</span>
            </div>
          )}

          {/* 多阶段任务进度 */}
          {questProgress && questProgress.type === 'multi_stage' && questProgress.status === 'active' && (
            <div className="quest-progress-sidebar">
              <div className="quest-progress-title">📋 {questProgress.title}</div>
              <div className="quest-progress-stage">
                阶段 {questProgress.currentStage}/{questProgress.stages.length}
              </div>
              <div className="quest-progress-goal">
                🎯 {questProgress.stages[questProgress.currentStage - 1]?.goal || '推进任务'}
              </div>
              {questProgress.stages[questProgress.currentStage - 1]?.needTime && (
                <div className="quest-progress-time-hint">
                  ⚠️ 需要：{questProgress.stages[questProgress.currentStage - 1].needTime === 'night' ? '🌙 夜晚' : '☀️ 白天'}
                </div>
              )}
              {questProgress.stages[questProgress.currentStage - 1]?.needLocation && (
                <div className="quest-progress-loc-hint">
                  📍 需要前往：{questProgress.stages[questProgress.currentStage - 1].needLocation}
                </div>
              )}
            </div>
          )}
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
              <InventoryPanel character={char} config={config} token={token} onUpdate={setChar} />
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
