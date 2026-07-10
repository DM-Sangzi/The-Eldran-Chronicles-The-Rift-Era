// 艾尔德兰编年史 - 服务端主入口
const express = require('express');
const cors = require('cors');
const http = require('http');
const { WebSocketServer } = require('ws');
const { v4: uuidv4 } = require('uuid');
const config = require('./config');
const AIEngine = require('./ai-engine');
const DiceSystem = require('./dice-system');
const { CombatSystem, activeCombats } = require('./combat-system');
const worldSystem = require('./world-system');
const socialSystem = require('./social-system');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.use(cors());
app.use(express.json());

// ============ 数据存储（内存） ============
const players = new Map();     // playerId -> character
const sessions = new Map();    // session token -> playerId

// ============ 角色创建 ============
app.post('/api/character/create', (req, res) => {
  try {
    const { name, race, class: className, talent, talentMethod, worldState, luckyBlessing, attributePoints } = req.body;

    // 验证种族和职业
    if (!config.RACES[race]) return res.status(400).json({ error: '无效的种族' });
    if (!config.CLASSES[className]) return res.status(400).json({ error: '无效的职业' });
    if (!config.WORLD_STATES[worldState]) return res.status(400).json({ error: '无效的世界状态' });

    // 神弃者随机分配判定
    let finalTalent = talent;
    if (!finalTalent && talentMethod === 'random') {
      // 1-3% 概率获得神弃者
      if (Math.random() < 0.02) {
        finalTalent = 'forsaken';
      } else {
        // 从可用天赋池随机
        const availableTypes = getAvailableTalentTypes(className, race);
        const randomType = availableTypes[Math.floor(Math.random() * availableTypes.length)];
        const pool = config.TALENTS[randomType].filter(t => t.id !== 'forsaken');
        finalTalent = pool[Math.floor(Math.random() * pool.length)].id;
      }
    }

    // 构建角色属性
    const raceData = config.RACES[race];
    const classData = config.CLASSES[className];
    let extraPoints = attributePoints || 0;
    if (finalTalent === 'forsaken') extraPoints += 2;

    const baseHp = 50 + classData.hpBonus;
    const baseMp = className === 'mage' ? 80 : className === 'cleric' ? 60 : 20;

    const id = uuidv4();
    const character = {
      id,
      name: name || '无名冒险者',
      race,
      class: className,
      talent: finalTalent,
      talentLevel: 1,
      worldState,
      luckyBlessing: finalTalent === 'forsaken' ? false : (luckyBlessing || false),
      level: 1,
      exp: 0,
      attributes: {
        str: raceData.str,
        agi: raceData.agi,
        int: raceData.int,
        cha: raceData.cha,
      },
      extraPoints,
      maxHp: baseHp,
      currentHp: baseHp,
      maxMp: baseMp,
      currentMp: baseMp,
      computed: {},
      equipment: {},
      inventory: [
        ...(config.STARTER_ITEMS[className] || []).map(item => ({ ...item })),
        { name: '面包', type: 'consumable', heal: 10, qty: 3, desc: '一块普通的面包，可以回复少量生命值。' },
      ],
      currentLocation: getStartLocation(worldState),
      exploredRegions: [getStartLocation(worldState)],
      sessionCount: 0,
      totalKills: 0,
      totalDeaths: 0,
      gold: 50,
      hiddenAchievements: [],
      forsakenKills: 0,
      createdAt: Date.now(),
    };

    players.set(id, character);

    // 加入世界
    let world;
    if (req.body.createPrivateWorld) {
      const worldName = req.body.worldTags || `${character.name}的世界`;
      world = worldSystem.createPrivateWorld(id, worldState, worldName, req.body.worldTags ? [req.body.worldTags] : []);
    } else if (req.body.worldId) {
      world = worldSystem.joinWorld(id, req.body.worldId);
    } else {
      world = worldSystem.autoMatchWorld(worldState);
      worldSystem.joinWorld(id, world.id);
    }

    character.worldId = world.id;

    // 注册社交资料
    socialSystem.registerPlayer(character);

    // 创建会话令牌
    const token = uuidv4();
    sessions.set(token, id);

    // 判断是否为神弃者并生成开场
    const isForsaken = finalTalent === 'forsaken';
    let openingNarrative = '';

    if (isForsaken && talentMethod === 'random') {
      openingNarrative = `💀 *天没有出现异象。没有神迹，没有祝福。接生婆摇了摇头。*\n\n*你的母亲问：「我的孩子怎么了？」*\n\n*接生婆低声说：「他……没有被记住。」*\n\n---\n\n⚡ **你被随机分配了「神弃者」天赋。**\n\n神明从未垂青于你。不会有人为你祈祷，不会有圣光为你照耀。你的存在本身，就是对神明的亵渎。可你依然活着——这就够了。\n\n神术对你无效，但你也无法使用任何神术。神殿不会欢迎你，神职人员会敌视你。\n\n但作为补偿，你获得了额外 **+2 属性点**。\n\n你可以在角色状态中分配这些额外的属性点。`;
    } else if (isForsaken) {
      openingNarrative = `💀 你选择了「神弃者」天赋。这是一条不被众神祝福的道路。\n\n你获得了额外 **+2 属性点**。`;
    }

    res.json({
      success: true,
      character: getPublicCharacter(character),
      token,
      world: worldSystem.getWorldInfo(character.worldId),
      openingNarrative,
      isForsaken,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ 游戏交互 ============
app.post('/api/game/action', async (req, res) => {
  try {
    const { token, action } = req.body;
    const playerId = sessions.get(token);
    if (!playerId) return res.status(401).json({ error: '未登录' });

    const character = players.get(playerId);
    if (!character) return res.status(404).json({ error: '角色不存在' });

    let response;

    // 检查是否在战斗中
    const combat = activeCombats.get(playerId);
    if (combat && combat.status === 'active') {
      response = handleCombatAction(character, combat, action);
    } else {
      // AI叙事引擎处理
      response = await AIEngine.generateResponse(character, action);
    }

    res.json({ success: true, ...response, character: getPublicCharacter(character) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ 骰子判定 ============
app.post('/api/game/roll', (req, res) => {
  try {
    const { token, skillType, modifier, difficulty } = req.body;
    const playerId = sessions.get(token);
    if (!playerId) return res.status(401).json({ error: '未登录' });

    const character = players.get(playerId);
    if (!character) return res.status(404).json({ error: '角色不存在' });

    let result;
    if (skillType) {
      result = DiceSystem.skillCheck(character, skillType, difficulty || 10);
    } else {
      result = DiceSystem.d20Check(character, modifier || 0, difficulty || 10);
    }

    res.json({ success: true, roll: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ 移动 ============
app.post('/api/game/move', (req, res) => {
  try {
    const { token, regionId } = req.body;
    const playerId = sessions.get(token);
    if (!playerId) return res.status(401).json({ error: '未登录' });

    const character = players.get(playerId);
    if (!character) return res.status(404).json({ error: '角色不存在' });

    const currentRegion = config.MAP_REGIONS.find(r => r.id === character.currentLocation);
    if (!currentRegion || !currentRegion.neighbors.includes(regionId)) {
      return res.status(400).json({ error: '无法移动到该区域' });
    }

    const targetRegion = config.MAP_REGIONS.find(r => r.id === regionId);
    if (!targetRegion) return res.status(404).json({ error: '区域不存在' });

    character.currentLocation = regionId;
    if (!character.exploredRegions.includes(regionId)) {
      character.exploredRegions.push(regionId);
    }

    const narrative = AIEngine.getRegionEntryDesc(targetRegion.name, character);

    // 神弃者进入神殿特殊处理
    if (regionId === 'temple' && character.talent === 'forsaken') {
      character.currentHp = Math.max(1, character.currentHp - 5);
    }

    // 随机遭遇判定
    const positiveEvent = DiceSystem.eventRoll(character, 50);
    let eventResult = null;
    if (Math.random() < 0.4) {
      eventResult = generateRandomEvent(character, regionId, positiveEvent);
      narrative += '\n\n' + eventResult;
    }

    res.json({
      success: true,
      narrative: `🗺️ 你移动到了 **${targetRegion.name}**。\n\n${narrative}`,
      location: targetRegion,
      event: eventResult,
      character: getPublicCharacter(character),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ 获取场景 ============
app.get('/api/game/scene', (req, res) => {
  try {
    const token = req.query.token;
    const playerId = sessions.get(token);
    if (!playerId) return res.status(401).json({ error: '未登录' });

    const character = players.get(playerId);
    if (!character) return res.status(404).json({ error: '角色不存在' });

    const narrative = AIEngine.generateSceneDescription(character);
    const region = config.MAP_REGIONS.find(r => r.id === character.currentLocation);

    res.json({
      success: true,
      narrative,
      location: region,
      character: getPublicCharacter(character),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ 战斗 ============
app.post('/api/game/combat/start', (req, res) => {
  try {
    const { token, enemyId } = req.body;
    const playerId = sessions.get(token);
    if (!playerId) return res.status(401).json({ error: '未登录' });

    const character = players.get(playerId);
    if (!character) return res.status(404).json({ error: '角色不存在' });

    const enemy = enemyId || getRandomEnemy(character);
    const combatData = AIEngine.generateCombatStart(character, enemy);
    const combat = CombatSystem.createCombat(character, enemy);

    activeCombats.set(playerId, combat);

    res.json({
      success: true,
      combat: CombatSystem.getCombatSummary(combat),
      narrative: combatData.narrative,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/game/combat/action', (req, res) => {
  try {
    const { token, action, payload } = req.body;
    const playerId = sessions.get(token);
    if (!playerId) return res.status(401).json({ error: '未登录' });

    const combat = activeCombats.get(playerId);
    if (!combat) return res.status(400).json({ error: '没有活跃的战斗' });

    const result = CombatSystem.executeTurn(combat, action, payload);

    // 战斗结束后清理并发放奖励
    if (combat.status === 'victory' && combat.rewards) {
      const character = players.get(playerId);
      character.exp += combat.rewards.exp;
      character.gold += combat.rewards.gold;
      character.totalKills++;
      checkLevelUp(character);
      activeCombats.delete(playerId);
    }

    if (combat.status === 'defeat') {
      const character = players.get(playerId);
      character.totalDeaths++;
      // 死亡惩罚
      const expLoss = character.luckyBlessing ? Math.floor(character.exp * 0.1) : Math.floor(character.exp * 0.2);
      character.exp = Math.max(0, character.exp - expLoss);
      character.currentHp = Math.floor(character.maxHp / 2);
      activeCombats.delete(playerId);
    }

    res.json({
      success: true,
      ...result,
      combat: CombatSystem.getCombatSummary(combat),
      character: getPublicCharacter(players.get(playerId)),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ 角色信息 ============
app.get('/api/character', (req, res) => {
  try {
    const token = req.query.token;
    const playerId = sessions.get(token);
    if (!playerId) return res.status(401).json({ error: '未登录' });

    const character = players.get(playerId);
    if (!character) return res.status(404).json({ error: '角色不存在' });

    res.json({ success: true, character: getPublicCharacter(character) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 分配属性点
app.post('/api/character/allocate', (req, res) => {
  try {
    const { token, str, agi, int, cha } = req.body;
    const playerId = sessions.get(token);
    if (!playerId) return res.status(401).json({ error: '未登录' });

    const character = players.get(playerId);
    const total = (str || 0) + (agi || 0) + (int || 0) + (cha || 0);
    if (total > character.extraPoints) {
      return res.status(400).json({ error: `只能分配 ${character.extraPoints} 点属性` });
    }

    if (str) character.attributes.str += str;
    if (agi) character.attributes.agi += agi;
    if (int) character.attributes.int += int;
    if (cha) character.attributes.cha += cha;
    character.extraPoints -= total;

    res.json({ success: true, character: getPublicCharacter(character) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ 世界系统 ============
app.get('/api/worlds', (req, res) => {
  const worldState = req.query.state;
  const worlds = worldSystem.getPublicWorlds(worldState);
  res.json({ success: true, worlds });
});

app.get('/api/worlds/hot', (req, res) => {
  const hot = worldSystem.getHotWorld();
  res.json({ success: true, world: hot ? worldSystem.getWorldInfo(hot.id) : null });
});

app.get('/api/worlds/:id', (req, res) => {
  const info = worldSystem.getWorldInfo(req.params.id);
  if (!info) return res.status(404).json({ error: '世界不存在' });
  res.json({ success: true, world: info });
});

app.post('/api/worlds/private', (req, res) => {
  try {
    const { token, worldState, name, tags } = req.body;
    const playerId = sessions.get(token);
    if (!playerId) return res.status(401).json({ error: '未登录' });

    const world = worldSystem.createPrivateWorld(playerId, worldState, name, tags || []);
    res.json({ success: true, world: worldSystem.getWorldInfo(world.id) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ 社交系统 ============
app.get('/api/social/search', (req, res) => {
  const query = req.query.q;
  if (!query) return res.status(400).json({ error: '请输入搜索关键词' });
  const results = socialSystem.searchPlayer(query);
  res.json({ success: true, players: results });
});

app.post('/api/social/friend/request', (req, res) => {
  try {
    const { token, targetId } = req.body;
    const playerId = sessions.get(token);
    if (!playerId) return res.status(401).json({ error: '未登录' });

    const result = socialSystem.sendFriendRequest(playerId, targetId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/social/friend/accept', (req, res) => {
  try {
    const { token, fromId } = req.body;
    const playerId = sessions.get(token);
    if (!playerId) return res.status(401).json({ error: '未登录' });

    const result = socialSystem.acceptFriendRequest(playerId, fromId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/social/friend/reject', (req, res) => {
  try {
    const { token, fromId } = req.body;
    const playerId = sessions.get(token);
    if (!playerId) return res.status(401).json({ error: '未登录' });

    const result = socialSystem.rejectFriendRequest(playerId, fromId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/social/friends', (req, res) => {
  const token = req.query.token;
  const playerId = sessions.get(token);
  if (!playerId) return res.status(401).json({ error: '未登录' });

  const friends = socialSystem.getFriendList(playerId);
  const requests = socialSystem.getPendingRequests(playerId);
  res.json({ success: true, friends, pendingRequests: requests });
});

// 世界聊天
app.post('/api/social/chat', (req, res) => {
  try {
    const { token, content } = req.body;
    const playerId = sessions.get(token);
    if (!playerId) return res.status(401).json({ error: '未登录' });

    const character = players.get(playerId);
    const msg = socialSystem.sendWorldMessage(character.worldId, playerId, content);

    // WebSocket广播
    broadcastToWorld(character.worldId, { type: 'chat', message: msg });

    res.json({ success: true, message: msg });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/social/chat/:worldId', (req, res) => {
  const msgs = socialSystem.getWorldMessages(req.params.worldId);
  res.json({ success: true, messages: msgs });
});

// 故事墙
app.post('/api/social/story', (req, res) => {
  try {
    const { token, title, content } = req.body;
    const playerId = sessions.get(token);
    if (!playerId) return res.status(401).json({ error: '未登录' });

    const story = socialSystem.publishStory(playerId, title, content);
    res.json({ success: true, story });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/social/stories', (req, res) => {
  const stories = socialSystem.getStoryWall();
  res.json({ success: true, stories });
});

// 招募板
app.post('/api/social/recruit', (req, res) => {
  try {
    const { token, title, description, roles } = req.body;
    const playerId = sessions.get(token);
    if (!playerId) return res.status(401).json({ error: '未登录' });

    const recruit = socialSystem.publishRecruit(playerId, title, description, roles);
    res.json({ success: true, recruit });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/social/recruits', (req, res) => {
  const recruits = socialSystem.getRecruitBoard();
  res.json({ success: true, recruits });
});

// ============ 游戏配置 ============
app.get('/api/config', (req, res) => {
  res.json({
    races: config.RACES,
    classes: config.CLASSES,
    talentCategories: Object.keys(config.TALENTS).reduce((acc, key) => {
      acc[key] = config.TALENTS[key].map(t => ({
        id: t.id,
        name: t.name,
        desc: t.desc,
        type: t.type,
      }));
      return acc;
    }, {}),
    worldStates: config.WORLD_STATES,
    mapRegions: config.MAP_REGIONS.map(r => ({ id: r.id, name: r.name, neighbors: r.neighbors })),
  });
});

// ============ WebSocket ============
wss.on('connection', (ws) => {
  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'auth') {
        ws.playerId = sessions.get(msg.token);
        if (ws.playerId) {
          const character = players.get(ws.playerId);
          ws.worldId = character?.worldId;
          socialSystem.setOnlineStatus(ws.playerId, true);
        }
      }
    } catch (e) { /* ignore */ }
  });

  ws.on('close', () => {
    if (ws.playerId) {
      socialSystem.setOnlineStatus(ws.playerId, false);
    }
  });
});

function broadcastToWorld(worldId, data) {
  wss.clients.forEach(client => {
    if (client.worldId === worldId && client.readyState === 1) {
      client.send(JSON.stringify(data));
    }
  });
}

// ============ 辅助函数 ============
function getPublicCharacter(char) {
  return {
    id: char.id, name: char.name, race: char.race, class: char.class,
    talent: char.talent, talentLevel: char.talentLevel,
    worldState: char.worldState, luckyBlessing: char.luckyBlessing,
    level: char.level, exp: char.exp,
    attributes: char.attributes, extraPoints: char.extraPoints,
    maxHp: char.maxHp, currentHp: char.currentHp,
    maxMp: char.maxMp, currentMp: char.currentMp,
    equipment: char.equipment, inventory: char.inventory,
    currentLocation: char.currentLocation, exploredRegions: char.exploredRegions,
    sessionCount: char.sessionCount, totalKills: char.totalKills,
    totalDeaths: char.totalDeaths, gold: char.gold,
    worldId: char.worldId, computed: char.computed,
  };
}

function getAvailableTalentTypes(className, race) {
  const mapping = {
    warrior: ['combat', 'explore', 'special'],
    mage: ['magic', 'explore', 'special'],
    rogue: ['stealth', 'social', 'special'],
    cleric: ['holy', 'social', 'special'],
  };
  return mapping[className] || ['combat', 'magic', 'stealth', 'explore', 'social', 'special'];
}

function getStartLocation(worldState) {
  return worldState === 'rift_age' ? 'forest_edge' : 'town_gate';
}

function getRandomEnemy(character) {
  const region = config.MAP_REGIONS.find(r => r.id === character.currentLocation);
  const enemyPool = {
    town_gate: ['bandit', 'goblin'],
    market_square: ['goblin'],
    tavern: ['bandit'],
    temple: ['skeleton'],
    forest_edge: ['wolf', 'goblin'],
    deep_forest: ['wolf', 'dark_mage', 'troll'],
    dark_alley: ['bandit', 'skeleton'],
    graveyard: ['skeleton', 'dark_mage'],
    underground: ['skeleton', 'goblin', 'dark_mage'],
    river_crossing: ['troll', 'wolf'],
    bandit_camp: ['bandit', 'troll'],
    elf_ruins: ['dark_mage', 'skeleton'],
    rift_zone: ['rift_beast', 'dark_mage'],
    sewer: ['goblin', 'troll'],
  };

  const pool = enemyPool[character.currentLocation] || ['goblin', 'wolf'];
  const adjustedPool = character.worldState === 'rift_age' ? [...pool, 'rift_beast'] : pool;
  return adjustedPool[Math.floor(Math.random() * adjustedPool.length)];
}

function generateRandomEvent(character, regionId, positive) {
  const positiveEvents = [
    '🍀 你在路边发现了一株稀有的草药！',
    '💰 一个商人从你身边经过，掉了一枚金币。',
    '✨ 你感到一股温暖的魔力流过全身。生命值回复5点。',
    '📜 你在地上发现了一张旧地图的碎片。',
  ];
  const negativeEvents = [
    '⚠️ 你不小心踩到了泥坑，鞋子全湿了。',
    '🐀 一只老鼠从你脚边窜过，吓了你一跳。',
    '☁️ 天色突然暗了下来，远处传来雷声。',
    '🗡️ 你注意到地上有打斗的痕迹，这里不久前发生过冲突。',
  ];

  const events = positive ? positiveEvents : negativeEvents;
  return events[Math.floor(Math.random() * events.length)];
}

function checkLevelUp(character) {
  const expNeeded = character.level * 100;
  while (character.exp >= expNeeded) {
    character.exp -= expNeeded;
    character.level++;
    character.extraPoints += 2;
    character.maxHp += 10;
    character.currentHp = character.maxHp;
    character.maxMp += 5;
    character.currentMp = character.maxMp;
  }
}

async function handleCombatAction(character, combat, action) {
  // 解析战斗指令
  const combatActions = ['攻击', 'attack', '防御', 'defend', '逃跑', 'escape', 'flee'];
  // 技能名称
  const skills = config.CLASSES[character.class]?.skills || [];

  let combatAction;
  if (combatActions.some(a => action.includes(a))) {
    if (action.includes('防御') || action.includes('defend')) combatAction = 'defend';
    else if (action.includes('逃跑') || action.includes('escape') || action.includes('flee')) combatAction = 'escape';
    else combatAction = 'attack';
  } else {
    // 检查是否使用技能
    const matchedSkill = skills.find(s => action.includes(s));
    if (matchedSkill) {
      const result = CombatSystem.executeTurn(combat, 'skill', matchedSkill);
      return {
        narrative: `⚔️ 战斗中使用技能「${matchedSkill}」\n\n` + result.log.slice(-5).join('\n'),
        type: 'combat',
        combat: CombatSystem.getCombatSummary(combat),
      };
    }
    combatAction = 'attack';
  }

  const result = CombatSystem.executeTurn(combat, combatAction);
  return {
    narrative: '⚔️ ' + result.log.slice(-5).join('\n'),
    type: 'combat',
    combat: CombatSystem.getCombatSummary(combat),
  };
}

// ============ 启动服务 ============
server.listen(config.PORT, () => {
  console.log(`🗡️  艾尔德兰编年史：裂隙纪元 - 服务端已启动`);
  console.log(`🌍 端口：${config.PORT}`);
  console.log(`📋 API 文档：http://localhost:${config.PORT}/api/config`);
  console.log(`👥 多世界系统已就绪`);
});
