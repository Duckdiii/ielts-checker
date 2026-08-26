export interface TopicInfo {
  id: string;
  nameVi: string;
  nameEn: string;
  icon: string;
  colorClass: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
}

export const IELTS_TOPICS: TopicInfo[] = [
  {
    id: 'animals',
    nameVi: 'Động vật & Sinh thái',
    nameEn: 'Animals & Wildlife',
    icon: '🐾',
    colorClass: 'amber',
    badgeBg: 'bg-amber-500/10',
    badgeBorder: 'border-amber-500/30',
    badgeText: 'text-amber-400',
  },
  {
    id: 'education',
    nameVi: 'Giáo dục & Học thuật',
    nameEn: 'Education & Academia',
    icon: '🎓',
    colorClass: 'blue',
    badgeBg: 'bg-blue-500/10',
    badgeBorder: 'border-blue-500/30',
    badgeText: 'text-blue-400',
  },
  {
    id: 'environment',
    nameVi: 'Môi trường & Khí hậu',
    nameEn: 'Environment & Climate',
    icon: '🌿',
    colorClass: 'emerald',
    badgeBg: 'bg-emerald-500/10',
    badgeBorder: 'border-emerald-500/30',
    badgeText: 'text-emerald-400',
  },
  {
    id: 'technology',
    nameVi: 'Công nghệ & Đổi mới',
    nameEn: 'Technology & AI',
    icon: '💻',
    colorClass: 'indigo',
    badgeBg: 'bg-indigo-500/10',
    badgeBorder: 'border-indigo-500/30',
    badgeText: 'text-indigo-400',
  },
  {
    id: 'economy',
    nameVi: 'Kinh tế & Kinh doanh',
    nameEn: 'Economy & Business',
    icon: '💼',
    colorClass: 'yellow',
    badgeBg: 'bg-yellow-500/10',
    badgeBorder: 'border-yellow-500/30',
    badgeText: 'text-yellow-400',
  },
  {
    id: 'health',
    nameVi: 'Y tế & Sức khỏe',
    nameEn: 'Health & Medicine',
    icon: '🏥',
    colorClass: 'rose',
    badgeBg: 'bg-rose-500/10',
    badgeBorder: 'border-rose-500/30',
    badgeText: 'text-rose-400',
  },
  {
    id: 'urban',
    nameVi: 'Đô thị & Xã hội',
    nameEn: 'Society & Urban Life',
    icon: '🏙️',
    colorClass: 'purple',
    badgeBg: 'bg-purple-500/10',
    badgeBorder: 'border-purple-500/30',
    badgeText: 'text-purple-400',
  },
  {
    id: 'culture',
    nameVi: 'Văn hóa & Nghệ thuật',
    nameEn: 'Culture & Arts',
    icon: '🎨',
    colorClass: 'pink',
    badgeBg: 'bg-pink-500/10',
    badgeBorder: 'border-pink-500/30',
    badgeText: 'text-pink-400',
  },
  {
    id: 'psychology',
    nameVi: 'Tâm lý học & Hành vi',
    nameEn: 'Psychology & Behavior',
    icon: '🧠',
    colorClass: 'cyan',
    badgeBg: 'bg-cyan-500/10',
    badgeBorder: 'border-cyan-500/30',
    badgeText: 'text-cyan-400',
  },
  {
    id: 'law',
    nameVi: 'Luật pháp & Chính phủ',
    nameEn: 'Law & Governance',
    icon: '⚖️',
    colorClass: 'slate',
    badgeBg: 'bg-slate-500/10',
    badgeBorder: 'border-slate-500/30',
    badgeText: 'text-slate-300',
  },
  {
    id: 'history',
    nameVi: 'Lịch sử & Khảo cổ',
    nameEn: 'History & Archaeology',
    icon: '🏺',
    colorClass: 'orange',
    badgeBg: 'bg-orange-500/10',
    badgeBorder: 'border-orange-500/30',
    badgeText: 'text-orange-400',
  },
  {
    id: 'tourism',
    nameVi: 'Du lịch & Khám phá',
    nameEn: 'Tourism & Travel',
    icon: '✈️',
    colorClass: 'teal',
    badgeBg: 'bg-teal-500/10',
    badgeBorder: 'border-teal-500/30',
    badgeText: 'text-teal-400',
  },
];

export function getTopicInfo(topicName?: string): TopicInfo {
  if (!topicName || !topicName.trim()) {
    return {
      id: 'general',
      nameVi: 'Học thuật tổng hợp',
      nameEn: 'General Academic',
      icon: '📚',
      colorClass: 'indigo',
      badgeBg: 'bg-indigo-500/10',
      badgeBorder: 'border-indigo-500/30',
      badgeText: 'text-indigo-400',
    };
  }

  const clean = topicName.toLowerCase().trim();

  // Try exact match or partial match
  const found = IELTS_TOPICS.find(
    (t) =>
      clean.includes(t.nameVi.toLowerCase()) ||
      t.nameVi.toLowerCase().includes(clean) ||
      clean.includes(t.nameEn.toLowerCase()) ||
      t.nameEn.toLowerCase().includes(clean) ||
      clean.includes(t.id)
  );

  if (found) return found;

  // Keyword-based fallback matching
  if (clean.includes('động vật') || clean.includes('animal') || clean.includes('wildlife') || clean.includes('sinh học') || clean.includes('chim') || clean.includes('cá')) {
    return IELTS_TOPICS.find((t) => t.id === 'animals')!;
  }
  if (clean.includes('giáo dục') || clean.includes('học thuật') || clean.includes('education') || clean.includes('trường') || clean.includes('sinh viên') || clean.includes('nghiên cứu')) {
    return IELTS_TOPICS.find((t) => t.id === 'education')!;
  }
  if (clean.includes('môi trường') || clean.includes('khí hậu') || clean.includes('climate') || clean.includes('environment') || clean.includes('rừng') || clean.includes('năng lượng') || clean.includes('ecology')) {
    return IELTS_TOPICS.find((t) => t.id === 'environment')!;
  }
  if (clean.includes('công nghệ') || clean.includes('tech') || clean.includes('ai') || clean.includes('máy tính') || clean.includes('khoa học') || clean.includes('internet') || clean.includes('digital')) {
    return IELTS_TOPICS.find((t) => t.id === 'technology')!;
  }
  if (clean.includes('kinh tế') || clean.includes('kinh doanh') || clean.includes('tài chính') || clean.includes('economy') || clean.includes('business') || clean.includes('tiền') || clean.includes('thị trường')) {
    return IELTS_TOPICS.find((t) => t.id === 'economy')!;
  }
  if (clean.includes('y tế') || clean.includes('sức khỏe') || clean.includes('bệnh') || clean.includes('health') || clean.includes('medicine') || clean.includes('dinh dưỡng') || clean.includes('thuốc')) {
    return IELTS_TOPICS.find((t) => t.id === 'health')!;
  }
  if (clean.includes('đô thị') || clean.includes('xã hội') || clean.includes('thành phố') || clean.includes('urban') || clean.includes('society') || clean.includes('dân số') || clean.includes('cộng đồng')) {
    return IELTS_TOPICS.find((t) => t.id === 'urban')!;
  }
  if (clean.includes('văn hóa') || clean.includes('nghệ thuật') || clean.includes('culture') || clean.includes('art') || clean.includes('âm nhạc') || clean.includes('truyền thông')) {
    return IELTS_TOPICS.find((t) => t.id === 'culture')!;
  }
  if (clean.includes('tâm lý') || clean.includes('psychology') || clean.includes('cảm xúc') || clean.includes('hành vi') || clean.includes('não bộ')) {
    return IELTS_TOPICS.find((t) => t.id === 'psychology')!;
  }
  if (clean.includes('luật') || clean.includes('tội phạm') || clean.includes('chính phủ') || clean.includes('law') || clean.includes('crime') || clean.includes('chính sách')) {
    return IELTS_TOPICS.find((t) => t.id === 'law')!;
  }

  // Generic customized topic
  return {
    id: 'custom',
    nameVi: topicName,
    nameEn: topicName,
    icon: '🏷️',
    colorClass: 'indigo',
    badgeBg: 'bg-indigo-500/10',
    badgeBorder: 'border-indigo-500/30',
    badgeText: 'text-indigo-400',
  };
}
