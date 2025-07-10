import { translations as en } from './en.js';
import { translations as ko } from './ko.js';
import { translations as ja } from './ja.js';

export const allTranslations = {
  en,
  ko,
  ja
};

export const getTranslations = (language = 'en') => {
  return allTranslations[language] || allTranslations.en;
};