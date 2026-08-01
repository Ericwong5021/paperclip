import type { Resource } from "i18next";

import { coreLocaleMessages } from "./core-messages";
import { assertValidLocaleMessages } from "./locale-validation";

export const DEFAULT_LOCALE = "en" as const;
export const LOCALE_STORAGE_KEY = "paperclip.locale";

const localeModules = import.meta.glob("./locales/*.json", {
  eager: true,
  import: "default",
}) as Record<string, unknown>;

const featureMessageModules = import.meta.glob("./*-messages.ts", {
  eager: true,
}) as Record<string, Record<string, unknown>>;

function isMessageTree(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function mergeMessageTrees(...trees: unknown[]): Record<string, unknown> {
  const merged: Record<string, unknown> = {};
  for (const tree of trees) {
    if (!isMessageTree(tree)) continue;
    for (const [key, value] of Object.entries(tree)) {
      if (isMessageTree(value) && isMessageTree(merged[key])) {
        merged[key] = mergeMessageTrees(merged[key], value);
      } else {
        merged[key] = value;
      }
    }
  }
  return merged;
}

const featureMessagesByLocale = Object.values(featureMessageModules).reduce<Record<string, Record<string, unknown>>>(
  (locales, module) => {
    const messages = Object.values(module).find(
      (value) => isMessageTree(value) && isMessageTree(value.en) && isMessageTree(value["zh-CN"]),
    );
    if (!isMessageTree(messages)) return locales;
    for (const [locale, localeMessages] of Object.entries(messages)) {
      locales[locale] = mergeMessageTrees(locales[locale], localeMessages);
    }
    return locales;
  },
  {},
);

export const localeMessages = Object.fromEntries(
  Object.entries(localeModules).map(([path, messages]) => {
    const locale = path.match(/\/([A-Za-z0-9_-]+)\.json$/)?.[1];
    if (!locale) {
      throw new Error(`Invalid locale file path: ${path}`);
    }
    return [locale, messages];
  }),
);

if (!(DEFAULT_LOCALE in localeMessages)) {
  throw new Error(`Missing default locale messages for ${DEFAULT_LOCALE}`);
}

for (const [locale, messages] of Object.entries(localeMessages)) {
  try {
    assertValidLocaleMessages(messages);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Invalid ${locale} locale messages: ${message}`);
  }
}

export const LOCALE_OPTIONS = [
  { value: "en", label: "English" },
  { value: "zh-CN", label: "简体中文" },
] as const;

export type SupportedLocale = (typeof LOCALE_OPTIONS)[number]["value"];

export const supportedLocales: SupportedLocale[] = LOCALE_OPTIONS
  .map((option) => option.value)
  .filter((locale) => locale in localeMessages);

function isSupportedLocale(locale: string): locale is SupportedLocale {
  return supportedLocales.some((supportedLocale) => supportedLocale === locale);
}

export function resolveInitialLocale(): SupportedLocale {
  try {
    const storedLocale = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    if (storedLocale && isSupportedLocale(storedLocale)) return storedLocale;
  } catch {
  }

  const languageCandidates = typeof navigator === "undefined"
    ? []
    : navigator.languages?.length
      ? navigator.languages
      : [navigator.language];
  const languages = languageCandidates.filter(Boolean);
  const exactLocale = languages.find((locale) => locale === "en" || locale === "zh-CN");
  if (exactLocale) return exactLocale;

  const chineseLocale = languages.find((locale) => locale.toLowerCase().startsWith("zh-"));
  if (chineseLocale && isSupportedLocale("zh-CN")) return "zh-CN";
  return DEFAULT_LOCALE;
}

export const i18nextResources: Resource = Object.fromEntries(
  Object.entries(localeMessages).map(([locale, messages]) => [
    locale,
    {
      translation: {
        ...mergeMessageTrees(
          coreLocaleMessages.en,
          coreLocaleMessages[locale as keyof typeof coreLocaleMessages] ?? {},
          featureMessagesByLocale.en,
          featureMessagesByLocale[locale],
          messages,
        ),
      },
    },
  ]),
) as Resource;
