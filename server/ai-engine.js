// AI 叙事引擎 - 调用 Agnes-2.0-Flash 真实大模型
const config = require('./config');
const DiceSystem = require('./dice-system');
const timeSystem = require('./time-system');

// 内置 fetch（Node 18+ 自带；兼容老版本回退到 https）
let fetchImpl = global.fetch;
if (!fetchImpl) {
  fetchImpl = (...args) => import('node-fetch').then(({ default: f }) => f(...args));
}

const SYSTEM_PROMPT = `你是《艾尔德兰编年史：裂隙纪元》的游戏主持人(GM)。
- 角色扮演：永远以 GM 第二人称视角叙述，称呼玩家为"你"。
- 世界观：黑暗奇幻世界艾尔德兰，存在裂隙、神明、魔物、冒险者。神弃者被神明遗弃，无法使用神术。
- 历史背景：【核心历史】人类王国奥尔兰多与兽人氏族格罗玛什之间连年征战，战火最终蔓延至整片大陆，直接导致了光辉时代的没落。无数英雄在这一时期陨落，包括十一贤者之首雷克斯·秘法。战争之后，大陆分裂为三大阵营：人类与精灵组建「善良守序联盟」，兽人与觉醒的亡灵组建「邪恶守序部落」，矮人与其他独立种族则组建「中立守序阵营」大发战争财。
- 时代差异：【光辉时代】设定在战争之前，此时雷克斯·秘法和年轻的晨曦帝王尚在人世，大量传奇NPC存在于世界中，玩家可以深入与他们互动。这是一个故事驱动的单人沉浸体验时代。当玩家处于光辉时代时，你有机会让他们遇见这些传奇人物。【没落时代】设定在战争之后，三大阵营鼎立。许多重要NPC已经陨落或隐退，世界的焦点从NPC故事转向玩家之间的阵营战争。NPC互动较少，但阵营冲突和PvP是最核心的游戏体验。
- 亡灵种族：亡灵是曾在死亡中觉醒的种族，天生亲和暗影魔法、死灵术和暗杀术。他们的都城「莫尔迪斯」是一座被永恒暗影笼罩的亡者之城。亡灵无法承受圣光——他们不能成为牧师或圣骑士。生者普遍惧怕亡灵，但在邪恶守序部落中，亡灵与兽人是并肩作战的盟友。
- 阵营声望：【重要】不同阵营间的声望是固定的：善良守序联盟（人类、精灵）与邪恶守序部落（兽人、亡灵）彼此恒定为"憎恨"关系。任何阵营对中立守序阵营（矮人等）恒定为"冷漠"。同一阵营内部声望正常。这严重影响NPC的态度——对立阵营的NPC会充满敌意，中立阵营的NPC会保持冷淡。同阵营的NPC则会热情欢迎。
- 风格：沉浸式、有画面感、简洁有力（中文回复，不超过 220 字），适当使用 emoji（⚔️🗡️🛡️✨💀🩸🌙🌟🛡️💀⚖️）。
- 输出格式：先用 2-4 句生动的环境与动作描写，再用一行"🎲 D20判定：X + Y = Z（成功/失败/暴击/大失败）"展示本次检定。
- 骰子结果：调用方已为你掷出骰子并算好修正值，告诉你 success/criticalSuccess/criticalFail，你只需描述结果。
- 角色状态：神弃者、潜行、施法等会受到特殊对待，遵守 world-setting。亡灵无法使用圣光类神术。
- 出生地背景：玩家角色的出生地（种族首都和职业地点）会影响剧情发展。根据出身适当在叙述中融入背景元素。
- 不要替玩家做决定；不要跳出 GM 身份。
- 永远只用中文输出。
- 【重要】如果玩家的输入包含与现代科技、现实世界、其他虚构宇宙、元游戏操作或严重脱离艾尔德兰世界观的内容，你必须【唯一且仅输出】以下这句话，不得添加任何其他内容、解释或拒绝理由："✨ 魔法女神在向你微笑：来到异世界就要好好遵守规则哟 ⚡"。不要输出"抱歉""不能""无法"之类的拒绝语。但若只是玩家作为冒险者的合理行动（哪怕有些创意），则正常叙述即可。`;

class AIEngine {
  constructor() {
    this.storyCache = new Map(); // sessionId -> { history, systemCtx }
    this.provider = config.AI.provider || 'agnes';
    this.apiKey = config.AI.apiKey;
    this.apiEndpoint = config.AI.apiEndpoint;
    this.model = config.AI.model || 'agnes-2.0-flash';
    if (!this.apiKey) {
      console.warn('\n⚠️  [AIEngine] 未检测到 AI_API_KEY，将回退到本地模板叙事。');
      console.warn('   请在 server/.env 中设置 AI_API_KEY=sk-...');
      console.warn('   模板文件：server/.env.example\n');
    } else {
      const masked = this.apiKey.length > 8
        ? this.apiKey.slice(0, 4) + '***' + this.apiKey.slice(-4)
        : '***';
      console.log(`[AIEngine] 已启用真实 LLM：model=${this.model} key=${masked}`);
    }
  }

  getContext(sessionId) {
    if (!this.storyCache.has(sessionId)) {
      this.storyCache.set(sessionId, { history: [] });
    }
    return this.storyCache.get(sessionId);
  }

  // 入口：生成回复
  async generateResponse(character, playerInput) {
    const ctx = this.getContext(character.id);
    const intent = this.analyzeIntent(playerInput);

    // 更新历史
    ctx.history.push({ role: 'player', content: playerInput, timestamp: Date.now() });

    let response;
    // 沉浸破坏检测 — 直接拦截，不调用 AI（省 token + 呼应隐藏主线弑神）
    if (intent.type === 'immersion_break') {
      response = this.handleImmersionBreak();
      ctx.history.push({ role: 'system', content: response.narrative, timestamp: Date.now() });
      return response;
    }
    // /roll 命令完全本地处理（确定性强），不浪费 token
    if (intent.type === 'roll') {
      response = this.handleRollCommand(character, playerInput);
    } else {
      // 其他意图：本地做一次 D20 骰子判定 → 交给真实 LLM 包装成叙事
      let check = null;
      const statForIntent = {
        combat: 'strength',
        social: 'charisma',
        explore: 'intelligence',
        stealth: 'agility',
        magic: 'intelligence',
        general: 'charisma',
      }[intent.type];
      if (statForIntent) {
        check = DiceSystem.skillCheck(character, statForIntent, 12);
      }

      try {
        const narrative = await this.callAgnes(character, playerInput, intent, check);
        // 后处理：检测 AI 是否在拒绝/回避（但没有触发关键词拦截），强制替换为魔法女神微笑
        if (this.isAIRefusal(narrative, playerInput)) {
          console.log('[AIEngine] 🔮 AI 尝试拒绝——魔法女神强制介入');
          response = this.handleImmersionBreak();
        } else {
          response = { narrative, type: intent.type, check, aiGenerated: true };
        }
      } catch (err) {
        // 失败兜底：回到旧的模板逻辑
        console.error('[AIEngine] Agnes 调用失败，回退到模板：', err.message);
        response = this.fallbackByIntent(character, playerInput, intent, check);
        response.aiGenerated = false;
        response.error = err.message;
      }
    }

    ctx.history.push({ role: 'system', content: response.narrative, timestamp: Date.now() });
    // 控制历史长度
    if (ctx.history.length > 30) ctx.history.splice(0, ctx.history.length - 30);
    return response;
  }

  // 意图分析
  analyzeIntent(input) {
    const lower = (input || '').toLowerCase();

    // 【优先检测】沉浸破坏 — 与世界观严重不符的内容
    if (this.isImmersionBreak(input)) return { type: 'immersion_break' };

    const combatKeywords = ['攻击', '砍', '刺', '射击', '战斗', '杀', '打', '劈', '斩', '挥', '射', '冲', '突袭', '偷袭', 'attack', 'fight', 'kill', 'strike'];
    const socialKeywords = ['说', '问', '谈判', '说服', '贿赂', '威胁', '乞求', '交谈', '聊天', '打招呼', '询问', 'talk', 'speak', 'ask', 'persuade', 'bribe'];
    const exploreKeywords = ['走', '去', '前往', '移动', '探索', '搜索', '寻找', '进入', '离开', 'go', 'walk', 'move', 'explore', 'search', 'enter', 'leave'];
    const stealthKeywords = ['潜行', '偷', '盗窃', '隐藏', '躲', '悄悄', '暗杀', 'sneak', 'steal', 'hide', 'stealth'];
    const magicKeywords = ['施法', '魔法', '法术', '咒语', '召唤', '火球', '冰霜', '奥术', 'cast', 'spell', 'magic', 'summon', 'fireball'];
    const rollKeywords = ['/roll', '掷骰', '判定'];

    if (input.startsWith('/roll') || rollKeywords.some(k => lower.includes(k))) return { type: 'roll' };
    if (combatKeywords.some(k => lower.includes(k))) return { type: 'combat' };
    if (stealthKeywords.some(k => lower.includes(k))) return { type: 'stealth' };
    if (magicKeywords.some(k => lower.includes(k))) return { type: 'magic' };
    if (socialKeywords.some(k => lower.includes(k))) return { type: 'social' };
    if (exploreKeywords.some(k => lower.includes(k))) return { type: 'explore' };
    return { type: 'general' };
  }

  // 检测沉浸破坏：玩家输入了与奇幻世界观严重不符的内容
  isImmersionBreak(input) {
    const lower = (input || '').toLowerCase();

    // 现代科技 / 现实世界
    const modernTech = [
      '手机', 'iphone', '电脑', '计算机', '互联网', 'wifi', '网络', '上网', '直播',
      '电视', '电视机', '汽车', '开车', '飞机', '坐飞机', '火车', '高铁', '地铁',
      '机器人', '机甲', '高达', '激光枪', '激光炮', '步枪', '手枪', '冲锋枪', '机关枪',
      '核弹', '原子弹', '导弹', '坦克', '战斗机', '轰炸机', '无人机',
      '电话', '打电话', '发短信', '微信', 'qq', '微博', '抖音', 'b站',
      '外卖', '快递', '网购', '淘宝', '京东', '美团',
      '科学', '科学家', '实验室', '显微镜', 'dna', '基因',
      '太空', '宇宙飞船', '外星人', 'ufo', '星球大战',
    ];
    if (modernTech.some(k => lower.includes(k))) return true;

    // 其他虚构宇宙 / 跨作品
    const otherFiction = [
      '霍格沃茨', '哈利波特', '伏地魔', '麻瓜', '魁地奇',
      '复仇者', '钢铁侠', '蜘蛛侠', '灭霸', '雷神', '美国队长',
      '火影', '鸣人', '佐助', '查克拉', '海贼王', '路飞', '死神', '一护',
      '赛亚人', '悟空', '龙珠', '比克', '弗利萨',
      '绝地武士', '光剑', '西斯', '原力',
      '口袋妖怪', '精灵球', '皮卡丘', '宝可梦',
      '我的世界', 'minecraft', '史蒂夫', '苦力怕',
      '原神', '派蒙', '原石', '提瓦特',
    ];
    if (otherFiction.some(k => lower.includes(k))) return true;

    // 元游戏 / 第四面墙
    const metaGame = [
      '存档', '读档', 'save', 'load',
      '作弊码', '修改器', '控制台', 'console', 'cheat', '作弊',
      'gm命令', '管理员', '/op', '/gm',
      '退出游戏', '重新开始', '换服', '换区', '服务器',
      'alt+f4', 'ctrl+z', '撤销',
      '氪金', '充值', 'vip', '首充',
      '你是ai', '你是人工智能', '你是gpt', '你是llm',
      '你是谁', '大模型', '模型', 'prompt', '提示词',
    ];
    if (metaGame.some(k => lower.includes(k))) return true;

    // 脱离角色身份的发言（扮演"玩家本人"而非冒险者）
    const outOfCharacter = [
      '我是玩家', '我是人类', '我来自地球', '我来自现代',
      '这个游戏', '这个程序', '系统提示', 'bug', '卡住了',
      '重启一下', '刷新页面',
    ];
    if (outOfCharacter.some(k => lower.includes(k))) return true;

    return false;
  }

  // 检测 AI 返回了拒绝/回避类回答（但没有被关键词拦截到），强制替换为魔法女神微笑
  isAIRefusal(narrative, originalInput) {
    if (!narrative) return false;
    // AI 常见拒绝模式
    const refusalPatterns = [
      '抱歉', '我无法', '我做不到', '不能这样', '不可以',
      '作为一个AI', '作为AI', '作为一个人工智能', '我是AI',
      '无法满足', '无法进行', '无法继续', '无法回答', '无法响应',
      '请换一个', '请重新', '请再试', '请尝试',
      '这不符合', '这不适合', '这不合适',
      '我不能', '我没办法', '我没办法做',
      '换个话题', '换一个话题',
      '超出范围', '不在范围',
      '不建议', '不允许',
      'please', 'sorry', 'cannot', 'can\'t', 'I cannot',
    ];
    // 如果 AI 回复很短且包含拒绝词，基本就是在拒绝
    if (narrative.length < 100 && refusalPatterns.some(p => narrative.includes(p))) {
      return true;
    }
    // 如果回复以拒绝词开头
    if (refusalPatterns.some(p => narrative.trim().startsWith(p))) {
      return true;
    }
    return false;
  }

  // ===== Agnes API 调用 =====
  async callAgnes(character, playerInput, intent, check) {
    if (!this.apiKey) throw new Error('AI_API_KEY 未配置（在 server/config.js 或环境变量 AI_API_KEY）');

    const region = this.findRegion(character.currentLocation);
    const regionName = region ? region.name : '未知之地';
    const worldState = config.WORLD_STATES[character.worldState]?.name || '未知纪元';
    const race = config.RACES[character.race]?.name || character.race;
    const cls = config.CLASSES[character.class]?.name || character.class;
    const talentNames = (character.talents || []).map(t => this.findTalentName(t)).filter(Boolean).join('、') || '无';
    // 种族天赋
    const racialTraitName = character.racialTrait?.name || '';
    const racialTraitDesc = racialTraitName ? `，种族天赋：${racialTraitName}（${character.racialTrait.desc?.slice(0, 40)}...）` : '';

    const intentName = {
      combat: '战斗', social: '社交/交谈', explore: '探索/移动',
      stealth: '潜行', magic: '施法', general: '通用',
    }[intent.type] || '通用';

    // 出身背景
    let birthContext = '';
    if (character.birthLocation) {
      const bl = character.birthLocation;
      birthContext = `\n- 出身：${bl.capital}·${bl.place} — ${bl.story}`;
    }

    // 阵营
    let factionContext = '';
    if (character.faction) {
      const factionData = config.FACTIONS[character.faction];
      if (factionData) {
        factionContext = `\n- 阵营：${factionData.emoji} ${factionData.name}`;
        // 添加阵营声望
        if (character.factionRep) {
          const repParts = [];
          for (const [fid, val] of Object.entries(character.factionRep)) {
            if (fid !== character.faction) {
              const fData = config.FACTIONS[fid];
              const tier = this.getReputationTier(val);
              repParts.push(`${fData?.emoji || ''}${fData?.name || fid}：${tier}(${val})`);
            }
          }
          if (repParts.length > 0) factionContext += ` | 外交：${repParts.join('、')}`;
        }
      }
    }

    // 声望
    let reputationContext = '';
    if (character.reputation !== undefined) {
      const tier = this.getReputationTier(character.reputation);
      reputationContext = `\n- 本阵营声望：${character.reputation}（${tier}）`;
    }

    // 时代特定NPC信息
    let eraNpcContext = '';
    if (character.worldState === 'golden_age') {
      eraNpcContext = '\n- ⚠️ 当前为【光辉时代】——雷克斯·秘法、晨曦帝王等传奇NPC仍在世，玩家可能遇见他们。请适当在叙述中引入他们。';
    } else if (character.worldState === 'decline_age') {
      eraNpcContext = '\n- ⚠️ 当前为【没落时代】——大多数传奇NPC已陨落。世界焦点是阵营战争与玩家间的对抗，NPC稀少。';
    }

    // 活跃任务上下文
    let questContext = '';
    if (character.activeQuest && character.activeQuest.status === 'active') {
      const q = character.activeQuest;
      if (q.type === 'multi_stage' && q.stages) {
        const currentStageIdx = (q.currentStage || 1) - 1;
        const currentStage = q.stages[currentStageIdx];
        questContext = `\n- 📋 【多阶段任务】名称：「${q.title}」| NPC：${q.npcName}（${q.raceName}）| 当前阶段 ${q.currentStage}/${q.stages.length}：${currentStage?.goal || ''} | 奖励：💰${q.rewardGold || 0}金币+⭐${q.rewardExp || 0}经验`;
        if (currentStage?.needLocation) questContext += ` | 需求地点：${currentStage.needLocation}`;
        if (currentStage?.needTime) questContext += ` | 需求时间：${currentStage.needTime === 'night' ? '夜晚' : currentStage.needTime}`;
        questContext += `\n- ⚠️ 【任务引导指令】玩家正在执行一个多阶段任务。当前阶段是：**${currentStage?.goal}**。${currentStage?.hint || ''}`;
        questContext += '\n- 你必须在叙述中引导玩家朝着完成当前阶段目标的方向前进。如果玩家的行动与当前阶段目标不符，请在叙述末尾适当暗示当前应做的事情。';
        if (currentStage?.needTime === 'night') questContext += '\n- 如果当前是白天，提醒玩家在墓园可以用 /wait 等待夜晚。';
        if (currentStage?.needLocation) questContext += `\n- 玩家需要前往「${currentStage.needLocation}」区域。若玩家不在该区域，请在叙述中暗示他该去哪里。`;
      } else {
        questContext = `\n- 📋 【活跃任务】名称：「${q.title}」| NPC委托人：${q.npcName}（${q.raceName}）| 目标：${q.objective} | 奖励：💰${q.rewardGold || 0}金币+⭐${q.rewardExp || 0}经验 | 提示：${q.completeHint} | 难度：${q.difficulty}/6`;
        questContext += '\n- ⚠️ 【重要指令】你必须在叙述中引导玩家朝着完成任务目标的方向前进。若玩家的行动与任务目标无关，请适当在叙述末尾添加一句与任务相关的暗示或推进（如NPC催促、环境提示等），帮助玩家聚焦在任务上。';
      }
    }

    // 时间上下文
    const worldId = character.worldId || 'default';
    const timeInfo = timeSystem.formatTime(worldId);
    let timeContext = `\n- 🕐 当前时间：${timeInfo.full} | 时段：${timeInfo.periodName}`;
    if (timeInfo.isNight) {
      timeContext += '（夜晚——黑暗中的生物更加活跃，视野受限，但也更适合潜行和暗影法术）';
    } else {
      timeContext += '（白天——视野清晰，NPC活跃，适合探索和交易）';
    }

    let checkLine = '';
    if (check) {
      const tag = check.criticalSuccess ? '（大成功）'
        : check.criticalFail ? '（大失败）'
        : check.success ? '（成功）' : '（失败）';
      checkLine = `\n- 本次D20骰子结果：${check.roll} + ${check.modifier} = ${check.total} ${tag}`;
    }

    const userPrompt =
`【当前场景】
- 角色：${character.name}（${race}·${cls}，天赋：${talentNames}${racialTraitDesc}，等级 ${character.level}）${birthContext}${factionContext}${reputationContext}${eraNpcContext}${timeContext}${questContext}
- 位置：${regionName}（${region ? region.desc : ''}）
- 纪元：${worldState}
- HP ${character.currentHp}/${character.maxHp} | MP ${character.currentMp}/${character.maxMp}
- 意图分类：${intentName}${checkLine}

【玩家行动】${playerInput}

请以 GM 视角叙述这次行动的结果，按要求输出。`;

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ];

    const url = this.apiEndpoint || 'https://apihub.agnes-ai.com/v1/chat/completions';
    const body = {
      model: this.model,
      messages,
      temperature: 0.85,
      max_tokens: 380,
      stream: false,
    };

    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 25000);
    const t0 = Date.now();
    const promptChars = (SYSTEM_PROMPT + userPrompt).length;
    console.log(`\n[Agnes] ▶ 请求开始 model=${this.model} prompt≈${promptChars}字 intent=${intent.type} char=${character.name}`);
    let resp;
    try {
      resp = await fetchImpl(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(body),
        signal: ctrl.signal,
      });
    } finally {
      clearTimeout(timer);
    }
    const tHttp = Date.now() - t0;

    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      console.log(`[Agnes] ✖ HTTP ${resp.status} 用时 ${tHttp}ms  body=${text.slice(0, 160)}`);
      throw new Error(`Agnes HTTP ${resp.status}: ${text.slice(0, 200)}`);
    }
    const data = await resp.json();
    const content = data?.choices?.[0]?.message?.content?.trim();
    const usage = data?.usage || {};
    const tTotal = Date.now() - t0;
    console.log(`[Agnes] ✔ 成功 用时 ${tTotal}ms (HTTP ${tHttp}ms) tokens prompt=${usage.prompt_tokens ?? '?'} completion=${usage.completion_tokens ?? '?'} total=${usage.total_tokens ?? '?'} 回复${content?.length ?? 0}字`);
    console.log(`[Agnes] ↳ 回复预览：${(content || '').slice(0, 80).replace(/\n/g, ' ')}…`);
    if (!content) throw new Error('Agnes 返回为空');
    return content;
  }

  findTalentName(talentId) {
    if (!talentId) return '无';
    for (const arr of Object.values(config.TALENTS || {})) {
      const t = arr.find(x => x.id === talentId);
      if (t) return t.name;
    }
    return talentId;
  }

  getReputationTier(value) {
    const tiers = config.REPUTATION_TIERS || [];
    let current = '未知';
    for (const t of tiers) {
      if (value >= t.value) { current = t.name; break; }
    }
    // 如果低于所有阈值，取最后一个
    if (current === '未知' && tiers.length > 0) {
      current = tiers[tiers.length - 1].name;
    }
    return current;
  }

  // ===== 兜底（无 API key 或网络失败时使用） =====
  fallbackByIntent(character, playerInput, intent, check) {
    switch (intent.type) {
      case 'immersion_break': return this.handleImmersionBreak();
      case 'combat': return this.handleCombatIntent(character, playerInput, intent, check);
      case 'social': return this.handleSocialIntent(character, playerInput, intent, check);
      case 'explore': return this.handleExploreIntent(character, playerInput, intent, check);
      case 'stealth': return this.handleStealthIntent(character, playerInput, intent, check);
      case 'magic': return this.handleMagicIntent(character, playerInput, intent, check);
      case 'roll': return this.handleRollCommand(character, playerInput);
      default: return this.handleGeneralIntent(character, playerInput, intent);
    }
  }

  // 沉浸破坏提醒 — 魔法女神降临，呼应隐藏主线「弑神」
  handleImmersionBreak() {
    const narrative = '✨ 魔法女神在向你微笑：来到异世界就要好好遵守规则哟 ⚡';
    console.log('[AIEngine] 🔮 检测到沉浸破坏输入，魔法女神已介入提醒');
    return { narrative, type: 'immersion_break', check: null, aiGenerated: false };
  }

  handleCombatIntent(character, input, intent, check) {
    if (!check) check = DiceSystem.skillCheck(character, 'strength', 12);
    const weapon = character.equipment?.weapon?.name || '拳头';
    const isForsaken = character.talents?.includes('forsaken');
    let narrative;
    if (check.criticalSuccess) narrative = `⚔️ 【暴击！】你挥舞${weapon}，一击命中要害！敌人发出痛苦的嚎叫。\n\n🎲 D20判定：${check.roll} + ${check.modifier} = ${check.total}（天然20，大成功！）`;
    else if (check.success) narrative = `⚔️ 你挥动${weapon}，准确地击中了目标！敌人踉跄后退了几步。\n\n🎲 D20判定：${check.roll} + ${check.modifier} = ${check.total}（成功）`;
    else if (check.criticalFail) narrative = `💥 你挥动${weapon}，但脚下一滑，攻击落空了！敌人趁机反击。\n\n🎲 D20判定：${check.roll} + ${check.modifier} = ${check.total}（天然1，大失败！）`;
    else narrative = `⚡ 你挥动${weapon}，但动作稍慢，敌人堪堪避开了攻击。\n\n🎲 D20判定：${check.roll} + ${check.modifier} = ${check.total}（失败）`;
    if (isForsaken && character.currentLocation === 'temple') narrative += '\n\n💀 神弃者的存在让神殿中的圣光微弱地闪烁了一下。';
    return { narrative, type: 'combat', check, combatTriggered: true };
  }

  handleSocialIntent(character, input, intent, check) {
    if (!check) check = DiceSystem.skillCheck(character, 'charisma', 10);
    let narrative = check.success
      ? `💬 你的话语打动了对方。对方微微点头，愿意继续听你说下去。\n\n🎲 D20判定：${check.roll} + ${check.modifier} = ${check.total}（成功）`
      : `💬 对方皱了皱眉，似乎对你的话不太感兴趣。\n\n🎲 D20判定：${check.roll} + ${check.modifier} = ${check.total}（失败）`;
    return { narrative, type: 'social', check };
  }

  handleExploreIntent(character, input, intent, check) {
    if (!check) check = DiceSystem.skillCheck(character, 'intelligence', 10);
    const regionName = this.extractRegionName(input);
    let narrative = regionName
      ? `🗺️ 你踏上了前往【${regionName}】的道路。`
      : (check.success
          ? '🗺️ 你环顾四周，发现了一些新的路径和线索。'
          : '🗺️ 周围的环境看起来都差不多，你需要更多信息来决定方向。');
    narrative += `\n\n🎲 D20判定：${check.roll} + ${check.modifier} = ${check.total}`;
    return { narrative, type: 'explore', check, destination: regionName };
  }

  handleStealthIntent(character, input, intent, check) {
    if (!check) check = DiceSystem.skillCheck(character, 'agility', 12);
    let narrative;
    if (check.success) narrative = `🕵️ 你轻盈地移动着，几乎不发出任何声响。\n\n🎲 D20判定：${check.roll} + ${check.modifier} = ${check.total}（成功）`;
    else if (check.criticalFail) narrative = `📢 你踢到地上的罐子，「哐当」声响彻四周！\n\n🎲 D20判定：${check.roll} + ${check.modifier} = ${check.total}（大失败）`;
    else narrative = `🕵️ 你试图悄悄移动，但有人似乎察觉到了什么……\n\n🎲 D20判定：${check.roll} + ${check.modifier} = ${check.total}（失败）`;
    return { narrative, type: 'stealth', check };
  }

  handleMagicIntent(character, input, intent, check) {
    const spellCasters = ['mage', 'cleric', 'druid', 'shaman'];
    if (!spellCasters.includes(character.class)) {
      return { narrative: '✨ 你尝试调动魔力，但作为非施法者，魔力的流动并不顺畅。', type: 'magic', check: { success: false } };
    }
    if (!check) check = DiceSystem.skillCheck(character, 'intelligence', 10);
    const spellName = this.extractSpellName(input);
    const narrative = check.success
      ? `✨ ${spellName || '法术'}按你的意愿成形并释放。\n\n🎲 D20判定：${check.roll} + ${check.modifier} = ${check.total}（成功）`
      : `✨ 魔力在关键一刻散开，${spellName || '法术'}只产生了一些无害的火花。\n\n🎲 D20判定：${check.roll} + ${check.modifier} = ${check.total}（失败）`;
    return { narrative, type: 'magic', check };
  }

  handleRollCommand(character, input) {
    const parts = input.split(' ');
    let difficulty = 10;
    if (parts.length > 1) {
      const parsed = parseInt(parts[1]);
      if (!isNaN(parsed)) difficulty = parsed;
    }
    const check = DiceSystem.d20Check(character, 0, difficulty);
    let narrative = `🎲 你掷出了骰子……\n\n📊 结果：D20 = ${check.roll} | 修正 = ${check.modifier} | 总计 = ${check.total}`;
    if (check.rerolled) narrative += ` | （幸运女神眷顾：原掷${check.originalRoll}）`;
    narrative += `\n${check.criticalSuccess ? '🌟 天然20！' : ''}${check.criticalFail ? '💀 天然1……' : ''}${check.success ? '✅ 成功' : '❌ 失败'}`;
    return { narrative, type: 'roll', check };
  }

  handleGeneralIntent(character, input, intent) {
    const regionName = this.findRegion(character.currentLocation)?.name || '当前位置';
    const narrative = `在${regionName}，你${input}。艾尔德兰的风轻轻吹过，仿佛在回应你的行为。`;
    return { narrative, type: 'general' };
  }

  extractRegionName(input) {
    if (!input) return null;
    for (const r of config.MAP_REGIONS) if (input.includes(r.name)) return r.name;
    return null;
  }
  extractSpellName(input) {
    const spells = ['火球术', '冰霜术', '奥术飞弹', '魔法护盾', '治疗术', '圣光', '驱散', '祝福', '泥沼术', '风刃术', '油腻术', '蛛网术'];
    for (const s of spells) if (input.includes(s)) return s;
    return null;
  }
  findRegion(regionId) {
    if (!regionId) return null;
    return config.MAP_REGIONS.find(r => r.id === regionId || r.name === regionId);
  }

  // 场景描述（被动），暂时仍用模板，避免无谓调用 LLM
  generateSceneDescription(character) {
    const region = this.findRegion(character.currentLocation);
    const regionName = region ? region.name : '未知之地';
    const worldState = config.WORLD_STATES[character.worldState];
    let narrative = `📍 你当前位于：**${regionName}**\n\n`;
    if (region) narrative += `${region.desc}\n\n`;
    narrative += `🌍 世界状态：**${worldState ? worldState.name : '未知'}**\n`;
    if (character.talents?.includes('forsaken')) narrative += '💀 身份：**神弃者** — 被神明遗弃之人\n';

    // 添加活跃任务信息
    if (character.activeQuest && character.activeQuest.status === 'active') {
      const q = character.activeQuest;
      const difficultyLabel = q.difficulty <= 2 ? '🟢 简单' : q.difficulty <= 4 ? '🟡 中等' : '🔴 困难';
      narrative += `\n---\n📋 **当前任务：「${q.title}」** ${difficultyLabel}\n`;
      narrative += `👤 委托人：**${q.npcName}**（${q.raceName}）\n`;
      narrative += `🎯 目标：${q.objective}\n`;
      narrative += `💰 奖励：${q.rewardGold || 0}金币 + ⭐${q.rewardExp || 0}经验${q.rewardItem ? ' + 🎁' + q.rewardItem : ''}\n`;
      narrative += `💡 ${q.completeHint}\n`;
    }

    narrative += '\n你可以输入你的行动——探索、战斗、交谈、施法，一切由你决定。输入 /roll 进行骰子判定。';
    return narrative;
  }

  generateCombatStart(character, enemy) {
    const enemyData = config.ENEMIES[enemy] || { name: enemy, desc: '一个危险的敌人' };
    const isForsaken = character.talents?.includes('forsaken');
    let narrative = `⚔️ **战斗开始！**\n\n你遭遇了 **${enemyData.name}**！\n${enemyData.desc}\n\n📊 敌人数据：HP ${enemyData.hp} | ATK ${enemyData.atk} | DEF ${enemyData.def}\n\n`;
    if (isForsaken) narrative += '💀 没有神明会为你祝福。你只能依靠自己。\n\n';
    narrative += '你可以选择：**攻击** / **防御** / **使用技能** / **使用道具** / **逃跑**';
    return { narrative, enemy: enemyData };
  }

  getRegionEntryDesc(regionName, character) {
    const region = this.findRegion(regionName);
    if (!region) return '你来到了一个陌生的地方。';
    let desc = region.desc;
    if (region.id === 'temple' && character.talents?.includes('forsaken')) {
      desc += '\n\n⚡ 刚一踏入神殿，守卫们的目光就锁定在了你身上。';
    }
    return desc;
  }
}

module.exports = new AIEngine();
