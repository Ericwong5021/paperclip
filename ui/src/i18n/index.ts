import i18n, { type InitOptions, type TOptions } from "i18next";
import { initReactI18next, useTranslation as useReactI18nextTranslation } from "react-i18next";

import {
  DEFAULT_LOCALE,
  i18nextResources,
  LOCALE_STORAGE_KEY,
  resolveInitialLocale,
  supportedLocales,
  type SupportedLocale,
} from "./locales";

const i18nextOptions: InitOptions = {
  resources: i18nextResources,
  lng: resolveInitialLocale(),
  fallbackLng: DEFAULT_LOCALE,
  supportedLngs: supportedLocales,
  defaultNS: "translation",
  interpolation: { escapeValue: false },
  returnObjects: false,
  initAsync: false,
};

void i18n.use(initReactI18next).init(i18nextOptions).catch((error: unknown) => {
  console.error("Failed to initialize i18next", error);
});

export function t(key: string, options: TOptions = {}) {
  return i18n.t(key, options);
}

export function getLocale(): SupportedLocale {
  const currentLocale = i18n.resolvedLanguage ?? i18n.language;
  return supportedLocales.some((locale) => locale === currentLocale)
    ? currentLocale as SupportedLocale
    : DEFAULT_LOCALE;
}

export function setLocale(locale: SupportedLocale) {
  if (!supportedLocales.includes(locale)) return;
  try {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
  }
  void i18n.changeLanguage(locale);
}

export const useTranslation = useReactI18nextTranslation;
export { i18n };
export { LOCALE_OPTIONS, supportedLocales, type SupportedLocale } from "./locales";
