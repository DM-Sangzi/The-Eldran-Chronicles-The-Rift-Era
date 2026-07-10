// 艾尔德兰编年史 - 全局配置
module.exports = {
  PORT: process.env.PORT || 3001,
  
  // AI 引擎配置（可替换为真实 API）
  AI: {
    provider: process.env.AI_PROVIDER || 'builtin', // 'builtin' | 'deepseek' | 'claude' | 'openai'
    apiKey: process.env.AI_API_KEY || '',
    model: process.env.AI_MODEL || '',
    apiEndpoint: process.env.AI_ENDPOINT || '',
  },

  // 种族定义
  RACES: {
    human: { name: '人类', desc: '均衡，适应性强，擅长贸易、外交和战争', str: 10, agi: 10, int: 10, cha: 12, bonuses: { trade: 10, diplomacy: 10 } },
    elf: { name: '精灵', desc: '长寿、敏捷、与自然共鸣，掌握古老魔法和弓箭技艺', str: 8, agi: 14, int: 12, cha: 10, bonuses: { magic: 10, archery: 15, nature: 15 } },
    dwarf: { name: '矮人', desc: '坚韧、力量强大、擅长锻造', str: 14, agi: 8, int: 10, cha: 8, bonuses: { smith: 20, defense: 10, endurance: 10 } },
    orc: { name: '兽人', desc: '勇猛、尚武、氏族社会，崇尚力量与荣耀', str: 16, agi: 10, int: 6, cha: 6, bonuses: { melee: 15, intimidation: 15, survival: 10 } },
  },

  // 职业定义
  CLASSES: {
    warrior: { name: '战士', desc: '近战专家，依靠力量和耐力', primaryStat: 'str', hpBonus: 20, skills: ['猛击', '格挡', '战吼', '旋风斩'] },
    mage: { name: '法师', desc: '奥术使用者，掌握元素、幻术和咒法', primaryStat: 'int', hpBonus: 5, skills: ['火球术', '冰霜术', '奥术飞弹', '魔法护盾'] },
    rogue: { name: '游荡者', desc: '潜行、偷窃、开锁、暗杀', primaryStat: 'agi', hpBonus: 10, skills: ['偷袭', '开锁', '潜行', '涂毒'] },
    cleric: { name: '牧师', desc: '信仰神祇的治疗者和圣武士', primaryStat: 'cha', hpBonus: 15, skills: ['治疗术', '圣光', '驱散', '祝福'] },
  },

  // 天赋池
  TALENTS: {
    combat: [
      { id: 'giant_grip', name: '巨人之握', desc: '近战伤害+15%，使用重型武器时无视敌人5%护甲', type: 'combat', effects: { meleeDmg: 15, armorPen: 5 }, levels: [{ meleeDmg: 15, armorPen: 5 }, { meleeDmg: 25, armorPen: 12 }, { meleeDmg: 35, armorPen: 20 }] },
      { id: 'iron_body', name: '钢铁之躯', desc: '受到的物理伤害减少10%，生命值低于30%时额外减少15%', type: 'combat', effects: { physDmgReduc: 10, lowHpReduc: 15 } },
      { id: 'kill_instinct', name: '杀戮本能', desc: '每次击杀敌人获得额外10%经验值，且短暂提升攻击力（持续2回合）', type: 'combat', effects: { expBonus: 10, atkBuff: 10 } },
      { id: 'battle_frenzy', name: '战斗狂热', desc: '每次造成伤害时，回复造成伤害的5%作为生命值', type: 'combat', effects: { lifesteal: 5 } },
    ],
    magic: [
      { id: 'spell_affinity', name: '法术亲和', desc: '所有法术消耗减少20%，法术失败率降低10%', type: 'magic', effects: { manaCostReduc: 20, failRateReduc: 10 } },
      { id: 'elemental_sense', name: '元素感应', desc: '元素类法术伤害+15%，且施法时有10%概率不消耗法术位', type: 'magic', effects: { elemDmg: 15, freeCast: 10 } },
      { id: 'summon_resonance', name: '咒法共鸣', desc: '召唤/咒法类法术持续时间+30%，召唤物获得额外生命值和攻击力', type: 'magic', effects: { summonDur: 30, summonBuff: 15 } },
      { id: 'necro_contract', name: '死灵契约', desc: '不死生物类法术效果+20%，但生命值上限-10%', type: 'magic', effects: { necroBuff: 20, hpPenalty: 10 } },
    ],
    holy: [
      { id: 'holy_light', name: '神圣之光', desc: '治疗法术效果+20%，且能额外驱散一个负面状态', type: 'holy', effects: { healBuff: 20, extraCleanse: 1 } },
      { id: 'faith_barrier', name: '信仰壁垒', desc: '受到暗影/亡灵类伤害减少20%，且暴击抵抗+10%', type: 'holy', effects: { shadowResist: 20, critResist: 10 } },
      { id: 'divine_protection', name: '神恩庇护', desc: '死亡时有一定概率（30%）以1点生命值复活，每场战斗限一次', type: 'holy', effects: { reviveChance: 30 } },
      { id: 'prayer', name: '祈祷者', desc: '每日可额外使用一次「祈祷」能力', type: 'holy', effects: { extraPray: 1 } },
    ],
    stealth: [
      { id: 'shadow_walker', name: '暗影行者', desc: '潜行状态下移动速度+20%，被发现概率-15%', type: 'stealth', effects: { stealthSpeed: 20, detectionReduc: 15 } },
      { id: 'theft_art', name: '盗窃之艺', desc: '偷窃成功率+20%，且偷窃失败时不会触发警报（仅限一次/天）', type: 'stealth', effects: { stealRate: 20, safeFail: true } },
      { id: 'poison_master', name: '毒药大师', desc: '涂毒伤害+25%，且毒效果持续额外1回合', type: 'stealth', effects: { poisonDmg: 25, poisonDur: 1 } },
      { id: 'mirror_step', name: '镜像步', desc: '闪避率+10%，暴击率+5%', type: 'stealth', effects: { dodge: 10, crit: 5 } },
    ],
    social: [
      { id: 'natural_charm', name: '天生魅惑', desc: 'NPC初始好感度+10，交易价格-10%', type: 'social', effects: { npcFavor: 10, discount: 10 } },
      { id: 'mind_reader', name: '读心者', desc: '对话中可额外查看NPC的隐藏需求或谎言', type: 'social', effects: { readMind: true } },
      { id: 'rhetoric_master', name: '话术大师', desc: '说服/谈判/欺诈成功率+20%', type: 'social', effects: { persuadeRate: 20 } },
      { id: 'noble_bearing', name: '贵族气质', desc: '在人类王国城市中声望+20', type: 'social', effects: { humanRep: 20 } },
    ],
    explore: [
      { id: 'direction_sense', name: '方向感', desc: '地图探索时新区域发现概率+20%，极少迷路', type: 'explore', effects: { discoveryRate: 20, antiLost: true } },
      { id: 'nature_affinity', name: '自然亲和', desc: '野外采集效率+30%，能发现隐藏资源点', type: 'explore', effects: { gatherRate: 30, hiddenRes: true } },
      { id: 'night_vision', name: '夜视者', desc: '黑暗环境中视野范围+50%，不会被黑暗中陷阱偷袭', type: 'explore', effects: { darkVision: 50, darkTrapImmune: true } },
      { id: 'traveler', name: '旅行者', desc: '旅行速度+20%，负重上限+30%', type: 'explore', effects: { travelSpeed: 20, carryWeight: 30 } },
    ],
    special: [
      { id: 'lucky_one', name: '幸运儿', desc: '所有D20骰子判定获得+1修正，负面事件概率降低10%', type: 'special', effects: { diceBonus: 1, negEventReduc: 10 } },
      { id: 'fate_weaver', name: '命运编织者', desc: '每日一次，可重新投掷一次不满意的骰子', type: 'special', effects: { reroll: 1 } },
      { id: 'rift_sense', name: '裂隙感知', desc: '能感知地图上裂隙的存在，对裂隙生物伤害+10%', type: 'special', effects: { riftSense: true, riftDmg: 10 } },
      { id: 'curse_body', name: '诅咒之体', desc: '受到诅咒时反弹30%伤害给施术者，自身额外受到10%诅咒伤害', type: 'special', effects: { curseReflect: 30, cursePenalty: 10 } },
      { id: 'forsaken', name: '神弃者', desc: '神明从未垂青于你。无法使用神术，但神术对你无效。', type: 'special', effects: { noHoly: true, holyImmune: true, npcPenalty: 15, dicePenalty: 1, extraAttrs: 2 } },
    ],
  },

  // 世界状态
  WORLD_STATES: {
    golden_age: {
      name: '光辉时代',
      desc: '魔法繁荣，裂隙尚未大规模出现，王国正值盛世',
      effects: { eventBias: 'positive', npcFavorBonus: 5, priceDiscount: 15, diceBonus: 1 },
    },
    rift_age: {
      name: '裂隙时代',
      desc: '混沌生物从裂隙涌出，王国防线不断收缩，但高回报机会更多',
      effects: { eventBias: 'negative', npcFavorPenalty: -5, priceIncrease: 20, rewardBonus: 30, dangerIncrease: 25 },
    },
  },

  // 地图区域
  MAP_REGIONS: [
    { id: 'town_gate', name: '城镇大门', desc: '艾尔德兰王都的入口，卫兵把守着通往城内的大道。', neighbors: ['market_square', 'forest_edge'], events: ['guard_encounter', 'merchant_arrival'] },
    { id: 'market_square', name: '集市广场', desc: '热闹的集市，商贩叫卖着来自各地的商品。', neighbors: ['town_gate', 'tavern', 'temple'], events: ['trade_opportunity', 'pickpocket', 'show_announcement'] },
    { id: 'tavern', name: '冒险者酒馆', desc: '冒险者们聚集的地方，可以招募队友或接取委托。', neighbors: ['market_square', 'dark_alley'], events: ['recruit_board', 'drunk_brawl', 'mysterious_stranger'] },
    { id: 'temple', name: '光明神殿', desc: '供奉幸运女神埃莉希亚的神殿，神职人员在此祷告。', neighbors: ['market_square', 'graveyard'], events: ['healing_service', 'holy_quest', 'pilgrim_encounter'] },
    { id: 'forest_edge', name: '森林边缘', desc: '幽暗森林的入口，树木遮天蔽日，远处传来野兽的嚎叫。', neighbors: ['town_gate', 'deep_forest', 'river_crossing'], events: ['wolf_attack', 'herb_gathering', 'hidden_cave'] },
    { id: 'deep_forest', name: '幽暗森林深处', desc: '越深入森林，魔法气息越浓厚。精灵的遗迹散落在林中。', neighbors: ['forest_edge', 'elf_ruins', 'rift_zone'], events: ['elf_encounter', 'ancient_trap', 'treasure_chest'] },
    { id: 'dark_alley', name: '暗巷', desc: '酒馆后面的小巷，黑市交易和秘密会面在这里进行。', neighbors: ['tavern', 'underground'], events: ['black_market', 'thug_ambush', 'secret_meeting'] },
    { id: 'graveyard', name: '墓园', desc: '古老的墓园，墓碑上刻着被遗忘的名字。', neighbors: ['temple', 'underground'], events: ['undead_rising', 'grave_robber', 'hidden_tomb'] },
    { id: 'underground', name: '地下通道', desc: '城市下方的古老通道，连接着不为人知的秘密。', neighbors: ['dark_alley', 'graveyard', 'sewer'], events: ['smuggler_den', 'ancient_door', 'rat_swarm'] },
    { id: 'river_crossing', name: '河畔渡口', desc: '宽阔的河流在此变得平缓，是往来商旅的必经之路。', neighbors: ['forest_edge', 'bandit_camp', 'sewer'], events: ['bridge_guard', 'drowning_rescue', 'troll_under_bridge'] },
    { id: 'bandit_camp', name: '强盗营地', desc: '一伙强盗占据了这片区域，篝火在营地中央燃烧。', neighbors: ['river_crossing'], events: ['bandit_boss', 'hostage_rescue', 'weapon_cache'] },
    { id: 'elf_ruins', name: '精灵废墟', desc: '古代精灵文明的遗迹，魔法符文仍在墙壁上闪烁。', neighbors: ['deep_forest', 'rift_zone'], events: ['ancient_spirit', 'magic_artifact', 'riddle_door'] },
    { id: 'rift_zone', name: '裂隙区域', desc: '空气中弥漫着混沌的能量，一道裂隙在半空中扭曲着现实。', neighbors: ['deep_forest', 'elf_ruins'], events: ['rift_monster', 'chaos_energy', 'rift_whisper'] },
    { id: 'sewer', name: '下水道', desc: '城市地下的排水系统，恶臭扑鼻，但也是不被注意的秘密通道。', neighbors: ['river_crossing', 'underground'], events: ['sewer_beast', 'lost_item', 'hidden_passage'] },
  ],

  // 敌人模板
  ENEMIES: {
    wolf: { name: '灰狼', hp: 30, atk: 8, def: 3, exp: 20, gold: 5, desc: '一只饥饿的灰狼，眼中闪着绿光。' },
    bandit: { name: '强盗', hp: 45, atk: 10, def: 5, exp: 35, gold: 15, desc: '衣衫褴褛的强盗，挥舞着生锈的短剑。' },
    skeleton: { name: '骷髅兵', hp: 25, atk: 6, def: 8, exp: 25, gold: 3, desc: '一具会动的骷髅，空洞的眼眶中闪烁着幽光。' },
    goblin: { name: '哥布林', hp: 20, atk: 7, def: 2, exp: 15, gold: 10, desc: '绿色皮肤的小怪物，叽叽喳喳地叫着。' },
    dark_mage: { name: '暗影法师', hp: 35, atk: 14, def: 4, exp: 50, gold: 30, desc: '被黑暗魔法侵蚀的法师，周身环绕着暗影能量。' },
    troll: { name: '巨魔', hp: 80, atk: 18, def: 10, exp: 100, gold: 60, desc: '巨大的怪物，皮肤如同岩石般坚硬。' },
    rift_beast: { name: '裂隙兽', hp: 60, atk: 16, def: 6, exp: 80, gold: 40, desc: '从裂隙中涌出的混沌生物，形态不断扭曲变化。' },
    dragon_whelp: { name: '幼龙', hp: 100, atk: 22, def: 12, exp: 200, gold: 150, desc: '一条年幼的龙，但已经足够危险。鳞片上闪烁着微光。' },
  },

  // 初始物品
  STARTER_ITEMS: {
    warrior: [{ name: '铁剑', type: 'weapon', atk: 5, desc: '一把普通的铁剑。' }, { name: '皮甲', type: 'armor', def: 3, desc: '简单的皮制护甲。' }, { name: '治疗药水', type: 'consumable', heal: 20, qty: 2, desc: '回复20点生命值。' }],
    mage: [{ name: '学徒法杖', type: 'weapon', atk: 3, magicAtk: 8, desc: '一根刻有基础符文的法杖。' }, { name: '法师袍', type: 'armor', def: 1, magicDef: 5, desc: '轻便的法师长袍。' }, { name: '法力药水', type: 'consumable', mana: 20, qty: 2, desc: '回复20点法力值。' }],
    rogue: [{ name: '匕首', type: 'weapon', atk: 4, critRate: 10, desc: '一把锋利的匕首。' }, { name: '轻甲', type: 'armor', def: 2, dodgeBonus: 5, desc: '轻便的皮甲。' }, { name: '烟雾弹', type: 'consumable', escape: true, qty: 1, desc: '投掷后产生烟雾，可用于逃跑。' }],
    cleric: [{ name: '战锤', type: 'weapon', atk: 4, holyDmg: 6, desc: '一柄受祝福的战锤。' }, { name: '链甲', type: 'armor', def: 4, desc: '轻便的链甲。' }, { name: '圣水', type: 'consumable', heal: 15, cleanse: true, qty: 2, desc: '受祝福的圣水，可治疗并驱散负面状态。' }],
  },
};
