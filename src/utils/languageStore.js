import { create } from 'zustand';

/**
 * Language store to manage global language state across the app.
 * Mapping:
 * - 'en' -> English
 * - 'hi' -> Hindi
 * - 'mr' -> Marathi
 */

const LANGUAGE_MAP = {
  en: 'English',
  hi: 'Hindi',
  mr: 'Marathi',
};

export const useLanguageStore = create((set) => ({
  languageCode: 'en',
  languageLabel: 'English',
  setLanguage: (code) => set({ 
    languageCode: code, 
    languageLabel: LANGUAGE_MAP[code] || 'English' 
  }),
}));
