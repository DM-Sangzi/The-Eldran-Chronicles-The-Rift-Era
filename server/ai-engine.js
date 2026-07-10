// AI 叙事引擎 - 动态剧情生成
const config = require('./config');
const DiceSystem = require('./dice-system');

class AIEngine {
  constructor() {
    this.storyCache = new Map(); // 存储对话上下文
  }

  // 获取或创建会话上下文
  getContext(sessionId) {
    if (!this.storyCache.has(sessionId)) {
      this.storyCache.set(sessionId, {
        history: [],
        currentScene: null,
        activeQuest: null,
        npcRelations: {},
      });
    }
    return this.storyCache.get(sessionId);
  }

  // 生成剧情响应
  async generateResponse(character, playerInput) {
    const ctx = this.getContext(character.id);
    const intent = this.analyzeIntent(playerInput);

    // 更新历史
    ctx.history.push({ role: 'player', content: playerInput, timestamp: Date.now() });

    // 根据意图生成不同的响应
    let response;
    switch (intent.type) {
      case 'combat': response = this.handleCombatIntent(character, playerInput, intent); break;
      case 'social': response = this.handleSocialIntent(character, playerInput, intent); break;
      case 'explore': response = this.handleExploreIntent(character, playerInput, intent); break;
      case 'stealth': response = this.handleStealthIntent(character, playerInput, intent); break;
      case 'magic': response = this.handleMagicIntent(character, playerInput, intent); break;
      case 'roll': response = this.handleRollCommand(character, playerInput); break;
      default: response = this.handleGeneralIntent(character, playerInput, intent);
    }

    ctx.history.push({ role: 'system', content: response.narrative, timestamp: Date.now() });
    return response;
  }

  // 意图分析（基于关键词匹配）
  analyzeIntent(input) {
    const lower = input.toLowerCase();

    const combatKeywords = ['攻击', '砍', '刺', '射击', '战斗', '杀', '打', '劈', '斩', '挥', '射', '冲', '突袭', '偷袭', 'attack', 'fight', 'kill', 'strike'];
    const socialKeywords = ['说', '问', '谈判', '说服', '贿赂', '威胁', '乞求', '交谈', '聊天', '打招呼', '询问', 'talk', 'speak', 'ask', 'persuade', 'bribe'];
    const exploreKeywords = ['走', '去', '前往', '移动', '探索', '搜索', '寻找', '进入', '离开', 'go', 'walk', 'move', 'explore', 'search', 'enter', 'leave'];
    const stealthKeywords = ['潜行', '偷', '盗窃', '隐藏', '躲', '悄悄', '暗杀', 'sneak', 'steal', 'hide', 'stealth'];
    const magicKeywords = ['施法', '魔法', '法术', '咒语', '召唤', '火球', '冰霜', '奥术', 'cast', 'spell', 'magic', 'summon', 'fireball'];
    const rollKeywords = ['/roll', '掷骰', '判定'];

    if (input.startsWith('/roll') || rollKeywords.some(k => lower.includes(k))) return { type: 'roll' };
    if (combatKeywords.some(k => lower.includes(k))) return { type: 'combat', keywords: combatKeywords.filter(k => lower.includes(k)) };
    if (stealthKeywords.some(k => lower.includes(k))) return { type: 'stealth' };
    if (magicKeywords.some(k => lower.includes(k))) return { type: 'magic' };
    if (socialKeywords.some(k => lower.includes(k))) return { type: 'social' };
    if (exploreKeywords.some(k => lower.includes(k))) return { type: 'explore' };

    return { type: 'general' };
  }

  // 战斗意图处理
  handleCombatIntent(character, input, intent) {
    const weapon = character.equipment?.weapon?.name || '拳头';
    const isForsaken = character.talent === 'forsaken';

    // D20 战斗判定
    const check = DiceSystem.skillCheck(character, 'strength', 12);

    let narrative;
    if (check.criticalSuccess) {
      narrative = `⚔️ 【暴击！】你${this.getCombatAction(input)}${weapon}，一击命中要害！敌人发出痛苦的嚎叫。\n\n🎲 D20判定：${check.roll} + ${check.modifier} = ${check.total}（天然20，大成功！）`;
    } else if (check.success) {
      narrative = `⚔️ 你${this.getCombatAction(input)}${weapon}，准确地击中了目标！敌人踉跄后退了几步。\n\n🎲 D20判定：${check.roll} + ${check.modifier} = ${check.total}（成功）`;
    } else if (check.criticalFail) {
      narrative = `💥 你${this.getCombatAction(input)}${weapon}，但脚下一滑，攻击落空了！敌人趁机反击。\n\n🎲 D20判定：${check.roll} + ${check.modifier} = ${check.total}（天然1，大失败！）`;
    } else {
      narrative = `⚡ 你${this.getCombatAction(input)}${weapon}，但动作稍慢，敌人堪堪避开了攻击。\n\n🎲 D20判定：${check.roll} + ${check.modifier} = ${check.total}（失败）`;
    }

    if (isForsaken && character.currentLocation === 'temple') {
      narrative += '\n\n💀 神弃者的存在让神殿中的圣光微弱地闪烁了一下，神职人员们不安地注视着你。';
    }

    return { narrative, type: 'combat', check, combatTriggered: true };
  }

  // 社交意图处理
  handleSocialIntent(character, input, intent) {
    const check = DiceSystem.skillCheck(character, 'charisma', 10);
    const isForsaken = character.talent === 'forsaken';

    let narrative;
    if (check.success) {
      narrative = `💬 你的话语打动了对方。${this.getSocialResponse(check, character)}对方微微点头，表示愿意听你继续说下去。`;
    } else {
      narrative = `💬 ${this.getSocialResponse(check, character)}对方皱了皱眉，似乎对你的话不太感兴趣。`;

      if (isForsaken) {
        narrative += ' 「离我远点……你身上没有神明的祝福。」对方低声说道。';
      }
    }

    narrative += `\n\n🎲 D20判定：${check.roll} + ${check.modifier} = ${check.total}`;
    return { narrative, type: 'social', check };
  }

  // 探索意图处理
  handleExploreIntent(character, input, intent) {
    const check = DiceSystem.skillCheck(character, 'intelligence', 10);

    // 识别方向关键词
    const directionKeywords = ['北', '南', '东', '西', 'north', 'south', 'east', 'west', '森林', '城镇', '神殿', '酒馆', '地下'];

    let narrative;
    const regionName = this.extractRegionName(input);
    const isForsaken = character.talent === 'forsaken';

    if (regionName) {
      narrative = `🗺️ 你踏上了前往【${regionName}】的道路。${this.getRegionEntryDesc(regionName, character)}`;
    } else {
      narrative = `🗺️ 你环顾四周，${check.success ? '发现了一些新的路径和线索。前方的道路逐渐清晰起来。' : '但周围的环境看起来都差不多，你需要更多信息来决定方向。'}`;

      if (isForsaken && character.currentLocation?.includes('temple')) {
        narrative += '\n\n💀 神殿的钟声在你靠近时戛然而止。神弃者的脚步惊扰了圣地的宁静。';
      }
    }

    narrative += `\n\n🎲 D20判定：${check.roll} + ${check.modifier} = ${check.total}`;
    return { narrative, type: 'explore', check, destination: regionName };
  }

  // 潜行意图处理
  handleStealthIntent(character, input, intent) {
    const check = DiceSystem.skillCheck(character, 'agility', 12);

    let narrative;
    if (check.success) {
      narrative = `🕵️ 你轻盈地移动着，几乎不发出任何声响。周围没有人注意到你的存在。`;
    } else if (check.criticalFail) {
      narrative = `📢 你不小心踢到了地上的罐子！「哐当」一声响彻四周。守卫们警觉地朝你的方向看来。`;
    } else {
      narrative = `🕵️ 你试图悄悄移动，但脚步似乎不够轻。有人似乎察觉到了什么……`;
    }

    narrative += `\n\n🎲 D20判定：${check.roll} + ${check.modifier} = ${check.total}`;
    return { narrative, type: 'stealth', check };
  }

  // 魔法意图处理
  handleMagicIntent(character, input, intent) {
    if (character.class !== 'mage' && character.class !== 'cleric') {
      return {
        narrative: `✨ 你尝试调动魔力，但作为${config.CLASSES[character.class]?.name || '非施法者'}，你感觉到魔力的流动并不顺畅。不过，在某些世界中，任何人都可能学会基础法术……`,
        type: 'magic',
        check: { success: false, roll: 0, total: 0 },
      };
    }

    if (character.talent === 'forsaken' && character.class === 'cleric') {
      return {
        narrative: `💀 你伸手试图引导神力，但什么也没有发生。作为神弃者，神明早已收回了对你的眷顾。圣光在你指尖闪烁了一下便熄灭了。\n\n「被遗弃之人，不要再试图触碰神圣之力了。」一个声音在你心中响起。`,
        type: 'magic',
        check: { success: false, roll: 0, total: 0 },
      };
    }

    const check = DiceSystem.skillCheck(character, 'intelligence', 10);
    const spellName = this.extractSpellName(input);

    let narrative;
    if (check.criticalSuccess) {
      narrative = `✨ 魔力在你体内汹涌澎湃！${spellName || '法术'}的威力远超预期，耀眼的光芒照亮了周围的一切。\n\n🎲 D20判定：${check.roll} + ${check.modifier} = ${check.total}（暴击！）`;
    } else if (check.success) {
      narrative = `✨ 你熟练地引导魔力，${spellName || '法术'}按照你的意愿成形并释放了出去。\n\n🎲 D20判定：${check.roll} + ${check.modifier} = ${check.total}（成功）`;
    } else {
      narrative = `✨ 你吟唱着咒语，但魔力在关键一刻散开了。${spellName || '法术'}只是产生了一些无害的火花。\n\n🎲 D20判定：${check.roll} + ${check.modifier} = ${check.total}（失败）`;
    }

    return { narrative, type: 'magic', check };
  }

  // Roll 命令
  handleRollCommand(character, input) {
    const parts = input.split(' ');
    let difficulty = 10;

    if (parts.length > 1) {
      const parsed = parseInt(parts[1]);
      if (!isNaN(parsed)) difficulty = parsed;
    }

    const check = DiceSystem.d20Check(character, 0, difficulty);

    let narrative = `🎲 你掷出了骰子……\n\n📊 结果：D20 = ${check.roll} | 修正 = ${check.modifier} | 总计 = ${check.total}`;
    if (check.rerolled) narrative += ` | （幸运女神眷顾：原掷${check.originalRoll}，重掷）`;
    narrative += `\n${check.criticalSuccess ? '🌟 天然20！命运站在你这边！' : ''}`;
    narrative += `\n${check.criticalFail ? '💀 天然1……命运给你开了个残酷的玩笑。' : ''}`;
    narrative += `\n${check.success ? '✅ 判定成功！' : '❌ 判定失败。'}`;

    return { narrative, type: 'roll', check };
  }

  // 通用意图处理
  handleGeneralIntent(character, input, intent) {
    const currentRegion = this.findRegion(character.currentLocation);
    const regionName = currentRegion ? currentRegion.name : '当前位置';
    const isForsaken = character.talent === 'forsaken';

    const responses = [
      `在${regionName}，你${input}。周围的环境似乎对此做出了微妙的回应。你感到这个世界在倾听你的每一个行动。`,
      `你${input}。${regionName}的风轻轻吹过，仿佛在回应你的行为。艾尔德兰大陆记住了这一刻。`,
      `${input}——你做出了选择。在艾尔德兰，每一个选择都会在时间的河流中留下涟漪。谁知道这个简单的行动会引发怎样的连锁反应呢？`,
    ];

    let narrative = responses[Math.floor(Math.random() * responses.length)];

    if (isForsaken && character.currentLocation === 'temple') {
      narrative += '\n\n💀 神殿的圣像似乎在注视着你。神弃者的存在让空气变得凝重。';
    }

    return { narrative, type: 'general' };
  }

  // 生成区域进入描述
  getRegionEntryDesc(regionName, character) {
    const region = this.findRegion(regionName);
    if (!region) return '你来到了一个陌生的地方。';

    let desc = region.desc;

    if (region.id === 'temple' && character.talent === 'forsaken') {
      desc += '\n\n⚡ 刚一踏入神殿，守卫们的目光就锁定在了你身上。其中一人拔出了武器：「停下，被遗弃之人。这里不欢迎你。」';
    }

    if (region.id === 'rift_zone' && character.talent === 'rift_sense') {
      desc += '\n\n👁️ 裂隙感知天赋让你清楚地感受到裂隙中涌动的能量。你能看到普通人看不见的混沌脉络。';
    }

    return desc;
  }

  // 获取战斗动作描述
  getCombatAction(input) {
    const actions = ['挥舞着', '举起', '紧握', '拔出'];
    return actions[Math.floor(Math.random() * actions.length)];
  }

  // 获取社交响应
  getSocialResponse(check, character) {
    const talent = character.talent ? DiceSystem.findTalent(character.talent) : null;
    if (!check.success) {
      if (talent && talent.effects.npcPenalty) {
        return '对方的脸色变得不太好看。你感到一种微妙的排斥感。';
      }
      return '';
    }
    if (talent && talent.effects.npcFavor) {
      return '对方似乎对你格外友善。你天生的魅力让人难以拒绝。';
    }
    return '';
  }

  // 提取区域名称
  extractRegionName(input) {
    const regions = config.MAP_REGIONS;
    for (const region of regions) {
      if (input.includes(region.name)) return region.name;
    }
    return null;
  }

  // 提取法术名称
  extractSpellName(input) {
    const spells = ['火球术', '冰霜术', '奥术飞弹', '魔法护盾', '治疗术', '圣光', '驱散', '祝福', '泥沼术', '风刃术', '油腻术', '蛛网术'];
    for (const spell of spells) {
      if (input.includes(spell)) return spell;
    }
    return null;
  }

  // 查找区域
  findRegion(regionId) {
    if (!regionId) return null;
    return config.MAP_REGIONS.find(r => r.id === regionId || r.name === regionId);
  }

  // 生成场景描述
  generateSceneDescription(character) {
    const region = this.findRegion(character.currentLocation);
    const regionName = region ? region.name : '未知之地';
    const worldState = config.WORLD_STATES[character.worldState];

    const isForsaken = character.talent === 'forsaken';
    let narrative = `📍 你当前位于：**${regionName}**\n\n`;

    if (region) {
      narrative += `${region.desc}\n\n`;
    }

    narrative += `🌍 世界状态：**${worldState ? worldState.name : '未知'}**\n`;

    if (isForsaken) {
      narrative += '💀 身份：**神弃者** — 被神明遗弃之人\n';
    }

    narrative += '\n你可以输入你的行动——探索、战斗、交谈、施法，一切由你决定。输入 /roll 进行骰子判定。';

    return narrative;
  }

  // 生成战斗开始描述
  generateCombatStart(character, enemy) {
    const enemyData = config.ENEMIES[enemy] || { name: enemy, desc: '一个危险的敌人' };
    const isForsaken = character.talent === 'forsaken';

    let narrative = `⚔️ **战斗开始！**\n\n`;
    narrative += `你遭遇了 **${enemyData.name}**！\n`;
    narrative += `${enemyData.desc}\n\n`;
    narrative += `📊 敌人数据：HP ${enemyData.hp} | ATK ${enemyData.atk} | DEF ${enemyData.def}\n\n`;

    if (isForsaken) {
      narrative += '💀 没有神明会为你祝福。你只能依靠自己。\n\n';
    }

    narrative += '你可以选择：**攻击** / **防御** / **使用技能** / **使用道具** / **逃跑**';

    return { narrative, enemy: enemyData };
  }
}

module.exports = new AIEngine();
