export type EnglishAccent = 'en-US' | 'en-GB' | 'en-AU';

export interface AccentOption {
  code: EnglishAccent;
  label: string;
  flag: string;
  description: string;
}

export const ACCENT_OPTIONS: AccentOption[] = [
  {
    code: 'en-GB',
    label: 'UK (Anh - Anh)',
    flag: '🇬🇧',
    description: 'Giọng bản ngữ Anh chuẩn Cambridge / Oxford',
  },
  {
    code: 'en-US',
    label: 'US (Anh - Mỹ)',
    flag: '🇺🇸',
    description: 'Giọng chuẩn Bắc Mỹ phổ biến',
  },
  {
    code: 'en-AU',
    label: 'AU (Anh - Úc)',
    flag: '🇦🇺',
    description: 'Giọng Úc thường gặp trong IELTS Section 1 & 2',
  },
];

let currentGlobalAccent: EnglishAccent = 'en-GB'; // Default to IELTS UK accent

export function getGlobalAccent(): EnglishAccent {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('ielts_preferred_accent');
    if (saved && (saved === 'en-US' || saved === 'en-GB' || saved === 'en-AU')) {
      currentGlobalAccent = saved as EnglishAccent;
    }
  }
  return currentGlobalAccent;
}

export function setGlobalAccent(accent: EnglishAccent): void {
  currentGlobalAccent = accent;
  if (typeof window !== 'undefined') {
    localStorage.setItem('ielts_preferred_accent', accent);
  }
}

/**
 * Enhanced text-to-speech with Accent Switcher (UK / US / AU)
 */
export function speakWord(
  text: string,
  rate: number = 0.9,
  accentOverride?: EnglishAccent
): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    console.warn('Web Speech API is not supported in this browser.');
    return;
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  // Clean term (remove slashes, brackets)
  const cleanText = text.replace(/[\/\(\)\[\]]/g, '').trim();
  if (!cleanText) return;

  const utterance = new SpeechSynthesisUtterance(cleanText);
  utterance.rate = rate;

  const targetAccent = accentOverride || getGlobalAccent();
  utterance.lang = targetAccent;

  const voices = window.speechSynthesis.getVoices();

  // Search voices matching target accent with highest naturalness priority
  let matchedVoice = voices.find(
    (v) =>
      v.lang.toLowerCase().replace('_', '-').startsWith(targetAccent.toLowerCase()) &&
      (v.name.includes('Natural') ||
        v.name.includes('Google') ||
        v.name.includes('Neural') ||
        v.name.includes('Premium') ||
        v.name.includes('Daniel') ||
        v.name.includes('George') ||
        v.name.includes('Arthur') ||
        v.name.includes('Oliver') ||
        v.name.includes('Samantha') ||
        v.name.includes('Karen') ||
        v.name.includes('Catherine') ||
        v.name.includes('Russell'))
  );

  // Fallback to any voice with the accent prefix
  if (!matchedVoice) {
    matchedVoice = voices.find((v) =>
      v.lang.toLowerCase().replace('_', '-').startsWith(targetAccent.toLowerCase())
    );
  }

  // Generic English fallback
  if (!matchedVoice) {
    matchedVoice = voices.find((v) => v.lang.startsWith('en'));
  }

  if (matchedVoice) {
    utterance.voice = matchedVoice;
  }

  window.speechSynthesis.speak(utterance);
}

export const playNativeSpeech = speakWord;

/**
 * Async version of speakWord that resolves when speech completes or errors
 */
export function speakWordAsync(
  text: string,
  rate: number = 0.9,
  accentOverride?: EnglishAccent
): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      console.warn('Web Speech API is not supported in this browser.');
      resolve();
      return;
    }

    window.speechSynthesis.cancel();

    const cleanText = text.replace(/[\/\(\)\[\]]/g, '').trim();
    if (!cleanText) {
      resolve();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = rate;

    const targetAccent = accentOverride || getGlobalAccent();
    utterance.lang = targetAccent;

    const voices = window.speechSynthesis.getVoices();
    let matchedVoice = voices.find(
      (v) =>
        v.lang.toLowerCase().replace('_', '-').startsWith(targetAccent.toLowerCase()) &&
        (v.name.includes('Natural') ||
          v.name.includes('Google') ||
          v.name.includes('Neural') ||
          v.name.includes('Premium') ||
          v.name.includes('Daniel') ||
          v.name.includes('George') ||
          v.name.includes('Arthur') ||
          v.name.includes('Oliver') ||
          v.name.includes('Samantha') ||
          v.name.includes('Karen') ||
          v.name.includes('Catherine') ||
          v.name.includes('Russell'))
    );

    if (!matchedVoice) {
      matchedVoice = voices.find((v) =>
        v.lang.toLowerCase().replace('_', '-').startsWith(targetAccent.toLowerCase())
      );
    }
    if (!matchedVoice) {
      matchedVoice = voices.find((v) => v.lang.startsWith('en'));
    }

    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }

    utterance.onend = () => {
      resolve();
    };

    utterance.onerror = () => {
      resolve();
    };

    // Safety timeout in case onend never triggers in some browsers
    const estTimeMs = Math.max(2000, (cleanText.split(/\s+/).length / (rate * 2.5)) * 1000 + 1000);
    const timeoutId = setTimeout(() => {
      resolve();
    }, estTimeMs);

    utterance.addEventListener('end', () => clearTimeout(timeoutId));
    utterance.addEventListener('error', () => clearTimeout(timeoutId));

    window.speechSynthesis.speak(utterance);
  });
}
