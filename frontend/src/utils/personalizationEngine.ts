import { UserProfile, UserProgress, VocabItem, WordSet } from '../types';

export interface DailyPersonalizedMission {
  id: string;
  title: string;
  subtitle: string;
  mode: string;
  targetCount: number;
  completedCount: number;
  icon: string;
  category: 'vocab' | 'speaking' | 'review' | 'booster';
  xpReward: number;
  isCompleted: boolean;
  priorityTag?: string;
}

export interface PersonalizedPlanSummary {
  daysUntilExam: number | null;
  bandGap: number;
  studyPaceRecommendation: string;
  dailyMissions: DailyPersonalizedMission[];
  recommendedTopics: string[];
  coachingMessage: string;
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Calculates days remaining until target exam date
 */
export function getDaysUntilExam(targetDateStr?: string): number | null {
  if (!targetDateStr) return null;
  const targetTime = new Date(targetDateStr).getTime();
  if (isNaN(targetTime)) return null;

  const now = Date.now();
  const diffDays = Math.ceil((targetTime - now) / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

/**
 * Generates personalized daily study missions and AI guidance tailored to user profile
 */
export function generatePersonalizedPlan(
  profile: UserProfile,
  progress: UserProgress,
  words: VocabItem[]
): PersonalizedPlanSummary {
  const daysUntilExam = getDaysUntilExam(profile.targetExamDate);
  const currentBand = profile.currentBand || 6.0;
  const targetBand = profile.targetBand || 7.5;
  const bandGap = Math.max(0, Number((targetBand - currentBand).toFixed(1)));
  const budget = profile.dailyBudgetMinutes || 30;

  // Determine urgency level
  let urgencyLevel: 'low' | 'medium' | 'high' | 'critical' = 'medium';
  if (daysUntilExam !== null) {
    if (daysUntilExam <= 14) urgencyLevel = 'critical';
    else if (daysUntilExam <= 45) urgencyLevel = 'high';
    else if (daysUntilExam <= 90) urgencyLevel = 'medium';
    else urgencyLevel = 'low';
  }

  // Determine Goal-based Topic Recommendations
  let recommendedTopics: string[] = [];
  switch (profile.studyGoal) {
    case 'study_abroad':
      recommendedTopics = [
        'Giáo dục & Học thuật Đại học',
        'Khoa học, Trí tuệ Nhân tạo & Công nghệ',
        'Môi trường & Biến đổi Khí hậu',
        'Văn hóa, Lịch sử & Nghệ thuật',
      ];
      break;
    case 'immigration':
      recommendedTopics = [
        'Xã hội, Dân số & Đời sống Đô thị',
        'Pháp luật, Chính sách & Quyền công dân',
        'Giao thông, Cơ sở hạ tầng & Nhà ở',
        'Môi trường sống & Y tế Cộng đồng',
      ];
      break;
    case 'work_career':
      recommendedTopics = [
        'Kinh tế, Thương mại & Thị trường Toàn cầu',
        'Công nghệ Số, Chuyển đổi & Tự động hóa',
        'Lãnh đạo, Nhân sự & Môi trường Công sở',
        'Marketing, Truyền thông & Quảng cáo',
      ];
      break;
    case 'graduation':
      recommendedTopics = [
        'Giáo dục & Phương pháp Học tập Hiện đại',
        'Tâm lý học, Động lực & Hành vi Con người',
        'Công nghệ Thông tin & Đời sống Số',
        'Bảo vệ Môi trường & Năng lượng Tái tạo',
      ];
      break;
    default:
      recommendedTopics = [
        'Động vật hoang dã & Đa dạng sinh học',
        'Công nghệ cao & Kỷ nguyên AI',
        'Sức khỏe thể chất & Tinh thần',
        'Toàn cầu hóa & Giao lưu Văn hóa',
      ];
      break;
  }

  // Merge with user's explicitly interested topics
  if (profile.interestedTopics && profile.interestedTopics.length > 0) {
    recommendedTopics = Array.from(new Set([...profile.interestedTopics, ...recommendedTopics])).slice(0, 5);
  }

  // Generate Daily Missions matching budget and priority skills
  const dailyMissions: DailyPersonalizedMission[] = [];
  const todayRecord = progress.studyHistory.find(
    (h) => h.date === new Date().toISOString().split('T')[0]
  );
  const wordsStudiedToday = todayRecord?.wordsStudied || 0;

  // 1. Spaced Repetition Mission (Tailored to budget)
  const targetSrsCount = budget <= 15 ? 15 : budget <= 30 ? 25 : budget <= 45 ? 40 : 60;
  dailyMissions.push({
    id: 'mission_srs_vocab',
    title: 'Ôn tập Phản xạ Từ Vựng SRS',
    subtitle: `Hoàn thành ${targetSrsCount} từ theo thuật toán giãn cách FSRS`,
    mode: 'flashcard',
    targetCount: targetSrsCount,
    completedCount: Math.min(targetSrsCount, wordsStudiedToday),
    icon: '⚡',
    category: 'vocab',
    xpReward: 50,
    isCompleted: wordsStudiedToday >= targetSrsCount,
    priorityTag: 'Bắt buộc',
  });

  // 2. High-Band Speaking Drill
  const speakingDone = progress.studyHistory.filter(
    (h) => h.mode.includes('speaking') || h.mode.includes('shadowing')
  ).length;
  dailyMissions.push({
    id: 'mission_speaking_drill',
    title: 'Luyện 1 Lượt Speaking AI',
    subtitle: `Thực hành đối thoại phản xạ hoặc Part 2 bám sát mục tiêu Band ${targetBand}`,
    mode: 'speaking',
    targetCount: 1,
    completedCount: speakingDone > 0 ? 1 : 0,
    icon: '🎙️',
    category: 'speaking',
    xpReward: 80,
    isCompleted: speakingDone > 0,
    priorityTag: targetBand >= 7.0 ? 'Trọng tâm Band 7.5+' : 'Khuyên dùng',
  });

  // 3. Band Booster / Upgrade Speech (If target is 7.0+)
  if (targetBand >= 7.0 || profile.prioritySkills.includes('band_booster')) {
    dailyMissions.push({
      id: 'mission_band_booster',
      title: 'Nâng cấp Câu nói lên Band 8.0',
      subtitle: 'Biến câu từ vựng cơ bản thành cụm Collocation C1/C2 học thuật',
      mode: 'speech-upgrade',
      targetCount: 2,
      completedCount: 1,
      icon: '🚀',
      category: 'booster',
      xpReward: 60,
      isCompleted: false,
      priorityTag: 'Bứt phá Band',
    });
  }

  // 4. Quick Reflex Drill / Cloze Test
  if (budget >= 30) {
    dailyMissions.push({
      id: 'mission_quick_drill',
      title: 'Luyện Phản Xạ Nhanh (Speed Drill)',
      subtitle: 'Thử thách phản xạ từ vựng và tư duy dưới áp lực thời gian',
      mode: 'quick-drill',
      targetCount: 1,
      completedCount: 0,
      icon: '⏱️',
      category: 'review',
      xpReward: 40,
      isCompleted: false,
    });
  }

  // Generate Coaching Advice
  let coachingMessage = '';
  if (urgencyLevel === 'critical') {
    coachingMessage = `⚡ Bạn chỉ còn ${daysUntilExam} ngày trước kỳ thi! Hãy tập trung 80% thời gian vào các cụm Collocation C1/C2 và các chiến thuật phản xạ Speaking Part 2 & Part 3 để tối ưu Band điểm nhanh nhất.`;
  } else if (bandGap >= 1.5) {
    coachingMessage = `🎯 Để nâng từ Band ${currentBand} lên Band ${targetBand} (+${bandGap} Band), bạn cần tích lũy tối thiểu 30 từ vựng C1/C2 mỗi tuần và duy trì 1 buổi Shadowing Lab mỗi ngày để chuẩn hóa ngữ điệu.`;
  } else {
    coachingMessage = `🌟 Bạn đang có phong độ rất tốt hướng tới mục tiêu Band ${targetBand}. Hãy duy trì chuỗi học ${progress.streakDays} ngày và tập trung mở rộng vốn từ ở chuyên đề "${recommendedTopics[0]}".`;
  }

  // Pace recommendation
  let studyPaceRecommendation = '';
  if (budget <= 15) {
    studyPaceRecommendation = 'Tốc độ Sprint ngắn: Tối ưu 15 phút mỗi ngày với Flashcard và 1 câu hỏi Speaking phản xạ nhanh.';
  } else if (budget <= 30) {
    studyPaceRecommendation = 'Tốc độ Chuẩn: 30 phút/ngày (20p từ vựng SRS + 10p Speaking mô phỏng AI).';
  } else {
    studyPaceRecommendation = 'Tốc độ Chuyên sâu: 45-60+ phút/ngày (Luyện toàn diện Từ vựng, Shadowing, Full Mock và Nâng cấp Band 8.0).';
  }

  return {
    daysUntilExam,
    bandGap,
    studyPaceRecommendation,
    dailyMissions,
    recommendedTopics,
    coachingMessage,
    urgencyLevel,
  };
}
