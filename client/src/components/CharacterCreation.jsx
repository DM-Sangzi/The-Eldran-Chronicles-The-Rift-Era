import React, { useState } from 'react';

const RACE_EMOJI = { human: '👤', elf: '🧝', dwarf: '⛏️', orc: '👹' };
const CLASS_EMOJI = { warrior: '⚔️', mage: '🔮', rogue: '🗡️', cleric: '✝️' };
const TALENT_TYPE_NAMES = {
  combat: '战斗天赋', magic: '魔法天赋', holy: '神术天赋',
  stealth: '潜行天赋', social: '社交天赋', explore: '探索天赋', special: '特殊天赋',
};

export default function CharacterCreation({ config, onCreate, onBack, loading, error }) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [race, setRace] = useState('');
  const [className, setClassName] = useState('');
  const [talent, setTalent] = useState('');
  const [talentMethod, setTalentMethod] = useState('choose');
  const [talentCategory, setTalentCategory] = useState('combat');
  const [worldState, setWorldState] = useState('golden_age');
  const [luckyBlessing, setLuckyBlessing] = useState(false);
  const [createPrivate, setCreatePrivate] = useState(false);
  const [worldTags, setWorldTags] = useState('');

  if (!config) return <div className="loading">加载配置中...</div>;

  const handleSubmit = () => {
    if (step < 5) {
      setStep(step + 1);
      return;
    }
    onCreate({
      name, race,
      class: className,
      talent: talent || undefined,
      talentMethod,
      worldState,
      luckyBlessing,
      createPrivateWorld: createPrivate,
      worldTags: worldTags || undefined,
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

        {/* Step 2: 种族 */}
        {step === 2 && (
          <div className="creation-step">
            <h3>🧬 第二步：选择你的种族</h3>
            <div className="race-grid">
              {Object.entries(config.races).map(([key, r]) => (
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
                </button>
              ))}
            </div>
            {race && (
              <div className="selected-info">
                选中：<strong>{config.races[race].name}</strong>
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
              {Object.entries(config.classes).map(([key, c]) => (
                <button
                  key={key}
                  className={`card ${className === key ? 'selected' : ''}`}
                  onClick={() => setClassName(key)}
                >
                  <div className="card-emoji">{CLASS_EMOJI[key]}</div>
                  <div className="card-name">{c.name}</div>
                  <div className="card-desc">{c.desc}</div>
                  <div className="card-detail">
                    HP加成：+{c.hpBonus} | 主属性：{c.primaryStat}
                  </div>
                  <div className="card-skills">
                    {c.skills.map(s => <span key={s} className="skill-tag">{s}</span>)}
                  </div>
                </button>
              ))}
            </div>
            {className && (
              <div className="selected-info">
                选中：<strong>{config.classes[className].name}</strong>
              </div>
            )}
            <button className="btn-primary" disabled={!className} onClick={handleSubmit}>
              下一步：选择天赋 →
            </button>
          </div>
        )}

        {/* Step 4: 天赋 */}
        {step === 4 && (
          <div className="creation-step">
            <h3>⭐ 第四步：选择你的天赋</h3>
            <div className="talent-method">
              <label>
                <input type="radio" value="choose" checked={talentMethod === 'choose'}
                  onChange={e => setTalentMethod(e.target.value)} />
                手动选择
              </label>
              <label>
                <input type="radio" value="random" checked={talentMethod === 'random'}
                  onChange={e => setTalentMethod(e.target.value)} />
                随机分配（1-3%概率获得"神弃者"天赋）
              </label>
            </div>

            {talentMethod === 'choose' && (
              <>
                <div className="talent-categories">
                  {Object.keys(TALENT_TYPE_NAMES).map(cat => (
                    <button
                      key={cat}
                      className={`btn-tag ${talentCategory === cat ? 'active' : ''}`}
                      onClick={() => setTalentCategory(cat)}
                    >
                      {TALENT_TYPE_NAMES[cat]}
                    </button>
                  ))}
                </div>
                <div className="talent-grid">
                  {config.talentCategories[talentCategory]?.map(t => {
                    const isForsaken = t.id === 'forsaken';
                    return (
                      <button
                        key={t.id}
                        className={`card talent-card ${talent === t.id ? 'selected' : ''} ${isForsaken ? 'forsaken' : ''}`}
                        onClick={() => setTalent(t.id)}
                      >
                        <div className="card-name">
                          {isForsaken ? '💀 ' : '⭐ '}{t.name}
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
              </>
            )}

            {talentMethod === 'random' && (
              <div className="random-info">
                <p>🎲 系统将从你可用的天赋池中随机分配一项天赋。</p>
                <p className="forsaken-hint">💀 有 1-3% 的概率获得传奇天赋「神弃者」。</p>
              </div>
            )}

            <button className="btn-primary" disabled={talentMethod === 'choose' && !talent}
              onClick={handleSubmit}>
              下一步：选择世界 →
            </button>
          </div>
        )}

        {/* Step 5: 世界状态 */}
        {step === 5 && (
          <div className="creation-step">
            <h3>🌍 第五步：选择世界状态</h3>
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
                    {key === 'golden_age' ? 'NPC友好 | 物价低 | 骰子偏向高值' : '高回报 | 高危险 | NPC冷漠'}
                  </div>
                </button>
              ))}
            </div>

            {/* 幸运女神眷顾 */}
            {talent !== 'forsaken' && (
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

            {talent === 'forsaken' && (
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
