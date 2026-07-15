import React, { useState } from 'react';
import api from '../api.js';

const SLOT_INFO = {
  weapon: { icon: '⚔️', label: '武器' },
  armor: { icon: '🛡️', label: '护甲' },
  gloves1: { icon: '🧤', label: '护手1' },
  gloves2: { icon: '🧤', label: '护手2' },
  shoes: { icon: '👢', label: '鞋子' },
};

export default function InventoryPanel({ character, config, token, onUpdate }) {
  const inventory = character.inventory || [];
  const [selectedItem, setSelectedItem] = useState(null);

  // 获取某个槽位已装备的物品
  const getEquipped = (slot) => inventory.find(i => i.slot === slot && i.equipped);

  // 获取未装备的可装备物品
  const unequippedItems = inventory.filter(i =>
    i.slot && ['weapon', 'armor', 'gloves1', 'gloves2', 'shoes'].includes(i.slot) && !i.equipped
  );

  // 获取消耗品和其他物品
  const otherItems = inventory.filter(i =>
    !i.slot || !['weapon', 'armor', 'gloves1', 'gloves2', 'shoes'].includes(i.slot)
  );

  const equipItem = async (itemId) => {
    try {
      const result = await api.equipItem(token, itemId);
      if (result.success && onUpdate) {
        onUpdate(result.character);
      }
      setSelectedItem(null);
    } catch (err) {
      console.error('装备失败:', err);
    }
  };

  const unequipItem = async (itemId) => {
    try {
      const result = await api.unequipItem(token, itemId);
      if (result.success && onUpdate) {
        onUpdate(result.character);
      }
    } catch (err) {
      console.error('卸下失败:', err);
    }
  };

  const getQualityStyle = (quality) => {
    const q = config?.equipmentQualities?.[quality] || {};
    return {
      color: q.color || '#fff',
      textShadow: q.glow !== 'none' ? q.glow : undefined,
    };
  };

  const renderItemStats = (item) => {
    const parts = [];
    if (item.atk > 0) parts.push(`攻+${item.atk}`);
    if (item.def > 0) parts.push(`防+${item.def}`);
    if (item.hp > 0) parts.push(`命+${item.hp}`);
    if (item.mp > 0) parts.push(`魔+${item.mp}`);
    if (item.speed > 0) parts.push(`速+${item.speed}`);
    if (item.magicAtk > 0) parts.push(`魔攻+${item.magicAtk}`);
    if (item.holyDmg > 0) parts.push(`圣伤+${item.holyDmg}`);
    if (item.shadowDmg > 0) parts.push(`暗伤+${item.shadowDmg}`);
    if (item.heal > 0) parts.push(`回复${item.heal}HP`);
    if (item.mana > 0) parts.push(`回复${item.mana}MP`);
    if (item.damagePercent > 0) parts.push(`⚡伤害+${item.damagePercent}%`);
    if (item.critRate > 0) parts.push(`暴击率+${item.critRate}%`);
    if (item.critDamage > 0) parts.push(`暴伤+${item.critDamage}%`);
    if (item.escape) parts.push('逃跑');
    if (parts.length === 0 && item.desc) parts.push(item.desc);
    return parts.length > 0 ? parts.join(' ') : '';
  };

  // 装备统计
  const eqStats = character.computed?.equipmentStats || {};
  const totalStats = [
    { label: '总攻击', value: eqStats.atk || 0 },
    { label: '总防御', value: eqStats.def || 0 },
    { label: '总生命', value: eqStats.hp || 0 },
    { label: '总魔力', value: eqStats.mp || 0 },
    { label: '速度', value: eqStats.speed || 0 },
  ];
  if (eqStats.damagePercent > 0) totalStats.push({ label: '伤害加成', value: `${eqStats.damagePercent}%` });
  if (eqStats.critRate > 0) totalStats.push({ label: '暴击率', value: `${eqStats.critRate}%` });
  if (eqStats.critDamage > 0) totalStats.push({ label: '暴击伤害', value: `+${eqStats.critDamage}%` });

  return (
    <div className="inventory-panel">
      <h3>🎒 背包</h3>
      <div className="inv-gold">💰 {character.gold} 金币</div>

      {/* 装备统计 */}
      <div className="equipment-stats-summary">
        <div className="eq-stats-title">📊 装备总属性</div>
        <div className="eq-stats-grid">
          {totalStats.map((s, i) => (
            <span key={i} className="eq-stat-item">{s.label}: <strong>{s.value}</strong></span>
          ))}
        </div>
      </div>

      {/* 装备槽位 */}
      <h4>⚙️ 装备栏</h4>
      <div className="equipment-slots-new">
        {Object.entries(SLOT_INFO).map(([slot, info]) => {
          const equipped = getEquipped(slot);
          const style = equipped ? getQualityStyle(equipped.quality) : {};
          return (
            <div key={slot} className={`equip-slot-new ${equipped ? 'filled' : 'empty'}`}>
              <div className="slot-header">
                <span className="slot-icon-label">{info.icon} {info.label}</span>
              </div>
              {equipped ? (
                <div className="slot-item-equipped">
                  <div className="slot-item-name" style={style}>
                    [{equipped.qualityName}] {equipped.name}
                  </div>
                  <div className="slot-item-stats-small">{renderItemStats(equipped)}</div>
                  {equipped.lore && (
                    <div className="slot-item-lore">{equipped.lore}</div>
                  )}
                  <button className="btn-unequip" onClick={() => unequipItem(equipped.id)}>卸下</button>
                </div>
              ) : (
                <div className="slot-empty-text">空</div>
              )}
            </div>
          );
        })}
      </div>

      {/* 背包物品（可装备） */}
      {unequippedItems.length > 0 && (
        <>
          <h4>🎯 可装备物品 ({unequippedItems.length})</h4>
          <div className="inv-grid">
            {unequippedItems.map((item, i) => {
              const style = getQualityStyle(item.quality);
              const slotInfo = SLOT_INFO[item.slot] || {};
              return (
                <div key={item.id || i} className={`inv-item clickable ${selectedItem === item.id ? 'selected' : ''}`}
                  onClick={() => setSelectedItem(selectedItem === item.id ? null : item.id)}>
                  <div className="item-icon" style={style}>{slotInfo.icon || '📦'}</div>
                  <div className="item-info">
                    <div className="item-name" style={style}>
                      [{item.qualityName}] {item.name}
                    </div>
                    <div className="item-desc-slot">({slotInfo.label})</div>
                    <div className="item-stats">{renderItemStats(item)}</div>
                    {item.lore && selectedItem === item.id && (
                      <div className="item-lore-expanded">📖 {item.lore}</div>
                    )}
                    {selectedItem === item.id && (
                      <button className="btn-equip" onClick={(e) => { e.stopPropagation(); equipItem(item.id); }}>
                        ⚡ 装备此物品
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* 消耗品和其他 */}
      {otherItems.length > 0 && (
        <>
          <h4>🧪 消耗品与物品 ({otherItems.length})</h4>
          <div className="inv-grid">
            {otherItems.map((item, i) => (
              <div key={item.id || i} className="inv-item">
                <div className="item-icon">
                  {item.type === 'consumable' ? '🧪' : item.type === 'key' ? '🔑' : item.type === 'currency' ? '💰' : '📦'}
                </div>
                <div className="item-info">
                  <div className="item-name">
                    {item.name}
                    {item.qty > 1 && <span className="item-qty"> x{item.qty}</span>}
                  </div>
                  <div className="item-desc">{item.desc}</div>
                  <div className="item-stats">{renderItemStats(item)}</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {inventory.length === 0 && (
        <p className="empty-inv">背包空空如也……</p>
      )}
    </div>
  );
}
