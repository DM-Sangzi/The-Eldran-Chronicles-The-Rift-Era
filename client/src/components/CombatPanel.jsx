import React from 'react';

export default function CombatPanel({ combat, onAction, character }) {
  if (!combat || combat.status !== 'active') return null;

  const hpPercent = (combat.enemy.hp / combat.enemy.maxHp * 100);
  const skills = ['猛击', '格挡', '战吼', '火球术', '冰霜术', '奥术飞弹', '偷袭', '治疗术', '圣光', '驱散', '潜行', '涂毒'];
  const classSkills = character ? {
    warrior: ['猛击', '格挡', '战吼'],
    mage: ['火球术', '冰霜术', '奥术飞弹'],
    rogue: ['偷袭', '潜行', '涂毒'],
    cleric: ['治疗术', '圣光', '驱散'],
  }[character.class] || skills.slice(0, 3) : skills.slice(0, 3);

  return (
    <div className="combat-panel">
      <div className="combat-header">
        ⚔️ 战斗 - 第 {combat.round} 回合 | {combat.turn === 'player' ? '你的回合' : '敌人回合'}
      </div>

      <div className="combat-info">
        <div className="combat-entity enemy-entity">
          <div className="entity-name">{combat.enemy.name}</div>
          <div className="hp-bar-small">
            <div className="bar-fill enemy-hp" style={{ width: `${Math.max(0, hpPercent)}%` }} />
          </div>
          <div className="entity-hp">{combat.enemy.hp}/{combat.enemy.maxHp}</div>
          {combat.enemy.status?.length > 0 && (
            <div className="enemy-status">{combat.enemy.status.join(' ')}</div>
          )}
        </div>
      </div>

      <div className="combat-log">
        {combat.log?.slice(-4).map((l, i) => (
          <div key={i} className="combat-log-entry">{l}</div>
        ))}
      </div>

      {combat.turn === 'player' && (
        <div className="combat-actions">
          <button className="btn-combat" onClick={() => onAction('attack')}>⚔️ 攻击</button>
          <button className="btn-combat" onClick={() => onAction('defend')}>🛡️ 防御</button>
          {classSkills.map(skill => (
            <button key={skill} className="btn-combat btn-skill" onClick={() => onAction('skill', skill)}>
              {skill}
            </button>
          ))}
          <button className="btn-combat btn-item" onClick={() => onAction('item', '治疗药水')}>🧪 治疗药水</button>
          <button className="btn-combat btn-escape" onClick={() => onAction('escape')}>🏃 逃跑</button>
        </div>
      )}
    </div>
  );
}
