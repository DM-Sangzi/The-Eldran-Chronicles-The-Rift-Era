import React, { useState, useRef, useEffect } from 'react';

/**
 * 奇幻环境音效 - 使用 Web Audio API 生成
 * 无需外部音频文件
 */
export default function MusicPlayer() {
  const [playing, setPlaying] = useState(false);
  const audioCtxRef = useRef(null);
  const nodesRef = useRef([]);
  const animRef = useRef(null);

  const stopAll = () => {
    if (animRef.current) clearTimeout(animRef.current);
    animRef.current = null;
    nodesRef.current.forEach(n => {
      try { n.stop(); } catch (_) {}
    });
    nodesRef.current = [];
  };

  const createReverb = (ctx) => {
    // 简易卷积混响，让声音更空灵
    const rate = ctx.sampleRate;
    const length = rate * 2.5;
    const impulse = ctx.createBuffer(2, length, rate);
    for (let channel = 0; channel < 2; channel++) {
      const data = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 3);
      }
    }
    const convolver = ctx.createConvolver();
    convolver.buffer = impulse;
    const reverbGain = ctx.createGain();
    reverbGain.gain.value = 0.35;
    convolver.connect(reverbGain);
    return { convolver, reverbGain };
  };

  const createAmbience = () => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    stopAll();

    const { reverbGain } = createReverb(ctx);
    reverbGain.connect(ctx.destination);

    const now = ctx.currentTime;
    const chord = [
      [220.0, 261.63, 329.63, 392.0],   // A3 - C4 - E4 - G4 (Am7)
      [196.0, 246.94, 293.66, 349.23],  // G3 - B3 - D4 - F4 (Gmaj7)
      [174.61, 220.0, 261.63, 329.63],  // F3 - A3 - C4 - E4 (Fmaj7)
      [246.94, 293.66, 349.23, 440.0],  // B3 - D4 - F#4 - A4 (Bm7)
    ];

    const chordDur = 10; // 每个和弦持续 10 秒

    // === 轻柔的 Pad 和弦层 ===
    chord.forEach((notes, chordIndex) => {
      const chordStart = now + chordIndex * chordDur;
      const fadeEnd = chordStart + chordDur + 2;

      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = i % 2 === 0 ? 'triangle' : 'sine';
        osc.frequency.value = freq;
        osc.detune.value = (i % 3) * 6;

        filter.type = 'lowpass';
        filter.frequency.value = 800;
        filter.Q.value = 1;

        gain.gain.setValueAtTime(0, chordStart);
        gain.gain.linearRampToValueAtTime(0.018 / notes.length, chordStart + 2.5);
        gain.gain.setValueAtTime(0.018 / notes.length, fadeEnd - 2);
        gain.gain.linearRampToValueAtTime(0, fadeEnd);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        gain.connect(reverbGain);

        osc.start(chordStart);
        osc.stop(fadeEnd + 0.5);
        nodesRef.current.push(osc);
      });
    });

    // === 缓慢琶音/装饰音 ===
    const arpNotes = [220, 261.63, 293.66, 329.63, 392.0, 440, 523.25];
    let arpTime = now + 2;
    for (let i = 0; i < 60; i++) {
      const freq = arpNotes[i % arpNotes.length];
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = 'sine';
      osc.frequency.value = freq;
      filter.type = 'lowpass';
      filter.frequency.value = 1200;
      filter.Q.value = 8;

      gain.gain.setValueAtTime(0, arpTime);
      gain.gain.linearRampToValueAtTime(0.025, arpTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, arpTime + 1.8);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      gain.connect(reverbGain);

      osc.start(arpTime);
      osc.stop(arpTime + 2);
      nodesRef.current.push(osc);

      arpTime += 1.5 + Math.random() * 1.5;
    }

    // === 空灵风噪声 ===
    const bufferSize = ctx.sampleRate * 2;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.value = 250;
    noiseFilter.Q.value = 0.5;
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0, now);
    noiseGain.gain.linearRampToValueAtTime(0.012, now + 3);
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noiseGain.connect(reverbGain);
    noise.start(now);
    nodesRef.current.push(noise);

    // === 循环重新触发和弦 ===
    const loopDuration = chord.length * chordDur;
    const scheduleLoop = (baseTime) => {
      chord.forEach((notes, chordIndex) => {
        const chordStart = baseTime + chordIndex * chordDur;
        const fadeEnd = chordStart + chordDur + 2;
        notes.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const filter = ctx.createBiquadFilter();

          osc.type = i % 2 === 0 ? 'triangle' : 'sine';
          osc.frequency.value = freq;
          osc.detune.value = (i % 3) * 6;

          filter.type = 'lowpass';
          filter.frequency.value = 800;
          filter.Q.value = 1;

          gain.gain.setValueAtTime(0, chordStart);
          gain.gain.linearRampToValueAtTime(0.018 / notes.length, chordStart + 2.5);
          gain.gain.setValueAtTime(0.018 / notes.length, fadeEnd - 2);
          gain.gain.linearRampToValueAtTime(0, fadeEnd);

          osc.connect(filter);
          filter.connect(gain);
          gain.connect(ctx.destination);
          gain.connect(reverbGain);

          osc.start(chordStart);
          osc.stop(fadeEnd + 0.5);
          nodesRef.current.push(osc);
        });
      });
    };

    const loopNext = () => {
      const nextBase = ctx.currentTime + loopDuration;
      scheduleLoop(nextBase);
      animRef.current = setTimeout(loopNext, loopDuration * 1000 - 2000);
    };

    animRef.current = setTimeout(loopNext, loopDuration * 1000 - 2000);
  };

  const toggle = async () => {
    if (playing) {
      stopAll();
      setPlaying(false);
      return;
    }

    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      audioCtxRef.current = new AudioCtx();
    }

    // 需要在用户手势下 resume
    if (audioCtxRef.current.state === 'suspended') {
      await audioCtxRef.current.resume();
    }

    createAmbience();
    setPlaying(true);
  };

  // 清理
  useEffect(() => {
    return () => {
      stopAll();
      if (audioCtxRef.current) audioCtxRef.current.close();
    };
  }, []);

  return (
    <button
      className={`music-toggle ${playing ? 'playing' : ''}`}
      onClick={toggle}
      title={playing ? '关闭音效' : '开启环境音效'}
    >
      {playing ? '🔊' : '🔇'}
    </button>
  );
}
