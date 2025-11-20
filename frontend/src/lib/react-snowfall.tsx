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
  const flakesRef = useRef<Flake[]>([]);
  const speedRef = useRef<[number, number]>(speed);
  const windRef = useRef<[number, number]>(wind);
  const radiusRef = useRef<[number, number]>(radius);
  const colorRef = useRef<string>(color);

  // Update refs when props change, but don't regenerate flakes
  speedRef.current = speed;
  windRef.current = wind;
  radiusRef.current = radius;
  colorRef.current = color;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Only initialize flakes if they don't exist or count changed
    if (flakesRef.current.length !== snowflakeCount) {
      flakesRef.current = Array.from({ length: snowflakeCount }, () => ({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        r: Math.random() * (radiusRef.current[1] - radiusRef.current[0]) + radiusRef.current[0],
        vy: Math.random() * (speedRef.current[1] - speedRef.current[0]) + speedRef.current[0],
        vx: Math.random() * (windRef.current[1] - windRef.current[0]) + windRef.current[0],
      }));
    }

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resize();
    window.addEventListener('resize', resize);

    let animationId: number;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = colorRef.current;
      flakesRef.current.forEach(flake => {
        ctx.beginPath();
        ctx.arc(flake.x, flake.y, flake.r, 0, Math.PI * 2);
        ctx.fill();

        flake.y += flake.vy;
        flake.x += flake.vx;

        if (flake.y > canvas.height) {
          flake.y = -flake.r;
          flake.x = Math.random() * canvas.width;
          // Maintain consistent speed when resetting
          flake.vy = Math.random() * (speedRef.current[1] - speedRef.current[0]) + speedRef.current[0];
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
  }, [snowflakeCount]); // Only depend on snowflakeCount

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

