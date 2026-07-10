import React, { useState, useEffect, useCallback } from 'react';
import api from './api.js';
import CharacterCreation from './components/CharacterCreation.jsx';
import GameScreen from './components/GameScreen.jsx';
import SocialPanel from './components/SocialPanel.jsx';
import WorldSelect from './components/WorldSelect.jsx';

export default function App() {
  const [screen, setScreen] = useState('title'); // title | create | worldSelect | game | social
  const [config, setConfig] = useState(null);
  const [character, setCharacter] = useState(null);
  const [token, setToken] = useState(null);
  const [world, setWorld] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.getConfig().then(setConfig).catch(console.error);
  }, []);

  const handleCreateCharacter = useCallback(async (data) => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.createCharacter(data);
      setCharacter(result.character);
      setToken(result.token);
      setWorld(result.world);
      setScreen('game');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRefreshCharacter = useCallback(async () => {
    if (!token) return;
    try {
      const result = await api.getCharacter(token);
      setCharacter(result.character);
    } catch (err) {
      console.error(err);
    }
  }, [token]);

  const handleBackToTitle = useCallback(() => {
    setCharacter(null);
    setToken(null);
    setWorld(null);
    setScreen('title');
  }, []);

  if (!config) {
    return (
      <div className="app loading-screen">
        <div className="loading-spinner" />
        <h2>艾尔德兰编年史：裂隙纪元</h2>
        <p>正在初始化世界……</p>
      </div>
    );
  }

  return (
    <div className="app">
      {screen === 'title' && (
        <div className="title-screen">
          <div className="title-content">
            <h1 className="game-title">艾尔德兰编年史</h1>
            <h2 className="game-subtitle">裂隙纪元</h2>
            <p className="tagline">你写故事，系统接招；你交朋友，故事延续。</p>
            <div className="title-actions">
              <button className="btn-primary" onClick={() => setScreen('create')}>
                ⚔️ 开始冒险
              </button>
              <button className="btn-secondary" onClick={() => setScreen('worldSelect')}>
                🌍 选择世界
              </button>
            </div>
            <p className="version-info">V1.0 MVP | 剑与魔法的奇幻世界</p>
          </div>
        </div>
      )}

      {screen === 'create' && (
        <CharacterCreation
          config={config}
          onCreate={handleCreateCharacter}
          onBack={() => setScreen('title')}
          loading={loading}
          error={error}
        />
      )}

      {screen === 'worldSelect' && (
        <WorldSelect
          config={config}
          onBack={() => setScreen('title')}
        />
      )}

      {screen === 'game' && character && (
        <GameScreen
          character={character}
          token={token}
          world={world}
          config={config}
          onRefresh={handleRefreshCharacter}
          onOpenSocial={() => setScreen('social')}
          onBackToTitle={handleBackToTitle}
        />
      )}

      {screen === 'social' && character && (
        <SocialPanel
          character={character}
          token={token}
          onBack={() => setScreen('game')}
        />
      )}
    </div>
  );
}
