/**
 * Item System - 物品与装备系统
 * 管理装备品质、生成、装备/卸下、属性计算
 */

// ==================== 装备品质定义 ====================
const EQUIPMENT_QUALITIES = {
  broken: {
    tier: 0,
    name: '破损',
    color: '#555555',
    glow: 'none',
    statRange: [1, 9],
    rarity: 'common',
    description: '破损的装备，属性极低'
  },
  common: {
    tier: 1,
    name: '崭新',
    color: '#ffffff',
    glow: 'none',
    statRange: [10, 50],
    rarity: 'common',
    description: '崭新的一般装备'
  },
  rare: {
    tier: 2,
    name: '稀有',
    color: '#00ff00',
    glow: '0 0 8px rgba(0, 255, 0, 0.5)',
    rarity: 'uncommon',
    statRange: [50, 100],
    description: '散发绿色光芒的稀有装备'
  },
  precious: {
    tier: 3,
    name: '珍贵',
    color: '#4488ff',
    glow: '0 0 10px rgba(68, 136, 255, 0.6)',
    rarity: 'rare',
    statRange: [100, 999],
    description: '散发蓝色光芒的珍贵装备'
  },
  epic: {
    tier: 4,
    name: '史诗',
    color: '#aa44ff',
    glow: '0 0 14px rgba(170, 68, 255, 0.7)',
    rarity: 'veryRare',
    statRange: [1000, 9999],
    description: '散发紫色光芒的史诗装备，极其稀有'
  },
  legendary: {
    tier: 5,
    name: '传说',
    color: '#ff8800',
    glow: '0 0 18px rgba(255, 136, 0, 0.8)',
    rarity: 'legendary',
    statRange: [0, 0], // 传说不加基础属性，使用百分比加成
    damagePercent: 500, // 500% 伤害加成
    description: '散发橙色光芒的传说装备，拥有极高的成长属性'
  },
  mythic: {
    tier: 6,
    name: '神话',
    color: '#ff00ff',
    glow: '0 0 10px rgba(255, 0, 0, 0.6), 0 0 20px rgba(255, 165, 0, 0.5), 0 0 30px rgba(255, 255, 0, 0.4), 0 0 40px rgba(0, 255, 0, 0.3), 0 0 50px rgba(0, 0, 255, 0.3), 0 0 60px rgba(75, 0, 130, 0.2)',
    rarity: 'mythic',
    statRange: [0, 0], // 神话不加基础属性，使用百分比加成
    damagePercent: 750, // 750% 伤害加成
    description: '散发彩虹光芒的神话装备，毁天灭地的力量'
  }
};

// ==================== 装备槽位定义 ====================
const EQUIPMENT_SLOTS = ['weapon', 'armor', 'gloves1', 'gloves2', 'shoes'];

// ==================== 职业护甲名称 ====================
const CLASS_ARMOR_NAMES = {
  mage: {
    type: '法袍',
    names: ['织法长袍', '奥术法袍', '元素长袍', '星辰法袍']
  },
  priest: {
    type: '法袍',
    names: ['圣光法袍', '治愈法袍', '信仰法袍', '救赎法袍']
  },
  druid: {
    type: '法袍',
    names: ['自然法袍', '丛林法袍', '野性法袍', '月神法袍']
  },
  warrior: {
    type: '铠甲',
    names: ['钢铁铠甲', '龙鳞铠甲', '血怒铠甲', '不屈铠甲']
  },
  rogue: {
    type: '布甲',
    names: ['暗影布甲', '潜行布甲', '夜刃布甲', '诡诈布甲']
  },
  paladin: {
    type: '板甲',
    names: ['圣光板甲', '审判板甲', '壁垒板甲', '守护板甲']
  },
  shaman: {
    type: '图腾锁甲',
    names: ['元素锁甲', '先祖锁甲', '雷霆锁甲', '灵魂锁甲']
  }
};

// ==================== 传说/神话武器名称和典故 ====================
const LEGENDARY_WEAPONS = [
  {
    name: '裂隙破碎者',
    lore: '在第一次裂隙战争中，矮人王戈尔林用星辰之铁铸造了这把巨锤。他独自一人面对裂隙领主，用此锤击碎了十二道裂隙之门，最终力竭而亡。锤身上至今残留着裂隙的能量。',
    type: 'hammer'
  },
  {
    name: '永夜之刃',
    lore: '暗影精灵女王艾琳希尔的佩剑，在月蚀之夜由暗影龙的心脏锻造而成。传说持剑者可以在月光下隐身，刀刃能切开现实与暗影之间的帷幕。',
    type: 'sword'
  },
  {
    name: '龙息长弓',
    lore: '上古龙族与人类结盟时，红龙之母娜萨莉亚拔下自己的一根龙骨，注入龙息之力，赠予人类英雄莱昂。箭矢射出时携带着毁灭性的龙炎。',
    type: 'bow'
  },
  {
    name: '命运编织者',
    lore: '一位不知名的先知在疯癫之际，用自己的双眼和命运之丝编织了这把法杖。它能窥见未来的一瞬，使用者在关键时刻总能避开致命一击。',
    type: 'staff'
  },
  {
    name: '灵魂收割者',
    lore: '死灵君主莫尔甘的镰刀，在一次与冥界之王的赌局中赢得。每收割一个灵魂，镰刀上的符文就会亮起一分。据说当所有符文亮起时，持有者将获得永生。',
    type: 'scythe'
  },
  {
    name: '雷霆之拳',
    lore: '巨人之王乌加尔的双拳铠。在与风暴之神的一战中，乌加尔徒手撕裂了天空，闪电从此被囚禁在这对拳铠之中。每一拳挥出都伴随着雷鸣。',
    type: 'gauntlet'
  },
  {
    name: '霜语者',
    lore: '北境第一位大法师阿尔文在极光之下用万年寒冰和上古龙语符文打造。法杖所到之处，火焰都会凝结成冰，甚至时间都会变得迟缓。',
    type: 'staff'
  },
  {
    name: '圣光裁决',
    lore: '第一代圣骑士团团长塞巴斯蒂安在光明大教堂接受了光明神的祝福。当黑暗降临时，这柄战锤将自动出鞘，以圣光之名审判一切邪恶。',
    type: 'hammer'
  }
];

const MYTHIC_WEAPONS = [
  {
    name: '创世之书：裂隙篇',
    lore: '据说在艾尔德兰大陆诞生之前，造物主写下了一部创世之书，记载了世界的起始与终结。裂隙篇记载的正是这本世界末日预言。持有者可以通过书页窥见裂隙的真相，甚至改写现实。',
    type: 'book'
  },
  {
    name: '混沌之眼',
    lore: '在时间与空间诞生之前，混沌之中唯一的观察者留下的眼球。它能看到一切可能性的分支，持有者理论上可以在无限平行世界中找到胜利的道路。但凡人直视它太久，灵魂会被混沌吞噬。',
    type: 'orb'
  },
  {
    name: '终末之刃',
    lore: '既非神造，也非人造。当第一个世界被裂隙吞噬时，那个世界的所有生命的绝望凝聚成了这把剑。它不属于任何纪元，因为它存在于所有纪元的终结时刻。剑刃上流淌着的是被遗忘世界的眼泪。',
    type: 'sword'
  },
  {
    name: '星辉冠冕',
    lore: '第一纪元的星灵王在陨落前，将整个银河系的核心力量封印在这顶冠冕之中。戴上它的人将获得星灵的全部智慧，但也会背负起守护整个大陆的宿命。',
    type: 'crown'
  },
  {
    name: '虚无之触',
    lore: '裂隙本身的一部分，在一次大爆炸中从裂隙中脱落，化为了手套的形态。戴上它的人可以短暂地操控裂隙的能量，但每次使用都会有被裂隙吞噬的风险。',
    type: 'gloves'
  }
];

// ==================== 史诗制式武器（王国标准装备） ====================
const EPIC_STANDARD_WEAPONS = [
  { name: '狮心军团制式长剑', lore: '艾尔王国第一军团的制式装备，由皇家铁匠铺以秘法淬火工艺铸造，剑身铭刻狮心徽章。每一位狮心军团的骑士都以佩戴此剑为荣。' },
  { name: '北境游骑兵复合弓', lore: '北方要塞游骑兵部队的标准武器，采用龙骨木与冰原狼筋复合而成，在极寒环境下依然保持最佳性能。有效射程远超普通长弓。' },
  { name: '皇家法师塔标准法杖', lore: '皇家法师学院为每一位正式法师颁发的标准法杖，杖身由魔化橡木制成，顶端镶嵌稳定水晶，是衡量法师水平的标志。' },
  { name: '圣殿骑士制式战锤', lore: '光明教会圣殿骑士团的制式武器，每一把都经过大主教的祝福，锤头刻有审判铭文，对不死生物和恶魔有额外的净化效果。' },
  { name: '影刃公会制式匕首', lore: '影刃公会成员的标准装备，刀身经过哑光处理，夜晚不会反光。刀柄内藏有微量的麻痹毒素，是刺客们的最爱。' }
];

// ==================== 一些常见武器名称前缀（用于随机生成普通装备名） ====================
const WEAPON_PREFIXES = {
  common: ['铁制', '钢制', '硬木', '锐利', '坚固', '轻盈', '平衡', '锻造'],
  rare: ['精炼', '附魔', '淬火', '秘银', '暗钢', '龙牙', '魔纹', '星光'],
  precious: ['奥术', '元素', '龙鳞', '虚空', '暗影', '圣光', '远古', '魔力']
};

const WEAPON_TYPES = ['长剑', '短剑', '匕首', '法杖', '长弓', '战锤', '巨斧', '长枪', '拳套', '镰刀'];

// ==================== ItemSystem 类 ====================
class ItemSystem {
  constructor() {
    this.qualities = EQUIPMENT_QUALITIES;
    this.slots = EQUIPMENT_SLOTS;
    this.classArmorNames = CLASS_ARMOR_NAMES;
    this.legendaryWeapons = LEGENDARY_WEAPONS;
    this.mythicWeapons = MYTHIC_WEAPONS;
    this.epicStandardWeapons = EPIC_STANDARD_WEAPONS;
  }

  /**
   * 根据品质随机生成属性值
   */
  rollStatForQuality(qualityId) {
    const quality = this.qualities[qualityId];
    if (!quality) return 0;

    // 传说和神话没有基础属性
    if (qualityId === 'legendary' || qualityId === 'mythic') return 0;

    const [min, max] = quality.statRange;
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * 随机品质（加权，越高级越稀有）
   * 概率: 破损10% 崭新45% 稀有25% 珍贵13% 史诗5% 传说1.5% 神话0.5%
   */
  rollQuality() {
    const roll = Math.random() * 100;
    if (roll < 0.5) return 'mythic';
    if (roll < 2) return 'legendary';
    if (roll < 7) return 'epic';
    if (roll < 20) return 'precious';
    if (roll < 45) return 'rare';
    if (roll < 80) return 'common';
    return 'broken';
  }

  /**
   * 获取品质对应的显示颜色
   */
  getQualityColor(qualityId) {
    return this.qualities[qualityId]?.color || '#ffffff';
  }

  /**
   * 获取品质对应的发光CSS
   */
  getQualityGlow(qualityId) {
    return this.qualities[qualityId]?.glow || 'none';
  }

  /**
   * 生成随机武器名称
   */
  generateWeaponName(qualityId) {
    // 神话武器
    if (qualityId === 'mythic') {
      const weapon = this.mythicWeapons[Math.floor(Math.random() * this.mythicWeapons.length)];
      return { name: weapon.name, lore: weapon.lore, type: weapon.type };
    }

    // 传说武器
    if (qualityId === 'legendary') {
      const weapon = this.legendaryWeapons[Math.floor(Math.random() * this.legendaryWeapons.length)];
      return { name: weapon.name, lore: weapon.lore, type: weapon.type };
    }

    // 史诗武器：50%几率是制式武器，50%是独特武器
    if (qualityId === 'epic') {
      if (Math.random() < 0.5) {
        const standard = this.epicStandardWeapons[Math.floor(Math.random() * this.epicStandardWeapons.length)];
        return { name: standard.name, lore: standard.lore, type: 'standard' };
      }
      // 独特史诗武器
      const prefix = WEAPON_PREFIXES.precious[Math.floor(Math.random() * WEAPON_PREFIXES.precious.length)];
      const type = WEAPON_TYPES[Math.floor(Math.random() * WEAPON_TYPES.length)];
      return {
        name: `${prefix}之${type}`,
        lore: `一把蕴含${prefix}力量的传奇${type}，由古代工匠精心打造。`,
        type: 'custom'
      };
    }

    // 普通武器名
    let prefixList;
    if (qualityId === 'precious') prefixList = WEAPON_PREFIXES.precious;
    else if (qualityId === 'rare') prefixList = WEAPON_PREFIXES.rare;
    else prefixList = WEAPON_PREFIXES.common;

    const prefix = prefixList[Math.floor(Math.random() * prefixList.length)];
    const type = WEAPON_TYPES[Math.floor(Math.random() * WEAPON_TYPES.length)];
    return { name: `${prefix}${type}`, lore: null, type: 'generic' };
  }

  /**
   * 生成装备物品
   * @param {string} slot - 装备槽位: weapon/armor/gloves1/gloves2/shoes
   * @param {string} qualityId - 品质ID（可选，默认随机）
   * @param {string} characterClass - 职业（用于决定护甲名称）
   * @param {number} level - 角色等级（用于属性缩放）
   */
  generateEquipment(slot, qualityId = null, characterClass = 'warrior', level = 1) {
    const quality = qualityId || this.rollQuality();
    const qualityData = this.qualities[quality];

    // 等级缩放系数
    const levelScale = 1 + (level - 1) * 0.15;

    const item = {
      id: `${quality}_${slot}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      slot: slot,
      quality: quality,
      qualityName: qualityData.name,
      color: qualityData.color,
      glow: qualityData.glow,
      equipped: false,
      level: level,
      // 基础属性
      atk: 0,
      def: 0,
      hp: 0,
      mp: 0,
      speed: 0,
      // 特殊属性（传说/神话用）
      damagePercent: 0,
      critRate: 0,
      critDamage: 0,
    };

    const isLegendaryOrMythic = quality === 'legendary' || quality === 'mythic';
    const isEpicOrAbove = quality === 'epic' || quality === 'legendary' || quality === 'mythic';

    // 生成名称
    if (slot === 'weapon') {
      const weaponInfo = this.generateWeaponName(quality);
      item.name = weaponInfo.name;
      item.lore = weaponInfo.lore;
      item.weaponType = weaponInfo.type;

      // 武器属性
      if (isLegendaryOrMythic) {
        // 传说/神话武器：不加基础属性，使用百分比加伤
        item.damagePercent = qualityData.damagePercent || 500;
        // 额外暴击/暴伤加成
        if (quality === 'mythic') {
          item.critRate = 15;
          item.critDamage = 50;
        } else {
          item.critRate = 10;
          item.critDamage = 30;
        }
      } else {
        // 普通武器：基础攻击力
        const baseAtk = this.rollStatForQuality(quality);
        item.atk = Math.floor(baseAtk * levelScale);
        // 武器也可能有少量其他属性
        item.def = Math.floor(this.rollStatForQuality(quality) * 0.1 * levelScale);
        item.speed = Math.floor(this.rollStatForQuality(quality) * 0.15 * levelScale);
      }
    } else if (slot === 'armor') {
      // 护甲名称
      const armorConfig = this.classArmorNames[characterClass] || this.classArmorNames.warrior;
      const armorName = armorConfig.names[Math.floor(Math.random() * armorConfig.names.length)];

      if (isEpicOrAbove && !isLegendaryOrMythic) {
        item.name = `[${qualityData.name}] ${armorName}`;
        item.lore = `一件散发着${qualityData.name}光辉的${armorConfig.type}，由传奇工匠锻造。`;
      } else if (isLegendaryOrMythic) {
        item.name = `${armorName}·${qualityData.name}`;
        item.lore = `传说中由古代神灵穿过的${armorConfig.type}，蕴含着不可估量的力量。`;
        item.damagePercent = qualityData.damagePercent || 500;
        if (quality === 'mythic') {
          item.critRate = 15;
          item.critDamage = 50;
        }
      } else {
        item.name = `${armorName}`;
      }

      // 护甲属性：主要加防御和生命
      if (!isLegendaryOrMythic) {
        const baseDef = this.rollStatForQuality(quality);
        item.def = Math.floor(baseDef * levelScale);
        item.hp = Math.floor(this.rollStatForQuality(quality) * levelScale * 1.5);
        item.mp = Math.floor(this.rollStatForQuality(quality) * levelScale * 0.3);
      }
    } else if (slot === 'gloves1' || slot === 'gloves2') {
      const gloveNum = slot === 'gloves1' ? '左' : '右';
      const gloveNames = {
        common: [`皮制${gloveNum}护手`, `布质${gloveNum}护手`],
        rare: [`附魔${gloveNum}护手`, `秘银${gloveNum}护手`],
        precious: [`龙皮${gloveNum}护手`, `魔纹${gloveNum}护手`],
      };

      let gloveName;
      if (isEpicOrAbove) {
        gloveName = `[${qualityData.name}] ${gloveNum}手·守护`;
        item.lore = `蕴含${qualityData.name}力量的护手，能大幅增强佩戴者的战斗能力。`;
      } else {
        const names = gloveNames[quality] || gloveNames.common;
        gloveName = names[Math.floor(Math.random() * names.length)];
      }

      item.name = gloveName;

      // 护手属性：攻击+防御混合
      if (!isLegendaryOrMythic) {
        const baseAtk = this.rollStatForQuality(quality);
        const baseDef = this.rollStatForQuality(quality);
        item.atk = Math.floor(baseAtk * 0.6 * levelScale);
        item.def = Math.floor(baseDef * 0.6 * levelScale);
        item.speed = Math.floor(this.rollStatForQuality(quality) * 0.1 * levelScale);
      } else {
        item.damagePercent = Math.floor(qualityData.damagePercent * 0.6);
      }
    } else if (slot === 'shoes') {
      const shoeNames = {
        common: ['皮靴', '布鞋', '旅行靴'],
        rare: ['附魔长靴', '秘银靴', '风行靴'],
        precious: ['龙鳞靴', '暗影步靴', '虚空行者'],
      };

      let shoeName;
      if (isEpicOrAbove) {
        shoeName = `[${qualityData.name}] 踏风者`;
        item.lore = `穿上这双靴子的人健步如飞，据说能追上疾风。`;
      } else {
        const names = shoeNames[quality] || shoeNames.common;
        shoeName = names[Math.floor(Math.random() * names.length)];
      }

      item.name = shoeName;

      // 鞋子属性：速度和防御
      if (!isLegendaryOrMythic) {
        item.speed = Math.floor(this.rollStatForQuality(quality) * 1.5 * levelScale);
        item.def = Math.floor(this.rollStatForQuality(quality) * 0.3 * levelScale);
      } else {
        item.damagePercent = Math.floor(qualityData.damagePercent * 0.4);
        item.speed = 100;
      }
    }

    return item;
  }

  /**
   * 装备物品到角色身上
   */
  equipItem(character, itemId) {
    const item = (character.inventory || []).find(i => i.id === itemId);
    if (!item) return { success: false, message: '物品不存在' };
    if (!this.slots.includes(item.slot)) return { success: false, message: '该物品不可装备' };

    // 检查该槽位是否已有装备
    const currentEquipped = (character.inventory || []).find(
      i => i.slot === item.slot && i.equipped
    );

    // 卸下当前装备
    if (currentEquipped) {
      currentEquipped.equipped = false;
    }

    // 装备新物品
    item.equipped = true;

    // 更新角色装备引用
    if (!character.equipment) character.equipment = {};
    character.equipment[item.slot] = item;

    this.recalcStats(character);

    return {
      success: true,
      message: `已装备 ${item.name}`,
      unequipped: currentEquipped ? currentEquipped.name : null
    };
  }

  /**
   * 卸下装备
   */
  unequipItem(character, itemId) {
    const item = (character.inventory || []).find(i => i.id === itemId);
    if (!item) return { success: false, message: '物品不存在' };
    if (!item.equipped) return { success: false, message: '该物品未装备' };

    item.equipped = false;
    if (character.equipment) {
      delete character.equipment[item.slot];
    }

    this.recalcStats(character);

    return { success: true, message: `已卸下 ${item.name}` };
  }

  /**
   * 计算装备总属性加成
   */
  computeEquipmentStats(character) {
    const stats = {
      atk: 0,
      def: 0,
      hp: 0,
      mp: 0,
      speed: 0,
      damagePercent: 0,
      critRate: 0,
      critDamage: 0,
      // 装备详情（用于展示）
      details: {}
    };

    const inventory = character.inventory || [];

    for (const item of inventory) {
      if (!item.equipped) continue;

      stats.atk += item.atk || 0;
      stats.def += item.def || 0;
      stats.hp += item.hp || 0;
      stats.mp += item.mp || 0;
      stats.speed += item.speed || 0;
      stats.critRate += item.critRate || 0;
      stats.critDamage += item.critDamage || 0;

      // damagePercent 取最大值（不是累加）
      if ((item.damagePercent || 0) > stats.damagePercent) {
        stats.damagePercent = item.damagePercent;
      }

      // 记录装备详情
      stats.details[item.slot] = {
        name: item.name,
        quality: item.quality,
        qualityName: item.qualityName,
        atk: item.atk || 0,
        def: item.def || 0,
        hp: item.hp || 0,
        mp: item.mp || 0,
        speed: item.speed || 0,
        damagePercent: item.damagePercent || 0,
        critRate: item.critRate || 0,
        critDamage: item.critDamage || 0,
      };
    }

    return stats;
  }

  /**
   * 重新计算角色装备后的属性（更新 character.computed）
   */
  recalcStats(character) {
    const eqStats = this.computeEquipmentStats(character);

    if (!character.computed) character.computed = {};
    character.computed.equipmentStats = eqStats;
    character.computed.atkBonus = eqStats.atk + Math.floor((character.attributes?.str || 0) * eqStats.damagePercent / 100);
    character.computed.defBonus = eqStats.def;
    character.computed.hpBonus = eqStats.hp;
    character.computed.mpBonus = eqStats.mp;
    character.computed.speedBonus = eqStats.speed;
    character.computed.critRate = eqStats.critRate;
    character.computed.critDamage = eqStats.critDamage;
    character.computed.damagePercent = eqStats.damagePercent;

    return character.computed;
  }

  /**
   * 查看背包内容（纯物品数据，不含AI叙事）
   */
  getInventorySummary(character) {
    const inventory = character.inventory || [];
    if (inventory.length === 0) {
      return {
        text: '背包是空的。',
        slots: {}
      };
    }

    const slotDisplay = {};
    for (const slot of this.slots) {
      const item = inventory.find(i => i.slot === slot && i.equipped);
      if (item) {
        slotDisplay[slot] = {
          name: item.name,
          quality: item.quality,
          qualityName: item.qualityName,
          color: item.color,
          atk: item.atk || 0,
          def: item.def || 0,
          hp: item.hp || 0,
          mp: item.mp || 0,
          speed: item.speed || 0,
          damagePercent: item.damagePercent || 0,
          lore: item.lore || null
        };
      } else {
        slotDisplay[slot] = { name: '空', quality: 'common', color: '#666666' };
      }
    }

    const itemList = inventory
      .filter(i => !i.equipped)
      .map(i => ({
        id: i.id,
        name: i.name,
        slot: i.slot,
        quality: i.quality,
        qualityName: i.qualityName,
        color: i.color,
        atk: i.atk || 0,
        def: i.def || 0,
        hp: i.hp || 0,
        mp: i.mp || 0,
        speed: i.speed || 0,
        damagePercent: i.damagePercent || 0,
        lore: i.lore || null,
        level: i.level || 1
      }));

    const lines = [];
    lines.push('━━━ 已装备 ━━━');
    for (const slot of this.slots) {
      const item = slotDisplay[slot];
      const slotNameMap = {
        weapon: '武器',
        armor: '护甲',
        gloves1: '护手1',
        gloves2: '护手2',
        shoes: '鞋子'
      };
      const slotName = slotNameMap[slot] || slot;
      if (item && item.name !== '空') {
        let statStr = '';
        if (item.damagePercent > 0) {
          statStr = ` [${item.damagePercent}% 伤害加成]`;
        } else if (item.atk > 0 || item.def > 0) {
          const parts = [];
          if (item.atk > 0) parts.push(`攻+${item.atk}`);
          if (item.def > 0) parts.push(`防+${item.def}`);
          if (item.hp > 0) parts.push(`命+${item.hp}`);
          statStr = ` [${parts.join(' ')}]`;
        }
        lines.push(`${slotName}: [${item.qualityName}] ${item.name}${statStr}`);
        if (item.lore) {
          lines.push(`  典故: ${item.lore}`);
        }
      } else {
        lines.push(`${slotName}: 空`);
      }
    }

    if (itemList.length > 0) {
      lines.push('');
      lines.push('━━━ 背包物品 ━━━');
      for (const item of itemList) {
        let statStr = '';
        if (item.damagePercent > 0) {
          statStr = ` [${item.damagePercent}% 伤害加成]`;
        } else {
          const parts = [];
          if (item.atk > 0) parts.push(`攻+${item.atk}`);
          if (item.def > 0) parts.push(`防+${item.def}`);
          if (item.hp > 0) parts.push(`命+${item.hp}`);
          if (parts.length > 0) statStr = ` [${parts.join(' ')}]`;
        }
        lines.push(`[${item.qualityName}] ${item.name} (${slotNameMap[item.slot]})${statStr}`);
        if (item.lore) {
          lines.push(`  典故: ${item.lore}`);
        }
      }
    }

    return {
      text: lines.join('\n'),
      slots: slotDisplay,
      items: itemList,
      computed: character.computed?.equipmentStats || null
    };
  }

  /**
   * 获取装备槽位的中文名
   */
  getSlotName(slot) {
    const map = {
      weapon: '武器',
      armor: '护甲',
      gloves1: '护手1',
      gloves2: '护手2',
      shoes: '鞋子'
    };
    return map[slot] || slot;
  }

  /**
   * 获取品质配置
   */
  getQualityConfig(qualityId) {
    return this.qualities[qualityId] || null;
  }
}

// 单例导出
const itemSystem = new ItemSystem();

module.exports = {
  ItemSystem,
  itemSystem,
  EQUIPMENT_QUALITIES,
  EQUIPMENT_SLOTS,
  CLASS_ARMOR_NAMES
};
