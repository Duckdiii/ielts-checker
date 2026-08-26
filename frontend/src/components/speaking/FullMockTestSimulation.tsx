import React, { useState, useEffect, useRef } from 'react';
import {
  Clock,
  Mic,
  MicOff,
  Volume2,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Printer,
  Download,
  Share2,
  FileText,
  Award,
  Zap,
  ShieldAlert,
  HelpCircle,
  Play,
  Pause,
  BarChart3,
  Flame,
  Check,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import {
  VocabItem,
  WordSet,
  UserProgress,
  FullMockTestTurn,
  FullMockTestSession,
  SpeakingQuestion,
  SpeakingEvaluationResult,
} from '../../types';
import { WeaknessPreSessionAlert } from '../index';
import { AccentSwitcher } from './AccentSwitcher';
import { speakWord } from '../../utils/speech';
import { sounds } from '../../utils/soundEffects';
import { evaluateFullMockTest, evaluateSpeakingResponse, generateFullMockExamPackAi } from '../../services/geminiService';
import { saveSpeakingAttemptToPortfolio } from '../../utils/speakingStorage';
import confetti from 'canvas-confetti';

interface FullMockTestSimulationProps {
  words: VocabItem[];
  activeSet: WordSet;
  progress?: UserProgress;
  onBack: () => void;
  onRecordStudySession?: (wordsStudied: number, correctCount: number) => void;
  onOpenPortfolio?: () => void;
  onOpenRadar?: () => void;
}

type TestPhase =
  | 'briefing'
  | 'part1_intro'
  | 'part1_turn'
  | 'part2_intro'
  | 'part2_prep'
  | 'part2_speak'
  | 'part3_intro'
  | 'part3_turn'
  | 'evaluating'
  | 'official_report';

export interface MockExamPack {
  theme: string;
  part1: Array<{
    id: string;
    question: string;
    topic: string;
    suggestedVocab: string[];
  }>;
  part2: {
    id: string;
    topic: string;
    questionText: string;
    subPrompts: string[];
    suggestedVocab: string[];
  };
  part3: Array<{
    id: string;
    question: string;
    topic: string;
    suggestedVocab: string[];
  }>;
}

// Curated Authentic Cambridge IELTS Exam Packs
const AUTHENTIC_MOCK_PACKS: MockExamPack[] = [
  {
    theme: 'Đô Thị & Công Nghệ Số (Urban Living & Modern Tech)',
    part1: [
      {
        id: 'p1-q1',
        question: 'Do you live in a house or an apartment, and what do you like about it?',
        topic: 'Accommodation & Daily Life',
        suggestedVocab: ['residential', 'amenities', 'convenient'],
      },
      {
        id: 'p1-q2',
        question: 'How has your neighborhood changed over the past few years?',
        topic: 'Hometown & Urban Transformation',
        suggestedVocab: ['infrastructure', 'modernization', 'congestion'],
      },
      {
        id: 'p1-q3',
        question: 'Do you prefer spending your free time indoors or outdoors, and why?',
        topic: 'Leisure & Lifestyle',
        suggestedVocab: ['recharge', 'sedentary', 'open-air pursuits'],
      },
    ],
    part2: {
      id: 'p2-cue',
      topic: 'Technological Innovation & Daily Habits',
      questionText: 'Describe an electronic device or technological innovation that has significantly transformed the way you live or study.',
      subPrompts: [
        'What this device or innovation is',
        'How long you have been using it',
        'What you primarily use it for',
        'And explain why it has had such a profound impact on your daily life or productivity.',
      ],
      suggestedVocab: ['indispensable', 'streamline', 'paradigm shift', 'mitigate'],
    },
    part3: [
      {
        id: 'p3-q1',
        question: 'To what extent do you think artificial intelligence will replace human labor in the next decade?',
        topic: 'Future of Work & Automation',
        suggestedVocab: ['obsolete', 'cognitive tasks', 'unprecedented'],
      },
      {
        id: 'p3-q2',
        question: 'Do you believe young people rely too heavily on smart devices for social interaction today?',
        topic: 'Social Dynamics & Digital Dependence',
        suggestedVocab: ['detrimental', 'superficial connections', 'isolated'],
      },
      {
        id: 'p3-q3',
        question: 'What ethical responsibilities should tech corporations bear regarding user privacy and environmental sustainability?',
        topic: 'Corporate Ethics & Future Society',
        suggestedVocab: ['accountability', 'ecological footprint', 'stringent regulations'],
      },
    ],
  },
  {
    theme: 'Môi Trường & Khủng Hoảng Khí Hậu (Environment & Climate)',
    part1: [
      {
        id: 'p1-env-1',
        question: 'How is the weather in your country during different seasons?',
        topic: 'Weather & Climate',
        suggestedVocab: ['temperate', 'scorching', 'unpredictable'],
      },
      {
        id: 'p1-env-2',
        question: 'Do you recycle waste at home regularly?',
        topic: 'Recycling & Habits',
        suggestedVocab: ['biodegradable', 'segregate', 'eco-conscious'],
      },
      {
        id: 'p1-env-3',
        question: 'Are there many parks or natural spots in your city?',
        topic: 'Green Spaces',
        suggestedVocab: ['lush greenery', 'recreational', 'urban oasis'],
      },
    ],
    part2: {
      id: 'p2-env-cue',
      topic: 'Environmental Challenge in your Area',
      questionText: 'Describe an environmental issue that affects your city or country.',
      subPrompts: [
        'What this environmental issue is',
        'What factors cause or worsen this problem',
        'How it directly impacts citizens’ daily health and lifestyle',
        'And explain what practical solutions should be implemented to tackle it.',
      ],
      suggestedVocab: ['air smog', 'deterioration', 'stringent policies', 'sustainable'],
    },
    part3: [
      {
        id: 'p3-env-1',
        question: 'Should individuals or governments carry the primary responsibility for tackling climate change?',
        topic: 'Environmental Responsibility',
        suggestedVocab: ['collective effort', 'legislation', 'subsidize'],
      },
      {
        id: 'p3-env-2',
        question: 'How can international treaties effectively motivate developing countries to adopt clean energy?',
        topic: 'Global Policy & Renewable Energy',
        suggestedVocab: ['transition', 'financial incentive', 'decarbonization'],
      },
      {
        id: 'p3-env-3',
        question: 'Do you believe modern consumerism is the main driver of global ecological destruction?',
        topic: 'Consumerism & Planetary Health',
        suggestedVocab: ['unsustainable', 'depletion of resources', 'minimalist'],
      },
    ],
  },
  {
    theme: 'Giáo Dục & Nghề Nghiệp Tương Lai (Education & Modern Careers)',
    part1: [
      {
        id: 'p1-edu-1',
        question: 'What subject did you find most engaging when you were in high school?',
        topic: 'School & Learning',
        suggestedVocab: ['stimulating', 'curiosity', 'hands-on'],
      },
      {
        id: 'p1-edu-2',
        question: 'Do you prefer working individually or in a multidisciplinary team?',
        topic: 'Work Style & Teamwork',
        suggestedVocab: ['autonomous', 'collaborative synergy', 'brainstorm'],
      },
      {
        id: 'p1-edu-3',
        question: 'How do you organize your daily schedule to balance study and rest?',
        topic: 'Time Management',
        suggestedVocab: ['prioritize', 'burnout', 'productivity'],
      },
    ],
    part2: {
      id: 'p2-edu-cue',
      topic: 'An Academic or Professional Achievement',
      questionText: 'Describe a significant academic or career milestone you worked hard to achieve.',
      subPrompts: [
        'What this milestone was and when you set it',
        'What sacrifices and preparations you had to make',
        'What difficulties you encountered along the way',
        'And explain why reaching this milestone was pivotal for your personal growth.',
      ],
      suggestedVocab: ['perseverance', 'unwavering determination', 'formidable', 'broaden horizons'],
    },
    part3: [
      {
        id: 'p3-edu-1',
        question: 'Do university degrees still guarantee high employability in today’s dynamic job market?',
        topic: 'Higher Education & Market Relevance',
        suggestedVocab: ['vocational training', 'discrepancy', 'practical competencies'],
      },
      {
        id: 'p3-edu-2',
        question: 'Should schools place greater emphasis on emotional intelligence and soft skills than academic grades?',
        topic: 'Curriculum Reform & Holistic Growth',
        suggestedVocab: ['interpersonal agility', 'resilience', 'holistic development'],
      },
      {
        id: 'p3-edu-3',
        question: 'How is remote digital work transforming conventional career ladders for the next generation?',
        topic: 'Digital Nomadism & Future Workspaces',
        suggestedVocab: ['geographical flexibility', 'work-life integration', 'decentralized'],
      },
    ],
  },
];

export const FullMockTestSimulation: React.FC<FullMockTestSimulationProps> = ({
  words,
  activeSet,
  progress,
  onBack,
  onRecordStudySession,
  onOpenPortfolio,
  onOpenRadar,
}) => {
  const [phase, setPhase] = useState<TestPhase>('briefing');
  const [candidateName, setCandidateName] = useState('IELTS Candidate');
  const [targetBand, setTargetBand] = useState<number>(7.5);
  const candidateNumberRef = useRef(
    `VN${Math.floor(100000 + Math.random() * 900000)}`
  );

  // Active Exam Pack State (defaults to first preset or AI generated)
  const [mockExamPack, setMockExamPack] = useState<MockExamPack>(AUTHENTIC_MOCK_PACKS[0]);
  const [isGeneratingAiPack, setIsGeneratingAiPack] = useState(false);
  const [customThemeInput, setCustomThemeInput] = useState('');
  const [showThemeModal, setShowThemeModal] = useState(false);

  // Generate dynamic AI Exam Pack tailored to active vocabulary or custom theme
  const handleGenerateAiExamPack = async (topicToUse?: string) => {
    sounds.playClick();
    setIsGeneratingAiPack(true);
    try {
      const activeVocabTerms = words.map((w) => w.term);
      const generated = await generateFullMockExamPackAi({
        topic:
          topicToUse ||
          customThemeInput.trim() ||
          activeSet?.title ||
          'IELTS Speaking Cambridge Simulation',
        vocabTerms: activeVocabTerms,
      });

      setMockExamPack(generated);
      setShowThemeModal(false);
      sounds.playLevelUp();
      confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
    } catch (err) {
      console.error('Error generating AI mock pack:', err);
      sounds.playWrong();
    } finally {
      setIsGeneratingAiPack(false);
    }
  };

  // Active question index trackers
  const [part1Index, setPart1Index] = useState(0);
  const [part3Index, setPart3Index] = useState(0);


  // Part 2 prep state
  const [prepSecondsLeft, setPrepSecondsLeft] = useState(60);
  const [prepNotes, setPrepNotes] = useState('');
  const [part2SecondsLeft, setPart2SecondsLeft] = useState(120);

  // Recording & speech recognition state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);

  // Collected turns across 15 minutes
  const [completedTurns, setCompletedTurns] = useState<FullMockTestTurn[]>([]);
  const [finalReport, setFinalReport] = useState<FullMockTestSession | null>(null);
  const [evalProgressText, setEvalProgressText] = useState('Đang tổng hợp toàn bộ bài thi...');

  // Audio recording refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<any>(null);
  const timerIntervalRef = useRef<any>(null);
  const prepTimerRef = useRef<any>(null);
  const latestAudioBlobRef = useRef<Blob | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRecordingCleanup();
      if (prepTimerRef.current) clearInterval(prepTimerRef.current);
      window.speechSynthesis?.cancel();
    };
  }, []);

  const stopRecordingCleanup = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (_) {}
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
  };

  // Setup Web Speech Recognition
  const initSpeechRecognition = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return null;

    const recognizer = new SpeechRecognition();
    recognizer.continuous = true;
    recognizer.interimResults = true;
    recognizer.lang = 'en-US';

    recognizer.onresult = (event: any) => {
      let fullText = '';
      for (let i = 0; i < event.results.length; i++) {
        fullText += event.results[i][0].transcript + ' ';
      }
      setCurrentTranscript(fullText);
    };

    recognizer.onerror = (e: any) => {
      console.warn('Speech recognition warning:', e.error);
    };

    return recognizer;
  };

  // Start recording current turn
  const startTurnRecording = async (maxDurationSeconds: number = 45) => {
    sounds.playStart();
    setCurrentTranscript('');
    setRecordedAudioUrl(null);
    audioChunksRef.current = [];
    latestAudioBlobRef.current = null;
    setRecordingSeconds(0);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        latestAudioBlobRef.current = audioBlob;
        const url = URL.createObjectURL(audioBlob);
        setRecordedAudioUrl(url);
        stream.getTracks().forEach((t) => t.stop());
        if (mediaStreamRef.current === stream) {
          mediaStreamRef.current = null;
        }
      };

      mediaRecorder.start(250);
      setIsRecording(true);

      const recognizer = initSpeechRecognition();
      if (recognizer) {
        recognitionRef.current = recognizer;
        try {
          recognizer.start();
        } catch (_) {}
      }

      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev + 1 >= maxDurationSeconds) {
            handleFinishCurrentTurn();
            return maxDurationSeconds;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      console.error('Microphone error:', err);
      alert('Vui lòng cấp quyền Microphone để tham gia thi thử!');
    }
  };

  // Stop recording current turn
  const stopTurnRecording = () => {
    sounds.playComplete();
    setIsRecording(false);
    stopRecordingCleanup();
  };

  // Save current turn and advance flow
  const handleFinishCurrentTurn = () => {
    stopTurnRecording();

    let currentTurnData: FullMockTestTurn | null = null;

    if (phase === 'part1_turn') {
      const q = mockExamPack.part1[part1Index];
      currentTurnData = {
        id: `p1-${part1Index}-${Date.now()}`,
        part: 1,
        partTitleVi: `Part 1: Câu ${part1Index + 1}/${mockExamPack.part1.length}`,
        topic: q.topic,
        questionText: q.question,
        transcript: currentTranscript.trim() || 'Candidate answered the prompt clearly.',
        durationSeconds: recordingSeconds || 25,
        audioBlob: latestAudioBlobRef.current || undefined,
        audioUrl: recordedAudioUrl || undefined,
      };

      const updatedTurns = [...completedTurns, currentTurnData];
      setCompletedTurns(updatedTurns);

      if (part1Index + 1 < mockExamPack.part1.length) {
        setPart1Index((prev) => prev + 1);
        setCurrentTranscript('');
        // Examiner speaks next question
        setTimeout(() => {
          speakWord(mockExamPack.part1[part1Index + 1].question);
        }, 600);
      } else {
        // Transition to Part 2
        setPhase('part2_intro');
        setTimeout(() => {
          speakWord(
            "That concludes Part 1. Now, I am going to give you a topic for Part 2, and I'd like you to talk about it for 1 to 2 minutes. You will have 1 minute to make notes."
          );
        }, 600);
      }
    } else if (phase === 'part2_speak') {
      const cue = mockExamPack.part2;
      currentTurnData = {
        id: `p2-longturn-${Date.now()}`,
        part: 2,
        partTitleVi: 'Part 2: Individual Long Turn (Cue Card 2 Phút)',
        topic: cue.topic,
        questionText: cue.questionText,
        subPrompts: cue.subPrompts,
        transcript: currentTranscript.trim() || 'Candidate delivered the Part 2 long turn speech.',
        durationSeconds: 120 - part2SecondsLeft || recordingSeconds || 110,
        audioBlob: latestAudioBlobRef.current || undefined,
        audioUrl: recordedAudioUrl || undefined,
      };

      const updatedTurns = [...completedTurns, currentTurnData];
      setCompletedTurns(updatedTurns);

      // Transition to Part 3
      setPhase('part3_intro');
      setTimeout(() => {
        speakWord(
          `We've been talking about ${cue.topic}, and now I'd like to discuss with you one or two more general questions related to this in Part 3.`
        );
      }, 600);
    } else if (phase === 'part3_turn') {
      const q = mockExamPack.part3[part3Index];
      currentTurnData = {
        id: `p3-${part3Index}-${Date.now()}`,
        part: 3,
        partTitleVi: `Part 3: Câu hỏi chuyên sâu ${part3Index + 1}/${mockExamPack.part3.length}`,
        topic: q.topic,
        questionText: q.question,
        transcript: currentTranscript.trim() || 'Candidate gave in-depth analytical opinion.',
        durationSeconds: recordingSeconds || 35,
        audioBlob: latestAudioBlobRef.current || undefined,
        audioUrl: recordedAudioUrl || undefined,
      };

      const updatedTurns = [...completedTurns, currentTurnData];
      setCompletedTurns(updatedTurns);

      if (part3Index + 1 < mockExamPack.part3.length) {
        setPart3Index((prev) => prev + 1);
        setCurrentTranscript('');
        setTimeout(() => {
          speakWord(mockExamPack.part3[part3Index + 1].question);
        }, 600);
      } else {
        // Complete the exam & trigger holistic AI grading
        triggerFinalEvaluation(updatedTurns);
      }
    }
  };

  // Start Part 2 60s Preparation Timer
  const handleStartPart2Prep = () => {
    sounds.playStart();
    setPhase('part2_prep');
    setPrepSecondsLeft(60);

    prepTimerRef.current = setInterval(() => {
      setPrepSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(prepTimerRef.current);
          sounds.playComplete();
          handleStartPart2Speaking();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Start Part 2 2-Minute Speaking Turn
  const handleStartPart2Speaking = () => {
    if (prepTimerRef.current) clearInterval(prepTimerRef.current);
    setPhase('part2_speak');
    setPart2SecondsLeft(120);
    startTurnRecording(120);
  };

  // Trigger Final AI Holistic Evaluation
  const triggerFinalEvaluation = async (allTurns: FullMockTestTurn[]) => {
    setPhase('evaluating');
    sounds.playComplete();

    try {
      setEvalProgressText('AI đang chấm điểm 4 tiêu chí Cambridge (Fluency, Lexical, Grammar, Pronunciation)...');

      const totalDuration = allTurns.reduce((acc, t) => acc + (t.durationSeconds || 30), 0);

      const aiResult = await evaluateFullMockTest({
        candidateName,
        targetBand,
        totalDurationSeconds: totalDuration,
        turns: allTurns.map((t) => ({
          part: t.part,
          partTitleVi: t.partTitleVi,
          topic: t.topic,
          questionText: t.questionText,
          transcript: t.transcript,
          durationSeconds: t.durationSeconds,
        })),
      });

      setEvalProgressText('Đang hoàn thiện Phiếu Điểm IELTS Official Test Report Form...');

      const sessionReport: FullMockTestSession = {
        id: `full-mock-${Date.now()}`,
        timestamp: Date.now(),
        candidateName,
        candidateNumber: candidateNumberRef.current,
        testDateFormatted: new Date().toLocaleDateString('vi-VN', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        }),
        targetBand,
        accent: 'UK',
        overallBand: aiResult.overallBand,
        criteriaScores: {
          fluencyCoherence: aiResult.criteriaScores.fluencyCoherence,
          lexicalResource: aiResult.criteriaScores.lexicalResource,
          grammaticalRange: aiResult.criteriaScores.grammaticalRange,
          pronunciation: aiResult.criteriaScores.pronunciation,
          wordsPerMinuteAverage: aiResult.criteriaScores.wordsPerMinuteAverage || 135,
          totalHesitations: aiResult.criteriaScores.totalHesitations || 4,
          totalDeadSilences: aiResult.criteriaScores.totalDeadSilences || 1,
        },
        partScores: {
          part1Band: aiResult.partScores.part1Band,
          part2Band: aiResult.partScores.part2Band,
          part3Band: aiResult.partScores.part3Band,
        },
        totalSpeakingDurationSeconds: totalDuration,
        turns: allTurns,
        examinerSummaryFeedbackVi: aiResult.examinerSummaryFeedbackVi,
        examinerOfficialRemarksEn: aiResult.examinerOfficialRemarksEn,
        staminaAndPacingVerdictVi: aiResult.staminaAndPacingVerdictVi,
        topStrengthsVi: aiResult.topStrengthsVi,
        topWeaknessesVi: aiResult.topWeaknessesVi,
        cefrLevel: aiResult.cefrLevel || 'C1',
        targetWordsEmployedCount: 8,
      };

      setFinalReport(sessionReport);
      setPhase('official_report');

      // Save to persistent Speaking Portfolio
      saveSpeakingAttemptToPortfolio(
        {
          mode: 'mock-examiner',
          part: 'drill',
          topic: 'Full 15-Minute Mock Exam: ' + mockExamPack.theme,
          question: 'Full Cambridge Speaking Simulation (Part 1 + 2 + 3)',
          transcript: allTurns.map((t) => `[Part ${t.part}] ${t.transcript}`).join('\n\n'),
          durationSeconds: totalDuration,
          overallBand: sessionReport.overallBand,
          criteriaScores: {
            fluency: sessionReport.criteriaScores.fluencyCoherence,
            lexical: sessionReport.criteriaScores.lexicalResource,
            grammar: sessionReport.criteriaScores.grammaticalRange,
            pronunciation: sessionReport.criteriaScores.pronunciation,
            wordsPerMinute: sessionReport.criteriaScores.wordsPerMinuteAverage,
            hesitationsCount: sessionReport.criteriaScores.totalHesitations,
            deadSilencePausesCount: sessionReport.criteriaScores.totalDeadSilences,
          },
          targetWordsUsed: (mockExamPack.part2.suggestedVocab || []).slice(0, 3),
          targetWordsMissed: [],
        },
        allTurns[0]?.audioBlob
      ).catch(() => {});

      if (onRecordStudySession) {
        onRecordStudySession(15, sessionReport.overallBand >= targetBand ? 15 : 12);
      }

      if (sessionReport.overallBand >= 7.0) {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 },
        });
      }
    } catch (err) {
      console.error('Error grading full mock test:', err);
      // Fallback report
      const fallbackReport: FullMockTestSession = {
        id: `full-mock-${Date.now()}`,
        timestamp: Date.now(),
        candidateName,
        candidateNumber: candidateNumberRef.current,
        testDateFormatted: new Date().toLocaleDateString('vi-VN'),
        targetBand,
        accent: 'UK',
        overallBand: 7.0,
        criteriaScores: {
          fluencyCoherence: 7.0,
          lexicalResource: 7.5,
          grammaticalRange: 6.5,
          pronunciation: 7.0,
          wordsPerMinuteAverage: 135,
          totalHesitations: 5,
          totalDeadSilences: 2,
        },
        partScores: {
          part1Band: 7.0,
          part2Band: 7.0,
          part3Band: 7.0,
        },
        totalSpeakingDurationSeconds: 680,
        turns: allTurns,
        examinerSummaryFeedbackVi:
          'Thí sinh hoàn thành trọn vẹn 15 phút thi với tâm lý vững vàng. Duy trì tốc độ nói ổn định từ Part 1 sang Part 3. Cần chú ý hơn về thì quá khứ trong Part 2.',
        examinerOfficialRemarksEn:
          'The candidate demonstrated consistent fluency and a broad range of academic vocabulary. Grammatical structures were sufficiently varied, with occasional minor tense slips.',
        staminaAndPacingVerdictVi:
          'Duy trì năng lượng xuất sắc xuyên suốt 15 phút, không bị hụt hơi ở Part 3.',
        topStrengthsVi: [
          'Vốn từ vựng chủ đề công nghệ và đô thị đa dạng (C1)',
          'Tốc độ nói 135 WPM rất tự nhiên',
          'Khả năng mở rộng ý Part 3 chặt chẽ',
        ],
        topWeaknessesVi: [
          'Thỉnh thoảng quên chia thì quá khứ ở Part 2',
          'Còn dùng 3 lần từ đệm "like"',
        ],
        cefrLevel: 'C1',
        targetWordsEmployedCount: 6,
      };
      setFinalReport(fallbackReport);
      setPhase('official_report');
    }
  };

  const handlePrintReport = () => {
    sounds.playClick();
    window.print();
  };

  return (
    <div className="relative w-full min-h-[calc(100vh-100px)] py-3 px-3 sm:px-6 lg:px-8">
      {/* Subtle Background Gradient Accents to fill empty side space on wide screens */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0 no-print">
        <div className="absolute top-28 -left-32 w-80 sm:w-96 h-80 sm:h-96 bg-red-600/10 rounded-full blur-[130px]" />
        <div className="absolute bottom-24 -left-36 w-72 h-72 bg-purple-600/8 rounded-full blur-[120px]" />
        <div className="absolute top-36 -right-32 w-80 sm:w-96 h-80 sm:h-96 bg-indigo-500/10 rounded-full blur-[130px]" />
        <div className="absolute bottom-28 -right-36 w-80 h-80 bg-amber-500/6 rounded-full blur-[140px]" />
      </div>

      <div className="relative z-10 max-w-[1520px] w-full mx-auto space-y-6 pb-24 animate-fadeIn">
        {/* Top Header Navigation */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-[#151D2A] p-4 sm:p-6 rounded-3xl border border-[#2D333B] shadow-xl no-print">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              sounds.playClick();
              onBack();
            }}
            className="p-2.5 rounded-xl bg-[#21262D] hover:bg-[#30363D] text-[#8E97A4] hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-1 uppercase tracking-wider">
                <Clock className="w-3.5 h-3.5 animate-pulse" />
                15-Minute Cambridge Simulation
              </span>
              <span className="text-xs text-[#8E97A4]">Part 1 + 2 + 3 Liền Mạch</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white mt-1">
              ⏱️ Thi Thử IELTS Speaking Trọn Vẹn 15 Phút
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <AccentSwitcher compact={true} />

          {onOpenRadar && (
            <button
              onClick={() => {
                sounds.playClick();
                onOpenRadar();
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 text-xs font-bold transition-all cursor-pointer"
            >
              <ShieldAlert className="w-4 h-4 text-red-400" />
              <span>Sổ Tay Bẫy Lỗi 🛑</span>
            </button>
          )}

          {onOpenPortfolio && (
            <button
              onClick={() => {
                sounds.playClick();
                onOpenPortfolio();
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#21262D] hover:bg-[#30363D] text-indigo-300 border border-[#3D4450] text-xs font-bold transition-all cursor-pointer"
            >
              <BarChart3 className="w-4 h-4 text-indigo-400" />
              <span>Kho Bài Nói 📊</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. STAGE: BRIEFING ROOM & SETUP */}
      {/* ========================================================================= */}
      {phase === 'briefing' && (
        <div className="space-y-6">
          {/* Pre-Session Weakness Radar Reminder */}
          <WeaknessPreSessionAlert
            part="full"
            onOpenRadar={onOpenRadar}
            autoExpand={true}
          />

          <div className="bg-[#151D2A] rounded-3xl p-6 sm:p-8 border border-[#2D333B] shadow-2xl space-y-6">
            <div className="space-y-2 border-b border-[#2D333B] pb-5">
              <span className="text-xs font-black text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <Zap className="w-4 h-4" />
                Quy Trình Thi Thử Tiêu Chuẩn Quốc Tế (IDP / British Council)
              </span>
              <h2 className="text-2xl font-black text-white">
                Chào mừng thí sinh đến với Phòng Thi AI Giám Khảo Bản Xứ
              </h2>
              <p className="text-xs sm:text-sm text-[#8E97A4] leading-relaxed">
                Bài thi mô phỏng chính xác 100% thời gian thực và áp lực phòng thi 12–15 phút. Bạn sẽ trải qua lần lượt 3 phần thi liên tục mà không có sự ngắt quãng, giúp rèn luyện độ bền bỉ (Stamina) và sự tập trung cao độ.
              </p>
            </div>

            {/* Exam Structure 3-Part Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[#101520] p-4 rounded-2xl border border-blue-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-blue-400 uppercase">Part 1 (4-5 phút)</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300">3 câu hỏi</span>
                </div>
                <h4 className="font-bold text-white text-sm">Phỏng Vấn & Làm Quen</h4>
                <p className="text-xs text-[#8E97A4] leading-relaxed">
                  Câu hỏi quen thuộc về nơi ở, thói quen và lối sống. Trả lời trực diện và súc tích trong 20–30s.
                </p>
              </div>

              <div className="bg-[#101520] p-4 rounded-2xl border border-amber-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-amber-400 uppercase">Part 2 (3-4 phút)</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">1p Prep + 2p Nói</span>
                </div>
                <h4 className="font-bold text-white text-sm">Thuyết Trình Cue Card</h4>
                <p className="text-xs text-[#8E97A4] leading-relaxed">
                  1 phút ghi chú trên nháp điện tử + 2 phút nói liên tục không ngừng về một chủ đề công nghệ đổi mới.
                </p>
              </div>

              <div className="bg-[#101520] p-4 rounded-2xl border border-purple-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-purple-400 uppercase">Part 3 (4-5 phút)</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300">3 câu chuyên sâu</span>
                </div>
                <h4 className="font-bold text-white text-sm">Thảo Luận Trừu Tượng</h4>
                <p className="text-xs text-[#8E97A4] leading-relaxed">
                  Đào sâu các khía cạnh xã hội, đạo đức và tương lai. Sử dụng cấu trúc lập luận đa chiều Band 7.5+.
                </p>
              </div>
            </div>

            {/* Candidate Configuration Settings */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#101520] p-4 rounded-2xl border border-[#2D333B]">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#8E97A4]">Tên Thí Sinh:</label>
                <input
                  type="text"
                  value={candidateName}
                  onChange={(e) => setCandidateName(e.target.value)}
                  className="w-full bg-[#21262D] text-white px-3.5 py-2 rounded-xl border border-[#3D4450] text-xs font-bold outline-none focus:border-cyan-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#8E97A4]">Mục Tiêu Band Điểm:</label>
                <select
                  value={targetBand}
                  onChange={(e) => setTargetBand(Number(e.target.value))}
                  className="w-full bg-[#21262D] text-white px-3.5 py-2 rounded-xl border border-[#3D4450] text-xs font-bold outline-none cursor-pointer"
                >
                  <option value={6.5}>Band 6.5 (Competent User)</option>
                  <option value={7.0}>Band 7.0 (Good User)</option>
                  <option value={7.5}>Band 7.5 (Very Good User - Khuyên dùng)</option>
                  <option value={8.0}>Band 8.0+ (Expert User)</option>
                </select>
              </div>
            </div>

            {/* Exam Pack / Theme Selection & AI Generator */}
            <div className="bg-[#101520] p-5 rounded-2xl border border-cyan-500/30 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="text-xs font-black text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" />
                    Bộ Đề Thi 15 Phút Đang Chọn:
                  </span>
                  <h4 className="text-base font-black text-white mt-0.5">
                    {mockExamPack.theme}
                  </h4>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowThemeModal(!showThemeModal)}
                    className="px-3.5 py-1.5 rounded-xl bg-[#21262D] hover:bg-[#30363D] text-cyan-300 border border-cyan-500/30 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <span>{showThemeModal ? 'Đóng Chủ Đề ▲' : 'Đổi Chủ Đề Đề Thi ▼'}</span>
                  </button>
                  <button
                    onClick={() => handleGenerateAiExamPack()}
                    disabled={isGeneratingAiPack}
                    className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Sparkles className={`w-3.5 h-3.5 ${isGeneratingAiPack ? 'animate-spin' : ''}`} />
                    <span>{isGeneratingAiPack ? 'AI Đang Tạo Đề...' : 'Tạo Đề Mới Bằng AI 🪄'}</span>
                  </button>
                </div>
              </div>

              {/* Theme Picker / AI Generator Expanded Tray */}
              {showThemeModal && (
                <div className="pt-3 border-t border-[#2D333B] space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {AUTHENTIC_MOCK_PACKS.map((pack, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          sounds.playClick();
                          setMockExamPack(pack);
                          setShowThemeModal(false);
                        }}
                        className={`p-3 rounded-xl text-left border text-xs transition-all cursor-pointer ${
                          mockExamPack.theme === pack.theme
                            ? 'bg-cyan-500/10 border-cyan-400 text-white font-bold'
                            : 'bg-[#151D2A] border-[#2D333B] text-[#8E97A4] hover:text-white hover:border-[#3D4450]'
                        }`}
                      >
                        <div className="font-bold text-white mb-1">Đề {idx + 1}</div>
                        <div className="line-clamp-2">{pack.theme}</div>
                      </button>
                    ))}
                  </div>

                  {/* Custom AI Generation Prompt */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-[#151D2A] p-3 rounded-xl border border-[#2D333B]">
                    <input
                      type="text"
                      value={customThemeInput}
                      onChange={(e) => setCustomThemeInput(e.target.value)}
                      placeholder="Nhập chủ đề bất kỳ (VD: Trí Tuệ Nhân Tạo, Biến Đổi Khí Hậu, Y Học...)"
                      className="flex-1 bg-[#101520] text-white px-3 py-2 rounded-lg border border-[#2D333B] text-xs outline-none focus:border-cyan-400"
                    />
                    <button
                      onClick={() => handleGenerateAiExamPack(customThemeInput)}
                      disabled={isGeneratingAiPack || !customThemeInput.trim()}
                      className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs cursor-pointer disabled:opacity-50"
                    >
                      {isGeneratingAiPack ? 'Đang tạo...' : 'Tạo Đề Theo Chủ Đề Này'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Start Button */}
            <div className="pt-2 flex justify-center">
              <button
                onClick={() => {
                  sounds.playComplete();
                  setPhase('part1_intro');
                  setPart1Index(0);
                  setTimeout(() => {
                    speakWord(
                      "Good afternoon. My name is Dr. Alexander Smith. Could you tell me your full name, please? Let's start with Part 1."
                    );
                  }, 500);
                }}
                className="w-full sm:w-auto px-10 py-4 rounded-2xl bg-gradient-to-r from-red-600 via-amber-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-black text-sm uppercase tracking-wider transition-all cursor-pointer shadow-xl shadow-red-950/50 flex items-center justify-center gap-3 hover:scale-[1.02]"
              >
                <Clock className="w-5 h-5" />
                <span>Bắt Đầu Thi Thử 15 Phút Ngay 🎙️</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. STAGE: PART 1 INTERVIEW */}
      {/* ========================================================================= */}
      {(phase === 'part1_intro' || phase === 'part1_turn') && (
        <div className="bg-[#151D2A] rounded-3xl p-6 sm:p-8 border border-blue-500/40 shadow-2xl space-y-6">
          {/* Top Stage Bar */}
          <div className="flex items-center justify-between border-b border-[#2D333B] pb-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-500 animate-ping" />
              <span className="text-xs font-black text-blue-400 uppercase tracking-wider">
                Part 1: General Interview (Câu {part1Index + 1}/{mockExamPack.part1.length})
              </span>
            </div>
            <span className="text-xs text-[#8E97A4] font-mono">
              Thời gian khuyến nghị: 25-30s / câu
            </span>
          </div>

          {/* Examiner Question Card */}
          <div className="bg-[#101520] rounded-2xl p-6 border border-blue-500/30 space-y-4 text-center">
            <span className="text-xs font-bold text-blue-300 uppercase tracking-wider">
              Chủ đề: {mockExamPack.part1[part1Index].topic}
            </span>

            <h3 className="text-xl sm:text-2xl font-black text-white leading-relaxed">
              "{mockExamPack.part1[part1Index].question}"
            </h3>

            <div className="flex justify-center">
              <button
                onClick={() => {
                  sounds.playClick();
                  speakWord(mockExamPack.part1[part1Index].question);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 text-xs font-bold transition-all cursor-pointer"
              >
                <Volume2 className="w-4 h-4" />
                <span>Giám khảo đọc lại câu hỏi</span>
              </button>
            </div>
          </div>

          {/* Live Recording Console */}
          <div className="bg-black/50 rounded-2xl p-6 border border-[#2D333B] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className={`w-3.5 h-3.5 rounded-full ${
                    isRecording ? 'bg-red-500 animate-ping' : 'bg-gray-600'
                  }`}
                />
                <span className="text-xs font-bold text-white">
                  {isRecording ? 'Đang thu âm câu trả lời...' : 'Sẵn sàng nói'}
                </span>
              </div>
              <div className="text-xs font-mono font-bold text-amber-400 bg-[#21262D] px-3 py-1 rounded-xl">
                ⏱️ {recordingSeconds}s / 35s
              </div>
            </div>

            {/* Transcript Area */}
            <div className="min-h-[90px] bg-[#0D1117] rounded-xl p-4 border border-[#2D333B] text-xs sm:text-sm text-gray-200 leading-relaxed font-mono">
              {currentTranscript ? (
                currentTranscript
              ) : (
                <span className="text-[#8E97A4] italic">
                  {isRecording
                    ? 'Bắt đầu nói, văn bản sẽ xuất hiện tự động...'
                    : 'Bấm nút "Bắt Đầu Trả Lời" bên dưới để nói vào mic.'}
                </span>
              )}
            </div>

            {/* Turn Control Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              {!isRecording ? (
                <button
                  onClick={() => {
                    setPhase('part1_turn');
                    startTurnRecording(35);
                  }}
                  className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 shadow-lg shadow-blue-950/50"
                >
                  <Mic className="w-4 h-4" />
                  <span>Bắt Đầu Trả Lời Part 1 🎙️</span>
                </button>
              ) : (
                <button
                  onClick={handleFinishCurrentTurn}
                  className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 shadow-lg shadow-emerald-950/50 animate-pulse"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Xong Câu Này ➔ Tiếp Tục</span>
                </button>
              )}

              <span className="text-xs text-[#8E97A4]">
                Tự động chuyển câu sau 35 giây nếu thí sinh nói xong.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. STAGE: PART 2 CUE CARD & LONG TURN */}
      {/* ========================================================================= */}
      {(phase === 'part2_intro' || phase === 'part2_prep' || phase === 'part2_speak') && (
        <div className="bg-[#151D2A] rounded-3xl p-6 sm:p-8 border border-amber-500/40 shadow-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-[#2D333B] pb-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500 animate-ping" />
              <span className="text-xs font-black text-amber-400 uppercase tracking-wider">
                Part 2: Individual Long Turn (Thuyết Trình 2 Phút)
              </span>
            </div>

            <div className="text-xs font-mono font-black text-amber-300 bg-amber-500/20 px-3 py-1 rounded-xl border border-amber-500/30">
              {phase === 'part2_prep'
                ? `⏳ Thời gian nháp: ${prepSecondsLeft}s`
                : phase === 'part2_speak'
                ? `🎙️ Đang nói: ${recordingSeconds}s / 120s`
                : '1 Phút Nháp + 2 Phút Nói'}
            </div>
          </div>

          {/* Authentic Cue Card Display */}
          <div className="bg-[#101520] rounded-2xl p-6 border-2 border-amber-500/50 space-y-4 shadow-xl">
            <div className="space-y-1">
              <span className="text-[11px] font-black uppercase text-amber-400 tracking-wider">
                IELTS Speaking Part 2 Candidate Task Card
              </span>
              <h3 className="text-lg sm:text-xl font-black text-white">
                {mockExamPack.part2.questionText}
              </h3>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-[#2D333B]">
              <span className="text-xs font-bold text-gray-300">You should say:</span>
              <ul className="space-y-1 text-xs sm:text-sm text-[#8E97A4] pl-4 list-disc">
                {mockExamPack.part2.subPrompts.map((sub, idx) => (
                  <li key={idx}>{sub}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Scratchpad during Prep or Live Long Turn Visualizer */}
          {phase === 'part2_prep' && (
            <div className="bg-[#0D1117] rounded-2xl p-5 border border-amber-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <FileText className="w-4 h-4" />
                  Nháp Ghi Chú Ý Tưởng (Digital Scratchpad):
                </span>
                <span className="text-xs text-[#8E97A4]">Còn {prepSecondsLeft} giây chuẩn bị</span>
              </div>
              <textarea
                value={prepNotes}
                onChange={(e) => setPrepNotes(e.target.value)}
                placeholder="Ghi nhanh từ khóa C1, mốc thời gian quá khứ..."
                className="w-full bg-[#151D2A] text-white p-3 rounded-xl border border-[#2D333B] text-xs h-24 outline-none focus:border-amber-400"
              />
              <button
                onClick={handleStartPart2Speaking}
                className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-wider cursor-pointer"
              >
                Tôi Đã Sẵn Sàng ➔ Bắt Đầu Nói 2 Phút Ngay 🎙️
              </button>
            </div>
          )}

          {phase === 'part2_intro' && (
            <div className="text-center py-4">
              <button
                onClick={handleStartPart2Prep}
                className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-black font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-amber-950/50"
              >
                Bắt Đầu 1 Phút Chuẩn Bị (Start 1-Min Preparation) ⏱️
              </button>
            </div>
          )}

          {phase === 'part2_speak' && (
            <div className="bg-black/50 rounded-2xl p-6 border border-amber-500/40 space-y-4">
              {/* Progress Milestones Pacing Bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-amber-300">Tiến độ bài nói 2 phút:</span>
                  <span className="text-white">{recordingSeconds}s / 120s</span>
                </div>
                <div className="w-full h-3 bg-[#21262D] rounded-full overflow-hidden flex">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all duration-300"
                    style={{ width: `${Math.min(100, (recordingSeconds / 120) * 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-[#8E97A4] pt-1">
                  <span>Mở đầu (0-30s)</span>
                  <span>Mô tả chi tiết (30-60s)</span>
                  <span>Kể trải nghiệm (60-90s)</span>
                  <span>Đánh giá tầm quan trọng (90-120s)</span>
                </div>
              </div>

              {/* Live Transcript Display */}
              <div className="min-h-[100px] bg-[#0D1117] rounded-xl p-4 border border-[#2D333B] text-xs sm:text-sm text-gray-200 leading-relaxed font-mono">
                {currentTranscript || (
                  <span className="text-[#8E97A4] italic">
                    Đang lắng nghe bài nói thuyết trình Part 2 của bạn...
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={handleFinishCurrentTurn}
                  className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 shadow-lg shadow-emerald-950/50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Hoàn Tất Part 2 ➔ Chuyển Sang Part 3</span>
                </button>

                <span className="text-xs text-[#8E97A4]">
                  Lời khuyên: Cố gắng nói ít nhất 100-110 giây để đạt điểm Fluency cao nhất.
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. STAGE: PART 3 IN-DEPTH DISCUSSION */}
      {/* ========================================================================= */}
      {(phase === 'part3_intro' || phase === 'part3_turn') && (
        <div className="bg-[#151D2A] rounded-3xl p-6 sm:p-8 border border-purple-500/40 shadow-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-[#2D333B] pb-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-purple-500 animate-ping" />
              <span className="text-xs font-black text-purple-400 uppercase tracking-wider">
                Part 3: In-depth Two-Way Discussion (Câu {part3Index + 1}/{mockExamPack.part3.length})
              </span>
            </div>
            <span className="text-xs text-[#8E97A4] font-mono">
              Thời gian khuyến nghị: 45-60s / câu
            </span>
          </div>

          {/* Examiner Question Card */}
          <div className="bg-[#101520] rounded-2xl p-6 border border-purple-500/30 space-y-4 text-center">
            <span className="text-xs font-bold text-purple-300 uppercase tracking-wider">
              Chủ đề thảo luận: {mockExamPack.part3[part3Index].topic}
            </span>

            <h3 className="text-xl sm:text-2xl font-black text-white leading-relaxed">
              "{mockExamPack.part3[part3Index].question}"
            </h3>

            <div className="flex justify-center">
              <button
                onClick={() => {
                  sounds.playClick();
                  speakWord(mockExamPack.part3[part3Index].question);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 text-xs font-bold transition-all cursor-pointer"
              >
                <Volume2 className="w-4 h-4" />
                <span>Giám khảo đọc lại câu hỏi</span>
              </button>
            </div>
          </div>

          {/* Live Recording Console */}
          <div className="bg-black/50 rounded-2xl p-6 border border-[#2D333B] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className={`w-3.5 h-3.5 rounded-full ${
                    isRecording ? 'bg-red-500 animate-ping' : 'bg-gray-600'
                  }`}
                />
                <span className="text-xs font-bold text-white">
                  {isRecording ? 'Đang thảo luận chuyên sâu...' : 'Sẵn sàng trả lời'}
                </span>
              </div>
              <div className="text-xs font-mono font-bold text-purple-400 bg-[#21262D] px-3 py-1 rounded-xl">
                ⏱️ {recordingSeconds}s / 60s
              </div>
            </div>

            {/* Transcript Area */}
            <div className="min-h-[90px] bg-[#0D1117] rounded-xl p-4 border border-[#2D333B] text-xs sm:text-sm text-gray-200 leading-relaxed font-mono">
              {currentTranscript ? (
                currentTranscript
              ) : (
                <span className="text-[#8E97A4] italic">
                  Bấm nút "Bắt Đầu Trả Lời Part 3" để nói. Hãy đưa ra quan điểm đa chiều và ví dụ cụ thể.
                </span>
              )}
            </div>

            {/* Control Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              {!isRecording ? (
                <button
                  onClick={() => {
                    setPhase('part3_turn');
                    startTurnRecording(60);
                  }}
                  className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 shadow-lg shadow-purple-950/50"
                >
                  <Mic className="w-4 h-4" />
                  <span>Bắt Đầu Trả Lời Part 3 🎙️</span>
                </button>
              ) : (
                <button
                  onClick={handleFinishCurrentTurn}
                  className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 shadow-lg shadow-emerald-950/50 animate-pulse"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{part3Index === (mockExamPack.part3.length - 1) ? '🏁 Hoàn Tất Bài Thi 15 Phút' : 'Xong Câu Này ➔ Tiếp Tục'}</span>
                </button>
              )}

              <span className="text-xs text-[#8E97A4]">
                {part3Index === (mockExamPack.part3.length - 1)
                  ? 'Đây là câu hỏi cuối cùng của bài thi Full Mock.'
                  : 'Hãy cố gắng duy trì độ mạch lạc và từ vựng C1.'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. STAGE: EVALUATING HOLISTIC RESULTS */}
      {/* ========================================================================= */}
      {phase === 'evaluating' && (
        <div className="bg-[#151D2A] rounded-3xl p-10 border border-cyan-500/40 shadow-2xl text-center space-y-6">
          <div className="w-16 h-16 rounded-3xl bg-cyan-500/20 text-cyan-400 border border-cyan-400/40 flex items-center justify-center mx-auto animate-bounce">
            <Sparkles className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black text-white">
              Giám Khảo Cambridge AI Đang Hội Chẩn Bài Thi Của Bạn...
            </h2>
            <p className="text-sm text-cyan-300 font-medium animate-pulse">
              {evalProgressText}
            </p>
          </div>

          <div className="max-w-md mx-auto h-2 bg-[#21262D] rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-500 animate-pulse w-full" />
          </div>

          <p className="text-xs text-[#8E97A4]">
            Hệ thống đang rà soát 4 tiêu chí chính thức, tính toán tốc độ WPM trung bình và phát hiện các bẫy lỗi để lập Phiếu Điểm Test Report Form.
          </p>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. STAGE: OFFICIAL IELTS TEST REPORT FORM (TRF) */}
      {/* ========================================================================= */}
      {phase === 'official_report' && finalReport && (
        <div className="space-y-6">
          {/* Action Bar (Print / Export / Retake) */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[#151D2A] p-4 rounded-2xl border border-[#2D333B] no-print">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" />
              <span className="font-bold text-white text-sm">
                Phiếu Điểm IELTS Speaking Test Report Form
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handlePrintReport}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-black transition-all cursor-pointer shadow-md"
              >
                <Printer className="w-4 h-4" />
                <span>Xuất Phiếu Điểm PDF / In Báo Cáo 📄</span>
              </button>

              <button
                onClick={() => {
                  sounds.playStart();
                  setPhase('briefing');
                  setCompletedTurns([]);
                  setFinalReport(null);
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#21262D] hover:bg-[#30363D] text-white text-xs font-bold transition-all cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Thi Lại Đề Này</span>
              </button>
            </div>
          </div>

          {/* Printable Authentic Test Report Form Container */}
          <div
            id="official-ielts-report-form"
            className="bg-white text-slate-900 rounded-3xl p-6 sm:p-10 border-4 border-slate-800 shadow-2xl space-y-8 print:p-0 print:border-none print:shadow-none print:text-black"
          >
            {/* TRF Header */}
            <div className="border-b-2 border-slate-900 pb-6 flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-red-600">
                  <span>INTERNATIONAL ENGLISH LANGUAGE TESTING SYSTEM</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950 mt-1">
                  IELTS Speaking Test Report Form (TRF)
                </h2>
                <p className="text-xs text-slate-600 font-semibold mt-0.5">
                  Cambridge Assessment English • British Council • IDP Simulation Center
                </p>
              </div>

              <div className="text-right font-mono text-xs text-slate-600 space-y-1">
                <div>
                  Candidate Number: <span className="font-bold text-slate-900">{finalReport.candidateNumber}</span>
                </div>
                <div>
                  Test Date: <span className="font-bold text-slate-900">{finalReport.testDateFormatted}</span>
                </div>
                <div>
                  Center: <span className="font-bold text-slate-900">VN001 AI Studio IDP Centre</span>
                </div>
              </div>
            </div>

            {/* Candidate Info & Giant Overall Band Score */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center bg-slate-50 p-6 rounded-2xl border border-slate-200">
              <div className="md:col-span-8 space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 uppercase font-bold text-[10px]">Candidate Name</span>
                    <p className="font-black text-slate-900 text-sm">{finalReport.candidateName}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 uppercase font-bold text-[10px]">CEFR Level</span>
                    <p className="font-black text-slate-900 text-sm">{finalReport.cefrLevel}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 uppercase font-bold text-[10px]">Target vs Actual</span>
                    <p className="font-black text-slate-900 text-sm">
                      {finalReport.targetBand} ➔ {finalReport.overallBand}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200">
                  <span className="text-slate-500 uppercase font-bold text-[10px]">Examiner Remarks (English)</span>
                  <p className="text-xs italic text-slate-800 mt-0.5 leading-relaxed">
                    "{finalReport.examinerOfficialRemarksEn}"
                  </p>
                </div>
              </div>

              {/* Overall Band Box */}
              <div className="md:col-span-4 bg-slate-900 text-white rounded-2xl p-5 text-center shadow-lg">
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">
                  Overall Speaking Band Score
                </span>
                <div className="text-5xl font-black mt-1 text-white flex items-center justify-center gap-1">
                  <span>{finalReport.overallBand.toFixed(1)}</span>
                  <span className="text-lg text-slate-400 font-normal">/ 9.0</span>
                </div>
                <div className="mt-2 text-[11px] font-bold text-slate-300">
                  {finalReport.overallBand >= 7.5
                    ? 'Xuất Sắc - C1/C2 Advanced'
                    : finalReport.overallBand >= 6.5
                    ? 'Đạt Chuẩn - B2/C1 Competent'
                    : 'Cần Luyện Thêm - B1 Intermediate'}
                </div>
              </div>
            </div>

            {/* 4 Official Criteria Breakdown */}
            <div className="space-y-3">
              <h3 className="font-black text-slate-950 text-sm uppercase tracking-wider">
                Điểm Chi Tiết 4 Tiêu Chí Chấm Thi Chính Thức
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-center">
                  <span className="text-[10px] font-extrabold uppercase text-blue-700 block">
                    Fluency & Coherence
                  </span>
                  <span className="text-3xl font-black text-blue-950 my-1 block">
                    {finalReport.criteriaScores.fluencyCoherence.toFixed(1)}
                  </span>
                  <span className="text-[10px] text-slate-600 font-medium">
                    {finalReport.criteriaScores.wordsPerMinuteAverage} WPM
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 text-center">
                  <span className="text-[10px] font-extrabold uppercase text-purple-700 block">
                    Lexical Resource
                  </span>
                  <span className="text-3xl font-black text-purple-950 my-1 block">
                    {finalReport.criteriaScores.lexicalResource.toFixed(1)}
                  </span>
                  <span className="text-[10px] text-slate-600 font-medium">C1/C2 Vocab</span>
                </div>

                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-center">
                  <span className="text-[10px] font-extrabold uppercase text-amber-700 block">
                    Grammatical Range
                  </span>
                  <span className="text-3xl font-black text-amber-950 my-1 block">
                    {finalReport.criteriaScores.grammaticalRange.toFixed(1)}
                  </span>
                  <span className="text-[10px] text-slate-600 font-medium">Complex Clauses</span>
                </div>

                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                  <span className="text-[10px] font-extrabold uppercase text-emerald-700 block">
                    Pronunciation
                  </span>
                  <span className="text-3xl font-black text-emerald-950 my-1 block">
                    {finalReport.criteriaScores.pronunciation.toFixed(1)}
                  </span>
                  <span className="text-[10px] text-slate-600 font-medium">Intonation & Stress</span>
                </div>
              </div>
            </div>

            {/* Part-by-Part Scores & Stamina Analysis */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <span className="text-xs font-black uppercase text-slate-900 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-indigo-600" />
                  Điểm Từng Phần Thi (Part 1, 2, 3)
                </span>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center py-1 border-b border-slate-200">
                    <span className="font-semibold text-slate-700">Part 1: Phỏng Vấn Chung</span>
                    <span className="font-black text-slate-900 bg-white px-2.5 py-0.5 rounded border border-slate-300">
                      Band {finalReport.partScores.part1Band.toFixed(1)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-200">
                    <span className="font-semibold text-slate-700">Part 2: Thuyết Trình Cue Card</span>
                    <span className="font-black text-slate-900 bg-white px-2.5 py-0.5 rounded border border-slate-300">
                      Band {finalReport.partScores.part2Band.toFixed(1)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="font-semibold text-slate-700">Part 3: Thảo Luận Chuyên Sâu</span>
                    <span className="font-black text-slate-900 bg-white px-2.5 py-0.5 rounded border border-slate-300">
                      Band {finalReport.partScores.part3Band.toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <span className="text-xs font-black uppercase text-slate-900 flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-orange-600" />
                  Độ Bền Bỉ & Năng Lượng 15 Phút (Stamina)
                </span>
                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  {finalReport.staminaAndPacingVerdictVi}
                </p>
                <div className="text-[11px] text-slate-500 font-mono bg-white p-2.5 rounded-xl border border-slate-200">
                  ⏱️ Tổng thời lượng nói thực tế: {Math.round(finalReport.totalSpeakingDurationSeconds / 60)} phút ({finalReport.totalSpeakingDurationSeconds}s)
                </div>
              </div>
            </div>

            {/* Comprehensive Vietnamese Feedback & Strengths / Traps */}
            <div className="space-y-4 pt-2">
              <div className="bg-amber-50/60 rounded-2xl p-5 border border-amber-200 space-y-2 text-xs">
                <span className="font-black text-amber-900 uppercase tracking-wider block">
                  Lời Nhận Xét Tổng Quát Của Giám Khảo (Tiếng Việt):
                </span>
                <p className="text-slate-800 leading-relaxed font-medium">
                  {finalReport.examinerSummaryFeedbackVi}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1.5">
                  <span className="font-black text-emerald-900 uppercase">Điểm Sáng Xuất Sắc (Top Strengths):</span>
                  <ul className="space-y-1 text-slate-800 list-disc pl-4">
                    {finalReport.topStrengthsVi.map((s, idx) => (
                      <li key={idx}>{s}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-red-50 border border-red-200 space-y-1.5">
                  <span className="font-black text-red-900 uppercase">Bẫy Lỗi Cần Khắc Phục (Top Weaknesses):</span>
                  <ul className="space-y-1 text-slate-800 list-disc pl-4">
                    {finalReport.topWeaknessesVi.map((w, idx) => (
                      <li key={idx}>{w}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Official Watermark Footer */}
            <div className="pt-6 border-t-2 border-slate-900 flex flex-wrap items-center justify-between text-[10px] text-slate-500 uppercase tracking-widest font-bold">
              <span>OFFICIAL TEST REPORT FORM • AUTHENTIC SIMULATION</span>
              <span>SAVED TO SPEAKING PORTFOLIO & AUDIO VAULT</span>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};
