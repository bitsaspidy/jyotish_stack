'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { LANGS } from '../lib/i18nDicts';

const VALID = new Set(LANGS.map((l) => l.code));

export const LangContext = createContext({ lang: 'en', setLang: () => {}, toggleLang: () => {}, langs: LANGS });

export const LangProvider = ({ children }) => {
  const [lang, setLangState] = useState('en');
  useEffect(() => {
    const saved = localStorage.getItem('lang');
    if (saved && VALID.has(saved)) setLangState(saved);
  }, []);

  const setLang = (code) => {
    if (!VALID.has(code)) return;
    setLangState(code);
    localStorage.setItem('lang', code);
  };

  // Backward-compatible EN↔HI toggle (existing callers)
  const toggleLang = () => setLang(lang === 'en' ? 'hi' : 'en');

  return (
    <LangContext.Provider value={{ lang, setLang, toggleLang, langs: LANGS }}>
      {children}
    </LangContext.Provider>
  );
};

export const useLang = () => useContext(LangContext);
