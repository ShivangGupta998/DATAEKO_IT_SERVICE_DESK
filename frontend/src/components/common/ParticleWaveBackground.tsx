import React, { useEffect, useRef } from 'react';

export const ParticleWaveBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // Particle grid settings
    const numRows = 35;
    const numCols = 60;
    const separation = 40;
    let count = 0;

    const render = () => {
      ctx.fillStyle = '#090d16'; // Dark background matching theme
      ctx.fillRect(0, 0, width, height);

      count += 0.03;

      const startX = (width - numCols * separation) / 2;
      const startY = height / 2.5;

      for (let ix = 0; ix < numCols; ix++) {
        for (let iy = 0; iy < numRows; iy++) {
          // Calculate wave elevation offset
          const yOffset =
            Math.sin((ix + count) * 0.3) * 45 + Math.sin((iy + count) * 0.5) * 45;

          // Simple 3D projection formula
          const perspective = 0.5 + (iy / numRows) * 0.8;
          const px = startX + ix * separation * perspective + (width / 2 - startX) * (1 - perspective);
          const py = startY + iy * 18 + yOffset * perspective;
          const radius = Math.max(0.5, 1.8 * perspective);

          // Glowing particle color gradient
          const alpha = Math.min(1, Math.max(0.1, (iy / numRows) * 0.9));
          ctx.beginPath();
          ctx.arc(px, py, radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(129, 140, 248, ${alpha})`; // Indigo glow color
          ctx.fill();
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full -z-10 pointer-events-none"
    />
  );
};