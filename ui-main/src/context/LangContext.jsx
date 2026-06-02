'use client';
import { createContext, useContext, useState, useEffect } from 'react';

export const LangContext = createContext({ lang: 'en', toggleLang: () => {} });

export const LangProvider = ({ children }) => {
  const [lang, setLang] = useState('en');
  useEffect(() => { setLang(localStorage.getItem('lang') || 'en'); }, []);
  const toggleLang = () => {
    const next = lang === 'en' ? 'hi' : 'en';
    setLang(next);
    localStorage.setItem('lang', next);
  };
  return <LangContext.Provider value={{ lang, toggleLang }}>{children}</LangContext.Provider>;
};

export const useLang = () => useContext(LangContext);
