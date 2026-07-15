// 艾尔德兰编年史 - 全局配置

// 引入物品系统常量
const { EQUIPMENT_QUALITIES, EQUIPMENT_SLOTS, CLASS_ARMOR_NAMES } = require('./item-system');

module.exports = {
  // 装备品质配置（供客户端使用）
  EQUIPMENT_QUALITIES,
  EQUIPMENT_SLOTS,
  CLASS_ARMOR_NAMES,
  PORT: process.env.PORT || 3001,
  
  // AI 引擎配置 - 从环境变量加载（推荐使用 .env 文件，请勿提交到 git）
  AI: {
    provider: process.env.AI_PROVIDER || 'agnes',
    apiKey: process.env.AI_API_KEY || '',
    model: process.env.AI_MODEL || 'agnes-2.0-flash',
    apiEndpoint: process.env.AI_ENDPOINT || 'https://apihub.agnes-ai.com/v1/chat/completions',
  },

  // 种族定义
  RACES: {
    human: { name: '人类', desc: '均衡，适应性强，擅长贸易、外交和战争', str: 10, agi: 10, int: 10, cha: 12, bonuses: { trade: 10, diplomacy: 10 }, faction: 'good_order' },
    elf: { name: '精灵', desc: '长寿、敏捷、与自然共鸣，掌握古老魔法和弓箭技艺', str: 8, agi: 14, int: 12, cha: 10, bonuses: { magic: 10, archery: 15, nature: 15 }, faction: 'good_order' },
    dwarf: { name: '矮人', desc: '坚韧、力量强大、擅长锻造', str: 14, agi: 8, int: 10, cha: 8, bonuses: { smith: 20, defense: 10, endurance: 10 }, faction: 'neutral_order' },
    orc: { name: '兽人', desc: '勇猛、尚武、氏族社会，崇尚力量与荣耀', str: 16, agi: 10, int: 6, cha: 6, bonuses: { melee: 15, intimidation: 15, survival: 10 }, faction: 'evil_order' },
    undead: { name: '亡灵', desc: '曾是凡人，在死亡中觉醒。天生亲和暗影、暗杀与死灵魔法，被生者惧怕', str: 6, agi: 14, int: 14, cha: 2, bonuses: { shadowMagic: 20, assassination: 15, necromancy: 20, undeadResist: 30 }, faction: 'evil_order' },
  },

  // 职业定义
  CLASSES: {
    warrior: { name: '战士', desc: '近战专家，保家卫国的钢铁长城', primaryStat: 'str', hpBonus: 20, skills: ['猛击', '格挡', '战吼', '旋风斩'], raceRestrictions: null },
    mage: { name: '法师', desc: '信仰魔法之神的高贵奥术使用者', primaryStat: 'int', hpBonus: 5, skills: ['火球术', '冰霜术', '奥术飞弹', '魔法护盾'], raceRestrictions: null },
    rogue: { name: '游荡者', desc: '潜行于阴影，偷窃、开锁、暗杀的街头生存者', primaryStat: 'agi', hpBonus: 10, skills: ['偷袭', '开锁', '潜行', '涂毒'], raceRestrictions: null },
    cleric: { name: '牧师', desc: '圣光之神的虔诚信徒，以神术治愈与守护', primaryStat: 'cha', hpBonus: 15, skills: ['治疗术', '圣光', '驱散', '祝福'], raceRestrictions: ['human', 'elf', 'dwarf', 'orc'] },
    druid: { name: '德鲁伊', desc: '自然之力的化身，与万物生灵共鸣的守护者。精灵天生德鲁伊，人类需经严苛修行方可被接纳', primaryStat: 'int', hpBonus: 12, skills: ['自然变形', '荆棘缠绕', '生命绽放', '野兽召唤'], raceRestrictions: ['elf', 'human'] },
    paladin: { name: '圣骑士', desc: '身披圣光的骑士，圣光庇佑生者但亡者无法承受其灼热', primaryStat: 'cha', hpBonus: 18, skills: ['圣光斩', '神圣护盾', '治愈之手', '制裁之锤'], raceRestrictions: ['human', 'elf', 'dwarf', 'orc'] },
    shaman: { name: '萨满', desc: '与先祖之灵沟通的兽人灵魂行者，矮人也因与大地和先祖的深厚联系而被祖灵接纳', primaryStat: 'int', hpBonus: 14, skills: ['先祖之怒', '图腾召唤', '元素共鸣', '灵魂链接'], raceRestrictions: ['orc', 'dwarf'] },
  },

  // ===== 种族天赋（固定被动，随种族自动获得） =====
  RACIAL_TRAITS: {
    human: {
      id: 'versatile', name: '多才多艺', icon: '🌟',
      desc: '人类是天生的适应者，在万千领域中找到自己的位置。所有属性+1，经验获取+5%，交易价格优惠5%。',
      effects: { allStats: 1, expBonus: 5, discount: 5 },
    },
    elf: {
      id: 'natures_child', name: '自然之子', icon: '🍃',
      desc: '精灵与森林同呼吸共命运。自然环境中感知+15%，自然系魔法效果+10%，可与小型动物简单沟通。',
      effects: { naturePerception: 15, natureMagic: 10, animalTalk: 'small' },
    },
    dwarf: {
      id: 'master_smith', name: '锻造大师', icon: '🔨',
      desc: '每一个矮人从学会走路起就开始握锤。锻造/修理装备成功率+20%，火焰抗性+15%，负重上限+20%。',
      effects: { smithBonus: 20, fireResist: 15, carryWeight: 20 },
    },
    orc: {
      id: 'blood_fury', name: '血性狂暴', icon: '💢',
      desc: '兽人的血液中燃烧着世代相传的战斗怒火。生命低于30%时伤害+15%，免疫恐惧效果，击杀后回复5%HP。',
      effects: { lowHpThreshold: 30, lowHpDmg: 15, fearImmune: true, killHeal: 5 },
    },
    undead: {
      id: 'undead_body', name: '亡灵之躯', icon: '🦴',
      desc: '死亡重塑了你的存在。免疫毒素、疾病和流血，暗影伤害+10%，不需要呼吸与睡眠。但圣光对你额外造成25%伤害。',
      effects: { poisonImmune: true, diseaseImmune: true, bleedImmune: true, shadowDmg: 10, holyDmgTaken: 25, noBreath: true, noSleep: true },
    },
  },

  // ===== 种族-职业兼容性说明 =====
  RACE_CLASS_LORE: {
    human_druid: '人类德鲁伊极为罕见——他们并非在圣林中长大，而是通过漫长的修行和与自然的深度共鸣，被精灵德鲁伊导师认可后才被接纳。每一位人类德鲁伊的背后，都有一位精灵导师为其作保。',
    human_shaman: '人类萨满是学者型的灵魂行者。他们没有兽人的祖灵血脉，但通过对灵魂学和元素学说的深入研究，学会了与精魂沟通的方法。兽人萨满对他们既尊敬又警惕。',
    dwarf_shaman: '矮人萨满崇拜大地与熔炉中的先祖之灵。他们的萨满之道与兽人不同——不借助图腾柱，而是通过在岩浆与矿石中聆听先祖的回响。矮人称之为「熔炉之声」。',
  },

  // ===== 三大阵营系统 =====
  FACTIONS: {
    good_order: {
      name: '善良守序联盟',
      emoji: '🛡️',
      desc: '人类与精灵结成的联盟，以圣光与自然的名义守护大陆的秩序与光明。成员：人类、精灵。',
      members: ['human', 'elf'],
      color: '#4a9eff',
    },
    evil_order: {
      name: '邪恶守序部落',
      emoji: '💀',
      desc: '兽人与亡灵组成的部落，在死亡与荣耀的旗帜下寻求力量与复仇。成员：兽人、亡灵。',
      members: ['orc', 'undead'],
      color: '#c0392b',
    },
    neutral_order: {
      name: '中立守序阵营',
      emoji: '⚖️',
      desc: '矮人与其他独立种族组成的阵营，在两大势力的夹缝中追求交易与和平。成员：矮人及后续种族。',
      members: ['dwarf'],
      color: '#f39c12',
    },
  },

  // 阵营间声望（恒定值，不随游戏进程改变）
  FACTION_REPUTATION: {
    // 同阵营：使用 CLASS_REPUTATION 正常值
    // 敌对阵营（善恶互斥）：仇恨
    opposite: -60,   // 憎恨
    // 中立阵营对任意阵营：冷漠
    neutral: 0,      // 冷漠
  },

  // 种族首都
  RACIAL_CAPITALS: {
    human: { name: '奥尔兰多', desc: '人类王国的辉煌首都，高耸的白色城墙守护着百万子民，王座厅中悬挂着历代君王的旗帜。' },
    elf: { name: '海兰贝尔', desc: '精灵王国的首都，一座依托在参天巨树「永翠之心」上的奇迹之城，银色的枝叶间闪烁着永恒的星光。' },
    dwarf: { name: '卡扎杜姆', desc: '矮人王国的心脏，一座由黑铁和秘银在活火山内部凿出的地下堡垒，锻造的火光永不停歇。' },
    orc: { name: '格罗玛什', desc: '兽人氏族的圣地，荒原上由巨兽骸骨与黑石建成的要塞，先祖的战歌在风中永不停息。' },
    undead: { name: '莫尔迪斯', desc: '亡灵的都城，一座被永恒暗影笼罩的亡者之城。尖塔由黑曜石铸造，街道上游荡着无休的亡魂。在这座没有生者的都城中，亡灵们找到了他们的归宿与力量。' },
  },

  // 出生地（种族都会 + 职业地点）
  BIRTH_LOCATIONS: {
    human: {
      warrior: { place: '王国军营', capitalDesc: '奥尔兰多', story: '奥尔兰多的军营中，从小接受严格的军事训练，守卫着人类王国的荣光。' },
      mage: { place: '皇家魔法学院', capitalDesc: '奥尔兰多', story: '奥尔兰多的皇家魔法学院里，在博学导师的指引下研习奥术的奥秘。' },
      rogue: { place: '下城区暗巷', capitalDesc: '奥尔兰多', story: '奥尔兰多贫民窟的阴影中，用双手在泥泞中摸索出一条生存之路。' },
      cleric: { place: '光明大教堂', capitalDesc: '奥尔兰多', story: '奥尔兰多的光明大教堂，作为一名见习牧师开始了侍奉圣光之神的道路。' },
      paladin: { place: '圣殿骑士团', capitalDesc: '奥尔兰多', story: '奥尔兰多的圣殿骑士团总部，从小接受信仰与剑术的双重训练。' },
      druid: { place: '精灵导师的修道院', capitalDesc: '奥尔兰多', story: '你是极少数被精灵德鲁伊导师选中的人类。在奥尔兰多郊外的修道院中，你花费了十年时间学习倾听风与树的语言——你的精灵导师说，你的灵魂比大多数精灵更贴近自然。' },
      shaman: { place: '灵魂学研究院', capitalDesc: '奥尔兰多', story: '奥尔兰多皇家学院的灵魂学研究院中，你通过学术方法而非血脉传承成为了一名萨满。你研读了数百部关于灵魂与元素的古籍——兽人萨满们称你为「纸上的灵魂行者」，但你的确能与精魂对话。' },
    },
    elf: {
      warrior: { place: '翡翠卫队营地', capitalDesc: '海兰贝尔', story: '海兰贝尔的巨树顶端，在翡翠卫队中磨炼箭术与近战技艺。' },
      mage: { place: '星辰魔导师塔', capitalDesc: '海兰贝尔', story: '海兰贝尔的星辰魔导师塔内，被古老精灵的奥术智慧所环绕。' },
      rogue: { place: '银月暗影公会', capitalDesc: '海兰贝尔', story: '海兰贝尔巨树根部幽暗的洞穴中，银月暗影公会教会了你黑暗中的艺术。' },
      cleric: { place: '星光圣所', capitalDesc: '海兰贝尔', story: '海兰贝尔树冠之巅的星光圣所，在月光与星辉中虔诚祈祷。' },
      druid: { place: '永恒圣林', capitalDesc: '海兰贝尔', story: '海兰贝尔深处的永恒圣林中，在千年古树的低语中感悟自然之道。万物生灵天生对你亲近，你能听懂草木的窃窃私语，感知森林的每一次呼吸。' },
      paladin: { place: '暮光圣殿', capitalDesc: '海兰贝尔', story: '海兰贝尔的暮光圣殿中，圣光透过无尽的枝叶洒下，照耀着精灵圣骑士的誓言。' },
    },
    dwarf: {
      warrior: { place: '熔炉军团要塞', capitalDesc: '卡扎杜姆', story: '卡扎杜姆的熔炉军团中，在岩浆的炽热与铁砧的轰鸣中铸就坚不可摧的体魄。' },
      mage: { place: '秘银符文厅', capitalDesc: '卡扎杜姆', story: '卡扎杜姆的秘银符文厅内，矮人独有的符文魔法在大地深处闪闪发光。' },
      rogue: { place: '暗巷隧道', capitalDesc: '卡扎杜姆', story: '卡扎杜姆废弃的暗巷隧道中，在无人问津的角落学会了生存的技艺。' },
      cleric: { place: '先祖熔炉圣殿', capitalDesc: '卡扎杜姆', story: '卡扎杜姆的先祖熔炉圣殿里，在永恒燃烧的圣火前献上虔诚的祈祷。' },
      paladin: { place: '黑铁圣堂', capitalDesc: '卡扎杜姆', story: '卡扎杜姆的黑铁圣堂，圣光与钢铁交融，矮人圣骑士在此起誓守护光明。' },
      shaman: { place: '熔炉之声圣所', capitalDesc: '卡扎杜姆', story: '卡扎杜姆最深处的熔岩圣所中，你在沸腾的岩浆旁听见了先祖在矿石中的低语。矮人的萨满之道叫做「熔炉之声」——不是兽人的图腾与战歌，而是在金属与火焰中传承的古老记忆。' },
    },
    orc: {
      warrior: { place: '血吼练兵场', capitalDesc: '格罗玛什', story: '格罗玛什的血吼练兵场上，在兽人战士的咆哮声中打磨战斗的野性本能。' },
      mage: { place: '元素图腾柱', capitalDesc: '格罗玛什', story: '格罗玛什的元素图腾柱之间，兽人法师们向来稀少，你却是天赋异禀的一个。' },
      rogue: { place: '荒原拾荒者营地', capitalDesc: '格罗玛什', story: '格罗玛什边缘的拾荒者营地，在荒野求生的残酷法则中长大的你学会了不择手段。' },
      cleric: { place: '圣光图腾殿', capitalDesc: '格罗玛什', story: '格罗玛什的圣光图腾殿，圣光之神不顾兽人先祖的非议接纳了你——或者说，祂需要你。' },
      shaman: { place: '先祖之魂祭坛', capitalDesc: '格罗玛什', story: '格罗玛什最神圣的先祖祭坛前，你能听见历代兽人先祖在风中低语。你不信仰神明——你信仰的是流淌在你血脉中的祖灵之力。' },
      paladin: { place: '战歌圣殿', capitalDesc: '格罗玛什', story: '格罗玛什的战歌圣殿，兽人圣骑士在先祖与圣光的双重祝福下举起战锤。' },
    },
    undead: {
      warrior: { place: '亡骨军团营房', capitalDesc: '莫尔迪斯', story: '莫尔迪斯的亡骨军团营房——你曾是战场上的一名勇士，战死后在黑暗仪式中重新站起。你的剑依旧锋利，但你的心跳已永远停歇。' },
      mage: { place: '暗影学院', capitalDesc: '莫尔迪斯', story: '莫尔迪斯的暗影学院里，亡灵法师们钻研着生者不敢触碰的禁忌知识。你在这里掌握了暗影与死灵魔法的精髓，死亡对你而言只是另一种力量形态。' },
      rogue: { place: '幽影回廊', capitalDesc: '莫尔迪斯', story: '莫尔迪斯的幽影回廊中，你的脚步声永远不会被生者听见。作为亡灵刺客，你在死寂中学会了比任何活着的暗杀者更高明的潜行与暗杀技艺。' },
    },
  },

  // 声望等级体系
  REPUTATION_TIERS: [
    { name: '忠诚不渝', value: 100, desc: '愿为你赴汤蹈火，牺牲一切。' },
    { name: '狂热', value: 80, desc: '对你的信仰或理念极度狂热。' },
    { name: '爱戴', value: 65, desc: '真心爱戴你，视你为重要的存在。' },
    { name: '崇拜', value: 50, desc: '对你的能力和事迹由衷崇拜。' },
    { name: '敬重', value: 35, desc: '对你保持高度的敬意和尊重。' },
    { name: '友善', value: 20, desc: '对你态度友好，愿意提供帮助。' },
    { name: '冷漠', value: 0, desc: '对你没有任何特别的看法，既不亲近也不排斥。' },
    { name: '冷酷', value: -15, desc: '对你态度冷淡疏远，不太愿意搭理。' },
    { name: '厌恶', value: -30, desc: '对你感到明显的反感和厌恶。' },
    { name: '憎恶', value: -45, desc: '对你充满憎恶之意。' },
    { name: '憎恨', value: -60, desc: '恨不得你从世上消失。' },
    { name: '怨憎', value: -80, desc: '对你怀有深重的怨恨和诅咒。' },
    { name: '永世为敌', value: -100, desc: '不共戴天之仇，世世代代都要追杀你。' },
  ],

  // 各职业初始声望值
  CLASS_REPUTATION: {
    warrior: 20,    // 友善 - 保家卫国受人尊敬
    mage: 20,       // 友善 - 高贵的法师受人尊敬
    cleric: 20,     // 友善 - 圣光信徒受人尊敬
    paladin: 20,    // 友善 - 圣骑士受人尊敬
    druid: 10,      // 偏友善 - 自然守护者，但有些地方不为人知
    shaman: 5,      // 偏中立 - 先祖信仰在主流社会略显异端
    rogue: 0,       // 冷漠 - 人人喊打的街头老鼠
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
    wild: [
      { id: 'nature_affinity', name: '自然亲和', desc: '与自然界的精魂有着天然的默契。野外采集效率+30%，能发现隐藏资源点，对野兽类敌人伤害+10%。', type: 'wild', effects: { gatherRate: 30, hiddenRes: true, beastDmg: 10 } },
      { id: 'beast_instinct', name: '野兽直觉', desc: '像野兽一样感知危险。先攻+15%，不会被突袭，战斗中闪避率+5%。', type: 'wild', effects: { initiative: 15, ambushImmune: true, dodge: 5 } },
      { id: 'primal_vitality', name: '原始活力', desc: '远古的血脉赋予你超常的生命力。HP上限+15%，自然恢复速度翻倍，对毒素抗性+20%。', type: 'wild', effects: { hpBonus: 15, regenBonus: 100, poisonResist: 20 } },
      { id: 'elemental_touch', name: '元素之触', desc: '无须学习便能感知元素流动。获得基础元素戏法能力（点燃、造水、微风），元素抗性+8%。', type: 'wild', effects: { elementalTricks: true, elemResist: 8 } },
    ],
    explore: [
      { id: 'direction_sense', name: '方向感', desc: '地图探索时新区域发现概率+20%，极少迷路', type: 'explore', effects: { discoveryRate: 20, antiLost: true } },
      { id: 'night_vision', name: '夜视者', desc: '黑暗环境中视野范围+50%，不会被黑暗中陷阱偷袭', type: 'explore', effects: { darkVision: 50, darkTrapImmune: true } },
      { id: 'traveler', name: '旅行者', desc: '旅行速度+20%，负重上限+30%', type: 'explore', effects: { travelSpeed: 20, carryWeight: 30 } },
      { id: 'treasure_hunter', name: '寻宝者', desc: '发现隐藏宝箱的概率+25%，宝箱金币数量+15%', type: 'explore', effects: { treasureFind: 25, goldBonus: 15 } },
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
      desc: '魔法繁荣，王国正值盛世。十一贤者之首雷克斯·秘法尚在人世，年轻的晨曦帝王正在书写他的传奇。众多传奇NPC等待着你与之相遇。',
      mode: 'story',
      modeLabel: '📖 剧情模式（单人沉浸体验）',
      effects: { eventBias: 'positive', npcFavorBonus: 5, priceDiscount: 15, diceBonus: 1, richNPCs: true },
    },
    decline_age: {
      name: '没落时代',
      desc: '战争席卷了整片大陆，三大阵营鼎立而争。重要人物已然陨落，但属于玩家的史诗才刚刚开始——阵营争霸，由你书写。',
      mode: 'pvp',
      modeLabel: '⚔️ 阵营争霸（多人竞技对战）',
      effects: { eventBias: 'negative', npcFavorPenalty: -5, priceIncrease: 20, rewardBonus: 30, dangerIncrease: 25, factionWarfare: true },
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

  // 敌人模板（按难度分级：🟢简单 🟡中等 🔴困难 💀精英）
  ENEMIES: {
    // 🟢 简单级 (Lv1-5 推荐)
    slime: { name: '史莱姆', hp: 15, atk: 4, def: 1, exp: 10, gold: 3, tier: 1, desc: '一坨半透明的胶状生物，在地面上缓慢蠕动。虽然看起来人畜无害，但它的酸性体液能腐蚀衣物和皮肤。新手冒险者的第一个挑战。' },
    giant_rat: { name: '巨鼠', hp: 18, atk: 6, def: 2, exp: 12, gold: 4, tier: 1, desc: '比普通老鼠大三倍的啮齿动物，牙齿尖锐得足以咬穿皮革。下水道和暗巷是它们的领地。' },
    goblin: { name: '哥布林', hp: 20, atk: 7, def: 2, exp: 15, gold: 10, tier: 1, desc: '绿色皮肤的小怪物，叽叽喳喳地叫着。虽然单体不强，但它们很少单独出现。' },
    wild_boar: { name: '野猪', hp: 28, atk: 9, def: 4, exp: 18, gold: 5, tier: 1, desc: '一头鬃毛竖立的野猪，獠牙锋利。冲撞起来能把一个成年人撞飞。森林边缘的常见威胁。' },
    // 🟡 中等级 (Lv3-8 推荐)
    wolf: { name: '灰狼', hp: 30, atk: 8, def: 3, exp: 20, gold: 5, tier: 2, desc: '一只饥饿的灰狼，眼中闪着绿光。狼群配合默契，一旦被包围就很难脱身。' },
    skeleton: { name: '骷髅兵', hp: 25, atk: 6, def: 8, exp: 25, gold: 3, tier: 2, desc: '一具会动的骷髅，空洞的眼眶中闪烁着幽光。对物理穿刺有一定抗性，但钝器是它的克星。' },
    forest_spider: { name: '森林蜘蛛', hp: 22, atk: 10, def: 3, exp: 22, gold: 8, tier: 2, desc: '一只巨大的森林蜘蛛，八条毛茸茸的腿撑起桌面大的身躯。它的毒液能让猎物麻痹。' },
    bandit: { name: '强盗', hp: 45, atk: 10, def: 5, exp: 35, gold: 15, tier: 2, desc: '衣衫褴褛的强盗，挥舞着生锈的短剑。为了几枚金币什么都干得出来。' },
    sewer_beast: { name: '下水道怪物', hp: 38, atk: 11, def: 6, exp: 30, gold: 10, tier: 2, desc: '下水道深处的变异生物，身上覆满污秽的黏液，散发着令人作呕的恶臭。传说是一个失败炼金实验的产物。' },
    // 🔴 困难级 (Lv6-12 推荐)
    dark_mage: { name: '暗影法师', hp: 35, atk: 14, def: 4, exp: 50, gold: 30, tier: 3, desc: '被黑暗魔法侵蚀的法师，周身环绕着暗影能量。施法时双眼会发出不祥的紫色光芒。' },
    shadow_wraith: { name: '暗影幽魂', hp: 28, atk: 16, def: 2, exp: 45, gold: 20, tier: 3, desc: '一个由纯粹的暗影能量构成的半透明生物。物理攻击很难命中它——它像烟雾一样飘忽不定。圣光是它唯一的弱点。' },
    stone_golem: { name: '石魔像', hp: 65, atk: 15, def: 12, exp: 65, gold: 35, tier: 3, desc: '一座由魔法赋予生命的石像。动作缓慢但每一击都势大力沉。对魔法有不错的抗性。' },
    bandit_boss: { name: '强盗头目', hp: 70, atk: 16, def: 8, exp: 75, gold: 50, tier: 3, desc: '强盗营地的首领，身材魁梧，手持一把沾满血迹的斧头。他的脸上有道横跨整张脸的旧伤疤——那是他骄傲的勋章。' },
    troll: { name: '巨魔', hp: 80, atk: 18, def: 10, exp: 100, gold: 60, tier: 3, desc: '巨大的怪物，皮肤如同岩石般坚硬。最可怕的是它的再生能力——如果不持续攻击，伤势会迅速痊愈。' },
    // 💀 精英/首领级 (Lv10+ 推荐)
    rift_beast: { name: '裂隙兽', hp: 60, atk: 16, def: 6, exp: 80, gold: 40, tier: 4, desc: '从裂隙中涌出的混沌生物，形态不断扭曲变化。它不属于这个世界，所以也不完全遵循这个世界的规则。' },
    basilisk: { name: '石化蜥蜴', hp: 90, atk: 20, def: 14, exp: 150, gold: 100, tier: 4, desc: '巨大的蜥蜴状怪物，据说其目光能将活物变为石像。头部有冠状角——那是它力量的来源。' },
    necromancer: { name: '亡灵法师', hp: 50, atk: 18, def: 5, exp: 120, gold: 80, tier: 4, desc: '一位背叛了死亡的法师。他的身体已经腐朽，但意志依然强大。能召唤亡灵仆从为他战斗。' },
    dragon_whelp: { name: '幼龙', hp: 100, atk: 22, def: 12, exp: 200, gold: 150, tier: 4, desc: '一条年幼的龙，但已经足够危险。鳞片上闪烁着微光，喉咙深处隐约可见火焰的光芒。' },
    orc_warchief: { name: '兽人战酋', hp: 120, atk: 24, def: 15, exp: 250, gold: 180, tier: 4, desc: '一名身经百战的兽人战帮首领，身上每道伤疤都在诉说着一个关于战斗与荣耀的故事。他的战吼能让大地颤抖。' },
    // ⭐ 区域BOSS级
    ancient_troll: { name: '远古巨魔', hp: 180, atk: 28, def: 16, exp: 400, gold: 300, tier: 5, desc: '在地下通道中存活了数百年的超级巨魔，体型是普通巨魔的两倍。它的再生能力已经达到了几乎不死不灭的程度——据说只有火焰和酸能阻止它。' },
    rift_lord: { name: '裂隙领主', hp: 160, atk: 30, def: 12, exp: 500, gold: 350, tier: 5, desc: '裂隙区域的主宰者，一个由混沌能量凝聚而成的恐怖存在。它的形态在现实与虚空中不断变换——你永远不知道下一秒它会变成什么。' },
  },

  // 武器精通（职业专属武器类型）——会影响战斗中武器的发挥和NPC对你的认知
  WEAPON_PROFICIENCY: {
    warrior: { type: '双手剑', icon: '⚔️', desc: '战士天生精通双手重剑，挥舞如风。单手武器亦可使用，但双手剑才是战士的灵魂。' },
    paladin: { type: '单手剑+盾', icon: '🗡️🛡️', desc: '圣骑士右手持剑、左手擎盾，圣光与钢铁并存。单手剑的精准与盾牌的守护是圣骑士的信仰之道。' },
    mage: { type: '法杖', icon: '🪄', desc: '法师以法杖引导魔力。法杖是奥术的延伸——没有法杖的法师如同折翼的飞鸟。' },
    cleric: { type: '法杖', icon: '🪄', desc: '牧师手持圣光法杖，以信仰引导治愈之力。法杖承载着圣光之神的赐福。' },
    druid: { type: '法杖', icon: '🌿', desc: '德鲁伊的自然之杖是活着的——藤蔓缠绕、叶片摇曳，与自然共鸣。' },
    shaman: { type: '法杖', icon: '🪨', desc: '萨满的图腾法杖承载着先祖之魂的力量，每一次敲击都是与祖灵的对话。' },
    rogue: { type: '匕首', icon: '🗡️', desc: '游荡者以匕首为生——轻巧、致命、无影。匕首是阴影中的最佳伙伴。' },
  },

  // 初始物品（职业专属新手装备包）
  STARTER_ITEMS: {
    // ⚔️ 战士 —— 双手剑、军营勋章、麦酒、药水、冲锋训练费
    warrior: [
      { name: '铁铸双手剑', type: 'weapon', weaponType: '双手剑', atk: 8, desc: '一把厚重的铁铸双手巨剑，剑身上刻着王国军队的徽记。这是你入伍时从军需官手中接过的第一把武器——沉甸甸的，却让你感到安心。' },
      { name: '士兵链甲', type: 'armor', def: 4, desc: '标准的王国士兵链甲，肩甲处有一道浅浅的划痕——那是你在训练场上留下的第一道"勋章"。' },
      { name: '青铜军徽', type: 'key', desc: '一枚沉甸甸的青铜徽章，正面铸着交叉的双剑。持此徽章可自由出入王国军营、申请晋升军衔考核。这是你身为王国士兵的证明。', lore: true },
      { name: '麦酒', type: 'consumable', heal: 15, drunk: true, qty: 2, desc: '一壶粗犷的军营麦酒。辛辣、苦涩、后劲十足。喝一口能提神醒脑——喝一壶能让你忘掉明天的操练。老兵们说：不会喝酒的战士不是好战士。' },
      { name: '生命药水', type: 'consumable', heal: 25, qty: 5, desc: '军医发放的标准恢复药水，装在粗糙的陶瓶中。虽然味道像泥巴，但确实能救命。' },
      { name: '银币', type: 'currency', value: 1, desc: '一枚亮闪闪的银币，刚好足够向训练教官学习基础技能「冲锋」。这是你攒了一个月的军饷。' },
    ],
    // 🔮 法师 —— 法杖、推荐信、银币（奥术/火焰/冰霜飞弹）、药水
    mage: [
      { name: '学徒法杖', type: 'weapon', weaponType: '法杖', atk: 3, magicAtk: 8, desc: '一根由皇家魔法学院统一配发的学徒法杖，杖头镶嵌着一颗微微发光的奥术水晶。杖身上刻着初阶符文——虽然你还不能完全读懂它们，但它们已经开始回应你的触碰了。' },
      { name: '法师学徒长袍', type: 'armor', def: 1, magicDef: 5, desc: '皇家魔法学院的制式学徒长袍，深蓝色面料上绣着银色的星辰图案。穿上它，你就是学院认可的一员了。' },
      { name: '入学推荐信', type: 'key', desc: '一封用火漆封缄的信件，寄信人是你的启蒙导师。信中推荐你进入皇家魔法学院深造奥术之道——这是每一个法师学徒梦寐以求的起点。将信交给学院门卫即可正式入学。', lore: true },
      { name: '银币', type: 'currency', value: 1, desc: '一枚银币——刚好足够购买一个初阶攻击法术卷轴：奥术飞弹、火焰飞弹或冰霜飞弹。选择你的第一个攻击法术，它将伴随你走过漫长的学徒生涯。' },
      { name: '生命药水', type: 'consumable', heal: 20, qty: 10, desc: '学院医务室配发的恢复药水，装在细长的玻璃瓶中。魔法实验出意外是家常便饭——学院在这方面从不吝啬。' },
      { name: '法力药水', type: 'consumable', mana: 25, qty: 10, desc: '闪烁着淡蓝色光芒的魔力药剂。每一口都能感受到纯粹的奥术能量在体内流淌——但别一次喝太多，否则你的头发会竖起来。' },
    ],
    // 🗡️ 游荡者 —— 双匕首、开锁工具、烟雾弹
    rogue: [
      { name: '暗钢匕首', type: 'weapon', weaponType: '匕首', atk: 5, critRate: 10, desc: '一把精心打磨的暗钢匕首，刃口漆黑无光——在暗巷中这颜色能救你的命。刀柄上的皮革已经被你的手心磨得锃亮。' },
      { name: '副手匕首', type: 'weapon', weaponType: '匕首', atk: 3, offhand: true, desc: '一把短小精悍的副手匕首，适合在贴身搏斗时出其不意。' },
      { name: '轻便皮甲', type: 'armor', def: 2, dodgeBonus: 5, desc: '一件不起眼的灰色皮甲，轻便无声。正面看不出什么——但内衬里缝了几个暗袋。' },
      { name: '开锁工具包', type: 'tool', desc: '一套简陋但实用的开锁工具：几根弯铁丝、一把小锉刀。这是你在贫民窟花了大半年才攒够钱买到的——锁匠不会卖给你，但你认识一个……朋友。', lore: true },
      { name: '烟雾弹', type: 'consumable', escape: true, qty: 2, desc: '自制的小型烟雾弹。摔碎后会炸出一团呛人的灰烟——足够你从最糟糕的局面中脱身。记住：活着才能继续偷。' },
      { name: '生命药水（劣质）', type: 'consumable', heal: 12, qty: 3, desc: '黑市上买的廉价药水，瓶身没有标签。效果比不上正经药水，但胜在便宜——反正你也没钱买更好的。' },
    ],
    // ✝️ 牧师 —— 圣光法杖、圣光药水（亡灵不可用）
    cleric: [
      { name: '圣光法杖', type: 'weapon', weaponType: '法杖', atk: 3, holyDmg: 8, desc: '一柄由光明大教堂祝圣的白橡木法杖，杖头镶嵌着一颗纯净的圣光水晶。当你握住它时，能感受到一道温暖的光流从掌心蔓延至全身——那是圣光之神的触碰。' },
      { name: '见习牧师圣袍', type: 'armor', def: 2, holyDef: 6, desc: '纯白色的见习牧师圣袍，胸口绣着金色的圣光十字纹。穿着它走在街上，路人会向你微微颔首——圣光信徒在任何地方都受到尊敬。' },
      { name: '圣光药水', type: 'consumable', heal: 25, mana: 15, holyBlessed: true, qty: 5, desc: '在光明大教堂圣水池中祝圣过的药水，散发着柔和的白色光芒。每一滴都蕴含着圣光之神的赐福——喝下去仿佛被温暖的阳光包裹。⚠️ 亡灵触碰此药水将遭受灼烧伤害。' },
      { name: '圣光徽记', type: 'key', desc: '一枚银质徽章，中央嵌着一颗微型圣光水晶。持此徽记可在任何光明神殿中获得免费治疗和食宿——你是圣光之神的仆人，神殿就是你的家。', lore: true },
    ],
    // 🌿 德鲁伊 —— 自然之杖、生命之种、自然亲和物品
    druid: [
      { name: '自然之杖', type: 'weapon', weaponType: '法杖', atk: 3, magicAtk: 6, natureAffinity: 10, desc: '一根由千年古树自然脱落的老枝雕成的法杖。藤蔓自然地缠绕其上，顶端常年盛开一朵不凋的小白花。它不是"被制作"的——它是被你"发现"的。' },
      { name: '树叶斗篷', type: 'armor', def: 2, natureDef: 6, desc: '由永恒圣林的落叶编织而成的斗篷，轻若无物，却比任何铠甲都更懂你的呼吸。穿上它，你能感受到周围每一株植物的脉动。' },
      { name: '生命之种', type: 'consumable', heal: 30, qty: 3, desc: '一颗豌豆大小的翠绿色种子，在掌心微微发热。埋入土中瞬间生根发芽，绽放出能治愈重伤的自然之花。每一颗都是圣林的馈赠——请别浪费。' },
      { name: '自然低语卷轴', type: 'key', desc: '一份用树皮制成的古老卷轴，上面用精灵语书写着与自然沟通的基本法则。你的导师在你离开圣林前将它别在你的腰间——"用它聆听风的声音，孩子。"', lore: true },
      { name: '草药包', type: 'consumable', heal: 10, qty: 5, desc: '亲手采集的草药，用麻布包好。薄荷、金盏花、月光苔——每一种都认得你的味道。' },
    ],
    // 🛡️ 圣骑士 —— 单手剑+盾、圣光药水（亡灵不可用）
    paladin: [
      { name: '圣光长剑', type: 'weapon', weaponType: '单手剑', atk: 6, holyDmg: 4, desc: '一柄由圣殿骑士团铁匠精心锻造的单手长剑，剑身上铭刻着神圣符文。剑格处嵌着一颗圣光水晶——在你宣誓的那一刻，它第一次发出光芒。' },
      { name: '圣殿骑士盾', type: 'armor', def: 6, holyDef: 4, desc: '圣殿骑士团的标准骑士盾，正面铸着展翅的圣光之鹰。盾牌内侧刻着你的入团誓词——"以圣光之名，守护一切良善。"' },
      { name: '圣光药水', type: 'consumable', heal: 25, mana: 15, holyBlessed: true, qty: 3, desc: '圣殿骑士团圣餐礼上赐福的药水，瓶身烙印着圣光十字。每一瓶都经过了主教的亲手祝圣。⚠️ 亡灵触碰将遭受严重的圣光灼烧。' },
      { name: '骑士誓约书', type: 'key', desc: '一份羊皮纸誓约书，底部盖着圣殿骑士团的火漆印章。上面写着你的名字和入团日期。这份誓约代表着你将毕生守护圣光与正义——无论面对怎样的黑暗。', lore: true },
      { name: '生命药水', type: 'consumable', heal: 25, qty: 3, desc: '圣殿骑士团医务室配发的恢复药水，品质上乘。骑士团从不亏待自己的成员。' },
    ],
    // 🪨 萨满 —— 图腾战锤、灵魂尘、祖灵信物
    shaman: [
      { name: '图腾战锤', type: 'weapon', weaponType: '法杖', atk: 5, magicAtk: 5, desc: '一把刻满先祖图腾的战锤。每一次敲击，大地都会回应以微弱的震动。锤柄上系着几缕褪色的兽毛——那是历代萨满传下来的祝福。' },
      { name: '兽骨护甲', type: 'armor', def: 4, spiritDef: 4, desc: '由巨兽骸骨打造的护甲，蕴含着先祖之灵的庇护。穿在身上能感到一阵若有若无的暖意——那是祖灵们在注视着你。' },
      { name: '灵魂尘', type: 'consumable', heal: 15, mana: 20, qty: 3, desc: '研磨精细的祖灵骨尘，储存在一个小皮袋中。吸入后能感受到先祖的温暖与力量——那是跨越时空的拥抱。氏族长者说：每一粒骨尘都是一位祖先的祝福。' },
      { name: '先祖符石', type: 'key', desc: '一块打磨光滑的黑曜石符文，上面刻着你的氏族图腾。在格罗玛什的任何地方出示这块符石，兽人们会以兄弟相称——你被先祖承认了。', lore: true },
      { name: '生命药水（氏族配方）', type: 'consumable', heal: 20, qty: 4, desc: '按照氏族古老配方熬制的草药汤剂，装在牛角瓶中。苦得让你龇牙咧嘴，但效果不输任何炼金药水。' },
    ],
    // 💀 亡灵（战士/法师/游荡者的亡灵专属物品）
    undead: [
      { name: '暗影之刃', type: 'weapon', weaponType: '匕首', atk: 5, shadowDmg: 5, desc: '一把被亡者祝福的匕首，刀刃上缠绕着若有若无的暗影。它在黑暗中会微微发出冷光——那是它渴望鲜血的信号。' },
      { name: '腐朽长袍', type: 'armor', def: 2, shadowDef: 6, desc: '用亡灵法师的裹尸布织成的长袍，散发着淡淡的死亡气息。生者闻到这气味会不自觉地退开几步——这正合你意。' },
      { name: '灵魂碎片', type: 'consumable', heal: 10, mana: 10, qty: 3, desc: '一片微微发光的灵魂残片。亡灵可以通过吸收它来恢复力量——虽然那感觉像在吞咽别人的记忆。' },
      { name: '死亡印记', type: 'key', desc: '一枚由黑曜石打造的戒指，戒面上刻着你的死亡日期。在莫尔迪斯，这枚戒指就是你的身份证明——你死了，但你还在。亡骨军团认得这个印记。', lore: true },
      { name: '暗影粉尘', type: 'consumable', stealth: true, qty: 2, desc: '一撮来自幽影回廊的暗影粉尘，撒在身上可以短暂融入阴影之中。亡灵的专属小把戏。' },
    ],
  },

  // 沉浸式新手教程叙事（根据职业、种族动态生成）
  TUTORIAL_NARRATIVES: {
    warrior: {
      intro: `你在一阵号角声中醒来。军营的木窗外，晨光刚漫过城墙，操场上已经传来了兵器交击的声响——那是早起的士兵在进行晨练。\n\n你翻身坐起，目光落在床边的装备上。那把铁铸双手剑静静地靠在墙角，旁边的桌上放着一枚青铜军徽、几瓶药水和一壶麦酒。你是王国军队的一名正式士兵——虽然只是最低阶的那种。\n\n老兵常说：「战士不问出身，只问手中剑利不利。」\n\n今天是你的第一个正式任务日。军事长昨晚派人通知你——去训练场报到，学习战斗基础。`,
      discovery: `你打开行囊，翻看里面的物品——一把沉甸甸的铁铸双手剑，几瓶军医发的生命药水，一壶够劲的麦酒……还有一枚银币，那是你攒下的军饷，刚好够向训练教官学习一招「冲锋」。哦，最重要的是那枚青铜军徽——丢了它你就进不了军营大门了。`,
      tip: `⚔️ 身为战士，你使用双手重剑。你可以前往训练场学习新技能，或直接出城开始冒险。军营是你的大本营——出示军徽即可自由进出。`,
    },
    mage: {
      intro: `一阵魔法钟的轻柔嗡鸣将你唤醒。你躺在皇家魔法学院的学生宿舍里，窗外的奥术路灯还未熄灭，淡蓝色的光芒透过窗帘洒在书桌上。桌上摊开着一本《初阶奥术导论》——你昨晚读到凌晨才睡着。\n\n你揉了揉眼睛，看向床头的背包。今天是你在学院的第一个正式上课日。你的启蒙导师给了你一封信，让你凭此信正式注册入学——「别弄丢了，我只写一封，」她当时这么说。\n\n你透过窗户望出去——魔法学院的主塔在晨光中熠熠生辉，塔尖的奥术水晶缓缓旋转。这里将成为你探索奥术的秘密之地。`,
      discovery: `你打开背包，逐一清点：学徒法杖、深蓝色的学院长袍……啊，入学推荐信！用火漆封得严严实实的那封。还有一枚银币——刚好够去学院商店买一个攻击法术卷轴。奥术飞弹、火焰飞弹还是冰霜飞弹？这是你要做的第一个重要选择。哦，还有足足10瓶生命药水和10瓶法力药水——学院在安全保障上从不吝啬。`,
      tip: `🔮 身为法师，法杖是你施法的媒介。先去学院正门找门卫递交推荐信完成注册，然后用那枚银币在学院商店选购你的第一个攻击法术。魔法实验偶尔会爆炸——别担心，医务室离得不远。`,
    },
    rogue: {
      intro: `你在一阵昏暗的光线中睁开眼睛。头顶是摇摇欲坠的木制天花板，身下是硬邦邦的稻草垫。你住在贫民窟的一间小阁楼里，窗外是奥尔兰多下城区永远散不去的雾气。楼下传来早市的叫卖声——但你不是去买菜的那种人。\n\n你摸了摸藏在枕头下面的暗钢匕首。还在。在这个街区，什么都可以丢——唯独武器不能。桌角放着你的开锁工具包：几根弯铁丝、一把小锉刀。那个卖给你这些工具的黑市商人说过：「活着才能继续偷。」——你把这句话刻在了心里。\n\n今天有什么「生意」可做？`,
      discovery: `你翻了翻随身的破布袋：两把匕首——一把主手、一把副手，够你在暗巷里应付大多数情况了。几瓶廉价的生命药水，效果不怎么样但总比没有强。两个自制烟雾弹——紧急逃命用的。还有那套开锁工具，你的命根子。在这个城市里，一把好锁可能通向金币，也可能通向死路——你得学会辨认。`,
      tip: `🗡️ 身为游荡者，匕首是你最可靠的朋友。暗巷是你的主场——但城里那些比你更狠的角色也在盯着你。你可以尝试偷窃、潜行、或去酒馆打听「生意」。记住：失败了大不了跑。`,
    },
    cleric: {
      intro: `管风琴的圣歌透过石墙传来，不响，却足以让你从梦乡中缓缓浮起。你躺在一间简朴的石室中——光明大教堂的见习牧师宿舍。阳光透过彩绘玻璃窗洒进来，在石板地上映出斑斓的圣光十字纹。\n\n你起床、洗漱、穿上那件纯白的见习牧师圣袍。胸口的金色十字纹让你不由自主地挺直了腰杆。今天是你作为见习牧师的第一天——大主教会在晨祷后安排你的去处。可能是去医疗室帮忙，也可能是被派往某个村庄布道。\n\n你看向床头柜上的东西：一柄圣光法杖、几瓶散发着柔光的圣光药水、一枚银质圣光徽记……还有昨天厨房剩下的面包和清水。`,
      discovery: `你整理好行囊。圣光法杖握在手中微微发暖——那是圣光之神在低语。五瓶圣光药水装在软垫盒里，每一瓶都是在大教堂的圣水池中祝圣过的，对伤者而言是奇迹——对亡灵而言是灼烧地狱。圣光徽记别在胸前，有了它，大陆上任何一座光明神殿都会为你敞开大门。`,
      tip: `✝️ 身为牧师，圣光是你的一切。你的圣光药水能治愈盟友，但会让亡灵遭受严重的灼烧。你可以前往教堂医务室帮忙、出城救治伤者、或前往其他城市的光明神殿。圣光徽记是你身份的证明——走到哪里都要带着。`,
    },
    druid: {
      intro: `没有闹钟，没有号角，只有一束穿过层层树叶洒在你脸上的阳光。你在永恒圣林的树冠平台上睁开眼睛，身下是柔软的青苔。一只松鼠蹲在你旁边，用黑豆般的眼睛好奇地看着你。\n\n你坐起身来，深深吸了一口森林的空气——湿润、清新、充满了生命的味道。远处传来圣林中精灵的低语与溪流的潺潺水声。你的导师昨晚说：「从今天起，你不是『住在』森林里——你是森林的一部分。」\n\n你的自然之杖靠在树干上，藤蔓在晨光中微微舒展。旁边的树皮卷轴是你的第一份「课本」——用精灵语写着自然低语的基础法则。`,
      discovery: `你检查了一遍行囊：自然之杖上的小白花一夜之间又开了一朵。树叶斗篷散发着淡淡的薄荷香。三颗生命之种安静地躺在小布袋里——每一颗都是一次起死回生的机会。五包草药是你亲手采集的。还有那份树皮卷轴——你的导师用精灵语写的自然沟通指南，别在腰间，方便随时查阅。`,
      tip: `🌿 身为德鲁伊，自然之力与你同在。你可以与动物交谈、催生草木、变形为野兽。永恒圣林是你的家园——但世界很大，你的使命在圣林之外。带上你的生命之种和自然之杖，去那些需要自然守护的地方吧。`,
    },
    paladin: {
      intro: `一道圣光透过圣殿骑士团的驻营窗户照进来，精准地落在地板上你昨晚擦得锃亮的骑士盾上——反射的光芒正好刺中你的眼睛。这是圣殿骑士团的「老传统」——新人必须睡在窗户朝东的房间，黎明第一道圣光会准时叫你起床。\n\n你翻身起来，一丝不苟地整理好内务。圣殿骑士的宿舍不需要豪华——一张床、一张桌、一个武器架。武器架上斜放着你的圣光长剑，桌旁立着你的骑士盾，盾面上圣光之鹰的徽记在晨光中熠熠生辉。\n\n你拿起桌上的骑士誓约书。上面清晰写着你的名字、入团日期、以及那句你背得滚瓜烂熟的誓言：「以圣光之名，守护一切良善。」`,
      discovery: `你逐件检查装备：圣光长剑——吹毛断发，剑身上的神圣符文在指尖滑过时微微发烫。圣殿骑士盾——内衬刻着你的誓言。三瓶圣光药水是昨天圣餐礼上主教亲手祝圣过的——对亡灵而言这是比火刑更痛苦的灼烧。还有三瓶标准的生命药水。骑士誓约书叠好放入内袋——它将见证你每一次行使正义的时刻。`,
      tip: `🛡️ 身为圣骑士，你右手持剑、左手擎盾。圣光药水和牧师的一样神圣——亡灵触碰即遭焚烧。你的誓约书代表了圣殿骑士团的权威：可在任意骑士团驻地获得补给与任务。去吧，骑士——黑暗在等待圣光。`,
    },
    shaman: {
      intro: `一阵低沉的鼓声将你唤醒。那不是人的鼓——是大地的脉搏。你在先祖之魂祭坛旁边的石床上睁开眼睛，周围是几根高耸的图腾柱，柱身上的符文在晨雾中若隐若现。空气中弥漫着焚烧草药的甜香——那是昨晚祭祀留下的余韵。\n\n你起身走向溪边洗漱。溪水冰凉刺骨，但你早已习惯。回来的路上你路过祭坛，几缕淡白色的灵魂尘悬浮在空气中——那是昨夜与你对话的祖灵们留下的痕迹。氏族长者说过：「被先祖选中的人，灵魂中会永远携带着他们的声音。」\n\n你的图腾战锤靠在图腾柱脚下，上面的兽毛在风中微微颤动着——那是祖灵们在向你打招呼。`,
      discovery: `你盘腿坐下，整理身上的物件：图腾战锤上的符文在指尖摩挲时发出温暖的金光。兽骨护甲轻拍发出清脆的声响——每一片骨甲都来自不同巨兽的遗骸，蕴含着不同的祝福。三袋灵魂尘是你的至宝——研磨祖灵骨尘是萨满最神圣的仪式。噢，那块先祖符石——千万别丢了。在格罗玛什，它比任何语言都管用。`,
      tip: `🪨 身为萨满，先祖之魂是你力量的来源。你可以在祭坛沟通祖灵、祈求指引，或在荒野中寻找元素图腾。先祖符石是你身份的象征——任何兽人都会在它面前称你为兄弟。格罗玛什是你的根，但祖灵们希望你去更远的地方传颂他们的名字。`,
    },
  },

  // 时代科普（在新手教程最后展示）
  ERA_LORE: {
    golden_age: {
      title: `☀️ 关于你所在的时代——光辉时代`,
      body: `你现在站立的艾尔德兰大陆，正处于它最辉煌的「光辉时代」。\n\n这是魔法与文明共同繁荣的黄金岁月。十一贤者之首——雷克斯·秘法——今日仍在皇家魔法学院讲授奥术之道。年轻的晨曦帝王刚刚即位，雄心勃勃地要开创人类前所未有的盛世。精灵的海兰贝尔在星光中闪耀，矮人的卡扎杜姆熔炉从未停息。\n\n但请记住——在这片繁荣之下，隐忧正在酝酿。兽人氏族在东方荒原集结着前所未有的力量。历史学家后来将这段岁月称为「暴风雨前的黄金时刻」。\n\n📖 你选择了【剧情模式】——这是一次单人沉浸体验。你将与这片大陆上众多传奇人物相遇、结盟、甚至诀别。每一个NPC都有自己的故事和命运。光辉时代已停止更新——作为这片大陆的「过去」，它只为未来的跨时代联合保留一扇小门。\n\n享受这段岁月吧，冒险者。你脚下的每一寸土地，在若干年后都将化为焦土与传说。`,
    },
    decline_age: {
      title: `🌑 关于你所在的时代——没落时代`,
      body: `战争已经烧遍了整片大陆。你睁开眼看到的不是和平——而是废墟与烽火。\n\n人类与兽人的战争持续数十年后，最终演变为一场全面的阵营冲突。十一贤者之首雷克斯·秘法已经陨落，晨曦帝王的宫殿化为断壁残垣。大陆分裂为三大势力：\n\n🛡️ 善良守序联盟——人类与精灵，以圣光与自然之名守护残存的光明。\n💀 邪恶守序部落——兽人与亡灵，在死亡与荣耀的旗帜下寻求力量。\n⚖️ 中立守序阵营——矮人与独立种族，在战争夹缝中追求交易与和平。\n\n大多数传奇NPC已不在人世。但这是属于你们的时代——玩家的史诗将在阵营的旗帜下书写。\n\n⚔️ 你选择了【阵营争霸模式】——这是为多人竞技而生的时代。投身阵营战争，与战友并肩战斗，在每一季的资料片更新中创造属于你自己的传奇。光辉时代已成为不可挽回的「过去」——而我们将在废墟上建立起未来。`,
    },
  },

  // ===== 天生被动技能系统（每10级升阶，60级达终极形态） =====
  INNATE_SKILLS: {
    // ⚔️ 战士
    warrior: {
      warrior_heart: {
        name: '战士之心',
        icon: '❤️‍🔥',
        type: '被动·战斗',
        desc: '当生命垂危时，战士的真正力量才会觉醒。血液中的肾上腺素如同熔岩般燃烧——受伤越重，反击越猛。老兵们称之为「战士的最后一口气」，但真正的战士知道：那不是最后一口气，那是第一口真正的呼吸。',
        tiers: {
          1: { level: 1, name: '初觉醒', effects: { lowHpThreshold: 30, dmgBonus: 10 }, desc: 'HP低于30%时，伤害+10%' },
          10: { level: 10, name: '血性', effects: { lowHpThreshold: 35, dmgBonus: 15 }, desc: 'HP低于35%时，伤害+15%；受伤时获得短暂攻速提升' },
          20: { level: 20, name: '不屈', effects: { lowHpThreshold: 40, dmgBonus: 20, tempShield: 5 }, desc: 'HP低于40%时，伤害+20%，并获得相当于最大HP 5%的临时护盾' },
          30: { level: 30, name: '嗜血', effects: { lowHpThreshold: 45, dmgBonus: 25, killHeal: 5 }, desc: 'HP低于45%时，伤害+25%；每次击杀回复5%最大HP' },
          40: { level: 40, name: '狂怒', effects: { lowHpThreshold: 50, dmgBonus: 30, atkSpeed: 'double' }, desc: 'HP低于50%时，伤害+30%，攻击速度翻倍；免疫恐惧' },
          50: { level: 50, name: '战神', effects: { lowHpThreshold: 55, dmgBonus: 35, defyDeath: true }, desc: 'HP低于55%时，伤害+35%；免疫所有精神控制；每场战斗可触发一次「绝境反击」' },
          60: { level: 60, name: '不败战魂', effects: { lowHpThreshold: 60, dmgBonus: 40, lastStand: true }, desc: 'HP低于60%时即触发所有效果。每场战斗一次：HP降至0时以1HP存活一回合，期间伤害翻倍且免疫一切伤害。这是战士之心的终极形态——只要灵魂不屈服，身躯就不会倒下。' },
        },
      },
      combat_mastery: {
        name: '战斗精通',
        icon: '⚔️',
        type: '被动·武艺',
        desc: '战士在千百次挥剑中磨练出的本能。这不是天赋——这是汗水、老茧和无数个黎明前的训练换来的。每一次格挡、每一次反击、每一次呼吸都刻进了骨头里。',
        tiers: {
          1: { level: 1, name: '训练有素', effects: { physDmg: 5, dualWield: true }, desc: '物理伤害+5%，可双持单手武器' },
          10: { level: 10, name: '身经百战', effects: { physDmg: 10, disarmResist: 20 }, desc: '物理伤害+10%，缴械抗性+20%' },
          20: { level: 20, name: '反击本能', effects: { physDmg: 15, counterAttack: true }, desc: '物理伤害+15%，成功格挡后自动反击（造成50%伤害）' },
          30: { level: 30, name: '致命精准', effects: { physDmg: 20, critRate: 5 }, desc: '物理伤害+20%，暴击率+5%' },
          40: { level: 40, name: '暴风连击', effects: { physDmg: 25, critDmg: 30 }, desc: '物理伤害+25%，暴击伤害+30%' },
          50: { level: 50, name: '剑圣', effects: { physDmg: 30, doubleStrike: 10 }, desc: '物理伤害+30%，每回合10%概率额外攻击一次' },
          60: { level: 60, name: '武器大师', effects: { physDmg: 35, anyWeapon: true, freeSwitch: true }, desc: '物理伤害+35%。可使用任何类型武器且不受惩罚，切换武器不消耗回合。你已超越了武器的限制——武器只是你身体的延伸，任何兵器在你手中都是致命的。' },
        },
      },
    },

    // 🔮 法师
    mage: {
      prestidigitation: {
        name: '法术伎俩',
        icon: '✨',
        type: '被动·奥术',
        desc: '每一个法师学徒在学会火球术之前，先学会的是让茶杯自己飞到嘴边。法术伎俩是奥术之道的第一课——看似无用的小把戏，却是理解「现实可以被意志改写」这一至高真理的起点。据说十一贤者之首雷克斯·秘法至今仍会在讲课时用法术伎俩让粉笔自己在黑板上写字。',
        tiers: {
          1: { level: 1, name: '学徒把戏', effects: { minorTricks: true }, desc: '可施展微小的魔法把戏：让法袍变干净、指尖冒出无害的火花（1-2伤害）、让茶杯飘到手中、给汤加热。法师学徒在学院里用这些把戏互相捉弄，但聪明的法师知道——这些把戏在关键时刻能救命。' },
          10: { level: 10, name: '便利魔法', effects: { createLight: true, smallObject: true }, desc: '可变出持续一小时的简单小物件（杯子、绳子、花朵），发出照亮黑暗的魔法微光，用魔力翻书和开门。日常生活的每一个不便，都多了一种魔法解决方案。' },
          20: { level: 20, name: '五感戏法', effects: { alterSense: true, minorIllusion: true }, desc: '可改变小范围内的颜色、气味、温度和声音。让一杯水尝起来像蜂蜜酒，让一面墙看起来像星空，让一间石室闻起来像春天的花田。适用于：迷惑敌人、取悦平民、或让你的干面包尝起来像烤肉。' },
          30: { level: 30, name: '初级念力', effects: { telekinesis: true, weatherTrick: true }, desc: '可用意念远程移动轻小物体（相当于一只手的力量），在小范围内制造微风吹拂或细雨飘洒。你终于可以让书自己飞到手里了——虽然导师会说你只是懒得站起来。' },
          40: { level: 40, name: '幻象编织', effects: { selfIllusion: true, mendObject: true }, desc: '可短暂改变自己的外貌（幻象，持续10分钟），修复破损的小物件（不能修复魔法物品或大型结构）。你可以变成任何人的样子——或者只是让你的旧袍子看起来像新的。' },
          50: { level: 50, name: '小造物术', effects: { minorCreation: true, areaInfluence: true }, desc: '可创造短暂存在的简单魔法物品（持续1小时），影响中等范围（一个房间大小）的物理环境。你能造出一把魔法椅子、让整间屋子变得温暖如春、或让一片泥地变成硬实的路面。' },
          60: { level: 60, name: '小许愿术', effects: { lesserWish: true }, desc: '🌠 **乞丐版大许愿术** — 每日一次，可在合情合理的范围内永久改变世界的一小部分。让一扇门永远通向另一个地方、让一棵树永远结出金苹果、让一个小湖泊的水永远清澈、让一个区域的天气永远风和日丽。改变必须是「自然的延伸」——你不能让一座山飞起来，但你可以让山上的花永远盛开。据传这是9级魔法「大许愿术」的雏形——雷克斯·秘法在创造它时，正是从法术伎俩中获得的灵感。「伟大的魔法从来不是凭空出现的，它只是一个小把戏，被反复推敲了一万年。」' },
        },
      },
      magic_mastery: {
        name: '魔法掌握',
        icon: '🔮',
        type: '被动·魔力',
        desc: '真正的法师不只是会施法——他们理解魔法。法力在血管中流淌，符文在脑海中自动浮现，每一次呼吸都在吸收空气中的奥术能量。魔法掌握不是一种技能，而是一种存在方式。',
        tiers: {
          1: { level: 1, name: '魔力感知', effects: { manaCost: -5, magicIdentify: 10 }, desc: '魔力消耗-5%，魔法辨识成功率+10%' },
          10: { level: 10, name: '高效施法', effects: { manaCost: -10, magicDmg: 5 }, desc: '魔力消耗-10%，魔法伤害+5%' },
          20: { level: 20, name: '法术反制', effects: { manaCost: -15, magicDmg: 10, counterspell: true }, desc: '魔力消耗-15%，魔法伤害+10%；可尝试反制敌人正在施放的法术' },
          30: { level: 30, name: '双重专注', effects: { manaCost: -20, magicDmg: 15, dualConcentrate: true }, desc: '魔力消耗-20%，魔法伤害+15%；可同时维持两个需要专注的法术' },
          40: { level: 40, name: '瞬发掌握', effects: { manaCost: -25, magicDmg: 20, quickCast: true }, desc: '魔力消耗-25%，魔法伤害+20%；部分低阶法术可以瞬发' },
          50: { level: 50, name: '法术解析', effects: { manaCost: -30, magicDmg: 25, spellAnalyze: true }, desc: '魔力消耗-30%，魔法伤害+25%；见过一次的法术可尝试复制（需智力检定）' },
          60: { level: 60, name: '奥术至高', effects: { manaCost: -35, magicDmg: 30, amplifySpell: true }, desc: '魔力消耗-35%，魔法伤害+30%。每日一次：「奥术至高」— 将一个已知法术的效果翻倍（伤害、范围、持续时间全部×2）。这是凡人所能达到的奥术巅峰——在那一瞬间，你触碰到了魔法的本源。' },
        },
      },
    },

    // 🗡️ 游荡者
    rogue: {
      pickpocket: {
        name: '偷窃',
        icon: '🤫',
        type: '被动·技巧',
        desc: '在奥尔兰多下城区的暗巷里，有一个不成文的规矩：如果一个游荡者能偷走你贴身的东西，那不是你不够警惕——而是他值得尊敬。偷窃是一门被低估的艺术——它结合了心理学、肢体语言学、和对人类注意力盲区的精确把握。',
        tiers: {
          1: { level: 1, name: '扒手', effects: { stealDC: 12, smallItem: true }, desc: '可从NPC身上偷取少量金币或小物品（D20检定DC12）。适合顺手牵羊——但别指望能偷到守卫队长的配剑。' },
          10: { level: 10, name: '妙手', effects: { stealDC: 10, equipItem: true }, desc: '偷窃DC-2，可偷取装备栏中的小物件（戒指、钱袋、卷轴）。被发现的概率降低——你不会再因为手抖而失手了。' },
          20: { level: 20, name: '无形之触', effects: { stealDC: 8, safeFail: true }, desc: '偷窃DC-4，可偷取中等价值物品，偷窃失败时对方不会察觉（你只是「不小心碰了一下」）。这是暗巷老手的水平——足够你在贫民窟过上不错的日子。' },
          30: { level: 30, name: '战场扒手', effects: { stealDC: 6, combatSteal: true }, desc: '偷窃DC-6，可偷取高价值物品。战斗中可偷取敌人的备用武器或药水——在敌人挥剑砍向你的时候摸走他腰间的治疗药水，没有比这更让对手崩溃的事了。' },
          40: { level: 40, name: '秘法扒窃', effects: { stealDC: 4, magicItem: true }, desc: '偷窃DC-8，可偷取魔法物品和钥匙。你能从法师的指尖顺走他的魔法戒指而不触动任何警报——不过最好别在反魔法区域这么做。' },
          50: { level: 50, name: '灵魂之触', effects: { stealDC: 2, boundItem: true }, desc: '偷窃DC-10，可偷取灵魂绑定的物品（需通过意志对抗）。理论上不可能被偷的东西，在你手中变得可能——你偷的不是物品，是它和主人之间的纽带。' },
          60: { level: 60, name: '幻影之触', effects: { remoteSteal: true, conceptSteal: true }, desc: '可在视线范围内远程偷窃（30米内）。更重要的是——你可以偷取「概念性事物」：一个人身上的「厄运」、某件物品的「诅咒」、甚至是一个人的「记忆片段」。当然，这些都是暂时的（持续24小时），且消耗巨大魔力。在合情合理的范围内，你可以偷走任何东西——但不包括生命、灵魂和真爱。剑与魔法世界的基本法则仍然适用。' },
        },
      },
      shadow_affinity: {
        name: '暗影亲和',
        icon: '🌑',
        type: '被动·暗影',
        desc: '有些游荡者害怕黑暗，有些游荡者利用黑暗——而你属于后者中的佼佼者。暗影不只是光的缺席，它是一种力量。在阴影中，你的呼吸更轻、动作更快、思维更清晰。有人说这是天生的，有人说这是后天训练的——但每个游荡者都知道：黑暗从不背叛。',
        tiers: {
          1: { level: 1, name: '夜行', effects: { stealthBonus: 15, shadowDmg: 5 }, desc: '黑暗环境中潜行成功率+15%，暗影伤害+5%' },
          10: { level: 10, name: '夜视', effects: { stealthBonus: 25, shadowDmg: 10, darkVision: true }, desc: '潜行+25%，暗影伤害+10%，获得暗影视觉（完全黑暗中如白昼视物）' },
          20: { level: 20, name: '流动之影', effects: { stealthBonus: 35, shadowDmg: 15, moveStealth: true }, desc: '潜行+35%，暗影伤害+15%，可在移动中保持潜行状态（速度不减）' },
          30: { level: 30, name: '战斗潜行', effects: { stealthBonus: 45, shadowDmg: 20, combatStealth: true }, desc: '潜行+45%，暗影伤害+20%，战斗中可消耗一个回合重新进入潜行' },
          40: { level: 40, name: '暗杀者', effects: { stealthBonus: 55, shadowDmg: 25, stealthCrit: true }, desc: '潜行+55%，暗影伤害+25%，潜行状态下的第一次攻击必定暴击' },
          50: { level: 50, name: '阴影化身', effects: { stealthBonus: 65, shadowDmg: 30, shadowPhase: true }, desc: '潜行+65%，暗影伤害+30%。每日三次：可短暂融入阴影（1回合），期间物理攻击对你无效' },
          60: { level: 60, name: '暗影之主', effects: { shadowTeleport: true, shadowSense: true }, desc: '在任何有阴影的地方，你可以瞬间移动到视线范围内的另一片阴影中（冷却30秒）。此外，你可以感知到周围100米内所有阴影中的存在——没有东西能在你的暗影中存在而不被你察觉。游荡者终极能力：黑暗不再是你的斗篷——黑暗是你的王国。' },
        },
      },
    },

    // ✝️ 牧师
    cleric: {
      holy_light: {
        name: '圣光术',
        icon: '✝️',
        type: '被动·神圣',
        desc: '圣光之神赐予祂最虔诚信徒的第一份礼物——也是最珍贵的。圣光不是暴力，不是审判，而是纯粹的生命能量。每一位牧师在入教仪式上第一次成功施展圣光术时，都会流下眼泪——不是因为喜悦，而是因为在那一瞬间，你感受到了圣光之神对世间一切生灵的悲悯。',
        tiers: {
          1: { level: 1, name: '圣光微光', effects: { healAmount: '10+魅力', undeadDmg: '等量神圣伤害' }, desc: '治疗单个目标10+魅力值的HP；对亡灵造成等量神圣伤害（灼烧）' },
          10: { level: 10, name: '双目标治疗', effects: { healBonus: 30, targetCount: 2 }, desc: '治疗效果+30%，可同时治疗2个目标' },
          20: { level: 20, name: '净化之光', effects: { healBonus: 60, targetCount: 3, cleanse: 1 }, desc: '治疗效果+60%，可同时治疗3个目标，附带移除一种负面状态' },
          30: { level: 30, name: '持续祝福', effects: { healBonus: 100, targetCount: 3, cleanse: 2, regen: true }, desc: '治疗效果+100%（翻倍），可移除两种负面状态，治疗后附带3回合持续恢复' },
          40: { level: 40, name: '圣光普照', effects: { healBonus: 150, areaHeal: true, removeCurse: true }, desc: '治疗效果+150%，范围治疗全体队友，可移除诅咒' },
          50: { level: 50, name: '复活之光', effects: { healBonus: 200, revive: true }, desc: '治疗效果+200%（三倍），每日一次：可复活一名在一小时内死亡的盟友（回复30%HP）' },
          60: { level: 60, name: '大预言术（弱化）', effects: { lesserProphecy: true }, desc: '⚜️ **弱化版9级神术——大预言术**。每日一次，你可向圣光之神祷告，请求永久改变世界的一小部分。「愿此地不再有瘟疫」永久净化一片区域、「愿此剑永远锋利」永久附魔一件物品、「愿这道门只向善良之人敞开」设立永久结界。改变必须是善良且合情合理的——圣光之神不会回应贪婪或邪恶的祷告。这已不是简单的治疗——这是通过你的口，说出圣光的意志。' },
        },
      },
      holy_affinity: {
        name: '圣光亲和',
        icon: '☀️',
        type: '被动·祝福',
        desc: '圣光不是你能学会的——它只亲近那些真正纯洁的灵魂。圣光亲和是一种天赋，也是一种选择：选择相信善良的力量，选择在黑暗面前不退缩。圣光永远会回应那些心无杂念的人。',
        tiers: {
          1: { level: 1, name: '蒙恩者', effects: { holyDmg: 10, shadowResist: 10 }, desc: '圣光伤害+10%，暗影抗性+10%' },
          10: { level: 10, name: '光明之子', effects: { holyDmg: 20, shadowResist: 20, lightBonus: 1 }, desc: '圣光伤害+20%，暗影抗性+20%，光明环境下全属性+1' },
          20: { level: 20, name: '亡灵克星', effects: { holyDmg: 30, shadowResist: 30, undeadBonus: 50 }, desc: '圣光伤害+30%，暗影抗性+30%，对亡灵伤害额外+50%' },
          30: { level: 30, name: '致盲圣光', effects: { holyDmg: 40, shadowResist: 40, blindChance: 15 }, desc: '圣光伤害+40%，暗影抗性+40%，圣光法术有15%概率附加「致盲」效果' },
          40: { level: 40, name: '暗影驱散', effects: { holyDmg: 50, shadowResist: 50, curseImmune: true }, desc: '圣光伤害+50%，暗影抗性+50%，免疫暗影诅咒' },
          50: { level: 50, name: '移动圣所', effects: { holyDmg: 60, shadowResist: 60, holyAura: true }, desc: '圣光伤害+60%，暗影抗性+60%。你所在之处即为圣所——周围小范围视为神圣区域（亡灵/恶魔在此区域内持续受到灼烧）' },
          60: { level: 60, name: '圣光化身', effects: { holyDmg: 75, shadowImmune: true, avatarForm: true }, desc: '圣光伤害+75%，暗影伤害完全免疫。每日一次可化身为圣光形态（持续3回合）：期间所有圣光法术效果翻倍、对亡灵产生恐惧光环、治疗不再消耗魔力。在这一刻，你与圣光合为一体——你即是圣光。' },
        },
      },
    },

    // 🌿 德鲁伊
    druid: {
      nature_resonance: {
        name: '自然共鸣',
        icon: '🌿',
        type: '被动·自然',
        desc: '德鲁伊不「学习」自然——他们「倾听」自然。在永恒圣林中长大的精灵天生就能听见树木的呼吸，而人类德鲁伊则需要用十年时间让自己的心跳与森林同步。当你真正与自然共鸣时，你不再是一个独立的个体——你是森林的一部分，森林也是你的一部分。',
        tiers: {
          1: { level: 1, name: '生灵低语', effects: { smallAnimalTalk: true, naturePerception: 15 }, desc: '可与小型动物（松鼠、兔子、小鸟）简单沟通，自然环境中感知+15%' },
          10: { level: 10, name: '野兽安抚', effects: { mediumAnimalTalk: true, calmBeast: true, natureMagic: 10 }, desc: '可与中型动物（狼、鹿）沟通，可安抚敌对野兽使其不再攻击，自然魔法效果+10%' },
          20: { level: 20, name: '动物盟友', effects: { largeAnimalTalk: true, animalAid: true, natureMagic: 20 }, desc: '可与大型动物（熊、虎）沟通，可请求动物协助（传递信息、驮运物品、或战斗中牵制敌人），自然魔法效果+20%' },
          30: { level: 30, name: '植物交谈', effects: { plantTalk: true, natureMagic: 30 }, desc: '可与植物沟通——树木会告诉你谁最近走过，花草会告诉你天气的变化。这是无法被谎言欺骗的情报网。自然魔法效果+30%' },
          40: { level: 40, name: '森林之怒', effects: { commandAnimals: true, terrainChange: true, natureMagic: 40 }, desc: '可命令野生动物为你战斗（持续时间等于专注时间），可催生大型植物改变地形（荆棘墙、藤蔓桥）。自然魔法效果+40%' },
          50: { level: 50, name: '远古智慧', effects: { ancientTalk: true, natureMagic: 50 }, desc: '可与古老树木和自然精魂沟通——它们见证过千百年的历史，知道许多被遗忘的秘密。自然魔法效果+50%' },
          60: { level: 60, name: '自然意志', effects: { ecosystemResonance: true, natureRequest: true }, desc: '自然魔法效果+60%。每天一次，你可与整片区域的生态系统共鸣，感知数十里内的一切动静，并请求自然本身来帮助你：请森林困住一支军队、请河流改变流向、请大地裂开吞没敌人。自然从不拒绝德鲁伊的合理请求——但你也不能要求她做违背自然规律的事。' },
        },
      },
      wild_shape: {
        name: '野性变形',
        icon: '🐻',
        type: '被动·变形',
        desc: '每个德鲁伊都会经历一个时刻：当你第一次变形成一只动物时，你会短暂地忘记自己曾经是人（或精灵）。那是令人恐惧的一瞬间——也是令人自由的一瞬间。野性变形不是伪装，不是幻术——你真的变成了那个动物，拥有它的感官、它的本能、它的力量。',
        tiers: {
          1: { level: 1, name: '小动物形态', effects: { shape: 'small_harmless', duration: '10分钟' }, desc: '可变形为小型无害动物（猫、兔子、松鼠）。主要用途：钻过狭窄空间、不被注意地移动、或单纯享受毛茸茸的感觉。' },
          10: { level: 10, name: '中型野兽', effects: { shape: 'medium_animal', speedBonus: true }, desc: '可变形为中型动物（狼、鹿、猎豹），获得其移动速度加成。狼形态可用于追踪，鹿形态适合长途跋涉。' },
          20: { level: 20, name: '大型捕食者', effects: { shape: 'large_beast', combatForm: true }, desc: '可变形为大型动物（熊、虎、巨蟒），获得其完整的战斗能力。熊形态：高HP高攻击；虎形态：高敏捷高暴击。' },
          30: { level: 30, name: '天空与海洋', effects: { shape: 'flying', shape: 'aquatic' }, desc: '可变形为飞行生物（鹰、隼、猫头鹰）和水生生物（海豚、鲨鱼）。天空与深海不再是障碍——世界在你面前完全打开了。' },
          40: { level: 40, name: '魔法野兽', effects: { shape: 'magical_beast', specialAbility: true }, desc: '可变形为魔法野兽（狮鹫、石化蜥蜴、独角兽），每种形态拥有独特的魔法能力。狮鹫可飞行战斗，石化蜥蜴的注视可石化敌人。' },
          50: { level: 50, name: '元素化身', effects: { shape: 'elemental', duration: '大幅延长' }, desc: '可变形为元素生物（土/火/水/风元素），获得对应的元素能力和免疫。变形持续时间大幅延长，冷却时间减半。' },
          60: { level: 60, name: '万灵之形', effects: { shape: 'ancient_guardian', shape: 'moon_phoenix', noCooldown: true }, desc: '可变形为两种终极形态：🌳 **远古守护者**——巨大的树人，高防御高回复，可同时影响整片战场的地形；🦅 **月神之翼**——月光凤凰，飞行中所有自然魔法瞬发，死后可从灰烬中重生一次。变形不再有冷却时间——你可以自由地在形态之间切换，如同呼吸一般自然。' },
        },
      },
    },

    // 🛡️ 圣骑士
    paladin: {
      holy_vow: {
        name: '圣光誓言',
        icon: '🛡️',
        type: '被动·守护',
        desc: '每一位圣骑士在入团仪式上都会跪在圣殿中，对着圣光之鹰的徽记宣读誓言。「以圣光之名，守护一切良善。」——这句话不是修辞，是契约。圣光誓言会在圣骑士的灵魂中刻下一个印记：你永远不会在你应该保护的人倒下之前倒下。',
        tiers: {
          1: { level: 1, name: '守护誓约', effects: { protectDef: 10, holyDmg: 5 }, desc: '保护盟友时自身防御+10%，圣光伤害+5%' },
          10: { level: 10, name: '替身守护', effects: { protectDef: 20, holyDmg: 10, bodyguard: true }, desc: '防御+20%，圣光伤害+10%，每回合可替一名盟友承受一次攻击' },
          20: { level: 20, name: '圣光反击', effects: { protectDef: 30, holyDmg: 15, reflectDmg: true }, desc: '防御+30%，圣光伤害+15%，承受攻击时对攻击者造成圣光反伤（所受伤害的30%）' },
          30: { level: 30, name: '全员守护', effects: { protectDef: 40, holyDmg: 20, aoeGuard: true }, desc: '防御+40%，圣光伤害+20%，可替全队承受一次范围攻击（伤害由你一人承担）' },
          40: { level: 40, name: '圣盾赐福', effects: { protectDef: 50, holyDmg: 25, allyShield: true }, desc: '防御+50%，圣光伤害+25%，被保护的目标获得相当于你最大HP 10%的临时护盾' },
          50: { level: 50, name: '坚不可摧', effects: { protectDef: 60, holyDmg: 30, ccImmune: true }, desc: '防御+60%，圣光伤害+30%，保护状态下免疫一切控制效果（眩晕/恐惧/魅惑/冰冻）' },
          60: { level: 60, name: '不朽誓言', effects: { protectDef: 75, holyDmg: 35, unkillable: true }, desc: '防御+75%，圣光伤害+35%。每日一次：立下「不朽誓言」保护一名盟友——在誓言存续期间（至战斗结束），该盟友无法被杀死（最低保持1HP）。这是圣骑士誓言的终极形态：你向圣光起誓，而圣光回应了你的誓言。' },
        },
      },
      guardian_shield: {
        name: '守护之盾',
        icon: '🔰',
        type: '被动·盾术',
        desc: '圣殿骑士团的新人第一天就被告知：你的盾不是用来保护你自己的——是用来保护你身后的人的。守护之盾是圣骑士盾术的基石。一块铁板在普通人手中只是防具，在圣骑士手中却是移动的城墙、圣光的媒介、和敌人的噩梦。',
        tiers: {
          1: { level: 1, name: '盾墙', effects: { blockRate: 10, shieldDef: 5 }, desc: '格挡率+10%，盾牌防御+5' },
          10: { level: 10, name: '圣疗格挡', effects: { blockRate: 15, shieldDef: 10, blockHeal: true }, desc: '格挡率+15%，盾牌防御+10，成功格挡时回复少量HP（格挡减伤的20%）' },
          20: { level: 20, name: '盾击', effects: { blockRate: 20, shieldDef: 20, shieldBash: true }, desc: '格挡率+20%，盾牌防御+20，获得「盾击」技能：造成力量+盾防的伤害，附带眩晕1回合' },
          30: { level: 30, name: '反伤盾', effects: { blockRate: 25, shieldDef: 30, shieldReflect: 20 }, desc: '格挡率+25%，盾牌防御+30，格挡时反弹20%伤害给攻击者' },
          40: { level: 40, name: '破法之盾', effects: { blockRate: 30, shieldDef: 40, spellInterrupt: true }, desc: '格挡率+30%，盾牌防御+40，盾击可打断敌人施法（使正在施放的法术失效）' },
          50: { level: 50, name: '圣盾投射', effects: { blockRate: 35, shieldDef: 50, shieldProject: true }, desc: '格挡率+35%，盾牌防御+50，可将圣光盾影投射到远方保护一名队友（远程格挡）' },
          60: { level: 60, name: '圣盾领域', effects: { blockRate: 40, shieldDef: 60, shieldAura: true }, desc: '格挡率+40%，盾牌防御+60。展开「圣盾领域」——大范围光环笼罩所有队友，领域内所有友军获得你一半的格挡率和盾牌防御加成。你一个人就是整支军队的城墙。' },
        },
      },
    },

    // 🪨 萨满
    shaman: {
      ancestral_whisper: {
        name: '先祖低语',
        icon: '🪨',
        type: '被动·灵魂',
        desc: '兽人相信每一位萨满出生时都携带着一位先祖的灵魂碎片。当你第一次在祭坛前闭上眼睛，听见那个不属于你自己的声音在你脑海中说「孩子，我在这里」的那一刻——你就不再是一个人了。矮人萨满则是在熔炉的轰鸣中听见先祖的回响——他们说那是矿石中留存的记忆。',
        tiers: {
          1: { level: 1, name: '灵魂轻语', effects: { recentDead: true, vagueGuidance: true }, desc: '可与最近逝去的灵魂（一周内）短暂沟通，获得模糊的指引。祖灵的回应像是风中传来的只言片语——需要你自己解读。' },
          10: { level: 10, name: '先祖建言', effects: { clearComm: true, ritualBonus: 10 }, desc: '可与祖灵清晰沟通，获得具体建议（如在战斗中提醒你敌人的弱点），仪式效果+10%' },
          20: { level: 20, name: '灵魂揭秘', effects: { revealTruth: true, ritualBonus: 20 }, desc: '可请祖灵揭示隐藏的信息：一件物品的来历、一个人的真实姓名、一段被遗忘的历史。仪式效果+20%' },
          30: { level: 30, name: '先祖附身', effects: { ancestorPossess: true, combatBuff: 15 }, desc: '可请祖灵短暂附身（3回合），期间全属性+3，获得先祖之怒（近战攻击附带额外灵魂伤害）' },
          40: { level: 40, name: '灵魂会议', effects: { multipleAncestors: true, ritualBonus: 40 }, desc: '可同时沟通多位祖灵，召开「灵魂会议」寻求集体智慧——在面临重大抉择时，历代先祖会给你投票建议。仪式效果+40%' },
          50: { level: 50, name: '失传知识', effects: { ancientKnowledge: true, ritualBonus: 50 }, desc: '可从祖灵处学习已失传的远古技能和知识——一种失传的战斗技巧、一门被遗忘的锻造工艺、或一个年代的真相。仪式效果+50%' },
          60: { level: 60, name: '万灵之音', effects: { anySoul: true, peakAbility: true, soulGuide: true }, desc: '可沟通任何逝者的灵魂——无论去世多久。祖灵附身时，你不仅获得属性加成，还可借用该先祖生前的一项巅峰能力使用一次。此外，你可以作为生者与亡者世界的中介——引导迷失的灵魂安息，化解未尽的执念。在兽人和矮人的文化中，这被称为「灵魂渡者」——最崇高的萨满称号。' },
        },
      },
      elemental_harmony: {
        name: '元素调和',
        icon: '⚡',
        type: '被动·元素',
        desc: '大地、火焰、流水和风暴——它们从未分离，只是在等待一个懂得倾听的人。萨满不与元素战斗——他们与元素共舞。当元素在你体内调和时，你的心跳与大地的脉动同步，你的呼吸与风的节奏一致。这种感觉无法用语言描述，但每一个萨满都会告诉你：当四元素同时回应你的呼唤时，你永远不再孤单。',
        tiers: {
          1: { level: 1, name: '元素感知', effects: { elemDmg: 5, elemSense: true }, desc: '元素伤害+5%，可感知周围的元素失衡（如附近有强元素生物或即将发生的自然灾害）' },
          10: { level: 10, name: '小元素呼唤', effects: { elemDmg: 10, smallElemSummon: true }, desc: '元素伤害+10%，可呼唤小型元素生物协助（火花妖精、水滴精魂、微风之灵、小石怪）' },
          20: { level: 20, name: '元素平息', effects: { elemDmg: 15, calmElements: true }, desc: '元素伤害+15%，可平息小型自然元素灾害：灭火、镇风、止水、固土。在元素面前，你不是征服者——你是调解者。' },
          30: { level: 30, name: '中元素召唤', effects: { elemDmg: 20, mediumElemSummon: true }, desc: '元素伤害+20%，可召唤中型元素生物参与战斗（火焰/冰霜/风暴/大地元素）' },
          40: { level: 40, name: '环境掌控', effects: { elemDmg: 25, terrainManip: true }, desc: '元素伤害+25%，可短暂操控环境元素：让地面裂开吞噬敌人、让湖水上涨淹没道路、让狂风阻挡飞行敌人。' },
          50: { level: 50, name: '大型元素召唤', effects: { elemDmg: 30, largeElemSummon: true, dualElement: true }, desc: '元素伤害+30%，可召唤大型元素生物（元素长老），并同时操控两种元素的组合效果（如熔岩=火+土，暴风雪=冰+风）' },
          60: { level: 60, name: '元素主宰', effects: { elemDmg: 40, naturalDisaster: true, elemAvatarForm: true }, desc: '元素伤害+40%。可引发或平息区域性自然现象——地震、暴风、火山喷发、海啸——但仅限于「合理」规模（你不会也不能摧毁一座城市，但你可以让一座小山摇晃）。每日一次：化身「元素风暴形态」，同时获得四种元素的加持，所有元素伤害翻倍，持续5回合。这是凡人所能触及的元素之力顶点——在那一刻，大地说出了你的名字。' },
        },
      },
    },
  },

  // ===== 起始区域（根据种族+职业分配） =====
  START_REGIONS: {
    human: {
      warrior: 'town_gate',
      mage: 'market_square',
      rogue: 'dark_alley',
      cleric: 'temple',
      paladin: 'town_gate',
      druid: 'forest_edge',
      shaman: 'market_square',
    },
    elf: {
      warrior: 'forest_edge',
      mage: 'deep_forest',
      rogue: 'dark_alley',
      cleric: 'temple',
      druid: 'deep_forest',
      paladin: 'forest_edge',
      shaman: 'forest_edge',
    },
    dwarf: {
      warrior: 'underground',
      mage: 'underground',
      rogue: 'dark_alley',
      cleric: 'temple',
      paladin: 'tavern',
      druid: 'forest_edge',
      shaman: 'underground',
    },
    orc: {
      warrior: 'bandit_camp',
      mage: 'river_crossing',
      rogue: 'dark_alley',
      cleric: 'temple',
      paladin: 'town_gate',
      druid: 'deep_forest',
      shaman: 'river_crossing',
    },
    undead: {
      warrior: 'graveyard',
      mage: 'underground',
      rogue: 'dark_alley',
    },
  },

  // ===== NPC 名称池（按种族区域主题） =====
  NPC_NAMES: {
    human: ['艾德温·铁誓', '瑟琳娜·银风', '马库斯·石盾', '莉莉安·月溪', '加雷斯·远行者', '伊莎贝拉·霜叶', '罗兰·灰袍', '维克托·铜锤'],
    elf: ['艾拉瑞尔·星歌', '瑟兰迪斯·暮光', '芬罗德·翡翠', '洛丝琳·晨曦', '凯勒布恩·银枝', '奈尔玟·碧叶', '塔里昂·风语', '弥瑞尔·月影'],
    dwarf: ['托林·铁炉', '巴林·秘银', '索拉·火须', '吉姆利·岩心', '德瓦林·黑锤', '菲莉·金矿', '英格丽德·钢盾', '布洛克·熔岩'],
    orc: ['古拉姆·血吼', '格罗什·战歌', '祖格娜·裂颅', '莫格鲁·碎骨', '萨卡·铁腕', '卡戈尔·狼牙', '乌尔扎·怒焰', '德雷卡·黑鬃'],
    undead: ['莫尔甘·影葬', '赫卡忒·冥河', '暗骨·寂灭', '霜魂·静默', '虚灵·空洞', '寒鸦·永夜', '破晓·遗忘', '残忆·孤灯'],
  },

  // ===== 多阶段任务模板 =====
  MULTI_STAGE_QUESTS: [
    {
      id: 'Q_MS01',
      title: '墓园调查',
      type: 'multi_stage',
      difficulty: 2,
      desc: '{npcName}最近每晚都做噩梦，梦到墓园方向传来诡异的哭声。他/她怀疑墓园里出了什么不干净的东西——「白天去看过，什么也没有。但一到晚上……镇上的人都说是风声，可我知道那绝对不是风。」',
      rewardGold: 50,
      rewardExp: 120,
      stages: [
        {
          stage: 1,
          goal: '前往墓园进行调查',
          hint: '墓园在神殿旁边，从城镇大门穿过集市广场和神殿就能到达',
          needLocation: 'graveyard',
          needTime: null,
          needAction: 'move',
          narration: '你来到了古老的墓园。墓碑歪斜，杂草丛生，空气中弥漫着潮湿的泥土气息。白天这里看起来一片死寂——除了偶尔飞过的乌鸦，什么也没有。',
        },
        {
          stage: 2,
          goal: '在墓园等待夜幕降临',
          hint: '输入 /wait 在墓园等待，或者先在附近转转消磨时间。据说异常只在夜间出现。',
          needLocation: 'graveyard',
          needTime: 'night',
          needAction: 'wait',
          narration: '夜幕终于降临了……月光洒在墓园的碎石小径上。起初一切如常——直到一阵阴冷的风从地底吹来。远处，几座古老的墓碑周围开始浮现出诡异的、发着荧光的符号……',
        },
        {
          stage: 3,
          goal: '调查墓园夜晚出现的异常符号',
          hint: '仔细观察那些发光的符号，找出它们的来源。也许用「搜索」「调查」或「仔细观察」这些符号会有发现。',
          needLocation: 'graveyard',
          needTime: 'night',
          needAction: 'search',
          narration: '你蹲下身仔细观察那些符号。它们不是涂上去的——是某种魔法从地下渗出来的，如同墓园在用自己的方式写下什么信息。符号排列成一个古老的封印符文——有人试图在这里封印什么东西。但封印已经开始松动了……',
        },
        {
          stage: 4,
          goal: '返回向委托人汇报调查结果',
          hint: '回到最初遇到{NPC}的地方，告诉他/她你在墓园的发现。输入 /quest 可随时查看当前进度。',
          needLocation: null,
          needTime: null,
          needAction: 'talk',
          narration: '{npcName}听完你的描述，脸色变得苍白。「封印……我就知道那不是风。谢谢你，冒险者。至少现在我们知道了真相。」他/她将报酬塞到你手中，然后匆匆离开——大概是去找真正能处理这件事的人了。',
        },
      ],
    },
    {
      id: 'Q_MS02',
      title: '失踪的商队',
      type: 'multi_stage',
      difficulty: 3,
      desc: '一支商队在从河畔渡口前往王都的途中离奇失踪了。商队领队的妻子{npcName}焦急万分——「他们已经迟了整整三天了！这不是普通的延误……求你了，冒险者，帮我找到他们。」',
      rewardGold: 80,
      rewardExp: 200,
      stages: [
        {
          stage: 1,
          goal: '前往河畔渡口寻找线索',
          hint: '沿着河畔渡口调查商队最后出现的地方',
          needLocation: 'river_crossing',
          needTime: null,
          needAction: 'move',
          narration: '你来到了河畔渡口。渡口的船夫告诉你，三天前确实有一支商队从这里经过——但奇怪的是，他们没有渡河，而是转向了森林方向。船夫挠着头说：「我当时还喊了他们，可领队的人像是没听见一样……」',
        },
        {
          stage: 2,
          goal: '追踪商队足迹深入幽暗森林',
          hint: '从河畔渡口进入森林边缘，然后深入幽暗森林寻找商队的踪迹',
          needLocation: 'deep_forest',
          needTime: null,
          needAction: 'move',
          narration: '你在幽暗森林深处发现了商队的营地遗迹。帐篷被扯烂，货物散落一地，但没有任何打斗痕迹——就好像他们突然放下一切，自己走进了更深的森林。地面上残留着发着幽光的足迹，一路延伸到精灵废墟的方向……',
        },
        {
          stage: 3,
          goal: '前往精灵废墟寻找失踪的商队成员',
          hint: '跟随足迹进入精灵废墟，小心潜伏的危险',
          needLocation: 'elf_ruins',
          needTime: null,
          needAction: 'move',
          narration: '精灵废墟中，你发现了失踪的商队成员——但他们已经神志不清，坐在古代精灵的石碑前喃喃自语。他们的眼睛变成了淡紫色，口中反复念叨着一些你听不懂的精灵古语。废墟深处传来一阵诡异的低吟声——有什么东西苏醒了……',
        },
        {
          stage: 4,
          goal: '击败控制商队的暗影法师，解救他们',
          hint: '废墟深处的暗影法师是这一切的幕后黑手，击败他以打破精神控制',
          needLocation: 'elf_ruins',
          needTime: null,
          needAction: 'combat',
          targetEnemy: 'dark_mage',
          narration: '暗影法师在圣光中发出一声尖叫，化为黑烟消散。商队成员们眼中的紫色光芒逐渐退去，他们茫然地环顾四周——仿佛刚从一场长梦中醒来。领队的人揉着额头说：「我……我只记得一道闪光，然后……天啊，我们怎么在这里？」',
        },
        {
          stage: 5,
          goal: '护送商队返回并向委托人报告',
          hint: '回到最初遇到{NPC}的地方，告诉他/她你的发现',
          needLocation: null,
          needTime: null,
          needAction: 'talk',
          narration: '{npcName}见到商队归来，激动得热泪盈眶。「我就知道他们还活着！谢谢你，冒险者——你不仅找回了他们，还救了他们的命。」',
        },
      ],
    },
    {
      id: 'Q_MS03',
      title: '夜深人不静',
      type: 'multi_stage',
      difficulty: 2,
      desc: '暗巷附近的居民{npcName}最近总是半夜听到地下传来奇怪的声响——像是有人在挖掘什么。他/她怀疑有盗墓贼或者更糟的东西在活动。',
      rewardGold: 60,
      rewardExp: 130,
      stages: [
        {
          stage: 1,
          goal: '在夜晚前往暗巷进行调查',
          hint: '天黑之后去暗巷看看——白天那里只是普通的小巷，真正的秘密只在夜晚显现',
          needLocation: 'dark_alley',
          needTime: 'night',
          needAction: 'move',
          narration: '夜间的暗巷与白天判若两个世界。墙上的油灯只能照亮三步之内的距离，更远处全被浓稠的黑暗笼罩。你竖起耳朵——果然，从地下深处传来一阵有节奏的「咔、咔、咔」声，像是有人用镐在凿石头。',
        },
        {
          stage: 2,
          goal: '从暗巷找到通往地下的入口',
          hint: '搜索暗巷的墙壁和地面，寻找通往地下通道的入口',
          needLocation: 'dark_alley',
          needTime: 'night',
          needAction: 'search',
          narration: '你在一面看似普通的石墙上发现了一道暗门——被巧妙地隐藏在旧木板和杂物后面。门半开着，微弱的光从下方透上来。顺着阶梯走下去……你发现自己来到了地下通道。',
        },
        {
          stage: 3,
          goal: '深入地下通道查明声音的来源',
          hint: '进入地下通道，找到挖掘声的来源',
          needLocation: 'underground',
          needTime: null,
          needAction: 'move',
          narration: '地下通道的深处，你发现了声音的来源——一群奇怪的人围着一面古旧的墙壁不停地挖掘，他们的动作整齐划一，面无表情，仿佛被什么东西控制了。墙壁上刻满了与你之前在墓园见过的类似的发光符文。空气中弥漫着裂隙的能量……',
        },
        {
          stage: 4,
          goal: '击败被控制的人，阻止他们破坏封印',
          hint: '攻击那些被控制的人，并调查墙壁上的封印符文',
          needLocation: 'underground',
          needTime: null,
          needAction: 'combat',
          targetEnemy: 'skeleton',
          narration: '那些被控制的人倒下了——不，他们不是人。尸体倒在地上后迅速腐朽，化为枯骨。傀儡——有人在远处操控他们。墙壁上的符文也停止了发光，但你能感觉到这只是暂时的平静。封印暂时安全了。',
        },
        {
          stage: 5,
          goal: '回去向委托人报告地下发生的事情',
          hint: '回到最初遇到{NPC}的地方报告你的发现',
          needLocation: null,
          needTime: null,
          needAction: 'talk',
          narration: '{npcName}听完你说的一切，面色凝重。「有人在破坏古封印……这不是小事。我会通知神殿的人——你做的事情比你以为的要重要得多，冒险者。」',
        },
      ],
    },
    {
      id: 'Q_MS04',
      title: '森林的低语',
      type: 'multi_stage',
      difficulty: 2,
      desc: '居住在森林边缘的猎户{npcName}最近不敢进森林打猎了——「森林在说话，」他说，眼睛里满是恐惧，「不是鸟鸣，不是风声。它在说话，用一种我听不懂的语言……」',
      rewardGold: 55,
      rewardExp: 140,
      stages: [
        {
          stage: 1,
          goal: '前往森林边缘调查森林低语的现象',
          hint: '去森林边缘听听看——猎户说的低语到底是什么',
          needLocation: 'forest_edge',
          needTime: null,
          needAction: 'move',
          narration: '你站在森林边缘，闭上眼睛仔细聆听。一开始只有风穿过树叶的沙沙声——但渐渐地，你确实听到了。一种低沉、悠扬的嗡鸣声，像是有无数人在远方齐声诵读。那不是任何你认识的语言，但不知为何，你能感受到其中的悲伤。',
        },
        {
          stage: 2,
          goal: '深入幽暗森林追踪声音的来源',
          hint: '循着声音的方向深入森林，找到它的源头',
          needLocation: 'deep_forest',
          needTime: null,
          needAction: 'move',
          narration: '越往深处走，那低语声就越清晰。树木在你身边缓缓移动——不，不是移动，是它们身上浮现出半透明的精灵形态。那些是古代精灵的灵魂碎片，被困在树木中数百年。它们围着你，用那种古老的语言诉说着什么……',
        },
        {
          stage: 3,
          goal: '与古精灵之魂沟通，了解它们的诉求',
          hint: '尝试与这些精灵灵魂交谈，听听它们为什么在低语',
          needLocation: 'deep_forest',
          needTime: null,
          needAction: 'search',
          narration: '精灵灵魂中的一位长者——或者说，她曾经是长者——用断断续续的通用语告诉了你真相。数百年前，一场大裂隙吞噬了他们的圣地。他们的灵魂被困在这些树中，作为裂隙封印的守护者。但现在封印正在衰弱，他们的力量也在消散。' +
                         '如果封印彻底崩溃，被困在裂隙中的东西会涌入森林——而他们的灵魂将永远消失。',
        },
        {
          stage: 4,
          goal: '前往精灵废墟加固裂隙封印',
          hint: '精灵废墟中有一个古老的仪式台，可能可以用来加固封印',
          needLocation: 'elf_ruins',
          needTime: null,
          needAction: 'search',
          narration: '你在精灵废墟找到了那座仪式台——一块巨大的月长石，表面刻满了古老的精灵符文。按照精灵灵魂教你的方法，你将手按在符文上，将自己的生命力注入其中。月长石亮了起来，光芒沿着地面的符文纹路蔓延出去，一直延伸到森林深处……' +
                         '\n\n那些低语声随之停止了。取而代之的是一阵温柔的寂静。',
        },
        {
          stage: 5,
          goal: '回去告诉猎户森林已经安全了',
          hint: '回到森林边缘告诉猎户事情已经解决',
          needLocation: null,
          needTime: null,
          needAction: 'talk',
          narration: '猎户{npcName}半信半疑地跟着你走进森林。走了半个时辰，他忽然停下脚步：「没了……那声音真的没了。」他深吸一口气，露出数月来第一个笑容：「谢谢你，冒险者。我得好好请你去喝一杯——今天先打猎，晚上酒馆见！」',
        },
      ],
    },
  ],

  // ===== 随机任务模板（按类型分类） =====
  QUEST_TEMPLATES: {
    // 🔍 探索/寻找类
    fetch: [
      { id: 'Q_F01', title: '失落的护身符', difficulty: 1, type: 'fetch', desc: '{npcName}的祖传护身符在附近被人偷走了，小偷可能躲在暗巷或附近的角落里。', objective: '找到并取回护身符', location: 'dark_alley', rewardGold: 20, rewardExp: 50, completeHint: '在附近搜索或与路人交谈，找到小偷的踪迹' },
      { id: 'Q_F02', title: '药草采集', difficulty: 1, type: 'fetch', desc: '{npcName}急需一种稀有草药来救治受伤的同伴，这种草药只生长在溪流或森林边缘。', objective: '采集月光苔或生命之叶', location: 'forest_edge', rewardGold: 15, rewardExp: 40, rewardItem: '治疗药水', completeHint: '前往森林边缘或河畔寻找草药' },
      { id: 'Q_F03', title: '遗失的信件', difficulty: 1, type: 'fetch', desc: '{npcName}在匆忙赶路时弄丢了一封重要信件，可能掉在了集市广场和酒馆之间的路上。', objective: '找回遗失的信件', location: 'market_square', rewardGold: 18, rewardExp: 45, completeHint: '在集市广场附近仔细搜索' },
      { id: 'Q_F04', title: '迷路的孩子', difficulty: 1, type: 'fetch', desc: '{npcName}的弟弟在附近玩耍时走丢了，最后一次被看见是在森林边缘附近。', objective: '找到迷路的孩子并带回', location: 'forest_edge', rewardGold: 25, rewardExp: 55, completeHint: '去森林边缘或河畔渡口搜寻' },
      { id: 'Q_F05', title: '矮人的战锤', difficulty: 2, type: 'fetch', desc: '矮人铁匠{npcName}在一次醉酒后把他的祖传战锤忘在了河畔渡口。那可是传了八代人的宝贝——「要是找不回来，我祖父的鬼魂会把我的胡子一根根拔掉的！」', objective: '前往河畔渡口找回矮人的战锤', location: 'river_crossing', rewardGold: 35, rewardExp: 70, rewardItem: '精良磨刀石', completeHint: '去河畔渡口找找看，可能被水流冲到岸边了' },
      { id: 'Q_F06', title: '精灵的古籍', difficulty: 2, type: 'fetch', desc: '精灵学者{npcName}的一本珍贵古籍被风吹进了幽暗森林深处。那本书记载着古老的星辰魔法——「丢了我可没法跟学院交代……」', objective: '深入幽暗森林找回古籍', location: 'deep_forest', rewardGold: 30, rewardExp: 65, completeHint: '深入幽暗森林，古籍可能落在某棵古树附近' },
    ],
    // ⚔️ 战斗/讨伐类
    combat: [
      { id: 'Q_C01', title: '清除史莱姆', difficulty: 1, type: 'combat', desc: '{npcName}的菜窖里爬满了史莱姆，把过冬的蔬菜全都糟蹋了。「再不清理掉这些黏糊糊的东西，今年冬天我们就得啃树皮了！」', objective: '消灭3只史莱姆', targetEnemy: 'slime', killCount: 3, location: 'town_gate', rewardGold: 15, rewardExp: 40, completeHint: '在附近搜索史莱姆的踪迹并消灭它们' },
      { id: 'Q_C02', title: '鼠患成灾', difficulty: 1, type: 'combat', desc: '{npcName}的酒馆地下室被一群巨鼠占领了，酒桶全被咬穿。「那可是我从卡扎杜姆运来的矮人烈酒啊！全没了！全没了！」', objective: '消灭5只巨鼠', targetEnemy: 'giant_rat', killCount: 5, location: 'tavern', rewardGold: 20, rewardExp: 50, rewardItem: '矮人烈酒', completeHint: '前往酒馆或下水道寻找巨鼠' },
      { id: 'Q_C03', title: '哥布林威胁', difficulty: 2, type: 'combat', desc: '{npcName}的农场最近总遭到哥布林的骚扰——庄稼被破坏，鸡被偷走。「再这样下去，今年秋收就别指望了。」', objective: '消灭6只哥布林', targetEnemy: 'goblin', killCount: 6, location: 'forest_edge', rewardGold: 35, rewardExp: 70, completeHint: '哥布林通常出没在森林边缘或地下通道' },
      { id: 'Q_C04', title: '狼群之灾', difficulty: 2, type: 'combat', desc: '{npcName}村庄的羊群接连被灰狼袭击，损失惨重。牧羊人吓得不敢出门——「昨晚我亲眼看见五只狼围住了一头公牛！」', objective: '消灭4只灰狼', targetEnemy: 'wolf', killCount: 4, location: 'forest_edge', rewardGold: 40, rewardExp: 80, completeHint: '灰狼常在森林边缘和河畔渡口出没' },
      { id: 'Q_C05', title: '暗巷威胁', difficulty: 3, type: 'combat', desc: '{npcName}被暗巷里的恶棍头目威胁勒索，如果不定期交保护费就会被痛打一顿。', objective: '击败暗巷中的强盗头目', targetEnemy: 'bandit_boss', killCount: 1, location: 'dark_alley', rewardGold: 60, rewardExp: 120, rewardItem: '武器强化', completeHint: '前往暗巷找到并击败那个恶棍' },
      { id: 'Q_C06', title: '下水道的怪物', difficulty: 3, type: 'combat', desc: '{npcName}的店铺地下室最近总传来奇怪的声响，下水道里似乎潜藏着某种怪物。', objective: '进入下水道消灭怪物', targetEnemy: 'sewer_beast', killCount: 1, location: 'sewer', rewardGold: 65, rewardExp: 140, rewardItem: '特殊饰品', completeHint: '从暗巷或地下通道进入下水道' },
      { id: 'Q_C07', title: '强盗的赃物', difficulty: 3, type: 'combat', desc: '{npcName}所在的商队在河畔渡口被一伙强盗洗劫，货物被抢走，守卫被打伤。', objective: '前往强盗营地击败头目夺回货物', targetEnemy: 'bandit_boss', killCount: 1, location: 'bandit_camp', rewardGold: 80, rewardExp: 160, completeHint: '前往河畔渡口追踪强盗，然后去强盗营地' },
      { id: 'Q_C08', title: '古墓的诅咒', difficulty: 3, type: 'combat', desc: '{npcName}的家族墓穴最近出现了异常——亡灵在夜间徘徊，附近的居民都不敢靠近。', objective: '前往墓园清除亡灵', targetEnemy: 'skeleton', killCount: 5, location: 'graveyard', rewardGold: 70, rewardExp: 150, rewardItem: '圣水', completeHint: '前往墓园调查异常的源头' },
      { id: 'Q_C09', title: '裂隙之影', difficulty: 5, type: 'combat', desc: '{npcName}惊恐地报告说，在幽暗森林深处出现了一道裂隙，从中涌出了混沌的裂隙兽。', objective: '前往裂隙区域消灭裂隙兽', targetEnemy: 'rift_beast', killCount: 1, location: 'rift_zone', rewardGold: 150, rewardExp: 300, rewardItem: '裂隙碎片', completeHint: '深入幽暗森林，找到并进入裂隙区域' },
      { id: 'Q_C10', title: '暗影法师的阴谋', difficulty: 5, type: 'combat', desc: '{npcName}发现一名暗影法师在精灵废墟中进行禁忌的仪式。', objective: '前往精灵废墟阻止暗影法师', targetEnemy: 'dark_mage', killCount: 1, location: 'elf_ruins', rewardGold: 180, rewardExp: 350, rewardItem: '魔法物品', completeHint: '深入幽暗森林找到精灵废墟，击败暗影法师' },
      { id: 'Q_C11', title: '兽人战帮的威胁', difficulty: 5, type: 'combat', desc: '{npcName}的村庄即将遭到一支流浪兽人战帮的袭击。', objective: '在河畔渡口击败兽人战酋', targetEnemy: 'orc_warchief', killCount: 1, location: 'river_crossing', rewardGold: 200, rewardExp: 400, completeHint: '前往河畔渡口设防，迎战兽人战帮' },
      { id: 'Q_C12', title: '地下迷宫的秘宝', difficulty: 6, type: 'combat', desc: '{npcName}拥有一张古老的地图，指向地下通道深处一处被遗忘的密室。但那里盘踞着一只远古巨魔。', objective: '进入地下通道深处击败远古巨魔', targetEnemy: 'ancient_troll', killCount: 1, location: 'underground', rewardGold: 280, rewardExp: 550, rewardItem: '稀有装备', completeHint: '从墓园或暗巷进入地下通道，深入探索' },
    ],
    // 🛡️ 护送/救援类
    escort: [
      { id: 'Q_E01', title: '护送商人', difficulty: 2, type: 'escort', desc: '{npcName}需要将一批贵重货物从集市广场安全运到河畔渡口的商船码头。路上不太平——最近强盗活动频繁。', objective: '护送商人安全抵达河畔渡口', location: 'river_crossing', rewardGold: 40, rewardExp: 75, completeHint: '从集市广场出发，沿途保护商人' },
      { id: 'Q_E02', title: '被困的矿工', difficulty: 3, type: 'escort', desc: '{npcName}的兄弟被困在了地下通道的塌方区域。「求你了，帮我把他救出来！他被困了整整两天了！」', objective: '前往地下通道救出被困的矿工', location: 'underground', rewardGold: 55, rewardExp: 110, completeHint: '进入地下通道，找到塌方区域的位置' },
    ],
    // 📜 调查/解谜类
    mystery: [
      { id: 'Q_M01', title: '奇怪的符号', difficulty: 2, type: 'mystery', desc: '{npcName}在墓园的墓碑上发现了一些从未见过的奇怪符号——它们似乎每隔几天就会自己变化。', objective: '调查墓园中的神秘符号来源', location: 'graveyard', rewardGold: 30, rewardExp: 60, completeHint: '在墓园中仔细观察那些符号，也许夜晚会有发现' },
      { id: 'Q_M02', title: '失踪的巡逻队', difficulty: 3, type: 'mystery', desc: '一支王都巡逻队在精灵废墟附近失踪了整整一周。{npcName}是唯一逃回来报信的士兵——但他已经神志不清，口中只反复念叨着「它们不是石头……」', objective: '前往精灵废墟调查巡逻队失踪的真相', location: 'elf_ruins', rewardGold: 90, rewardExp: 180, completeHint: '前往精灵废墟，寻找巡逻队留下的线索' },
    ],
  },

  // ===== 升级经验公式 =====
  // 1-10级：线性 50×等级 (50, 100, 150...500)
  // 11+级：前5级经验需求的总和
  getExpForLevel(level) {
    if (level <= 1) return 0;
    if (level <= 10) return level * 50;
    // level 11+: 前5级经验之和
    let sum = 0;
    for (let i = level - 5; i < level; i++) {
      sum += this.getExpForLevel(i);
    }
    return sum;
  },
  // 获取升级所需总经验（用于显示进度条）
  getExpNeeded(currentLevel) {
    return this.getExpForLevel(currentLevel + 1);
  },

  // ===== 职业主动技能树 =====
  // 每职业约10个技能，随等级逐步解锁
  // 技能有5个等级，升级需要消耗技能卷轴和金币
  CLASS_SKILL_TREES: {
    // ⚔️ 战士
    warrior: [
      { id: 'ws_power_strike', name: '猛击', levelReq: 1, skillLevels: 5, baseCost: 50, type: '单体攻击', desc: '集中力量发动一次势大力沉的斩击。', effects: { damage: [1.3, 1.5, 1.8, 2.1, 2.5, 3.0], stunChance: [0, 0, 10, 15, 20, 25] }, scrollName: '猛击卷轴' },
      { id: 'ws_block', name: '格挡', levelReq: 1, skillLevels: 5, baseCost: 40, type: '防御', desc: '举起武器或盾牌格挡来袭攻击，大幅减少受到的伤害。', effects: { dmgReduc: [30, 40, 50, 60, 70, 80], counterRate: [0, 0, 15, 20, 25, 30] }, scrollName: '格挡卷轴' },
      { id: 'ws_war_cry', name: '战吼', levelReq: 3, skillLevels: 5, baseCost: 60, type: '增益', desc: '发出震耳欲聋的战吼，提升自身和附近队友的攻击力。', effects: { atkBuff: [10, 15, 20, 25, 30, 40], duration: [2, 2, 3, 3, 4, 5], fearNearby: [false, false, false, true, true, true] }, scrollName: '战吼卷轴' },
      { id: 'ws_whirlwind', name: '旋风斩', levelReq: 5, skillLevels: 5, baseCost: 100, type: '范围攻击', desc: '旋转身体挥舞武器，对周围所有敌人造成伤害。以一己之力横扫千军。', effects: { aoeDmg: [0.8, 1.0, 1.2, 1.4, 1.7, 2.0], hits: [1, 1, 2, 2, 3, 3] }, scrollName: '旋风斩卷轴' },
      { id: 'ws_charge', name: '冲锋', levelReq: 5, skillLevels: 5, baseCost: 80, type: '突进攻击', desc: '以惊人的速度向敌人发起冲锋，先手攻击并附带眩晕。', effects: { dmg: [1.3, 1.5, 1.8, 2.1, 2.5, 3.0], stunTurns: [1, 1, 1, 2, 2, 2], priority: true }, scrollName: '冲锋卷轴' },
      { id: 'ws_armor_break', name: '破甲斩', levelReq: 8, skillLevels: 5, baseCost: 120, type: '削弱攻击', desc: '精确攻击敌人护甲的薄弱处，造成伤害的同时大幅削弱其防御。', effects: { dmg: [1.0, 1.2, 1.4, 1.6, 1.8, 2.0], defReduce: [20, 30, 40, 50, 60, 75] }, scrollName: '破甲斩卷轴' },
      { id: 'ws_indomitable', name: '不屈意志', levelReq: 10, skillLevels: 5, baseCost: 200, type: '生存', desc: '在死亡面前拒绝倒下。受到致命伤害时以1点HP存活，持续战斗。', effects: { surviveHp: [1, 5, 10, 15, 20, 30], atkBoost: [0, 0, 10, 15, 20, 30], cdRounds: [99, 50, 30, 20, 15, 10] }, scrollName: '不屈意志卷轴' },
      { id: 'ws_rend', name: '撕裂', levelReq: 12, skillLevels: 5, baseCost: 180, type: '持续伤害', desc: '在敌人身上留下深可见骨的伤口，持续流血造成伤害。', effects: { initialDmg: [0.8, 1.0, 1.2, 1.4, 1.6, 1.8], bleedDmg: [5, 8, 12, 16, 20, 25], bleedTurns: [2, 2, 3, 3, 4, 4] }, scrollName: '撕裂卷轴' },
      { id: 'ws_blade_storm', name: '剑刃风暴', levelReq: 15, skillLevels: 5, baseCost: 300, type: '终极范围', desc: '化身为人形剑刃风暴，对战场上所有敌人发动毁灭性的连续斩击。战士的终极奥义。', effects: { hits: [3, 4, 5, 6, 8, 10], perHitDmg: [0.5, 0.6, 0.7, 0.8, 0.9, 1.0], selfDmg: [0, 0, 0, -5, -10, -15] }, scrollName: '剑刃风暴卷轴' },
      { id: 'ws_avatar_war', name: '战神降临', levelReq: 20, skillLevels: 1, baseCost: 500, type: '变身·终极', desc: '呼唤远古战神的意志降临己身。所有属性大幅提升，每次攻击附带额外真实伤害。持续时间结束后进入虚弱状态。', effects: { allStats: [10], dmgBuff: [50], duration: [5], exhaustTurns: [3] }, scrollName: '战神降临秘卷' },
    ],
    // 🔮 法师
    mage: [
      { id: 'ms_fireball', name: '火球术', levelReq: 1, skillLevels: 5, baseCost: 50, type: '单体攻击', desc: '凝聚火焰元素形成一颗炽热的火球射向敌人。最经典的攻击法术。', effects: { dmg: [1.5, 1.8, 2.2, 2.6, 3.0, 3.5], burnChance: [0, 10, 15, 20, 25, 30], burnDmg: [0, 3, 5, 8, 10, 15] }, scrollName: '火球术卷轴' },
      { id: 'ms_frost', name: '冰霜术', levelReq: 1, skillLevels: 5, baseCost: 50, type: '控制攻击', desc: '将空气中的水分凝结为锋利的冰锥射向敌人，寒冷可以减缓敌人的行动。', effects: { dmg: [1.2, 1.4, 1.7, 2.0, 2.4, 2.8], slowTurns: [1, 1, 2, 2, 3, 3], slowPercent: [20, 25, 30, 35, 40, 50] }, scrollName: '冰霜术卷轴' },
      { id: 'ms_arcane_missile', name: '奥术飞弹', levelReq: 1, skillLevels: 5, baseCost: 40, type: '多段攻击', desc: '释放数枚纯粹的奥术能量飞弹，自动追踪目标且几乎无法被闪避。', effects: { missiles: [2, 3, 4, 5, 6, 8], perDmg: [0.4, 0.45, 0.5, 0.55, 0.6, 0.7], cannotMiss: true }, scrollName: '奥术飞弹卷轴' },
      { id: 'ms_shield', name: '魔法护盾', levelReq: 3, skillLevels: 5, baseCost: 60, type: '防御', desc: '在身边凝聚一层奥术护盾，吸收即将到来的伤害。法师最重要的保命技能。', effects: { absorbHp: [20, 35, 50, 70, 90, 120], manaConvert: [0, 0, true, true, true, true] }, scrollName: '魔法护盾卷轴' },
      { id: 'ms_blizzard', name: '暴风雪', levelReq: 5, skillLevels: 5, baseCost: 120, type: '范围攻击', desc: '召唤一场小型的暴风雪覆盖一片区域，对区域内所有敌人造成寒冷伤害并减速。', effects: { aoeDmg: [1.0, 1.2, 1.5, 1.8, 2.2, 2.5], freezeChance: [0, 5, 10, 15, 20, 25], duration: [2, 2, 3, 3, 4, 4] }, scrollName: '暴风雪卷轴' },
      { id: 'ms_lightning', name: '闪电链', levelReq: 5, skillLevels: 5, baseCost: 100, type: '连锁攻击', desc: '释放一道闪电击中目标，然后弹跳到附近的其他敌人。连锁次数随技能等级增加。', effects: { dmg: [1.2, 1.4, 1.7, 2.0, 2.4, 2.8], chainTargets: [2, 2, 3, 3, 4, 5], chainDmgFalloff: [20, 15, 15, 10, 10, 5] }, scrollName: '闪电链卷轴' },
      { id: 'ms_meteor', name: '陨石术', levelReq: 10, skillLevels: 5, baseCost: 200, type: '强力范围', desc: '从天空中召唤一颗燃烧的陨石砸向目标区域。威力巨大，但施法时间较长。', effects: { aoeDmg: [2.0, 2.5, 3.0, 3.5, 4.0, 5.0], stunAll: [false, false, true, true, true, true], aoeSize: ['小', '小', '中', '中', '大', '大'] }, scrollName: '陨石术卷轴' },
      { id: 'ms_teleport', name: '闪现', levelReq: 8, skillLevels: 5, baseCost: 150, type: '位移', desc: '短暂扭曲空间，瞬间移动到附近的一个位置。法师用来保命和控位的核心技能。', effects: { range: ['5米', '8米', '12米', '16米', '20米', '25米'], cdRounds: [5, 4, 4, 3, 3, 2], afterDmg: [0, 0, 0, 10, 15, 20] }, scrollName: '闪现卷轴' },
      { id: 'ms_mana_burst', name: '魔力爆发', levelReq: 15, skillLevels: 5, baseCost: 250, type: '爆发', desc: '将大量魔力压缩后瞬间释放，对单体目标造成恐怖的魔法伤害。消耗极大，但威力无与伦比。', effects: { dmg: [3.0, 3.5, 4.0, 4.5, 5.0, 6.0], manaDrain: [30, 40, 50, 60, 70, 80], ignoreDef: [0, 0, 20, 30, 40, 50] }, scrollName: '魔力爆发卷轴' },
      { id: 'ms_arcane_supreme', name: '奥术至高', levelReq: 20, skillLevels: 1, baseCost: 500, type: '领域·终极', desc: '展开奥术至高领域——在领域内，所有法术效果翻倍，魔力消耗减半。法术的极致，凡人之躯触碰到的至高真理。', effects: { spellBuff: [100], manaReduc: [50], duration: [5], exhaustDamage: [30] }, scrollName: '奥术至高秘卷' },
    ],
    // 🗡️ 游荡者
    rogue: [
      { id: 'rg_backstab', name: '背刺', levelReq: 1, skillLevels: 5, baseCost: 50, type: '单体爆发', desc: '从目标背后发动致命的精确打击。潜行状态下使用伤害翻倍。', effects: { dmg: [1.8, 2.2, 2.6, 3.0, 3.5, 4.0], stealthDmg: [2.5, 3.0, 3.5, 4.0, 4.5, 5.5], critRate: [10, 15, 20, 25, 30, 35] }, scrollName: '背刺卷轴' },
      { id: 'rg_stealth', name: '潜行', levelReq: 1, skillLevels: 5, baseCost: 40, type: '状态', desc: '融入阴影之中，在短时间内变得几乎无法被察觉。潜行中的第一次攻击造成额外伤害。', effects: { duration: [2, 3, 4, 5, 6, 8], stealthBonus: [20, 30, 40, 50, 60, 70], moveSpeed: [0, 0, 50, 100, 100, 100] }, scrollName: '潜行卷轴' },
      { id: 'rg_poison', name: '涂毒', levelReq: 3, skillLevels: 5, baseCost: 60, type: '持续伤害', desc: '在武器上涂抹致命的毒药，使攻击附带持续的中毒伤害。', effects: { poisonDmg: [5, 8, 12, 16, 20, 30], duration: [2, 2, 3, 3, 4, 5], slowEffect: [0, 0, 10, 15, 20, 25] }, scrollName: '涂毒卷轴' },
      { id: 'rg_picklock', name: '开锁', levelReq: 1, skillLevels: 5, baseCost: 30, type: '功能', desc: '使用开锁工具撬开锁住的门或宝箱。技能等级越高，能打开越复杂的锁。', effects: { successRate: [50, 60, 70, 80, 90, 100], safeRetry: [false, false, true, true, true, true], magicLock: [false, false, false, true, true, true] }, scrollName: '开锁工具包' },
      { id: 'rg_smoke_bomb', name: '烟雾弹', levelReq: 5, skillLevels: 5, baseCost: 80, type: '控制', desc: '投掷一枚烟雾弹，制造大片烟雾遮蔽敌人视线。在此期间可安全逃跑或重新潜行。', effects: { aoeSize: ['3米', '4米', '5米', '6米', '8米', '10米'], blindTurns: [1, 1, 2, 2, 3, 3], stealthReset: [false, false, true, true, true, true] }, scrollName: '烟雾弹卷轴' },
      { id: 'rg_shadow_step', name: '影步', levelReq: 8, skillLevels: 5, baseCost: 150, type: '位移', desc: '融入阴影瞬间出现在目标身后。影步之后的下一次攻击必定暴击。', effects: { range: ['5米', '10米', '15米', '20米', '30米', '50米'], nextCrit: [true, true, true, true, true, true], cdRounds: [5, 4, 4, 3, 3, 2] }, scrollName: '影步卷轴' },
      { id: 'rg_garrote', name: '绞喉', levelReq: 10, skillLevels: 5, baseCost: 180, type: '沉默攻击', desc: '从暗处勒住目标的喉咙，造成持续伤害并使其在短时间内无法施法和呼救。', effects: { dmg: [1.5, 1.8, 2.2, 2.6, 3.0, 3.5], silenceTurns: [1, 1, 2, 2, 3, 3], stealthOnly: true }, scrollName: '绞喉卷轴' },
      { id: 'rg_fan_knives', name: '飞刀乱舞', levelReq: 12, skillLevels: 5, baseCost: 200, type: '范围攻击', desc: '向面前扇形区域投掷多把飞刀，每把飞刀独立计算命中和暴击。', effects: { knives: [3, 4, 5, 6, 7, 9], perDmg: [0.5, 0.6, 0.7, 0.8, 0.9, 1.0], poisonProc: [true, true, true, true, true, true] }, scrollName: '飞刀乱舞卷轴' },
      { id: 'rg_assassinate', name: '暗杀', levelReq: 15, skillLevels: 5, baseCost: 300, type: '单体终极', desc: '游荡者的终极刺杀技艺——用尽全力发动一次无法被防御的攻击。对满血目标造成巨额额外伤害。', effects: { dmg: [3.0, 3.5, 4.0, 4.5, 5.0, 6.0], fullHpBonus: [100, 120, 150, 180, 200, 250], bypassArmor: [0, 0, 20, 40, 60, 80] }, scrollName: '暗杀秘卷' },
      { id: 'rg_death_mark', name: '死亡印记', levelReq: 20, skillLevels: 1, baseCost: 500, type: '标记·终极', desc: '在目标的灵魂上刻下死亡印记。被标记的目标受到的所有伤害增加50%，且你可以随时感知他的位置。持续至目标死亡。每次只能标记一个目标。', effects: { dmgTakenIncrease: [50], trackTarget: [true], markDuration: ['永久'], exhaustDamage: [20] }, scrollName: '死亡印记秘卷' },
    ],
    // ✝️ 牧师
    cleric: [
      { id: 'cl_heal', name: '治疗术', levelReq: 1, skillLevels: 5, baseCost: 40, type: '治疗', desc: '引导圣光之力治愈一名队友的伤口。牧师最核心也是最重要的能力。', effects: { heal: [15, 25, 35, 50, 65, 80], bonus: ['+魅力', '+魅力', '+魅力×2', '+魅力×2', '+魅力×3', '+魅力×3'] }, scrollName: '治疗术卷轴' },
      { id: 'cl_holy_light', name: '圣光', levelReq: 1, skillLevels: 5, baseCost: 50, type: '神圣攻击', desc: '召唤一道神圣的光柱打击敌人。对亡灵和恶魔类敌人造成双倍伤害。', effects: { dmg: [1.3, 1.6, 2.0, 2.4, 2.8, 3.5], undeadMult: [2.0, 2.2, 2.5, 2.8, 3.0, 3.5], blindChance: [0, 0, 5, 10, 15, 20] }, scrollName: '圣光卷轴' },
      { id: 'cl_dispel', name: '驱散', levelReq: 3, skillLevels: 5, baseCost: 50, type: '净化', desc: '以圣光之力驱散目标身上的负面魔法效果和诅咒。高级别可驱散更强大的诅咒。', effects: { dispelCount: [1, 1, 2, 2, 3, 3], curseRemove: [false, false, true, true, true, true], debuffImmune: [0, 0, 1, 2, 3, 4] }, scrollName: '驱散卷轴' },
      { id: 'cl_blessing', name: '祝福', levelReq: 1, skillLevels: 5, baseCost: 30, type: '增益', desc: '向一名盟友施加圣光的祝福，提升其攻击、防御或所有属性（随等级提升）。', effects: { buffAmount: [5, 8, 12, 16, 20, 25], duration: [3, 3, 4, 4, 5, 6], allStats: [false, false, false, true, true, true] }, scrollName: '祝福卷轴' },
      { id: 'cl_holy_shield', name: '圣光护盾', levelReq: 5, skillLevels: 5, baseCost: 80, type: '防护', desc: '以圣光编织护盾包裹一名盟友，吸收即将到来的伤害。护盾破裂时会释放一道小型圣光治疗。', effects: { shieldHp: [30, 50, 70, 100, 130, 180], burstHeal: [10, 15, 20, 25, 30, 40] }, scrollName: '圣光护盾卷轴' },
      { id: 'cl_group_heal', name: '群体治疗', levelReq: 8, skillLevels: 5, baseCost: 150, type: '群体治疗', desc: '释放圣光的温暖光辉，同时治疗全体队友。在面对群体伤害时不可或缺。', effects: { healPer: [10, 15, 20, 25, 30, 40], bonus: ['+魅力', '+魅力', '+魅力×1.5', '+魅力×1.5', '+魅力×2', '+魅力×2'] }, scrollName: '群体治疗卷轴' },
      { id: 'cl_holy_smite', name: '神圣惩击', levelReq: 10, skillLevels: 5, baseCost: 180, type: '强力神圣', desc: '召唤天罚般的圣光之力重击单个敌人。对邪恶阵营生物造成毁灭性打击。', effects: { dmg: [2.5, 3.0, 3.5, 4.0, 4.5, 5.5], evilBonus: [50, 80, 100, 130, 150, 200], stunChance: [10, 15, 20, 25, 30, 40] }, scrollName: '神圣惩击卷轴' },
      { id: 'cl_holy_aura', name: '圣光光环', levelReq: 12, skillLevels: 5, baseCost: 200, type: '光环', desc: '展开一个持续的圣光光环，为范围内的队友提供持续恢复和暗影抗性。', effects: { tickHeal: [3, 5, 7, 10, 13, 18], duration: [5, 6, 7, 8, 9, 10], shadowResist: [15, 20, 25, 30, 40, 50] }, scrollName: '圣光光环卷轴' },
      { id: 'cl_resurrection', name: '复活术', levelReq: 15, skillLevels: 5, baseCost: 350, type: '复活', desc: '将一名刚刚死去的队友从死亡的边缘拉回。这是最神圣也最难掌握的牧师神术。', effects: { reviveHp: [15, 25, 35, 50, 65, 80], battleUse: [false, false, true, true, true, true], cdMinutes: [60, 40, 30, 20, 15, 10] }, scrollName: '复活术卷轴' },
      { id: 'cl_lesser_prophecy', name: '大预言术（弱化）', levelReq: 20, skillLevels: 1, baseCost: 500, type: '神迹·终极', desc: '向圣光之神祷告，请求永久改变世界的一小部分。愿瘟疫消散、愿此剑永锋——改变必须是善良且合情合理的。圣光之神不会回应贪婪或邪恶的祷告。', effects: { permanentChange: [true], cooldown: ['每日一次'], exhaustDamage: [50] }, scrollName: '大预言术秘卷' },
    ],
    // 🌿 德鲁伊
    druid: [
      { id: 'dr_thorn_grasp', name: '荆棘缠绕', levelReq: 1, skillLevels: 5, baseCost: 50, type: '控制', desc: '从地面召唤荆棘藤蔓缠绕敌人，造成伤害并限制其行动。', effects: { dmg: [1.0, 1.2, 1.5, 1.8, 2.2, 2.5], rootTurns: [1, 2, 2, 3, 3, 4], bleedDmg: [0, 0, 3, 5, 8, 10] }, scrollName: '荆棘缠绕卷轴' },
      { id: 'dr_life_bloom', name: '生命绽放', levelReq: 1, skillLevels: 5, baseCost: 40, type: '治疗', desc: '让一朵生命之花在目标身上绽放，持续恢复生命值。与自然共鸣越深，花朵越灿烂。', effects: { tickHeal: [5, 8, 12, 16, 20, 25], duration: [3, 3, 4, 4, 5, 5], expireHeal: [0, 10, 15, 20, 25, 35] }, scrollName: '生命绽放卷轴' },
      { id: 'dr_beast_summon', name: '野兽召唤', levelReq: 3, skillLevels: 5, baseCost: 80, type: '召唤', desc: '呼唤森林中的野兽前来助战。可召唤的野兽随技能等级提升——从狼到熊再到远古之灵。', effects: { summonTier: ['狼', '熊', '巨鹰', '石化蜥蜴', '独角兽', '远古之灵'], duration: [3, 3, 4, 4, 5, 6], hpPercent: [60, 70, 80, 90, 100, 120] }, scrollName: '野兽召唤卷轴' },
      { id: 'dr_wild_shape', name: '野性变形', levelReq: 5, skillLevels: 5, baseCost: 100, type: '变形', desc: '变身为动物形态，获得该动物的能力和属性。形态随技能等级解锁。', effects: { forms: ['狼', '熊', '巨鹰', '石化蜥蜴', '土元素', '远古守护者'], duration: [3, 4, 5, 6, 7, 8], bonusHp: [20, 40, 60, 80, 100, 150] }, scrollName: '野性变形卷轴' },
      { id: 'dr_vine_wall', name: '藤蔓之墙', levelReq: 5, skillLevels: 5, baseCost: 90, type: '障碍', desc: '催生一道粗壮的荆棘藤蔓墙，阻挡敌人的前进并伤害试图穿越的生物。', effects: { width: ['3米', '5米', '8米', '10米', '12米', '15米'], duration: [2, 3, 3, 4, 4, 5], thornDmg: [5, 8, 12, 16, 20, 25] }, scrollName: '藤蔓之墙卷轴' },
      { id: 'dr_natures_wrath', name: '自然之怒', levelReq: 8, skillLevels: 5, baseCost: 150, type: '范围攻击', desc: '激发大自然的愤怒——召唤狂风、尖石和树枝同时攻击所有敌人。', effects: { aoeDmg: [1.2, 1.5, 1.8, 2.2, 2.6, 3.0], randomEffect: [true, true, true, true, true, true], stunChance: [5, 10, 15, 20, 25, 30] }, scrollName: '自然之怒卷轴' },
      { id: 'dr_rejuvenation', name: '森林复苏', levelReq: 10, skillLevels: 5, baseCost: 160, type: '强力治疗', desc: '引导整片森林的生命能量灌注目标，造成巨额治疗效果并移除所有负面状态。', effects: { heal: [50, 70, 90, 120, 150, 200], cleanseAll: [false, false, true, true, true, true], buffTurns: [0, 0, 0, 2, 3, 4] }, scrollName: '森林复苏卷轴' },
      { id: 'dr_solar_beam', name: '日光束', levelReq: 12, skillLevels: 5, baseCost: 200, type: '射线', desc: '吸收阳光的力量，从指尖释放一道灼热的日光射线。对亡灵和暗影生物造成巨额伤害。', effects: { dmg: [2.0, 2.5, 3.0, 3.5, 4.0, 5.0], undeadMult: [1.5, 2.0, 2.5, 3.0, 3.5, 4.0], pierce: [false, false, true, true, true, true] }, scrollName: '日光束卷轴' },
      { id: 'dr_nature_avatar', name: '自然化身', levelReq: 15, skillLevels: 5, baseCost: 300, type: '增益·终极', desc: '成为大自然意志的化身。所有自然系技能效果大幅提升，同时持续回复生命和法力。', effects: { natureBuff: [30, 40, 50, 60, 70, 80], regenPerTurn: [5, 8, 10, 15, 20, 25], duration: [3, 4, 4, 5, 5, 6] }, scrollName: '自然化身卷轴' },
      { id: 'dr_ecosystem_call', name: '万灵之唤', levelReq: 20, skillLevels: 1, baseCost: 500, type: '奇迹·终极', desc: '呼唤整个生态系统的力量——树木拔根而起为你而战，河流改道淹没敌人，飞禽走兽响应你的召唤。这是一次与大自然最深层的共鸣。', effects: { armyCall: [true], terrainChange: [true], duration: [5], exhaustDamage: [40] }, scrollName: '万灵之唤秘卷' },
    ],
    // 🛡️ 圣骑士
    paladin: [
      { id: 'pl_holy_slash', name: '圣光斩', levelReq: 1, skillLevels: 5, baseCost: 50, type: '神圣攻击', desc: '以圣光覆盖武器，发动一次附带神圣伤害的斩击。对邪恶阵营造成额外伤害。', effects: { dmg: [1.3, 1.5, 1.8, 2.2, 2.6, 3.0], holyDmg: [10, 15, 20, 25, 35, 50], evilBonus: [20, 30, 40, 50, 60, 80] }, scrollName: '圣光斩卷轴' },
      { id: 'pl_holy_shield', name: '神圣护盾', levelReq: 1, skillLevels: 5, baseCost: 40, type: '防护', desc: '凝聚圣光形成一面神圣之盾，大幅提升自身或队友的防御力。', effects: { defBonus: [15, 25, 35, 45, 55, 70], duration: [2, 3, 3, 4, 4, 5], holyReflect: [0, 0, 10, 15, 20, 25] }, scrollName: '神圣护盾卷轴' },
      { id: 'pl_healing_hand', name: '治愈之手', levelReq: 3, skillLevels: 5, baseCost: 50, type: '治疗', desc: '圣骑士将圣光的力量凝聚掌心，直接触碰伤者进行治愈。虽然不如牧师的治疗精湛，但在战场上更加实用。', effects: { heal: [12, 20, 30, 40, 55, 70], removeBleed: [false, true, true, true, true, true], selfUse: [true, true, true, true, true, true] }, scrollName: '治愈之手卷轴' },
      { id: 'pl_hammer_justice', name: '制裁之锤', levelReq: 5, skillLevels: 5, baseCost: 80, type: '控制攻击', desc: '投掷一把圣光铸成的战锤击晕目标。距离越近，眩晕时间越长。', effects: { dmg: [1.0, 1.2, 1.5, 1.8, 2.2, 2.5], stunTurns: [1, 1, 2, 2, 3, 3], range: ['近', '近', '中', '中', '远', '远'] }, scrollName: '制裁之锤卷轴' },
      { id: 'pl_consecration', name: '奉献', levelReq: 5, skillLevels: 5, baseCost: 100, type: '领域', desc: '圣化脚下的大地，创造一片圣光领域。领域内的敌人持续受到神圣伤害，盟友则获得微弱恢复。', effects: { aoeDmg: [5, 8, 10, 13, 16, 20], tickHeal: [2, 3, 5, 7, 9, 12], duration: [3, 4, 4, 5, 5, 6] }, scrollName: '奉献卷轴' },
      { id: 'pl_divine_steed', name: '神圣战马', levelReq: 8, skillLevels: 5, baseCost: 120, type: '坐骑', desc: '召唤一匹圣光战马，大幅提升移动速度并可在冲锋时造成践踏伤害。', effects: { speedBonus: [30, 40, 50, 60, 80, 100], trampleDmg: [10, 15, 20, 25, 35, 50], duration: [3, 4, 4, 5, 5, 6] }, scrollName: '神圣战马卷轴' },
      { id: 'pl_lay_on_hands', name: '圣疗术', levelReq: 10, skillLevels: 5, baseCost: 200, type: '强力治疗', desc: '将圣光之力灌注掌心进行的一次极效治疗。可以瞬间将一名濒死的盟友拉回满状态——但冷却时间极长。', effects: { healPercent: [50, 60, 70, 80, 90, 100], cdMinutes: [30, 25, 20, 15, 12, 10], removeAllBad: [false, false, true, true, true, true] }, scrollName: '圣疗术卷轴' },
      { id: 'pl_avenging_wrath', name: '复仇之怒', levelReq: 12, skillLevels: 5, baseCost: 180, type: '爆发', desc: '进入神圣愤怒的状态，攻击力、防御力和速度全面提升。持续时间内圣骑士化身为战场上最耀眼的存在。', effects: { allBuff: [20, 25, 30, 35, 40, 50], duration: [3, 3, 4, 4, 5, 5], fearNearbyEnemy: [false, false, false, true, true, true] }, scrollName: '复仇之怒卷轴' },
      { id: 'pl_divine_storm', name: '神圣风暴', levelReq: 15, skillLevels: 5, baseCost: 250, type: '范围爆发', desc: '以自身为中心释放一道向外扩散的神圣风暴，对大范围敌人造成巨额神圣伤害并治疗所有队友。', effects: { aoeDmg: [1.5, 1.8, 2.2, 2.6, 3.0, 3.5], healPerAlly: [10, 15, 20, 25, 35, 50], superEffective: ['undead', 'demon'] }, scrollName: '神圣风暴卷轴' },
      { id: 'pl_avatar_light', name: '圣光化身', levelReq: 20, skillLevels: 1, baseCost: 500, type: '变身·终极', desc: '与圣光合为一体——化身为纯粹的光明形态。在此期间圣光伤害翻倍、免疫暗影、近战范围扩大，且每回合自动释放一次免费群体治疗。圣骑士的终极形态。', effects: { holyDmgDouble: [true], shadowImmune: [true], duration: [5], autoHeal: [20], exhaustDamage: [40] }, scrollName: '圣光化身秘卷' },
    ],
    // 🪨 萨满
    shaman: [
      { id: 'sm_ancestral_fury', name: '先祖之怒', levelReq: 1, skillLevels: 5, baseCost: 50, type: '灵魂攻击', desc: '呼唤先祖的灵魂之力发动攻击。先祖的怒火既灼烧肉体也震撼灵魂。', effects: { dmg: [1.3, 1.5, 1.8, 2.2, 2.6, 3.0], spiritDmg: [5, 8, 12, 16, 20, 25], fearChance: [0, 0, 5, 10, 15, 20] }, scrollName: '先祖之怒卷轴' },
      { id: 'sm_totem', name: '图腾召唤', levelReq: 1, skillLevels: 5, baseCost: 60, type: '召唤', desc: '插下一根图腾柱，为范围内的盟友提供持续的增益效果。图腾类型随等级解锁。', effects: { totemTypes: ['攻击图腾', '防御图腾', '治疗图腾', '减速图腾', '火焰图腾', '先祖图腾'], duration: [3, 4, 4, 5, 5, 6], range: ['小', '小', '中', '中', '大', '大'] }, scrollName: '图腾召唤卷轴' },
      { id: 'sm_elemental_resonance', name: '元素共鸣', levelReq: 3, skillLevels: 5, baseCost: 70, type: '元素增益', desc: '与周围的元素精魂达成共鸣，获得元素力量的加成。当前环境的元素类型决定加成效果。', effects: { elemBuff: [10, 15, 20, 25, 35, 50], duration: [3, 4, 5, 6, 7, 8], nearbyElemBonus: [true, true, true, true, true, true] }, scrollName: '元素共鸣卷轴' },
      { id: 'sm_spirit_link', name: '灵魂链接', levelReq: 5, skillLevels: 5, baseCost: 80, type: '治疗/转移', desc: '在自身与一名盟友之间建立灵魂链接。链接期间，双方受到的伤害会被分担，并持续共享生命恢复。', effects: { dmgShare: [30, 40, 50, 60, 70, 80], tickHeal: [3, 5, 7, 10, 13, 18], duration: [3, 3, 4, 4, 5, 5] }, scrollName: '灵魂链接卷轴' },
      { id: 'sm_lightning_bolt', name: '闪电箭', levelReq: 5, skillLevels: 5, baseCost: 90, type: '元素攻击', desc: '召唤一道天雷劈向敌人。萨满最直接、最纯粹的元素攻击法术。', effects: { dmg: [1.5, 1.8, 2.2, 2.6, 3.0, 3.5], chainChance: [0, 10, 15, 20, 25, 30], stunChance: [5, 10, 15, 20, 25, 30] }, scrollName: '闪电箭卷轴' },
      { id: 'sm_earthquake', name: '地震术', levelReq: 8, skillLevels: 5, baseCost: 150, type: '范围攻击', desc: '以图腾猛击地面引发地震，对范围内所有敌人造成伤害并降低他们的命中率。', effects: { aoeDmg: [1.0, 1.2, 1.5, 1.8, 2.2, 2.5], accuracyDown: [10, 15, 20, 25, 30, 40], duration: [2, 2, 3, 3, 4, 4] }, scrollName: '地震术卷轴' },
      { id: 'sm_ancestor_possess', name: '先祖附身', levelReq: 10, skillLevels: 5, baseCost: 180, type: '强化', desc: '请一位先祖的灵魂短暂附身于自己或队友身上，大幅提升战斗能力并获得特殊技能。', effects: { allStatsBonus: [3, 4, 5, 6, 7, 8], duration: [3, 3, 4, 4, 5, 5], extraSkill: [true, true, true, true, true, true] }, scrollName: '先祖附身卷轴' },
      { id: 'sm_frost_shock', name: '冰霜震击', levelReq: 12, skillLevels: 5, baseCost: 160, type: '控制攻击', desc: '将冰霜元素与先祖之怒融合，释放一道冰冷的灵魂冲击，伤害敌人的同时大幅减速。', effects: { dmg: [1.5, 1.8, 2.2, 2.6, 3.0, 3.5], slowAmount: [30, 40, 50, 60, 70, 80], freezeChance: [0, 0, 5, 10, 15, 25] }, scrollName: '冰霜震击卷轴' },
      { id: 'sm_spirit_wolf', name: '幽灵狼', levelReq: 15, skillLevels: 5, baseCost: 250, type: '召唤/形态', desc: '召唤两只幽灵狼为你战斗，或变化为幽灵狼形态获得超高移动速度和闪避。', effects: { wolfCount: [1, 2, 2, 3, 3, 4], wolfDmg: [15, 20, 25, 30, 35, 40], speedBonus: [30, 50, 70, 90, 110, 150] }, scrollName: '幽灵狼卷轴' },
      { id: 'sm_elemental_avatar', name: '元素化身', levelReq: 20, skillLevels: 1, baseCost: 500, type: '变身·终极', desc: '召唤四元素之力汇聚于身——化身为元素风暴形态。同时获得火焰、冰霜、闪电、大地四种元素的加持，所有元素伤害翻倍，持续时间内不断释放元素脉冲。', effects: { elemDmgDouble: [true], elemPulse: [true], duration: [5], exhaustDamage: [40] }, scrollName: '元素化身秘卷' },
    ],
  },

  // ===== 技能卷轴商店 =====
  SKILL_SCROLL_COSTS: {
    // 卷轴价格 = baseCost × skillLevel
    // 每职业的每个技能在对应等级的金币消耗
  },

  // ===== 游戏发展方向 =====
  DEVELOPMENT_ROADMAP: {
    phase1: {
      title: '第一阶段：起源（当前）',
      desc: '核心玩法框架。单人沉浸叙事、自由探索、回合制战斗、D20技能检定、多职业多种族体系。',
      features: ['角色创建·种族职业天赋', 'AI叙事引擎', '回合制战斗系统', 'D20技能检定', '地图探索', '背包与装备', '天生被动技能成长', '觉醒新手教程', '阵营与声望'],
    },
    phase2: {
      title: '第二阶段：成长',
      desc: '角色深度发展。技能树扩展、装备锻造与附魔、公会/阵营任务线、世界BOSS。',
      features: ['主动技能树（每职业12+技能）', '装备锻造系统（矮人专属加成）', '附魔与符文铭刻', '阵营声望任务线', '世界BOSS（裂隙龙等）', '藏宝图与秘境探索', '宠物/坐骑系统'],
    },
    phase3: {
      title: '第三阶段：纷争',
      desc: '多人互动深化。阵营PVP、世界事件、公会领地、交易行。',
      features: ['阵营PVP战场', '世界动态事件（裂隙入侵等）', '公会创建·公会领地·公会战', '玩家交易行', '竞技场排名赛', '跨时代联合事件'],
    },
    phase4: {
      title: '第四阶段：传说',
      desc: '终极内容。神级难度副本、传承武器、玩家自定义NPC/任务、跨时代史诗战役。',
      features: ['史诗级团队副本', '「传承武器」系统（随玩家成长的专属神器）', '玩家自定义任务/地牢', 'NPC养成与派遣', '跨时代最终战役：裂隙之王', '新种族：半龙人/妖精/元素裔'],
    },
  },
};
