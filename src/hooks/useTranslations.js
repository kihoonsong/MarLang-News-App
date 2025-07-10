import { useData } from '../contexts/DataContext';
import { getTranslations } from '../translations';

export const useTranslations = () => {
  const { userSettings } = useData();
  const currentLanguage = userSettings?.language || 'en';
  const translations = getTranslations(currentLanguage);
  
  return {
    t: translations,
    currentLanguage
  };
};