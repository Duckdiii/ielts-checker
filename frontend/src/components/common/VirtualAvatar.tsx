import React, { useEffect, useState } from 'react';
import { ChatPersona } from '../../types';

export type AvatarEmotion = 'idle' | 'listening' | 'thinking' | 'speaking' | 'happy' | 'encouraging' | 'surprised';

interface VirtualAvatarProps {
  persona: ChatPersona;
  emotion: AvatarEmotion;
  isSpeaking: boolean;
  isListening: boolean;
  audioLevel?: number;
  gender?: 'male' | 'female';
}

export const VirtualAvatar: React.FC<VirtualAvatarProps> = ({
  persona,
  emotion,
  isSpeaking,
  isListening,
  gender = persona.id === 'alex' || persona.id === 'liam' ? 'male' : 'female',
}) => {
  const [blink, setBlink] = useState(false);
  const [mouthOpen, setMouthOpen] = useState(0);

  // Natural blinking effect
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 180);
    }, 3800 + Math.random() * 2000);
    return () => clearInterval(blinkInterval);
  }, []);

  // Talking mouth animation when speaking
  useEffect(() => {
    if (!isSpeaking) {
      setMouthOpen(0);
      return;
    }

    const interval = setInterval(() => {
      setMouthOpen(Math.floor(Math.random() * 4)); // 0 to 3
    }, 120);

    return () => clearInterval(interval);
  }, [isSpeaking]);

  // Color schemes based on persona
  const getTheme = () => {
    switch (persona.id) {
      case 'alex':
        return {
          bgGrad: 'from-amber-600/30 via-orange-500/20 to-neutral-900',
          accent: '#F59E0B',
          glow: 'rgba(245, 158, 11, 0.4)',
          skin: '#FCD34D',
          hair: '#78350F',
          cloth: '#D97706',
          accessory: '☕',
        };
      case 'emma':
        return {
          bgGrad: 'from-emerald-600/30 via-teal-500/20 to-neutral-900',
          accent: '#10B981',
          glow: 'rgba(16, 185, 129, 0.4)',
          skin: '#FED7AA',
          hair: '#92400E',
          cloth: '#059669',
          accessory: '🌿',
        };
      case 'sarah':
        return {
          bgGrad: 'from-purple-600/30 via-indigo-500/20 to-neutral-900',
          accent: '#A855F7',
          glow: 'rgba(168, 85, 247, 0.4)',
          skin: '#FDE047',
          hair: '#1E1B4B',
          cloth: '#7C3AED',
          accessory: '💼',
        };
      case 'liam':
        return {
          bgGrad: 'from-sky-600/30 via-blue-500/20 to-neutral-900',
          accent: '#0EA5E9',
          glow: 'rgba(14, 165, 233, 0.4)',
          skin: '#FBBF24',
          hair: '#B45309',
          cloth: '#0284C7',
          accessory: '🌏',
        };
      case 'hannah':
      default:
        return {
          bgGrad: 'from-rose-600/30 via-pink-500/20 to-neutral-900',
          accent: '#F43F5E',
          glow: 'rgba(244, 63, 94, 0.4)',
          skin: '#FECDD3',
          hair: '#831843',
          cloth: '#E11D48',
          accessory: '🎨',
        };
    }
  };

  const theme = getTheme();

  return (
    <div className="relative flex flex-col items-center justify-center select-none w-full max-w-[340px] mx-auto">
      {/* Dynamic Ambient Background Glow */}
      <div
        className={`absolute -inset-4 rounded-full blur-3xl transition-all duration-700 pointer-events-none opacity-60 ${
          isSpeaking
            ? 'scale-110 opacity-90'
            : isListening
            ? 'scale-105 opacity-80 animate-pulse'
            : 'scale-95 opacity-50'
        }`}
        style={{ background: `radial-gradient(circle, ${theme.accent} 0%, transparent 70%)` }}
      />

      {/* Main Avatar Stage Card */}
      <div className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-full p-1.5 shadow-2xl bg-gradient-to-b from-white/20 via-white/5 to-transparent backdrop-blur-md flex items-center justify-center">
        {/* Animated Rotating Status Border */}
        <div
          className={`absolute inset-0 rounded-full border-2 transition-all duration-500 ${
            isSpeaking
              ? 'border-amber-400 animate-spin-slow ring-4 ring-amber-400/30'
              : isListening
              ? 'border-emerald-400 animate-pulse ring-4 ring-emerald-400/30'
              : emotion === 'thinking'
              ? 'border-indigo-400 animate-spin-slow'
              : 'border-white/10'
          }`}
          style={{ animationDuration: isSpeaking ? '8s' : '15s' }}
        />

        {/* Avatar Inner Canvas Box */}
        <div
          className={`w-full h-full rounded-full overflow-hidden relative flex items-center justify-center bg-gradient-to-b ${theme.bgGrad} border border-white/10 shadow-inner`}
        >
          {/* Subtle light reflections */}
          <div className="absolute top-2 left-1/4 w-32 h-16 bg-white/15 rounded-full blur-xl -rotate-12 pointer-events-none" />

          {/* SVG Animated Character */}
          <svg
            viewBox="0 0 200 200"
            className={`w-48 h-48 sm:w-56 sm:h-56 transition-transform duration-500 ease-out ${
              emotion === 'thinking'
                ? '-rotate-6 scale-95'
                : isSpeaking
                ? 'scale-105 translate-y-0.5'
                : isListening
                ? 'scale-100 -translate-y-1'
                : 'scale-100'
            }`}
          >
            {/* Body / Shoulders & Clothes */}
            <g transform="translate(0, 115)">
              <path
                d="M 40 85 C 40 45, 75 35, 100 35 C 125 35, 160 45, 160 85 Z"
                fill={theme.cloth}
                className="transition-all duration-300"
              />
              {/* Collar / Shirt Detail */}
              <path d="M 85 35 L 100 55 L 115 35 Z" fill="#FFFFFF" opacity="0.9" />
              <path d="M 95 38 L 100 52 L 105 38 Z" fill={theme.accent} />
            </g>

            {/* Neck */}
            <rect x="88" y="105" width="24" height="24" rx="6" fill="#E2A77A" />

            {/* Head */}
            <g transform="translate(0, 5)">
              {/* Ears */}
              <circle cx="58" cy="85" r="9" fill="#F4B886" />
              <circle cx="142" cy="85" r="9" fill="#F4B886" />
              {/* Ear details */}
              <circle cx="59" cy="85" r="5" fill="#E2A77A" />
              <circle cx="141" cy="85" r="5" fill="#E2A77A" />

              {/* Head Face Base */}
              <ellipse cx="100" cy="85" rx="42" ry="46" fill="#FCD5B5" />

              {/* Cheeks Blush */}
              <ellipse cx="74" cy="94" rx="7" ry="4" fill="#F87171" opacity={isSpeaking || emotion === 'happy' ? 0.6 : 0.3} />
              <ellipse cx="126" cy="94" rx="7" ry="4" fill="#F87171" opacity={isSpeaking || emotion === 'happy' ? 0.6 : 0.3} />

              {/* Hair Back & Front Styling */}
              {gender === 'male' ? (
                // Male Hair Style (Alex, Liam)
                <g fill={theme.hair}>
                  <path d="M 58 75 C 55 40, 80 25, 100 25 C 125 25, 145 40, 142 75 C 138 52, 125 45, 100 45 C 75 45, 62 52, 58 75 Z" />
                  <path d="M 68 45 Q 85 30 115 38 Q 135 32 142 50 C 130 38 90 38 68 45 Z" fill={theme.hair} opacity="0.9" />
                </g>
              ) : (
                // Female Hair Style (Emma, Sarah, Hannah)
                <g fill={theme.hair}>
                  <path d="M 52 85 C 48 35, 75 22, 100 22 C 125 22, 152 35, 148 85 C 158 115, 146 140, 138 145 C 146 115, 140 75, 135 60 C 120 40, 80 40, 65 60 C 60 75, 54 115, 62 145 C 54 140, 42 115, 52 85 Z" />
                  {/* Bangs */}
                  <path d="M 65 52 Q 100 68 135 52 Q 100 38 65 52 Z" fill={theme.hair} />
                </g>
              )}

              {/* Glasses for Sarah */}
              {persona.id === 'sarah' && (
                <g stroke="#1E1B4B" strokeWidth="2.5" fill="none">
                  <rect x="68" y="72" width="24" height="16" rx="4" fill="rgba(255,255,255,0.2)" />
                  <rect x="108" y="72" width="24" height="16" rx="4" fill="rgba(255,255,255,0.2)" />
                  <line x1="92" y1="80" x2="108" y2="80" />
                  <line x1="58" y1="78" x2="68" y2="78" />
                  <line x1="132" y1="78" x2="142" y2="78" />
                </g>
              )}

              {/* Eyebrows */}
              <g
                stroke={theme.hair}
                strokeWidth="3"
                strokeLinecap="round"
                fill="none"
                className="transition-all duration-300"
              >
                {emotion === 'thinking' ? (
                  <>
                    <path d="M 72 70 Q 82 66 90 73" />
                    <path d="M 110 68 Q 118 64 128 66" />
                  </>
                ) : emotion === 'surprised' ? (
                  <>
                    <path d="M 72 65 Q 82 62 90 66" />
                    <path d="M 110 66 Q 118 62 128 65" />
                  </>
                ) : (
                  <>
                    <path d="M 72 70 Q 82 66 90 70" />
                    <path d="M 110 70 Q 118 66 128 70" />
                  </>
                )}
              </g>

              {/* Eyes */}
              <g>
                {blink ? (
                  // Closed Eyes on Blink
                  <g stroke="#374151" strokeWidth="2.5" strokeLinecap="round" fill="none">
                    <path d="M 74 82 Q 81 87 88 82" />
                    <path d="M 112 82 Q 119 87 126 82" />
                  </g>
                ) : emotion === 'happy' ? (
                  // Smiling Curved Eyes
                  <g stroke="#1F2937" strokeWidth="3" strokeLinecap="round" fill="none">
                    <path d="M 73 83 Q 81 76 89 83" />
                    <path d="M 111 83 Q 119 76 127 83" />
                  </g>
                ) : (
                  // Open Big Expressive Eyes
                  <>
                    {/* Left Eye */}
                    <ellipse cx="81" cy="81" rx="6.5" ry="7.5" fill="#FFFFFF" />
                    <circle cx={isListening ? 80 : 81} cy="81" r="4.5" fill="#1F2937" />
                    <circle cx="79.5" cy="79" r="1.8" fill="#FFFFFF" />

                    {/* Right Eye */}
                    <ellipse cx="119" cy="81" rx="6.5" ry="7.5" fill="#FFFFFF" />
                    <circle cx={isListening ? 118 : 119} cy="81" r="4.5" fill="#1F2937" />
                    <circle cx="117.5" cy="79" r="1.8" fill="#FFFFFF" />
                  </>
                )}
              </g>

              {/* Nose */}
              <path d="M 98 87 Q 100 93 103 93" stroke="#D97706" strokeWidth="2" strokeLinecap="round" fill="none" />

              {/* Animated Expressive Mouth */}
              <g className="transition-all duration-150">
                {isSpeaking ? (
                  mouthOpen === 0 ? (
                    // Closed slightly smiling
                    <path d="M 91 106 Q 100 114 109 106" stroke="#991B1B" strokeWidth="2.5" strokeLinecap="round" fill="#DC2626" />
                  ) : mouthOpen === 1 ? (
                    // Open O shape
                    <ellipse cx="100" cy="107" rx="7" ry="6" fill="#7F1D1D" stroke="#991B1B" strokeWidth="1.5" />
                  ) : mouthOpen === 2 ? (
                    // Wide talking smile
                    <path d="M 89 104 Q 100 118 111 104 Z" fill="#991B1B" stroke="#7F1D1D" strokeWidth="1.5" />
                  ) : (
                    // Talking shape with teeth
                    <g>
                      <path d="M 90 104 Q 100 116 110 104 Z" fill="#991B1B" />
                      <rect x="94" y="104" width="12" height="3" rx="1.5" fill="#FFFFFF" />
                    </g>
                  )
                ) : emotion === 'happy' || emotion === 'encouraging' ? (
                  // Big Friendly Smile
                  <path d="M 88 103 Q 100 117 112 103 Z" fill="#DC2626" stroke="#991B1B" strokeWidth="1.5" />
                ) : emotion === 'thinking' ? (
                  // Puzzled slightly tilted mouth
                  <path d="M 92 107 Q 100 105 108 108" stroke="#991B1B" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                ) : isListening ? (
                  // Attentive soft smile
                  <path d="M 91 105 Q 100 111 109 105" stroke="#991B1B" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                ) : (
                  // Default gentle smile
                  <path d="M 91 105 Q 100 112 109 105" stroke="#991B1B" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                )}
              </g>
            </g>
          </svg>

          {/* Floating Accessory Badge */}
          <div className="absolute bottom-2 right-4 w-9 h-9 rounded-2xl bg-neutral-900/90 border border-white/20 flex items-center justify-center text-lg shadow-lg">
            {theme.accessory}
          </div>
        </div>
      </div>

      {/* Dynamic Status Pill */}
      <div className="mt-3 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#16191F]/90 border border-white/10 backdrop-blur-md shadow-lg">
        {isSpeaking ? (
          <>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
            <span className="text-xs font-bold text-amber-300">Đang trò chuyện cùng bạn...</span>
            <div className="flex items-center gap-0.5 ml-1">
              <span className="w-1 h-3 bg-amber-400 rounded-full animate-pulse" />
              <span className="w-1 h-4 bg-amber-400 rounded-full animate-pulse delay-75" />
              <span className="w-1 h-2 bg-amber-400 rounded-full animate-pulse delay-150" />
            </div>
          </>
        ) : isListening ? (
          <>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-xs font-bold text-emerald-300">Đang lắng nghe bạn nói...</span>
            <div className="flex items-center gap-0.5 ml-1">
              <span className="w-1 h-4 bg-emerald-400 rounded-full animate-pulse" />
              <span className="w-1 h-2 bg-emerald-400 rounded-full animate-pulse delay-100" />
              <span className="w-1 h-3 bg-emerald-400 rounded-full animate-pulse delay-200" />
            </div>
          </>
        ) : emotion === 'thinking' ? (
          <>
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-pulse" />
            <span className="text-xs font-bold text-indigo-300">Đang suy nghĩ câu trả lời...</span>
          </>
        ) : (
          <>
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            <span className="text-xs font-semibold text-slate-300">
              {persona.name} • {persona.roleTitleVi}
            </span>
          </>
        )}
      </div>
    </div>
  );
};
