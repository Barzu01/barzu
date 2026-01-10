import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ru from './locales/ru.json';
import tg from './locales/tg.json';

const LANGUAGE_KEY = 'user_language';

// Load saved language
const loadLanguage = async () => {
  try {
    const savedLang = await AsyncStorage.getItem(LANGUAGE_KEY);
    if (savedLang && (savedLang === 'ru' || savedLang === 'tg')) {
      i18n.changeLanguage(savedLang);
    }
  } catch (error) {
    console.error('Error loading language:', error);
  }
};

i18n
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v4',
    lng: 'ru',
    fallbackLng: 'ru',
    resources: {
      ru: { translation: ru },
      tg: { translation: tg },
    },
    interpolation: {
      escapeValue: false,
    },
  });

// Load saved language on startup
loadLanguage();

// Save language when it changes
i18n.on('languageChanged', async (lng) => {
  try {
    await AsyncStorage.setItem(LANGUAGE_KEY, lng);
  } catch (error) {
    console.error('Error saving language:', error);
  }
});

export default i18n;