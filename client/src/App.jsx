import React, { useState, useEffect, useCallback } from 'react';
import api from './api.js';
import CharacterCreation from './components/CharacterCreation.jsx';
import GameScreen from './components/GameScreen.jsx';
import SocialPanel from './components/SocialPanel.jsx';
import WorldSelect from './components/WorldSelect.jsx';
import ParticleBackground from './components/effects/ParticleBackground.jsx';
import ClickEffect from './components/effects/ClickEffect.jsx';
import MusicPlayer from './components/effects/MusicPlayer.jsx';

const LS_TOKEN = 'eldran_token';
const LS_CHARACTER = 'eldran_character';
const LS_WORLD = 'eldran_world';

export default function App() {
  const [screen, setScreen] = useState('title'); // title | create | worldSelect | game | social | awakening
  const [config, setConfig] = useState(null);
  const [character, setCharacter] = useState(null);
  const [token, setToken] = useState(null);
  const [world, setWorld] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tutorialData, setTutorialData] = useState(null);
  const [questIntro, setQuestIntro] = useState(null);
  const [initialTimeInfo, setInitialTimeInfo] = useState(null);
  const [initialQuest, setInitialQuest] = useState(null);
  const [restoring, setRestoring] = useState(true);

  useEffect(() => {
    api.getConfig().then(setConfig).catch(console.error);
  }, []);

  // 应用启动时：从 localStorage 恢复会话
  useEffect(() => {
    const savedToken = localStorage.getItem(LS_TOKEN);
    const savedChar = localStorage.getItem(LS_CHARACTER);
    const savedWorld = localStorage.getItem(LS_WORLD);

    if (!savedToken) {
      setRestoring(false);
      return;
    }

    const restore = async () => {
      try {
        const result = await api.getCharacter(savedToken);
        if (result.character) {
          setToken(savedToken);
          setCharacter(savedChar ? JSON.parse(savedChar) : result.character);
          setWorld(savedWorld ? JSON.parse(savedWorld) : null);
          setScreen('game');
        } else {
          throw new Error('角色不存在');
        }
      } catch (err) {
        // Token 已失效（服务器重启或过期），清除本地存储
        localStorage.removeItem(LS_TOKEN);
        localStorage.removeItem(LS_CHARACTER);
        localStorage.removeItem(LS_WORLD);
      } finally {
        setRestoring(false);
      }
    };

    restore();
  }, []);

  // 会话变化时持久化到 localStorage
  useEffect(() => {
    if (token) {
      localStorage.setItem(LS_TOKEN, token);
    } else {
      localStorage.removeItem(LS_TOKEN);
    }
  }, [token]);

  useEffect(() => {
    if (character) {
      localStorage.setItem(LS_CHARACTER, JSON.stringify(character));
    } else {
      localStorage.removeItem(LS_CHARACTER);
    }
  }, [character]);

  useEffect(() => {
    if (world) {
      localStorage.setItem(LS_WORLD, JSON.stringify(world));
    } else {
      localStorage.removeItem(LS_WORLD);
    }
  }, [world]);

  const handleCreateCharacter = useCallback(async (data) => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.createCharacter(data);
      setCharacter(result.character);
      setToken(result.token);
      setWorld(result.world);
      // 存储教程数据，进入觉醒画面
      setTutorialData(result.tutorial || null);
      // 存储 NPC 任务开场白
      setQuestIntro(result.questIntro || null);
      // 存储初始时间信息
      setInitialTimeInfo(result.timeInfo || null);
      // 存储初始任务（用于多阶段任务展示）
      setInitialQuest(result.quest || null);
      setScreen('awakening');
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
      if (err.message === '未登录') {
        handleBackToTitle();
      }
    }
  }, [token]);

  const handleBackToTitle = useCallback(() => {
    setCharacter(null);
    setToken(null);
    setWorld(null);
    setScreen('title');
  }, []);

  if (!config || restoring) {
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
      <ParticleBackground />
      <ClickEffect />
      <MusicPlayer />
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
                🌍 查看世界
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
          tutorialData={tutorialData}
          initialNarrative={questIntro}
          initialTimeInfo={initialTimeInfo}
          initialQuest={initialQuest}
        />
      )}

      {screen === 'awakening' && character && tutorialData && (
        <AwakeningScreen
          tutorial={tutorialData}
          character={character}
          onEnterGame={() => { setScreen('game'); }}
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

// 沉浸式觉醒画面（新手教程）
function AwakeningScreen({ tutorial, character, onEnterGame }) {
  const [stage, setStage] = useState(0); // 0=intro, 1=discovery, 2=eraLore
  const { intro, discovery, tip, eraLore, classEmoji, location, weaponProficiency, raceName, className } = tutorial;

  const handleNext = () => {
    if (stage < 2) {
      setStage(s => s + 1);
    } else {
      onEnterGame();
    }
  };

  return (
    <div className="awakening-screen">
      <div className="awakening-content">
        {stage === 0 && (
          <div className="awakening-stage fade-in">
            <div className="awakening-location">
              <span className="awakening-emoji">{classEmoji}</span>
              <span className="awakening-place">{location}</span>
            </div>
            <div className="awakening-identity">
              {raceName} · {className}
            </div>
            <div className="awakening-divider">━━━━━━━━━━</div>
            <div className="awakening-narrative" dangerouslySetInnerHTML={{
              __html: intro.replace(/\n/g, '<br/>')
            }} />
            <button className="btn-primary awakening-btn" onClick={handleNext}>
              继续翻看行囊 →
            </button>
          </div>
        )}

        {stage === 1 && (
          <div className="awakening-stage fade-in">
            <div className="awakening-section-title">
              🎒 检查随身物品
            </div>
            {weaponProficiency && (
              <div className="awakening-weapon-info">
                <div className="weapon-icon">{weaponProficiency.icon}</div>
                <div className="weapon-detail">
                  <strong>{weaponProficiency.type}</strong>
                  <p>{weaponProficiency.desc}</p>
                </div>
              </div>
            )}
            <div className="awakening-narrative" dangerouslySetInnerHTML={{
              __html: discovery.replace(/\n/g, '<br/>')
            }} />
            <button className="btn-primary awakening-btn" onClick={handleNext}>
              铭记于心 →
            </button>
          </div>
        )}

        {stage === 2 && (
          <div className="awakening-stage fade-in">
            <div className="awakening-section-title">
              📖 关于这个世界
            </div>
            {eraLore && (
              <div className="era-lore-container">
                <h3>{eraLore.title}</h3>
                <div className="awakening-narrative era-lore" dangerouslySetInnerHTML={{
                  __html: eraLore.body.replace(/\n/g, '<br/>')
                }} />
              </div>
            )}
            {tip && (
              <div className="awakening-tip">
                <div className="tip-header">💡 出发前的提醒</div>
                <p>{tip}</p>
              </div>
            )}
            <button className="btn-primary btn-start awakening-btn" onClick={handleNext}>
              ✨ 睁开眼睛，踏入艾尔德兰
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
