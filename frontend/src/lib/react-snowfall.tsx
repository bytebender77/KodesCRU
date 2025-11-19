import { useEffect, useRef } from 'react';
import type { CSSProperties } from 'react';

export interface SnowfallProps {
  snowflakeCount?: number;
  color?: string;
  speed?: [number, number];
  wind?: [number, number];
  radius?: [number, number];
  style?: CSSProperties;
}

interface Flake {
  x: number;
  y: number;
  r: number;
  vy: number;
  vx: number;
}

const Snowfall = ({
  snowflakeCount = 200,
  color = '#ffffff',
  speed = [0.5, 1.5],
  wind = [-0.3, 0.3],
  radius = [1.5, 3.5],
  style = {},
}: SnowfallProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const flakes: Flake[] = Array.from({ length: snowflakeCount }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * (radius[1] - radius[0]) + radius[0],
      vy: Math.random() * (speed[1] - speed[0]) + speed[0],
      vx: Math.random() * (wind[1] - wind[0]) + wind[0],
    }));

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resize();
    window.addEventListener('resize', resize);

    let animationId: number;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = color;
      flakes.forEach(flake => {
        ctx.beginPath();
        ctx.arc(flake.x, flake.y, flake.r, 0, Math.PI * 2);
        ctx.fill();

        flake.y += flake.vy;
        flake.x += flake.vx;

        if (flake.y > canvas.height) {
          flake.y = -flake.r;
          flake.x = Math.random() * canvas.width;
        }
        if (flake.x > canvas.width) {
          flake.x = 0;
        } else if (flake.x < 0) {
          flake.x = canvas.width;
        }
      });

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, [snowflakeCount, color, speed, wind, radius]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        ...style,
      }}
    />
  );
};

export default Snowfall;

