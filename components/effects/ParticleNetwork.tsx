"use client";

import { useEffect, useRef } from "react";
import { loadTheme, type Theme } from "@/lib/theme";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  hue: number;
}

const THEME_PARTICLES: Record<
  Theme,
  { primaryHue: number; secondaryHue: number; opacity: number; lineOpacity: number }
> = {
  dark: {
    primaryHue: 187,
    secondaryHue: 312,
    opacity: 0.7,
    lineOpacity: 0.12,
  },
  light: {
    primaryHue: 192,
    secondaryHue: 310,
    opacity: 0.45,
    lineOpacity: 0.08,
  },
};

export function ParticleNetwork() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let particles: Particle[] = [];
    let frameId = 0;
    let theme = loadTheme();
    const mouse = { x: -9999, y: -9999 };

    const particleCount = () =>
      Math.min(90, Math.floor((window.innerWidth * window.innerHeight) / 18000));

    const getThemeConfig = () => THEME_PARTICLES[theme];

    const createParticles = () =>
      Array.from({ length: particleCount() }, () => {
        const config = getThemeConfig();
        return {
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.45,
          vy: (Math.random() - 0.5) * 0.45,
          r: Math.random() * 1.6 + 0.6,
          hue: Math.random() < 0.85 ? config.primaryHue : config.secondaryHue,
        };
      });

    const resize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      particles = createParticles();
    };

    const onThemeChange = (event: Event) => {
      theme = (event as CustomEvent<Theme>).detail;
      particles = createParticles();
    };

    const onMouseMove = (event: MouseEvent) => {
      mouse.x = event.clientX;
      mouse.y = event.clientY;
    };

    const onMouseOut = () => {
      mouse.x = -9999;
      mouse.y = -9999;
    };

    const draw = () => {
      const config = getThemeConfig();
      ctx.clearRect(0, 0, width, height);

      for (const particle of particles) {
        particle.x += particle.vx;
        particle.y += particle.vy;
        if (particle.x < 0 || particle.x > width) particle.vx *= -1;
        if (particle.y < 0 || particle.y > height) particle.vy *= -1;

        const dx = mouse.x - particle.x;
        const dy = mouse.y - particle.y;
        const distSq = dx * dx + dy * dy;
        if (distSq < 22500 && distSq > 100) {
          particle.x += dx * 0.004;
          particle.y += dy * 0.004;
        }

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${particle.hue}, 100%, 60%, ${config.opacity})`;
        ctx.fill();
      }

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i];
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const distSq = dx * dx + dy * dy;
          if (distSq < 13000) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `hsla(${config.primaryHue}, 100%, 60%, ${config.lineOpacity * (1 - distSq / 13000)})`;
            ctx.lineWidth = 0.7;
            ctx.stroke();
          }
        }

        const a = particles[i];
        const dx = a.x - mouse.x;
        const dy = a.y - mouse.y;
        const distSq = dx * dx + dy * dy;
        if (distSq < 24000) {
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.strokeStyle = `hsla(${config.secondaryHue}, 100%, 60%, ${config.lineOpacity * 1.8 * (1 - distSq / 24000)})`;
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }

      frameId = requestAnimationFrame(draw);
    };

    resize();
    draw();

    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseout", onMouseOut);
    window.addEventListener("armstrong-theme-change", onThemeChange);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseout", onMouseOut);
      window.removeEventListener("armstrong-theme-change", onThemeChange);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 h-screen w-screen"
    />
  );
}
