import i18n from 'i18next';
import { initReactI18next, useTranslation } from 'react-i18next';
import { getLocales } from 'expo-localization';

import { en } from './locales/en';
import { ptBR } from './locales/pt-BR';

export type Language = 'pt-BR' | 'en';

/** Portuguese is the primary language; English is used only when the device asks for it. */
export function detectLanguage(languageCode: string | null | undefined): Language {
  return languageCode === 'en' ? 'en' : 'pt-BR';
}

// The default export is i18next's intended singleton; `use` is a method there, not the React hook.
// eslint-disable-next-line import/no-named-as-default-member
void i18n.use(initReactI18next).init({
  resources: { 'pt-BR': { translation: ptBR }, en: { translation: en } },
  lng: detectLanguage(getLocales()[0]?.languageCode),
  fallbackLng: 'pt-BR',
  interpolation: { escapeValue: false },
  initAsync: false,
});

export { i18n, useTranslation };

export function currentLocale(): Language {
  return i18n.language === 'en' ? 'en' : 'pt-BR';
}
