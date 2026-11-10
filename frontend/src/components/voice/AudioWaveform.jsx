import React, { useEffect, useRef } from 'react';

const AudioWaveform = ({ isRecording }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let phase = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const width = canvas.width;
      const height = canvas.height;
      const centerY = height / 2;
      const bars = 36;
      const barWidth = 4;
      const gap = (width - bars * barWidth) / (bars + 1);

      for (let i = 0; i < bars; i++) {
        const x = gap + i * (barWidth + gap);
        let barHeight;

        if (isRecording) {
          // Dynamic undulating sound wave
          const wave = Math.sin(phase + i * 0.3) * Math.cos(phase * 0.7 + i * 0.15);
          const randomJitter = Math.random() * 8;
          barHeight = Math.max(6, Math.abs(wave) * (height * 0.75) + randomJitter);
        } else {
          // Gentle resting ripple
          barHeight = 4 + Math.sin(phase * 0.5 + i * 0.2) * 2;
        }

        const y = centerY - barHeight / 2;

        // Gradient from light blue to deep blue
        const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
        if (isRecording) {
          gradient.addColorStop(0, '#60A5FA'); // blue-400
          gradient.addColorStop(0.5, '#2563EB'); // blue-600
          gradient.addColorStop(1, '#1D4ED8'); // blue-700
        } else {
          gradient.addColorStop(0, '#CBD5E1'); // slate-300
          gradient.addColorStop(1, '#94A3B8'); // slate-400
        }

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 3);
        ctx.fill();
      }

      phase += isRecording ? 0.18 : 0.04;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isRecording]);

  return (
    <div className="w-full max-w-md h-20 flex items-center justify-center bg-slate-50/70 border border-slate-200/80 rounded-2xl p-2 shadow-inner">
      <canvas ref={canvasRef} width={380} height={70} className="w-full h-full" />
    </div>
  );
};

export default AudioWaveform;

