import React from 'react';

const ITEM_ICONS = {
  weapon: '⚔️', armor: '🛡️', consumable: '🧪', quest: '📜', misc: '📦',
};

export default function InventoryPanel({ character }) {
  const inventory = character.inventory || [];
  const equipment = character.equipment || {};

  return (
    <div className="inventory-panel">
      <h3>🎒 背包</h3>
      <div className="inv-gold">💰 {character.gold} 金币</div>

      <h4>装备中：</h4>
      <div className="equipment-slots">
        <div className="equip-slot">
          <span className="slot-label">武器：</span>
          <span>{equipment.weapon?.name || '空手'}</span>
        </div>
        <div className="equip-slot">
          <span className="slot-label">护甲：</span>
          <span>{equipment.armor?.name || '无'}</span>
        </div>
      </div>

      <h4>物品列表 ({inventory.length})：</h4>
      <div className="inv-grid">
        {inventory.length === 0 && (
          <p className="empty-inv">背包空空如也……</p>
        )}
        {inventory.map((item, i) => (
          <div key={i} className="inv-item">
            <div className="item-icon">{ITEM_ICONS[item.type] || '📦'}</div>
            <div className="item-info">
              <div className="item-name">
                {item.name}
                {item.qty > 1 && <span className="item-qty"> x{item.qty}</span>}
              </div>
              <div className="item-desc">{item.desc}</div>
              <div className="item-stats">
                {item.atk && <span>ATK +{item.atk} </span>}
                {item.magicAtk && <span>魔攻 +{item.magicAtk} </span>}
                {item.def && <span>DEF +{item.def} </span>}
                {item.heal && <span>回复 {item.heal}HP </span>}
                {item.mana && <span>回复 {item.mana}MP </span>}
                {item.escape && <span>逃跑用</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
