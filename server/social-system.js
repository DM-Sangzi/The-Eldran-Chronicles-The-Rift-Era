// 社交系统 - 好友、聊天、广场
const crypto = require('crypto');
const uuidv4 = () => crypto.randomUUID();

class SocialSystem {
  constructor() {
    this.friendships = new Map();   // userId -> Set of friendIds
    this.friendRequests = new Map(); // userId -> [{ from, to, status, time }]
    this.playerProfiles = new Map(); // userId -> { id, name, level, class, race, online }
    this.worldChat = new Map();     // worldId -> [{ id, userId, name, content, time }]
    this.storyWall = [];            // 故事墙
    this.recruitBoard = [];         // 招募板
  }

  // 注册/更新玩家资料
  registerPlayer(player) {
    this.playerProfiles.set(player.id, {
      id: player.id,
      name: player.name,
      level: player.level || 1,
      class: player.class,
      race: player.race,
      talent: player.talent,
      worldId: player.worldId,
      online: true,
      lastSeen: Date.now(),
    });
    if (!this.friendships.has(player.id)) {
      this.friendships.set(player.id, new Set());
    }
    if (!this.friendRequests.has(player.id)) {
      this.friendRequests.set(player.id, []);
    }
  }

  // 获取玩家资料
  getProfile(userId) {
    return this.playerProfiles.get(userId);
  }

  // 通过ID搜索玩家
  searchPlayer(query) {
    const results = [];
    for (const [id, profile] of this.playerProfiles) {
      if (profile.name?.includes(query) || id.includes(query)) {
        results.push({
          ...profile,
          isOnline: profile.online,
          friendshipStatus: this.getFriendshipStatus ? null : 'none',
        });
      }
    }
    return results;
  }

  // 发送好友请求
  sendFriendRequest(fromId, toId) {
    if (!this.playerProfiles.has(toId)) {
      return { success: false, message: '玩家不存在' };
    }
    if (fromId === toId) {
      return { success: false, message: '不能添加自己为好友' };
    }
    if (this.friendships.get(fromId)?.has(toId)) {
      return { success: false, message: '已经是好友了' };
    }

    const requests = this.friendRequests.get(toId) || [];
    const existing = requests.find(r => r.from === fromId && r.status === 'pending');
    if (existing) {
      return { success: false, message: '已发送过好友请求' };
    }

    requests.push({
      from: fromId,
      fromName: this.playerProfiles.get(fromId)?.name || '未知',
      status: 'pending',
      time: Date.now(),
    });
    this.friendRequests.set(toId, requests);
    return { success: true, message: '好友请求已发送' };
  }

  // 接受好友请求
  acceptFriendRequest(userId, fromId) {
    const requests = this.friendRequests.get(userId) || [];
    const req = requests.find(r => r.from === fromId && r.status === 'pending');
    if (!req) return { success: false, message: '没有该好友请求' };

    req.status = 'accepted';
    this.friendships.get(userId)?.add(fromId);
    this.friendships.get(fromId)?.add(userId);
    return { success: true, message: '已添加为好友' };
  }

  // 拒绝好友请求
  rejectFriendRequest(userId, fromId) {
    const requests = this.friendRequests.get(userId) || [];
    const req = requests.find(r => r.from === fromId && r.status === 'pending');
    if (!req) return { success: false, message: '没有该好友请求' };
    req.status = 'rejected';
    return { success: true, message: '已拒绝好友请求' };
  }

  // 删除好友
  removeFriend(userId, friendId) {
    this.friendships.get(userId)?.delete(friendId);
    this.friendships.get(friendId)?.delete(userId);
    return { success: true, message: '已删除好友' };
  }

  // 获取好友列表
  getFriendList(userId) {
    const friends = this.friendships.get(userId) || new Set();
    const result = [];
    for (const friendId of friends) {
      const profile = this.playerProfiles.get(friendId);
      if (profile) {
        result.push({
          ...profile,
          isOnline: profile.online,
        });
      }
    }
    return result;
  }

  // 获取好友请求列表
  getPendingRequests(userId) {
    const requests = this.friendRequests.get(userId) || [];
    return requests.filter(r => r.status === 'pending');
  }

  // 世界聊天 - 发送消息
  sendWorldMessage(worldId, userId, content) {
    if (!this.worldChat.has(worldId)) {
      this.worldChat.set(worldId, []);
    }
    const profile = this.playerProfiles.get(userId);
    const msg = {
      id: uuidv4(),
      userId,
      userName: profile?.name || '未知',
      userClass: profile?.class,
      talent: profile?.talent,
      content: content.slice(0, 200), // 限制200字
      time: Date.now(),
    };
    this.worldChat.get(worldId).push(msg);
    // 保留最近100条
    if (this.worldChat.get(worldId).length > 100) {
      this.worldChat.get(worldId).shift();
    }
    return msg;
  }

  // 获取世界聊天记录
  getWorldMessages(worldId, limit = 50) {
    const msgs = this.worldChat.get(worldId) || [];
    return msgs.slice(-limit);
  }

  // 发布故事
  publishStory(userId, title, content) {
    const profile = this.playerProfiles.get(userId);
    const story = {
      id: uuidv4(),
      userId,
      userName: profile?.name || '未知',
      title,
      content,
      likes: 0,
      comments: [],
      time: Date.now(),
    };
    this.storyWall.unshift(story);
    if (this.storyWall.length > 200) this.storyWall.pop();
    return story;
  }

  // 获取故事墙
  getStoryWall(page = 1, limit = 20) {
    const start = (page - 1) * limit;
    return this.storyWall.slice(start, start + limit);
  }

  // 点赞故事
  likeStory(storyId) {
    const story = this.storyWall.find(s => s.id === storyId);
    if (story) story.likes++;
    return story;
  }

  // 发布招募
  publishRecruit(userId, title, description, roles = []) {
    const profile = this.playerProfiles.get(userId);
    const recruit = {
      id: uuidv4(),
      userId,
      userName: profile?.name || '未知',
      title,
      description,
      roles,
      applicants: [],
      status: 'open',
      time: Date.now(),
    };
    this.recruitBoard.unshift(recruit);
    if (this.recruitBoard.length > 100) this.recruitBoard.pop();
    return recruit;
  }

  // 获取招募板
  getRecruitBoard(page = 1, limit = 20) {
    const start = (page - 1) * limit;
    return this.recruitBoard
      .filter(r => r.status === 'open')
      .slice(start, start + limit);
  }

  // 更新在线状态
  setOnlineStatus(userId, online) {
    const profile = this.playerProfiles.get(userId);
    if (profile) {
      profile.online = online;
      profile.lastSeen = online ? Date.now() : profile.lastSeen;
    }
  }
}

module.exports = new SocialSystem();
