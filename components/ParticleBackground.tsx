"use client";

import React from "react";

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
};

export default function ParticleBackground() {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mouse = { x: null as number | null, y: null as number | null, radius: 200 };

    const particles: Particle[] = [];
    let width = window.innerWidth;
    let height = window.innerHeight;
    let animationFrameId = 0;
    let lastTime = 0;

    // Theme: read from the .dark class on <html>
    const isDarkNow = () => document.documentElement.classList.contains("dark");
    let isDark = isDarkNow();
    const getColors = () => ({
      dot: isDark ? "rgba(255, 255, 255, 0.85)" : "rgba(0, 34, 255, 0.55)",
      line: isDark ? "rgba(255, 255, 255, " : "rgba(0, 34, 255, ",
      lineNearMouse: "rgba(0, 34, 255, ",
    });
    let colors = getColors();

    // Fewer particles on small screens and a lower cap overall keeps scrolling smooth
    const targetCount = () => {
      const base = (width * height) / 12000;
      return Math.floor(width < 768 ? Math.min(base, 45) : Math.min(base, 100));
    };

    const makeParticle = (): Particle => {
      const size = Math.random() * 2 + 1;
      return {
        x: size + Math.random() * (width - size * 2),
        y: size + Math.random() * (height - size * 2),
        vx: Math.random() * 0.4 - 0.2,
        vy: Math.random() * 0.4 - 0.2,
        size,
      };
    };

    const update = (step: number) => {
      for (const p of particles) {
        // Gentle push away from the cursor
        if (mouse.x !== null && mouse.y !== null) {
          const dx = mouse.x - p.x;
          const dy = mouse.y - p.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance < mouse.radius + p.size && distance > 0) {
            const force = (mouse.radius - distance) / mouse.radius;
            p.x -= (dx / distance) * force * 5 * step;
            p.y -= (dy / distance) * force * 5 * step;
          }
        }

        p.x += p.vx * step;
        p.y += p.vy * step;

        // Bounce by setting the direction explicitly, so a particle can never
        // get stuck flipping back and forth at an edge
        if (p.x < 0) {
          p.x = 0;
          p.vx = Math.abs(p.vx);
        } else if (p.x > width) {
          p.x = width;
          p.vx = -Math.abs(p.vx);
        }
        if (p.y < 0) {
          p.y = 0;
          p.vy = Math.abs(p.vy);
        } else if (p.y > height) {
          p.y = height;
          p.vy = -Math.abs(p.vy);
        }
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // All dots in a single path = one fill call instead of one per dot
      ctx.fillStyle = colors.dot;
      ctx.beginPath();
      for (const p of particles) {
        ctx.moveTo(p.x + p.size, p.y);
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2, false);
      }
      ctx.fill();

      // Lines between nearby particles
      const maxDist = 150 * 150;
      ctx.lineWidth = 1;
      for (let a = 0; a < particles.length; a++) {
        const pa = particles[a];
        for (let b = a + 1; b < particles.length; b++) {
          const pb = particles[b];
          const dx = pa.x - pb.x;
          const dy = pa.y - pb.y;
          const distance = dx * dx + dy * dy;
          if (distance >= maxDist) continue;

          const opacityValue = 1 - distance / maxDist;
          let strokeStyle = `${colors.line}${opacityValue * 0.5})`;

          if (mouse.x !== null && mouse.y !== null) {
            const mdx = pa.x - mouse.x;
            const mdy = pa.y - mouse.y;
            if (Math.sqrt(mdx * mdx + mdy * mdy) < mouse.radius) {
              strokeStyle = `${colors.lineNearMouse}${opacityValue})`;
            }
          }

          ctx.strokeStyle = strokeStyle;
          ctx.beginPath();
          ctx.moveTo(pa.x, pa.y);
          ctx.lineTo(pb.x, pb.y);
          ctx.stroke();
        }
      }
    };

    const sizeCanvas = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const resize = () => {
      const newW = window.innerWidth;
      const newH = window.innerHeight;
      if (newW === width && newH === height) return;

      // Keep existing particles and scale them, instead of respawning everything
      const sx = newW / width;
      const sy = newH / height;
      for (const p of particles) {
        p.x *= sx;
        p.y *= sy;
      }
      width = newW;
      height = newH;
      sizeCanvas();

      const target = targetCount();
      while (particles.length < target) particles.push(makeParticle());
      if (particles.length > target) particles.length = target;

      if (reduceMotion) draw();
    };

    const animate = (time: number) => {
      animationFrameId = requestAnimationFrame(animate);
      if (document.hidden) {
        lastTime = 0; // do not draw in a background tab, and avoid a big jump on return
        return;
      }
      // Move by elapsed time so speed is the same on 60Hz and 144Hz screens
      const dt = lastTime ? time - lastTime : 16.667;
      lastTime = time;
      const step = Math.min(dt / 16.667, 3);

      update(step);
      draw();
    };

    const handleMouseMove = (event: MouseEvent) => {
      mouse.x = event.clientX;
      mouse.y = event.clientY;
    };

    // mouseout fires every time the cursor crosses ANY element. Only clear the
    // cursor when it really leaves the browser window (relatedTarget is null).
    const handleMouseOut = (event: MouseEvent) => {
      if (event.relatedTarget === null) {
        mouse.x = null;
        mouse.y = null;
      }
    };

    // Re-color only when the dark/light theme really changes. Other classes on <html>
    // (for example the one the smooth-scroll library toggles while scrolling) are ignored.
    const themeObserver = new MutationObserver(() => {
      const nowDark = isDarkNow();
      if (nowDark === isDark) return;
      isDark = nowDark;
      colors = getColors();
      if (reduceMotion) draw();
    });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("mouseout", handleMouseOut);

    // Initial setup
    sizeCanvas();
    const count = targetCount();
    for (let i = 0; i < count; i++) particles.push(makeParticle());

    if (reduceMotion) {
      draw(); // one still frame for people who asked for less motion
    } else {
      animationFrameId = requestAnimationFrame(animate);
    }

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseout", handleMouseOut);
      themeObserver.disconnect();
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10 pointer-events-none"
      aria-hidden="true"
    />
  );
}