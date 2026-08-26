import confetti from 'canvas-confetti';

export function fireCelebration(): void {
  try {
    // Left burst
    confetti({
      particleCount: 40,
      angle: 60,
      spread: 55,
      origin: { x: 0.1, y: 0.7 },
      colors: ['#10B981', '#6366F1', '#F59E0B', '#EC4899', '#38BDF8'],
    });

    // Right burst
    confetti({
      particleCount: 40,
      angle: 120,
      spread: 55,
      origin: { x: 0.9, y: 0.7 },
      colors: ['#10B981', '#6366F1', '#F59E0B', '#EC4899', '#38BDF8'],
    });

    // Center star burst
    setTimeout(() => {
      confetti({
        particleCount: 60,
        spread: 100,
        origin: { y: 0.6 },
        colors: ['#F59E0B', '#10B981', '#8B5CF6'],
      });
    }, 200);
  } catch {}
}

export function fireStreakBonus(): void {
  try {
    confetti({
      particleCount: 30,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#F59E0B', '#FB923C', '#F43F5E'],
    });
  } catch {}
}

export function fireBandLevelUp(): void {
  try {
    const end = Date.now() + 1000;
    const interval: NodeJS.Timeout = setInterval(() => {
      if (Date.now() > end) {
        clearInterval(interval);
        return;
      }
      confetti({
        startVelocity: 30,
        spread: 360,
        ticks: 60,
        origin: { x: Math.random(), y: Math.random() * 0.5 },
        colors: ['#6366F1', '#A855F7', '#EC4899', '#38BDF8', '#10B981'],
      });
    }, 150);
  } catch {}
}
