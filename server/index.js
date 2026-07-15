// 艾尔德兰编年史 - 服务端主入口
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const fs = require('fs');
const { WebSocketServer } = require('ws');
const crypto = require('crypto');
const uuidv4 = () => crypto.randomUUID();
const config = require('./config');
const AIEngine = require('./ai-engine');
const DiceSystem = require('./dice-system');
const { CombatSystem, activeCombats } = require('./combat-system');
const worldSystem = require('./world-system');
const socialSystem = require('./social-system');
const { itemSystem } = require('./item-system');
const timeSystem = require('./time-system');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.use(cors());
app.use(express.json());

// ============ 辅助函数 ============

/** BFS 寻路：返回从 fromId 到 toId 的最短路径数组（含起点） */
function findPath(fromId, toId) {
  if (fromId === toId) return [fromId];
  const adj = {};
  config.MAP_REGIONS.forEach(r => { adj[r.id] = r.neighbors || []; });
  if (!adj[fromId] || !adj[toId]) return null;

  const queue = [[fromId]];
  const visited = new Set([fromId]);
  while (queue.length > 0) {
    const path = queue.shift();
    const last = path[path.length - 1];
    for (const nb of (adj[last] || [])) {
      if (nb === toId) return [...path, nb];
      if (!visited.has(nb)) {
        visited.add(nb);
        queue.push([...path, nb]);
      }
    }
  }
  return null;
}

/** 将 regionId 数组转换为可读的中文路径描述 */
function formatPath(regionIds) {
  return regionIds.map(id => {
    const r = config.MAP_REGIONS.find(rr => rr.id === id);
    return r ? r.name : id;
  }).join(' → ');
}

// ============ 数据持久化 ============
const DATA_DIR = path.join(__dirname, 'data');
const PLAYERS_FILE = path.join(DATA_DIR, 'players.json');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');

let saveTimeout = null;
function scheduleSave() {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(saveData, 2000); // 2 秒防抖
}

function saveData() {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    // 将 Map 序列化为对象数组
    fs.writeFileSync(PLAYERS_FILE, JSON.stringify([...players.entries()], null, 2));
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify([...sessions.entries()], null, 2));
    console.log('💾 数据已保存到磁盘');
  } catch (err) {
    console.error('数据保存失败:', err.message);
  }
}

function loadData() {
  try {
    if (fs.existsSync(PLAYERS_FILE)) {
      const data = JSON.parse(fs.readFileSync(PLAYERS_FILE, 'utf-8'));
      data.forEach(([id, char]) => players.set(id, char));
      console.log(`📂 恢复了 ${players.size} 个玩家角色`);
    }
    if (fs.existsSync(SESSIONS_FILE)) {
      const data = JSON.parse(fs.readFileSync(SESSIONS_FILE, 'utf-8'));
      data.forEach(([token, playerId]) => sessions.set(token, playerId));
      console.log(`🔑 恢复了 ${sessions.size} 个会话令牌`);
    }
  } catch (err) {
    console.error('数据加载失败:', err.message);
  }
}

// 生产环境：托管前端静态文件
const clientDist = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDist));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(clientDist, 'index.html'), (err) => {
    if (err) next();
  });
});

// ============ 数据存储（内存） ============
const players = new Map();     // playerId -> character
const sessions = new Map();    // session token -> playerId

// 从磁盘恢复数据
loadData();

// ============ 角色创建 ============
app.post('/api/character/create', (req, res) => {
  try {
    const { name, race, class: className, talents: talentsInput, talentMethod, worldState, luckyBlessing, attributePoints } = req.body;

    // 验证种族和职业
    if (!config.RACES[race]) return res.status(400).json({ error: '无效的种族' });
    if (!config.CLASSES[className]) return res.status(400).json({ error: '无效的职业' });
    if (!config.WORLD_STATES[worldState]) return res.status(400).json({ error: '无效的世界状态' });

    // 种族限制校验
    const classRestrictions = config.CLASSES[className]?.raceRestrictions;
    if (classRestrictions && !classRestrictions.includes(race)) {
      return res.status(400).json({ error: `${config.CLASSES[className].name} 职业暂不支持 ${config.RACES[race].name} 种族` });
    }

    // 双天赋处理（手动选择或随机分配）
    let finalTalents = [];
    if (talentsInput && Array.isArray(talentsInput) && talentsInput.length > 0) {
      finalTalents = talentsInput.filter(t => t).slice(0, 2);
    }
    if (finalTalents.length < 2 && talentMethod === 'random') {
      const availableTypes = getAvailableTalentTypes(className, race);
      for (let i = finalTalents.length; i < 2; i++) {
        if (i === 0 && Math.random() < 0.02 && !finalTalents.includes('forsaken')) {
          finalTalents.push('forsaken');
          continue;
        }
        const randomType = availableTypes[Math.floor(Math.random() * availableTypes.length)];
        const pool = config.TALENTS[randomType].filter(t => t.id !== 'forsaken' && !finalTalents.includes(t.id));
        if (pool.length > 0) finalTalents.push(pool[Math.floor(Math.random() * pool.length)].id);
      }
    }
    if (finalTalents.length === 0) {
      const availableTypes = getAvailableTalentTypes(className, race);
      const randomType = availableTypes[Math.floor(Math.random() * availableTypes.length)];
      const pool = config.TALENTS[randomType].filter(t => t.id !== 'forsaken');
      finalTalents = [pool[Math.floor(Math.random() * pool.length)].id];
    }

    const isForsaken = finalTalents.includes('forsaken');
    const racialTrait = config.RACIAL_TRAITS[race];

    // 构建角色属性
    const raceData = config.RACES[race];
    const classData = config.CLASSES[className];
    let extraPoints = attributePoints || 0;
    if (isForsaken) extraPoints += 2;

    const baseHp = 50 + classData.hpBonus + (race === 'undead' ? -10 : 0);
    const baseMp = className === 'mage' ? 80 : className === 'cleric' ? 60 : (race === 'undead' && className === 'rogue' ? 40 : 20);

    // 出生地与声望
    const birthInfo = getBirthLocation(race, className);
    // 阵营
    const faction = config.RACES[race]?.faction || 'neutral_order';
    // 阵营声望
    const factionRep = computeFactionReputation(faction, className);
    const reputation = factionRep[faction] || 0;

    const id = uuidv4();
    const character = {
      id,
      name: name || '无名冒险者',
      race,
      class: className,
      talents: finalTalents,
      talentLevel: 1,
      racialTrait,
      worldState,
      luckyBlessing: isForsaken ? false : (luckyBlessing || false),
      skills: [],         // 主动技能（已学习/解锁）
      killQuests: {},     // 猎杀任务进度 { questId: killedCount }
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
      weaponProficiency: config.WEAPON_PROFICIENCY[className] || null,
      innateSkills: getInnateSkills(className),
      equipment: {},
      inventory: buildStarterInventory(race, className),
      currentLocation: getStartLocation(worldState, race, className),
      exploredRegions: [getStartLocation(worldState, race, className)],
      sessionCount: 0,
      totalKills: 0,
      totalDeaths: 0,
      gold: 5,
      hiddenAchievements: [],
      forsakenKills: 0,
      birthLocation: birthInfo,
      reputation,
      faction,
      factionRep,
      tutorialSeen: false,
      createdAt: Date.now(),
    };

    players.set(id, character);

    // 初始化装备引用和计算属性
    itemSystem.recalcStats(character);
    // 同步equipment引用
    for (const item of character.inventory || []) {
      if (item.equipped && item.slot) {
        character.equipment[item.slot] = item;
      }
    }

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
    scheduleSave();

    // 生成神弃者开场
    let openingNarrative = '';

    if (isForsaken && talentMethod === 'random') {
      openingNarrative = `💀 *天没有出现异象。没有神迹，没有祝福。接生婆摇了摇头。*\n\n*你的母亲问：「我的孩子怎么了？」*\n\n*接生婆低声说：「他……没有被记住。」*\n\n---\n\n⚡ **你被随机分配了「神弃者」天赋。**\n\n神明从未垂青于你。不会有人为你祈祷，不会有圣光为你照耀。你的存在本身，就是对神明的亵渎。可你依然活着——这就够了。\n\n神术对你无效，但你也无法使用任何神术。神殿不会欢迎你，神职人员会敌视你。\n\n但作为补偿，你获得了额外 **+2 属性点**。\n\n你可以在角色状态中分配这些额外的属性点。`;
    } else if (isForsaken) {
      openingNarrative = `💀 你选择了「神弃者」天赋。这是一条不被众神祝福的道路。\n\n你获得了额外 **+2 属性点**。`;
    }

    // 生成沉浸式新手教程叙事
    const tutorial = generateTutorialNarrative(race, className, worldState);

    // 生成随机 NPC 任务
    const quest = generateQuest(character);
    character.activeQuest = quest;
    const questIntro = generateQuestIntro(character, quest);

    res.json({
      success: true,
      character: getPublicCharacter(character),
      token,
      world: worldSystem.getWorldInfo(character.worldId),
      openingNarrative,
      isForsaken,
      tutorial,
      questIntro,
      timeInfo: timeSystem.formatTime(character.worldId || 'default'),
      quest: {
        id: quest.id,
        title: quest.title,
        desc: quest.desc,
        objective: quest.objective,
        rewardGold: quest.rewardGold,
        rewardExp: quest.rewardExp,
        rewardItem: quest.rewardItem,
        difficulty: quest.difficulty,
        type: quest.type,
        targetEnemy: quest.targetEnemy,
        killCount: quest.killCount,
        npcName: quest.npcName,
        npcRace: quest.npcRace,
        completeHint: quest.completeHint,
        stages: quest.stages || null,
        currentStage: quest.currentStage || null,
      },
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

    // 多阶段任务：自动检测文字移动意图，帮玩家移动到目标地点
    if (character.activeQuest && character.activeQuest.type === 'multi_stage' && character.activeQuest.status === 'active') {
      const quest = character.activeQuest;
      const currentStage = quest.stages[(quest.currentStage || 1) - 1];
      if (currentStage && currentStage.needAction === 'move' && currentStage.needLocation) {
        const currentRegion = config.MAP_REGIONS.find(r => r.id === character.currentLocation);
        const targetRegion = config.MAP_REGIONS.find(r => r.id === currentStage.needLocation);
        const targetName = targetRegion?.name || currentStage.needLocation;
        const lowerAction = action.toLowerCase();
        
        // 检测移动意图关键词 + 匹配目标地点
        const moveKeywords = ['前往', '去', '走到', '赶到', '移动', '出发去', '奔向', '赶往', '向.*出发', 
          'go to', 'move to', 'travel to', 'head to', 'walk to'];
        const isMoveIntent = moveKeywords.some(k => {
          try { return new RegExp(k).test(lowerAction); } catch { return lowerAction.includes(k); }
        });
        const mentionsTarget = lowerAction.includes(targetName) || 
          lowerAction.includes(currentStage.needLocation.toLowerCase());
        
        if (isMoveIntent && mentionsTarget) {
          if (currentRegion && currentRegion.neighbors.includes(currentStage.needLocation)) {
            // 自动执行移动！
            character.currentLocation = currentStage.needLocation;
            if (!character.exploredRegions.includes(currentStage.needLocation)) {
              character.exploredRegions.push(currentStage.needLocation);
            }
            const worldId = character.worldId || 'default';
            timeSystem.advanceTime(worldId, 120); // 移动推进2小时
            const timeInfo = timeSystem.formatTime(worldId);
            const sceneDesc = AIEngine.generateSceneDescription(character);
            
            // 检测阶段推进
            const stageResult = checkMultiStageProgress(character);
            let stageNarrative = '';
            if (stageResult) stageNarrative = '\n\n' + stageResult;
            
            scheduleSave();
            return res.json({
              success: true,
              narrative: `🗺️ 你动身前往 **${targetName}**。\n\n${sceneDesc}${stageNarrative}`,
              location: targetRegion,
              timeInfo,
              character: getPublicCharacter(character),
            });
          } else {
            // 目标地点不相邻，计算完整路径
            const path = findPath(character.currentLocation, currentStage.needLocation);
            const pathStr = path ? formatPath(path) : null;
            response = {
              narrative: `⚠️ **${targetName}** 不在当前位置的相邻区域。\n\n` +
                (pathStr
                  ? `🗺️ **推荐路线：** ${pathStr}\n\n📌 下一步请先前往 **${formatPath([path[1]])}**，或点击左侧🗺️地图按钮，点击相邻区域逐步移动。\n\n当前相邻区域：${(currentRegion?.neighbors || []).map(id => {
                      const r = config.MAP_REGIONS.find(rr => rr.id === id);
                      return r ? r.name : id;
                    }).join('、')}`
                  : `💡 请点击左侧🗺️**地图按钮**，点击相邻区域逐步移动。\n\n当前相邻区域：${(currentRegion?.neighbors || []).map(id => {
                      const r = config.MAP_REGIONS.find(rr => rr.id === id);
                      return r ? r.name : id;
                    }).join('、')}`),
              type: 'hint',
            };
            return res.json({ success: true, ...response, character: getPublicCharacter(character) });
          }
        }
        
        // 如果当前阶段需要移动但玩家没在移动，给出友好引导
        if (currentStage.needAction === 'move' && character.currentLocation !== currentStage.needLocation && !isMoveIntent) {
          const path = findPath(character.currentLocation, currentStage.needLocation);
          const pathStr = path ? formatPath(path) : null;
          const hintMsg = pathStr
            ? `\n\n💡 **任务提示：** 当前阶段需要前往 **${targetName}**。\n\n🗺️ 推荐路线：${pathStr}\n📌 下一步：前往 **${formatPath([path[1]])}**（点击左侧🗺️地图或输入"前往${formatPath([path[1]])}"）`
            : `\n\n💡 **任务提示：** 当前阶段需要前往 **${targetName}**。点击左侧🗺️地图按钮，选择相邻区域即可移动。`;
          // 注入到AI响应之后，不在这里处理
          // 我们把这个 hint 追加到 response.narrative 之后
        }
      }
    }

    // /quest 命令
    if (action.trim().toLowerCase() === '/quest' || action.trim().toLowerCase() === '查看任务') {
      if (character.activeQuest && character.activeQuest.status === 'active') {
        const q = character.activeQuest;
        const difficultyLabel = q.difficulty <= 2 ? '🟢 简单' : q.difficulty <= 4 ? '🟡 中等' : '🔴 困难';
        const rewardText = `💰 ${q.rewardGold}金币 + ⭐ ${q.rewardExp}经验` + (q.rewardItem ? ` + 🎁 ${q.rewardItem}` : '');
        
        // 多阶段任务
        if (q.type === 'multi_stage' && q.stages) {
          const currentStage = q.currentStage || 1;
          let stagesText = '';
          for (const stage of q.stages) {
            const stageNum = stage.stage;
            if (stageNum < currentStage) {
              stagesText += `\n阶段 ${stageNum}/${q.stages.length}：✅ ~~${stage.goal}~~`;
            } else if (stageNum === currentStage) {
              stagesText += `\n阶段 ${stageNum}/${q.stages.length}：⏳ **${stage.goal}** ← 当前`;
            } else {
              stagesText += `\n阶段 ${stageNum}/${q.stages.length}：🔒 ${stage.goal}`;
            }
          }
          response = {
            narrative: `📋 **当前任务：「${q.title}」** ${difficultyLabel}\n\n👤 委托人：**${q.npcName}**（${q.raceName}）\n💡 当前提示：${q.stages[currentStage - 1]?.hint || '继续推进任务'}\n💰 奖励：${rewardText}\n📖 详情：${q.desc}\n${stagesText}\n\n---\n输入 /wait 可以等待时间流逝。继续行动来推进任务进度！`,
            type: 'quest',
          };
        } else {
          // 猎杀任务进度
          let killProgress = '';
          if (q.type === 'combat' && q.killCount > 1) {
            const killed = (character.killQuests && character.killQuests[q.id]) || 0;
            const enemyName = config.ENEMIES[q.targetEnemy]?.name || q.targetEnemy;
            killProgress = `\n📊 进度：${killed}/${q.killCount} 只${enemyName}`;
          }
          response = {
            narrative: `📋 **当前任务：「${q.title}」** ${difficultyLabel}\n\n👤 委托人：**${q.npcName}**（${q.raceName}）\n🎯 目标：${q.objective}${killProgress}\n💰 奖励：${rewardText}\n📖 详情：${q.desc}\n💡 提示：${q.completeHint}\n\n---\n继续行动来推进任务进度吧！`,
            type: 'quest',
          };
        }
      } else {
        response = { narrative: '📋 你当前没有活跃的任务。四处探索，也许会遇到需要帮助的人。', type: 'quest' };
      }
      return res.json({ success: true, ...response, character: getPublicCharacter(character) });
    }

    // /skills 命令
    if (action.trim().toLowerCase() === '/skills' || action.trim().toLowerCase() === '查看技能') {
      const classSkills = config.CLASS_SKILL_TREES[character.class];
      if (!classSkills) {
        response = { narrative: '你的职业没有技能树。', type: 'skills' };
      } else {
        let skillText = '📚 **你的技能树**\n\n';
        const learned = character.skills || [];
        for (const skill of classSkills) {
          const known = learned.find(s => s.id === skill.id);
          const stat = known && known.skillLevel > 0 ? `✅ Lv.${known.skillLevel}` : (known ? '🔓 已解锁未学习' : (character.level >= skill.levelReq ? '🔓 可解锁' : `🔒 需Lv.${skill.levelReq}`));
          skillText += `${stat} | **${skill.name}** [${skill.type}] - ${skill.desc} (卷轴：${skill.scrollName})\n`;
        }
        skillText += '\n输入 /learn 技能ID 来购买技能卷轴并学习技能。';
        response = { narrative: skillText, type: 'skills' };
      }
      return res.json({ success: true, ...response, character: getPublicCharacter(character) });
    }

    // /bag 命令 - 查看背包/物品栏
    if (action.trim().toLowerCase() === '/bag' || action.trim() === '背包' || action.trim() === '看背包' || action.trim() === '查看背包' || action.trim() === '物品栏') {
      const summary = itemSystem.getInventorySummary(character);
      response = { narrative: summary.text, type: 'inventory', inventoryData: summary };
      return res.json({ success: true, ...response, character: getPublicCharacter(character) });
    }

    // /equip 命令 - 装备物品
    const equipMatch = action.trim().match(/^\/equip\s+(.+)/i);
    if (equipMatch || /^装备\s+(.+)/.test(action.trim())) {
      const m = equipMatch || action.trim().match(/^装备\s+(.+)/);
      const itemName = m[1].trim();
      const item = (character.inventory || []).find(i => i.name === itemName && !i.equipped);
      if (!item) {
        response = { narrative: `❌ 背包中没有未装备的「${itemName}」。`, type: 'inventory' };
      } else if (!itemSystem.slots.includes(item.slot)) {
        response = { narrative: `❌ 「${itemName}」不能装备。`, type: 'inventory' };
      } else {
        const result = itemSystem.equipItem(character, item.id);
        response = { narrative: result.message, type: 'inventory' };
        scheduleSave();
      }
      return res.json({ success: true, ...response, character: getPublicCharacter(character) });
    }

    // /unequip 命令 - 卸下装备
    const unequipMatch = action.trim().match(/^\/unequip\s+(.+)/i);
    if (unequipMatch || /^卸下\s+(.+)/.test(action.trim())) {
      const m = unequipMatch || action.trim().match(/^卸下\s+(.+)/);
      const slotName = m[1].trim();
      // 找到对应槽位的装备
      const slotMap = { '武器': 'weapon', '护甲': 'armor', '护手1': 'gloves1', '护手2': 'gloves2', '鞋子': 'shoes' };
      const slot = slotMap[slotName] || slotName;
      const equipped = (character.inventory || []).find(i => i.slot === slot && i.equipped);
      if (!equipped) {
        response = { narrative: `❌ ${slotName}槽位没有装备。`, type: 'inventory' };
      } else {
        const result = itemSystem.unequipItem(character, equipped.id);
        response = { narrative: result.message, type: 'inventory' };
        scheduleSave();
      }
      return res.json({ success: true, ...response, character: getPublicCharacter(character) });
    }

    // /wait 命令 - 等待时间流逝
    if (action.trim().toLowerCase() === '/wait' || action.trim() === '等待' || action.trim() === '休息') {
      const worldId = character.worldId || 'default';
      const oldPeriod = timeSystem.getTimeOfDay(worldId);
      timeSystem.waitToNext(worldId);
      const timeInfo = timeSystem.formatTime(worldId);
      const newPeriod = timeSystem.getTimeOfDay(worldId);
      
      let waitNarrative = `⏰ 你找了一个地方坐下，静静地等待时间流逝……\n\n${timeInfo.periodDesc}\n\n🕐 现在是 **${timeInfo.full}**。`;
      
      // 如果时段发生了变化
      if (oldPeriod !== newPeriod) {
        const periodNames = { morning: '清晨', afternoon: '上午', evening: '傍晚', night: '深夜' };
        waitNarrative = `⏰ 时间悄然流逝……\n\n${timeInfo.periodDesc}\n\n🕐 **${periodNames[oldPeriod] || oldPeriod} → ${periodNames[newPeriod] || newPeriod}** | ${timeInfo.full}`;
      }
      
      response = { narrative: waitNarrative, type: 'time' };
      
      // 多阶段任务：检查等待是否满足了当前阶段的时间要求
      let questCompletedResult = null;
      if (character.activeQuest && character.activeQuest.type === 'multi_stage') {
        const stageAdvance = checkMultiStageProgress(character);
        if (stageAdvance) {
          response.narrative += '\n\n' + stageAdvance;
        }
        // 检查任务是否已完成
        if (character.activeQuest?.status === 'completed') {
          questCompletedResult = {
            questTitle: character.activeQuest.title,
            rewardExp: character.activeQuest.rewardExp,
            rewardGold: character.activeQuest.rewardGold,
          };
          character.activeQuest = null;
        }
      }
      
      scheduleSave();
      return res.json({ success: true, ...response, character: getPublicCharacter(character), questCompleted: questCompletedResult, timeInfo });
    }
    
    // /time 命令 - 查看当前时间
    if (action.trim().toLowerCase() === '/time' || action.trim() === '时间' || action.trim() === '当前时间') {
      const worldId = character.worldId || 'default';
      const timeInfo = timeSystem.formatTime(worldId);
      response = { narrative: `🕐 **${timeInfo.full}**\n\n${timeInfo.periodDesc}`, type: 'time' };
      return res.json({ success: true, ...response, character: getPublicCharacter(character) });
    }

    // /learn 命令：购买技能卷轴学习技能
    const learnMatch = action.trim().match(/^\/learn\s+(.+)/i);
    if (learnMatch) {
      const skillId = learnMatch[1].trim();
      const learnResult = learnSkill(character, skillId);
      response = { narrative: learnResult.narrative, type: 'learn' };
      scheduleSave();
      return res.json({ success: learnResult.success, ...response, character: getPublicCharacter(character) });
    }

    // 检查是否在战斗中
    const worldId = character.worldId || 'default';
    const combat = activeCombats.get(playerId);
    if (combat && combat.status === 'active') {
      response = handleCombatAction(character, combat, action);
    } else {
      // 推进游戏时间（每次行动约30分钟）
      timeSystem.advanceTime(worldId, 30);
      // AI叙事引擎处理（含时间上下文）
      response = await AIEngine.generateResponse(character, action);

      // 如果 AI 判定触发了战斗，自动创建战斗实例
      if (response.combatTriggered) {
        const enemy = getRandomEnemy(character);
        const combatData = AIEngine.generateCombatStart(character, enemy);
        const combat = CombatSystem.createCombat(character, enemy);
        activeCombats.set(playerId, combat);
        response.narrative += '\n\n' + combatData.narrative;
        response.combat = CombatSystem.getCombatSummary(combat);
        response.combatTriggered = undefined; // 清理内部标记
      }
    }

    // 多阶段任务进度检测
    if (character.activeQuest && character.activeQuest.status === 'active' && response.narrative) {
      if (character.activeQuest.type === 'multi_stage') {
        const stageResult = checkMultiStageProgress(character, response.narrative, action);
        if (stageResult) {
          response.narrative += '\n\n' + stageResult;
        } else {
          // 阶段未推进：检查是否因为位置不对，给出友好引导
          const quest = character.activeQuest;
          const currentStage = quest.stages[(quest.currentStage || 1) - 1];
          if (currentStage && currentStage.needAction === 'move' && currentStage.needLocation && 
              character.currentLocation !== currentStage.needLocation) {
            const targetRegion = config.MAP_REGIONS.find(r => r.id === currentStage.needLocation);
            const targetName = targetRegion?.name || currentStage.needLocation;
            const currentRegion = config.MAP_REGIONS.find(r => r.id === character.currentLocation);
            const path = findPath(character.currentLocation, currentStage.needLocation);
            const pathStr = path ? formatPath(path) : null;
            const neighbors = (currentRegion?.neighbors || []).map(id => {
              const r = config.MAP_REGIONS.find(rr => rr.id === id);
              return r ? (id === currentStage.needLocation ? `**${r.name}** ← 目标!` : r.name) : id;
            }).join('、');
            response.narrative += `\n\n---\n💡 **任务提示：** 当前阶段需要前往「**${targetName}**」\n\n` +
              (pathStr
                ? `🗺️ **推荐路线：** ${pathStr}\n📌 **下一步：** 前往 **${formatPath([path[1]])}**（点击🗺️地图面板中的相邻区域按钮，或输入"前往${formatPath([path[1]])}"）\n`
                : `📌 点击左侧 **🗺️ 地图** 按钮打开地图，然后点击相邻区域来移动。\n`) +
              `\n📍 当前相邻区域：${neighbors}`;
          }
        }
      } else {
        // 旧版单阶段任务
        const completed = checkQuestProgress(character, response.narrative, action);
        if (completed) {
          const questResult = completeQuest(character);
          response.narrative += questResult.narrative;
        }
      }
    }
    
    // 多阶段任务完成检测（如果最后一个阶段被标记为完成）
    let questResult = null;
    if (character.activeQuest?.type === 'multi_stage' && character.activeQuest?.status === 'completed') {
      questResult = {
        questTitle: character.activeQuest.title,
        rewardExp: character.activeQuest.rewardExp,
        rewardGold: character.activeQuest.rewardGold,
      };
      // 清理已完成的任务
      character.activeQuest = null;
    }

    // 升级通知注入
    const levelUpNotif = getLevelUpNotification(playerId);
    if (levelUpNotif) {
      let notifText = `\n\n🎉 **恭喜！你升级到了 Lv.${levelUpNotif.level}！**\n\n❤️ HP上限+10 | 💎 MP上限+5 | ⭐ 获得${levelUpNotif.pointsGained}属性点`;
      if (levelUpNotif.newSkills.length > 0) {
        notifText += '\n\n📚 **新技能解锁：**';
        for (const sk of levelUpNotif.newSkills) {
          notifText += `\n- 🔓 **${sk.name}** [${sk.type}]：${sk.desc}\n  💰 购买卷轴「${sk.scrollName}」即可学习。输入 /learn ${sk.id}`;
        }
      }
      notifText += `\n📊 下一级需要：${levelUpNotif.expForNext} 经验`;
      response.narrative += notifText;
    }

    const timeInfoFinal = timeSystem.formatTime(worldId);
    scheduleSave();
    res.json({ success: true, ...response, character: getPublicCharacter(character), questCompleted: questResult, timeInfo: timeInfoFinal });
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
      const targetRegion = config.MAP_REGIONS.find(r => r.id === regionId);
      const targetName = targetRegion ? targetRegion.name : regionId;
      const neighborNames = (currentRegion?.neighbors || []).map(id => {
        const r = config.MAP_REGIONS.find(rr => rr.id === id);
        return r ? r.name : id;
      }).join('、');
      return res.status(400).json({
        error: `${targetName}不在相邻区域。当前可前往：${neighborNames || '无'}。请在地图上逐步移动。`,
      });
    }

    const targetRegion = config.MAP_REGIONS.find(r => r.id === regionId);
    if (!targetRegion) return res.status(404).json({ error: '区域不存在' });

    character.currentLocation = regionId;
    if (!character.exploredRegions.includes(regionId)) {
      character.exploredRegions.push(regionId);
    }

    // 推进游戏时间（旅行约2小时）
    const worldId = character.worldId || 'default';
    timeSystem.advanceTime(worldId, 120);

    const narrative = AIEngine.getRegionEntryDesc(targetRegion.name, character);

    // 神弃者进入神殿特殊处理
    if (regionId === 'temple' && character.talents?.includes('forsaken')) {
      character.currentHp = Math.max(1, character.currentHp - 5);
    }

    // 随机遭遇判定
    const positiveEvent = DiceSystem.eventRoll(character, 50);
    let eventResult = null;
    if (Math.random() < 0.4) {
      eventResult = generateRandomEvent(character, regionId, positiveEvent);
      narrative += '\n\n' + eventResult;
    }

    // 多阶段任务检测：移动到目标位置
    let stageResult = '';
    let questCompletedResult = null;
    if (character.activeQuest && character.activeQuest.type === 'multi_stage') {
      const result = checkMultiStageProgress(character);
      if (result) stageResult = '\n\n' + result;
      // 检查任务是否已完成
      if (character.activeQuest?.status === 'completed') {
        questCompletedResult = {
          questTitle: character.activeQuest.title,
          rewardExp: character.activeQuest.rewardExp,
          rewardGold: character.activeQuest.rewardGold,
        };
        character.activeQuest = null;
      }
    }

    const timeInfo = timeSystem.formatTime(worldId);
    scheduleSave();
    res.json({
      success: true,
      narrative: `🗺️ 你移动到了 **${targetRegion.name}**。\n\n${narrative}${stageResult}`,
      location: targetRegion,
      event: eventResult,
      timeInfo,
      character: getPublicCharacter(character),
      questCompleted: questCompletedResult,
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
    const timeInfo = timeSystem.formatTime(character.worldId || 'default');

    res.json({
      success: true,
      narrative,
      location: region,
      character: getPublicCharacter(character),
      timeInfo,
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
    let questCompletedResult = null;
    if (combat.status === 'victory' && combat.rewards) {
      const character = players.get(playerId);
      character.exp += combat.rewards.exp;
      character.gold += combat.rewards.gold;
      character.totalKills++;
      checkLevelUp(character);
      activeCombats.delete(playerId);

      // 战斗胜利时检测任务完成
      if (character.activeQuest && character.activeQuest.status === 'active') {
        const victoryMsg = '成功击败了敌人';
        if (checkQuestProgress(character, victoryMsg + ' ' + (combat.enemy?.name || ''), '攻击')) {
          questCompletedResult = completeQuest(character);
        }
      }
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

    scheduleSave();
    const responsePayload = {
      success: true,
      ...result,
      combat: CombatSystem.getCombatSummary(combat),
      character: getPublicCharacter(players.get(playerId)),
    };
    if (questCompletedResult) {
      responsePayload.narrative = (responsePayload.log?.join('\n') || '') + questCompletedResult.narrative;
      responsePayload.questCompleted = questCompletedResult;
    }
    res.json(responsePayload);
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

    scheduleSave();
    res.json({ success: true, character: getPublicCharacter(character) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 装备/卸下物品 API
app.post('/api/character/equip', (req, res) => {
  try {
    const { token, itemId } = req.body;
    const playerId = sessions.get(token);
    if (!playerId) return res.status(401).json({ error: '未登录' });

    const character = players.get(playerId);
    if (!character) return res.status(404).json({ error: '角色不存在' });

    const result = itemSystem.equipItem(character, itemId);
    scheduleSave();
    res.json({ success: result.success, message: result.message, character: getPublicCharacter(character) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/character/unequip', (req, res) => {
  try {
    const { token, itemId } = req.body;
    const playerId = sessions.get(token);
    if (!playerId) return res.status(401).json({ error: '未登录' });

    const character = players.get(playerId);
    if (!character) return res.status(404).json({ error: '角色不存在' });

    const result = itemSystem.unequipItem(character, itemId);
    scheduleSave();
    res.json({ success: result.success, message: result.message, character: getPublicCharacter(character) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ 任务系统 ============
app.get('/api/quest', (req, res) => {
  try {
    const token = req.query.token;
    const playerId = sessions.get(token);
    if (!playerId) return res.status(401).json({ error: '未登录' });

    const character = players.get(playerId);
    if (!character) return res.status(404).json({ error: '角色不存在' });

    res.json({
      success: true,
      activeQuest: character.activeQuest || null,
      completedQuests: character.completedQuests || [],
    });
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
    racialCapitals: config.RACIAL_CAPITALS,
    reputationTiers: config.REPUTATION_TIERS,
    classReputation: config.CLASS_REPUTATION,
    factions: config.FACTIONS,
    factionReputation: config.FACTION_REPUTATION,
    weaponProficiency: config.WEAPON_PROFICIENCY,
    equipmentQualities: config.EQUIPMENT_QUALITIES,
    equipmentSlots: config.EQUIPMENT_SLOTS,
    classArmorNames: config.CLASS_ARMOR_NAMES,
    innateSkills: config.INNATE_SKILLS,
    developmentRoadmap: config.DEVELOPMENT_ROADMAP,
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
    talents: char.talents || [], talentLevel: char.talentLevel,
    racialTrait: char.racialTrait,
    worldState: char.worldState, luckyBlessing: char.luckyBlessing,
    level: char.level, exp: char.exp,
    expProgress: getExpProgress(char),
    attributes: char.attributes, extraPoints: char.extraPoints,
    maxHp: char.maxHp, currentHp: char.currentHp,
    maxMp: char.maxMp, currentMp: char.currentMp,
    equipment: char.equipment, inventory: char.inventory,
    currentLocation: char.currentLocation, exploredRegions: char.exploredRegions,
    sessionCount: char.sessionCount, totalKills: char.totalKills,
    totalDeaths: char.totalDeaths, gold: char.gold,
    worldId: char.worldId, computed: char.computed,
    birthLocation: char.birthLocation,
    reputation: char.reputation,
    faction: char.faction,
    factionRep: char.factionRep,
    weaponProficiency: char.weaponProficiency,
    innateSkills: computeInnateSkillTiers(char),
    skills: char.skills || [],           // 主动技能
    tutorialSeen: char.tutorialSeen,
    activeQuest: char.activeQuest,
    completedQuests: char.completedQuests,
    killQuests: char.killQuests || {},
  };
}

function getAvailableTalentTypes(className, race) {
  const mapping = {
    warrior: ['combat', 'explore', 'wild', 'special'],
    mage: ['magic', 'explore', 'wild', 'special'],
    rogue: ['stealth', 'social', 'wild', 'special'],
    cleric: ['holy', 'social', 'special'],
    druid: ['magic', 'wild', 'explore', 'special'],
    paladin: ['combat', 'holy', 'wild', 'special'],
    shaman: ['magic', 'wild', 'social', 'special'],
  };
  // 亡灵额外可访问死灵契约天赋
  if (race === 'undead') {
    const base = mapping[className] || ['combat', 'magic', 'stealth', 'explore', 'social', 'special'];
    return [...new Set([...base, 'special'])];
  }
  return mapping[className] || ['combat', 'magic', 'stealth', 'explore', 'social', 'special'];
}

function computeFactionReputation(playerFaction, className) {
  const baseRep = config.CLASS_REPUTATION[className] || 0;
  const rep = {};
  for (const fid of Object.keys(config.FACTIONS)) {
    if (fid === playerFaction) {
      rep[fid] = baseRep;
    } else {
      // 善恶互斥 → 仇恨；中立 → 冷漠
      const playerF = config.FACTIONS[playerFaction];
      const targetF = config.FACTIONS[fid];
      if (playerF && targetF) {
        const isPlayerNeutral = playerFaction === 'neutral_order';
        const isTargetNeutral = fid === 'neutral_order';
        if (isPlayerNeutral || isTargetNeutral) {
          rep[fid] = config.FACTION_REPUTATION.neutral;
        } else {
          rep[fid] = config.FACTION_REPUTATION.opposite;
        }
      } else {
        rep[fid] = 0;
      }
    }
  }
  return rep;
}

function getBirthLocation(race, className) {
  const raceLocations = config.BIRTH_LOCATIONS[race];
  if (!raceLocations) return { capital: '未知之地', place: '未知起点', story: '你在艾尔德兰大陆上醒来。' };
  const loc = raceLocations[className] || Object.values(raceLocations)[0];
  const capitalName = config.RACIAL_CAPITALS[race]?.name || '未知首都';
  return {
    capital: capitalName,
    place: loc.place,
    story: loc.story,
  };
}

function getStartLocation(worldState, race, className) {
  // 根据种族+职业分配起始区域
  const raceRegions = config.START_REGIONS[race];
  if (raceRegions && raceRegions[className]) {
    return raceRegions[className];
  }
  // 兜底：按种族粗略分配
  const raceDefaults = {
    human: 'town_gate', elf: 'forest_edge', dwarf: 'underground',
    orc: 'river_crossing', undead: 'graveyard',
  };
  return raceDefaults[race] || (worldState === 'decline_age' ? 'forest_edge' : 'town_gate');
}

// 构建新手背包（亡灵使用专属物品，其他种族按职业发放）
function buildStarterInventory(race, className) {
  const items = [];

  // 生成品质装备（崭新/白色 - 新手级别）
  const starterWeapon = itemSystem.generateEquipment('weapon', 'common', className, 1);
  starterWeapon.equipped = true;
  items.push(starterWeapon);

  const starterArmor = itemSystem.generateEquipment('armor', 'common', className, 1);
  starterArmor.equipped = true;
  items.push(starterArmor);

  // 添加护手1、护手2、鞋子
  items.push(itemSystem.generateEquipment('gloves1', 'common', className, 1));
  items.push(itemSystem.generateEquipment('gloves2', 'common', className, 1));
  items.push(itemSystem.generateEquipment('shoes', 'common', className, 1));

  // 亡灵使用专属暗影系物品
  if (race === 'undead') {
    const undeadItems = config.STARTER_ITEMS['undead'] || [];
    items.push(...undeadItems.map(item => ({ ...item })));
    // 亡灵补充通用面包
    items.push({ name: '干硬的面包', type: 'consumable', heal: 3, qty: 2, desc: '从莫尔迪斯废弃面包房捡来的面包，硬得像石头。亡灵的味觉早就退化了——反正也尝不出味道。' });
  } else {
    // 保留消耗品和关键物品（武器和护甲已用新系统生成）
    const classItems = config.STARTER_ITEMS[className] || [];
    for (const item of classItems) {
      if (item.type !== 'weapon' && item.type !== 'armor') {
        items.push({ ...item });
      }
    }
    // 面包和清水
    items.push({ name: '面包与清水', type: 'consumable', heal: 8, qty: 3, desc: '最基本的旅行干粮。一块粗面包，一皮囊清水——简单，却能让你撑到下一个小镇。' });
  }
  return items;
}

// 生成沉浸式新手教程叙事
function generateTutorialNarrative(race, className, worldState) {
  const classTutorial = config.TUTORIAL_NARRATIVES[className];
  const eraLore = config.ERA_LORE[worldState];
  const raceData = config.RACES[race];
  const weaponProf = config.WEAPON_PROFICIENCY[className];
  const birthInfo = getBirthLocation(race, className);

  if (!classTutorial) return null;

  // 亡灵特殊警示
  let undeadWarning = '';
  if (race === 'undead') {
    undeadWarning = `\n\n⚠️ **亡灵之躯：** 你的存在本身令生者恐惧。圣光对你是致命的——任何圣光药水、圣水或神圣法术都会灼烧你的亡灵之躯，如同烈焰焚身。你天生亲和暗影与死灵魔法，但永远无法被圣光接纳。`;
  }

  // 构建完整教程
  return {
    className: config.CLASSES[className]?.name || className,
    raceName: raceData?.name || race,
    classEmoji: { warrior: '⚔️', mage: '🔮', rogue: '🗡️', cleric: '✝️', druid: '🌿', paladin: '🛡️', shaman: '🪨' }[className] || '⭐',
    location: `${birthInfo.capital} · ${birthInfo.place}`,
    weaponProficiency: weaponProf,
    intro: classTutorial.intro,
    discovery: classTutorial.discovery + undeadWarning,
    tip: classTutorial.tip,
    eraLore: eraLore,
  };
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
  const adjustedPool = character.worldState === 'decline_age' ? [...pool, 'rift_beast'] : pool;
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

// 存储升级时解锁的新技能通知
const levelUpNotifications = new Map();

function checkLevelUp(character) {
  const oldLevel = character.level;
  let leveledUp = false;
  const newSkills = [];  // 记录本次升级解锁的新技能
  let totalPointsGained = 0;

  while (true) {
    const expNeeded = config.getExpForLevel(character.level + 1);
    if (character.exp < expNeeded) break;

    character.exp -= expNeeded;
    character.level++;
    leveledUp = true;
    // 属性点公式: 1-10级每级10点, 11-20级每级20点, 21-30级每级30点...
    const pointsGained = Math.ceil(character.level / 10) * 10;
    totalPointsGained += pointsGained;
    character.extraPoints += pointsGained;
    character.maxHp += 10;
    character.currentHp = character.maxHp;
    character.maxMp += 5;
    character.currentMp = character.maxMp;

    // 检查解锁了新技能
    const classSkills = config.CLASS_SKILL_TREES[character.class];
    if (classSkills) {
      for (const skill of classSkills) {
        if (skill.levelReq === character.level) {
          // 新技能解锁
          if (!character.skills) character.skills = [];
          if (!character.skills.find(s => s.id === skill.id)) {
            character.skills.push({
              id: skill.id,
              name: skill.name,
              skillLevel: 0,  // 已解锁但未学习（需要购买卷轴）
              type: skill.type,
              scrollName: skill.scrollName,
              desc: skill.desc,
            });
            newSkills.push({ id: skill.id, name: skill.name, type: skill.type, desc: skill.desc, scrollName: skill.scrollName, levelReq: skill.levelReq });
          }
        }
      }
    }
  }

  if (leveledUp) {
    const notif = {
      level: character.level,
      oldLevel,
      newSkills,
      pointsGained: totalPointsGained,
      expForNext: config.getExpForLevel(character.level + 1),
    };
    levelUpNotifications.set(character.id, notif);
  }

  return leveledUp;
}

function getLevelUpNotification(playerId) {
  const notif = levelUpNotifications.get(playerId);
  if (notif) {
    levelUpNotifications.delete(playerId);
    return notif;
  }
  return null;
}

// 获取升级所需经验（用于前端显示）
function getExpProgress(character) {
  const expForNext = config.getExpForLevel(character.level + 1);
  const expForCurrent = config.getExpForLevel(character.level);
  const progress = Math.min(100, Math.floor((character.exp / expForNext) * 100));
  return { current: character.exp, needed: expForNext, progress };
}

// 获取职业天生技能定义（只读副本用于角色存储）
function getInnateSkills(className) {
  const classSkills = config.INNATE_SKILLS[className];
  if (!classSkills) return null;
  const result = {};
  for (const [key, skill] of Object.entries(classSkills)) {
    result[key] = {
      name: skill.name,
      icon: skill.icon,
      type: skill.type,
    };
  }
  return result;
}

// 根据角色等级计算天生技能阶位
function computeInnateSkillTiers(char) {
  const classSkills = config.INNATE_SKILLS[char.class];
  if (!classSkills) return null;

  const level = char.level || 1;
  const result = {};

  for (const [key, skill] of Object.entries(classSkills)) {
    // 确定当前阶位
    const tierLevels = Object.keys(skill.tiers).map(Number).sort((a, b) => a - b);
    let currentTierLevel = tierLevels[0];
    let nextTierLevel = null;

    for (const tl of tierLevels) {
      if (level >= tl) {
        currentTierLevel = tl;
      } else {
        nextTierLevel = tl;
        break;
      }
    }

    const currentTier = skill.tiers[currentTierLevel];
    const isMaxed = !nextTierLevel || currentTierLevel >= 60;

    result[key] = {
      name: skill.name,
      icon: skill.icon,
      type: skill.type,
      desc: skill.desc,
      currentTier: {
        level: currentTier.level,
        name: currentTier.name,
        effects: currentTier.effects,
        desc: currentTier.desc,
      },
      nextTier: isMaxed ? null : {
        level: nextTierLevel,
        name: skill.tiers[nextTierLevel].name,
        desc: skill.tiers[nextTierLevel].desc,
        unlocksAt: nextTierLevel,
      },
      isMaxed,
    };
  }

  return result;
}

// ===== 随机 NPC 任务系统 =====
function generateQuest(character) {
  // 40%概率生成多阶段任务（更有深度）
  if (Math.random() < 0.4 && config.MULTI_STAGE_QUESTS && config.MULTI_STAGE_QUESTS.length > 0) {
    return generateMultiStageQuest(character);
  }

  // 所有模板按类型汇总为平面数组
  const allTemplates = [];
  for (const category of Object.keys(config.QUEST_TEMPLATES)) {
    for (const t of config.QUEST_TEMPLATES[category]) {
      allTemplates.push({ ...t, category });
    }
  }

  const template = allTemplates[Math.floor(Math.random() * allTemplates.length)];

  // 选择与角色同阵营/中立阵营的 NPC 种族
  const charFaction = config.RACES[character.race]?.faction || 'neutral_order';
  const factionMembers = { good_order: ['human', 'elf'], evil_order: ['orc', 'undead'], neutral_order: ['dwarf'] };
  const friendlyRaces = [...(factionMembers[charFaction] || []), 'dwarf'];
  const validRaces = friendlyRaces.filter(r => config.NPC_NAMES[r]);
  const npcRace = validRaces[Math.floor(Math.random() * validRaces.length)];
  const namePool = config.NPC_NAMES[npcRace] || config.NPC_NAMES.human;
  const npcName = namePool[Math.floor(Math.random() * namePool.length)];

  const quest = {
    id: template.id,
    title: template.title,
    difficulty: template.difficulty,
    type: template.type,
    desc: template.desc.replace('{npcName}', npcName),
    objective: template.objective,
    location: template.location,
    targetEnemy: template.targetEnemy,
    killCount: template.killCount || 0,
    rewardGold: template.rewardGold || (template.difficulty * 25),
    rewardExp: template.rewardExp || (template.difficulty * 60),
    rewardItem: template.rewardItem || null,
    completeHint: template.completeHint,
    npcName,
    npcRace,
    raceName: config.RACES[npcRace]?.name || npcRace,
    templateId: template.id,
    status: 'active',
    createdAt: Date.now(),
  };

  // 猎杀任务初始化击杀计数
  if (quest.type === 'combat' && quest.targetEnemy && quest.killCount > 0) {
    if (!character.killQuests) character.killQuests = {};
    character.killQuests[quest.id] = 0;
  }

  return quest;
}

function generateQuestIntro(character, quest) {
  const startRegion = config.MAP_REGIONS.find(r => r.id === character.currentLocation);
  const startRegionName = startRegion ? startRegion.name : '当前位置';
  const raceName = config.RACES[character.race]?.name || character.race;
  const difficultyLabel = quest.difficulty <= 2 ? '🟢 简单' : quest.difficulty <= 4 ? '🟡 中等' : '🔴 困难';

  // 构建奖励文本
  let rewardText = `💰 ${quest.rewardGold}金币 + ⭐ ${quest.rewardExp}经验`;
  if (quest.rewardItem) rewardText += ` + 🎁 ${quest.rewardItem}`;

  // 多阶段任务特殊展示
  if (quest.type === 'multi_stage' && quest.stages) {
    let stagesPreview = '';
    for (let i = 0; i < quest.stages.length; i++) {
      const s = quest.stages[i];
      const marker = i === 0 ? '⏳' : '🔒';
      stagesPreview += `\n> ${marker} 阶段${i + 1}：${s.goal}`;
    }

    return `📍 你当前位于：**${startRegionName}**

${startRegion ? startRegion.desc : ''}

🌍 世界状态：**${config.WORLD_STATES[character.worldState]?.name || '未知'}**

---

👤 **突然，一个身影向你走来……**

一个${quest.raceName}急匆匆地朝你跑来，脸上写满了焦急。

**${quest.npcName}**（${quest.raceName}）：「你是冒险者对吧？太好了……我遇到了大麻烦，需要你的帮助——**${quest.title}**。」

「事情的经过是这样的：${quest.desc}」

「这不是简单的事。你得${quest.stages[0].goal}——后面可能还有其他事情要做。但我相信你能办到。」

> 📋 **任务难度**：${difficultyLabel} | **类型**：📜 多阶段任务（${quest.stages.length}个阶段）
> 💰 **奖励**：${rewardText}
> 💡 **第一阶段**：${quest.stages[0].goal}
${stagesPreview}

你现在可以自由行动。输入你的行动来推进剧情，或输入 **/quest** 查看当前任务进度。`;
  }

  // 猎杀任务特殊开场
  let questTypeInfo = '';
  if (quest.type === 'combat' && quest.killCount > 1) {
    const enemyName = config.ENEMIES[quest.targetEnemy]?.name || quest.targetEnemy;
    questTypeInfo = `\n> ⚔️ 猎杀任务：消灭 **${quest.killCount}** 只${enemyName}`;
  }

  return `📍 你当前位于：**${startRegionName}**

${startRegion ? startRegion.desc : ''}

🌍 世界状态：**${config.WORLD_STATES[character.worldState]?.name || '未知'}**

---

👤 **突然，一个身影向你走来……**

一个${quest.raceName}急匆匆地朝你跑来，脸上写满了焦急。从他/她身上略显凌乱的样子来看，似乎遇到了不小的麻烦。

**${quest.npcName}**（${quest.raceName}）：「你是冒险者对吧？太好了……我在${startRegionName}附近等了很久，总算遇到一个看起来能帮上忙的人。我需要你的帮助——**${quest.title}**。」

「事情的经过是这样的：${quest.desc}」${questTypeInfo}

「如果你能帮我${quest.objective}，我愿意付给你 **${rewardText}**。」

> 📋 **任务难度**：${difficultyLabel} | **类型**：${{fetch:'🔍探索', combat:'⚔️战斗', escort:'🛡️护送', mystery:'📜调查'}[quest.type] || quest.type}
> 💡 **提示**：${quest.completeHint}

你现在可以自由行动。输入你的行动来推进剧情，或输入 **/quest** 查看当前任务。`;
}

function checkQuestProgress(character, narrative, action) {
  if (!character.activeQuest || character.activeQuest.status !== 'active') return null;

  const quest = character.activeQuest;
  const lowerNarrative = (narrative || '').toLowerCase();
  const lowerAction = (action || '').toLowerCase();

  // 猎杀任务特殊处理
  if (quest.type === 'combat' && quest.targetEnemy && quest.killCount > 0) {
    const enemyName = config.ENEMIES[quest.targetEnemy]?.name || quest.targetEnemy;
    const enemyLower = enemyName.toLowerCase();
    if (lowerNarrative.includes('击败') && lowerNarrative.includes(enemyLower)) {
      if (!character.killQuests) character.killQuests = {};
      character.killQuests[quest.id] = (character.killQuests[quest.id] || 0) + 1;
      if (character.killQuests[quest.id] >= quest.killCount) return true;
    }
    return false;
  }

  // 通用关键词检测
  const completePatterns = {
    Q_F01: ['找到', '取回', '护身符', '找回'], Q_F02: ['采集到', '找到', '药草', '草药', '月光苔'], Q_F03: ['信件', '找回', '找到'], Q_F04: ['孩子', '找到', '带回', '迷路'],
    Q_F05: ['战锤', '找回', '找到', '河畔'], Q_F06: ['古籍', '找回', '找到', '森林'],
    Q_C01: ['史莱姆', '清除', '消灭'], Q_C02: ['巨鼠', '清除', '消灭'], Q_C03: ['哥布林', '清除', '消灭'], Q_C04: ['灰狼', '消灭', '清除'],
    Q_C05: ['击败', '恶棍', '头目', '暗巷'], Q_C06: ['怪物', '消灭', '下水道', '清除'], Q_C07: ['货物', '夺回', '强盗', '营地'], Q_C08: ['清除', '亡灵', '净化', '墓园'],
    Q_C09: ['裂隙兽', '消灭', '裂隙'], Q_C10: ['暗影法师', '击败', '阻止', '仪式'], Q_C11: ['兽人', '战帮', '击败', '战酋'], Q_C12: ['巨魔', '击败', '秘宝', '地下通道'],
    Q_E01: ['护送', '商人', '抵达', '河畔'], Q_E02: ['救出', '矿工', '地下', '救出'],
    Q_M01: ['符号', '调查', '墓园', '真相', '来源'], Q_M02: ['失踪', '调查', '巡逻队', '废墟', '真相'],
  };

  const patterns = completePatterns[quest.templateId] || [];
  let completeCount = 0;
  for (const p of patterns) {
    if (lowerNarrative.includes(p) || lowerAction.includes(p)) completeCount++;
  }

  if (completeCount >= 2) return true;
  return false;
}

function completeQuest(character) {
  if (!character.activeQuest) return null;
  const quest = character.activeQuest;
  quest.status = 'completed';
  quest.completedAt = Date.now();

  // 发放奖励（使用任务模板定义的奖励值）
  const rewardExp = quest.rewardExp || (quest.difficulty * 60);
  const rewardGold = quest.rewardGold || (quest.difficulty * 25);
  character.exp += rewardExp;
  character.gold += rewardGold;
  checkLevelUp(character);

  // 清理猎杀进度
  if (character.killQuests && character.killQuests[quest.id] !== undefined) {
    delete character.killQuests[quest.id];
  }

  // 保存到已完成列表
  if (!character.completedQuests) character.completedQuests = [];
  character.completedQuests.push({
    id: quest.id, title: quest.title, completedAt: quest.completedAt,
  });

  const rewardText = quest.rewardItem ? ` + 🎁 ${quest.rewardItem}` : '';
  const demoNote = '✨ *这个小小的冒险告一段落。但艾尔德兰还有更多的故事等待着你……*\n\n> 🎮 **Demo 到此结束！** 感谢你的试玩。你可以继续自由探索这个世界，或返回标题创建新角色体验不同的故事。';

  const result = {
    questTitle: quest.title,
    rewardExp, rewardGold,
    narrative: `\n\n---\n\n🏆 **任务完成：「${quest.title}」**\n\n你成功帮助了 **${quest.npcName}**！他/她感激涕零地握住你的手。\n\n「谢谢你，冒险者！这是答应你的报酬。」\n\n💰 获得 **${rewardGold}** 金币\n⭐ 获得 **${rewardExp}** 经验值${rewardText}\n\n${demoNote}\n\n---`,
  };

  // 清理活跃任务
  character.activeQuest = null;

  return result;
}

// ===== 多阶段任务系统 =====

/** 生成多阶段任务 */
function generateMultiStageQuest(character) {
  const templates = config.MULTI_STAGE_QUESTS;
  const template = templates[Math.floor(Math.random() * templates.length)];

  // NPC 选择
  const charFaction = config.RACES[character.race]?.faction || 'neutral_order';
  const factionMembers = { good_order: ['human', 'elf'], evil_order: ['orc', 'undead'], neutral_order: ['dwarf'] };
  const friendlyRaces = [...(factionMembers[charFaction] || []), 'dwarf'];
  const validRaces = friendlyRaces.filter(r => config.NPC_NAMES[r]);
  const npcRace = validRaces[Math.floor(Math.random() * validRaces.length)];
  const namePool = config.NPC_NAMES[npcRace] || config.NPC_NAMES.human;
  const npcName = namePool[Math.floor(Math.random() * namePool.length)];

  const quest = {
    id: template.id + '_' + Date.now(),
    templateId: template.id,
    title: template.title,
    difficulty: template.difficulty,
    type: 'multi_stage',
    desc: template.desc.replace(/\{npcName\}/g, npcName),
    rewardGold: template.rewardGold || (template.difficulty * 30),
    rewardExp: template.rewardExp || (template.difficulty * 70),
    npcName,
    npcRace,
    raceName: config.RACES[npcRace]?.name || npcRace,
    status: 'active',
    createdAt: Date.now(),
    currentStage: 1,
    stages: template.stages.map(s => ({
      ...s,
      hint: s.hint.replace(/\{NPC\}/g, npcName).replace(/\{npcName\}/g, npcName),
      narration: s.narration ? s.narration.replace(/\{NPC\}/g, npcName).replace(/\{npcName\}/g, npcName) : '',
    })),
  };

  return quest;
}

/** 检测多阶段任务进度 */
function checkMultiStageProgress(character, narrative, action) {
  if (!character.activeQuest || character.activeQuest.type !== 'multi_stage') return null;
  const quest = character.activeQuest;
  const currentStageIdx = (quest.currentStage || 1) - 1;
  const stage = quest.stages[currentStageIdx];
  if (!stage) return null;

  const playerLocation = character.currentLocation;
  const worldId = character.worldId || 'default';
  const timeOfDay = timeSystem.getTimeOfDay(worldId);
  const lowerAction = (action || '').toLowerCase();
  const lowerNarrative = (narrative || '').toLowerCase();

  let conditionsMet = true;

  // 1. 检查位置要求
  if (stage.needLocation && playerLocation !== stage.needLocation) {
    conditionsMet = false;
  }

  // 2. 检查时间要求
  if (stage.needTime && timeOfDay !== stage.needTime) {
    conditionsMet = false;
  }

  // 3. 检查行动要求
  if (conditionsMet && stage.needAction) {
    const needAction = stage.needAction;
    if (needAction === 'move') {
      // 移动到目标位置即满足（自动推进）
      // 条件：needLocation 已匹配（已在上面通过检查）
    } else if (needAction === 'wait') {
      // 等待到目标时间即满足
      // 条件：needLocation + needTime 已匹配
    } else if (needAction === 'search') {
      // 玩家需要搜索/调查
      const searchKeywords = ['搜索', '调查', '观察', '检查', '寻找', '查看', '仔细', 'search', 'investigate', 'examine', 'look', 'find'];
      const hasSearchAction = searchKeywords.some(k => lowerAction.includes(k));
      const hasSearchNarrative = searchKeywords.some(k => lowerNarrative.includes(k));
      conditionsMet = hasSearchAction || hasSearchNarrative;
    } else if (needAction === 'talk') {
      // 玩家需要交谈/报告
      const talkKeywords = ['交谈', '报告', '汇报', '告诉', '说', '找', '回复', 'talk', 'report', 'tell', 'speak'];
      const hasTalkAction = talkKeywords.some(k => lowerAction.includes(k));
      const hasTalkNarrative = talkKeywords.some(k => lowerNarrative.includes(k));
      conditionsMet = hasTalkAction || hasTalkNarrative;
    } else if (needAction === 'combat') {
      // 需要在指定地点战斗
      const combatKeywords = ['击败', '消灭', '攻击', '战斗', 'defeat', 'kill', 'attack'];
      const hasCombat = combatKeywords.some(k => lowerNarrative.includes(k) || lowerAction.includes(k));
      conditionsMet = hasCombat;
    }
  }

  if (!conditionsMet) return null;

  // 推进到下一阶段
  const stageNarration = stage.narration || '';
  quest.currentStage = (quest.currentStage || 1) + 1;

  // 检查是否所有阶段完成
  if (quest.currentStage > quest.stages.length) {
    // 任务完成！
    quest.status = 'completed';
    quest.completedAt = Date.now();

    // 发放奖励
    character.exp += quest.rewardExp;
    character.gold += quest.rewardGold;
    checkLevelUp(character);

    // 保存到已完成列表
    if (!character.completedQuests) character.completedQuests = [];
    character.completedQuests.push({
      id: quest.id, title: quest.title, completedAt: quest.completedAt,
    });

    return `\n🏆 **任务完成：「${quest.title}」**\n\n${stageNarration}\n\n💰 获得 **${quest.rewardGold}** 金币 | ⭐ 获得 **${quest.rewardExp}** 经验值\n\n你成功完成了这个任务的所有阶段！${quest.npcName}感激不尽。`;
  }

  // 推进到下一阶段的通知
  const nextStage = quest.stages[quest.currentStage - 1];
  let advanceMsg = `\n📋 **任务推进！** 阶段 ${quest.currentStage - 1}/${quest.stages.length} 完成 → 阶段 ${quest.currentStage}/${quest.stages.length} 开始`;
  if (stageNarration) advanceMsg += `\n\n${stageNarration}`;
  if (nextStage) {
    advanceMsg += `\n\n🎯 **新目标：${nextStage.goal}**`;
    advanceMsg += `\n💡 ${nextStage.hint}`;
  }

  return advanceMsg;
}

// 购买技能卷轴学习技能
function learnSkill(character, skillId) {
  const classSkills = config.CLASS_SKILL_TREES[character.class];
  if (!classSkills) {
    return { success: false, narrative: '你的职业没有技能树。' };
  }

  const skillDef = classSkills.find(s => s.id === skillId);
  if (!skillDef) {
    const availableIds = classSkills.map(s => `\`${s.id}\``).join(', ');
    return { success: false, narrative: `未找到技能「${skillId}」。可用的技能ID：${availableIds}` };
  }

  if (character.level < skillDef.levelReq) {
    return { success: false, narrative: `你的等级不足。需要达到 Lv.${skillDef.levelReq} 才能学习「${skillDef.name}」。` };
  }

  if (!character.skills) character.skills = [];
  let knownSkill = character.skills.find(s => s.id === skillId);

  // 如果还没解锁（skillLevel为0），需要先解锁
  if (!knownSkill || knownSkill.skillLevel === 0) {
    // 自动解锁
    if (!knownSkill) {
      knownSkill = {
        id: skillId,
        name: skillDef.name,
        skillLevel: 0,
        type: skillDef.type,
        scrollName: skillDef.scrollName,
        desc: skillDef.desc,
      };
      character.skills.push(knownSkill);
    }
  }

  if (knownSkill.skillLevel >= skillDef.skillLevels) {
    return { success: false, narrative: `「${skillDef.name}」已达到最高等级 Lv.${knownSkill.skillLevel}/${skillDef.skillLevels}。` };
  }

  const nextLevel = knownSkill.skillLevel + 1;
  const scrollCost = skillDef.baseCost * nextLevel;

  if (character.gold < scrollCost) {
    return { success: false, narrative: `金币不足！购买「${skillDef.scrollName}」需要 ${scrollCost} 金币，你只有 ${character.gold} 金币。\n\n💡 提示：完成委托任务或多打怪都能赚取金币。` };
  }

  // 扣除金币
  character.gold -= scrollCost;

  // 升级技能
  knownSkill.skillLevel = nextLevel;

  // 构建效果描述
  const effects = skillDef.effects;
  let effectsDesc = '';
  if (effects) {
    const idx = nextLevel; // skillLevels=5 means indices 0-5 for levels 1-5+ultimate
    if (effects.damage && effects.damage[idx]) effectsDesc = `伤害倍率：${effects.damage[idx]}x`;
    else if (effects.dmg && effects.dmg[idx]) effectsDesc = `伤害倍率：${effects.dmg[idx]}x`;
    else if (effects.heal && effects.heal[idx]) effectsDesc = `治疗量：${effects.heal[idx]}`;
    else if (effects.healPercent && effects.healPercent[idx]) effectsDesc = `回复HP：${effects.healPercent[idx]}%`;
  }

  return {
    success: true,
    narrative: `📜 你购买了「${skillDef.scrollName}」并成功提升技能等级！\n\n⚡ **${skillDef.name}** → Lv.${nextLevel}/${skillDef.skillLevels}\n📖 ${skillDef.desc}\n${effectsDesc ? '\n📊 ' + effectsDesc : ''}\n💰 消耗 ${scrollCost} 金币 | 剩余 ${character.gold} 金币\n\n💡 输入 /skills 查看完整技能树。`,
  };
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

// 进程退出时保存数据
process.on('SIGINT', () => { saveData(); process.exit(); });
process.on('SIGTERM', () => { saveData(); process.exit(); });
process.on('uncaughtException', (err) => { console.error('未捕获异常:', err); saveData(); process.exit(1); });
