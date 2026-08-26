import { LearnerWeaknessItem, SpeakingPortfolioItem, WeaknessCategory } from '../types';
import { loadSpeakingPortfolio } from './speakingStorage';

const STORAGE_KEY_CUSTOM_WEAKNESSES = 'ielts_learner_custom_weaknesses_v1';

// Benchmark baseline weaknesses commonly encountered by IELTS candidates
const BASELINE_WEAKNESSES: LearnerWeaknessItem[] = [
  {
    id: 'trap-past-tense-ed',
    title: 'Quên chia thì Quá khứ đơn (/ed/) khi kể chuyện',
    category: 'grammar_tenses',
    categoryLabelVi: 'Ngữ pháp & Thì (Tenses)',
    frequencyCount: 7,
    severity: 'critical',
    warningHeadline: 'Chú ý: Bạn có xu hướng quên đuôi /ed/ khi nói về trải nghiệm quá khứ trong Part 2!',
    detailedExplanationVi:
      'Khi kể lại một chuyến đi, sự kiện hay người đã gặp trong quá khứ (đặc biệt ở Part 2), não bộ thường bị cuốn theo việc tìm từ vựng dẫn đến nói ở thì Hiện tại đơn (e.g. "When I visit that city..." thay vì "When I visited...").',
    cambridgeExaminerDeductionVi:
      'Giám khảo chấm GRA (Grammatical Range & Accuracy) sẽ không thể cho Band 7.0+ nếu các câu kể trong quá khứ bị sai thì có hệ thống.',
    examplesFromUser: [
      {
        context: 'Describe a memorable journey you went on.',
        errorPart: 'When I arrive at the station, the train already leave...',
        correction: 'When I arrived at the station, the train had already left...',
        date: '18/08/2026',
        partName: 'Part 2 Cue Card',
      },
      {
        context: 'Tell me about your favorite childhood toy.',
        errorPart: 'My father buy it for me when I am six years old.',
        correction: 'My father bought it for me when I was six years old.',
        date: '16/08/2026',
        partName: 'Part 1 Interview',
      },
    ],
    prescribedDrill: {
      instructionVi: 'Luyện phản xạ lập tức khóa thì Quá Khứ (Past Simple / Past Continuous) ngay từ 3 giây mở đầu câu.',
      targetRule: 'Chủ ngữ + V2/ed (lived, thought, bought, underwent, experienced).',
      practicePrompts: [
        {
          prompt: 'Luyện nói câu: "Năm ngoái tôi đã quyết định tham gia một khóa học trực tuyến."',
          modelCorrectionVi: 'Last year, I decidedly enrolled in an intensive online course.',
          targetFocus: 'V2/ed: enrolled, decidedly',
        },
        {
          prompt: 'Luyện nói câu: "Khi tôi còn là học sinh trung học, tôi thường đi xe đạp đến trường."',
          modelCorrectionVi: 'Back when I was a high schooler, I used to commute by bicycle daily.',
          targetFocus: 'was, used to commute',
        },
      ],
    },
    status: 'active',
    lastOccurredTimestamp: Date.now() - 86400000,
  },
  {
    id: 'trap-ending-sounds-s-z',
    title: 'Nuốt âm đuôi /s/, /z/ và /ks/ ở danh từ số nhiều & ngôi thứ 3',
    category: 'pronunciation_endings',
    categoryLabelVi: 'Phát âm & Âm đuôi (Final Sounds)',
    frequencyCount: 6,
    severity: 'critical',
    warningHeadline: 'Nhắc nhở: Hãy bật rõ âm đuôi /s/ và /z/ ở các từ số nhiều & động từ đi với He/She/It!',
    detailedExplanationVi:
      'Tiếng Việt là ngôn ngữ đơn âm tiết không có phụ âm cuối bật gió. Thí sinh thường vô thức nuốt mất âm /s/ (costs, advantages, aspects, helps) khiến giám khảo khó nhận biết bạn dùng số ít hay số nhiều.',
    cambridgeExaminerDeductionVi:
      'Lỗi này trừ điểm kép cả tiêu chí Pronunciation (Pron) vì thiếu âm đuôi và Grammatical Accuracy (GRA) vì nghe như sai chia động từ.',
    examplesFromUser: [
      {
        context: 'What are the main advantages of living in a big city?',
        errorPart: 'There are many advantage... it cost a lot of money...',
        correction: 'There are many advantages (/ɪz/)... it costs (/sts/) a substantial amount of money...',
        date: '17/08/2026',
        partName: 'Part 3 Discussion',
      },
    ],
    prescribedDrill: {
      instructionVi: 'Nguyên tắc bật âm đuôi: Kéo dài âm xì /s/ nhẹ nhàng trong 0.2s để tạo độ chắc chắn cho phát âm.',
      targetRule: 'advantages (/ɪz/), circumstances (/sɪz/), methods (/dz/), creates (/ts/).',
      practicePrompts: [
        {
          prompt: 'Luyện nói: "This innovative policy provides numerous benefits to local citizens."',
          modelCorrectionVi: 'Chú ý các âm đuôi: provides (/z/), numerous (/s/), benefits (/ts/), citizens (/nz/).',
          targetFocus: 'Âm đuôi /z/, /ts/',
        },
      ],
    },
    status: 'active',
    lastOccurredTimestamp: Date.now() - 2 * 86400000,
  },
  {
    id: 'trap-filler-like-you-know',
    title: 'Lạm dụng từ đệm rác ("like", "you know", "actually")',
    category: 'fluency_fillers',
    categoryLabelVi: 'Độ trôi chảy & Từ đệm (Fluency & Fillers)',
    frequencyCount: 5,
    severity: 'moderate',
    warningHeadline: 'Mẹo vàng: Thay thế từ "like" & "you know" bằng các Stalling Fillers học thuật (Band 7.5+)!',
    detailedExplanationVi:
      'Khi bí ý hoặc dịch nhẩm tiếng Việt sang tiếng Anh, bạn thường chèn từ "like" hoặc "you know" lặp lại 5-8 lần trong một lượt nói. Điều này làm bài nói mang phong cách giao tiếp đường phố quá mức (informal).',
    cambridgeExaminerDeductionVi:
      'Làm giảm điểm Fluency & Coherence (FC) xuống Band 6.0 vì biểu hiện của việc thiếu mạch lạc và vốn từ nối học thuật.',
    examplesFromUser: [
      {
        context: 'Why do people enjoy outdoor activities?',
        errorPart: 'Well, like, because it is, you know, healthy and, like, relaxing...',
        correction: 'To put it succinctly, engaging in open-air pursuits affords individuals invaluable physical and psychological rejuvenation.',
        date: '15/08/2026',
        partName: 'Part 3 Discussion',
      },
    ],
    prescribedDrill: {
      instructionVi: 'Khi cần 2 giây suy nghĩ, hãy dùng các cụm: "That is quite a multifaceted issue...", "To look at it from another angle..." thay vì "like... you know".',
      targetRule: 'Academic Stalling Connectors.',
      practicePrompts: [
        {
          prompt: 'Luyện mở đầu câu khi gặp câu hỏi khó:',
          modelCorrectionVi: '"That is certainly an intriguing question to ponder..." (Nói chậm rãi để não kịp tạo ý).',
          targetFocus: 'Stalling Connector Band 8.0',
        },
      ],
    },
    status: 'active',
    lastOccurredTimestamp: Date.now() - 3 * 86400000,
  },
  {
    id: 'trap-lexical-repetition-very-good',
    title: 'Lặp lại tính từ cơ bản (good, bad, very, important)',
    category: 'lexical_repetition',
    categoryLabelVi: 'Từ vựng & Độ phong phú (Lexical Resource)',
    frequencyCount: 4,
    severity: 'moderate',
    warningHeadline: 'Nâng cấp từ vựng: Hãy thay "very important" bằng "paramount" hoặc "crucial"!',
    detailedExplanationVi:
      'Xu hướng sử dụng các tính từ quen thuộc cấp độ A2-B1 thay vì kích hoạt các từ vựng học thuật C1/C2 đã lưu trong bộ Flashcard.',
    cambridgeExaminerDeductionVi:
      'Không thể đạt Band 7.0+ Lexical Resource nếu không sử dụng linh hoạt collocations đắt giá và ít phổ biến (less common lexical items).',
    examplesFromUser: [
      {
        context: 'How important is artificial intelligence today?',
        errorPart: 'AI is very good and very important for companies...',
        correction: 'AI plays a pivotal role and is undeniably indispensable for contemporary enterprises...',
        date: '14/08/2026',
        partName: 'Part 1 & 3',
      },
    ],
    prescribedDrill: {
      instructionVi: 'Kỹ thuật Paraphrasing tức thì: Bất cứ khi nào định nói "important", lập tức chuyển sang "imperative", "pivotal", "paramount".',
      targetRule: 'Important ➔ Pivotal / Paramount / Indispensable / Crucial.',
      practicePrompts: [
        {
          prompt: 'Thay thế cụm "very necessary for our future":',
          modelCorrectionVi: '"of utmost importance for our foreseeable future" hoặc "imperative for our long-term trajectory".',
          targetFocus: 'C1 Lexical Upgrades',
        },
      ],
    },
    status: 'improving',
    lastOccurredTimestamp: Date.now() - 4 * 86400000,
  },
  {
    id: 'trap-subject-verb-agreement',
    title: 'Lỗi bất hòa hợp Chủ ngữ - Động từ (Subject-Verb Agreement)',
    category: 'grammar_agreement',
    categoryLabelVi: 'Ngữ pháp & Chia động từ',
    frequencyCount: 4,
    severity: 'moderate',
    warningHeadline: 'Cảnh báo: Hãy chú ý chia động từ số ít với các danh từ không đếm được (Information, Advice, Traffic)!',
    detailedExplanationVi:
      'Các danh từ như "Technology", "Information", "Equipment", "Everyone" thường bị chia với động từ số nhiều hoặc thêm "s" sai quy tắc.',
    cambridgeExaminerDeductionVi:
      'Lỗi chia động từ cơ bản sẽ ngăn cản thí sinh đạt Band 7.0 tiêu chí Grammatical Range & Accuracy.',
    examplesFromUser: [
      {
        context: 'How does modern technology affect communication?',
        errorPart: 'Modern technology make people feel closer, but everyone have their own phone.',
        correction: 'Modern technology makes people feel closer, but everyone has their own smartphone.',
        date: '12/08/2026',
        partName: 'Part 3 Discussion',
      },
    ],
    prescribedDrill: {
      instructionVi: 'Ghi nhớ: "Everyone / Everybody / Each person" LUÔN đi cùng động từ số ít (has, is, thrives, operates).',
      targetRule: 'Everyone + V_singular (is / has / needs).',
      practicePrompts: [
        {
          prompt: 'Luyện câu: "Mỗi công dân đều có trách nhiệm bảo vệ môi trường."',
          modelCorrectionVi: 'Every single citizen bears the moral responsibility to safeguard the ecosystem.',
          targetFocus: 'Every citizen bears (số ít)',
        },
      ],
    },
    status: 'improving',
    lastOccurredTimestamp: Date.now() - 6 * 86400000,
  },
];

/**
 * Load learner weaknesses aggregated from real portfolio history + custom notes
 */
export async function getLearnerWeaknesses(): Promise<LearnerWeaknessItem[]> {
  try {
    const portfolio = await loadSpeakingPortfolio();
    const storedCustomJson = localStorage.getItem(STORAGE_KEY_CUSTOM_WEAKNESSES);
    const customList: LearnerWeaknessItem[] = storedCustomJson ? JSON.parse(storedCustomJson) : [];

    // Combine base with dynamic analysis from portfolio
    let dynamicWeaknesses = [...BASELINE_WEAKNESSES];

    // Analyze portfolio items to count actual occurrences
    if (portfolio && portfolio.length > 0) {
      let pastTenseErrors = 0;
      let endingSoundErrors = 0;
      let fillerOveruse = 0;
      let grammarAgreementErrors = 0;

      portfolio.forEach((item) => {
        const text = (item.transcript || '').toLowerCase();
        const evalRes = item.evalResult as any;

        // Check filler count
        if (evalRes?.criteriaScores?.fluencyCoherence?.fillerWordsFound) {
          const fillers = evalRes.criteriaScores.fluencyCoherence.fillerWordsFound;
          if (fillers.some((f: string) => f.includes('like') || f.includes('you know'))) {
            fillerOveruse += 1;
          }
        }

        // Check grammar errors
        if (evalRes?.criteriaScores?.grammaticalRange?.grammarErrors) {
          const errors = evalRes.criteriaScores.grammaticalRange.grammarErrors;
          errors.forEach((err: any) => {
            const exp = (err.explanationVi || '').toLowerCase();
            const orig = (err.original || '').toLowerCase();
            if (exp.includes('quá khứ') || exp.includes('past') || exp.includes('thì') || exp.includes('ed')) {
              pastTenseErrors += 1;
            }
            if (exp.includes('số nhiều') || exp.includes('chia động từ') || exp.includes('số ít') || exp.includes('ngôi')) {
              grammarAgreementErrors += 1;
            }
            if (exp.includes('âm đuôi') || exp.includes('/s/') || exp.includes('/ed/')) {
              endingSoundErrors += 1;
            }
          });
        }
      });

      // Boost frequency counts with actual extracted stats
      dynamicWeaknesses = dynamicWeaknesses.map((w) => {
        if (w.id === 'trap-past-tense-ed' && pastTenseErrors > 0) {
          return { ...w, frequencyCount: w.frequencyCount + pastTenseErrors };
        }
        if (w.id === 'trap-ending-sounds-s-z' && endingSoundErrors > 0) {
          return { ...w, frequencyCount: w.frequencyCount + endingSoundErrors };
        }
        if (w.id === 'trap-filler-like-you-know' && fillerOveruse > 0) {
          return { ...w, frequencyCount: w.frequencyCount + fillerOveruse };
        }
        if (w.id === 'trap-subject-verb-agreement' && grammarAgreementErrors > 0) {
          return { ...w, frequencyCount: w.frequencyCount + grammarAgreementErrors };
        }
        return w;
      });
    }

    // Merge custom weaknesses
    const mergedMap = new Map<string, LearnerWeaknessItem>();
    dynamicWeaknesses.forEach((item) => mergedMap.set(item.id, item));
    customList.forEach((item) => mergedMap.set(item.id, item));

    return Array.from(mergedMap.values()).sort((a, b) => b.frequencyCount - a.frequencyCount);
  } catch (err) {
    console.error('Error in getLearnerWeaknesses:', err);
    return BASELINE_WEAKNESSES;
  }
}

/**
 * Get top 5 most critical weaknesses for dashboard and radar views
 */
export async function getTop5Weaknesses(): Promise<LearnerWeaknessItem[]> {
  const all = await getLearnerWeaknesses();
  return all.slice(0, 5);
}

/**
 * Get a contextual pre-session warning tailored to the upcoming practice mode / part
 */
export async function getPreSessionWarning(
  part?: 1 | 2 | 3 | 'part2' | 'mock' | 'drill' | 'full'
): Promise<{
  id: string;
  title: string;
  headline: string;
  subtitle: string;
  tipVi: string;
  categoryLabelVi: string;
  drillRule: string;
} | null> {
  const weaknesses = await getLearnerWeaknesses();
  const activeWeaknesses = weaknesses.filter((w) => w.status !== 'mastered');
  if (!activeWeaknesses.length) return null;

  // If part 2 or mock, prioritize past tense narrative or filler traps
  if (part === 2 || part === 'part2') {
    const pastTense = activeWeaknesses.find((w) => w.category === 'grammar_tenses');
    if (pastTense) {
      return {
        id: pastTense.id,
        title: pastTense.title,
        headline: pastTense.warningHeadline,
        subtitle: 'Lỗi này xuất hiện ' + pastTense.frequencyCount + ' lần trong các bài thi thử trước đó của bạn!',
        tipVi: 'Hãy nhớ: Khi bắt đầu kể một sự việc trong quá khứ, hãy giữ thì Quá Khứ Đơn (V2/ed) xuyên suốt.',
        categoryLabelVi: pastTense.categoryLabelVi,
        drillRule: pastTense.prescribedDrill.targetRule,
      };
    }
  }

  // General top weakness
  const top = activeWeaknesses[0];
  return {
    id: top.id,
    title: top.title,
    headline: top.warningHeadline,
    subtitle: `AI phát hiện bạn lặp lại bẫy lỗi này ${top.frequencyCount} lần. Đừng để mất điểm đáng tiếc!`,
    tipVi: top.prescribedDrill.instructionVi,
    categoryLabelVi: top.categoryLabelVi,
    drillRule: top.prescribedDrill.targetRule,
  };
}

/**
 * Update status of a weakness (e.g. mark as improving or mastered)
 */
export async function updateWeaknessStatus(
  id: string,
  status: 'active' | 'improving' | 'mastered'
): Promise<void> {
  const all = await getLearnerWeaknesses();
  const updated = all.map((item) => (item.id === id ? { ...item, status } : item));
  localStorage.setItem(STORAGE_KEY_CUSTOM_WEAKNESSES, JSON.stringify(updated));
}

/**
 * Add a custom user error note / weakness
 */
export async function addCustomWeakness(
  weakness: Omit<LearnerWeaknessItem, 'id' | 'lastOccurredTimestamp'>
): Promise<LearnerWeaknessItem> {
  const all = await getLearnerWeaknesses();
  const newItem: LearnerWeaknessItem = {
    ...weakness,
    id: 'custom-trap-' + Date.now(),
    lastOccurredTimestamp: Date.now(),
  };
  const updated = [newItem, ...all];
  localStorage.setItem(STORAGE_KEY_CUSTOM_WEAKNESSES, JSON.stringify(updated));
  return newItem;
}
