import { AchievementBadge, UserProgress, VocabItem, UserProfile } from '../types';

export const ALL_ACHIEVEMENT_BADGES: AchievementBadge[] = [
  {
    id: 'first_step',
    title: 'Khởi Đầu Vững Chắc',
    description: 'Hoàn thành lượt ôn tập từ vựng đầu tiên',
    icon: '🌱',
    category: 'vocab',
    rarity: 'common',
  },
  {
    id: 'streak_3',
    title: 'Thói Quen Vàng (3 Ngày)',
    description: 'Duy trì chuỗi học liên tục 3 ngày',
    icon: '🔥',
    category: 'streak',
    rarity: 'common',
  },
  {
    id: 'streak_7',
    title: 'Chiến Binh Kiên Trì (7 Ngày)',
    description: 'Duy trì ngọn lửa học tập 7 ngày liên tiếp',
    icon: '⚡',
    category: 'streak',
    rarity: 'rare',
  },
  {
    id: 'streak_30',
    title: 'Huyền Thoại Kỷ Luật (30 Ngày)',
    description: 'Chinh phục chuỗi học tập 30 ngày không gián đoạn',
    icon: '👑',
    category: 'streak',
    rarity: 'legendary',
  },
  {
    id: 'vocab_50',
    title: 'Vốn Từ Nở Rộ (50 từ)',
    description: 'Thuần thục 50 từ vựng học thuật',
    icon: '📚',
    category: 'vocab',
    rarity: 'common',
  },
  {
    id: 'vocab_200',
    title: 'Bậc Thầy Từ Vựng (200 từ)',
    description: 'Nắm vững 200 từ vựng IELTS Band cao',
    icon: '🎓',
    category: 'vocab',
    rarity: 'rare',
  },
  {
    id: 'vocab_500',
    title: 'Từ Điển Sống (500+ từ)',
    description: 'Chinh phục hơn 500 từ vựng học thuật C1/C2',
    icon: '🧠',
    category: 'vocab',
    rarity: 'epic',
  },
  {
    id: 'speaking_novice',
    title: 'Giọng Nói Tự Tin',
    description: 'Hoàn thành bài luyện Speaking AI đầu tiên',
    icon: '🎙️',
    category: 'speaking',
    rarity: 'common',
  },
  {
    id: 'speaking_ladder_master',
    title: 'Bứt Phá Nấc Thang',
    description: 'Nâng cấp câu trả lời từ Band 5.5 lên Band 8.0 trong Speech Ladder',
    icon: '🚀',
    category: 'speaking',
    rarity: 'rare',
  },
  {
    id: 'shadowing_pro',
    title: 'Phát Âm Bản Xứ',
    description: 'Đạt điểm phát âm > 85% trong phòng Lab Shadowing',
    icon: '🎧',
    category: 'speaking',
    rarity: 'rare',
  },
  {
    id: 'band_7_club',
    title: 'Gia Nhập Band 7.0+',
    description: 'Đạt Lexical Band ước tính từ 7.0 trở lên',
    icon: '💎',
    category: 'accuracy',
    rarity: 'epic',
  },
  {
    id: 'band_8_elite',
    title: 'IELTS Band 8.0 Master',
    description: 'Chạm mốc Band 8.0 xuất sắc toàn diện',
    icon: '🏆',
    category: 'mastery',
    rarity: 'legendary',
  },
];

export function calculateUnlockedBadges(
  words: VocabItem[],
  progress: UserProgress,
  existingBadges: string[] = []
): string[] {
  const unlocked = new Set<string>(existingBadges);
  const masteredCount = words.filter((w) => w.mastery === 'mastered').length;

  if (progress.totalReviews >= 1) unlocked.add('first_step');
  if (progress.streakDays >= 3) unlocked.add('streak_3');
  if (progress.streakDays >= 7) unlocked.add('streak_7');
  if (progress.streakDays >= 30) unlocked.add('streak_30');

  if (masteredCount >= 50) unlocked.add('vocab_50');
  if (masteredCount >= 200) unlocked.add('vocab_200');
  if (masteredCount >= 500) unlocked.add('vocab_500');

  if (progress.studyHistory.some((h) => h.mode.includes('speaking') || h.mode.includes('shadowing'))) {
    unlocked.add('speaking_novice');
  }

  if (progress.estimatedBand >= 7.0) unlocked.add('band_7_club');
  if (progress.estimatedBand >= 8.0) unlocked.add('band_8_elite');

  return Array.from(unlocked);
}

export function calculateUserLevel(xp: number): { level: number; currentXp: number; nextLevelXp: number; progressPercent: number } {
  // Each level requires 150 * level XP
  let level = 1;
  let accumulated = 0;
  let nextThreshold = 150;

  while (xp >= accumulated + nextThreshold) {
    accumulated += nextThreshold;
    level += 1;
    nextThreshold = level * 150;
  }

  const currentLevelXp = xp - accumulated;
  const progressPercent = Math.min(100, Math.round((currentLevelXp / nextThreshold) * 100));

  return {
    level,
    currentXp: currentLevelXp,
    nextLevelXp: nextThreshold,
    progressPercent,
  };
}
