import React, { useState, useEffect } from 'react';

const RACE_EMOJI = { human: '👤', elf: '🧝', dwarf: '⛏️', orc: '👹', undead: '💀' };
const FACTION_EMOJI = { good_order: '🛡️', evil_order: '💀', neutral_order: '⚖️' };
const CLASS_EMOJI = { warrior: '⚔️', mage: '🔮', rogue: '🗡️', cleric: '✝️', druid: '🌿', paladin: '🛡️', shaman: '🪨' };
const TALENT_TYPE_NAMES = {
  combat: '战斗天赋', magic: '魔法天赋', holy: '神术天赋',
  stealth: '潜行天赋', social: '社交天赋', wild: '野性天赋', explore: '探索天赋', special: '特殊天赋',
};
const STAT_NAMES = { str: '💪 力量', agi: '🏃 敏捷', int: '🧠 智力', cha: '💬 魅力' };

// 种族天赋完整描述（用于种族选择时展示）
const RACIAL_TRAITS_CONFIG = {
  human: { name: '多才多艺', icon: '🌟', desc: '所有属性+1，经验获取+5%，交易价格优惠5%。人类是天生的适应者。' },
  elf: { name: '自然之子', icon: '🍃', desc: '自然环境中感知+15%，自然系魔法效果+10%，可与小型动物沟通。精灵与森林同呼吸共命运。' },
  dwarf: { name: '锻造大师', icon: '🔨', desc: '锻造/修理成功率+20%，火焰抗性+15%，负重上限+20%。矮人从学会走路起就开始握锤。' },
  orc: { name: '血性狂暴', icon: '💢', desc: 'HP低于30%时伤害+15%，免疫恐惧，击杀后回复5%HP。兽人的血液中燃烧着战斗怒火。' },
  undead: { name: '亡灵之躯', icon: '🦴', desc: '免疫毒素/疾病/流血，暗影伤害+10%，不呼吸不睡眠。但圣光额外造成25%伤害。' },
};

export default function CharacterCreation({ config, onCreate, onBack, loading, error }) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [race, setRace] = useState('');
  const [className, setClassName] = useState('');
  const [talents, setTalents] = useState([]); // 数组，最多2个
  const [talentMethod, setTalentMethod] = useState('choose');
  const [talentCategory, setTalentCategory] = useState('combat');
  const [worldState, setWorldState] = useState('golden_age');
  const [luckyBlessing, setLuckyBlessing] = useState(false);
  const [createPrivate, setCreatePrivate] = useState(false);
  const [worldTags, setWorldTags] = useState('');

  // 当种族改变时，重置职业选择
  useEffect(() => {
    setClassName('');
  }, [race]);

  // 当职业改变时，重置天赋选择
  useEffect(() => {
    setTalents([]);
  }, [className]);

  if (!config) return <div className="loading">加载配置中...</div>;

  const handleSubmit = () => {
    if (step < 5) {
      setStep(step + 1);
      return;
    }
    const hasForsaken = talents.includes('forsaken');
    onCreate({
      name, race,
      class: className,
      talents: talents.length > 0 ? talents : undefined,
      talentMethod,
      worldState,
      luckyBlessing: hasForsaken ? false : luckyBlessing,
      createPrivateWorld: createPrivate,
      worldTags: worldTags || undefined,
    });
  };

  const handlePickTalent = (talentId) => {
    setTalents(prev => {
      // 单击切换选择
      if (prev.includes(talentId)) {
        return prev.filter(id => id !== talentId);
      }
      if (prev.length >= 2) return prev; // 已选2个
      return [...prev, talentId];
    });
  };

  return (
    <div className="character-creation">
      <div className="creation-header">
        <button className="btn-back" onClick={step > 1 ? () => setStep(step - 1) : onBack}>← 返回</button>
        <h2>角色创建</h2>
        <div className="step-indicator">
          {[1,2,3,4,5].map(s => (
            <span key={s} className={`step-dot ${s <= step ? 'active' : ''}`} />
          ))}
        </div>
      </div>

      {error && <div className="error-msg">❌ {error}</div>}

      <div className="creation-content">
        {/* Step 1: 基本信息 */}
        {step === 1 && (
          <div className="creation-step">
            <h3>📝 第一步：你叫什么名字？</h3>
            <div className="form-group">
              <input
                type="text"
                className="input-text"
                placeholder="输入你的名字……"
                value={name}
                onChange={e => setName(e.target.value)}
                maxLength={20}
                autoFocus
              />
            </div>
            {name && (
              <p className="preview-text">
                「{name}……」这个名字将在艾尔德兰大陆上被传颂。
              </p>
            )}
            <button className="btn-primary" disabled={!name.trim()} onClick={handleSubmit}>
              下一步：选择种族 →
            </button>
          </div>
        )}

        {/* Step 2: 种族 + 种族天赋 */}
        {step === 2 && (
          <div className="creation-step">
            <h3>🧬 第二步：选择你的种族</h3>
            <p className="step-hint">每个种族属于一个阵营——这将在没落时代中决定你的盟友与敌人。</p>
            <div className="race-grid">
              {Object.entries(config.races).map(([key, r]) => {
                const faction = config.factions?.[r.faction];
                // const trait = RACIAL_TRAITS_CONFIG[key];
                return (
                <button
                  key={key}
                  className={`card ${race === key ? 'selected' : ''}`}
                  onClick={() => setRace(key)}
                >
                  <div className="card-emoji">{RACE_EMOJI[key]}</div>
                  <div className="card-name">{r.name}</div>
                  <div className="card-desc">{r.desc}</div>
                  <div className="card-stats">
                    <span>💪{r.str}</span><span>🏃{r.agi}</span><span>🧠{r.int}</span><span>💬{r.cha}</span>
                  </div>
                  {faction && (
                    <div className="faction-badge" style={{ borderColor: faction.color }}>
                      {FACTION_EMOJI[r.faction]} {faction.name}
                    </div>
                  )}
                </button>
                );
              })}
            </div>
            {race && (
              <div className="selected-info">
                选中：<strong>{config.races[race].name}</strong>
                {config.factions?.[config.races[race]?.faction] && (
                  <span className="faction-tag">
                    {FACTION_EMOJI[config.races[race].faction]} 阵营：{config.factions[config.races[race].faction].name}
                  </span>
                )}
              </div>
            )}

            {/* 种族天赋展示 */}
            {race && RACIAL_TRAITS_CONFIG[race] && (
              <div className="racial-trait-display">
                <div className="racial-trait-header">
                  <span className="racial-trait-icon">{RACIAL_TRAITS_CONFIG[race].icon}</span>
                  <div>
                    <strong>种族天赋：{RACIAL_TRAITS_CONFIG[race].name}</strong>
                    <span className="racial-trait-fixed">（固定被动，无需选择）</span>
                  </div>
                </div>
                <p className="racial-trait-desc">{RACIAL_TRAITS_CONFIG[race].desc}</p>
              </div>
            )}

            <button className="btn-primary" disabled={!race} onClick={handleSubmit}>
              下一步：选择职业 →
            </button>
          </div>
        )}

        {/* Step 3: 职业 */}
        {step === 3 && (
          <div className="creation-step">
            <h3>⚔️ 第三步：选择你的职业</h3>
            <div className="class-grid">
              {Object.entries(config.classes).map(([key, c]) => {
                const isRestricted = c.raceRestrictions && race && !c.raceRestrictions.includes(race);
                return (
                <button
                  key={key}
                  className={`card ${className === key ? 'selected' : ''} ${isRestricted ? 'locked' : ''}`}
                  onClick={() => { if (!isRestricted) setClassName(key); }}
                  disabled={isRestricted}
                >
                  <div className="card-emoji">{CLASS_EMOJI[key]}</div>
                  <div className="card-name">{c.name}</div>
                  <div className="card-desc">{c.desc}</div>
                  <div className="card-detail">
                    HP加成：+{c.hpBonus} | 主属性：{STAT_NAMES[c.primaryStat] || c.primaryStat}
                  </div>
                  <div className="card-skills">
                    {c.skills.map(s => <span key={s} className="skill-tag">{s}</span>)}
                  </div>
                  {c.raceRestrictions && (
                    <div className="card-restriction">
                      🔒 限定：{c.raceRestrictions.map(r => config.races[r]?.name).join('、')}
                    </div>
                  )}
                  {isRestricted && (
                    <div className="card-locked-overlay">🚫 {race && config.races[race]?.name}不可用</div>
                  )}
                </button>
                );
              })}
            </div>
            {className && (
              <div className="selected-info">
                选中：<strong>{config.classes[className].name}</strong>
                {config.classes[className].raceRestrictions && (
                  <span className="restriction-badge">🔒 限定种族：{config.classes[className].raceRestrictions.map(r => config.races[r]?.name).join('、')}</span>
                )}
              </div>
            )}
            <button className="btn-primary" disabled={!className} onClick={handleSubmit}>
              下一步：选择天赋 →
            </button>
          </div>
        )}

        {/* Step 4: 双天赋 */}
        {step === 4 && (
          <div className="creation-step">
            <h3>⭐ 第四步：选择你的天赋（可选2个）</h3>
            <p className="step-hint">你可以从不同天赋分类中选择两个天赋，也可以交给命运随机分配。</p>
            <div className="talent-method">
              <label>
                <input type="radio" value="choose" checked={talentMethod === 'choose'}
                  onChange={e => setTalentMethod(e.target.value)} />
                手动选择 2 个天赋
              </label>
              <label>
                <input type="radio" value="random" checked={talentMethod === 'random'}
                  onChange={e => { setTalentMethod(e.target.value); setTalents([]); }} />
                随机分配（1-3%概率获得"神弃者"天赋）
              </label>
            </div>

            {talentMethod === 'choose' && (
              <>
                {/* 已选天赋显示 */}
                {talents.length > 0 && (
                  <div className="selected-talents-display">
                    <div className="selected-talents-title">已选天赋：</div>
                    <div className="selected-talents-list">
                      {talents.map(tid => {
                        let talentData = null;
                        for (const cat of Object.keys(config.talentCategories || {})) {
                          const found = config.talentCategories[cat]?.find(t => t.id === tid);
                          if (found) { talentData = { ...found, category: cat }; break; }
                        }
                        return (
                          <div key={tid} className="selected-talent-card" onClick={() => handlePickTalent(tid)}>
                            <span className="selected-talent-name">{talentData?.id === 'forsaken' ? '💀' : '⭐'} {talentData?.name || tid}</span>
                            <span className="selected-talent-remove">✕</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="talent-categories">
                  {Object.keys(TALENT_TYPE_NAMES).map(cat => {
                    const hasTalents = config.talentCategories[cat]?.length > 0;
                    if (!hasTalents) return null;
                    return (
                      <button
                        key={cat}
                        className={`btn-tag ${talentCategory === cat ? 'active' : ''}`}
                        onClick={() => setTalentCategory(cat)}
                      >
                        {TALENT_TYPE_NAMES[cat]}
                      </button>
                    );
                  })}
                </div>
                <div className="talent-grid">
                  {(config.talentCategories[talentCategory] || []).map(t => {
                    const isForsaken = t.id === 'forsaken';
                    const isSelected = talents.includes(t.id);
                    const canSelect = !isSelected && talents.length < 2;
                    return (
                      <button
                        key={t.id}
                        className={`card talent-card ${isSelected ? 'selected' : ''} ${isForsaken ? 'forsaken' : ''} ${!canSelect && !isSelected ? 'disabled' : ''}`}
                        onClick={() => handlePickTalent(t.id)}
                        disabled={!canSelect && !isSelected}
                      >
                        <div className="card-name">
                          {isForsaken ? '💀 ' : isSelected ? '✅ ' : '⭐ '}{t.name}
                        </div>
                        <div className="card-desc">{t.desc}</div>
                        {isForsaken && (
                          <div className="forsaken-warning">
                            ⚠️ 这是一条不被众神祝福的道路
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
                <p className="talent-count-hint">已选择 {talents.length}/2 个天赋（单击已选中的天赋可取消）</p>
              </>
            )}

            {talentMethod === 'random' && (
              <div className="random-info">
                <p>🎲 系统将从你可用的天赋池中随机分配两项天赋。</p>
                <p className="forsaken-hint">💀 有 1-3% 的概率获得传奇天赋「神弃者」。</p>
              </div>
            )}

            <button className="btn-primary" disabled={talentMethod === 'choose' && talents.length === 0}
              onClick={handleSubmit}>
              下一步：查看世界 →
            </button>
          </div>
        )}

        {/* Step 5: 世界状态 */}
        {step === 5 && (
          <div className="creation-step">
            <h3>🌍 第五步：选择你的时代</h3>
            <div className="world-grid">
              {Object.entries(config.worldStates).map(([key, ws]) => (
                <button
                  key={key}
                  className={`card ${worldState === key ? 'selected' : ''}`}
                  onClick={() => { setWorldState(key); }}
                >
                  <div className="card-emoji">{key === 'golden_age' ? '☀️' : '🌑'}</div>
                  <div className="card-name">{ws.name}</div>
                  <div className="card-desc">{ws.desc}</div>
                  <div className="world-effects">
                    {ws.modeLabel || (key === 'golden_age' ? '📖 剧情模式' : '⚔️ 阵营争霸')}
                  </div>
                </button>
              ))}
            </div>

            {worldState === 'golden_age' && (
              <div className="era-info golden-info">
                <h4>☀️ 光辉时代 — 剧情模式</h4>
                <p>这是艾尔德兰的黄金岁月。十一贤者之首 <strong>雷克斯·秘法</strong> 尚在人世，年轻的 <strong>晨曦帝王</strong> 正在书写他的传奇。</p>
                <p>你将与众多传奇NPC相遇、结盟，在丰富的人物关系中探寻这片大陆的奥秘。</p>
                <p className="era-note">📌 光辉时代已停止内容更新，作为艾尔德兰的"过去"，为未来的跨时代联合保留一扇小门。</p>
              </div>
            )}

            {worldState === 'decline_age' && (
              <div className="era-info decline-info">
                <h4>🌑 没落时代 — 阵营争霸</h4>
                <p>战争连年，旧日英雄已然陨落。<strong>三大阵营</strong>——善良守序联盟、邪恶守序部落、中立守序阵营——鼎立而争。</p>
                <p>你将投身于阵营战争，与战友并肩作战，在每一季的资料片更新中创造属于玩家自己的传奇。</p>
                <p className="era-note">⚔️ 多人竞技 | 阵营PvP | 持续更新</p>
              </div>
            )}

            {/* 幸运女神眷顾 */}
            {!talents.includes('forsaken') && (
              <div className="option-section">
                <label className="option-label">
                  <input type="checkbox" checked={luckyBlessing}
                    onChange={e => setLuckyBlessing(e.target.checked)} />
                  🌟 开启「幸运女神埃莉希亚的眷顾」
                </label>
                <p className="option-desc">
                  骰子结果低于5自动重掷，负面事件减少30%。适合想要温柔体验的玩家。游戏内可随时开关。
                </p>
              </div>
            )}

            {talents.includes('forsaken') && (
              <div className="forsaken-lock">
                💀 作为神弃者，你无法获得幸运女神的眷顾。
              </div>
            )}

            {/* 私人世界 */}
            <div className="option-section">
              <label className="option-label">
                <input type="checkbox" checked={createPrivate}
                  onChange={e => setCreatePrivate(e.target.checked)} />
                🔒 创建私人世界
              </label>
              {createPrivate && (
                <input
                  type="text"
                  className="input-text"
                  placeholder="输入世界限定词（可选）"
                  value={worldTags}
                  onChange={e => setWorldTags(e.target.value)}
                  maxLength={30}
                />
              )}
            </div>

            <button className="btn-primary btn-start" disabled={loading} onClick={handleSubmit}>
              {loading ? '⏳ 创建中...' : '✨ 开启冒险！'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
