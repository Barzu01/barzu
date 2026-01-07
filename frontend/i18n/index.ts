import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ru from './locales/ru.json';
import tg from './locales/tg.json';

i18n
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v3',
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

export default i18n;