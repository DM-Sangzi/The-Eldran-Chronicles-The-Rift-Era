import React, { useEffect, useRef, useCallback } from 'react';

/**
 * 点击涟漪火花特效
 * 点击任意位置产生扩散涟漪 + 小粒子爆发
 */
export default function ClickEffect() {
  const containerRef = useRef(null);

  const createEffect = useCallback((e) => {
    const container = containerRef.current;
    if (!container) return;

    const x = e.clientX;
    const y = e.clientY;
    const colors = [
      '212,167,116',  // gold
      '163,113,247',  // purple
      '240,192,96',   // bright gold
      '57,210,192',   // cyan
    ];
    const color = colors[Math.floor(Math.random() * colors.length)];

    // === 涟漪 ===
    const ripple = document.createElement('div');
    ripple.className = 'click-ripple';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    ripple.style.borderColor = `rgba(${color},0.6)`;
    ripple.style.boxShadow = `0 0 12px rgba(${color},0.4), inset 0 0 12px rgba(${color},0.1)`;
    container.appendChild(ripple);
    setTimeout(() => ripple.remove(), 800);

    // === 火花粒子 ===
    for (let i = 0; i < 8; i++) {
      const spark = document.createElement('div');
      spark.className = 'click-spark';
      const angle = (Math.PI * 2 * i) / 8 + (Math.random() - 0.5) * 0.5;
      const distance = 20 + Math.random() * 30;
      const dx = Math.cos(angle) * distance;
      const dy = Math.sin(angle) * distance;
      spark.style.left = x + 'px';
      spark.style.top = y + 'px';
      spark.style.setProperty('--dx', dx + 'px');
      spark.style.setProperty('--dy', dy + 'px');
      spark.style.background = `rgb(${color})`;
      spark.style.boxShadow = `0 0 6px rgba(${color},0.8)`;
      container.appendChild(spark);
      setTimeout(() => spark.remove(), 700);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('click', createEffect);
    return () => document.removeEventListener('click', createEffect);
  }, [createEffect]);

  return <div ref={containerRef} className="click-effect-container" />;
}
