// API 客户端
const API_BASE = '/api';

async function request(url, options = {}) {
  const res = await fetch(API_BASE + url, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: '请求失败' }));
    throw new Error(err.error || '未知错误');
  }
  return res.json();
}

export const api = {
  // 配置
  getConfig: () => request('/config'),

  // 角色
  createCharacter: (data) => request('/character/create', { method: 'POST', body: JSON.stringify(data) }),
  getCharacter: (token) => request(`/character?token=${token}`),
  allocatePoints: (token, points) => request('/character/allocate', { method: 'POST', body: JSON.stringify({ token, ...points }) }),

  // 游戏
  getScene: (token) => request(`/game/scene?token=${token}`),
  doAction: (token, action) => request('/game/action', { method: 'POST', body: JSON.stringify({ token, action }) }),
  rollDice: (token, data) => request('/game/roll', { method: 'POST', body: JSON.stringify({ token, ...data }) }),
  moveTo: (token, regionId) => request('/game/move', { method: 'POST', body: JSON.stringify({ token, regionId }) }),

  // 战斗
  startCombat: (token, enemyId) => request('/game/combat/start', { method: 'POST', body: JSON.stringify({ token, enemyId }) }),
  combatAction: (token, action, payload) => request('/game/combat/action', { method: 'POST', body: JSON.stringify({ token, action, payload }) }),

  // 世界
  getWorlds: (state) => request(`/worlds${state ? `?state=${state}` : ''}`),
  getHotWorld: () => request('/worlds/hot'),
  getWorld: (id) => request(`/worlds/${id}`),
  createPrivateWorld: (token, data) => request('/worlds/private', { method: 'POST', body: JSON.stringify({ token, ...data }) }),

  // 社交
  searchPlayer: (q) => request(`/social/search?q=${encodeURIComponent(q)}`),
  getFriends: (token) => request(`/social/friends?token=${token}`),
  sendFriendReq: (token, targetId) => request('/social/friend/request', { method: 'POST', body: JSON.stringify({ token, targetId }) }),
  acceptFriendReq: (token, fromId) => request('/social/friend/accept', { method: 'POST', body: JSON.stringify({ token, fromId }) }),
  rejectFriendReq: (token, fromId) => request('/social/friend/reject', { method: 'POST', body: JSON.stringify({ token, fromId }) }),
  sendChat: (token, content) => request('/social/chat', { method: 'POST', body: JSON.stringify({ token, content }) }),
  getChat: (worldId) => request(`/social/chat/${worldId}`),
  getStories: () => request('/social/stories'),
  publishStory: (token, title, content) => request('/social/story', { method: 'POST', body: JSON.stringify({ token, title, content }) }),
  getRecruits: () => request('/social/recruits'),
  publishRecruit: (token, title, description, roles) => request('/social/recruit', { method: 'POST', body: JSON.stringify({ token, title, description, roles }) }),
};

export default api;
