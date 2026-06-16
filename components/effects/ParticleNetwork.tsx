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

const CELL_SIZE = 130;
const LINK_DIST_SQ = 13000;
const MOUSE_DIST_SQ = 22500;
const MOUSE_MIN_DIST_SQ = 100;
const MOUSE_LINE_DIST_SQ = 24000;
const MAX_PARTICLES = 55;

export function ParticleNetwork() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let particles: Particle[] = [];
    let frameId = 0;
    let theme = loadTheme();
    let visible = !document.hidden;
    let mouseX = -9999;
    let mouseY = -9999;
    let mouseDirty = false;

    const particleCount = () =>
      Math.min(
        MAX_PARTICLES,
        Math.floor((window.innerWidth * window.innerHeight) / 24000),
      );

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
      mouseX = event.clientX;
      mouseY = event.clientY;
      mouseDirty = true;
    };

    const onMouseOut = () => {
      mouseX = -9999;
      mouseY = -9999;
      mouseDirty = true;
    };

    const onVisibilityChange = () => {
      visible = !document.hidden;
      if (visible) {
        frameId = requestAnimationFrame(draw);
      }
    };

    const buildGrid = () => {
      const grid = new Map<string, number[]>();

      for (let i = 0; i < particles.length; i++) {
        const particle = particles[i];
        const key = `${Math.floor(particle.x / CELL_SIZE)},${Math.floor(particle.y / CELL_SIZE)}`;
        const bucket = grid.get(key);
        if (bucket) {
          bucket.push(i);
        } else {
          grid.set(key, [i]);
        }
      }

      return grid;
    };

    const forEachNeighbor = (
      grid: Map<string, number[]>,
      particle: Particle,
      callback: (index: number) => void,
    ) => {
      const cx = Math.floor(particle.x / CELL_SIZE);
      const cy = Math.floor(particle.y / CELL_SIZE);

      for (let ox = -1; ox <= 1; ox++) {
        for (let oy = -1; oy <= 1; oy++) {
          const bucket = grid.get(`${cx + ox},${cy + oy}`);
          if (!bucket) continue;
          for (const index of bucket) {
            callback(index);
          }
        }
      }
    };

    const draw = () => {
      if (!visible) {
        return;
      }

      const config = getThemeConfig();
      ctx.clearRect(0, 0, width, height);

      for (const particle of particles) {
        particle.x += particle.vx;
        particle.y += particle.vy;
        if (particle.x < 0 || particle.x > width) particle.vx *= -1;
        if (particle.y < 0 || particle.y > height) particle.vy *= -1;

        if (mouseDirty) {
          const dx = mouseX - particle.x;
          const dy = mouseY - particle.y;
          const distSq = dx * dx + dy * dy;
          if (distSq < MOUSE_DIST_SQ && distSq > MOUSE_MIN_DIST_SQ) {
            particle.x += dx * 0.004;
            particle.y += dy * 0.004;
          }
        }

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${particle.hue}, 100%, 60%, ${config.opacity})`;
        ctx.fill();
      }

      mouseDirty = false;

      const grid = buildGrid();

      for (let i = 0; i < particles.length; i++) {
        const a = particles[i];

        forEachNeighbor(grid, a, (j) => {
          if (j <= i) return;

          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const distSq = dx * dx + dy * dy;
          if (distSq >= LINK_DIST_SQ) return;

          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `hsla(${config.primaryHue}, 100%, 60%, ${config.lineOpacity * (1 - distSq / LINK_DIST_SQ)})`;
          ctx.lineWidth = 0.7;
          ctx.stroke();
        });

        const dx = a.x - mouseX;
        const dy = a.y - mouseY;
        const distSq = dx * dx + dy * dy;
        if (distSq < MOUSE_LINE_DIST_SQ) {
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(mouseX, mouseY);
          ctx.strokeStyle = `hsla(${config.secondaryHue}, 100%, 60%, ${config.lineOpacity * 1.8 * (1 - distSq / MOUSE_LINE_DIST_SQ)})`;
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }

      frameId = requestAnimationFrame(draw);
    };

    resize();
    frameId = requestAnimationFrame(draw);

    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", onMouseMove, { passive: true });
    window.addEventListener("mouseout", onMouseOut);
    window.addEventListener("armstrong-theme-change", onThemeChange);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseout", onMouseOut);
      window.removeEventListener("armstrong-theme-change", onThemeChange);
      document.removeEventListener("visibilitychange", onVisibilityChange);
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
