// 多世界联机系统
const config = require('./config');

class WorldSystem {
  constructor() {
    this.worlds = new Map();
    this.playerWorldMap = new Map(); // playerId -> worldId
    this.initDefaultWorlds();
  }

  // 初始化默认世界
  initDefaultWorlds() {
    // 光辉时代世界
    this.createWorld('golden_age', '光辉时代-主世界', 'public');
    this.createWorld('rift_age', '裂隙时代-主世界', 'public');
  }

  // 创建世界
  createWorld(worldState, name, type = 'public', creatorId = null, tags = []) {
    const id = `world_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const world = {
      id,
      name,
      worldState,
      type, // 'public' | 'private' | 'invite'
      creatorId,
      tags,
      players: new Set(),
      playerCount: 0,
      history: [],
      createdAt: Date.now(),
      active: true,
    };
    this.worlds.set(id, world);
    return world;
  }

  // 获取所有公共世界
  getPublicWorlds(worldState = null) {
    const result = [];
    for (const [id, world] of this.worlds) {
      if (world.type === 'public' && world.active) {
        if (worldState && world.worldState !== worldState) continue;
        result.push({
          id: world.id,
          name: world.name,
          worldState: world.worldState,
          worldStateName: config.WORLD_STATES[world.worldState]?.name || world.worldState,
          playerCount: world.players.size,
          tags: world.tags,
          createdAt: world.createdAt,
        });
      }
    }
    // 按人数降序
    result.sort((a, b) => b.playerCount - a.playerCount);
    return result;
  }

  // 获取热门世界（所有类型中人数最多的）
  getHotWorld() {
    let hottest = null;
    let maxPlayers = -1;
    for (const [id, world] of this.worlds) {
      if (world.type === 'public' && world.active && world.players.size > maxPlayers) {
        hottest = world;
        maxPlayers = world.players.size;
      }
    }
    return hottest;
  }

  // 自动匹配世界
  autoMatchWorld(worldState) {
    const worlds = this.getPublicWorlds(worldState);
    if (worlds.length > 0) {
      // 匹配人数最多的世界
      return this.worlds.get(worlds[0].id);
    }
    // 没有匹配的世界，创建新的
    const stateName = config.WORLD_STATES[worldState]?.name || worldState;
    return this.createWorld(worldState, `${stateName}-${worlds.length + 1}`, 'public');
  }

  // 玩家加入世界
  joinWorld(playerId, worldId) {
    const world = this.worlds.get(worldId);
    if (!world) throw new Error('世界不存在');
    if (!world.active) throw new Error('该世界已关闭');

    // 从旧世界移除
    this.leaveWorld(playerId);

    world.players.add(playerId);
    world.playerCount = world.players.size;
    this.playerWorldMap.set(playerId, worldId);

    world.history.push({
      type: 'player_join',
      playerId,
      timestamp: Date.now(),
    });

    return world;
  }

  // 玩家离开世界
  leaveWorld(playerId) {
    const currentWorldId = this.playerWorldMap.get(playerId);
    if (!currentWorldId) return;

    const world = this.worlds.get(currentWorldId);
    if (world) {
      world.players.delete(playerId);
      world.playerCount = world.players.size;
      world.history.push({
        type: 'player_leave',
        playerId,
        timestamp: Date.now(),
      });
    }
    this.playerWorldMap.delete(playerId);
  }

  // 获取玩家所在世界
  getPlayerWorld(playerId) {
    const worldId = this.playerWorldMap.get(playerId);
    if (!worldId) return null;
    return this.worlds.get(worldId);
  }

  // 获取世界中所有玩家
  getWorldPlayers(worldId) {
    const world = this.worlds.get(worldId);
    if (!world) return [];
    return Array.from(world.players);
  }

  // 添加世界历史事件
  addWorldEvent(worldId, event) {
    const world = this.worlds.get(worldId);
    if (!world) return;
    world.history.push({
      ...event,
      timestamp: Date.now(),
    });
  }

  // 创建私人世界
  createPrivateWorld(creatorId, worldState, name, tags = []) {
    const world = this.createWorld(worldState, name, 'private', creatorId, tags);
    return world;
  }

  // 获取世界信息（公开字段）
  getWorldInfo(worldId) {
    const world = this.worlds.get(worldId);
    if (!world) return null;
    return {
      id: world.id,
      name: world.name,
      worldState: world.worldState,
      worldStateName: config.WORLD_STATES[world.worldState]?.name,
      type: world.type,
      playerCount: world.players.size,
      tags: world.tags,
      history: world.history.slice(-20), // 最近20条历史
      createdAt: world.createdAt,
    };
  }
}

module.exports = new WorldSystem();
