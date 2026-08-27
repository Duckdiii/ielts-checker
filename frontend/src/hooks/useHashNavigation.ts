import { useState, useEffect, useCallback } from 'react';

export type AppViewTab =
  | 'dashboard'
  | 'vocab-hub'
  | 'speaking-hub'
  | 'flashcard'
  | 'quiz'
  | 'spelling'
  | 'word-family'
  | 'cloze'
  | 'timed-drill'
  | 'ai-booster'
  | 'speaking'
  | 'speaking-part2'
  | 'shadowing'
  | 'quick-speaking-drill'
  | 'speaking-portfolio'
  | 'weakness-radar'
  | 'full-mock-test'
  | 'area-expander'
  | 'emergency-stalling'
  | 'speech-ladder'
  | 'speech-upgrade'
  | 'idea-mindmap'
  | 'daily-chat'
  | 'writing'
  | 'list'
  | 'progress';

const VALID_TABS: Record<string, AppViewTab> = {
  dashboard: 'dashboard',
  'vocab-hub': 'vocab-hub',
  'speaking-hub': 'speaking-hub',
  flashcard: 'flashcard',
  quiz: 'quiz',
  spelling: 'spelling',
  'word-family': 'word-family',
  cloze: 'cloze',
  'timed-drill': 'timed-drill',
  'ai-booster': 'ai-booster',
  speaking: 'speaking',
  'speaking-part2': 'speaking-part2',
  shadowing: 'shadowing',
  'quick-speaking-drill': 'quick-speaking-drill',
  'speaking-portfolio': 'speaking-portfolio',
  'weakness-radar': 'weakness-radar',
  'full-mock-test': 'full-mock-test',
  'area-expander': 'area-expander',
  'emergency-stalling': 'emergency-stalling',
  'speech-ladder': 'speech-ladder',
  'speech-upgrade': 'speech-upgrade',
  'idea-mindmap': 'idea-mindmap',
  'daily-chat': 'daily-chat',
  writing: 'writing',
  list: 'list',
  progress: 'progress',
};

function getTabFromHash(): AppViewTab {
  if (typeof window === 'undefined') return 'dashboard';
  const hash = window.location.hash.replace(/^#\/?/, '').trim().toLowerCase();
  return VALID_TABS[hash] || 'dashboard';
}

/**
 * Custom hook for lightweight hash-based navigation with browser Back/Forward support
 */
export function useHashNavigation(defaultTab: AppViewTab = 'dashboard') {
  const [activeTab, setActiveTabState] = useState<AppViewTab>(() => {
    return getTabFromHash() || defaultTab;
  });

  // Listen to browser Back/Forward buttons via popstate & hashchange
  useEffect(() => {
    const handleHashChange = () => {
      const currentTab = getTabFromHash();
      setActiveTabState(currentTab);
    };

    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('popstate', handleHashChange);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('popstate', handleHashChange);
    };
  }, []);

  const navigateToTab = useCallback((newTab: AppViewTab, replace: boolean = false) => {
    setActiveTabState(newTab);
    const targetHash = `#/${newTab}`;
    if (window.location.hash !== targetHash) {
      if (replace) {
        window.history.replaceState(null, '', targetHash);
      } else {
        window.history.pushState(null, '', targetHash);
      }
    }
  }, []);

  return {
    activeTab,
    setActiveTab: navigateToTab,
  };
}
