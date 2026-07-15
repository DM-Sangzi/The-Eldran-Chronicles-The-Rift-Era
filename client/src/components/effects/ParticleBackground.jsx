import React, { useRef, useEffect } from 'react';

export default function ParticleBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const PARTICLE_COUNT = 80;
    const particles = [];
    const colors = [
      { r: 212, g: 167, b: 116 },  // gold
      { r: 163, g: 113, b: 247 },  // purple
      { r: 88, g: 166, b: 255 },   // blue
      { r: 240, g: 192, b: 96 },   // bright gold
      { r: 57, g: 210, b: 192 },   // cyan
    ];
    const runes = ['◇', '○', '△', '⬡', '✧', '✦', '·', '◆'];

    class Particle {
      constructor() {
        this.reset();
        this.y = Math.random() * canvas.height;
      }
      reset() {
        this.x = Math.random() * canvas.width;
        this.y = canvas.height + 20;
        this.size = Math.random() * 2.5 + 1;
        this.speedY = -(Math.random() * 0.4 + 0.15);
        this.speedX = (Math.random() - 0.5) * 0.3;
        this.opacity = Math.random() * 0.8 + 0.2;
        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.pulse = Math.random() * Math.PI * 2;
        this.pulseSpeed = Math.random() * 0.02 + 0.005;
        this.isRune = Math.random() < 0.15;
        this.rune = runes[Math.floor(Math.random() * runes.length)];
      }
      update() {
        this.y += this.speedY;
        this.x += this.speedX + Math.sin(this.y * 0.02 + this.pulse) * 0.1;
        this.pulse += this.pulseSpeed;
        if (this.y < -20 || this.x < -20 || this.x > canvas.width + 20) this.reset();
      }
      draw(ctx) {
        const alpha = this.opacity * (0.5 + 0.5 * Math.sin(this.pulse));
        const { r, g, b } = this.color;
        ctx.save();
        if (this.isRune) {
          ctx.font = `${this.size * 6}px serif`;
          ctx.fillStyle = `rgba(${r},${g},${b},${alpha * 0.7})`;
          ctx.shadowColor = `rgba(${r},${g},${b},${alpha})`;
          ctx.shadowBlur = 8;
          ctx.textAlign = 'center';
          ctx.fillText(this.rune, this.x, this.y);
        } else {
          const glow = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size * 3);
          glow.addColorStop(0, `rgba(${r},${g},${b},${alpha})`);
          glow.addColorStop(0.5, `rgba(${r},${g},${b},${alpha * 0.3})`);
          glow.addColorStop(1, `rgba(${r},${g},${b},0)`);
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.size * 3, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
    }

    for (let i = 0; i < PARTICLE_COUNT; i++) particles.push(new Particle());

    const CONNECT_DIST = 100;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) { p.update(); p.draw(ctx); }
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < CONNECT_DIST) {
            const alpha = (1 - dist / CONNECT_DIST) * 0.12;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(212,167,116,${alpha})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      animId = requestAnimationFrame(animate);
    };
    animate();

    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
  }, []);

  return <canvas ref={canvasRef} className="particle-canvas" />;
}
