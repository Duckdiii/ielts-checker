import React, { useEffect, useRef } from 'react';

interface AudioWaveVisualizerProps {
  isRecording?: boolean;
  isPlaying?: boolean;
  color?: 'indigo' | 'emerald' | 'rose' | 'amber';
  barCount?: number;
  height?: number;
}

export function AudioWaveVisualizer({
  isRecording = false,
  isPlaying = false,
  color = 'indigo',
  barCount = 28,
  height = 40,
}: AudioWaveVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const colorMap = {
    indigo: {
      gradientStart: '#818CF8',
      gradientEnd: '#4F46E5',
      glow: 'rgba(99, 102, 241, 0.4)',
    },
    emerald: {
      gradientStart: '#34D399',
      gradientEnd: '#059669',
      glow: 'rgba(16, 185, 129, 0.4)',
    },
    rose: {
      gradientStart: '#FB7185',
      gradientEnd: '#E11D48',
      glow: 'rgba(244, 63, 94, 0.4)',
    },
    amber: {
      gradientStart: '#FBBF24',
      gradientEnd: '#D97706',
      glow: 'rgba(245, 158, 11, 0.4)',
    },
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let phase = 0;
    const active = isRecording || isPlaying;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const width = canvas.width;
      const h = canvas.height;
      const barWidth = (width / barCount) * 0.65;
      const gap = (width - barWidth * barCount) / (barCount - 1);
      const selectedColor = colorMap[color];

      for (let i = 0; i < barCount; i++) {
        let barHeight = 4; // Base idle height

        if (active) {
          // Dynamic wave formula combining sine and pseudo-random pulses
          const sinVal = Math.sin(phase + i * 0.35);
          const cosVal = Math.cos(phase * 1.5 + i * 0.2);
          const normalized = (sinVal + cosVal + 2) / 4; // 0 to 1
          const centerDist = 1 - Math.abs(i - barCount / 2) / (barCount / 2); // Bell curve
          barHeight = Math.max(4, normalized * h * 0.85 * (0.4 + centerDist * 0.6));
        }

        const x = i * (barWidth + gap);
        const y = (h - barHeight) / 2;

        const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
        gradient.addColorStop(0, selectedColor.gradientStart);
        gradient.addColorStop(1, selectedColor.gradientEnd);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, barWidth / 2);
        ctx.fill();
      }

      phase += active ? 0.12 : 0.02;
      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isRecording, isPlaying, color, barCount, height]);

  return (
    <div className="relative flex items-center justify-center w-full overflow-hidden rounded-xl py-1">
      <canvas
        ref={canvasRef}
        width={320}
        height={height}
        className="w-full max-w-[360px] h-[40px] drop-shadow-[0_0_12px_rgba(99,102,241,0.25)]"
      />
    </div>
  );
}
