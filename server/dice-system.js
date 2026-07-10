// D20 骰子判定系统
const config = require('./config');

class DiceSystem {
  // 基础掷骰
  static roll(sides = 20) {
    return Math.floor(Math.random() * sides) + 1;
  }

  // D20 判定（带修正）
  static d20Check(character, modifier = 0, difficulty = 10) {
    const rawRoll = this.roll(20);
    let finalModifier = modifier;

    // 世界状态修正
    if (character.worldState === 'golden_age') {
      finalModifier += (config.WORLD_STATES.golden_age.effects.diceBonus || 0);
    }

    // 天赋修正
    if (character.talent) {
      const talent = this.findTalent(character.talent);
      if (talent) {
        if (talent.effects.diceBonus) finalModifier += talent.effects.diceBonus;
        if (talent.effects.dicePenalty) finalModifier -= talent.effects.dicePenalty;
      }
    }

    // 幸运女神眷顾
    if (character.luckyBlessing && rawRoll < 5) {
      const reroll = this.roll(20);
      return {
        roll: reroll,
        modifier: finalModifier,
        total: reroll + finalModifier,
        difficulty,
        success: reroll + finalModifier >= difficulty,
        criticalSuccess: reroll >= 20,
        criticalFail: reroll <= 1,
        rerolled: true,
        originalRoll: rawRoll,
      };
    }

    const total = rawRoll + finalModifier;
    return {
      roll: rawRoll,
      modifier: finalModifier,
      total,
      difficulty,
      success: total >= difficulty,
      criticalSuccess: rawRoll >= 20,
      criticalFail: rawRoll <= 1,
    };
  }

  // 技能判定（根据角色属性）
  static skillCheck(character, skillType, difficulty = 10) {
    const attrMap = {
      strength: character.attributes.str,
      agility: character.attributes.agi,
      intelligence: character.attributes.int,
      charisma: character.attributes.cha,
    };
    const attrBonus = Math.floor((attrMap[skillType] || 10) / 2) - 5;
    return this.d20Check(character, attrBonus, difficulty);
  }

  // 战斗命中判定
  static attackRoll(character, enemyDef) {
    const attrBonus = Math.floor((character.attributes.str || character.attributes.agi || 10) / 2) - 5;
    const difficulty = 5 + Math.floor(enemyDef / 2);
    return this.d20Check(character, attrBonus, difficulty);
  }

  // 伤害掷骰
  static damageRoll(baseDamage, diceCount = 2, diceSize = 6) {
    let total = baseDamage;
    for (let i = 0; i < diceCount; i++) {
      total += this.roll(diceSize);
    }
    return total;
  }

  // 命运编织者 - 重新投掷
  static canReroll(character) {
    if (!character.talent) return false;
    const talent = this.findTalent(character.talent);
    return talent && talent.effects.reroll && talent.effects.reroll > 0;
  }

  // 查找天赋
  static findTalent(talentId) {
    for (const category of Object.values(config.TALENTS)) {
      const found = category.find(t => t.id === talentId);
      if (found) return found;
    }
    return null;
  }

  // 随机事件概率判定
  static eventRoll(character, positiveChance = 50) {
    let adjustedChance = positiveChance;

    if (character.worldState === 'golden_age') adjustedChance += 15;
    if (character.worldState === 'rift_age') adjustedChance -= 15;
    if (character.luckyBlessing) adjustedChance += 30;
    if (character.talent) {
      const talent = this.findTalent(character.talent);
      if (talent && talent.effects.negEventReduc) adjustedChance += talent.effects.negEventReduc;
    }

    return Math.random() * 100 < Math.max(5, Math.min(95, adjustedChance));
  }
}

module.exports = DiceSystem;
