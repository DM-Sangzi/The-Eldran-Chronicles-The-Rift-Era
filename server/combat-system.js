// 战斗系统 - 回合制文字战斗
const config = require('./config');
const DiceSystem = require('./dice-system');

class CombatSystem {
  // 创建战斗实例
  static createCombat(character, enemyId) {
    const enemyTemplate = config.ENEMIES[enemyId];
    if (!enemyTemplate) throw new Error(`未知敌人: ${enemyId}`);

    const enemy = {
      ...enemyTemplate,
      currentHp: enemyTemplate.hp,
      status: [],
    };

    return {
      id: `combat_${Date.now()}`,
      character,
      enemy,
      turn: 'player',
      round: 1,
      log: [`⚔️ 遭遇了 ${enemy.name}！战斗开始！`],
      status: 'active',
    };
  }

  // 玩家攻击
  static playerAttack(combat) {
    const { character, enemy } = combat;
    const log = [];

    // 计算攻击力
    let atk = character.attributes.str + (character.computed?.atkBonus || 0);
    const weapon = character.equipment?.weapon;
    if (weapon) atk += (weapon.atk || 0) + (weapon.magicAtk || 0);

    // 命中判定
    const hitCheck = DiceSystem.attackRoll(character, enemy.def);
    log.push(`🎲 攻击判定：${hitCheck.roll} + ${hitCheck.modifier} = ${hitCheck.total}`);

    if (!hitCheck.success) {
      log.push('❌ 你的攻击落空了！');
      combat.turn = 'enemy';
      combat.log.push(...log);
      return { result: 'miss', log, combat };
    }

    // 暴击判定
    let isCrit = hitCheck.criticalSuccess;
    if (!isCrit && character.computed?.critRate) {
      isCrit = Math.random() * 100 < character.computed.critRate;
    }

    // 伤害计算
    let damage = DiceSystem.damageRoll(atk);
    damage = Math.max(1, damage - enemy.def);

    // 天赋加成
    if (character.talent) {
      const talent = DiceSystem.findTalent(character.talent);
      if (talent) {
        if (talent.effects.meleeDmg) damage = Math.floor(damage * (1 + talent.effects.meleeDmg / 100));
        if (talent.effects.riftDmg && enemy.name?.includes('裂隙')) damage = Math.floor(damage * (1 + talent.effects.riftDmg / 100));
      }
    }

    if (isCrit) {
      damage = Math.floor(damage * 2);
      log.push(`💥 暴击！造成 ${damage} 点伤害！`);
    } else {
      log.push(`⚔️ 造成 ${damage} 点伤害！`);
    }

    // 吸血效果
    if (character.talent) {
      const talent = DiceSystem.findTalent(character.talent);
      if (talent && talent.effects.lifesteal) {
        const heal = Math.floor(damage * talent.effects.lifesteal / 100);
        character.currentHp = Math.min(character.maxHp, character.currentHp + heal);
        log.push(`🩸 战斗狂热：回复 ${heal} 点生命值`);
      }
    }

    enemy.currentHp -= damage;

    // 检查敌人死亡
    if (enemy.currentHp <= 0) {
      enemy.currentHp = 0;
      log.push(`🏆 你击败了 ${enemy.name}！`);
      const rewards = this.calculateRewards(character, enemy);
      log.push(`💰 获得 ${rewards.gold} 金币 | ⭐ ${rewards.exp} 经验`);
      combat.status = 'victory';
      combat.rewards = rewards;
    } else {
      combat.turn = 'enemy';
    }

    combat.log.push(...log);
    return { result: enemy.currentHp <= 0 ? 'killed' : 'hit', log, damage, combat };
  }

  // 敌人攻击
  static enemyAttack(combat) {
    const { character, enemy } = combat;
    const log = [];

    // 敌人命中判定
    const enemyRoll = DiceSystem.roll(20);
    const playerDef = character.attributes.agi + (character.computed?.defBonus || 0);
    const armor = character.equipment?.armor;
    const totalDef = playerDef + (armor?.def || 0);

    const difficulty = 5 + Math.floor(totalDef / 3);
    const hit = enemyRoll >= difficulty;

    log.push(`👹 ${enemy.name} 发动攻击！`);

    if (!hit) {
      log.push(`🎲 ${enemy.name} 的攻击落空了！（掷出 ${enemyRoll}，需要 ${difficulty}）`);
      combat.turn = 'player';
      combat.round++;
      combat.log.push(...log);
      return { result: 'miss', log, combat };
    }

    // 伤害计算
    let damage = Math.max(1, enemy.atk + DiceSystem.roll(6) - Math.floor(totalDef / 3));

    // 天赋减伤
    if (character.talent) {
      const talent = DiceSystem.findTalent(character.talent);
      if (talent) {
        if (talent.effects.physDmgReduc) damage = Math.floor(damage * (1 - talent.effects.physDmgReduc / 100));
        if (talent.effects.lowHpReduc && character.currentHp < character.maxHp * 0.3) {
          damage = Math.floor(damage * (1 - talent.effects.lowHpReduc / 100));
        }
      }
    }

    // 闪避判定
    if (character.computed?.dodgeRate) {
      if (Math.random() * 100 < character.computed.dodgeRate) {
        log.push('🌀 镜像步！你闪避了这次攻击！');
        combat.turn = 'player';
        combat.round++;
        combat.log.push(...log);
        return { result: 'dodged', log, combat };
      }
    }

    character.currentHp -= damage;
    log.push(`💢 ${enemy.name} 对你造成了 ${damage} 点伤害！`);

    // 诅咒之体反弹
    if (character.talent) {
      const talent = DiceSystem.findTalent(character.talent);
      if (talent && talent.effects.curseReflect) {
        const reflect = Math.floor(damage * talent.effects.curseReflect / 100);
        const extraToSelf = Math.floor(damage * talent.effects.cursePenalty / 100);
        enemy.currentHp -= reflect;
        character.currentHp -= extraToSelf;
        log.push(`🔄 诅咒之体：反弹 ${reflect} 伤害，自身额外承受 ${extraToSelf} 伤害`);
      }
    }

    // 检查玩家死亡
    if (character.currentHp <= 0) {
      // 神恩庇护 - 复活判定
      if (character.talent) {
        const talent = DiceSystem.findTalent(character.talent);
        if (talent && talent.effects.reviveChance) {
          if (Math.random() * 100 < talent.effects.reviveChance) {
            character.currentHp = 1;
            log.push('✨ 神恩庇护！你在死亡的边缘被拉了回来！（HP = 1）');
            combat.turn = 'player';
            combat.round++;
            combat.log.push(...log);
            return { result: 'revived', log, combat };
          }
        }
      }
      character.currentHp = 0;
      combat.status = 'defeat';
      log.push('💀 你被击败了……冒险到此结束。');
    } else {
      combat.turn = 'player';
      combat.round++;
    }

    combat.log.push(...log);
    return { result: character.currentHp <= 0 ? 'defeated' : 'hit', log, damage, combat };
  }

  // 玩家防御
  static playerDefend(combat) {
    const log = ['🛡️ 你采取了防御姿态！本回合受到的伤害减半。'];
    combat.defending = true;
    combat.turn = 'enemy';
    combat.log.push(...log);
    return { result: 'defending', log, combat };
  }

  // 玩家逃跑
  static playerEscape(combat) {
    const character = combat.character;
    const escapeCheck = DiceSystem.skillCheck(character, 'agility', 14);

    const log = [`🏃 你试图逃跑……`];
    log.push(`🎲 逃跑判定：${escapeCheck.roll} + ${escapeCheck.modifier} = ${escapeCheck.total}`);

    if (escapeCheck.success) {
      combat.status = 'escaped';
      log.push('✅ 你成功逃离了战斗！');
    } else {
      combat.turn = 'enemy';
      log.push('❌ 逃跑失败！敌人抓住了机会！');
    }

    combat.log.push(...log);
    return { result: escapeCheck.success ? 'escaped' : 'failed', log, combat };
  }

  // 使用技能
  static useSkill(combat, skillName) {
    const { character, enemy } = combat;
    const log = [];

    const skillMap = {
      '猛击': { damage: 1.5, desc: '你蓄力一击，发出猛烈的攻击！' },
      '格挡': { defense: true, desc: '你举起武器格挡，准备迎接攻击。' },
      '战吼': { buff: 'atk', value: 5, desc: '你发出震耳欲聋的战吼，士气大增！' },
      '火球术': { damage: 2.0, magic: true, desc: '一颗炽热的火球从你手中飞出！' },
      '冰霜术': { damage: 1.3, freeze: true, desc: '冰霜之力凝聚，射向敌人！' },
      '奥术飞弹': { damage: 1.7, magic: true, desc: '数枚奥术能量飞弹疾射而出！' },
      '偷袭': { damage: 2.5, desc: '你从暗处发动致命一击！' },
      '治疗术': { heal: true, desc: '温暖的圣光包围了你。' },
      '圣光': { damage: 1.5, holy: true, desc: '神圣的光芒照耀着战场！' },
      '驱散': { cleanse: true, desc: '你驱散了周围的负面能量。' },
    };

    const skill = skillMap[skillName];
    if (!skill) {
      log.push(`❌ 未知技能：${skillName}`);
      combat.log.push(...log);
      return { result: 'unknown_skill', log, combat };
    }

    // 神弃者不能使用神术
    if (skill.holy && character.talent === 'forsaken') {
      log.push('💀 作为神弃者，你无法使用神圣技能。圣光在你手中消散了。');
      combat.turn = 'enemy';
      combat.log.push(...log);
      return { result: 'blocked_forsaken', log, combat };
    }

    log.push(skill.desc);

    if (skill.damage) {
      let atk = character.attributes.int || character.attributes.str;
      let damage = Math.floor(atk * skill.damage);
      damage = Math.max(1, damage - enemy.def);
      enemy.currentHp -= damage;
      log.push(`⚡ 造成 ${damage} 点伤害！`);

      if (skill.freeze) {
        enemy.status.push('frozen');
        log.push('❄️ 敌人被冻结了！下一回合无法行动。');
      }

      if (enemy.currentHp <= 0) {
        enemy.currentHp = 0;
        combat.status = 'victory';
        log.push(`🏆 你击败了 ${enemy.name}！`);
        const rewards = this.calculateRewards(character, enemy);
        log.push(`💰 获得 ${rewards.gold} 金币 | ⭐ ${rewards.exp} 经验`);
        combat.rewards = rewards;
      }
    }

    if (skill.heal) {
      const heal = 15 + Math.floor(character.attributes.cha / 2);
      character.currentHp = Math.min(character.maxHp, character.currentHp + heal);
      log.push(`💚 回复了 ${heal} 点生命值！`);
    }

    if (skill.defense) {
      combat.defending = true;
      combat.turn = 'enemy';
    } else if (combat.status === 'active') {
      combat.turn = 'enemy';
    }

    combat.log.push(...log);
    return { result: 'skill_used', log, combat };
  }

  // 使用道具
  static useItem(combat, itemName) {
    const { character } = combat;
    const log = [];

    const invItem = character.inventory?.find(i => i.name === itemName);
    if (!invItem) {
      log.push(`❌ 背包中没有「${itemName}」`);
      combat.log.push(...log);
      return { result: 'no_item', log, combat };
    }

    if (invItem.heal) {
      character.currentHp = Math.min(character.maxHp, character.currentHp + invItem.heal);
      log.push(`🧪 使用「${itemName}」，回复 ${invItem.heal} 点生命值！`);
    }

    if (invItem.mana) {
      character.currentMp = Math.min(character.maxMp, (character.currentMp || 0) + invItem.mana);
      log.push(`💎 使用「${itemName}」，回复 ${invItem.mana} 点法力值！`);
    }

    // 减少物品数量或移除
    if (invItem.qty > 1) {
      invItem.qty--;
    } else {
      character.inventory = character.inventory.filter(i => i !== invItem);
    }

    combat.turn = 'enemy';
    combat.log.push(...log);
    return { result: 'item_used', log, combat };
  }

  // 计算奖励
  static calculateRewards(character, enemy) {
    let gold = enemy.gold;
    let exp = enemy.exp;

    // 世界状态奖励
    if (character.worldState === 'rift_age') {
      gold = Math.floor(gold * (1 + (config.WORLD_STATES.rift_age.effects.rewardBonus || 0) / 100));
    }

    // 天赋加成
    if (character.talent) {
      const talent = DiceSystem.findTalent(character.talent);
      if (talent && talent.effects.expBonus) {
        exp = Math.floor(exp * (1 + talent.effects.expBonus / 100));
      }
    }

    return { gold, exp };
  }

  // 执行完整回合
  static executeTurn(combat, action, payload) {
    if (combat.status !== 'active') {
      return { result: 'combat_ended', log: ['战斗已经结束。'], combat };
    }

    switch (action) {
      case 'attack': return this.playerAttack(combat);
      case 'defend': return this.playerDefend(combat);
      case 'escape': return this.playerEscape(combat);
      case 'skill': return this.useSkill(combat, payload);
      case 'item': return this.useItem(combat, payload);
      default: return { result: 'invalid', log: ['无效的战斗指令。'], combat };
    }
  }

  // 获取战斗状态摘要
  static getCombatSummary(combat) {
    return {
      id: combat.id,
      status: combat.status,
      turn: combat.turn,
      round: combat.round,
      player: {
        name: combat.character.name,
        hp: combat.character.currentHp,
        maxHp: combat.character.maxHp,
        mp: combat.character.currentMp,
        maxMp: combat.character.maxMp,
      },
      enemy: {
        name: combat.enemy.name,
        hp: combat.enemy.currentHp,
        maxHp: combat.enemy.hp,
        status: combat.enemy.status,
      },
      log: combat.log,
    };
  }
}

// 战斗管理器 - 存储活跃战斗
const activeCombats = new Map();

module.exports = { CombatSystem, activeCombats };
