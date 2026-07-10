import React, { useState, useEffect, useRef } from 'react';
import api from '../api.js';

export default function SocialPanel({ character, token, onBack }) {
  const [tab, setTab] = useState('friends');
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [stories, setStories] = useState([]);
  const [recruits, setRecruits] = useState([]);
  const [notification, setNotification] = useState(null);
  const chatEndRef = useRef(null);

  const showNotify = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  useEffect(() => {
    loadFriends();
    loadChat();
    loadStories();
    loadRecruits();
    const interval = setInterval(() => {
      if (tab === 'chat') loadChat();
      if (tab === 'friends') loadFriends();
    }, 5000);
    return () => clearInterval(interval);
  }, [tab]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const loadFriends = async () => {
    try {
      const result = await api.getFriends(token);
      setFriends(result.friends);
      setRequests(result.pendingRequests);
    } catch (e) { /* ignore */ }
  };

  const loadChat = async () => {
    try {
      const worldId = character.worldId;
      if (!worldId) return;
      const result = await api.getChat(worldId);
      setChatMessages(result.messages || []);
    } catch (e) { /* ignore */ }
  };

  const loadStories = async () => {
    try {
      const result = await api.getStories();
      setStories(result.stories || []);
    } catch (e) { /* ignore */ }
  };

  const loadRecruits = async () => {
    try {
      const result = await api.getRecruits();
      setRecruits(result.recruits || []);
    } catch (e) { /* ignore */ }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    try {
      const result = await api.searchPlayer(searchQuery);
      setSearchResults(result.players || []);
    } catch (e) {
      showNotify('搜索失败');
    }
  };

  const handleAddFriend = async (targetId) => {
    try {
      const result = await api.sendFriendReq(token, targetId);
      showNotify(result.message);
    } catch (e) { showNotify('发送失败'); }
  };

  const handleAccept = async (fromId) => {
    try {
      await api.acceptFriendReq(token, fromId);
      loadFriends();
      showNotify('已添加好友！');
    } catch (e) { showNotify('操作失败'); }
  };

  const handleReject = async (fromId) => {
    try {
      await api.rejectFriendReq(token, fromId);
      loadFriends();
    } catch (e) { showNotify('操作失败'); }
  };

  const handleSendChat = async () => {
    if (!chatInput.trim()) return;
    try {
      await api.sendChat(token, chatInput);
      setChatInput('');
      loadChat();
    } catch (e) { showNotify('发送失败'); }
  };

  return (
    <div className="social-panel">
      {notification && <div className="notification">{notification}</div>}

      <header className="social-header">
        <button className="btn-back" onClick={onBack}>← 返回游戏</button>
        <h2>🏛️ 冒险者酒馆</h2>
        <div className="social-tabs">
          <button className={`tab-btn ${tab === 'friends' ? 'active' : ''}`}
            onClick={() => setTab('friends')}>👥 好友{requests.length > 0 ? ` (${requests.length})` : ''}</button>
          <button className={`tab-btn ${tab === 'chat' ? 'active' : ''}`}
            onClick={() => setTab('chat')}>💬 世界频道</button>
          <button className={`tab-btn ${tab === 'stories' ? 'active' : ''}`}
            onClick={() => setTab('stories')}>📜 故事墙</button>
          <button className={`tab-btn ${tab === 'recruits' ? 'active' : ''}`}
            onClick={() => setTab('recruits')}>📋 招募板</button>
        </div>
      </header>

      <div className="social-content">
        {/* 好友标签 */}
        {tab === 'friends' && (
          <div className="tab-content">
            <div className="search-bar">
              <input type="text" placeholder="搜索玩家ID或名称..."
                value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()} />
              <button className="btn-small" onClick={handleSearch}>搜索</button>
            </div>

            {searchResults.length > 0 && (
              <div className="search-results">
                <h4>搜索结果：</h4>
                {searchResults.map(p => (
                  <div key={p.id} className="player-card">
                    <span>{p.isOnline ? '🟢' : '⚫'} {p.name}</span>
                    <span className="player-class">
                      {p.class} Lv.{p.level}
                      {p.talent === 'forsaken' && ' 💀'}
                    </span>
                    <button className="btn-small" onClick={() => handleAddFriend(p.id)}>添加好友</button>
                  </div>
                ))}
              </div>
            )}

            {requests.length > 0 && (
              <div className="friend-requests">
                <h4>🔔 好友请求：</h4>
                {requests.map(req => (
                  <div key={req.from} className="request-card">
                    <span>{req.fromName}</span>
                    <div className="request-actions">
                      <button className="btn-accept" onClick={() => handleAccept(req.from)}>✅</button>
                      <button className="btn-reject" onClick={() => handleReject(req.from)}>❌</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="friend-list">
              <h4>👥 好友列表 ({friends.length})：</h4>
              {friends.length === 0 && <p className="empty-text">还没有好友。去世界频道认识新朋友吧！</p>}
              {friends.map(f => (
                <div key={f.id} className="friend-card">
                  <span className={`online-dot ${f.online ? 'online' : 'offline'}`} />
                  <span className="friend-name">
                    {f.name}
                    {f.talent === 'forsaken' && ' 💀'}
                  </span>
                  <span className="friend-info">{f.class} · Lv.{f.level}</span>
                  <span className="friend-status">{f.online ? '在线' : '离线'}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 世界聊天 */}
        {tab === 'chat' && (
          <div className="tab-content">
            <div className="chat-box">
              {chatMessages.map((msg, i) => (
                <div key={i} className="chat-msg">
                  <span className="chat-user">
                    {msg.talent === 'forsaken' && '💀'}
                    {msg.userName}
                  </span>
                  <span className="chat-text">{msg.content}</span>
                  <span className="chat-time">{new Date(msg.time).toLocaleTimeString()}</span>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <div className="chat-input-row">
              <input type="text" placeholder="输入消息..."
                value={chatInput} onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSendChat()} />
              <button onClick={handleSendChat}>发送</button>
            </div>
          </div>
        )}

        {/* 故事墙 */}
        {tab === 'stories' && (
          <div className="tab-content">
            <h4>📜 冒险故事</h4>
            {stories.length === 0 && <p className="empty-text">还没有人分享故事。完成冒险后回来分享吧！</p>}
            {stories.map(s => (
              <div key={s.id} className="story-card">
                <div className="story-header">
                  <strong>{s.userName}</strong> · {s.title}
                  <span className="story-time">{new Date(s.time).toLocaleString()}</span>
                </div>
                <p className="story-content">{s.content.slice(0, 200)}{s.content.length > 200 && '...'}</p>
                <div className="story-footer">❤️ {s.likes} 赞</div>
              </div>
            ))}
          </div>
        )}

        {/* 招募板 */}
        {tab === 'recruits' && (
          <div className="tab-content">
            <h4>📋 组队招募</h4>
            {recruits.length === 0 && <p className="empty-text">暂无招募信息。</p>}
            {recruits.map(r => (
              <div key={r.id} className="recruit-card">
                <div className="recruit-header">
                  <strong>{r.userName}</strong> 招募：{r.title}
                  <span className="recruit-status">{r.status === 'open' ? '🟢 招募中' : '🔴 已满'}</span>
                </div>
                <p>{r.description}</p>
                {r.roles?.length > 0 && (
                  <div className="recruit-roles">
                    需求：{r.roles.map(role => <span key={role} className="skill-tag">{role}</span>)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
