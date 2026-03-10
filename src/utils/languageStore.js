import { create } from 'zustand';
import { translations } from './translations';

/**
 * Language store to manage global language state across the app.
 */

const LANGUAGE_MAP = {
  en: 'English',
  hi: 'Hindi',
  mr: 'Marathi',
};

export const useLanguageStore = create((set, get) => ({
  languageCode: 'en',
  languageLabel: 'English',
  setLanguage: (code) => set({ 
    languageCode: code, 
    languageLabel: LANGUAGE_MAP[code] || 'English' 
  }),
  t: (key) => {
    const { languageCode } = get();
    return translations[languageCode]?.[key] || translations['en'][key] || key;
  },
}));
